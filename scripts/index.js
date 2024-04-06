const ipv4RegExp = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/,
   ipv6RegExp =
      /(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))/,
   domainRegExp = /^(((?!-))(xn--|_)?[a-z0-9-]{0,61}[a-z0-9]{1,1}\.)*(xn--)?([a-z0-9][a-z0-9\-]{0,60}|[a-z0-9-]{1,30}\.[a-z]{2,})$/;

const map = L.map("map", {
   center: [-20, 320],
   zoom: 5
});

let marker;

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
   attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

const locationIcon = L.icon({
   iconUrl: "images/icon-location.svg",
   iconSize: [46, 58],
   iconAnchor: [23, 58],
})

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
   alertUser(err, { duration: 5000 });
}

function getIpInfo(ipOrDomain) {
   const queryStr = domainRegExp.test(ipOrDomain) ? `domain=${ipOrDomain}` : `ipAddress=${ipOrDomain}`;
   return fetch(
      `https://geo.ipify.org/api/v2/country,city?apiKey=at_JwmEtudkMTFT3TjvkzumsIeyKcsH7&${queryStr}`
   ).then((res) => {
      if (res.status >= 400) throw new Error(`Something went wrong: (${res.status}) ${res.statusText}`);
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
   spinner.firstElementChild.textContent = "Tracking location";
}

function hideLoadingState() {
   spinner.setAttribute("data-loading", false);
   spinner.firstElementChild.textContent = "";
}

async function handleSubmission(e) {
   e.preventDefault();
   const ipOrDomain = ipForm.ip.value;
   if (ipv4RegExp.test(ipOrDomain) || ipv6RegExp.test(ipOrDomain) || domainRegExp.test(ipOrDomain)) {
      try {
         disableForm();
         showLoadingState();
         const ipInfo = await getIpInfo(ipOrDomain);

         if (ipInfo.isp === "") {
            throw new Error(`'${ipOrDomain}' was not found`);
         } else {
            const latLng = [ipInfo.location.lat, ipInfo.location.lng];

            map.panTo(latLng)
            if (marker) {
               marker.setLatLng(latLng)
            } else {
               marker = L.marker(latLng, { icon: locationIcon }).addTo(map)
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
      reportError("Enter a valid IP address or domain");
   }
}

ipForm.addEventListener("submit", handleSubmission);



/*
#########################################
Custom alert
#########################################
*/

function createAlert(announcement) {
   const customAlert = document.createElement("div");
   customAlert.role = "alert";
   customAlert.textContent = announcement;
   return customAlert;
}

let currentTimeout,
   showingAlert = false,
   animationDuration;

function alertUser(
   announcement,
   options
) {
   const { duration = 10000 } = options || {};

   clearTimeout(currentTimeout);
   document.querySelector("[role=alert]")?.remove();

   const customAlert = createAlert(announcement.toString());
   document.body.appendChild(customAlert);
   showingAlert = true;

   animationDuration = Math.min(0.1 * duration, 300);

   const animationOptions = {
      duration: animationDuration,
      iterations: 1,
      fill: "both",
   };

   fadeInDown(customAlert, animationOptions);
   currentTimeout = setTimeout(() => {
      dismiss();
   }, duration - animationDuration);
}

let dismissing = false;

function dismiss() {
   if (!showingAlert || dismissing) return;

   const animationOptions = {
      duration: animationDuration,
      iterations: 1,
      fill: "both",
   };

   const customAlert = document.querySelector("[role='alert']");

   clearTimeout(currentTimeout);
   currentTimeout = undefined;

   dismissing = true;
   fadeOutUp(customAlert, animationOptions, () => {
      customAlert.remove();
      showingAlert = false;
      dismissing = false;
      animationDuration = undefined;
   });
}

function fadeInDown(element, options) {
   element.animate(
      [
         { opacity: 0, top: "-3.5rem" },
         { opacity: 1, top: "1.5rem" },
      ],
      options
   );
}

function fadeOutUp(
   element,
   options,
   callback
) {
   const fadeOut = element.animate(
      [
         { opacity: 1, top: "1.5rem" },
         { opacity: 0, top: "-3.5rem" },
      ],
      options
   );
   if (callback) fadeOut.onfinish = callback;
}
