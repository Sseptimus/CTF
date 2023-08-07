
var map;
var coord;
var video_on = false;
var video = document.querySelector("video");
var vetoed = false;
var currentChallenge = 0
var marker = undefined;
var screenLock = null;

var myIcon = L.divIcon({ className: "my-div-icon"});
var url = "http://127.0.0.1:8000/";
var player_name = "ollie";
var team = 1;
// random number
var id = Math.floor(Math.random() * 1000000000);
if (getCookie("id") != null) {
  id = getCookie("id");
}

if (getCookie("url") != null) {
  url = getCookie("url");
}

setCookie("url", url, 365);

setCookie("id", id, 365);

if (getCookie("name") != null) {
  player_name = getCookie("name");
}

setCookie("name", player_name, 365);


var password = "";

if (getCookie("password") != null) {
  password = getCookie("password");
  
}


var people = {}

function send_server_data() {
  // send data to server
  var data = {team: team, coord: coord};
  xhr = new XMLHttpRequest();
  xhr.open("POST", url + "set_data?player_id=" + id, true);
  xhr.setRequestHeader("Content-Type", "application/json");

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      // Print received data from server
      console.log(this.responseText);
    }
  };

  // Converting JSON data to string
  var data = JSON.stringify({ player_name: { coord: coord, team: team } });
  data = data.replace("name", player_name);
  console.log(data);

  // Sending data with the request
  xhr.send(data);

}


<<<<<<< Updated upstream
function get_server_data(json) {  
  xhr = new XMLHttpRequest();
  xhr.open("GET", url + "get_all", true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4 && xhr.status == 200) {
      json = JSON.parse(xhr.responseText);
    } else {
      console.log("error");
      console.log(xhr);
    }
  };
  xhr.send();

  json = JSON.parse(
    '{"nick":{"coord":[-36.8,174.747], "team":1, "connected":true},"seb":{"coord":[-36.5,174.447], "team":2, "connected":false}}'
  );
function get_server_data(json) {
=======
function get_server_data() {
>>>>>>> Stashed changes

  
  

  console.log(json);
  // add json to people 
  for (i in json) {
    if (typeof people[i] == "undefined") {
      people[i] = {};
    }
    people[i]['coord'] = json[i]['coord'];
    if (typeof people[i]['marker'] == "undefined") {
      let className = "div-icon";
      className += " team-"+json[i]['team'];
      if (json[i]['connected'] == false) {
        className += " disconnected";
      }
      people[i]['marker'] = L.marker(people[i]['coord'], {icon:L.divIcon({ className: className})}).addTo(map);
      people[i]['marker'].set
    }
  }

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
  return (`wakeLock` in navigator);
}

function release() { 
  if(typeof screenLock !== "undefined" && screenLock != null) {
    screenLock.release()
    .then(() => {
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
    document.getElementById("team").value = team;
    document.getElementById("password").value = password;

    map = L.map("map").setView([51.505, -0.09], 1);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap",
    }).addTo(map);
    if (marker == undefined) {
      marker = L.marker(get_coord(), {icon: L.divIcon({ className: "div-icon"})}).addTo(map);
      map.setView(get_coord(), 1.8);
    }
    marker.riseOnHover = true;
    coord = get_coord();
    function onMapClick(e) {
    // alert("You clicked the map at " + e.latlng);
}
map.on("click", onMapClick);
var intervalId = window.setInterval(function () {


        send_server_data();

        if (document.getElementById("lock").style.display != 'none') {
            return;
        }

        // get_server_data();


        for (i in people) {
          // if (typeof people[i].marker == "undefined") {
          //   console.log("marker undefined", people[i]['coord']);
          //   people[i]['marker'] = L.marker(people[i]['coord']).addTo(map);
          // }
          people[i]['marker'].setLatLng(people[i]['coord']);
          people[i]['marker'].bindTooltip(i).openTooltip();
        }




        old_coord = coord;
        coord = get_coord();
        if ((old_coord == undefined) && coord!=old_coord) {
            map.setView(coord, 13);
            marker.setLatLng(coord);
            marker.bindTooltip("You").openTooltip();
        }

        speed = (map.distance(L.latLng(old_coord[0],old_coord[1]), L.latLng(coord[0],coord[1]))/(Date.now()-now))*3.6*0.001;
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
    
    
    }, 5000);
    video = document.querySelector("video");
    
};
var uLat = 51.505;
var uLon = -0.09;

function get_coord() {
     
        // get users lat/long
        
        var getPosition = {
          enableHighAccuracy: true,
          timeout: 9000,
          maximumAge: 0
        };
        
        function success(gotPosition) {
            uLat = gotPosition.coords.latitude;
            uLon = gotPosition.coords.longitude;
        
        };
        
        function error(err) {
          console.warn(`ERROR(${err.code}): ${err.message}`);
        };

        navigator.geolocation.getCurrentPosition(success, error, getPosition);

        return [uLat, uLon];
    }




function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

var constraints = { audio: false, video: true };

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