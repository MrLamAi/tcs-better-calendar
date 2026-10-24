(function () {
  "use strict";

  const liveEvents = Array.isArray(window.TCS_EVENTS) ? window.TCS_EVENTS : [];
  const sourceEvents = liveEvents.length ? liveEvents : (Array.isArray(window.TCS_MOCK_EVENTS) ? window.TCS_MOCK_EVENTS : []);
  const dataMeta = window.TCS_DATA_META || {};
  const isLive = liveEvents.length > 0;
  const storedLanguage = window.localStorage ? localStorage.getItem("tcs-language") : "";
  const storedProfile = window.localStorage ? localStorage.getItem("tcs-profile") : "";
  const storedGeneral = window.localStorage ? localStorage.getItem("tcs-include-general") : null;
  const storedNonLive = window.localStorage ? localStorage.getItem("tcs-only-non-live") : null;
  const nowHk = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Hong_Kong",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
  const todayIso = /^\d{4}-\d{2}-\d{2}$/.test(nowHk) ? nowHk : (dataMeta.finishedAt || "2026-10-24T00:00:00+08:00").slice(0, 10);
  const today = new Date(todayIso + "T00:00:00+08:00");

  const translations = {
    zh: {
      brandSubtitle: "教育局教師專業發展",
      navIntro: "簡介首頁",
      navWorkspace: "活動列表與月曆",
      heroEyebrow: "更清晰地找到下一步",
      heroTitle: "更快找到適合你的培訓活動。",
      heroDescription: "為香港教師整理教育局 TCS 專業學習活動，支援中英雙語、月曆檢視、活動詳情預覽及「免親身出席／網上課程」篩選。",
      browseEvents: "進入活動行事曆",
      openCalendarView: "開啟月曆檢視",
      viewDataContract: "查看資料結構",
      syncLane: "同步狀態",
      syncDescription: "已擷取最新中英雙語 TCS 活動與詳情頁面，並自動識別網上自學、實時網上講座及實體課程。",
      lastSync: "最近同步",
      totalEventsLabel: "活動總數",
      inDatabase: "已收錄活動",
      nonLiveEventsLabel: "網上／自學活動",
      nonLiveContext: "免親身到場或網上進行",
      closingSoon: "即將截止",
      withinSevenDays: "七日內截止",
      dataSource: "資料來源",
      normalizedSnapshot: "中英雙語快照",
      featureBilingualTitle: "中英雙語同步",
      featureBilingualDesc: "預設繁體中文介面與活動內容，一鍵切換中英文課程名稱、對象與詳情。",
      featureCalendarTitle: "列表與月曆雙視圖",
      featureCalendarDesc: "除密集列表外，提供月曆檢視按月份及日期直觀掌握每日培訓活動。",
      featureModeTitle: "上課模式分類",
      featureModeDesc: "自動區分「網上自學／錄播」、「實時網上講座 (Webinar)」及「需親身出席 (實體)」。",
      backToIntro: "返回簡介首頁",
      eventsHeading: "探索培訓活動",
      listView: "列表檢視",
      calendarView: "月曆檢視",
      searchEvents: "搜尋活動",
      searchPlaceholder: "搜尋活動編號、標題、主題、科目、地點或對象",
      categoryAll: "全部",
      categorySecondary: "中學",
      categoryItAi: "資訊科技／AI",
      categoryCsd: "公民與社會發展",
      categorySteam: "STEAM",
      filterToggle: "篩選與設定",
      eventTimeLabel: "活動時間",
      timeAll: "所有時段",
      timeAm: "只看上午 (AM)",
      timePm: "只看下午／課後 (PM)",
      timeAfterSchool: "15:30 後開始",
      startTimeAfter: "最早開始時間：",
      timeAnyLimit: "不限 (全日)",
      timeFlexible: "自訂時間（網上自學）",
      timeTba: "時間請參閱詳情",
      deliveryModeLabel: "上課模式",
      modeAll: "全部模式",
      modeNonInPerson: "所有網上／免到場 (自學+Webinar)",
      modeSelfPaced: "網上自學／錄播 (免實時出席)",
      modeWebinar: "實時網上講座 (Webinar)",
      modeInPerson: "需親身出席 (實體)",
      level: "教育階段",
      subject: "科目",
      specificDate: "指定活動日期",
      deadline: "截止日期",
      sort: "排序",
      clear: "重設",
      myProfile: "我的教師設定",
      profileDescription: "選擇你任教的科目及上課偏好，自動篩選相關活動。",
      iTeach: "我任教",
      includeGeneral: "包括非特定科目活動",
      onlyNonLive: "只顯示免親身出席／網上活動",
      noEvents: "沒有符合條件的活動",
      noEventsDescription: "可以放寬截止日期、改選其他上課模式或科目，或重設篩選條件。",
      resetFilters: "重設篩選",
      dataContract: "資料結構",
      contractHeading: "連接資料來源與使用體驗的小型介面。",
      contractDescription: "介面會讀取統一格式的活動資料，包括 <code>courseId</code>、<code>title</code>、<code>titleZh</code>、<code>deliveryMode</code>、<code>categories</code>、<code>subjectTags</code>、<code>eventStart</code>、<code>eventEnd</code>、<code>closingDate</code> 及雙語 <code>details</code>（目標、內容、場次、講授語言）。",
      footerTitle: "TCS Better Calendar · 雙語升級版",
      footerDescription: "支援中英雙語、月曆檢視及課程詳情預覽",
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
      nextSevenDays: "未來 7 日內截止",
      nextThirtyDays: "未來 30 日內截止",
      closingDate: "按截止日期",
      eventDate: "按活動日期",
      newestAdded: "按最近發佈",
      modeSort: "網上／自學優先",
      subjectLabel: "科目",
      generalSubject: "非特定科目",
      applyBy: "報名截止",
      viewDetails: "查看詳情",
      openEvent: "前往報名",
      openEdbDetail: "於 EDB 查看原始詳情",
      newBadge: "最新",
      updatedBadge: "更新／重辦",
      closingBadge: "即將截止",
      showing: "顯示",
      of: "/",
      events: "個活動",
      sourceTcsSnapshot: "TCS 雙語快照",
      sourceMock: "示範資料",
      sourceLiveStatus: "TCS 最新雙語資料",
      sourceMockStatus: "Prototype · 示範資料",
      tcs: "TCS",
      mock: "示範",
      calToday: "回到本月",
      calMore: "項活動",
      modalObjective: "課程目標",
      modalDescription: "活動內容與詳情",
      modalBackground: "背景",
      modalSessions: "活動場次、時間、地點與講者",
      modalSessionId: "場次",
      modalSessionDate: "舉行日期",
      modalSessionTime: "活動時間",
      modalSessionVenue: "地點／模式",
      modalSessionSpeaker: "講者／導師",
      modalSessionQuota: "名額",
      modalSessionDeadline: "截止日期",
      modalSessionRemark: "時間／備註",
      modalMetaDivision: "主辦科別",
      modalMetaMedium: "講授語言",
      modalMetaCpd: "持續專業發展 (CPD)",
      modalMetaAudience: "對象與資助類型",
      modalNoDetail: "暫無額外詳情，請點擊下方按鈕前往 EDB 頁面查看。",
      weekdays: ["日", "一", "二", "三", "四", "五", "六"]
    },
    en: {
      brandSubtitle: "EDB professional learning",
      navIntro: "Intro Home",
      navWorkspace: "Events & Calendar",
      heroEyebrow: "A clearer route to what is next",
      heroTitle: "Find the right learning event, faster.",
      heroDescription: "One focused bilingual view for Hong Kong teachers exploring EDB TCS events with calendar view, rich event details and online/self-paced filters.",
      browseEvents: "Explore Events",
      openCalendarView: "Open Calendar View",
      viewDataContract: "View data contract",
      syncLane: "Sync status",
      syncDescription: "Bilingual TCS pages and course detail popups are captured and classified into self-paced online, live webinar and in-person modes.",
      lastSync: "Last sync",
      totalEventsLabel: "Total events",
      inDatabase: "in snapshot",
      nonLiveEventsLabel: "Online / Self-paced",
      nonLiveContext: "webinars & self-learning",
      closingSoon: "Closing soon",
      withinSevenDays: "within 7 days",
      dataSource: "Data source",
      normalizedSnapshot: "bilingual snapshot",
      featureBilingualTitle: "Full Bilingual Support",
      featureBilingualDesc: "Traditional Chinese by default with instant toggle between Chinese and English titles, audiences and details.",
      featureCalendarTitle: "List & Calendar Views",
      featureCalendarDesc: "Switch seamlessly between a compact scannable list and an interactive monthly calendar.",
      featureModeTitle: "Delivery Mode Filtering",
      featureModeDesc: "Automatically distinguishes Self-paced Online, Live Webinars and In-person attendance.",
      backToIntro: "Back to Intro",
      eventsHeading: "Explore Learning Opportunities",
      listView: "List View",
      calendarView: "Calendar View",
      searchEvents: "Search events",
      searchPlaceholder: "Search by ID, title, topic, subject, venue or audience",
      categoryAll: "All",
      categorySecondary: "Secondary",
      categoryItAi: "IT / AI",
      categoryCsd: "CSD",
      categorySteam: "STEAM",
      filterToggle: "Filters & Profile",
      eventTimeLabel: "Event Time",
      timeAll: "All times",
      timeAm: "AM Only",
      timePm: "PM / After-school",
      timeAfterSchool: "Starts 15:30+",
      startTimeAfter: "Starts at or after:",
      timeAnyLimit: "Any time",
      timeFlexible: "Flexible (Self-paced)",
      timeTba: "See details for time",
      deliveryModeLabel: "Delivery Mode",
      modeAll: "All modes",
      modeNonInPerson: "All Online (Self-paced + Webinar)",
      modeSelfPaced: "Self-paced / Recorded Online",
      modeWebinar: "Live Webinar / Online Talk",
      modeInPerson: "In-person Attendance",
      level: "Level",
      subject: "Subject",
      specificDate: "Specific date",
      deadline: "Deadline",
      sort: "Sort",
      clear: "Reset",
      myProfile: "My teacher profile",
      profileDescription: "Choose your teaching subject and attendance preference to filter relevant events.",
      iTeach: "I teach",
      includeGeneral: "Include non-subject-specific events",
      onlyNonLive: "Only online / non-in-person events",
      noEvents: "No events match this view",
      noEventsDescription: "Try a broader deadline window, another delivery mode or subject, or reset filters.",
      resetFilters: "Reset filters",
      dataContract: "Data contract",
      contractHeading: "A small interface between source and experience.",
      contractDescription: "The UI reads normalized event objects with stable fields for <code>courseId</code>, <code>title</code>, <code>titleZh</code>, <code>deliveryMode</code>, <code>categories</code>, <code>subjectTags</code>, <code>eventStart</code>, <code>eventEnd</code>, <code>closingDate</code> and bilingual <code>details</code>.",
      footerTitle: "TCS Better Calendar · Bilingual Edition",
      footerDescription: "With bilingual details, delivery mode detection & calendar view",
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
      modeSort: "Online / Self-paced first",
      subjectLabel: "Subjects",
      generalSubject: "Non-subject-specific",
      applyBy: "Apply by",
      viewDetails: "Details",
      openEvent: "Apply / Open",
      openEdbDetail: "View original on EDB",
      newBadge: "NEW",
      updatedBadge: "UPDATED",
      closingBadge: "CLOSING SOON",
      showing: "Showing",
      of: "of",
      events: "events",
      sourceTcsSnapshot: "TCS bilingual snapshot",
      sourceMock: "mock dataset",
      sourceLiveStatus: "Live snapshot · TCS source",
      sourceMockStatus: "Prototype · mock data",
      tcs: "TCS",
      mock: "Mock",
      calToday: "This Month",
      calMore: "events",
      modalObjective: "Objective(s)",
      modalDescription: "Programme Description",
      modalBackground: "Background",
      modalSessions: "Sessions, Time, Venue & Speakers",
      modalSessionId: "Session",
      modalSessionDate: "Date",
      modalSessionTime: "Time",
      modalSessionVenue: "Venue / Mode",
      modalSessionSpeaker: "Speaker(s)",
      modalSessionQuota: "Quota",
      modalSessionDeadline: "Closing Date",
      modalSessionRemark: "Time / Remarks",
      modalMetaDivision: "Organising Division",
      modalMetaMedium: "Medium of Instruction",
      modalMetaCpd: "CPD Elements",
      modalMetaAudience: "Target Audience",
      modalNoDetail: "No additional details captured. Click below to view on EDB.",
      weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    }
  };

  const modeDefinitions = [
    { value: "all", key: "modeAll" },
    { value: "non-in-person", key: "modeNonInPerson" },
    { value: "self-paced", key: "modeSelfPaced" },
    { value: "webinar", key: "modeWebinar" },
    { value: "in-person", key: "modeInPerson" }
  ];
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
    { value: "event", key: "eventDate" },
    { value: "closing", key: "closingDate" },
    { value: "newest", key: "newestAdded" },
    { value: "mode", key: "modeSort" }
  ];

  const initialHash = window.location.hash;
  const state = {
    // 預設繁體中文 ('zh')
    locale: storedLanguage === "en" ? "en" : "zh",
    page: initialHash === "#workspace" || initialHash === "#events" || initialHash === "#calendar" ? "workspace" : "intro",
    view: initialHash === "#calendar" ? "calendar" : "list",
    query: "",
    category: "All",
    mode: "all",
    deadline: "all",
    eventDate: "",
    sort: "event",
    level: "all",
    subject: "all",
    profile: subjectDefinitions.some(function (item) { return item.value === storedProfile; }) ? storedProfile : "all",
    includeGeneral: storedGeneral === null ? true : storedGeneral === "true",
    onlyNonLive: storedNonLive === "true",
    calYear: today.getFullYear(),
    calMonth: today.getMonth(),
    selectedCalDate: "",
    activeModalCourseId: "",
    timeSlot: "all",
    minStartMinutes: 480,
    mobileFiltersOpen: false
  };

  const elements = {
    introPage: document.getElementById("intro-page"),
    workspacePage: document.getElementById("workspace-page"),
    brandHome: document.getElementById("brand-home"),
    enterWorkspaceBtn: document.getElementById("enter-workspace-btn"),
    enterCalendarBtn: document.getElementById("enter-calendar-btn"),
    backToIntroBtn: document.getElementById("back-to-intro"),
    listViewContainer: document.getElementById("list-view-container"),
    calendarViewContainer: document.getElementById("calendar-view-container"),
    grid: document.getElementById("event-grid"),
    empty: document.getElementById("empty-state"),
    summary: document.getElementById("results-summary"),
    statTotal: document.getElementById("stat-total"),
    statNonLive: document.getElementById("stat-nonlive"),
    closing: document.getElementById("stat-closing"),
    search: document.getElementById("search-input"),
    mobileFilterToggle: document.getElementById("mobile-filter-toggle"),
    collapsibleFilters: document.getElementById("collapsible-filters"),
    activeFilterCount: document.getElementById("active-filter-count"),
    startTimeSlider: document.getElementById("start-time-slider"),
    startTimeDisplay: document.getElementById("start-time-display"),
    mode: document.getElementById("mode-select"),
    level: document.getElementById("level-select"),
    subject: document.getElementById("subject-select"),
    eventDate: document.getElementById("event-date-input"),
    profile: document.getElementById("profile-select"),
    includeGeneral: document.getElementById("include-general"),
    onlyNonLive: document.getElementById("only-non-live"),
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
    resultsSource: document.getElementById("results-source"),
    calPrevMonth: document.getElementById("cal-prev-month"),
    calNextMonth: document.getElementById("cal-next-month"),
    calTodayBtn: document.getElementById("cal-today-btn"),
    calMonthTitle: document.getElementById("cal-month-title"),
    calWeekdays: document.getElementById("calendar-weekdays"),
    calGrid: document.getElementById("calendar-grid"),
    calDayDrawer: document.getElementById("calendar-day-drawer"),
    dayDrawerTitle: document.getElementById("day-drawer-title"),
    dayDrawerList: document.getElementById("day-drawer-list"),
    closeDayDrawer: document.getElementById("close-day-drawer"),
    detailModal: document.getElementById("detail-modal"),
    modalBadges: document.getElementById("modal-badges"),
    modalTitle: document.getElementById("modal-course-title"),
    modalSubtitle: document.getElementById("modal-course-subtitle"),
    modalBody: document.getElementById("modal-body"),
    modalEdbLink: document.getElementById("modal-edb-link"),
    modalApplyLink: document.getElementById("modal-apply-link"),
    modalCloseBtn: document.getElementById("modal-close-btn")
  };

  function t(key) {
    return translations[state.locale][key] || translations.zh[key] || key;
  }

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

  function daysUntil(iso) {
    if (!iso) return 99999;
    return Math.ceil((asDate(iso).getTime() - today.getTime()) / 86400000);
  }

  function isClosingSoon(event) {
    const days = daysUntil(event.closingDate);
    return days >= 0 && days <= 7;
  }

  function inferDeliveryMode(event) {
    if (event.deliveryMode) return event.deliveryMode;
    const text = [event.title, event.titleZh, event.format, event.formatZh, event.summary].filter(Boolean).join(" ");
    if (/self-learning|recorded|vle|網上自學|網上錄播|網上錄影/i.test(text)) return "self-paced";
    if (/webinar|online|zoom|teams|網上|線上/i.test(text) && !/online application/i.test(text)) return "webinar";
    return "in-person";
  }

  function subjectTagsFor(event) {
    if (Array.isArray(event.subjectTags) && event.subjectTags.length) return event.subjectTags;
    const subject = String(event.subject || "").trim();
    const subjectZh = String(event.subjectZh || "").trim();
    const haystack = [subject, subjectZh, event.title, event.titleZh, event.summary, event.summaryZh].join(" ").toUpperCase();
    const tags = [];
    const general = (!subject && !subjectZh) || /^(ALL|NOT APPLICABLE|全部|不適用)$/i.test(subject || subjectZh);
    if (general) tags.push("general");
    if (/ENGLISH LANGUAGE|ENGLISH TEACH|ENGLISH CLASSROOM|ENGLISH LEARNING|ENGLISH SPEAKING|PRIMARY ENGLISH|SECONDARY ENGLISH|ENGLISH TEACHERS|TEACHERS USING ENGLISH|英語|英文|英國語文/.test(haystack)) tags.push("english");
    if (/CHINESE LANGUAGE|CHINESE LITERATURE|\bCHINESE\b|中國語文|中國文學|中文|普通話/.test(haystack)) tags.push("chinese");
    if (/MATHEMATICS|數學/.test(haystack)) tags.push("mathematics");
    if (/BIOLOGY|CHEMISTRY|PHYSICS|SCIENCE|GENERAL STUDIES|PRIMARY SCIENCE|自然科學|科學|常識|生物|化學|物理/.test(haystack)) tags.push("science");
    if (/ICT|INFORMATION & COMMUNICATION|COMPUTER|CODING|DIGITAL|TECHNOLOGY|AI|A\.I\.|數字教育|資訊科技|人工智能/.test(haystack)) tags.push("ict");
    if (/STEAM|STEM/.test(haystack)) tags.push("steam");
    if (/CITIZENSHIP|SOCIAL DEVELOPMENT|MORAL|NATIONAL EDUCATION|公民|國民教育|價值教育|德育/.test(haystack)) tags.push("values");
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

  function eventTitle(event) {
    if (state.locale === "zh") return event.titleZh || event.title || "";
    return event.title || event.titleZh || "";
  }

  function eventParticipantGroup(event) {
    if (state.locale === "zh") return event.participantGroupZh || event.participantGroup || "";
    return event.participantGroup || event.participantGroupZh || "";
  }

  function eventFormat(event) {
    if (state.locale === "zh") return event.formatZh || event.format || "";
    return event.format || event.formatZh || "";
  }

  function rawSubject(event) {
    const subject = String(state.locale === "zh" ? (event.subjectZh || event.subject || "") : (event.subject || event.subjectZh || "")).trim();
    return !subject || /^(ALL|NOT APPLICABLE|全部|不適用)$/i.test(subject) ? t("generalSubject") : subject;
  }

  function levelKeys(event) {
    const level = [event.level, event.levelZh, event.participantGroup, event.participantGroupZh].join(" ").toUpperCase();
    const keys = [];
    if (/PRIMARY|小學/.test(level)) keys.push("primary");
    if (/SECONDARY|中學/.test(level)) keys.push("secondary");
    if (/KINDERGARTEN|幼稚園/.test(level)) keys.push("kindergarten");
    if (/SPECIAL|特殊/.test(level)) keys.push("special");
    return keys;
  }

  function parseClockToMinutes(clockStr) {
    const m = String(clockStr || "").match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    return Number(m[1]) * 60 + Number(m[2]);
  }

  function minutesToClock(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  function computeActiveSchedule(event) {
    const rawSessions = (event.details && (event.details.zh?.sessions || event.details.en?.sessions)) || [];
    const rangeRegex = /(\d{4})\/(\d{2})\/(\d{2})(?:\s*\([^)]*\))?(?:\s*-\s*(\d{4})\/(\d{2})\/(\d{2}))?/g;
    const validRanges = [];
    const validClosingDates = [];
    const activeTimes = [];
    const activeStartMinutesList = [];
    const activeEndMinutesList = [];

    if (rawSessions.length) {
      rawSessions.forEach(function (s) {
        const sClosing = (s.closingDate || "").replaceAll("/", "-").match(/\d{4}-\d{2}-\d{2}/)?.[0] || event.closingDateEnd || event.closingDate || "";
        if (sClosing && sClosing < todayIso) return; // 此場次報名截止日已過，自動略過
        if (sClosing) validClosingDates.push(sClosing);

        if (s.time && !activeTimes.includes(s.time)) activeTimes.push(s.time);
        const sMin = parseClockToMinutes(s.startTime);
        const eMin = parseClockToMinutes(s.endTime);
        if (sMin !== null) activeStartMinutesList.push(sMin);
        if (eMin !== null) activeEndMinutesList.push(eMin);

        let m;
        rangeRegex.lastIndex = 0;
        while ((m = rangeRegex.exec(String(s.date || ""))) !== null) {
          const startIso = `${m[1]}-${m[2]}-${m[3]}`;
          const endIso = m[4] ? `${m[4]}-${m[5]}-${m[6]}` : startIso;
          if (endIso >= todayIso) {
            validRanges.push({ start: startIso, end: endIso, time: s.time || "", startTime: s.startTime || "", endTime: s.endTime || "" });
          }
        }
      });
    }

    if (!validRanges.length) {
      const period = String(event.eventPeriod || "");
      let m;
      rangeRegex.lastIndex = 0;
      while ((m = rangeRegex.exec(period)) !== null) {
        const startIso = `${m[1]}-${m[2]}-${m[3]}`;
        const endIso = m[4] ? `${m[4]}-${m[5]}-${m[6]}` : startIso;
        if (endIso >= todayIso) {
          validRanges.push({ start: startIso, end: endIso, time: event.timeSummary || "", startTime: event.startTime || "", endTime: event.endTime || "" });
        }
      }
    }

    if (!validRanges.length && event.eventStart) {
      const endIso = event.eventEnd || event.eventStart;
      if (endIso >= todayIso) {
        validRanges.push({ start: event.eventStart, end: endIso, time: event.timeSummary || "", startTime: event.startTime || "", endTime: event.endTime || "" });
      }
    }

    if (!activeStartMinutesList.length && event.startTime) {
      const sMin = parseClockToMinutes(event.startTime);
      if (sMin !== null) activeStartMinutesList.push(sMin);
    }
    if (!activeEndMinutesList.length && event.endTime) {
      const eMin = parseClockToMinutes(event.endTime);
      if (eMin !== null) activeEndMinutesList.push(eMin);
    }

    const fallbackClosing = [event.closingDate, event.closingDateEnd]
      .filter(function (d) { return d && d >= todayIso; })
      .sort()[0] || "";
    const activeClosingDate = validClosingDates.sort()[0] || fallbackClosing;
    const sortedStarts = validRanges.map(function (r) { return r.start; }).sort();
    const sortedEnds = validRanges.map(function (r) { return r.end; }).sort();
    const startMins = activeStartMinutesList.length ? Math.min.apply(null, activeStartMinutesList) : null;
    const endMins = activeEndMinutesList.length ? Math.max.apply(null, activeEndMinutesList) : null;

    return {
      isExpired: !activeClosingDate || validRanges.length === 0,
      activeClosingDate: activeClosingDate,
      activeEventStart: sortedStarts[0] || event.eventStart || "",
      activeEventEnd: sortedEnds[sortedEnds.length - 1] || sortedStarts[0] || event.eventEnd || "",
      activeRanges: validRanges,
      activeTimeSummary: activeTimes.slice(0, 2).join(" · ") || event.timeSummary || "",
      activeStartMinutes: startMins,
      activeEndMinutes: endMins,
      activeStartMinutesList: activeStartMinutesList,
      activeEndMinutesList: activeEndMinutesList
    };
  }

  const events = sourceEvents.map(function (event) {
    const schedule = computeActiveSchedule(event);
    return Object.assign({}, event, {
      subjectTags: subjectTagsFor(event),
      deliveryMode: inferDeliveryMode(event),
      closingDate: schedule.activeClosingDate || event.closingDate,
      eventStart: schedule.activeEventStart || event.eventStart,
      eventEnd: schedule.activeEventEnd || event.eventEnd,
      activeRanges: schedule.activeRanges,
      timeSummary: schedule.activeTimeSummary,
      startMinutes: schedule.activeStartMinutes,
      endMinutes: schedule.activeEndMinutes,
      startMinutesList: schedule.activeStartMinutesList,
      endMinutesList: schedule.activeEndMinutesList,
      isExpired: schedule.isExpired
    });
  }).filter(function (event) {
    // 自動隱藏報名截止日已過的活動
    return !event.isExpired && event.closingDate >= todayIso;
  });

  function applyTranslations() {
    document.documentElement.lang = state.locale === "zh" ? "zh-HK" : "en-HK";
    document.querySelectorAll("[data-i18n]").forEach(function (node) { node.textContent = t(node.dataset.i18n); });
    document.querySelectorAll("[data-i18n-html]").forEach(function (node) { node.innerHTML = t(node.dataset.i18nHtml); });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (node) { node.placeholder = t(node.dataset.i18nPlaceholder); });
    document.querySelectorAll("[data-language]").forEach(function (button) { button.classList.toggle("is-active", button.dataset.language === state.locale); });
  }

  function populateSelect(element, definitions) {
    if (!element) return;
    const current = element.value;
    element.innerHTML = definitions.map(function (definition) {
      return '<option value="' + escapeHtml(definition.value) + '">' + escapeHtml(t(definition.key)) + "</option>";
    }).join("");
    element.value = definitions.some(function (item) { return item.value === current; }) ? current : definitions[0].value;
  }

  function populateControls() {
    populateSelect(elements.mode, modeDefinitions);
    populateSelect(elements.level, levelDefinitions);
    populateSelect(elements.subject, subjectDefinitions);
    populateSelect(elements.profile, subjectDefinitions);
    populateSelect(elements.deadline, deadlineDefinitions);
    populateSelect(elements.sort, sortDefinitions);
    elements.mode.value = state.mode;
    elements.level.value = state.level;
    elements.subject.value = state.subject;
    elements.profile.value = state.profile;
    elements.deadline.value = state.deadline;
    elements.sort.value = state.sort;
    elements.includeGeneral.checked = state.includeGeneral;
    elements.onlyNonLive.checked = state.onlyNonLive;
  }

  function categoryLabel(category) {
    const keys = { All: "categoryAll", Secondary: "categorySecondary", "IT/AI": "categoryItAi", CSD: "categoryCsd", STEAM: "categorySteam" };
    return keys[category] ? t(keys[category]) : category;
  }

  function modeBadgeHtml(event) {
    const mode = event.deliveryMode || "in-person";
    if (mode === "self-paced") {
      return '<span class="badge badge-mode-self">' + escapeHtml(t("modeSelfPaced")) + "</span>";
    }
    if (mode === "webinar") {
      return '<span class="badge badge-mode-webinar">' + escapeHtml(t("modeWebinar")) + "</span>";
    }
    return '<span class="badge badge-mode-person">' + escapeHtml(t("modeInPerson")) + "</span>";
  }

  function getBadges(event) {
    const badges = [modeBadgeHtml(event)];
    if (event.badge === "NEW") badges.push('<span class="badge badge-new">' + escapeHtml(t("newBadge")) + "</span>");
    if (event.badge === "UPDATED") badges.push('<span class="badge badge-updated">' + escapeHtml(t("updatedBadge")) + "</span>");
    if (isClosingSoon(event)) badges.push('<span class="badge badge-closing">' + escapeHtml(t("closingBadge")) + "</span>");
    return badges.join("");
  }

  function matchesMode(event) {
    const mode = event.deliveryMode || "in-person";
    if (state.onlyNonLive && mode === "in-person") return false;
    if (state.mode === "all") return true;
    if (state.mode === "non-in-person") return mode === "self-paced" || mode === "webinar";
    return mode === state.mode;
  }

  function matchesTime(event) {
    const slot = state.timeSlot;
    const minMins = Number(state.minStartMinutes) || 480;
    const isFilteringByTime = slot !== "all" || minMins > 480;
    if (!isFilteringByTime) return true;

    const starts = Array.isArray(event.startMinutesList) && event.startMinutesList.length
      ? event.startMinutesList
      : (event.startMinutes != null ? [event.startMinutes] : []);
    const ends = Array.isArray(event.endMinutesList) && event.endMinutesList.length
      ? event.endMinutesList
      : (event.endMinutes != null ? [event.endMinutes] : []);

    // 若用戶啟用了時間篩選，只保留具備對應開始時間的活動
    if (!starts.length) return false;

    if (minMins > 480) {
      const hasSessionAfterMin = starts.some(function (sMin) { return sMin >= minMins; });
      if (!hasSessionAfterMin) return false;
    }

    if (slot === "am") {
      // 上午活動：開始時間 < 12:00 (720 mins)，且結束時間 <= 13:30 (810 mins)
      return starts.some(function (sMin, idx) {
        const eMin = ends[idx] != null ? ends[idx] : sMin + 180;
        return sMin < 720 && eMin <= 810;
      });
    }
    if (slot === "pm") {
      // 下午／課後活動：開始時間 >= 12:00 (720 mins)
      return starts.some(function (sMin) { return sMin >= 720; });
    }
    if (slot === "after-school") {
      // 放學後活動：開始時間 >= 15:30 (930 mins)
      return starts.some(function (sMin) { return sMin >= 930; });
    }
    return true;
  }

  function matches(event, ignoreSpecificDate) {
    const query = state.query.trim().toLowerCase();
    const tags = subjectTagsFor(event);
    const searchText = [
      event.courseId,
      event.title,
      event.titleZh,
      event.summary,
      event.summaryZh,
      event.category,
      (event.categories || []).join(" "),
      event.subject,
      event.subjectZh,
      tags.map(subjectLabel).join(" "),
      event.level,
      event.levelZh,
      event.participantGroup,
      event.participantGroupZh,
      event.format,
      event.formatZh,
      event.timeSummary
    ].filter(Boolean).join(" ").toLowerCase();
    const categoryMatch = state.category === "All" || (event.categories || [event.category]).includes(state.category) || event.category === state.category;
    const profileMatch = state.profile === "all" || tags.includes(state.profile) || (state.includeGeneral && tags.includes("general"));
    const subjectMatch = state.subject === "all" || tags.includes(state.subject);
    const levelMatch = state.level === "all" || levelKeys(event).includes(state.level);
    const modeMatch = matchesMode(event);
    const timeMatch = matchesTime(event);
    const eventDateMatch = ignoreSpecificDate || !state.eventDate || (
      Array.isArray(event.activeRanges) && event.activeRanges.length
        ? event.activeRanges.some(function (r) { return state.eventDate >= r.start && state.eventDate <= r.end; })
        : (event.eventStart && event.eventEnd && state.eventDate >= event.eventStart && state.eventDate <= event.eventEnd)
    );
    const days = daysUntil(event.closingDate);
    const windowMatch = days >= 0 && (state.deadline === "all" || days <= Number(state.deadline));
    return categoryMatch && profileMatch && subjectMatch && levelMatch && modeMatch && timeMatch && eventDateMatch && windowMatch && (!query || searchText.indexOf(query) !== -1);
  }

  function modeRank(mode) {
    if (mode === "self-paced") return 0;
    if (mode === "webinar") return 1;
    return 2;
  }

  function getVisibleEvents(ignoreSpecificDate) {
    return events.filter(function (ev) { return matches(ev, ignoreSpecificDate); }).sort(function (a, b) {
      if (state.sort === "mode") {
        const diff = modeRank(a.deliveryMode) - modeRank(b.deliveryMode);
        if (diff !== 0) return diff;
      }
      if (state.sort === "closing") return asDate(a.closingDate) - asDate(b.closingDate);
      if (state.sort === "newest") return asDate(b.lastUpdated) - asDate(a.lastUpdated);
      // 預設按活動舉行日期（Event Date）排序
      return asDate(a.eventStart) - asDate(b.eventStart);
    });
  }

  function formatEventTimeLabel(event) {
    if (event.timeSummary) return event.timeSummary;
    if (event.startTime && event.endTime) return event.startTime + " - " + event.endTime;
    if (event.deliveryMode === "self-paced") return t("timeFlexible");
    return "";
  }

  function listTemplate(event) {
    const tags = subjectTagsFor(event);
    const visibleTags = tags.length ? tags : ["general"];
    const subjectTags = visibleTags.map(function (tag) {
      return '<span class="subject-tag" data-subject="' + escapeHtml(tag) + '">' + escapeHtml(subjectLabel(tag)) + "</span>";
    }).join("");
    const originalSubject = rawSubject(event);
    const originalSubjectHtml = originalSubject === t("generalSubject") ? "" : '<span class="subject-original" title="' + escapeHtml(originalSubject) + '">' + escapeHtml(originalSubject) + "</span>";
    const applyHref = state.locale === "zh" && event.applyUrl
      ? event.applyUrl.replace("lang=en", "lang=zh")
      : (event.applyUrl || event.sourceUrl || "https://tcs.edb.gov.hk/");
    const soon = isClosingSoon(event);
    const title = eventTitle(event);
    const metaLine = [eventParticipantGroup(event), eventFormat(event)].filter(Boolean).join(" · ");
    const timeLabel = formatEventTimeLabel(event);
    const timeHtml = timeLabel ? '<span class="row-time-badge">◷ ' + escapeHtml(timeLabel) + "</span>" : "";

    return '<article class="event-row" data-course-id="' + escapeHtml(event.courseId) + '">' +
      '<div class="row-date"><span class="row-date-label">' + escapeHtml(t("eventDate")) + "</span><strong>" + escapeHtml(formatDate(event.eventStart, false)) + "</strong><span>" + escapeHtml(event.eventStart !== event.eventEnd ? "→ " + formatDate(event.eventEnd, false) : "") + "</span>" + timeHtml + "</div>" +
      '<div class="row-main"><div class="row-heading"><span class="category-label" data-category="' + escapeHtml(event.category) + '">' + escapeHtml(categoryLabel(event.category)) + "</span>" + getBadges(event) + '<span class="event-id">' + escapeHtml(event.courseId) + "</span></div>" +
      '<h3><button type="button" class="row-title-btn" data-detail-id="' + escapeHtml(event.courseId) + '">' + escapeHtml(title) + "</button></h3>" +
      '<div class="event-subjects"><span class="detail-label">' + escapeHtml(t("subjectLabel")) + '</span><span class="subject-tag-list">' + subjectTags + "</span>" + originalSubjectHtml + "</div>" +
      '<p class="row-meta">' + escapeHtml(metaLine) + "</p></div>" +
      '<div class="row-deadline"><span class="deadline-label">' + escapeHtml(t("applyBy")) + '</span><strong class="deadline-date ' + (soon ? "is-soon" : "") + '">' + escapeHtml(formatDate(event.closingDate, true)) + '</strong>' +
      '<div class="row-actions">' +
      '<button type="button" class="detail-btn" data-detail-id="' + escapeHtml(event.courseId) + '">' + escapeHtml(t("viewDetails")) + "</button>" +
      '<a class="card-link" href="' + escapeHtml(applyHref) + '" target="_blank" rel="noreferrer">' + escapeHtml(t("openEvent")) + " ↗</a>" +
      "</div></div>" +
      "</article>";
  }

  function parseEventActiveDates(event, year, month) {
    const monthPrefix = String(year) + "-" + String(month + 1).padStart(2, "0");
    const activeDays = new Set();
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    const ranges = Array.isArray(event.activeRanges) && event.activeRanges.length
      ? event.activeRanges
      : (event.eventStart ? [{ start: event.eventStart, end: event.eventEnd || event.eventStart }] : []);

    ranges.forEach(function (range) {
      const sParts = range.start.split("-").map(Number);
      const eParts = (range.end || range.start).split("-").map(Number);
      const sDate = new Date(sParts[0], sParts[1] - 1, sParts[2]);
      const eDate = new Date(eParts[0], eParts[1] - 1, eParts[2]);
      const spanDays = Math.round((eDate - sDate) / 86400000);

      // 若為長達 14 日以上的網上自學期，於月曆標示該活動的開始日與結束日
      if (spanDays > 14) {
        if (range.start.startsWith(monthPrefix)) activeDays.add(range.start);
        if (range.end && range.end.startsWith(monthPrefix)) activeDays.add(range.end);
      } else {
        const cur = new Date(Math.max(sDate.getTime(), monthStart.getTime()));
        const end = new Date(Math.min(eDate.getTime(), monthEnd.getTime()));
        while (cur <= end) {
          const iso = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`;
          activeDays.add(iso);
          cur.setDate(cur.getDate() + 1);
        }
      }
    });

    return [...activeDays];
  }

  function renderCalendar(filteredEvents) {
    const year = state.calYear;
    const month = state.calMonth;
    const monthDate = new Date(year, month, 1);
    elements.calMonthTitle.textContent = new Intl.DateTimeFormat(state.locale === "zh" ? "zh-HK" : "en-HK", {
      year: "numeric",
      month: "long"
    }).format(monthDate);

    const weekdays = translations[state.locale].weekdays || translations.zh.weekdays;
    elements.calWeekdays.innerHTML = weekdays.map(function (d) {
      return '<div class="cal-weekday">' + escapeHtml(d) + "</div>";
    }).join("");

    const firstDayIndex = monthDate.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const dayMap = new Map();
    for (let d = 1; d <= daysInMonth; d += 1) {
      const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      dayMap.set(iso, []);
    }

    filteredEvents.forEach(function (ev) {
      const dates = parseEventActiveDates(ev, year, month);
      dates.forEach(function (iso) {
        if (dayMap.has(iso)) dayMap.get(iso).push(ev);
      });
    });

    const cells = [];
    for (let i = 0; i < firstDayIndex; i += 1) {
      cells.push('<div class="cal-cell is-empty"></div>');
    }

    for (let d = 1; d <= daysInMonth; d += 1) {
      const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayEvents = dayMap.get(iso) || [];
      const isToday = iso === todayIso;
      const isSelected = iso === state.selectedCalDate;
      const previewItems = dayEvents.slice(0, 3).map(function (ev) {
        const modeClass = "cal-pill-" + (ev.deliveryMode || "in-person");
        const shortTime = ev.startTime ? ev.startTime + " " : "";
        return '<button type="button" class="cal-event-pill ' + modeClass + '" data-detail-id="' + escapeHtml(ev.courseId) + '" title="' + escapeHtml((shortTime + eventTitle(ev)).trim()) + '">' +
          (shortTime ? '<span class="cal-pill-time">' + escapeHtml(ev.startTime) + "</span> " : "") +
          escapeHtml(eventTitle(ev)) +
          "</button>";
      }).join("");
      const moreHtml = dayEvents.length > 3
        ? '<button type="button" class="cal-more-btn" data-cal-date="' + iso + '">+' + (dayEvents.length - 3) + " " + escapeHtml(t("calMore")) + "</button>"
        : "";
      const mobileDotsHtml = dayEvents.slice(0, 5).map(function (ev) {
        return '<i class="cal-dot dot-' + escapeHtml(ev.deliveryMode || "in-person") + '"></i>';
      }).join("");

      cells.push(
        '<div class="cal-cell' + (isToday ? " is-today" : "") + (isSelected ? " is-selected" : "") + (dayEvents.length ? " has-events" : "") + '" data-cal-date="' + iso + '">' +
        '<div class="cal-cell-header">' +
        '<button type="button" class="cal-day-num" data-cal-date="' + iso + '">' + d + "</button>" +
        (dayEvents.length ? '<span class="cal-day-count">' + dayEvents.length + "</span>" : "") +
        "</div>" +
        '<div class="cal-cell-dots" aria-hidden="true">' + mobileDotsHtml + "</div>" +
        '<div class="cal-cell-events">' + previewItems + moreHtml + "</div>" +
        "</div>"
      );
    }

    elements.calGrid.innerHTML = cells.join("");

    // 若用戶未選取日期或選取日期不在本月，預設選取今天（如在本月且有活動）或本月第一個有活動的日子
    if (!state.selectedCalDate || !dayMap.has(state.selectedCalDate)) {
      if (dayMap.has(todayIso) && (dayMap.get(todayIso) || []).length > 0) {
        state.selectedCalDate = todayIso;
      } else {
        for (const [k, list] of dayMap.entries()) {
          if (list.length > 0) {
            state.selectedCalDate = k;
            break;
          }
        }
      }
    }

    if (state.selectedCalDate && dayMap.has(state.selectedCalDate)) {
      const dayEvents = dayMap.get(state.selectedCalDate) || [];
      elements.calDayDrawer.hidden = false;
      elements.dayDrawerTitle.textContent = formatDate(state.selectedCalDate, true) + " (" + dayEvents.length + " " + t("events") + ")";
      elements.dayDrawerList.innerHTML = dayEvents.length
        ? dayEvents.map(listTemplate).join("")
        : '<p class="drawer-empty">' + escapeHtml(t("noEvents")) + "</p>";
    } else {
      elements.calDayDrawer.hidden = true;
    }
  }

  function openDetailModal(courseId) {
    const event = events.find(function (item) { return item.courseId === courseId; });
    if (!event) return;
    state.activeModalCourseId = courseId;

    const locDetail = event.details ? (state.locale === "zh" ? (event.details.zh || event.details.en) : (event.details.en || event.details.zh)) : null;
    elements.modalBadges.innerHTML = '<span class="category-label" data-category="' + escapeHtml(event.category) + '">' + escapeHtml(categoryLabel(event.category)) + "</span>" +
      getBadges(event) +
      '<span class="event-id">' + escapeHtml(event.courseId) + "</span>";
    elements.modalTitle.textContent = eventTitle(event);
    elements.modalSubtitle.textContent = [
      locDetail && locDetail.organisingDivision ? locDetail.organisingDivision : "",
      eventParticipantGroup(event)
    ].filter(Boolean).join(" · ");

    const sectionsHtml = [];

    // Summary meta chips
    const metaItems = [];
    const timeLabel = formatEventTimeLabel(event);
    if (timeLabel) {
      metaItems.push('<div class="modal-meta-card"><span>' + escapeHtml(t("eventTimeLabel")) + "</span><strong>◷ " + escapeHtml(timeLabel) + "</strong></div>");
    }
    if (locDetail && locDetail.medium) {
      metaItems.push('<div class="modal-meta-card"><span>' + escapeHtml(t("modalMetaMedium")) + "</span><strong>" + escapeHtml(locDetail.medium) + "</strong></div>");
    }
    if (locDetail && locDetail.cpd) {
      metaItems.push('<div class="modal-meta-card"><span>' + escapeHtml(t("modalMetaCpd")) + "</span><strong>" + escapeHtml(locDetail.cpd) + "</strong></div>");
    }
    metaItems.push('<div class="modal-meta-card"><span>' + escapeHtml(t("applyBy")) + "</span><strong>" + escapeHtml(formatDate(event.closingDate, true)) + "</strong></div>");
    sectionsHtml.push('<div class="modal-meta-grid">' + metaItems.join("") + "</div>");

    if (locDetail) {
      if (locDetail.objective) {
        sectionsHtml.push(
          '<div class="modal-section"><h4>' + escapeHtml(t("modalObjective")) + "</h4>" +
          '<div class="modal-text">' + escapeHtml(locDetail.objective).replace(/\n/g, "<br>") + "</div></div>"
        );
      }
      if (locDetail.description) {
        sectionsHtml.push(
          '<div class="modal-section"><h4>' + escapeHtml(t("modalDescription")) + "</h4>" +
          '<div class="modal-text">' + escapeHtml(locDetail.description).replace(/\n/g, "<br>") + "</div></div>"
        );
      }
      if (locDetail.background) {
        sectionsHtml.push(
          '<div class="modal-section"><h4>' + escapeHtml(t("modalBackground")) + "</h4>" +
          '<div class="modal-text">' + escapeHtml(locDetail.background).replace(/\n/g, "<br>") + "</div></div>"
        );
      }
      if (Array.isArray(locDetail.sessions) && locDetail.sessions.length) {
        const activeSessions = locDetail.sessions.filter(function (s) {
          const sClosing = (s.closingDate || "").replaceAll("/", "-").match(/\d{4}-\d{2}-\d{2}/)?.[0] || "";
          return !sClosing || sClosing >= todayIso;
        });
        const sessionsToRender = activeSessions.length ? activeSessions : locDetail.sessions;
        const rows = sessionsToRender.map(function (s) {
          const sessionTitle = s.sessionNo ? (s.eventId + " (#" + s.sessionNo + ")") : s.eventId;
          const sTime = s.time || (s.startTime && s.endTime ? (s.startTime + " - " + s.endTime) : "—");
          return "<tr>" +
            '<td data-label="' + escapeHtml(t("modalSessionId")) + '"><strong>' + escapeHtml(sessionTitle) + "</strong></td>" +
            '<td data-label="' + escapeHtml(t("modalSessionDate")) + '">' + escapeHtml(s.date) + "</td>" +
            '<td data-label="' + escapeHtml(t("modalSessionTime")) + '"><span class="session-time-pill">' + escapeHtml(sTime) + "</span></td>" +
            '<td data-label="' + escapeHtml(t("modalSessionVenue")) + '">' + escapeHtml(s.venue).replace(/\n/g, "<br>") + "</td>" +
            '<td data-label="' + escapeHtml(t("modalSessionSpeaker")) + '">' + escapeHtml(s.speaker).replace(/\n/g, "<br>") + "</td>" +
            '<td data-label="' + escapeHtml(t("modalSessionQuota")) + '">' + escapeHtml(s.quota) + "</td>" +
            '<td data-label="' + escapeHtml(t("modalSessionDeadline")) + '">' + escapeHtml(s.closingDate) + "</td>" +
            '<td data-label="' + escapeHtml(t("modalSessionRemark")) + '">' + escapeHtml(s.remark || "—").replace(/\n/g, "<br>") + "</td>" +
            "</tr>";
        }).join("");
        sectionsHtml.push(
          '<div class="modal-section"><h4>' + escapeHtml(t("modalSessions")) + "</h4>" +
          '<div class="modal-table-wrap"><table class="modal-sessions-table">' +
          "<thead><tr>" +
          "<th>" + escapeHtml(t("modalSessionId")) + "</th>" +
          "<th>" + escapeHtml(t("modalSessionDate")) + "</th>" +
          "<th>" + escapeHtml(t("modalSessionTime")) + "</th>" +
          "<th>" + escapeHtml(t("modalSessionVenue")) + "</th>" +
          "<th>" + escapeHtml(t("modalSessionSpeaker")) + "</th>" +
          "<th>" + escapeHtml(t("modalSessionQuota")) + "</th>" +
          "<th>" + escapeHtml(t("modalSessionDeadline")) + "</th>" +
          "<th>" + escapeHtml(t("modalSessionRemark")) + "</th>" +
          "</tr></thead><tbody>" + rows + "</tbody></table></div></div>"
        );
      }
    } else {
      sectionsHtml.push('<p class="modal-empty">' + escapeHtml(t("modalNoDetail")) + "</p>");
    }

    elements.modalBody.innerHTML = sectionsHtml.join("");

    const edbUrl = state.locale === "zh"
      ? (event.detailUrlZh || `https://tcs.edb.gov.hk/tcs/admin/courses/previewCourse/forPortal.htm?courseId=${encodeURIComponent(event.courseId)}&lang=zh`)
      : (event.detailUrlEn || `https://tcs.edb.gov.hk/tcs/admin/courses/previewCourse/forPortal.htm?courseId=${encodeURIComponent(event.courseId)}&lang=en`);
    const applyUrl = state.locale === "zh" && event.applyUrl
      ? event.applyUrl.replace("lang=en", "lang=zh")
      : (event.applyUrl || edbUrl);

    elements.modalEdbLink.href = edbUrl;
    elements.modalApplyLink.href = applyUrl;
    elements.detailModal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeDetailModal() {
    elements.detailModal.hidden = true;
    state.activeModalCourseId = "";
    document.body.style.overflow = "";
  }

  function setPage(page, viewOverride) {
    state.page = page === "workspace" ? "workspace" : "intro";
    if (viewOverride) state.view = viewOverride;
    elements.introPage.hidden = state.page !== "intro";
    elements.workspacePage.hidden = state.page !== "workspace";
    document.querySelectorAll("[data-page]").forEach(function (btn) {
      btn.classList.toggle("is-active", btn.dataset.page === state.page);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
    render();
  }

  function setView(view) {
    state.view = view === "calendar" ? "calendar" : "list";
    document.querySelectorAll("[data-view]").forEach(function (btn) {
      const active = btn.dataset.view === state.view;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", String(active));
    });
    elements.listViewContainer.hidden = state.view !== "list";
    elements.calendarViewContainer.hidden = state.view !== "calendar";
    render();
  }

  function countActiveAdvancedFilters() {
    let count = 0;
    if (state.mode !== "all") count += 1;
    if (state.level !== "all") count += 1;
    if (state.subject !== "all") count += 1;
    if (state.eventDate) count += 1;
    if (state.deadline !== "all") count += 1;
    if (state.profile !== "all") count += 1;
    if (state.onlyNonLive) count += 1;
    return count;
  }

  function render() {
    applyTranslations();
    populateControls();

    elements.introPage.hidden = state.page !== "intro";
    elements.workspacePage.hidden = state.page !== "workspace";
    document.querySelectorAll("[data-page]").forEach(function (btn) {
      btn.classList.toggle("is-active", btn.dataset.page === state.page);
    });
    document.querySelectorAll("[data-view]").forEach(function (btn) {
      const active = btn.dataset.view === state.view;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", String(active));
    });
    document.querySelectorAll("[data-timeslot]").forEach(function (btn) {
      btn.classList.toggle("is-active", btn.dataset.timeslot === state.timeSlot);
    });
    if (elements.startTimeSlider) {
      elements.startTimeSlider.value = String(state.minStartMinutes);
    }
    if (elements.startTimeDisplay) {
      elements.startTimeDisplay.textContent = state.minStartMinutes <= 480
        ? t("timeAnyLimit")
        : minutesToClock(state.minStartMinutes) + "+";
    }
    if (elements.collapsibleFilters && elements.mobileFilterToggle) {
      elements.collapsibleFilters.classList.toggle("is-open", state.mobileFiltersOpen);
      elements.mobileFilterToggle.classList.toggle("is-open", state.mobileFiltersOpen);
      elements.mobileFilterToggle.setAttribute("aria-expanded", String(state.mobileFiltersOpen));
    }
    if (elements.activeFilterCount) {
      const advCount = countActiveAdvancedFilters();
      elements.activeFilterCount.hidden = advCount === 0;
      elements.activeFilterCount.textContent = String(advCount);
    }
    elements.listViewContainer.hidden = state.view !== "list";
    elements.calendarViewContainer.hidden = state.view !== "calendar";

    const visibleEvents = getVisibleEvents(false);
    const closingCount = events.filter(isClosingSoon).length;
    const nonLiveCount = events.filter(function (e) { return e.deliveryMode === "self-paced" || e.deliveryMode === "webinar"; }).length;

    if (elements.statTotal) elements.statTotal.textContent = String(events.length);
    if (elements.statNonLive) elements.statNonLive.textContent = String(nonLiveCount);
    if (elements.closing) elements.closing.textContent = String(closingCount).padStart(2, "0");

    elements.grid.innerHTML = visibleEvents.map(listTemplate).join("");
    elements.grid.hidden = visibleEvents.length === 0;
    elements.empty.hidden = visibleEvents.length !== 0;

    elements.summary.textContent = t("showing") + " " + visibleEvents.length + " " + t("of") + " " + events.length + " " + t("events");
    elements.sourceStatus.textContent = isLive ? t("sourceLiveStatus") : t("sourceMockStatus");
    elements.resultsSource.innerHTML = '<span class="source-led"></span> ' + escapeHtml(isLive ? t("sourceTcsSnapshot") + " · " + (dataMeta.downloadedPages || "") + " pages" : t("sourceMock"));
    if (elements.statSource) elements.statSource.textContent = isLive ? t("tcs") : t("mock");
    if (isLive && dataMeta.finishedAt && elements.syncNote) {
      elements.syncNote.textContent = formatDate(dataMeta.finishedAt.slice(0, 10), true) + " · " + new Intl.DateTimeFormat(state.locale === "zh" ? "zh-HK" : "en-HK", { hour: "2-digit", minute: "2-digit" }).format(new Date(dataMeta.finishedAt));
    }

    if (state.view === "calendar") {
      renderCalendar(getVisibleEvents(true));
    }

    if (state.activeModalCourseId && !elements.detailModal.hidden) {
      openDetailModal(state.activeModalCourseId);
    }
  }

  function resetFilters() {
    state.query = "";
    state.category = "All";
    state.mode = "all";
    state.deadline = "all";
    state.eventDate = "";
    state.sort = "event";
    state.level = "all";
    state.subject = "all";
    state.timeSlot = "all";
    state.minStartMinutes = 480;
    state.onlyNonLive = false;
    if (window.localStorage) localStorage.setItem("tcs-only-non-live", "false");
    elements.search.value = "";
    elements.eventDate.value = "";
    if (elements.startTimeSlider) elements.startTimeSlider.value = "480";
    document.querySelectorAll("[data-category]").forEach(function (button) { button.classList.toggle("is-active", button.dataset.category === "All"); });
    document.querySelectorAll("[data-timeslot]").forEach(function (button) { button.classList.toggle("is-active", button.dataset.timeslot === "all"); });
    render();
  }

  function setLanguage(locale) {
    state.locale = locale === "en" ? "en" : "zh";
    if (window.localStorage) localStorage.setItem("tcs-language", state.locale);
    render();
  }

  // Page & View navigation listeners
  document.querySelectorAll("[data-page]").forEach(function (btn) {
    btn.addEventListener("click", function () { setPage(btn.dataset.page); });
  });
  elements.brandHome.addEventListener("click", function (e) {
    e.preventDefault();
    setPage("intro");
  });
  elements.enterWorkspaceBtn.addEventListener("click", function () {
    setPage("workspace", "list");
  });
  elements.enterCalendarBtn.addEventListener("click", function () {
    setPage("workspace", "calendar");
  });
  elements.backToIntroBtn.addEventListener("click", function () {
    setPage("intro");
  });
  document.querySelectorAll("[data-view]").forEach(function (btn) {
    btn.addEventListener("click", function () { setView(btn.dataset.view); });
  });

  // Language & Filter listeners
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
  document.querySelectorAll("[data-timeslot]").forEach(function (button) {
    button.addEventListener("click", function () {
      state.timeSlot = button.dataset.timeslot;
      if (state.timeSlot === "after-school" && state.minStartMinutes < 930) {
        state.minStartMinutes = 930;
      } else if (state.timeSlot === "pm" && state.minStartMinutes < 720) {
        state.minStartMinutes = 720;
      } else if (state.timeSlot === "am" || state.timeSlot === "all") {
        state.minStartMinutes = 480;
      }
      render();
    });
  });
  if (elements.startTimeSlider) {
    elements.startTimeSlider.addEventListener("input", function (event) {
      state.minStartMinutes = Number(event.target.value) || 480;
      if (state.minStartMinutes > 480 && state.timeSlot === "am") {
        state.timeSlot = "all";
      }
      render();
    });
  }
  if (elements.mobileFilterToggle) {
    elements.mobileFilterToggle.addEventListener("click", function () {
      state.mobileFiltersOpen = !state.mobileFiltersOpen;
      render();
    });
  }
  elements.search.addEventListener("input", function (event) { state.query = event.target.value; render(); });
  elements.mode.addEventListener("change", function (event) { state.mode = event.target.value; render(); });
  elements.level.addEventListener("change", function (event) { state.level = event.target.value; render(); });
  elements.subject.addEventListener("change", function (event) { state.subject = event.target.value; render(); });
  elements.eventDate.addEventListener("change", function (event) {
    state.eventDate = event.target.value;
    if (state.eventDate) {
      const parts = state.eventDate.split("-");
      state.calYear = Number(parts[0]);
      state.calMonth = Number(parts[1]) - 1;
      state.selectedCalDate = state.eventDate;
    }
    render();
  });
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
  elements.onlyNonLive.addEventListener("change", function (event) {
    state.onlyNonLive = event.target.checked;
    if (window.localStorage) localStorage.setItem("tcs-only-non-live", String(state.onlyNonLive));
    render();
  });
  elements.deadline.addEventListener("change", function (event) { state.deadline = event.target.value; render(); });
  elements.sort.addEventListener("change", function (event) { state.sort = event.target.value; render(); });
  elements.clear.addEventListener("click", resetFilters);
  elements.emptyClear.addEventListener("click", resetFilters);

  // Calendar controls
  elements.calPrevMonth.addEventListener("click", function () {
    state.calMonth -= 1;
    if (state.calMonth < 0) {
      state.calMonth = 11;
      state.calYear -= 1;
    }
    state.selectedCalDate = "";
    render();
  });
  elements.calNextMonth.addEventListener("click", function () {
    state.calMonth += 1;
    if (state.calMonth > 11) {
      state.calMonth = 0;
      state.calYear += 1;
    }
    state.selectedCalDate = "";
    render();
  });
  elements.calTodayBtn.addEventListener("click", function () {
    state.calYear = today.getFullYear();
    state.calMonth = today.getMonth();
    state.selectedCalDate = todayIso;
    render();
  });
  elements.closeDayDrawer.addEventListener("click", function () {
    state.selectedCalDate = "";
    render();
  });

  // Delegated click handlers for Detail Modal & Calendar cells
  document.addEventListener("click", function (event) {
    const detailTrigger = event.target.closest("[data-detail-id]");
    if (detailTrigger) {
      event.preventDefault();
      event.stopPropagation();
      openDetailModal(detailTrigger.dataset.detailId);
      return;
    }
    const calCell = event.target.closest("[data-cal-date]");
    if (calCell && elements.calendarViewContainer && !elements.calendarViewContainer.hidden) {
      state.selectedCalDate = calCell.dataset.calDate;
      render();
      elements.calDayDrawer.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  });

  elements.modalCloseBtn.addEventListener("click", closeDetailModal);
  elements.detailModal.addEventListener("click", function (event) {
    if (event.target === elements.detailModal) closeDetailModal();
  });

  elements.contractButton.addEventListener("click", function () {
    elements.contract.hidden = false;
    elements.contract.scrollIntoView({ behavior: "smooth", block: "center" });
  });
  elements.contractClose.addEventListener("click", function () { elements.contract.hidden = true; });

  document.addEventListener("keydown", function (event) {
    if (event.key === "/" && state.page === "workspace" && document.activeElement !== elements.search) {
      event.preventDefault();
      elements.search.focus();
    }
    if (event.key === "Escape") {
      if (!elements.detailModal.hidden) closeDetailModal();
      else if (!elements.contract.hidden) elements.contract.hidden = true;
    }
  });

  render();
})();
