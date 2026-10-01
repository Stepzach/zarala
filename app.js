// Published tabs from Zara's content spreadsheet. No fixed row limits.
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRqk41bIKnuD229OKMdksr3U0pM4By8EIIc9cKZc3NUvbS1Ym1gZZxLPK32uiPXRWwdAm9IebsCWcX8/pub";
const CONTENT_FEEDS = Object.fromEntries(Object.entries({
  gigs: "184492724", testimonials: "2133372136", setlist: "878801031", gallery: "635542522"
}).map(([section, gid]) => [section, `${SHEET_URL}?output=csv&single=true&gid=${gid}`]));
const BOOKING_FORM_URL = "";
const INSTAGRAM_URL = "https://www.instagram.com/zaralakemusic/";
const TIKTOK_URL = "https://www.tiktok.com/@zaralakemusic";
const REFRESH_INTERVAL_MS = 60000;
const contentSignatures = new Map();
let refreshInProgress = false;

document.addEventListener("DOMContentLoaded", () => {
  initMenu();
  initTicker();
  initExternalLinks();
  initLightbox();
  initMotion();
  refreshContent();
  setInterval(() => { if (!document.hidden) refreshContent(); }, REFRESH_INTERVAL_MS);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) refreshContent(); });
  window.addEventListener("online", refreshContent);
  document.querySelectorAll("[data-year]").forEach(el => el.textContent = new Date().getFullYear());
});

// Progressive enhancement: content is always visible, even without JS or motion APIs.
function initMotion() {
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!("IntersectionObserver" in window) || typeof Element.prototype.animate !== "function") return;

  const played = new WeakSet();
  const running = new Set();
  const reveal = (element, delay = 0) => {
    if (preference.matches || played.has(element)) return;
    played.add(element);
    const animation = element.animate([
      { opacity: .65, translate: "0 14px" },
      { opacity: 1, translate: "0 0" }
    ], { duration: 520, delay, easing: "cubic-bezier(.22, 1, .36, 1)" });
    running.add(animation);
    animation.finished.catch(() => {}).finally(() => running.delete(animation));
  };
  const observer = new IntersectionObserver(entries => {
    entries.forEach(({ target, isIntersecting }) => {
      if (!isIntersecting) return;
      reveal(target);
      observer.unobserve(target);
    });
  }, { threshold: .15 });

  const syncPreference = () => {
    observer.disconnect();
    if (preference.matches) {
      running.forEach(animation => animation.cancel());
      running.clear();
      return;
    }
    document.querySelectorAll(".section h2:not(.sr-only)").forEach(heading => {
      if (!played.has(heading)) observer.observe(heading);
    });
  };
  preference.addEventListener("change", syncPreference);
  syncPreference();
  // Animate the words, preserving the wordmark's existing rotations and readable text.
  document.querySelectorAll(".wordmark > span").forEach((word, index) => reveal(word, index * 70));
}

async function refreshContent() {
  if (refreshInProgress) return;
  refreshInProgress = true;
  try {
    await Promise.allSettled([
      loadGigs(),
      loadSection("testimonials", "#testimonials", ["quote", "name"], createQuote, row => row.quote && row.name),
      loadSection("setlist", "#setlist", ["song", "artist"], createSong, row => row.song),
      loadSection("gallery", "#gallery-images", ["image_url", "alt"], createPhoto, row => safeHttpUrl(row.image_url) && row.alt)
    ]);
  } finally { refreshInProgress = false; }
}

// Avoid rebuilding unchanged content (and moving keyboard focus) on refresh.
function contentChanged(key, rows) {
  const signature = JSON.stringify(rows);
  if (contentSignatures.get(key) === signature) return false;
  contentSignatures.set(key, signature);
  return true;
}
function clearFeedStatus(container) {
  container.parentElement?.querySelector(`[data-feed-status="${container.id}"]`)?.remove();
}
function showFeedStatus(container, message) {
  clearFeedStatus(container);
  const note = textElement("p", message);
  note.className = "status";
  note.dataset.feedStatus = container.id;
  note.setAttribute("role", "status");
  container.after(note);
}

function initMenu() {
  const button = document.querySelector("[data-menu-button]");
  const nav = document.querySelector("[data-nav]");
  if (!button || !nav) return;

  const setOpen = (open) => {
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);
  };

  button.addEventListener("click", () => setOpen(button.getAttribute("aria-expanded") !== "true"));
  nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && button.getAttribute("aria-expanded") === "true") {
      setOpen(false);
      button.focus();
    }
  });
  window.addEventListener("resize", () => {
    if (window.matchMedia("(min-width: 801px)").matches) setOpen(false);
  });
}

function initTicker() {
  const button = document.querySelector("[data-ticker-toggle]");
  const ticker = document.querySelector(".ticker");
  if (!button || !ticker) return;
  button.addEventListener("click", () => {
    const paused = button.getAttribute("aria-pressed") !== "true";
    button.setAttribute("aria-pressed", String(paused));
    button.setAttribute("aria-label", paused ? "Resume scrolling performance information" : "Pause scrolling performance information");
    button.firstElementChild.textContent = paused ? "▶" : "Ⅱ";
    ticker.classList.toggle("is-paused", paused);
  });
}

function initExternalLinks() {
  document.querySelectorAll("[data-booking-link]").forEach(link => {
    const url = safeHttpUrl(BOOKING_FORM_URL);
    link.href = url || "mailto:hello@zaralakemusic.com?subject=Booking%20enquiry";
    if (!url) link.removeAttribute("target");
  });
  [["instagram", INSTAGRAM_URL], ["tiktok", TIKTOK_URL]].forEach(([platform, value]) => {
    document.querySelectorAll(`[data-${platform}-link]`).forEach(link => {
      const url = safeHttpUrl(value);
      if (url) {
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      } else {
        link.removeAttribute("href");
        link.setAttribute("aria-disabled", "true");
        link.title = `${platform === "tiktok" ? "TikTok" : "Instagram"} coming soon`;
        const action = link.querySelector(".social-action");
        if (action) action.textContent = "Coming soon";
        else link.append(document.createTextNode(" · soon"));
      }
    });
  });
}

function initLightbox() {
  const dialog = document.querySelector("[data-lightbox]");
  const image = document.querySelector("[data-lightbox-image]");
  const close = document.querySelector("[data-lightbox-close]");
  if (!dialog || !image || !close || typeof dialog.showModal !== "function") return;

  document.querySelector("#gallery-images")?.addEventListener("click", event => {
    const button = event.target.closest("[data-lightbox-src]");
    if (!button) return;
    const thumb = button.querySelector("img");
    image.src = button.dataset.lightboxSrc || thumb?.src || "";
    image.alt = thumb?.alt || "Gallery image";
    dialog.showModal();
  });
  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => {
    const rect = dialog.getBoundingClientRect();
    const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
    if (!inside) dialog.close();
  });
  dialog.addEventListener("close", () => { image.src = ""; });
}

async function loadGigs() {
  const list = document.querySelector("#gig-list");
  if (!list) return;

  try {
    const rows = await fetchRows(CONTENT_FEEDS.gigs, ["date", "venue"]);
    // Display every visible row in Sheet order, regardless of date or date format.
    const gigs = rows.map(normalizeGig).filter(gig => gig.visible);

    clearFeedStatus(list);
    if (!contentChanged("gigs", gigs)) return;
    list.replaceChildren();
    list.setAttribute("aria-busy", "false");
    if (!gigs.length) {
      list.innerHTML = '<p class="status">No gigs listed right now — check back soon.</p>';
      return;
    }
    gigs.forEach(gig => list.append(createGigCard(gig)));
  } catch (error) {
    console.error("Could not load gigs", error);
    list.setAttribute("aria-busy", "false");
    if (contentSignatures.has("gigs")) {
      showFeedStatus(list, "Latest dates are temporarily unavailable. Showing the last loaded dates.");
    } else {
      list.innerHTML = '<p class="status">Live dates could not be loaded right now. Please check back soon.</p>';
    }
  }
}

function parseCSV(csv) {
  const rows = [];
  let row = [], value = "", quoted = false;
  for (let i = 0; i < csv.length; i++) {
    const char = csv[i], next = csv[i + 1];
    if (char === '"' && quoted && next === '"') { value += '"'; i++; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(value); value = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i++;
      row.push(value); rows.push(row); row = []; value = "";
    } else value += char;
  }
  if (value || row.length) { row.push(value); rows.push(row); }
  if (!rows.length) return [];
  const headers = rows.shift().map(h => h.trim().toLowerCase().replace(/\s+/g, "_"));
  return rows.filter(r => r.some(v => v.trim())).map(r => Object.fromEntries(headers.map((h, i) => [h, (r[i] || "").trim()])));
}

function normalizeGig(gig) {
  return {
    dateLabel: gig.date || "Date to be confirmed",
    venue: gig.venue || "Live performance",
    location: gig.location || "",
    time: gig.time || "",
    description: gig.description || "",
    link: safeHttpUrl(gig.link),
    visible: isVisible(gig)
  };
}

function safeHttpUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch { return ""; }
}

function createGigCard(gig) {
  const article = document.createElement("article");
  article.className = "gig-card";

  const date = document.createElement("div");
  date.className = "gig-date";
  const label = document.createElement("span");
  label.className = "gig-date-label";
  label.textContent = gig.dateLabel;
  date.append(label);

  const info = document.createElement("div");
  info.className = "gig-info";
  const title = document.createElement("h3");
  title.textContent = gig.venue;
  info.append(title);
  if (gig.location) { const p = document.createElement("p"); p.textContent = gig.location; info.append(p); }
  if (gig.time) { const p = document.createElement("p"); p.className = "gig-time"; p.textContent = gig.time; info.append(p); }
  if (gig.description) { const p = document.createElement("p"); p.textContent = gig.description; info.append(p); }

  article.append(date, info);
  if (gig.link) {
    const action = document.createElement("a");
    action.className = "gig-action";
    action.href = gig.link;
    action.target = "_blank";
    action.rel = "noopener noreferrer";
    action.textContent = "Details ↗";
    article.append(action);
  }
  return article;
}

// Independent feeds: a failure in one section cannot stop the others.
async function fetchRows(url, requiredHeaders) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const requestUrl = new URL(url);
    requestUrl.searchParams.set("_", String(Date.now()));
    const response = await fetch(requestUrl.href, { cache: "no-store", signal: controller.signal });
    if (!response.ok) throw new Error(`Content feed returned ${response.status}`);
    const csv = (await response.text()).replace(/^\uFEFF/, "");
    // Validate even a header-only tab; an empty published tab is intentional.
    const header = parseCSV(csv + "\n__header_check__").at(-1) || {};
    if (!requiredHeaders.every(key => Object.hasOwn(header, key))) throw new Error("Incorrect content tab or missing column headers");
    return parseCSV(csv);
  } finally { clearTimeout(timeout); }
}
function isVisible(row) {
  return !["false", "0", "no", "hide", "hidden"].includes((row.visible || "").toLowerCase());
}
function orderedRows(rows) {
  return rows.filter(isVisible).sort((a, b) => {
    const rank = r => r.order !== "" && Number.isFinite(Number(r.order)) ? Number(r.order) : Number.MAX_SAFE_INTEGER;
    return rank(a) - rank(b);
  });
}
async function loadSection(key, selector, headers, create, valid) {
  const container = document.querySelector(selector);
  if (!container || !CONTENT_FEEDS[key]) return;
  container.setAttribute("aria-busy", "true");
  try {
    const visibleRows = orderedRows(await fetchRows(CONTENT_FEEDS[key], headers));
    const rows = visibleRows.filter(valid);
    // Incomplete draft rows must not prevent other published rows from updating.
    if (rows.length !== visibleRows.length) console.warn(`Skipped incomplete rows in ${key}`);
    clearFeedStatus(container);
    if (contentChanged(key, rows)) container.replaceChildren(...rows.map(create));
    container.closest("section").hidden = rows.length === 0;
  } catch (error) {
    console.warn(`Could not refresh ${key}; retaining existing content.`, error);
    showFeedStatus(container, "Latest updates are temporarily unavailable. Showing saved content.");
  } finally { container.setAttribute("aria-busy", "false"); }
}
function textElement(tag, text) {
  const el = document.createElement(tag);
  el.textContent = text || "";
  return el;
}
function createQuote(row) {
  const figure = document.createElement("figure");
  const caption = document.createElement("figcaption");
  caption.append(textElement("strong", row.name), textElement("span", row.location));
  figure.append(textElement("blockquote", `“${row.quote.replace(/^[“”"]|[“”"]$/g, "")}”`), caption);
  return figure;
}
function createSong(row) {
  const li = document.createElement("li");
  li.append(textElement("span", row.song), textElement("small", row.artist));
  return li;
}
function createPhoto(row, index) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `photo photo-${["a", "b", "c", "d"][index % 4]}`;
  button.dataset.lightboxSrc = safeHttpUrl(row.image_url);
  const img = document.createElement("img");
  img.src = button.dataset.lightboxSrc;
  img.alt = row.alt;
  img.loading = "lazy";
  img.decoding = "async";
  button.append(img);
  return button;
}
