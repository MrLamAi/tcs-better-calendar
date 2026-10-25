#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { join, resolve } from "node:path";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const SOURCE_ROOT = "https://tcs.edb.gov.hk/tcs/portal/publiccalendar/searchPublicCal";
const FIRST_PAGE_URL = `${SOURCE_ROOT}/load.htm?pdType=0&fromMenu=Y`;
const DETAIL_BASE_URL = "https://tcs.edb.gov.hk/tcs/admin/courses/previewCourse/forPortal.htm";
const RAW_DIR = join(ROOT, "data", "raw");
const PAGE_DELAY_MS = Number(process.env.TCS_PAGE_DELAY_MS || 500);
const MAX_RETRIES = Number(process.env.TCS_MAX_RETRIES || 3);
const FORCED_PAGE_COUNT = Number(process.env.TCS_PAGES || 0) || null;
const DETAIL_CONCURRENCY = Number(process.env.TCS_DETAIL_CONCURRENCY || 12);
const REFRESH_LIST_PAGES = process.env.TCS_REFRESH_PAGES === "1";
const SKIP_DETAILS = process.env.TCS_SKIP_DETAILS === "1";
const cookieJar = new Map();

function sleep(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

function decodeEntities(value) {
  const named = { amp: "&", apos: "'", gt: ">", lt: "<", nbsp: " ", quot: '"', bull: "•", ndash: "–", mdash: "—" };
  return String(value || "")
    .replace(/&#(x[\da-f]+|\d+);/gi, (_, code) => String.fromCodePoint(code.toLowerCase().startsWith("x") ? parseInt(code.slice(1), 16) : Number(code)))
    .replace(/&([a-z]+);/gi, (match, name) => named[name.toLowerCase()] ?? match);
}

function cleanText(html) {
  return decodeEntities(
    String(html || "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/div\s*>/gi, "\n")
      .replace(/<\/p\s*>/gi, "\n")
      .replace(/<\/tr\s*>/gi, "\n")
      .replace(/<\/li\s*>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\u00a0/g, " ")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

function attribute(openingTag, name) {
  const match = openingTag.match(new RegExp(`${name}\\s*=\\s*(?:["']([^"']*)["']|([^\\s>]+))`, "i"));
  return match ? decodeEntities(match[1] ?? match[2]) : "";
}

function extractBalancedDiv(html, start) {
  const tokenPattern = /<div\b[^>]*>|<\/div\s*>/gi;
  tokenPattern.lastIndex = start;
  let depth = 0;
  let token;
  while ((token = tokenPattern.exec(html))) {
    depth += /^<\/div/i.test(token[0]) ? -1 : 1;
    if (depth === 0) return html.slice(start, tokenPattern.lastIndex);
  }
  return html.slice(start);
}

function findRowBlocks(html) {
  const starts = [];
  const rowStart = /<div\b[^>]*class\s*=\s*["'][^"']*\bdivTableRow\b[^"']*["'][^>]*>/gi;
  let match;
  while ((match = rowStart.exec(html))) starts.push(match.index);
  return starts.map((start) => extractBalancedDiv(html, start));
}

function findCells(rowHtml) {
  const cells = [];
  const cellStart = /<div\b[^>]*class\s*=\s*["'][^"']*\bdivTableCell\b[^"']*["'][^>]*>/gi;
  let match;
  while ((match = cellStart.exec(rowHtml))) {
    const block = extractBalancedDiv(rowHtml, match.index);
    cells.push({
      opening: match[0],
      html: block,
      inner: block.slice(match[0].length, -6)
    });
  }
  return cells;
}

function datesIn(value) {
  return [...String(value || "").matchAll(/\d{4}\/\d{2}\/\d{2}/g)].map((match) => match[0].replaceAll("/", "-"));
}

function toIsoDate(value) {
  const dates = datesIn(value);
  return dates[0] || "";
}

function getCell(cells, label) {
  const cell = cells.find((item) => attribute(item.opening, "data-title").replace(/\s+/g, " ").trim().toLowerCase().startsWith(label.toLowerCase()));
  return cell || { opening: "", html: "", inner: "", text: "" };
}

function labelledValue(text, label) {
  const line = String(text || "").split("\n").find((item) => item.toLowerCase().startsWith(`${label.toLowerCase()}:`));
  return line ? line.slice(label.length + 1).trim() : "";
}

function findCourseId(courseCell) {
  const fromOnclick = courseCell.inner.match(/courseId=([^&'"\\]+)/i);
  if (fromOnclick) return decodeEntities(fromOnclick[1]);
  const match = cleanText(courseCell.inner).match(/\b[A-Z][A-Z0-9]{7,}\b/);
  return match ? match[0] : "";
}

function findHref(html, pattern) {
  const match = html.match(new RegExp(`<a\\b[^>]*href=["']([^"']*${pattern}[^"']*)["'][^>]*>`, "i"));
  return match ? decodeEntities(match[1]) : "";
}

function absoluteUrl(href) {
  if (!href) return "";
  return new URL(href, "https://tcs.edb.gov.hk").href;
}

function categoriesFor(event) {
  const haystack = [
    event.title,
    event.titleZh,
    event.subject,
    event.subjectZh,
    event.level,
    event.levelZh,
    event.participantGroup,
    event.participantGroupZh
  ].filter(Boolean).join(" ").toUpperCase();
  const categories = [];
  if (haystack.includes("SECONDARY") || haystack.includes("中學")) categories.push("Secondary");
  if (/(?:^|\W)(AI|A\.I\.|ICT)(?:$|\W)|ROBOT|INFORMATION|COMPUTER|CODING|TECHNOLOGY|人工智能|資訊科技|數字教育|編程/.test(haystack)) categories.push("IT/AI");
  if (haystack.includes("CITIZENSHIP AND SOCIAL DEVELOPMENT") || haystack.includes("CITIZENSHIP, ECONOMICS AND SOCIETY") || /\bCSD\b/.test(haystack) || haystack.includes("公民與社會發展") || haystack.includes("公民、經濟與社會")) categories.push("CSD");
  if (haystack.includes("STEAM") || haystack.includes("STEM")) categories.push("STEAM");
  return categories.length ? [...new Set(categories)] : ["Other"];
}

function subjectTagsFor(event) {
  const subject = String(event.subject || "").trim();
  const subjectZh = String(event.subjectZh || "").trim();
  const haystack = [subject, subjectZh, event.title, event.titleZh, event.summary, event.summaryZh].filter(Boolean).join(" ").toUpperCase();
  const tags = [];
  const isGeneral = (!subject && !subjectZh) || /^(ALL|NOT APPLICABLE|全部|不適用)$/i.test(subject || subjectZh);

  if (isGeneral) tags.push("general");
  if (/ENGLISH LANGUAGE|ENGLISH TEACH|ENGLISH CLASSROOM|ENGLISH LEARNING|ENGLISH SPEAKING|PRIMARY ENGLISH|SECONDARY ENGLISH|ENGLISH TEACHERS|TEACHERS USING ENGLISH|英語|英文|英國語文/.test(haystack)) tags.push("english");
  if (/CHINESE LANGUAGE|CHINESE LITERATURE|\bCHINESE\b|中國語文|中國文學|中文|普通話|PUTONGHUA/.test(haystack)) tags.push("chinese");
  if (/MATHEMATICS|數學/.test(haystack)) tags.push("mathematics");
  if (/BIOLOGY|CHEMISTRY|PHYSICS|SCIENCE|GENERAL STUDIES|PRIMARY SCIENCE|自然科學|科學|常識|生物|化學|物理/.test(haystack)) tags.push("science");
  if (/ICT|INFORMATION & COMMUNICATION|COMPUTER|CODING|DIGITAL|TECHNOLOGY|AI|A\.I\.|數字教育|資訊科技|人工智能|電腦/.test(haystack)) tags.push("ict");
  if (/STEAM|STEM/.test(haystack)) tags.push("steam");
  if (/CITIZENSHIP|SOCIAL DEVELOPMENT|MORAL|NATIONAL EDUCATION|公民|國民教育|價值教育|價值觀教育|德育/.test(haystack)) tags.push("values");
  if (/HISTORY|GEOGRAPHY|HUMANITIES|歷史|地理|人文|中國歷史|經濟|ECONOMICS/.test(haystack)) tags.push("humanities");
  if (/VISUAL ARTS|MUSIC|ARTS|視覺藝術|音樂|藝術/.test(haystack)) tags.push("arts");
  if (/PHYSICAL|HEALTH|PE\b|體育|健康/.test(haystack)) tags.push("health");

  if (!isGeneral && !tags.length) tags.push("other");
  return [...new Set(tags)];
}

function parsePage(html, pageNumber, pageUrl) {
  return findRowBlocks(html).map((rowHtml) => {
    const cells = findCells(rowHtml).map((cell) => ({ ...cell, text: cleanText(cell.inner) }));
    const issueCell = getCell(cells, "latest issue date");
    const courseCell = getCell(cells, "course id");
    const eventCell = getCell(cells, "event date");
    const titleCell = getCell(cells, "course/activity title");
    const participantCell = getCell(cells, "participant group");
    const closingCell = getCell(cells, "closing date");
    const titleMarker = titleCell.inner.search(/<span\b[^>]*class=["'][^"']*d-inline-block[^"']*["']/i);
    const title = cleanText(titleMarker >= 0 ? titleCell.inner.slice(0, titleMarker) : titleCell.inner);
    const period = attribute(eventCell.opening, "title") || eventCell.text;
    const eventDates = datesIn(period);
    const closingDates = datesIn(closingCell.text);
    const participantText = participantCell.text;
    const courseId = findCourseId(courseCell);
    const applyHref = findHref(courseCell.inner, "\\/apply\\.htm");
    const detailHref = courseCell.inner.match(/loadRealPopup\(['"]([^'"]*previewCourse[^'"]*)['"]/i)?.[1] || `/tcs/admin/courses/previewCourse/forPortal.htm?courseId=${courseId}&lang=en`;
    const subject = labelledValue(participantText, "Subject/Function");
    const level = labelledValue(participantText, "Level");
    const post = labelledValue(participantText, "Post");
    const event = {
      courseId,
      title,
      titleZh: "",
      summary: [subject && `Subject: ${subject}`, post && `Post: ${post}`].filter(Boolean).join(" · ") || "EDB professional learning activity",
      summaryZh: "",
      category: "Other",
      categories: [],
      eventStart: eventDates[0] || "",
      eventEnd: eventDates[eventDates.length - 1] || eventDates[0] || "",
      eventPeriod: period.replace(/\s+/g, " ").trim(),
      closingDate: closingDates[0] || "",
      closingDateEnd: closingDates[closingDates.length - 1] || closingDates[0] || "",
      level,
      levelZh: "",
      subject,
      subjectZh: "",
      subjectTags: [],
      post,
      postZh: "",
      participantGroup: [level, post].filter(Boolean).join(" · ") || "See TCS course details",
      participantGroupZh: "",
      format: applyHref ? "Online application" : "TCS course details",
      formatZh: applyHref ? "網上報名" : "參閱 TCS 詳情",
      deliveryMode: "in-person",
      financeType: labelledValue(participantText, "Finance Type"),
      financeTypeZh: "",
      lastUpdated: toIsoDate(issueCell.text),
      badge: /\bnew\b/i.test(title) ? "NEW" : /\b(updated|re-run)\b/i.test(title) ? "UPDATED" : "",
      applyUrl: absoluteUrl(applyHref || detailHref),
      detailUrlEn: `${DETAIL_BASE_URL}?courseId=${courseId}&lang=en`,
      detailUrlZh: `${DETAIL_BASE_URL}?courseId=${courseId}&lang=zh`,
      sourceUrl: pageUrl,
      sourcePage: pageNumber,
      details: null
    };
    event.categories = categoriesFor(event);
    event.category = event.categories[0];
    event.subjectTags = subjectTagsFor(event);
    return event;
  }).filter((event) => event.courseId && event.title);
}

function parseDetailSections(html) {
  const sections = new Map();
  const blocks = String(html || "").split(/<div\b[^>]*class=["'][^"']*\bcourse_detail\b[^"']*["'][^>]*>/i).slice(1);
  for (const block of blocks) {
    const titleMatch = block.match(/class=["'][^"']*\bdetail_title\b[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|a)>/i);
    if (!titleMatch) continue;
    const title = cleanText(titleMatch[1]);
    const contentStart = block.search(/<div\b[^>]*class=["'][^"']*\bdetail_content\b[^"']*["'][^>]*>/i);
    if (contentStart < 0) continue;
    const contentDiv = extractBalancedDiv(block, contentStart);
    const openMatch = contentDiv.match(/^<div\b[^>]*>/i);
    const innerHtml = openMatch ? contentDiv.slice(openMatch[0].length, -6) : contentDiv;
    if (!sections.has(title)) {
      sections.set(title, { title, innerHtml, text: cleanText(innerHtml) });
    }
  }
  return sections;
}

function normalizeClockTime(rawHour, rawMin, rawMeridiem) {
  let hour = Number(rawHour);
  const minute = Number(rawMin || 0);
  if (!Number.isFinite(hour) || !Number.isFinite(minute) || hour > 24 || minute > 59) return "";
  const mer = String(rawMeridiem || "").toLowerCase().replace(/\./g, "").trim();
  if (mer === "pm" || mer === "下午" || mer === "晚上") {
    if (hour < 12) hour += 12;
  } else if (mer === "am" || mer === "上午") {
    if (hour === 12) hour = 0;
  }
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function extractTimeSlotsFromText(text) {
  const input = String(text || "");
  const slots = [];
  const seen = new Set();

  // Pattern 1: HH:MM [am/pm] - HH:MM [am/pm] (also supports Chinese 上午/下午 before time)
  const rangePattern = /(?:(上午|下午|晚上)\s*)?(\d{1,2})[:.](\d{2})\s*(a\.?m\.?|p\.?m\.?)?\s*(?:-|–|—|to|至)\s*(?:(上午|下午|晚上)\s*)?(\d{1,2})[:.](\d{2})\s*(a\.?m\.?|p\.?m\.?)?/gi;
  let match;
  while ((match = rangePattern.exec(input))) {
    const [, mer1Prefix, h1, m1, mer1Suffix, mer2Prefix, h2, m2, mer2Suffix] = match;
    const mer2 = mer2Suffix || mer2Prefix || "";
    const mer1 = mer1Suffix || mer1Prefix || "";
    const startTime = normalizeClockTime(h1, m1, mer1);
    const endTime = normalizeClockTime(h2, m2, mer2);
    if (startTime && endTime) {
      const key = `${startTime}-${endTime}`;
      if (!seen.has(key)) {
        seen.add(key);
        slots.push({ startTime, endTime, display: `${startTime} - ${endTime}` });
      }
    }
  }
  return slots;
}

function parseCourseSessions(html) {
  const tableMatch = String(html || "").match(/<table\b[^>]*id=["']firstCourseTable["'][^>]*>([\s\S]*?)<\/table>/i);
  if (!tableMatch) return [];
  const tbodyMatch = tableMatch[1].match(/<tbody\b[^>]*>([\s\S]*?)<\/tbody>/i);
  const bodyHtml = tbodyMatch ? tbodyMatch[1] : tableMatch[1];
  const rows = [...bodyHtml.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)];
  const sessions = [];
  let lastEventId = "";
  let lastQuota = "";

  for (const row of rows) {
    const tds = [...row[1].matchAll(/<td\b([^>]*)>([\s\S]*?)<\/td>/gi)].map((m) => ({
      attrs: m[1],
      title: attribute(`<td ${m[1]}>`, "data-title").trim(),
      isHiddenMobile: /\bmobile-course-display-hide\b/i.test(m[1]),
      text: cleanText(m[2])
    }));
    if (!tds.length) continue;
    const byTitle = (prefix) => tds.find((td) => td.title.toLowerCase().startsWith(prefix.toLowerCase()))?.text || "";
    const rawEventId = byTitle("Event (ID)") || byTitle("場次(編號)");
    if (rawEventId) lastEventId = rawEventId;
    const eventId = rawEventId || lastEventId || tds[0]?.text || "";

    const sessionNo = byTitle("Session") || byTitle("節次") || "";
    const dateIdx = tds.findIndex((td) => /^(Date|舉行日期)/i.test(td.title));
    const date = (dateIdx >= 0 ? tds[dateIdx].text : byTitle("Date") || byTitle("舉行日期") || "").replace(/\s+/g, " ").trim();

    let rawTimeCell = byTitle("Time") || byTitle("時間") || "";
    if (!rawTimeCell && dateIdx >= 0 && tds[dateIdx + 1] && !tds[dateIdx + 1].title && !tds[dateIdx + 1].isHiddenMobile) {
      rawTimeCell = tds[dateIdx + 1].text;
    }

    const duration = byTitle("Number of Event Days") || byTitle("No. of Event Days") || byTitle("場次日數") || byTitle("Number of Hours") || byTitle("No. of Hours") || byTitle("Hours") || byTitle("時數") || "";
    const venue = byTitle("Venue") || byTitle("地點") || "";
    const speaker = byTitle("Speaker") || byTitle("講者") || "";
    const rawQuota = byTitle("Max.") || byTitle("參加人數上限");
    if (rawQuota) lastQuota = rawQuota;
    const quota = rawQuota || lastQuota || "";
    const closingRaw = byTitle("Closing date") || byTitle("截止日期") || "";
    const closingDates = datesIn(closingRaw);
    const remark = byTitle("Remark") || byTitle("備註") || "";

    let slots = extractTimeSlotsFromText(rawTimeCell);
    if (!slots.length) {
      slots = extractTimeSlotsFromText(`${venue}\n${remark}`);
    }
    const startTime = slots[0]?.startTime || "";
    const endTime = slots[slots.length - 1]?.endTime || "";
    const time = slots.length
      ? slots.map((s) => s.display).join(" / ")
      : rawTimeCell.replace(/\s+/g, " ").trim();

    if (eventId || date || venue) {
      sessions.push({
        eventId: eventId.replace(/\s+/g, " ").trim(),
        sessionNo: sessionNo.replace(/\s+/g, " ").trim(),
        date,
        time,
        startTime,
        endTime,
        duration: duration.replace(/\s+/g, " ").trim(),
        venue,
        speaker,
        quota: quota.replace(/\s+/g, " ").trim(),
        closingDate: closingDates[0] || closingRaw.replace(/^(Applicant|申請人)\s*/i, "").trim(),
        remark
      });
    }
  }
  return sessions;
}

function parseDetailPage(html) {
  const sections = parseDetailSections(html);
  const getText = (...keys) => {
    for (const k of keys) {
      for (const [secTitle, sec] of sections.entries()) {
        if (secTitle.toLowerCase() === k.toLowerCase() || secTitle.toLowerCase().startsWith(k.toLowerCase())) {
          return sec.text;
        }
      }
    }
    return "";
  };

  const title = getText("Course Title", "課程名稱");
  const organisingDivision = getText("Organising Division", "主辦科別");
  const participantText = getText("Participant Group", "參加對象");
  const objective = getText("Objective(s)", "活動目標");
  const description = getText("Programme Description", "活動詳情");
  const background = getText("Background", "背景");
  const medium = getText("Medium of instruction", "講授語言");
  const cpdText = getText("CPD Elements for Teacher", "持續專業發展(老師適用)");
  const contentArea = getText("Content Area", "活動內容");
  const sessions = parseCourseSessions(html);

  const financeType = labelledValue(participantText, "Finance Type") || labelledValue(participantText, "資助種類");
  const level = labelledValue(participantText, "Level") || labelledValue(participantText, "教學程度");
  const subject = labelledValue(participantText, "Subject/Function") || labelledValue(participantText, "科目/功能");
  const post = labelledValue(participantText, "Post") || labelledValue(participantText, "職位");

  return {
    title,
    organisingDivision,
    financeType,
    level,
    subject,
    post,
    objective,
    description,
    background,
    medium,
    cpdText,
    contentArea,
    sessions
  };
}

function classifyDeliveryMode(event, enDetail, zhDetail) {
  const titles = [event.title, event.titleZh, enDetail?.title, zhDetail?.title].filter(Boolean).join(" ");
  const venues = [
    ...(enDetail?.sessions || []).map((s) => s.venue),
    ...(zhDetail?.sessions || []).map((s) => s.venue)
  ].filter(Boolean).join(" ");
  const speakers = [
    ...(enDetail?.sessions || []).map((s) => s.speaker),
    ...(zhDetail?.sessions || []).map((s) => s.speaker)
  ].filter(Boolean).join(" ");
  const remarksAndDesc = [
    enDetail?.description,
    zhDetail?.description,
    ...(enDetail?.sessions || []).map((s) => s.remark),
    ...(zhDetail?.sessions || []).map((s) => s.remark)
  ].filter(Boolean).join(" ");

  const allText = `${titles} ${venues} ${speakers} ${remarksAndDesc}`;

  // 1. Self-paced / Recorded online course (網上自學 / 錄播課程)
  if (
    /self-learning|recorded\s+course|vle\s+course|e-Services\s+Portal|edcity\s+vle|網上自學|自學課程|網上錄播|網上錄影|教育城\s*VLE|個人公餘時間|個人的公餘時間/i.test(allText) ||
    (/online\s+mode|網上模式/i.test(speakers) && !/zoom|teams|webinar|實時|會議室/i.test(allText)) ||
    (/online\s+course|網上課程/i.test(titles) && !/webinar|zoom|teams|online\s+talk|網上講座|實時|研討會/i.test(titles))
  ) {
    return "self-paced";
  }

  // 2. Live Webinar / Real-time online session (實時網上講座 / Webinar)
  if (
    /webinar|zoom|microsoft\s+teams|google\s+meet|online\s+(?:teacher’s\s+|teacher's\s+)?talk|online\s+briefing|online\s+seminar|online\s+workshop|online\s+lecture|live\s+broadcast|網上講座|網上研討會|網上簡介會|網上工作坊|網上會議室|實時網上|視像會議|直播/i.test(allText) ||
    /online\s+course|網上課程|online|網上|zoom|teams/i.test(venues)
  ) {
    return "webinar";
  }

  return "in-person";
}

function discoverPageCount(html) {
  const normalized = decodeEntities(html).replace(/\s+/g, " ");
  const match = normalized.match(/Page:\s*(\d+)\s+of\s+(\d+)/i);
  return match ? Number(match[2]) : null;
}

function formStateFromFirstPage(html) {
  const params = new URLSearchParams();
  const inputPattern = /<input\b[^>]*name\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let input;
  while ((input = inputPattern.exec(html))) {
    const name = input[1];
    if (params.has(name)) continue;
    const value = attribute(input[0], "value");
    params.set(name, value);
  }
  const selectPattern = /<select\b[^>]*name\s*=\s*["']([^"']+)["'][^>]*>[\s\S]*?<\/select>/gi;
  let select;
  while ((select = selectPattern.exec(html))) {
    const name = select[1];
    if (params.has(name)) continue;
    const selected = select[0].match(/<option\b[^>]*selected[^>]*>/i) || select[0].match(/<option\b[^>]*>/i);
    if (selected) params.set(name, attribute(selected[0], "value") || cleanText(selected[0].replace(/^<option\b[^>]*>/i, "").replace(/<\/option>$/i, "")));
  }
  const courseIds = html.match(/document\.getElementById\(["']courseIdList["']\)\.value\s*=\s*["']([^"']*)["']/i);
  if (courseIds) params.set("courseIdList", decodeEntities(courseIds[1]));
  return params;
}

async function fetchPage(url, options = {}) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const cookieHeader = [...cookieJar.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
      const response = await fetch(url, {
        method: options.method || "GET",
        body: options.body,
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "User-Agent": "tcs-better-calendar/0.3 (+public-calendar bilingual snapshot)",
          ...(options.body ? { "Content-Type": "application/x-www-form-urlencoded", Referer: options.referer || FIRST_PAGE_URL } : {}),
          ...(cookieHeader && !options.stateless ? { Cookie: cookieHeader } : {})
        },
        redirect: "follow"
      });
      if (!options.stateless) {
        const setCookies = typeof response.headers.getSetCookie === "function"
          ? response.headers.getSetCookie()
          : (response.headers.get("set-cookie") || "").split(/,(?=[A-Za-z0-9_]+=)/);
        for (const setCookie of setCookies) {
          const cookie = setCookie.match(/^\s*([^=;]+)=([^;]*)/);
          if (cookie) cookieJar.set(cookie[1], cookie[2]);
        }
      }
      const html = await response.text();
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return { status: response.status, html, finalUrl: response.url || url };
    } catch (error) {
      lastError = error;
      if (attempt < MAX_RETRIES) await sleep(800 * attempt);
    }
  }
  throw lastError;
}

async function writeText(path, content) {
  await writeFile(path, content, "utf8");
}

async function loadExistingPages() {
  try {
    const manifestRaw = await readFile(join(ROOT, "data", "manifest.json"), "utf8");
    const manifest = JSON.parse(manifestRaw);
    const pages = [];
    for (const p of manifest.pages || []) {
      const html = await readFile(join(ROOT, p.file), "utf8");
      pages.push({ page: p.page, url: p.url, finalUrl: p.finalUrl || p.url, status: p.status || 200, html });
    }
    if (pages.length) return { pages, discoveredPages: manifest.discoveredPages || pages.length };
  } catch {
    // Fallback to live download
  }
  return null;
}

async function enrichEventsWithBilingualDetails(events) {
  let completed = 0;
  const total = events.length;
  const queue = [...events];

  async function worker() {
    while (queue.length > 0) {
      const event = queue.shift();
      if (!event) break;
      try {
        const [enRes, zhRes] = await Promise.all([
          fetchPage(`${DETAIL_BASE_URL}?courseId=${encodeURIComponent(event.courseId)}&lang=en`, { stateless: true }),
          fetchPage(`${DETAIL_BASE_URL}?courseId=${encodeURIComponent(event.courseId)}&lang=zh`, { stateless: true })
        ]);
        const enDetail = parseDetailPage(enRes.html);
        const zhDetail = parseDetailPage(zhRes.html);

        if (zhDetail.title) event.titleZh = zhDetail.title;
        if (enDetail.title && !event.title) event.title = enDetail.title;

        event.levelZh = zhDetail.level || event.level;
        event.subjectZh = zhDetail.subject || event.subject;
        event.postZh = zhDetail.post || event.post;
        event.financeTypeZh = zhDetail.financeType || event.financeType;
        event.participantGroupZh = [event.levelZh, event.postZh].filter(Boolean).join(" · ") || "請參閱 TCS 課程詳情";
        event.summaryZh = [
          event.subjectZh && `科目：${event.subjectZh}`,
          event.postZh && `對象：${event.postZh}`
        ].filter(Boolean).join(" · ") || "教育局教師專業發展活動";

        event.deliveryMode = classifyDeliveryMode(event, enDetail, zhDetail);

        const firstVenueEn = enDetail.sessions?.[0]?.venue?.split("\n")[0]?.trim() || "";
        const firstVenueZh = zhDetail.sessions?.[0]?.venue?.split("\n")[0]?.trim() || "";
        if (firstVenueEn) event.format = firstVenueEn;
        if (firstVenueZh) event.formatZh = firstVenueZh;

        const allSessions = [...(enDetail.sessions || []), ...(zhDetail.sessions || [])];
        const sessionTimes = [...new Set(allSessions.map((s) => s.time).filter(Boolean))];
        const firstTimedSession = allSessions.find((s) => s.startTime);
        event.startTime = firstTimedSession?.startTime || "";
        event.endTime = firstTimedSession?.endTime || "";
        event.timeSummary = sessionTimes.slice(0, 2).join(" · ");

        if (!event.badge && /新辦|\bnew\b/i.test(`${event.title} ${event.titleZh}`)) {
          event.badge = "NEW";
        } else if (!event.badge && /重辦|修訂|\b(updated|re-run)\b/i.test(`${event.title} ${event.titleZh}`)) {
          event.badge = "UPDATED";
        }

        event.details = {
          en: {
            organisingDivision: enDetail.organisingDivision,
            objective: enDetail.objective,
            description: enDetail.description,
            background: enDetail.background,
            medium: enDetail.medium,
            cpd: enDetail.cpdText,
            contentArea: enDetail.contentArea,
            sessions: enDetail.sessions
          },
          zh: {
            organisingDivision: zhDetail.organisingDivision,
            objective: zhDetail.objective,
            description: zhDetail.description,
            background: zhDetail.background,
            medium: zhDetail.medium,
            cpd: zhDetail.cpdText,
            contentArea: zhDetail.contentArea,
            sessions: zhDetail.sessions
          }
        };

        event.categories = categoriesFor(event);
        event.category = event.categories[0];
        event.subjectTags = subjectTagsFor(event);
      } catch (error) {
        process.stderr.write(`Detail fetch warning for ${event.courseId}: ${error}\n`);
      }
      completed += 1;
      if (completed % 50 === 0 || completed === total) {
        process.stdout.write(`Enriched bilingual details: ${completed}/${total}\n`);
      }
    }
  }

  await Promise.all(Array.from({ length: DETAIL_CONCURRENCY }, () => worker()));
}

// Professional Ladder CPD requirements (values of TCS `cpdrequirement` select).
const CPD_REQUIREMENT_IDS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15"];
const CPD_MAP_PATH = join(ROOT, "data", "cpd-map.json");
const REFRESH_CPD = process.env.TCS_REFRESH_CPD === "1";
const CPD_MAX_AGE_MS = Number(process.env.TCS_CPD_MAX_AGE_HOURS || 20) * 3600 * 1000;

function searchFormState(html) {
  const start = html.indexOf('id="searchPublicCalForm"');
  const form = start >= 0 ? html.slice(start, html.indexOf("</form>", start)) : html;
  const params = new URLSearchParams();
  for (const input of form.matchAll(/<input\b[^>]*>/gi)) {
    const name = attribute(input[0], "name");
    if (!name || params.has(name) || /type\s*=\s*["']?(radio|checkbox)/i.test(input[0])) continue;
    params.set(name, attribute(input[0], "value"));
  }
  for (const select of form.matchAll(/<select\b[^>]*name\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/select>/gi)) {
    if (params.has(select[1])) continue;
    const option = select[2].match(/<option\b[^>]*selected[^>]*>/i) || select[2].match(/<option\b[^>]*>/i);
    params.set(select[1], option ? attribute(option[0], "value") : "");
  }
  return params;
}

async function scrapeCpdMap() {
  if (!REFRESH_CPD) {
    try {
      const cached = JSON.parse(await readFile(CPD_MAP_PATH, "utf8"));
      if (Date.now() - new Date(cached.fetchedAt).getTime() < CPD_MAX_AGE_MS) {
        process.stdout.write(`Using cached CPD map from ${cached.fetchedAt}.\n`);
        return cached;
      }
    } catch {
      // no cache yet
    }
  }
  const map = {};
  for (const id of CPD_REQUIREMENT_IDS) {
    cookieJar.clear();
    const first = await fetchPage(FIRST_PAGE_URL);
    const state = searchFormState(first.html);
    state.set("cpdrequirement", id);
    const body = state.toString();
    const firstResult = await fetchPage(`${SOURCE_ROOT}/search.htm`, { method: "POST", body });
    const pageCount = discoverPageCount(firstResult.html) || 1;
    const ids = new Set(parsePage(firstResult.html, 1, "").map((event) => event.courseId));
    for (let page = 2; page <= pageCount; page += 1) {
      await sleep(PAGE_DELAY_MS);
      const result = await fetchPage(`${SOURCE_ROOT}/search.htm?pageNo=${page}`, { method: "POST", body });
      for (const event of parsePage(result.html, page, "")) ids.add(event.courseId);
    }
    map[id] = [...ids].filter(Boolean);
    process.stdout.write(`CPD requirement ${id}: ${map[id].length} courses (${pageCount} pages)\n`);
    await sleep(PAGE_DELAY_MS);
  }
  const result = { fetchedAt: new Date().toISOString(), map };
  await writeText(CPD_MAP_PATH, JSON.stringify(result, null, 2) + "\n");
  return result;
}

function applyCpdMap(events, cpd) {
  const byCourse = new Map();
  for (const [id, courseIds] of Object.entries(cpd.map || {})) {
    for (const courseId of courseIds) {
      if (!byCourse.has(courseId)) byCourse.set(courseId, []);
      byCourse.get(courseId).push(id);
    }
  }
  for (const event of events) event.cpdRequirements = byCourse.get(event.courseId) || [];
}

async function main() {
  await mkdir(RAW_DIR, { recursive: true });
  const startedAt = new Date().toISOString();

  let pages = [];
  let discoveredPages = 0;
  let pageCount = 0;

  const cached = !REFRESH_LIST_PAGES ? await loadExistingPages() : null;
  if (cached && cached.pages.length > 0) {
    pages = cached.pages;
    discoveredPages = cached.discoveredPages;
    pageCount = pages.length;
    process.stdout.write(`Loaded ${pages.length} cached raw list pages from data/raw/.\n`);
  } else {
    const first = await fetchPage(FIRST_PAGE_URL);
    discoveredPages = discoverPageCount(first.html);
    pageCount = FORCED_PAGE_COUNT || discoveredPages;
    if (!pageCount) throw new Error("Could not discover the TCS page count from the first page");
    const pageState = formStateFromFirstPage(first.html);

    pages = [{ page: 1, url: FIRST_PAGE_URL, ...first }];
    for (let page = 2; page <= pageCount; page += 1) {
      await sleep(PAGE_DELAY_MS);
      const url = `${SOURCE_ROOT}/search.htm?pageNo=${page}`;
      try {
        pages.push({ page, url, ...(await fetchPage(url, { method: "POST", body: pageState.toString(), referer: FIRST_PAGE_URL })) });
        process.stdout.write(`Downloaded page ${page}/${pageCount}\n`);
      } catch (error) {
        pages.push({ page, url, status: null, error: String(error) });
        process.stderr.write(`Failed page ${page}/${pageCount}: ${error}\n`);
      }
    }
  }

  const parsed = [];
  const manifestPages = [];
  for (const page of pages) {
    const filename = `tcs-page-${String(page.page).padStart(3, "0")}.html`;
    if (page.html) {
      if (!cached) await writeText(join(RAW_DIR, filename), page.html);
      const pageEvents = parsePage(page.html, page.page, page.finalUrl || page.url);
      parsed.push(...pageEvents);
      manifestPages.push({ page: page.page, url: page.url, finalUrl: page.finalUrl || page.url, status: page.status, bytes: Buffer.byteLength(page.html), sha256: createHash("sha256").update(page.html).digest("hex"), events: pageEvents.length, file: `data/raw/${filename}` });
    } else {
      manifestPages.push({ page: page.page, url: page.url, status: page.status, error: page.error, file: `data/raw/${filename}` });
    }
  }

  const deduped = [...new Map(parsed.map((event) => [event.courseId, event])).values()].sort((a, b) => a.eventStart.localeCompare(b.eventStart) || a.courseId.localeCompare(b.courseId));

  if (!SKIP_DETAILS) {
    process.stdout.write(`Fetching bilingual course details (EN + ZH) for ${deduped.length} events...\n`);
    await enrichEventsWithBilingualDetails(deduped);
  }

  try {
    applyCpdMap(deduped, await scrapeCpdMap());
  } catch (error) {
    process.stderr.write(`CPD map warning: ${error}\n`);
    try {
      applyCpdMap(deduped, JSON.parse(await readFile(CPD_MAP_PATH, "utf8")));
    } catch {
      for (const event of deduped) event.cpdRequirements = [];
    }
  }

  const finishedAt = new Date().toISOString();
  const modeCounts = deduped.reduce((acc, ev) => {
    acc[ev.deliveryMode] = (acc[ev.deliveryMode] || 0) + 1;
    return acc;
  }, {});

  const meta = {
    source: FIRST_PAGE_URL,
    startedAt,
    finishedAt,
    discoveredPages,
    requestedPages: pageCount,
    downloadedPages: pages.filter((page) => page.html).length,
    failedPages: pages.filter((page) => !page.html).map((page) => page.page),
    eventCount: deduped.length,
    deliveryModes: modeCounts,
    pageDelayMs: PAGE_DELAY_MS,
    pages: manifestPages
  };
  await writeText(join(ROOT, "data", "tcs-events.json"), JSON.stringify({ meta, events: deduped }, null, 2) + "\n");
  await writeText(join(ROOT, "data", "tcs-events.js"), `window.TCS_DATA_META = ${JSON.stringify(meta)};\nwindow.TCS_EVENTS = ${JSON.stringify(deduped)};\n`);
  await writeText(join(ROOT, "data", "manifest.json"), JSON.stringify(meta, null, 2) + "\n");

  process.stdout.write(`\nSnapshot complete: ${meta.downloadedPages}/${meta.requestedPages} pages, ${meta.eventCount} unique events. Delivery modes: ${JSON.stringify(modeCounts)}\n`);
  if (meta.failedPages.length) process.exitCode = 1;
}

if (process.env.TCS_SKIP_MAIN !== "1") {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error}\n`);
    process.exitCode = 1;
  });
}

export { cleanText, findCells, findRowBlocks, parsePage, parseDetailPage, classifyDeliveryMode, scrapeCpdMap, applyCpdMap };
