#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { join, resolve } from "node:path";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const SOURCE_ROOT = "https://tcs.edb.gov.hk/tcs/portal/publiccalendar/searchPublicCal";
const FIRST_PAGE_URL = `${SOURCE_ROOT}/load.htm?pdType=0&fromMenu=Y`;
const RAW_DIR = join(ROOT, "data", "raw");
const PAGE_DELAY_MS = Number(process.env.TCS_PAGE_DELAY_MS || 500);
const MAX_RETRIES = Number(process.env.TCS_MAX_RETRIES || 3);
const FORCED_PAGE_COUNT = Number(process.env.TCS_PAGES || 0) || null;
const cookieJar = new Map();

function sleep(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

function decodeEntities(value) {
  const named = { amp: "&", apos: "'", gt: ">", lt: "<", nbsp: " ", quot: '"' };
  return value
    .replace(/&#(x[\da-f]+|\d+);/gi, (_, code) => String.fromCodePoint(code.toLowerCase().startsWith("x") ? parseInt(code.slice(1), 16) : Number(code)))
    .replace(/&([a-z]+);/gi, (match, name) => named[name.toLowerCase()] ?? match);
}

function cleanText(html) {
  return decodeEntities(
    html
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/div\s*>/gi, "\n")
      .replace(/<\/p\s*>/gi, "\n")
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
  return [...value.matchAll(/\d{4}\/\d{2}\/\d{2}/g)].map((match) => match[0].replaceAll("/", "-"));
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
  const line = text.split("\n").find((item) => item.toLowerCase().startsWith(`${label.toLowerCase()}:`));
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
  const haystack = [event.title, event.subject, event.level, event.participantGroup].join(" ").toUpperCase();
  const categories = [];
  if (haystack.includes("SECONDARY") || haystack.includes("中學")) categories.push("Secondary");
  if (/(?:^|\W)(AI|A\.I\.|ICT)(?:$|\W)|ROBOT|INFORMATION|COMPUTER|CODING|TECHNOLOGY/.test(haystack)) categories.push("IT/AI");
  if (haystack.includes("CITIZENSHIP AND SOCIAL DEVELOPMENT") || haystack.includes("CITIZENSHIP, ECONOMICS AND SOCIETY") || /\bCSD\b/.test(haystack) || haystack.includes("公民與社會發展")) categories.push("CSD");
  if (haystack.includes("STEAM") || haystack.includes("STEM")) categories.push("STEAM");
  return categories.length ? [...new Set(categories)] : ["Other"];
}

function subjectTagsFor(event) {
  const subject = String(event.subject || "").trim();
  const haystack = [subject, event.title, event.summary].join(" ").toUpperCase();
  const tags = [];
  const isGeneral = !subject || /^(ALL|NOT APPLICABLE|全部|不適用)$/i.test(subject);

  if (isGeneral) tags.push("general");
  if (/ENGLISH LANGUAGE|\bENGLISH\b|英語|英文/.test(haystack)) tags.push("english");
  if (/CHINESE LANGUAGE|CHINESE LITERATURE|\bCHINESE\b|中國語文|中文/.test(haystack)) tags.push("chinese");
  if (/MATHEMATICS|數學/.test(haystack)) tags.push("mathematics");
  if (/BIOLOGY|CHEMISTRY|PHYSICS|SCIENCE|GENERAL STUDIES|PRIMARY SCIENCE|自然科學|科學|常識/.test(haystack)) tags.push("science");
  if (/ICT|INFORMATION & COMMUNICATION|COMPUTER|CODING|DIGITAL|TECHNOLOGY|AI|A\.I\.|數字教育|資訊科技|人工智能/.test(haystack)) tags.push("ict");
  if (/STEAM|STEM/.test(haystack)) tags.push("steam");
  if (/CITIZENSHIP|SOCIAL DEVELOPMENT|MORAL|NATIONAL EDUCATION|公民|國民教育|價值教育/.test(haystack)) tags.push("values");
  if (/HISTORY|GEOGRAPHY|HUMANITIES|歷史|地理|人文/.test(haystack)) tags.push("humanities");
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
    const detailHref = courseCell.inner.match(/loadRealPopup\(['"]([^'"]*previewCourse[^'"]*)['"]/i)?.[1] || "";
    const subject = labelledValue(participantText, "Subject/Function");
    const level = labelledValue(participantText, "Level");
    const post = labelledValue(participantText, "Post");
    const event = {
      courseId,
      title,
      summary: [subject && `Subject: ${subject}`, post && `Post: ${post}`].filter(Boolean).join(" · ") || "EDB professional learning activity",
      category: "Other",
      categories: [],
      eventStart: eventDates[0] || "",
      eventEnd: eventDates[eventDates.length - 1] || eventDates[0] || "",
      eventPeriod: period.replace(/\s+/g, " ").trim(),
      closingDate: closingDates[0] || "",
      closingDateEnd: closingDates[closingDates.length - 1] || closingDates[0] || "",
      level,
      subject,
      subjectTags: [],
      post,
      participantGroup: [level, post].filter(Boolean).join(" · ") || "See TCS course details",
      format: applyHref ? "Online application" : "TCS course details",
      financeType: labelledValue(participantText, "Finance Type"),
      lastUpdated: toIsoDate(issueCell.text),
      badge: /\bnew\b/i.test(title) ? "NEW" : /\b(updated|re-run)\b/i.test(title) ? "UPDATED" : "",
      applyUrl: absoluteUrl(applyHref || detailHref),
      sourceUrl: pageUrl,
      sourcePage: pageNumber
    };
    event.categories = categoriesFor(event);
    event.category = event.categories[0];
    event.subjectTags = subjectTagsFor(event);
    return event;
  }).filter((event) => event.courseId && event.title);
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
          "User-Agent": "tcs-better-calendar/0.2 (+public-calendar snapshot)",
          ...(options.body ? { "Content-Type": "application/x-www-form-urlencoded", Referer: options.referer || FIRST_PAGE_URL } : {}),
          ...(cookieHeader ? { Cookie: cookieHeader } : {})
        },
        redirect: "follow"
      });
      const setCookies = typeof response.headers.getSetCookie === "function"
        ? response.headers.getSetCookie()
        : (response.headers.get("set-cookie") || "").split(/,(?=[A-Za-z0-9_]+=)/);
      for (const setCookie of setCookies) {
        const cookie = setCookie.match(/^\s*([^=;]+)=([^;]*)/);
        if (cookie) cookieJar.set(cookie[1], cookie[2]);
      }
      const html = await response.text();
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return { status: response.status, html, finalUrl: response.url || url };
    } catch (error) {
      lastError = error;
      if (attempt < MAX_RETRIES) await sleep(1000 * attempt);
    }
  }
  throw lastError;
}

async function writeText(path, content) {
  await writeFile(path, content, "utf8");
}

async function main() {
  await mkdir(RAW_DIR, { recursive: true });
  const startedAt = new Date().toISOString();
  const first = await fetchPage(FIRST_PAGE_URL);
  const discoveredPages = discoverPageCount(first.html);
  const pageCount = FORCED_PAGE_COUNT || discoveredPages;
  if (!pageCount) throw new Error("Could not discover the TCS page count from the first page");
  const pageState = formStateFromFirstPage(first.html);

  const pages = [{ page: 1, url: FIRST_PAGE_URL, ...first }];
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

  const parsed = [];
  const manifestPages = [];
  for (const page of pages) {
    const filename = `tcs-page-${String(page.page).padStart(3, "0")}.html`;
    if (page.html) {
      await writeText(join(RAW_DIR, filename), page.html);
      const pageEvents = parsePage(page.html, page.page, page.finalUrl || page.url);
      parsed.push(...pageEvents);
      manifestPages.push({ page: page.page, url: page.url, finalUrl: page.finalUrl || page.url, status: page.status, bytes: Buffer.byteLength(page.html), sha256: createHash("sha256").update(page.html).digest("hex"), events: pageEvents.length, file: `data/raw/${filename}` });
    } else {
      manifestPages.push({ page: page.page, url: page.url, status: page.status, error: page.error, file: `data/raw/${filename}` });
    }
  }

  const deduped = [...new Map(parsed.map((event) => [event.courseId, event])).values()].sort((a, b) => a.eventStart.localeCompare(b.eventStart) || a.courseId.localeCompare(b.courseId));
  const finishedAt = new Date().toISOString();
  const meta = {
    source: FIRST_PAGE_URL,
    startedAt,
    finishedAt,
    discoveredPages,
    requestedPages: pageCount,
    downloadedPages: pages.filter((page) => page.html).length,
    failedPages: pages.filter((page) => !page.html).map((page) => page.page),
    eventCount: deduped.length,
    pageDelayMs: PAGE_DELAY_MS,
    pages: manifestPages
  };
  await writeText(join(ROOT, "data", "tcs-events.json"), JSON.stringify({ meta, events: deduped }, null, 2) + "\n");
  await writeText(join(ROOT, "data", "tcs-events.js"), `window.TCS_DATA_META = ${JSON.stringify(meta)};\nwindow.TCS_EVENTS = ${JSON.stringify(deduped)};\n`);
  await writeText(join(ROOT, "data", "manifest.json"), JSON.stringify(meta, null, 2) + "\n");

  process.stdout.write(`\nSnapshot complete: ${meta.downloadedPages}/${meta.requestedPages} pages, ${meta.eventCount} unique events.\n`);
  if (meta.failedPages.length) process.exitCode = 1;
}

if (process.env.TCS_SKIP_MAIN !== "1") {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error}\n`);
    process.exitCode = 1;
  });
}

export { cleanText, findCells, findRowBlocks, parsePage };
