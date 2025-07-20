const CLIENT_ID = '1086350853623-crq127qaf1cflknv2m56gg985ug2itvo.apps.googleusercontent.com'; 

let tokenClient;
let gapiInited = false;
let gisInited = false;

function gapiLoaded() {
  gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
  await gapi.client.init({
    apiKey: "", // Not needed for OAuth
    discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
  });
  gapiInited = true;
  maybeEnableForm();
}

function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: 'https://www.googleapis.com/auth/calendar.events',
    callback: '', // defined later
  });
  gisInited = true;
  maybeEnableForm();
}

function maybeEnableForm() {
  if (gapiInited && gisInited) {
    document.getElementById('milestoneForm').style.display = 'block';
  }
}

window.gapiLoaded = gapiLoaded;
window.gisLoaded = gisLoaded;
