var map;
var coord;
var video_on = false;
var video = document.querySelector("video");
var vetoed = false;
var currentChallenge = 0
var marker = undefined;
var screenLock = null;

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

    map = L.map("map").setView([51.505, -0.09], 1);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap",
    }).addTo(map);
    if (marker == undefined) {
      marker = L.marker(get_coord()).addTo(map);
      map.setView(get_coord(), 1.8);
      marker.opacity = 0.0;
    }
    marker.riseOnHover = true;
    coord = get_coord();
    function onMapClick(e) {
    // alert("You clicked the map at " + e.latlng);
}
map.on("click", onMapClick);
var intervalId = window.setInterval(function () {


        if (document.getElementById("lock").style.display != 'none') {
            return;
        }

        if (marker == undefined) {
            marker = L.marker([51.5, -0.09]).addTo(map)
        }

        old_coord = coord;
        coord = get_coord();
        if ((old_coord == undefined) && coord!=old_coord) {
            map.setView(coord, 13);
            marker.setLatLng(coord);
            marker.bindTooltip("You \n("+String(speed)+"kmph)").openTooltip();
            marker.opacity = 1.0;
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
        marker.bindTooltip("You \n("+String(speed)+"kmph)").openTooltip();
    
    
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
            console.log(`${uLat}`, `${uLon}`);
        
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