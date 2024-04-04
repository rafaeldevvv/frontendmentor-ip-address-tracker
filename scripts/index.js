const ipv4RegExp = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/,
   ipv6RegExp =
      /(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))/;

const map = L.map("map", {
   center: [0, 0],
   zoom: 5
});
let marker;

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
   attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

const ipForm = document.querySelector("form"),
   ipInput = document.querySelector("input");

const ipOutput = document.querySelector(".js-ip-output"),
   locationOutput = document.querySelector(".js-location-output"),
   timezoneOutput = document.querySelector(".js-timezone-output"),
   ispOutput = document.querySelector(".js-isp-output");

ipInput.addEventListener("input", (e) => {
   const inp = e.target,
      val = inp.value;
   if (/[^:\.\da-zA-Z]$/.test(val)) {
      inp.value = val.slice(0, val.length - 1);
   }
});

function reportError(err) {
   alert(err);
}

function getIpInfo(ip) {
   return fetch(
      `https://geo.ipify.org/api/v2/country,city?apiKey=at_JwmEtudkMTFT3TjvkzumsIeyKcsH7&ipAddress=${ip}`
   ).then((res) => {
      if (res.status >= 400) throw new Error("Something went wrong: " + res.statusText);
      else return res.json();
   });
}


const allFormElts = ipForm.querySelectorAll("*");
function disableForm() {
   allFormElts.forEach(e => {
      if ("disabled" in e) e.disabled = true;
   });
}

function enableForm() {
   allFormElts.forEach(e => {
      if ("disabled" in e) e.disabled = false;
   });
}

const spinner = document.querySelector(".js-spinner");
function showLoadingState() {
   spinner.setAttribute("data-loading", true);
   spinner.firstElementChild.textContent = "Loading information";
}

function hideLoadingState() {
   spinner.setAttribute("data-loading", false);
   spinner.firstElementChild.textContent = "";
}

async function handleSubmission(e) {
   e.preventDefault();
   const ip = ipForm.ip.value;
   if (ipv4RegExp.test(ip) || ipv6RegExp.test(ip)) {
      try {
         disableForm();
         showLoadingState();
         const ipInfo = await getIpInfo(ip);

         if (ipInfo.isp === "") {
            reportError(`'${ip}' was not found`);
         } else {
            const latLng = [ipInfo.location.lat, ipInfo.location.lng];

            map.panTo(latLng)
            if (marker) {
               marker.setLatLng(latLng)
            } else {
               marker = L.marker(latLng, { url: "./images/icon-location.png" }).addTo(map)
            }

            ipOutput.textContent = ipInfo.ip;
            locationOutput.textContent = ipInfo.location.region + ", " + ipInfo.location.country;
            timezoneOutput.textContent = "UTC " + ipInfo.location.timezone;
            ispOutput.textContent = ipInfo.isp;
         }

      } catch (err) {
         reportError(err);
      } finally {
         enableForm();
         hideLoadingState();
      }
   } else {
      reportError("Invalid IP Address");
   }
}

ipForm.addEventListener("submit", handleSubmission);
