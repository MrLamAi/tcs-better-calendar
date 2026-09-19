/**
 * Copy the files in this folder into a Google Apps Script project.
 * The app currently uses the client-side mock dataset while the source
 * adapter is being reverse-engineered.
 */
function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('TCS Better Calendar')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getEvents() {
  return [];
}
