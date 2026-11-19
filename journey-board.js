/* Trip-specific visual itinerary and transport-first board.
 * Uses only published trip.json mobility data; no runtime schedule inference.
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(() => {
  "use strict";
  const viewRoot = document.querySelector("#view-root");
  const baseTrip = renderTrip;
  const baseMap = renderMap;
  const baseNow = renderNow;
  let lastScreen = "";
  function scrollOnScreenChange(key) {
    if (key === lastScreen) return;
    lastScreen = key;
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  const originalRender = render;
  render = function compactNavRender() {
    originalRender();
    document.body.classList.toggle("tl-route-screen", state.view === "trip" || state.view === "map");
  };
  const modeNames = {
    train: "JR／鐵道", subway: "地鐵", cable: "纜車", bus: "巴士", walk: "步行",
    boat: "渡船", flight: "飛機", stay: "住宿", task: "準備", event: "活動"
  };
  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
  const esc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  })[c]);
  const mapHandoff = (name) =>
    "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(String(name || ""));
  function icon(mode) {
    return (window.TravelLiteIcons?.svg?.(mode) || "");
  }
  function dayByDate(date) {
    return state.data?.days?.find((day) => day.date === date);
  }
  function dateLabel(day) {
    const date = new Date(day.date + "T12:00:00+09:00");
    return day.date.slice(5).replace("-", "/") + " · 週" + weekdays[date.getUTCDay()];
  }
  function uniqueModes(legs) {
    return [...new Set(legs.map((leg) => leg.mode).filter((m) => ["train","subway","cable","bus","walk","boat","flight"].includes(m)))];
  }
  function journeyStages(legs, stageLegIds) {
    if (legs.length < 2) return [];
    // Optional ordering of already-published leg IDs, never duplicate a time
    // or invent a stage. Long routes need to show the critical interchange,
    // not just the first five steps from an early-only slice.
    if (Array.isArray(stageLegIds) && stageLegIds.length >= 2 && stageLegIds.length <= 5) {
      const byId = new Map(legs.map((leg) => [leg.id, leg]));
      const selected = stageLegIds.map((id) => byId.get(id)).filter(Boolean);
      if (selected.length === stageLegIds.length && new Set(selected).size === selected.length)
        return selected;
    }
    const picked = [legs[0], ...legs.filter((leg) => leg.critical), legs[legs.length - 1]];
    const unique = [...new Set(picked)];
    return unique.length <= 5 ? unique : [...unique.slice(0, 4), unique.at(-1)];
  }
  function stageRail(legs, stageLegIds) {
    const stages = journeyStages(legs, stageLegIds);
    if (!stages.length) return "";
    return '<div class="tl-stage-rail" aria-label="關鍵交通節點">' + stages.map((leg, i) =>
      '<div class="tl-stage">' +
        '<div class="tl-stage-dot">' + (i + 1) + '</div>' +
        '<strong>' + esc(leg.depart) + '</strong>' +
        '<span>' + esc(leg.from) + '</span>' +
      '</div>'
    ).join("") + '</div>';
  }
  function metaTag(leg) {
    if (leg.critical) return '<span class="tl-pill tl-pill-key">關鍵</span>';
    if (leg.status === "unconfirmed") return '<span class="tl-pill tl-pill-open">未確認</span>';
    if (leg.status === "confirmed") return '<span class="tl-pill tl-pill-confirmed">已訂</span>';
    return "";
  }
  function legRow(leg, i) {
    const query = (leg.mode === "stay" || leg.mode === "event") ? leg.to : leg.from;
    const suppliedMap = trustedPilgrimUrl(leg.mapsUrl);
    const mapLabel = suppliedMap
      ? '在 Google Maps 開啟 ' + leg.from + ' → ' + leg.to + '；非即時班表'
      : '在 Google Maps 搜尋 ' + query + '；非即時班表';
    const map = '<a class="tl-map-link" href="' + esc(suppliedMap || mapHandoff(query)) +
      '" target="_blank" rel="noopener noreferrer" aria-label="' + esc(mapLabel) +
      '" title="' + (suppliedMap ? 'Google Maps 路線或地點' : 'Google Maps 地點搜尋') + ' · 非即時班表">' + (window.TravelLiteIcons?.svg?.("map-pin") || "") + '</a>';
    const hidden = leg.hint
      ? '<details class="tl-leg-extra"><summary aria-label="展開此段乘車細節" title="乘車細節">···</summary><p>' + esc(leg.hint) + '</p></details>'
      : "";
    const early = leg.critical ? '<p class="tl-critical-hint">' + esc(leg.hint) + '</p>' : "";
    return '<li class="tl-leg ' + (leg.critical ? 'tl-leg-critical ' : '') +
      (leg.status === 'unconfirmed' ? 'tl-leg-pending' : '') + '">' +
      '<div class="tl-leg-clock"><strong>' + esc(leg.depart) + '</strong><span>↓ ' + esc(leg.arrive) + '</span></div>' +
      '<div class="tl-leg-track"><span class="tl-node"></span></div>' +
      '<div class="tl-leg-main">' +
        '<div class="tl-leg-service"><span class="tl-mode-icon tl-mode-' + esc(leg.mode) + '">' + icon(leg.mode) +
        '</span><span>' + esc(leg.service || modeNames[leg.mode] || "") + '</span>' + metaTag(leg) + '</div>' +
        '<div class="tl-leg-stations"><strong>' + esc(leg.from) + '</strong><span aria-hidden="true">→</span><strong>' + esc(leg.to) + '</strong></div>' +
        early + (leg.critical ? '' : hidden) +
      '</div>' + map + '</li>';
  }
  function alternativeCards(alternatives, day) {
    if (!alternatives?.length) return "";
    const kumano = day.date === "2026-11-11";
    return '<details class="tl-branches" ' + (kumano ? 'data-connection-choices="52"' : '') + '>' +
      '<summary><span><strong>' + (kumano ? '52 號班次比較' : '條件式備案') +
      '</strong><small>' + alternatives.length + ' 組 · ' +
      (kumano ? '大齋原前站出發' : '僅符合條件時啟用') + '</small></span><b aria-hidden="true">＋</b></summary>' +
      '<div class="tl-branch-grid">' + alternatives.map((alt) =>
      '<article class="tl-branch ' + (alt.status === 'main' ? 'tl-branch-main' : '') + '">' +
        '<div class="tl-branch-time">' + esc(alt.time) +
        '<span>→ ' + esc(alt.arrival) + '</span></div>' +
        '<strong>' + esc(alt.title) + '</strong>' +
        '<p>' + esc(alt.text) + '</p>' +
      '</article>').join("") + '</div></details>';
  }
  function optionCards(options) {
    if (!options?.length) return "";
    return '<div class="tl-option-grid" aria-label="候選交通動線">' +
      options.map((opt, i) =>
      '<article class="tl-option"><span class="tl-option-number">' +
      String(i+1).padStart(2,"0") + '</span><strong>' + esc(opt.title) +
      '</strong><p>' + esc(opt.line) + '</p><small>' + esc(opt.duration) + '</small></article>'
      ).join("") + '</div>';
  }
  function trustedPilgrimUrl(raw) {
    if (typeof raw !== "string") return "";
    try {
      const url = new URL(raw);
      return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : "";
    } catch { return ""; }
  }
  function pilgrimSources(links, limit = 3) {
    return (Array.isArray(links) ? links : []).slice(0, limit).map((entry) => {
      const url = trustedPilgrimUrl(entry.url);
      return url ? '<a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' +
        esc(entry.label) + ' ↗</a>' : "";
    }).join("");
  }
  function credentialPickupCard(day) {
    if (day.date !== "2026-11-10") return "";
    const p = state.data?.pilgrimage;
    if (!p) return "";
    const primary = p.pickups.find((point) => point.id === p.pickupDeadline.locationId);
    if (!primary) return "";
    const booking = p.credentials.map((credential) => {
      return '<article class="tl-credential-kind"><span>' + esc(credential.price) + '</span>' +
        '<strong>' + esc(credential.name) + '</strong><small>' + esc(credential.purpose) + '</small>' +
        '<p>' + esc(credential.requirement) + '</p></article>';
    }).join("");
    const pickupRows = p.pickups.map((site) => {
      return '<li><div><strong>' + esc(site.name) + '</strong>' +
        '<small>' + esc(site.where) + ' · ' + esc(site.hours) + '</small>' +
        '<small>' + esc(site.note) + '</small></div>' +
        '<span>' + (site.dual ? '免費' : '') + (site.nakahechi ? ' · ¥100' : '') + '</span></li>';
    }).join("");
    return '<section class="tl-credential-card" aria-label="11月10日巡禮手冊領取">' +
      '<div class="tl-credential-header"><span class="tl-stamp-symbol" aria-hidden="true">印</span>' +
        '<div><small>11/11 古道出發前</small><strong>先領空白集章手冊</strong></div>' +
        '<span class="tl-credential-free">免費</span></div>' +
      '<div class="tl-credential-main"><div><strong>' + esc(p.pickupDeadline.closing) +
        '</strong><small>11/10 關門</small></div><div><strong>' + esc(primary.name) + '</strong>' +
        '<small>' + esc(primary.where) + ' · ' + esc(primary.hours) + '</small></div>' +
        '<a href="' + esc(mapHandoff(primary.local + " " + primary.address)) +
        '" target="_blank" rel="noopener noreferrer" aria-label="Google Maps 搜尋田邊市觀光中心">' +
         (window.TravelLiteIcons?.svg?.("map-pin") || "") + '</a></div>' +
      '<p class="tl-credential-risk">' + esc(p.pickupDeadline.risk) + '</p>' +
      '<details class="tl-credential-details"><summary>兩種手冊／5 處領取點 <b>＋</b></summary>' +
        '<div class="tl-credential-kinds">' + booking + '</div>' +
        '<ol class="tl-pickup-sites">' + pickupRows + '</ol>' +
        '<p class="tl-credential-fallback">' + esc(p.pickupDeadline.fallback) + '</p>' +
        '<div class="tl-credential-links">' + pilgrimSources(p.sources, 4) + '</div>' +
      '</details></section>';
  }
  function pilgrimageStampCard(day) {
    if (!["2026-11-11", "2026-11-12"].includes(day.date)) return "";
    const p = state.data?.pilgrimage;
    if (!p?.route?.stamps) return "";
    const stamps = p.route.stamps.filter((stop) => stop.date === day.date);
    if (!stamps.length) return "";
    const full = p.route.stamps.length;
    const stampRows = stamps.map((stop, index) =>
      '<li class="tl-stamp-stop"><span class="tl-stamp-order">' +
        String(index + 1).padStart(2, "0") + '</span><div><strong>' +
        esc(stop.name) + '</strong><small>' + esc(stop.local) +
        ' · ' + esc(stop.phase) + '</small></div></li>'
    ).join("");
    return '<details class="tl-stamp-card" data-stamp-day="' + esc(day.date) + '">' +
      '<summary><span class="tl-stamp-symbol" aria-hidden="true">印</span>' +
        '<span class="tl-stamp-heading"><strong>雙朝聖集章</strong><small>今日 ' +
        stamps.length + ' 處 · 兩日共 ' + full + ' 處</small></span>' +
        '<span class="tl-stamp-expand">展開 ＋</span></summary>' +
      '<ol class="tl-stamp-stops">' + stampRows + '</ol>' +
      '<p class="tl-stamp-guide-tip">' +
      (day.date === "2026-11-11"
        ? '發心門王子出發前先蓋章；熊野本宮大社的完成章請蓋在雙朝聖手冊「熊野側第一頁」。'
        : '這三處是熊野側7km＋熊野三社方案的延續，不是41章完全踏破。') + '</p>' +
      '<p class="tl-stamp-guide-context">' + esc(p.route.caveat) + '</p>' +
      '<div class="tl-credential-links">' + pilgrimSources(p.sources.slice(1, 4), 3) + '</div>' +
      '</details>';
  }

  function board(day, context) {
    const m = day.mobility;
    if (!m) return "";
    const legs = Array.isArray(m.legs) ? m.legs : [];
    const num = state.data.days.findIndex((entry) => entry.date === day.date) + 1;
    const stampCount = (state.data?.pilgrimage?.route?.stamps || [])
      .filter((stop) => stop.date === day.date).length;
    const modes = uniqueModes(legs).map((mode) =>
      '<span class="tl-overview-mode" title="' + esc(modeNames[mode]) + '">' + icon(mode) + '</span>').join("");
    const alert = m.attention && m.attentionLevel !== 'neutral'
      ? '<p class="tl-alert tl-alert-' + esc(m.attentionLevel || 'caution') + '">' +
        '<span class="tl-alert-mark" aria-hidden="true">!</span><span>' + esc(m.attention) + '</span></p>'
      : "";
    const boardTitle = context === "map" ? "交通步驟" : "交通快覽";
    const referenceLink = '<a href="./reference.html#' +
      (day.date === '2026-11-06' ? 'ise-primary' : day.date === '2026-11-11' ? 'kumano' : 'days') +
      '" class="tl-source-link" target="_blank" rel="noopener noreferrer">完整來源時刻 <span aria-hidden="true">↗</span></a>';
    return '<section class="tl-board" aria-label="' + esc(day.date) + ' 行程與交通">' +
      '<header class="tl-board-head">' +
        '<div class="tl-board-number"><small>DAY</small><strong>' + String(num).padStart(2, "0") + '</strong></div>' +
        '<div class="tl-board-title"><p>' + esc(dateLabel(day)) + '</p><h2>' + esc(m.label || day.title) + '</h2>' +
        '<div class="tl-mode-list" aria-label="交通方式">' + modes + '<span>' + esc(m.callout || '') + '</span>' +
        (stampCount ? '<span class="tl-stamp-signal">印 ' + stampCount + ' 處</span>' : '') + '</div></div>' +
      '</header>' +
      '<div class="tl-route-frame"><div><small>START</small><strong>' + esc(m.from) + '</strong></div>' +
        '<span class="tl-route-arrow" aria-hidden="true">→</span>' +
        '<div><small>FINISH</small><strong>' + esc(m.to) + '</strong></div></div>' +
      stageRail(legs, m.stageLegIds) + alert + credentialPickupCard(day) +
      (m.attentionLevel === 'neutral' && m.attention
        ? '<p class="tl-neutral-line">' + esc(m.attention) + '</p>' : '') +
      '<div class="tl-list-head"><h3>' + boardTitle + '</h3><span>' +
      (legs.length ? (legs.length + ' 段') : '選項') + '</span></div>' +
      (legs.length ? '<ol class="tl-leg-list">' + legs.map(legRow).join("") + '</ol>' :
        optionCards(m.options)) +
      alternativeCards(m.alternatives, day) + pilgrimageStampCard(day) +
      '<footer class="tl-board-foot"><span>行程快照 · 非即時交通</span>' + referenceLink + '</footer>' +
      '</section>';
  }
  function foldPublicationWarning() {
    const notice = viewRoot.querySelector(".trip-trust-notice");
    if (!notice || notice.closest(".tl-trust-fold")) return;
    const fold = document.createElement("details");
    fold.className = "tl-trust-fold";
    fold.innerHTML = '<summary><strong>行程草稿 · 班次待核對</strong><span>說明 ＋</span></summary>';
    notice.before(fold);
    fold.appendChild(notice);
  }
  // Overview layout and navigation are now owned by the shared Template.
  // Keep only the short, source-published Kansai mobility cues; do not rewrite
  // the hero/card markup, because that bypasses shared layout contracts.
  function enhanceOverview() {
    if (!viewRoot.querySelector(".trip-overview-view")) return;
    viewRoot.querySelectorAll(".trip-overview-compact-day[data-trip-day]").forEach((button) => {
      const day = dayByDate(button.dataset.tripDay);
      const cue = typeof day?.mobility?.callout === "string"
        ? day.mobility.callout.trim() : "";
      const signals = button.querySelector(".trip-compact-day-signals");
      if (!cue || !signals || signals.querySelector("small")) return;
      const note = document.createElement("small");
      note.textContent = cue;
      if (day.mobility?.attentionLevel === "danger") note.classList.add("tl-cue-pending");
      signals.appendChild(note);
    });
  }
  function enhanceDay() {
    const layout = viewRoot.querySelector(".trip-day-view");
    if (!layout || layout.querySelector(".tl-board")) return;
    const active = layout.querySelector('[data-trip-day].active');
    const day = dayByDate(active?.dataset.tripDay || state.selectedDate);
    if (!day?.mobility) return;
    const section = layout.querySelector(".trip-timeline-section");
    if (!section) return;
    // Travel segments and visits stay together in the visible source timeline.
    // The detailed transport board is an optional reference after that sequence.
    const details = document.createElement("details");
    details.className = "tl-complete-itinerary";
    details.innerHTML = '<summary><span>交通班次與備選</span><small>' +
      (day.mobility.legs?.length || 0) + ' 段參考</small><b>＋</b></summary>' + board(day, "trip");
    section.after(details);
  }
  renderTrip = function visualTripRender() {
    baseTrip();
    enhanceOverview();
    enhanceDay();
    foldPublicationWarning();
    scrollOnScreenChange(viewRoot.querySelector(".trip-day-view") ? "trip:" + state.selectedDate : "trip:overview");
  };
  renderMap = function visualTransportRender() {
    const previousMap = viewRoot.querySelector(".tl-map-optional");
    // Stored-view hydration renders before the incoming route is applied. Open
    // an explicit stop on that first render, then preserve any manual collapse.
    const incomingStop = /^#(?:map|transport)\/day\/[^/]+\/stop\/[^/]+\/?$/.test(window.location.hash);
    const openMap = previousMap ? previousMap.open : Boolean(state.selectedMapItemId || incomingStop);
    baseMap();
    const day = dayByDate(state.selectedDate) || state.data.days[0];
    const panel = viewRoot.querySelector(".runtime-map-panel");
    const tabs = viewRoot.querySelector(".map-day-tabs");
    if (!panel || !tabs || !day?.mobility) return;
    tabs.insertAdjacentHTML("afterend", board(day, "map"));
    const extra = document.createElement("details");
    extra.className = "tl-map-optional";
    extra.open = openMap;
    extra.innerHTML = '<summary><strong>地圖與站點</strong><span>位置參考 · 非交通時刻</span><b>＋</b></summary>';
    panel.before(extra);
    extra.appendChild(panel);
    foldPublicationWarning();
    scrollOnScreenChange("map:" + day.date);
    extra.addEventListener("toggle", () => {
      if (extra.open) requestAnimationFrame(() => window.TravelLiteMap?.resize());
    });
  };
  renderNow = function visualNowRender() {
    baseNow();
    foldPublicationWarning();
    scrollOnScreenChange("now");
    const today = zonedNow(state.data?.trip?.timezone || "Asia/Tokyo").date;
    const day = dayByDate(today);
    const stack = viewRoot.querySelector(".view-stack");
    if (!day?.mobility || !stack) return;
    const m = day.mobility;
    const button = document.createElement("button");
    button.className = "tl-today-transport";
    button.type = "button";
    button.innerHTML = '<span><small>今日交通</small><strong>' +
      esc(m.callout || m.label) + '</strong></span><span>看完整動線 ›</span>';
    button.addEventListener("click", () => { state.view = "map"; state.selectedDate = day.date; render(); });
    stack.prepend(button);
  };
})();
