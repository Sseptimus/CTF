
var map;
var coord;
var video_on = false;
var video = document.querySelector("video");
var vetoed = false;
var currentChallenge = 0;
var marker = undefined;
var screenLock = null;

var team_rad_points = {};


var radius = 0;

// becomes marker
var flag = undefined;

var myIcon = L.divIcon({ className: "my-div-icon" });
var url = "http://127.0.0.1:8100";
var player_name = "ollie";
var team = 1;
var polygon = undefined;

// is player ready to start game
var ready = false;

// are all players ready to start game
var started = false;

// use id of person with flag to id flag
var carrying_flag_user_id = null;
var tagged = false;

var flag_pos = [0, 0];

var password = "";
var myId = Math.floor(Math.random() * 1000000000);

function coord_to_string(coord2) {

  if (coord2[0]==undefined) {
    coord2 = [coord2.lng, coord2.lat];
  }
  return coord2[0] + "," + coord2[1];
}
function string_to_coord(coord) {
  ret = coord.split(",").map(parseFloat);
  console.log(ret);
  if (isNaN(ret[0]) || isNaN(ret[1])) {
    console.log("NaN in ret");
    return [0, 0];
  }
  return ret
}

function get_cookies() {
  if (getCookie("password") != null) {
    password = getCookie("password");
  }

  if (getCookie("flag_pos") != null) {
    flag_pos = getCookie("flag_pos").split(",");
    for (i in flag_pos) {
      flag_pos[i] = parseFloat(flag_pos[i]);
    }
  }

  if (getCookie("id") != null) {
    myId = getCookie("id");
  }

  if (getCookie("url") != null) {
    url = getCookie("url");
  }

  if (getCookie("name") != null) {
    player_name = getCookie("name");
  }

  if (getCookie("team") != null) {
    team = getCookie("team");
  }

  if (getCookie("coord") != null) {
    coord = string_to_coord( getCookie("coord"));
  }
  if (getCookie("flag_pos") != null) {

    flag_pos = L.latLng( string_to_coord( getCookie("flag_pos")));
  }
  if (getCookie("started") != null) {
    started = getCookie("started");
  }
  if (getCookie("ready") != null) {
    ready = getCookie("ready");
  }

}


function save_cookies() {
  setCookie("flag_pos", flag_pos, 365);
  setCookie("url", url, 365);
  setCookie("id", myId, 365);
  setCookie("name", player_name, 365);
  setCookie("team", team, 365);
  setCookie("coord", coord_to_string(coord), 365);
  setCookie("started", started, 365);
  setCookie("ready", ready, 365);
  setCookie("password", password, 365);
  setCookie("flag_pos", coord_to_string(flag_pos), 365);
}

get_cookies();
save_cookies();




var bounds = {
  outer: [
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
  ],
  inner: [
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
  ],
  teams: {},
};

var people = {};

function tag_player(url, name) {
  document.getElementById("popup_player_selector").style.display = "none";
}

function takePhoto() {
  url = get_url();
  video_on = false;
  document.getElementById("photo").style.display = "none";
  document.getElementById("popup_player_selector").style.display = "flex";
  stopWebCam();
  document.getElementById("photo_display").src = url;
  names = document.getElementById("names");
  names.innerHTML = "";
  for (i in people) {
    button = document.createElement("button");
    button.className = "player_button team-" + people[i]["team"] + "";
    button.innerText = i;
    names.appendChild(button);
    button.onclick = "tag_player(" + url + ", i)";
  }
}

// returns list of other players sorted by distance from current position
function get_sorted_by_distance() {
  for (i in people) {
    people[i]["distance"] = map.distance(coord, people[i]["coord"]);
  }
  return Object.keys(people).sort(function (a, b) {
    return people[a]["distance"] - people[b]["distance"];
  });
}

function send_server_data() {
  // send data to server
  xhr = new XMLHttpRequest();
  xhr.open("POST", url + "/set_data?player_id=" + myId, true);
  xhr.setRequestHeader("Content-Type", "application/json");

  xhr.onreadystatechange = function () {
    processXhrError(xhr);
  };

  // Converting JSON data to string
  var data = JSON.stringify({
    coord: coord,
    team: team,
    flag_pos,
    ready: ready,
    name: player_name,
    connected: true,
    tagged: false,
    carrying_flag: carrying_flag_user_id,
    tagged: tagged,
    password: getPasswordFromCookie(),
  });

  // Sending data with the request
  xhr.send(data);
}

function getPasswordFromCookie() {
  if (getCookie("password") != null) {
    password = getCookie("password");
  }
  return password;
}

// sets text and color of popup in bottom right
function setServerStatus(status, color) {
  const element = document.getElementById("server_status");
  element.innerText = status;
  element.style.color = color;
}

// updates server text based on server status
function processXhrError(xhr) {
  if (xhr.readyState == 4 && xhr.status == 200) {
    setServerStatus("Connected", "green");
  } else if (xhr.readyState == 4 && xhr.status == 0) {
    setServerStatus("Server not found", "red");
  } else if (xhr.status == 401) {
    setServerStatus("Wrong password", "red");
  } else if (xhr.status == 404) {
    setServerStatus("Server not found", "red");
  } else {
    setServerStatus("Server error", "red");
  }
}

function makePlayerIcons(player) {
  if (typeof player["marker"] == "undefined") {
    let className = "div-icon";
    className += " team-" + player["team"];

    if (player["connected"] == false) {
      className += " disconnected";
    }

    if (player["carrying_flag"] != null) {
      className += " carrying-flag-" + players[player["carrying_flag"]]["team"] + "";

    }

    if (player["tagged"] == true) {
      className += " tagged";
    }

    player["marker"] = L.marker(player["coord"], {
      icon: L.divIcon({ className: className }),
    }).addTo(map);

    player["marker"].bindTooltip(player["name"]).openTooltip();
  } else {
    player["marker"].setLatLng(player["coord"]);

    if (!player["marker"].isTooltipOpen()) {
      player["marker"].openTooltip();
    }
  }

  if (typeof player["flag_marker"] == "undefined") {
    player["flag_marker"] = L.marker(player["flag_pos"], {
      icon: L.divIcon({
        className: "enemy-flag flag-icon team-" + player["team"],
      }),
    }).addTo(map);
    // player["flag_marker"].bindTooltip(player["name"] + "'s flag").openTooltip();
    player["flag_marker"].setOpacity(0.0);
  } else {
    player["flag_marker"].setLatLng(player["flag_pos"]);

    // if (!player["flag_marker"].isTooltipOpen()) {
    //   player["flag_marker"].openTooltip();
    // }
  }
}

function validatePlayerJson(json) {
  REQUIRES_KEYS = [
    "coord",
    "flag_pos",
    "name",
    "team",
    "ready",
    "connected",
    "tagged",
    "carrying_flag",
  ];

  for (key in REQUIRES_KEYS) {
    // perhaps add default values for each probity?
    if (typeof json[REQUIRES_KEYS[key]] == "undefined") {
      return false;
    }
  }

  return true;
}

// gets data from server and applies it, not returns it
function getServerData() {
  xhr = new XMLHttpRequest();
  xhr.open("GET", url + "/get_all", true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.setRequestHeader("password", getPasswordFromCookie());

  xhr.onreadystatechange = function () {
    processXhrError(xhr);
    if (xhr.readyState == 4 && xhr.status == 200) {
      try {
        json = JSON.parse(xhr.responseText);
      } catch (e) {
        console.log("Error parsing json", e);
        split = xhr.responseText.split("}}");
        json = JSON.parse(split[0] + "}}");
        console.log(split[1]);
        return;
      }

      // add json to people
      for (playerId in json) {
        if (!validatePlayerJson(json[playerId])) {
          continue;
        }

        if (playerId == myId) continue;

        if (typeof people[playerId] == "undefined") {
          people[playerId] = {};
        }

        people[playerId]["coord"] = json[playerId]["coord"];
        people[playerId]["flag_pos"] = json[playerId]["flag_pos"];
        people[playerId]["name"] = json[playerId]["name"];
        people[playerId]["team"] = json[playerId]["team"];
        people[playerId]["ready"] = json[playerId]["ready"];
        people[playerId]["connected"] = json[playerId]["connected"];

        makePlayerIcons(people[playerId]);
      }
    }
  };

  xhr.send();
}

function setCookie(name, value, days) {
  var expires = "";
  if (days) {
    var date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}
function getCookie(name) {
  var nameEQ = name + "=";
  var ca = document.cookie.split(";");
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

// prevents screen from turning off
async function getScreenLock() {
  if (isScreenLockSupported()) {
    try {
      screenLock = await navigator.wakeLock.request("screen");
    } catch (err) {
      console.log(err.name, err.message);
    }
  }
}

function isScreenLockSupported() {
  return `wakeLock` in navigator;
}

function release() {
  if (typeof screenLock !== "undefined" && screenLock != null) {
    screenLock.release().then(() => {
      console.log("Lock released 🎈");
      screenLock = null;
    });
  }
}

document.addEventListener("visibilitychange", async () => {
  if (screenLock !== null && document.visibilityState === "visible") {
    screenLock = await navigator.wakeLock.request("screen");
  }
});

var now = Date.now();

onload = function () {
  lock = document.getElementById("lock");
  lock.style.display = "none";

  document.getElementById("name").value = player_name;
  document.getElementById("password").value = password;

  map = L.map("map").setView([51.505, -0.09], 1);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap",
  }).addTo(map);
  if (marker == undefined) {
    marker = L.marker(get_coord(), {
      icon: L.divIcon({ className: "player div-icon" + " team-" + team }),
    }).addTo(map);
    map.setView(get_coord(), 1.8);
  }
  marker.riseOnHover = true;
  coord = get_coord();

  flag = L.marker([51.505, -0.09], {
    icon: L.divIcon({
      className: "flag-icon",
      draggable: true,
      zIndexOffset: 9999999,
      // autoPan: true
    }),
  }).addTo(map);
  flag.dragging.enable();

  flag.on("dragend", function (e) {
    flag_pos = flag.getLatLng();
    flag_pos = [flag_pos.lat, flag_pos.lng];
    get_bounds();
  });

  var team_polygons = {};

  polygon = L.polygon([
    [0, 0],
    [0, 0],
    [0, 0],
  ]).addTo(map);

  var intervalId = window.setInterval(function () {
    send_server_data();

    if (document.getElementById("lock").style.display != "none") {
      return;
    }

    getServerData();

    carried_flags = {};
    
    for (i in people) {
        if (people[i].carrying_flag != null) {
          carried_flags[people[i].carrying_flag] = i;

        }
    };

    for (i in people) {
      if (people[i].team != team) {
        if (map.distance(L.latLng(coord), people[i].flag_pos) < 300) {
          carrying_flag_user_id = i;
        }
      }
      if (i in Object.keys(carried_flags)) {
        people[i].flag_marker.setLatLng(people[i].coord);
        people[i].flag_marker.setOpacity(0);

      }else {
        people[i].flag_marker.setOpacity(1);

      }
      
    }

    old_coord = coord;
    coord = get_coord();
    if (old_coord == undefined && coord != old_coord) {
      map.setView(coord, 13);
      marker.setLatLng(coord);
      marker.bindTooltip("You").openTooltip();
    }

    if (!ready) {
      flag.bindTooltip("Your Flag").openTooltip();
      bounds = get_bounds();
    }

    if (ready) {
      all_ready = false;
      for (i in people) {
        console.log(people[i]["ready"]);

        if (!people[i]["ready"]) {
          all_ready = false;
          break;
        }
        all_ready = true;
      }
      if (all_ready) {
        startGame();
      }
    }

    // if (bounds.outer.length > 3) {
    // polygon.setLatLngs(bounds.outer);
    // }

    for (i in bounds.teams) {

      color = ["red", "blue", "#30eb30", "#de3bde", "#57f2c1", "#ffed49"][
        bounds.teams[i].team - 1
      ];
      if (typeof team_polygons[i] == "undefined") {
        team_polygons[i] = L.polygon(
          [
            [0, 0],
            [0, 0],
            [0, 0],
          ],
          { color: color, opacity: 0.5 }
        ).addTo(map);
      }
      team_polygons[i].setStyle({ color: color });
      team_polygons[i].setLatLngs(bounds.teams[i].polygon);
    }

    speed =
      (map.distance(
        L.latLng(old_coord[0], old_coord[1]),
        L.latLng(coord[0], coord[1])
      ) /
        (Date.now() - now)) *
      3.6 *
      0.001;
    now = Date.now();

    if (speed > 300) {
      speed = 0;
      if (coord != [51.505, -0.09]) {
        map.setView(coord, 13);
      }
    }
    speed = Math.round(speed * 10) / 10;
    marker.setLatLng(coord);
    marker.bindTooltip("You").openTooltip();
    marker.setIcon(
      L.divIcon({ className: "player div-icon" + " team-" + team })
    );
    save_cookies();

  }, 5000);
  video = document.querySelector("video");
};
var uLat = 51.505;
var uLon = -0.09;

// 0 == netural/center
// -1 == out of bounds

function what_team_area_is_point_in(point) {
  if (typeof point != "latLng") {
    point = L.latLng(point);
  }
  if (map.distance(point, center_location) < radius / 10) {
    return 0;
  }
  if (map.distance(point, center_location) > radius) {
    return -1;
  }
  closest = 0;
  dist = 999999999999;
  for (i in team_rad_points) {    
    if (map.distance(point, team_rad_points[i]) < dist) {
      dist = map.distance(point, team_rad_points[i]);
      closest = i;
    }
  }
  return parseInt(closest);
}

function get_coord() {
  // get users lat/long

  var getPosition = {
    enableHighAccuracy: false,
    timeout: 9000,
    maximumAge: 0,
  };

  function success(gotPosition) {
    uLat = gotPosition.coords.latitude;
    uLon = gotPosition.coords.longitude;
  }

  function error(err) {
    console.warn(`ERROR(${err.code}): ${err.message}`);
  }

  navigator.geolocation.getCurrentPosition(success, error, getPosition);

  return [uLat, uLon];
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

function endGame() {
  ready = false;
  password = "";
  document.getElementById("ready").style.display = "block";
}

function startGame() {
  if (people.length < 2) {
    alert("Not enough players in server");
    return;
  }
  ready = true;
  document.getElementById("ready").style.display = "none";

  for (i in people) {
    opacity = 1.0;
    if (people[i]["team"] == team) {
      opacity = 0.4;
    }
    people[i]["flag_marker"].setOpacity(opacity);
  }
}

var constraints = { audio: false, video: true };

var center_location = [];

function fixList(l) {
  // return l;
  for (let i = 1; i < l.length - 1; i++) {
    if (l[i][0] - l[i + 1][0] != -1) {
      l[i - 1][0] = l[i][0];

      return l.slice(i - 1).concat(l.slice(0, i + 1));
    }
  }

  return l;
}
// gets the play area
function get_bounds() {
  average_lat = coord[0];
  average_lon = coord[1];

  teams = {};

  for (i in people) {
    average_lat += people[i]["coord"][0];
    average_lon += people[i]["coord"][1];
    if (teams[people[i]["team"]] == undefined) {
      teams[people[i]["team"]] = { coords: [people[i]["coord"]] };
    } else {
      teams[people[i]["team"]]["coords"].push(people[i]["coord"]);
    }
  }

  if (teams[team] == undefined) {
    teams[team] = { team: team, coords: [coord] };
  } else {
    teams[team]["coords"].push(coord);
  }

  for (t in teams) {
    average_lat2 = 0;
    average_lon2 = 0;
    for (c in teams[t]["coords"]) {
      average_lat2 += teams[t]["coords"][c][0];
      average_lon2 += teams[t]["coords"][c][1];
    }
    average_lat2 /= teams[t]["coords"].length;
    average_lon2 /= teams[t]["coords"].length;
    teams[t]["center"] = [average_lat2, average_lon2];
  }

  if (Object.keys(people).length == 0) {
    average_lat = coord[0];
    average_lon = coord[1];
  } else {
    average_lat /= Object.keys(people).length + 1;
    average_lon /= Object.keys(people).length + 1;
  }

  center_location = [average_lat, average_lon];

  var max_distance = 0;

  for (i in people) {
    distance = map.distance(
      L.latLng(average_lat, average_lon),
      L.latLng(people[i]["coord"][0], people[i]["coord"][1])
    );
    if (distance > max_distance) {
      max_distance = distance;
    }
  }

  max_distance += 3000;

  max_distance = Math.max(max_distance, 5000);

  radius = max_distance;
  if (
    what_team_area_is_point_in(flag_pos) != team && team_rad_points[team] != undefined) {
    for (i = 0; i < 80; i++) {
      if (
    what_team_area_is_point_in(flag_pos) == team) {
      break;
    }
    
      x = (coord[0]+team_rad_points[team].lat)/2 - flag_pos[0];
      y = (coord[1] + team_rad_points[team].lng) / 2 - flag_pos[1];

      flag_pos[0] += x / 7;
      flag_pos[1] += y / 7;

      flag.setLatLng(flag_pos);
    }
  }

  var numberOfPoints = 40;

  var radiusLon =
    (1 / (111.319 * Math.cos(average_lat * (Math.PI / 180)))) *
    (max_distance / 1000);
  var radiusLat = (1 / 110.574) * (max_distance / 1000);

  var dTheta = (2 * Math.PI) / numberOfPoints;


  team_number_list = Object.keys(teams);
  team_number_list.sort();
  if (team_number_list.length == 1) {
    teamTheta = 0;
  }

  theta = 0;


  var points = [];
  var mini_points = [];

  for (var i = 0; i <= numberOfPoints; i++) {
    point = L.latLng(
      average_lat + radiusLat * Math.sin(theta),
      average_lon + radiusLon * Math.cos(theta)
    );



    point_mini = L.latLng(
      average_lat + (radiusLat / 10) * Math.sin(theta),
      average_lon + (radiusLon / 10) * Math.cos(theta)
    );
    mini_points.push(point_mini);
    points.push(point);


    theta += dTheta;
  }

  

  start = team_number_list[0];
  t = 0;
  tm = team_number_list[t];

  team_points = {};
  team_mini_points = {};

  c=0;


  for (tem in teams) {
    team_points[tem] = [];
    team_mini_points[tem] = [];
  }
  team_rad_points = {};
  for (var a = 0; a <= numberOfPoints; a++) {
    
    c += 1;
    if (c > numberOfPoints / (team_number_list.length)) {
      team_points[tm].push([c, points[a % numberOfPoints]]);
      team_mini_points[tm].push([c, mini_points[a % numberOfPoints]]);
      t += 1;
      t=Math.min(t, team_number_list.length-1);
      c = 0;
      tm = team_number_list[t];
    }
    
    if (c == Math.round(numberOfPoints / (team_number_list.length*2))) {
      team_rad_points[tm] = points[a];
    }
    team_points[tm].push([c, points[a % numberOfPoints]]);
    team_mini_points[tm].push([c, mini_points[a % numberOfPoints]]);
  }

  for (t in teams) {
    let fixed_points = team_points[t];
    fixed_points.sort((a, b) => a[0] - b[0]);
    fixed_points = fixed_points.map((a) => a[1]);

    let fixed_mini_points = team_mini_points[t];
    fixed_mini_points.sort((a, b) => a[0] - b[0]);
    fixed_mini_points = fixed_mini_points.map((a) => a[1]);

    teams[t]["polygon"] = [];

    for (p in fixed_points) {
      teams[t]["polygon"].push(fixed_points[p]);
    }

    for (p in fixed_mini_points) {
      teams[t]["polygon"].unshift(fixed_mini_points[p]);
    }
  }

  final_points = [];

  for (t in teams) {
    p = teams[t]["polygon"];
    p = p.filter((a) => a != undefined);
    final_points.push({ team: t, polygon: p });
  }
  return {
    inner: mini_points,
    outer: points,
    teams: final_points,
  };
}

function successCallback(stream) {
  video.srcObject = stream;
  video.play();
  var url = window.URL.createObjectURL(stream);
  cameraStream = stream;
}

function errorCallback(error) {
  console.log("navigator.getUserMedia error: ", error);
}

function startWebCam() {
  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(successCallback)
    .catch(errorCallback);
}

function get_url() {
  var canvas = document.createElement("canvas");
  canvas.height = video.videoHeight;
  canvas.width = video.videoWidth;
  var ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  console.log(canvas.toDataURL());
  return canvas.toDataURL();
}

function stopWebCam() {
  if (video) {
    const mediaStream = video.srcObject;
    const tracks = mediaStream.getTracks();
    tracks.forEach((track) => track.stop());
  }

  stream = null;
}

function show_people() {
  let min_lat = coord[0];
  let max_lat = coord[0];
  let min_lon = coord[1];
  let max_lon = coord[1];
  for (i in people) {
    if (people[i]["coord"][0] < min_lat) {
      min_lat = people[i]["coord"][0];
    }
    if (people[i]["coord"][0] > max_lat) {
      max_lat = people[i]["coord"][0];
    }
    if (people[i]["coord"][1] < min_lon) {
      min_lon = people[i]["coord"][1];
    }
    if (people[i]["coord"][1] > max_lon) {
      max_lon = people[i]["coord"][1];
    }
  }

  map.fitBounds([
    [min_lat - 0.03, min_lon - 0.03],
    [max_lat + 0.03, max_lon + 0.03],
  ]);
}
