var map;
var coord;
var video_on = false;
var video = document.querySelector("video");



onload = function () {
    map = L.map("map").setView([51.505, -0.09], 13);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap",
    }).addTo(map);
    var marker = L.marker([51.5, -0.09]).addTo(map);
    marker.riseOnHover = true;
    function onMapClick(e) {
    // alert("You clicked the map at " + e.latlng);
}
map.on("click", onMapClick);

    var intervalId = window.setInterval(function () {
        old_coord = coord;
        coord = get_coord();
        speed = (getDistanceFromLatLonInKm(old_coord[0], old_coord[1], coord[0], coord[1]))/60;
      marker.setLatLng(coord);
      marker.bindTooltip("You \n("+String(speed)+"km/h)").openTooltip();
      
    }, 1000);
    video = document.querySelector("video");

};
var uLat = 0;
var uLon = 0;

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


function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1); // deg2rad below
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  return d;
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