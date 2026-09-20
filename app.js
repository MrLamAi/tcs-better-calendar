(function () {
  "use strict";

  const liveEvents = Array.isArray(window.TCS_EVENTS) ? window.TCS_EVENTS : [];
  const events = liveEvents.length ? liveEvents : (Array.isArray(window.TCS_MOCK_EVENTS) ? window.TCS_MOCK_EVENTS : []);
  const dataMeta = window.TCS_DATA_META || {};
  const isLive = liveEvents.length > 0;
  const today = new Date((dataMeta.finishedAt || "2026-09-20T00:00:00+08:00").slice(0, 10) + "T00:00:00+08:00");
  const state = { query: "", category: "All", deadline: "all", sort: "closing" };
  const elements = {
    grid: document.getElementById("event-grid"),
    empty: document.getElementById("empty-state"),
    summary: document.getElementById("results-summary"),
    visible: document.getElementById("stat-visible"),
    closing: document.getElementById("stat-closing"),
    search: document.getElementById("search-input"),
    deadline: document.getElementById("deadline-select"),
    sort: document.getElementById("sort-select"),
    clear: document.getElementById("clear-filters"),
    emptyClear: document.getElementById("empty-clear"),
    contract: document.getElementById("data-contract"),
    contractButton: document.getElementById("data-contract-button"),
    contractClose: document.getElementById("close-contract"),
    sourceStatus: document.getElementById("source-status"),
    syncNote: document.getElementById("sync-note"),
    statSource: document.getElementById("stat-source"),
    resultsSource: document.getElementById("results-source")
  };

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, function (character) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character];
    });
  }

  function asDate(iso) { return new Date(iso + "T00:00:00+08:00"); }

  function formatDate(iso, includeYear) {
    return new Intl.DateTimeFormat("en-HK", { day: "numeric", month: "short", year: includeYear ? "numeric" : undefined }).format(asDate(iso));
  }

  function dateRange(event) {
    const start = formatDate(event.eventStart, false);
    const end = formatDate(event.eventEnd, true);
    return event.eventStart === event.eventEnd ? end : start + " – " + end;
  }

  function daysUntil(iso) { return Math.ceil((asDate(iso).getTime() - today.getTime()) / 86400000); }

  function isClosingSoon(event) {
    const days = daysUntil(event.closingDate);
    return days >= 0 && days <= 7;
  }

  function getBadges(event) {
    const badges = [];
    if (event.badge === "NEW") badges.push('<span class="badge badge-new">NEW</span>');
    if (event.badge === "UPDATED") badges.push('<span class="badge badge-updated">UPDATED</span>');
    if (isClosingSoon(event)) badges.push('<span class="badge badge-closing">CLOSING SOON</span>');
    return badges.join("");
  }

  function matches(event) {
    const query = state.query.trim().toLowerCase();
    const searchText = [event.title, event.summary, event.category, (event.categories || []).join(" "), event.level, event.participantGroup, event.format].join(" ").toLowerCase();
    const categories = Array.isArray(event.categories) && event.categories.length ? event.categories : [event.category];
    const categoryMatch = state.category === "All" || categories.includes(state.category);
    const windowMatch = state.deadline === "all" || (daysUntil(event.closingDate) >= 0 && daysUntil(event.closingDate) <= Number(state.deadline));
    return categoryMatch && windowMatch && (!query || searchText.indexOf(query) !== -1);
  }

  function getVisibleEvents() {
    return events.filter(matches).sort(function (a, b) {
      if (state.sort === "event") return asDate(a.eventStart) - asDate(b.eventStart);
      if (state.sort === "newest") return asDate(b.lastUpdated) - asDate(a.lastUpdated);
      return asDate(a.closingDate) - asDate(b.closingDate);
    });
  }

  function cardTemplate(event) {
    const soon = isClosingSoon(event);
    return '<article class="event-card">' +
      '<div class="card-top"><span class="category-label" data-category="' + escapeHtml(event.category) + '">' + escapeHtml(event.category) + '</span><span class="event-id">' + escapeHtml(event.courseId) + '</span></div>' +
      '<div class="badge-row">' + getBadges(event) + '</div>' +
      '<h3>' + escapeHtml(event.title) + '</h3>' +
      '<p class="event-summary">' + escapeHtml(event.summary) + '</p>' +
      '<div class="detail-list">' +
        '<div class="detail-item"><span class="detail-icon" aria-hidden="true">◷</span><span>' + escapeHtml(dateRange(event)) + '</span></div>' +
        '<div class="detail-item"><span class="detail-icon" aria-hidden="true">◎</span><span>' + escapeHtml(event.participantGroup) + '</span></div>' +
        '<div class="detail-item"><span class="detail-icon" aria-hidden="true">⌖</span><span>' + escapeHtml(event.format) + '</span></div>' +
      '</div>' +
      '<div class="card-bottom"><div><span class="deadline-label">Apply by</span><strong class="deadline-date ' + (soon ? "is-soon" : "") + '">' + escapeHtml(formatDate(event.closingDate, true)) + '</strong></div><a class="card-link" href="' + escapeHtml(event.applyUrl) + '" target="_blank" rel="noreferrer">View event ↗</a></div>' +
    '</article>';
  }

  function render() {
    const visibleEvents = getVisibleEvents();
    const closingCount = events.filter(isClosingSoon).length;
    elements.grid.innerHTML = visibleEvents.map(cardTemplate).join("");
    elements.grid.hidden = visibleEvents.length === 0;
    elements.empty.hidden = visibleEvents.length !== 0;
    elements.visible.textContent = String(visibleEvents.length).padStart(2, "0");
    elements.closing.textContent = String(closingCount).padStart(2, "0");
    elements.summary.textContent = "Showing " + visibleEvents.length + " of " + events.length + " events";
    elements.sourceStatus.textContent = isLive ? "Live snapshot · TCS source" : "Prototype · mock data";
    elements.resultsSource.innerHTML = '<span class="source-led"></span> Source: ' + (isLive ? "TCS snapshot · " + (dataMeta.downloadedPages || "") + " pages" : "mock dataset");
    elements.statSource.textContent = isLive ? "TCS" : "Mock";
    if (isLive && dataMeta.finishedAt) {
      elements.syncNote.textContent = "Downloaded " + new Intl.DateTimeFormat("en-HK", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(dataMeta.finishedAt));
    }
  }

  function resetFilters() {
    state.query = "";
    state.category = "All";
    state.deadline = "all";
    state.sort = "closing";
    elements.search.value = "";
    elements.deadline.value = "all";
    elements.sort.value = "closing";
    document.querySelectorAll("[data-category]").forEach(function (button) { button.classList.toggle("is-active", button.dataset.category === "All"); });
    render();
  }

  document.querySelectorAll("[data-category]").forEach(function (button) {
    button.addEventListener("click", function () {
      state.category = button.dataset.category;
      document.querySelectorAll("[data-category]").forEach(function (item) { item.classList.toggle("is-active", item === button); });
      render();
    });
  });
  elements.search.addEventListener("input", function (event) { state.query = event.target.value; render(); });
  elements.deadline.addEventListener("change", function (event) { state.deadline = event.target.value; render(); });
  elements.sort.addEventListener("change", function (event) { state.sort = event.target.value; render(); });
  elements.clear.addEventListener("click", resetFilters);
  elements.emptyClear.addEventListener("click", resetFilters);
  elements.contractButton.addEventListener("click", function () { elements.contract.hidden = false; elements.contract.scrollIntoView({ behavior: "smooth", block: "center" }); });
  elements.contractClose.addEventListener("click", function () { elements.contract.hidden = true; });
  document.addEventListener("keydown", function (event) {
    if (event.key === "/" && document.activeElement !== elements.search) { event.preventDefault(); elements.search.focus(); }
    if (event.key === "Escape" && !elements.contract.hidden) elements.contract.hidden = true;
  });

  render();
})();
