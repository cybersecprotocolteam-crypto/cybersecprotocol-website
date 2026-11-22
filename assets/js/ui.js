// Cybersec Protocol website: the site-wide interface layer. Plain JavaScript, no library, no network, no cookies.
// What it adds to every page: a scroll progress bar, a header that shrinks, a back-to-top button, toasts, reveal on
// scroll, a spotlight on cards, magnetic buttons, the command palette (Ctrl/Cmd+K or "/"), a shortcuts sheet ("?"),
// an accent colour (kept in this browser only), copy buttons, a table of contents with scrollspy on long pages, a
// search box on the FAQ, and a marker on external links.
(function () {
  "use strict";
  var doc = document, root = doc.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };
  function el(tag, cls, html) { var e = doc.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  // ── accent colour (this browser only) ──
  var accent = store("cp-accent");
  if (accent) root.setAttribute("data-accent", accent);

  // ── toasts ──
  var toasts = el("div", "toasts"); toasts.setAttribute("role", "status"); toasts.setAttribute("aria-live", "polite");
  doc.body.appendChild(toasts);
  window.cpToast = function (msg) {
    var t = el("div", "toast"); t.textContent = msg; toasts.appendChild(t);
    setTimeout(function () { t.classList.add("out"); setTimeout(function () { t.remove(); }, 260); }, 2200);
  };

  // ── progress bar, shrinking header, back-to-top ──
  var bar = el("div", "progress"); bar.setAttribute("aria-hidden", "true"); doc.body.appendChild(bar);
  var header = $(".site-header");
  var top = el("button", "to-top", '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="m6 14 6-6 6 6"/></svg>');
  top.type = "button"; top.setAttribute("aria-label", "Back to the top");
  top.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); });
  doc.body.appendChild(top);
  var ticking = false;
  function onScroll() {
    var h = root.scrollHeight - innerHeight, y = scrollY;
    bar.style.transform = "scaleX(" + (h > 0 ? Math.min(1, y / h) : 0) + ")";
    if (header) header.classList.toggle("is-small", y > 24);
    top.classList.toggle("on", y > 700);
    ticking = false;
  }
  addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  // ── reveal on scroll ──
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    $$(".card, .tile, .stat, .tl, .section-head, .reveal-me").forEach(function (n, i) {
      n.classList.add("reveal"); n.style.setProperty("--d", (i % 4) * 70 + "ms"); io.observe(n);
    });
  }

  // ── spotlight on cards, magnetic buttons ──
  doc.addEventListener("pointermove", function (e) {
    var s = e.target.closest && e.target.closest(".spot");
    if (s) { var r = s.getBoundingClientRect(); s.style.setProperty("--mx", e.clientX - r.left + "px"); s.style.setProperty("--my", e.clientY - r.top + "px"); }
  }, { passive: true });
  $$(".card").forEach(function (c) { c.classList.add("spot"); });
  if (!reduce && matchMedia("(pointer: fine)").matches) {
    $$(".btn-primary, .btn-ghost").forEach(function (b) {
      b.classList.add("mag");
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect(), x = (e.clientX - r.left - r.width / 2) / r.width, y = (e.clientY - r.top - r.height / 2) / r.height;
        b.style.transform = "translate(" + x * 6 + "px," + y * 6 + "px)";
      });
      b.addEventListener("pointerleave", function () { b.style.transform = ""; });
    });
  }

  // ── copy buttons on every code block and on elements marked data-copy ──
  function copy(text) {
    function done() { window.cpToast("Copied"); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
    function fallback() { var t = el("textarea"); t.value = text; t.style.position = "fixed"; t.style.opacity = "0"; doc.body.appendChild(t); t.select(); try { doc.execCommand("copy"); done(); } catch (e) { window.cpToast("Select the text and copy it"); } t.remove(); }
  }
  window.cpCopy = copy;
  $$("pre").forEach(function (p) {
    if (p.closest(".code-wrap")) return;
    var w = el("div", "code-wrap"); p.parentNode.insertBefore(w, p); w.appendChild(p);
    var b = el("button", "copy-btn", "Copy"); b.type = "button";
    b.addEventListener("click", function () { copy(p.innerText); });
    w.appendChild(b);
  });
  $$("[data-copy]").forEach(function (n) { n.addEventListener("click", function () { copy(n.getAttribute("data-copy") || n.textContent.trim()); }); });

  // ── a marker on links that leave the site ──
  $$("a[href^='http']").forEach(function (a) {
    if (a.hostname !== location.hostname && !a.querySelector("svg") && !a.classList.contains("btn")) { a.setAttribute("target", "_blank"); a.setAttribute("rel", "noopener"); a.insertAdjacentHTML("beforeend", '<span aria-hidden="true" style="font-size:.8em;opacity:.6"> ↗</span>'); }
  });

  // ── the table of contents with scrollspy, on long text pages ──
  var prose = $(".prose");
  if (prose) {
    var heads = $$("h2", prose);
    if (heads.length >= 3 && innerWidth > 960 && !$(".toc-rail")) {
      var wrap = prose.parentElement;
      var rail = el("nav", "toc-rail"); rail.setAttribute("aria-label", "On this page"); rail.appendChild(el("b", "", "On this page"));
      heads.forEach(function (h, i) {
        if (!h.id) h.id = "s" + (i + 1) + "-" + h.textContent.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
        var a = el("a"); a.href = "#" + h.id; a.textContent = h.textContent.replace(/^\d+\.\s*/, ""); rail.appendChild(a);
      });
      var grid = el("div", "wrap has-toc"); wrap.parentNode.insertBefore(grid, wrap); grid.appendChild(wrap); grid.appendChild(rail);
      wrap.classList.remove("wrap"); wrap.style.maxWidth = "none";
      var links = $$("a", rail);
      var spy = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { links.forEach(function (l) { l.classList.toggle("on", l.getAttribute("href") === "#" + e.target.id); }); } });
      }, { rootMargin: "-90px 0px -65% 0px" });
      heads.forEach(function (h) { spy.observe(h); });
    }
  }

  // ── a search box on the FAQ ──
  var faq = $$("details").length > 5 && /faq/.test(location.pathname);
  if (faq) {
    var first = $("details");
    var box = el("label", "search-box", '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="m21 21-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z"/></svg><input type="search" placeholder="Search the questions" aria-label="Search the questions">');
    first.parentNode.insertBefore(box, first);
    var inp = $("input", box), none = el("p", "muted", "Nothing matches. Try another word, or write to us from the contact page."); none.hidden = true; first.parentNode.appendChild(none);
    inp.addEventListener("input", function () {
      var q = inp.value.trim().toLowerCase(), n = 0;
      $$("details").forEach(function (d) { var ok = !q || d.textContent.toLowerCase().indexOf(q) > -1; d.hidden = !ok; if (ok) n++; if (q && ok) d.open = true; });
      $$("h2").forEach(function (h) { h.hidden = !!q; });
      none.hidden = n > 0;
    });
  }

  // ── the command palette ──
  var PAGES = [
    ["🏠", "Home", "What the app is", "/", "home start"],
    ["⬇️", "Download", "Get the app and verify it", "/download.html", "apk install get android google play"],
    ["💳", "Pricing", "Free and Elite", "/pricing.html", "price plan elite cost buy"],
    ["❓", "FAQ", "Questions people ask", "/faq.html", "questions help"],
    ["📖", "Free lessons", "Read lessons in the browser", "/lessons.html", "learn lesson read"],
    ["🧠", "Free quiz", "Try ten questions", "/quiz.html", "test practice"],
    ["🗺️", "Learn cybersecurity", "A beginner guide", "/learn-cybersecurity.html", "guide beginner start"],
    ["🧭", "Basics roadmap", "What to learn first", "/cybersecurity-roadmap.html", "path steps"],
    ["🎬", "Watch", "Short videos", "/watch.html", "video scam"],
    ["🤖", "CyberAi", "The study partner", "/cyberai.html", "ai gemini assistant chat"],
    ["🔒", "Privacy policy", "What we keep and why", "/privacy.html", "data"],
    ["🌐", "Internet use", "When the app uses the internet", "/internet.html", "network"],
    ["📜", "Terms of use", "The rules", "/terms.html", "legal"],
    ["💸", "Refunds", "How refunds work", "/refunds.html", "refund money back"],
    ["🛡️", "Report a vulnerability", "Found a problem? Tell us", "/security.html", "bug security report"],
    ["✉️", "Contact", "Write to the team", "/contact.html", "email support help"],
    ["ℹ️", "About", "Who makes it", "/about.html", "team"],
    ["🗑️", "Delete your account", "Remove your data", "/delete-account.html", "erase"]
  ];
  var ACTIONS = [
    ["🌗", "Switch theme", "Dark or light", function () { var b = $(".theme-btn"); if (b) b.click(); }],
    ["🎨", "Accent: teal", "Colour of highlights", function () { setAccent(""); }],
    ["🎨", "Accent: violet", "Colour of highlights", function () { setAccent("violet"); }],
    ["🎨", "Accent: mint", "Colour of highlights", function () { setAccent("mint"); }],
    ["🎨", "Accent: amber", "Colour of highlights", function () { setAccent("amber"); }],
    ["⌨️", "Keyboard shortcuts", "Press ? any time", function () { openKeys(); }],
    ["💬", "Join the Discord", "Ask questions", function () { window.open("https://discord.gg/BJmNWwPAj", "_blank", "noopener"); }]
  ];
  function setAccent(a) { if (a) { root.setAttribute("data-accent", a); store("cp-accent", a); } else { root.removeAttribute("data-accent"); store("cp-accent", ""); } window.cpToast("Accent changed"); }

  var back = el("div", "pal-back"); back.hidden = true;
  back.innerHTML = '<div class="pal" role="dialog" aria-modal="true" aria-label="Search the site"><div class="pal-in"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="m21 21-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z"/></svg><input type="text" placeholder="Search pages and actions" aria-label="Search pages and actions" autocomplete="off" spellcheck="false"></div><ul class="pal-list" role="listbox"></ul><div class="pal-foot"><span><kbd>↑</kbd> <kbd>↓</kbd> move</span><span><kbd>Enter</kbd> open</span><span><kbd>Esc</kbd> close</span></div></div>';
  doc.body.appendChild(back);
  var pin = $("input", back), plist = $(".pal-list", back), cur = 0, shown = [], lastFocus = null;
  function render(q) {
    q = (q || "").toLowerCase().trim(); shown = []; plist.innerHTML = "";
    function group(t) { plist.appendChild(el("li", "pal-group", t)); }
    var pg = PAGES.filter(function (p) { return !q || (p[1] + " " + p[2] + " " + p[4]).toLowerCase().indexOf(q) > -1; });
    var ac = ACTIONS.filter(function (a) { return !q || (a[1] + " " + a[2]).toLowerCase().indexOf(q) > -1; });
    if (pg.length) group("Pages"); pg.forEach(function (p) { shown.push({ ic: p[0], t: p[1], s: p[2], go: function () { location.href = p[3]; } }); });
    if (ac.length) group("Actions"); ac.forEach(function (a) { shown.push({ ic: a[0], t: a[1], s: a[2], go: a[3] }); });
    if (!shown.length) { plist.appendChild(el("li", "pal-group", "Nothing found")); }
    // rebuild the list in order with the groups
    plist.innerHTML = ""; var idx = 0;
    if (pg.length) { group("Pages"); pg.forEach(function () { add(shown[idx++]); }); }
    if (ac.length) { group("Actions"); ac.forEach(function () { add(shown[idx++]); }); }
    if (!shown.length) group("Nothing found");
    cur = 0; mark();
    function add(it) {
      var li = el("li", "pal-item", '<span class="ic">' + it.ic + '</span><span>' + it.t + '<small>' + it.s + '</small></span>'); li.setAttribute("role", "option");
      li.addEventListener("click", function () { close(); it.go(); });
      li.addEventListener("pointermove", function () { cur = shown.indexOf(it); mark(); });
      li._it = it; plist.appendChild(li);
    }
  }
  function mark() { $$(".pal-item", plist).forEach(function (li, i) { li.setAttribute("aria-selected", String(i === cur)); if (i === cur) li.scrollIntoView({ block: "nearest" }); }); }
  function open() { lastFocus = doc.activeElement; back.hidden = false; pin.value = ""; render(""); setTimeout(function () { pin.focus(); }, 0); }
  function close() { back.hidden = true; if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  pin.addEventListener("input", function () { render(pin.value); });
  pin.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown") { e.preventDefault(); cur = Math.min(shown.length - 1, cur + 1); mark(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); cur = Math.max(0, cur - 1); mark(); }
    else if (e.key === "Enter" && shown[cur]) { e.preventDefault(); close(); shown[cur].go(); }
  });
  back.addEventListener("pointerdown", function (e) { if (e.target === back) close(); });
  var k = el("button", "k-btn", '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="m21 21-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z"/></svg><span>Search</span><kbd>Ctrl K</kbd>');
  k.type = "button"; k.setAttribute("aria-label", "Search the site (Ctrl or Command K)"); k.addEventListener("click", open);
  var tb = $(".theme-btn"); if (tb && tb.parentNode) tb.parentNode.insertBefore(k, tb);
  if (/Mac|iPhone|iPad/.test(navigator.platform)) { var kb = $("kbd", k); if (kb) kb.textContent = "⌘ K"; }

  // ── the shortcuts sheet ──
  var kback = el("div", "pal-back"); kback.hidden = true;
  kback.innerHTML = '<div class="pal" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts"><div class="keys"><h2>Keyboard shortcuts</h2><div><span>Search the site</span><span><kbd>Ctrl</kbd> <kbd>K</kbd> or <kbd>/</kbd></span></div><div><span>This sheet</span><span><kbd>?</kbd></span></div><div><span>Switch theme</span><span><kbd>T</kbd></span></div><div><span>Back to the top</span><span><kbd>G</kbd> then <kbd>T</kbd></span></div><div><span>Close any window</span><span><kbd>Esc</kbd></span></div></div></div>';
  doc.body.appendChild(kback);
  function openKeys() { kback.hidden = false; }
  kback.addEventListener("pointerdown", function (e) { if (e.target === kback) kback.hidden = true; });

  var g = false;
  doc.addEventListener("keydown", function (e) {
    var typing = /INPUT|TEXTAREA|SELECT/.test((doc.activeElement || {}).tagName || "") || (doc.activeElement && doc.activeElement.isContentEditable);
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); back.hidden ? open() : close(); return; }
    if (e.key === "Escape") { if (!back.hidden) close(); if (!kback.hidden) kback.hidden = true; return; }
    if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === "/") { e.preventDefault(); open(); }
    else if (e.key === "?") { openKeys(); }
    else if (e.key.toLowerCase() === "t" && !g) { var b = $(".theme-btn"); if (b) b.click(); }
    else if (e.key.toLowerCase() === "g") { g = true; setTimeout(function () { g = false; }, 900); }
    if (g && e.key.toLowerCase() === "t") { window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); g = false; }
  });
})();

// Tabs on the pages other than home (the system checker on the download page).
(function () {
  Array.prototype.slice.call(document.querySelectorAll(".os-tabs")).forEach(function (root) {
    var ts = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]')), ps = Array.prototype.slice.call(root.querySelectorAll(".panel"));
    var guess = /Win/.test(navigator.platform) ? 0 : /Android/.test(navigator.userAgent) ? 3 : /Mac/.test(navigator.platform) ? 1 : /Linux|X11/.test(navigator.platform) ? 2 : 0;
    function pick(i, focus) { ts.forEach(function (t, k) { t.setAttribute("aria-selected", String(k === i)); t.tabIndex = k === i ? 0 : -1; }); ps.forEach(function (p, k) { p.classList.toggle("on", k === i); }); if (focus) ts[i].focus(); }
    ts.forEach(function (t, i) {
      t.addEventListener("click", function () { pick(i); });
      t.addEventListener("keydown", function (e) { if (e.key === "ArrowRight") { e.preventDefault(); pick((i + 1) % ts.length, true); } if (e.key === "ArrowLeft") { e.preventDefault(); pick((i + ts.length - 1) % ts.length, true); } });
    });
    pick(guess);
  });
})();
