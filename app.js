(function () {
  "use strict";

  const liveEvents = Array.isArray(window.TCS_EVENTS) ? window.TCS_EVENTS : [];
  const sourceEvents = liveEvents.length ? liveEvents : (Array.isArray(window.TCS_MOCK_EVENTS) ? window.TCS_MOCK_EVENTS : []);
  const dataMeta = window.TCS_DATA_META || {};
  const isLive = liveEvents.length > 0;
  const storedLanguage = window.localStorage ? localStorage.getItem("tcs-language") : "";
  const storedProfile = window.localStorage ? localStorage.getItem("tcs-profile") : "";
  const storedGeneral = window.localStorage ? localStorage.getItem("tcs-include-general") : null;
  const today = new Date((dataMeta.finishedAt || "2026-09-20T00:00:00+08:00").slice(0, 10) + "T00:00:00+08:00");

  const translations = {
    en: {
      heroEyebrow: "A clearer route to what is next",
      heroTitle: "Find the right learning event, faster.",
      heroDescription: "One focused view for Hong Kong teachers exploring professional learning across technology, curriculum and school development.",
      browseEvents: "Browse events",
      viewDataContract: "View data contract",
      syncLane: "Sync lane",
      syncDescription: "Downloaded TCS pages are normalized behind one source boundary, ready for a scheduled Apps Script sync.",
      lastSync: "Last sync",
      visibleEvents: "Visible events",
      inThisView: "in this view",
      subjectGroups: "Subject groups",
      toExplore: "to explore",
      closingSoon: "Closing soon",
      withinSevenDays: "within 7 days",
      dataSource: "Data source",
      normalizedSnapshot: "normalized snapshot",
      browseCalendar: "Browse the calendar",
      eventsHeading: "Scan more opportunities at a glance",
      sectionCaption: "A compact list for scanning more events at once. Details and application links can grow with the live source.",
      searchEvents: "Search events",
      searchPlaceholder: "Search by title, topic, subject or audience",
      categoryAll: "All",
      categorySecondary: "Secondary",
      categoryItAi: "IT / AI",
      categoryCsd: "CSD",
      categorySteam: "STEAM",
      level: "Level",
      subject: "Subject",
      deadline: "Deadline",
      sort: "Sort",
      clear: "Clear",
      myProfile: "My teacher profile",
      profileDescription: "Choose your teaching subject to keep relevant events in view.",
      iTeach: "I teach",
      includeGeneral: "Include non-subject-specific events",
      noEvents: "No events match this view",
      noEventsDescription: "Try a broader deadline window, another subject, or clear one of the filters.",
      resetFilters: "Reset filters",
      dataContract: "Data contract",
      contractHeading: "A small interface between source and experience.",
      contractDescription: "The UI reads normalized event objects with stable fields for <code>courseId</code>, <code>title</code>, <code>categories</code>, <code>subjectTags</code>, <code>eventStart</code>, <code>eventEnd</code>, <code>closingDate</code>, <code>level</code>, <code>participantGroup</code>, <code>lastUpdated</code> and <code>badge</code>. The current source is a downloaded TCS snapshot; Apps Script can replace it with a scheduled Sheet/API response later.",
      footerTitle: "TCS Better Calendar · prototype",
      footerDescription: "Designed for a future Google Sites + Apps Script deployment",
      allLevels: "All levels",
      primary: "Primary",
      secondary: "Secondary",
      kindergarten: "Kindergarten",
      special: "Special education",
      allSubjects: "All subjects",
      english: "English",
      chinese: "Chinese",
      mathematics: "Mathematics",
      science: "Science / General Studies",
      ict: "ICT / IT / AI",
      steam: "STEAM / STEM",
      values: "CSD / Values & National Education",
      humanities: "Humanities",
      arts: "Arts / Music",
      health: "PE / Health",
      other: "Other subject-specific",
      general: "Non-subject-specific",
      allWindows: "All windows",
      nextSevenDays: "Next 7 days",
      nextThirtyDays: "Next 30 days",
      closingDate: "Closing date",
      eventDate: "Event date",
      newestAdded: "Newest added",
      subjectLabel: "Subjects",
      generalSubject: "Non-subject-specific",
      applyBy: "Apply by",
      openEvent: "Open event",
      newBadge: "NEW",
      updatedBadge: "UPDATED",
      closingBadge: "CLOSING SOON",
      showing: "Showing",
      of: "of",
      events: "events",
      sourceTcsSnapshot: "TCS snapshot",
      sourceMock: "mock dataset",
      sourceLiveStatus: "Live snapshot · TCS source",
      sourceMockStatus: "Prototype · mock data",
      tcs: "TCS",
      mock: "Mock",
      downloaded: "Downloaded"
    },
    zh: {
      heroEyebrow: "更清晰地找到下一步",
      heroTitle: "更快找到適合你的培訓活動。",
      heroDescription: "為香港教師整理專業學習活動，涵蓋科技、課程及學校發展，方便你按科目及需要篩選。",
      browseEvents: "瀏覽活動",
      viewDataContract: "查看資料結構",
      syncLane: "同步狀態",
      syncDescription: "已將 TCS 頁面整理成統一資料格式，日後可接駁 Apps Script 定時同步。",
      lastSync: "最近同步",
      visibleEvents: "目前活動",
      inThisView: "符合目前篩選",
      subjectGroups: "科目分類",
      toExplore: "可供探索",
      closingSoon: "即將截止",
      withinSevenDays: "七日內截止",
      dataSource: "資料來源",
      normalizedSnapshot: "已整理快照",
      browseCalendar: "瀏覽活動",
      eventsHeading: "一眼掃瞄更多活動",
      sectionCaption: "改用密集列表，一次睇更多活動；日後可再加入完整詳情及報名連結。",
      searchEvents: "搜尋活動",
      searchPlaceholder: "搜尋標題、主題、科目或對象",
      categoryAll: "全部",
      categorySecondary: "中學",
      categoryItAi: "資訊科技／人工智能",
      categoryCsd: "公民與社會發展",
      categorySteam: "STEAM",
      level: "教育階段",
      subject: "科目",
      deadline: "截止日期",
      sort: "排序",
      clear: "清除",
      myProfile: "我的教師 profile",
      profileDescription: "選擇你任教的科目，只保留較相關的活動。",
      iTeach: "我任教",
      includeGeneral: "包括非特定科目活動",
      noEvents: "沒有符合條件的活動",
      noEventsDescription: "可以放寬截止日期、改選其他科目，或清除部分篩選。",
      resetFilters: "重設篩選",
      dataContract: "資料結構",
      contractHeading: "連接資料來源與使用體驗的小型介面。",
      contractDescription: "介面會讀取統一格式的活動資料，包括 <code>courseId</code>、<code>title</code>、<code>categories</code>、<code>subjectTags</code>、<code>eventStart</code>、<code>eventEnd</code>、<code>closingDate</code>、<code>level</code>、<code>participantGroup</code>、<code>lastUpdated</code> 及 <code>badge</code>。目前使用已下載的 TCS 快照，日後可改為 Apps Script 定時讀取 Sheet／API。",
      footerTitle: "TCS Better Calendar · prototype",
      footerDescription: "為日後 Google Sites + Apps Script 部署而設",
      allLevels: "全部階段",
      primary: "小學",
      secondary: "中學",
      kindergarten: "幼稚園",
      special: "特殊教育",
      allSubjects: "全部科目",
      english: "英文",
      chinese: "中文",
      mathematics: "數學",
      science: "科學／常識",
      ict: "資訊科技／IT／AI",
      steam: "STEAM／STEM",
      values: "公民、價值及國民教育",
      humanities: "人文科目",
      arts: "藝術／音樂",
      health: "體育／健康",
      other: "其他特定科目",
      general: "非特定科目",
      allWindows: "全部期限",
      nextSevenDays: "未來 7 日",
      nextThirtyDays: "未來 30 日",
      closingDate: "按截止日期",
      eventDate: "按活動日期",
      newestAdded: "按最近加入",
      subjectLabel: "科目",
      generalSubject: "非特定科目",
      applyBy: "報名截止",
      openEvent: "開啟活動",
      newBadge: "NEW",
      updatedBadge: "UPDATED",
      closingBadge: "即將截止",
      showing: "顯示",
      of: "/",
      events: "個活動",
      sourceTcsSnapshot: "TCS 快照",
      sourceMock: "示範資料",
      sourceLiveStatus: "TCS 資料快照",
      sourceMockStatus: "Prototype · 示範資料",
      tcs: "TCS",
      mock: "示範",
      downloaded: "下載於"
    }
  };

  const subjectDefinitions = [
    { value: "all", key: "allSubjects" },
    { value: "english", key: "english" },
    { value: "chinese", key: "chinese" },
    { value: "mathematics", key: "mathematics" },
    { value: "science", key: "science" },
    { value: "ict", key: "ict" },
    { value: "steam", key: "steam" },
    { value: "values", key: "values" },
    { value: "humanities", key: "humanities" },
    { value: "arts", key: "arts" },
    { value: "health", key: "health" },
    { value: "other", key: "other" },
    { value: "general", key: "general" }
  ];
  const levelDefinitions = [
    { value: "all", key: "allLevels" },
    { value: "primary", key: "primary" },
    { value: "secondary", key: "secondary" },
    { value: "kindergarten", key: "kindergarten" },
    { value: "special", key: "special" }
  ];
  const deadlineDefinitions = [
    { value: "all", key: "allWindows" },
    { value: "7", key: "nextSevenDays" },
    { value: "30", key: "nextThirtyDays" }
  ];
  const sortDefinitions = [
    { value: "closing", key: "closingDate" },
    { value: "event", key: "eventDate" },
    { value: "newest", key: "newestAdded" }
  ];

  const state = {
    locale: storedLanguage === "zh" ? "zh" : "en",
    query: "",
    category: "All",
    deadline: "all",
    sort: "closing",
    level: "all",
    subject: "all",
    profile: subjectDefinitions.some(function (item) { return item.value === storedProfile; }) ? storedProfile : "all",
    includeGeneral: storedGeneral === null ? true : storedGeneral === "true"
  };

  const elements = {
    grid: document.getElementById("event-grid"),
    empty: document.getElementById("empty-state"),
    summary: document.getElementById("results-summary"),
    visible: document.getElementById("stat-visible"),
    subjectGroups: document.getElementById("stat-subject-groups"),
    closing: document.getElementById("stat-closing"),
    search: document.getElementById("search-input"),
    level: document.getElementById("level-select"),
    subject: document.getElementById("subject-select"),
    profile: document.getElementById("profile-select"),
    includeGeneral: document.getElementById("include-general"),
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

  function t(key) { return translations[state.locale][key] || translations.en[key] || key; }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>'"]/g, function (character) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character];
    });
  }

  function asDate(iso) {
    if (!iso) return new Date("2999-12-31T00:00:00+08:00");
    return new Date(iso + "T00:00:00+08:00");
  }

  function formatDate(iso, includeYear) {
    if (!iso) return "—";
    return new Intl.DateTimeFormat(state.locale === "zh" ? "zh-HK" : "en-HK", {
      day: "numeric",
      month: "short",
      year: includeYear ? "numeric" : undefined
    }).format(asDate(iso));
  }

  function dateRange(event) {
    const start = formatDate(event.eventStart, false);
    const end = formatDate(event.eventEnd, true);
    return event.eventStart && event.eventStart === event.eventEnd ? end : start + " – " + end;
  }

  function daysUntil(iso) {
    if (!iso) return 99999;
    return Math.ceil((asDate(iso).getTime() - today.getTime()) / 86400000);
  }

  function isClosingSoon(event) {
    const days = daysUntil(event.closingDate);
    return days >= 0 && days <= 7;
  }

  function subjectTagsFor(event) {
    if (Array.isArray(event.subjectTags) && event.subjectTags.length) return event.subjectTags;
    const subject = String(event.subject || "").trim();
    const haystack = [subject, event.title, event.summary].join(" ").toUpperCase();
    const tags = [];
    const general = !subject || /^(ALL|NOT APPLICABLE|全部|不適用)$/i.test(subject);
    if (general) tags.push("general");
    if (/ENGLISH LANGUAGE|ENGLISH TEACH|ENGLISH CLASSROOM|ENGLISH LEARNING|ENGLISH SPEAKING|PRIMARY ENGLISH|SECONDARY ENGLISH|ENGLISH TEACHERS|TEACHERS USING ENGLISH|英語|英文/.test(haystack)) tags.push("english");
    if (/CHINESE LANGUAGE|CHINESE LITERATURE|\bCHINESE\b|中國語文|中文/.test(haystack)) tags.push("chinese");
    if (/MATHEMATICS|數學/.test(haystack)) tags.push("mathematics");
    if (/BIOLOGY|CHEMISTRY|PHYSICS|SCIENCE|GENERAL STUDIES|PRIMARY SCIENCE|自然科學|科學|常識/.test(haystack)) tags.push("science");
    if (/ICT|INFORMATION & COMMUNICATION|COMPUTER|CODING|DIGITAL|TECHNOLOGY|AI|A\.I\.|數字教育|資訊科技|人工智能/.test(haystack)) tags.push("ict");
    if (/STEAM|STEM/.test(haystack)) tags.push("steam");
    if (/CITIZENSHIP|SOCIAL DEVELOPMENT|MORAL|NATIONAL EDUCATION|公民|國民教育|價值教育/.test(haystack)) tags.push("values");
    if (/HISTORY|GEOGRAPHY|HUMANITIES|歷史|地理|人文/.test(haystack)) tags.push("humanities");
    if (/VISUAL ARTS|MUSIC|ARTS|視覺藝術|音樂|藝術/.test(haystack)) tags.push("arts");
    if (/PHYSICAL|HEALTH|PE\b|體育|健康/.test(haystack)) tags.push("health");
    if (!general && !tags.length) tags.push("other");
    return tags;
  }

  function subjectLabel(tag) {
    const definition = subjectDefinitions.find(function (item) { return item.value === tag; });
    return definition ? t(definition.key) : tag;
  }

  function rawSubject(event) {
    const subject = String(event.subject || "").trim();
    return !subject || /^(ALL|NOT APPLICABLE|全部|不適用)$/i.test(subject) ? t("generalSubject") : subject;
  }

  function levelKeys(event) {
    const level = [event.level, event.participantGroup].join(" ").toUpperCase();
    const keys = [];
    if (/PRIMARY|小學/.test(level)) keys.push("primary");
    if (/SECONDARY|中學/.test(level)) keys.push("secondary");
    if (/KINDERGARTEN|幼稚園/.test(level)) keys.push("kindergarten");
    if (/SPECIAL|特殊/.test(level)) keys.push("special");
    return keys;
  }

  const events = sourceEvents.map(function (event) {
    return Object.assign({}, event, { subjectTags: subjectTagsFor(event) });
  });

  function applyTranslations() {
    document.documentElement.lang = state.locale === "zh" ? "zh-HK" : "en-HK";
    document.querySelectorAll("[data-i18n]").forEach(function (node) { node.textContent = t(node.dataset.i18n); });
    document.querySelectorAll("[data-i18n-html]").forEach(function (node) { node.innerHTML = t(node.dataset.i18nHtml); });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (node) { node.placeholder = t(node.dataset.i18nPlaceholder); });
    document.querySelectorAll("[data-language]").forEach(function (button) { button.classList.toggle("is-active", button.dataset.language === state.locale); });
  }

  function populateSelect(element, definitions) {
    const current = element.value;
    element.innerHTML = definitions.map(function (definition) {
      return '<option value="' + escapeHtml(definition.value) + '">' + escapeHtml(t(definition.key)) + "</option>";
    }).join("");
    element.value = definitions.some(function (item) { return item.value === current; }) ? current : definitions[0].value;
  }

  function populateControls() {
    populateSelect(elements.level, levelDefinitions);
    populateSelect(elements.subject, subjectDefinitions);
    populateSelect(elements.profile, subjectDefinitions);
    populateSelect(elements.deadline, deadlineDefinitions);
    populateSelect(elements.sort, sortDefinitions);
    elements.level.value = state.level;
    elements.subject.value = state.subject;
    elements.profile.value = state.profile;
    elements.deadline.value = state.deadline;
    elements.sort.value = state.sort;
    elements.includeGeneral.checked = state.includeGeneral;
  }

  function categoryLabel(category) {
    const keys = { All: "categoryAll", Secondary: "categorySecondary", "IT/AI": "categoryItAi", CSD: "categoryCsd", STEAM: "categorySteam" };
    return keys[category] ? t(keys[category]) : category;
  }

  function getBadges(event) {
    const badges = [];
    if (event.badge === "NEW") badges.push('<span class="badge badge-new">' + escapeHtml(t("newBadge")) + "</span>");
    if (event.badge === "UPDATED") badges.push('<span class="badge badge-updated">' + escapeHtml(t("updatedBadge")) + "</span>");
    if (isClosingSoon(event)) badges.push('<span class="badge badge-closing">' + escapeHtml(t("closingBadge")) + "</span>");
    return badges.join("");
  }

  function matches(event) {
    const query = state.query.trim().toLowerCase();
    const tags = subjectTagsFor(event);
    const searchText = [event.title, event.summary, event.category, (event.categories || []).join(" "), event.subject, tags.map(subjectLabel).join(" "), event.level, event.participantGroup, event.format].join(" ").toLowerCase();
    const categoryMatch = state.category === "All" || (event.categories || [event.category]).includes(state.category) || event.category === state.category;
    const profileMatch = state.profile === "all" || tags.includes(state.profile) || (state.includeGeneral && tags.includes("general"));
    const subjectMatch = state.subject === "all" || tags.includes(state.subject);
    const levelMatch = state.level === "all" || levelKeys(event).includes(state.level);
    const days = daysUntil(event.closingDate);
    const windowMatch = state.deadline === "all" || (days >= 0 && days <= Number(state.deadline));
    return categoryMatch && profileMatch && subjectMatch && levelMatch && windowMatch && (!query || searchText.indexOf(query) !== -1);
  }

  function getVisibleEvents() {
    return events.filter(matches).sort(function (a, b) {
      if (state.sort === "event") return asDate(a.eventStart) - asDate(b.eventStart);
      if (state.sort === "newest") return asDate(b.lastUpdated) - asDate(a.lastUpdated);
      return asDate(a.closingDate) - asDate(b.closingDate);
    });
  }

  function listTemplate(event) {
    const tags = subjectTagsFor(event);
    const visibleTags = tags.length ? tags : ["general"];
    const subjectTags = visibleTags.map(function (tag) {
      return '<span class="subject-tag" data-subject="' + escapeHtml(tag) + '">' + escapeHtml(subjectLabel(tag)) + "</span>";
    }).join("");
    const originalSubject = rawSubject(event);
    const originalSubjectHtml = originalSubject === t("generalSubject") ? "" : '<span class="subject-original" title="' + escapeHtml(originalSubject) + '">' + escapeHtml(originalSubject) + '</span>';
    const href = event.applyUrl || event.sourceUrl || "https://tcs.edb.gov.hk/";
    const soon = isClosingSoon(event);
    return '<article class="event-row">' +
      '<div class="row-date"><span class="row-date-label">' + escapeHtml(t("eventDate")) + '</span><strong>' + escapeHtml(formatDate(event.eventStart, false)) + '</strong><span>' + escapeHtml(event.eventStart !== event.eventEnd ? "→ " + formatDate(event.eventEnd, false) : "") + '</span></div>' +
      '<div class="row-main"><div class="row-heading"><span class="category-label" data-category="' + escapeHtml(event.category) + '">' + escapeHtml(categoryLabel(event.category)) + '</span>' + getBadges(event) + '<span class="event-id">' + escapeHtml(event.courseId) + '</span></div>' +
      '<h3>' + escapeHtml(event.title) + '</h3>' +
      '<div class="event-subjects"><span class="detail-label">' + escapeHtml(t("subjectLabel")) + '</span><span class="subject-tag-list">' + subjectTags + '</span>' + originalSubjectHtml + '</div>' +
      '<p class="row-meta">' + escapeHtml([event.level, event.participantGroup, event.format].filter(Boolean).join(" · ")) + '</p></div>' +
      '<div class="row-deadline"><span class="deadline-label">' + escapeHtml(t("applyBy")) + '</span><strong class="deadline-date ' + (soon ? "is-soon" : "") + '">' + escapeHtml(formatDate(event.closingDate, true)) + '</strong><a class="card-link" href="' + escapeHtml(href) + '" target="_blank" rel="noreferrer">' + escapeHtml(t("openEvent")) + ' ↗</a></div>' +
      '</article>';
  }

  function render() {
    applyTranslations();
    populateControls();
    const visibleEvents = getVisibleEvents();
    const closingCount = events.filter(isClosingSoon).length;
    elements.grid.innerHTML = visibleEvents.map(listTemplate).join("");
    elements.grid.hidden = visibleEvents.length === 0;
    elements.empty.hidden = visibleEvents.length !== 0;
    elements.visible.textContent = String(visibleEvents.length).padStart(2, "0");
    elements.subjectGroups.textContent = String(subjectDefinitions.length - 1).padStart(2, "0");
    elements.closing.textContent = String(closingCount).padStart(2, "0");
    elements.summary.textContent = t("showing") + " " + visibleEvents.length + " " + t("of") + " " + events.length + " " + t("events");
    elements.sourceStatus.textContent = isLive ? t("sourceLiveStatus") : t("sourceMockStatus");
    elements.resultsSource.innerHTML = '<span class="source-led"></span> ' + escapeHtml(isLive ? t("sourceTcsSnapshot") + " · " + (dataMeta.downloadedPages || "") + " pages" : t("sourceMock"));
    elements.statSource.textContent = isLive ? t("tcs") : t("mock");
    if (isLive && dataMeta.finishedAt) {
      elements.syncNote.textContent = formatDate(dataMeta.finishedAt.slice(0, 10), true) + " · " + new Intl.DateTimeFormat(state.locale === "zh" ? "zh-HK" : "en-HK", { hour: "2-digit", minute: "2-digit" }).format(new Date(dataMeta.finishedAt));
    }
  }

  function resetFilters() {
    state.query = "";
    state.category = "All";
    state.deadline = "all";
    state.sort = "closing";
    state.level = "all";
    state.subject = "all";
    elements.search.value = "";
    document.querySelectorAll("[data-category]").forEach(function (button) { button.classList.toggle("is-active", button.dataset.category === "All"); });
    render();
  }

  function setLanguage(locale) {
    state.locale = locale === "zh" ? "zh" : "en";
    if (window.localStorage) localStorage.setItem("tcs-language", state.locale);
    render();
  }

  document.querySelectorAll("[data-language]").forEach(function (button) {
    button.addEventListener("click", function () { setLanguage(button.dataset.language); });
  });
  document.querySelectorAll("[data-category]").forEach(function (button) {
    button.addEventListener("click", function () {
      state.category = button.dataset.category;
      document.querySelectorAll("[data-category]").forEach(function (item) { item.classList.toggle("is-active", item === button); });
      render();
    });
  });
  elements.search.addEventListener("input", function (event) { state.query = event.target.value; render(); });
  elements.level.addEventListener("change", function (event) { state.level = event.target.value; render(); });
  elements.subject.addEventListener("change", function (event) { state.subject = event.target.value; render(); });
  elements.profile.addEventListener("change", function (event) {
    state.profile = event.target.value;
    if (window.localStorage) localStorage.setItem("tcs-profile", state.profile);
    render();
  });
  elements.includeGeneral.addEventListener("change", function (event) {
    state.includeGeneral = event.target.checked;
    if (window.localStorage) localStorage.setItem("tcs-include-general", String(state.includeGeneral));
    render();
  });
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
