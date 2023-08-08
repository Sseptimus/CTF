
var map;
var coord;
var video_on = false;
var video = document.querySelector("video");
var vetoed = false;
var currentChallenge = 0;
var marker = undefined;
var screenLock = null;
var flag = undefined;

var myIcon = L.divIcon({ className: "my-div-icon" });
var url = "http://127.0.0.1:8100";
var player_name = "ollie";
var team = 1;
var polygon = undefined;

var ready = false;
var started = false;



var flag_pos = [0, 0];

if (getCookie("flag_pos") != null) {
  flag_pos = getCookie("flag_pos").split(",");
  for (i in flag_pos) {
    flag_pos[i] = parseFloat(flag_pos[i]);
  }
}

setCookie("flag_pos", flag_pos, 365);

var password = "";

if (getCookie("password") != null) {
  password = getCookie("password");
}

// random number
var myId = Math.floor(Math.random() * 1000000000);
if (getCookie("id") != null) {
  myId = getCookie("id");
}

if (getCookie("url") != null) {
  url = getCookie("url");
}

setCookie("url", url, 365);

setCookie("id", myId, 365);

if (getCookie("name") != null) {
  player_name = getCookie("name");
}

setCookie("name", player_name, 365);

if (getCookie("team") != null) {
  team = getCookie("team");
}

setCookie("team", team, 365);


var bounds = [[0,0],0];

var people = {
  
};

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

function setServerStatus(status, color) {
  const element = document.getElementById("server_status");

  element.innerText = status;
  element.style.color = color;
}

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
      icon: L.divIcon({ className: "enemy-flag flag-icon team-" + player["team"] }),
    }).addTo(map);
    player["flag_marker"].bindTooltip(player["name"] + "'s flag").openTooltip();
    player["flag_marker"].setOpacity(0.0);
  } else {
    player["flag_marker"].setLatLng(player["flag_pos"]);

    if (!player["flag_marker"].isTooltipOpen()) {
      player["flag_marker"].openTooltip();
    }
  }
}

function validatePlayerJson(json) {
  REQUIRES_KEYS = ["coord", "flag_pos", "name", "team", "ready", "connected"];

  for (key in REQUIRES_KEYS) {
    if (typeof json[REQUIRES_KEYS[key]] == "undefined") {
      return false;
    }
  }

  return true;
}

function getServerData() {
  xhr = new XMLHttpRequest();
  xhr.open("GET", url + "/get_all", true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.setRequestHeader("password", getPasswordFromCookie());

  xhr.onreadystatechange = function () {
    processXhrError(xhr);
    if (xhr.readyState == 4 && xhr.status == 200) {
      json = JSON.parse(xhr.responseText);

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
      // autoPan: true
    }),
  }).addTo(map);
  flag.dragging.enable();


  flag.on("dragend", function (e) {
    flag_pos = flag.getLatLng();
    flag_pos = [flag_pos.lat, flag_pos.lng];
    get_bounds();
  });


  polygon = L.polygon([[0,0],[0,0],[0,0]]).addTo(map);

  var intervalId = window.setInterval(function () {
    send_server_data();

    if (document.getElementById("lock").style.display != "none") {
      return;
    }

    getServerData();



    old_coord = coord;
    coord = get_coord();
    if (old_coord == undefined && coord != old_coord) {
      map.setView(coord, 13);
      marker.setLatLng(coord);
      marker.bindTooltip("You").openTooltip();
    }

    if (!ready) {
      flag.bindTooltip("Your Flag").openTooltip();
      try {
      bounds = get_bounds();
      } catch (e) {
        console.log(e);
      }
    }

    if (ready) {
      all_ready = false 
      for (i in people) {
        console.log(people[i]["ready"]);
        if (!people[i]["ready"]) {

          all_ready = false;
          break;
        }
        all_ready = true;
      }
    }

    if (bounds.length > 3) {
    polygon.setLatLngs(bounds);
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
  }, 5000);
  video = document.querySelector("video");
};
var uLat = 51.505;
var uLon = -0.09;

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
  window.polygon.remove();
  L.polyline(get_bounds(), { color: "red" }).addTo(map);
  
  for (i in people) {
    opacity = 1.0;
    if (people[i]["team"] == team) {
      opacity = 0.4;
    }
    people[i]["flag_marker"].setOpacity(opacity);
  }

  map.removeLayer(flag);

  
  
}

var constraints = { audio: false, video: true };

function get_bounds() {
  average_lat = coord[0];
  average_lon = coord[1];
  for (i in people) {
    average_lat += people[i]["coord"][0];
    average_lon += people[i]["coord"][1];
  }

  if (Object.keys(people).length == 0) {
    average_lat = coord[0];
    average_lon = coord[1];
  }else {
  average_lat /= (Object.keys(people).length+1);
  average_lon /= (Object.keys(people).length+1);
  }

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

  if (map.distance(L.latLng(average_lat, average_lon), L.latLng(flag_pos)) > max_distance) {

    for (i=0; i<30; i++) {
      if (
        map.distance(L.latLng(average_lat, average_lon), L.latLng(flag_pos)) <
        max_distance
      ) {break}
        x = average_lat - flag_pos[0];
    y=average_lon-flag_pos[1];

    flag_pos[0]+=x/5;
    flag_pos[1]+=y/5;


    flag.setLatLng(flag_pos);
    }
  }

  var numberOfPoints = 30;

    var radiusLon = 1 / (111.319 * Math.cos(average_lat * (Math.PI / 180))) * (max_distance/1000);
    var radiusLat = (1 / 110.574) * (max_distance/1000);

  var dTheta = (2 * Math.PI) / numberOfPoints;


  
  theta = 0;

  var points = [];
    for (var i = 0; i < numberOfPoints; i++)
    {
        points.push(
          L.latLng(
            average_lat + radiusLat * Math.sin(theta),
            average_lon + radiusLon * Math.cos(theta)
          )
        );
        theta += dTheta;
    }

  return points;

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
  var container = document.getElementById("url_container");
  var canvas = document.createElement("canvas");
  canvas.height = video.videoHeight;
  canvas.width = video.videoWidth;
  var ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  console.log(canvas.toDataURL());
  container.textContent = canvas.toDataURL();
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
