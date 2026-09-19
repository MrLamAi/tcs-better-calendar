/**
 * TCS Better Calendar — Google Apps Script entry point.
 *
 * The current UI is intentionally static-compatible for local prototyping.
 * When moving it into Apps Script, use this doGet() and add Index.html as the
 * HTML Service entry point. The next source adapter can replace mock data
 * without changing the browser-facing event shape.
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('TCS Better Calendar')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Placeholder server boundary for the future TCS fetcher.
 * Keep the normalized fields aligned with mock-data.js.
 */
function getEvents() {
  return [];
}
