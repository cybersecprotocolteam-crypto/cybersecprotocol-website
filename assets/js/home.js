// Cybersec Protocol home page: the interactive sections. Plain JavaScript, no library, no network.
// Everything here runs in the visitor's browser and sends nothing anywhere. The little demos are labelled as demos.
(function () {
  "use strict";
  var doc = document;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };
  function el(tag, cls, html) { var e = doc.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function toast(m) { if (window.cpToast) window.cpToast(m); }

  // ── confetti (a small canvas, gone after two seconds) ──
  function confetti() {
    if (reduce) return;
    var c = el("canvas", "confetti"); c.width = innerWidth; c.height = innerHeight; doc.body.appendChild(c);
    var x = c.getContext("2d"), cols = ["#22e3ff", "#8b7cf6", "#3ddc97", "#ffb020", "#ff6b9a"], ps = [];
    for (var i = 0; i < 110; i++) ps.push({ x: innerWidth / 2, y: innerHeight * 0.55, vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 14 - 4, s: Math.random() * 6 + 3, c: cols[i % 5], r: Math.random() * 6 });
    var t0 = performance.now();
    (function f(t) {
      x.clearRect(0, 0, c.width, c.height);
      ps.forEach(function (p) { p.vy += 0.35; p.x += p.vx; p.y += p.vy; p.r += 0.2; x.fillStyle = p.c; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6); x.restore(); });
      if (t - t0 < 2100) requestAnimationFrame(f); else c.remove();
    })(t0);
  }

  // ── animated counters and rings ──
  var counted = false;
  function runStats() {
    if (counted) return; counted = true;
    $$(".stat").forEach(function (s) {
      var to = +s.getAttribute("data-to"), of = +s.getAttribute("data-of") || to, num = $(".num", s), fg = $(".fg", s), suffix = s.getAttribute("data-suffix") || "";
      fg.style.strokeDashoffset = 264 - 264 * Math.min(1, to / of);
      if (reduce) { num.textContent = to + suffix; return; }
      var t0 = performance.now();
      (function f(t) { var p = Math.min(1, (t - t0) / 1300), e = 1 - Math.pow(1 - p, 3); num.textContent = Math.round(to * e) + suffix; if (p < 1) requestAnimationFrame(f); })(t0);
    });
  }
  var st = $("#stats");
  if (st && "IntersectionObserver" in window) { new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { runStats(); o.disconnect(); } }, { threshold: 0.3 }).observe(st); } else runStats();

  // ── the marquee ──
  var mt = $(".marquee-track");
  if (mt) { var items = mt.innerHTML; mt.innerHTML = items + items; }

  // ── the section chips with scrollspy ──
  var chips = $$(".chip-link");
  if (chips.length && "IntersectionObserver" in window) {
    var map = {}; chips.forEach(function (c) { map[c.getAttribute("href").slice(1)] = c; });
    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { chips.forEach(function (c) { c.classList.remove("on"); }); var c = map[e.target.id]; if (c) { c.classList.add("on"); c.scrollIntoView({ inline: "center", block: "nearest" }); } } });
    }, { rootMargin: "-30% 0px -60% 0px" });
    Object.keys(map).forEach(function (id) { var s = doc.getElementById(id); if (s) spy.observe(s); });
  }

  // ── tabs (the playground) ──
  function tabs(root) {
    var ts = $$('[role="tab"]', root), ps = $$(".panel", root);
    function pick(i, focus) { ts.forEach(function (t, k) { t.setAttribute("aria-selected", String(k === i)); t.tabIndex = k === i ? 0 : -1; }); ps.forEach(function (p, k) { p.classList.toggle("on", k === i); }); if (focus) ts[i].focus(); }
    ts.forEach(function (t, i) {
      t.addEventListener("click", function () { pick(i); });
      t.addEventListener("keydown", function (e) { if (e.key === "ArrowRight") { e.preventDefault(); pick((i + 1) % ts.length, true); } if (e.key === "ArrowLeft") { e.preventDefault(); pick((i + ts.length - 1) % ts.length, true); } });
    });
    pick(0);
  }
  $$("[data-tabs]").forEach(tabs);

  // ── 1. spot the phish ──
  var mail = $("#mail");
  if (mail) {
    var FLAGS = {
      from: "The sender's address ends in a strange domain, not your bank's own.",
      subject: "Fear and a deadline: scams push you to act before you think.",
      greet: "A real bank uses your name. \"Dear customer\" means a mass message.",
      link: "The link's real address does not match the bank. Press and hold a link to see it.",
      attach: "An unexpected attachment is a classic way to deliver malware."
    };
    var found = {}, wrong = 0, score = $("#mail-score"), note = $("#mail-note");
    function upd() { score.textContent = Object.keys(found).length + " of 5 found" + (wrong ? " · " + wrong + " false alarm" + (wrong > 1 ? "s" : "") : ""); $("#mail-meter i").style.width = Object.keys(found).length * 20 + "%"; $("#mail-meter i").style.background = "var(--mint)"; }
    $$(".sus", mail).forEach(function (b) {
      b.addEventListener("click", function () {
        var k = b.getAttribute("data-k");
        if (FLAGS[k]) { if (!found[k]) { found[k] = 1; b.classList.add("found"); note.hidden = false; note.textContent = "✔ " + FLAGS[k]; if (Object.keys(found).length === 5) { confetti(); toast("All five found. That is the whole checklist."); } } }
        else { wrong++; b.classList.add("flag"); note.hidden = false; note.textContent = "✖ This part is normal. Good detectives flag only what is really suspicious."; setTimeout(function () { b.classList.remove("flag"); }, 900); }
        upd();
      });
    });
    $("#mail-reset").addEventListener("click", function () { found = {}; wrong = 0; $$(".sus", mail).forEach(function (b) { b.classList.remove("found", "flag"); }); note.hidden = true; upd(); });
    upd();
  }

  // ── 2. password lab (a rough estimate, all in the browser) ──
  var pw = $("#pw");
  if (pw) {
    var COMMON = ["123456", "password", "12345678", "qwerty", "123456789", "12345", "1234", "111111", "1234567", "dragon", "123123", "baseball", "abc123", "football", "monkey", "letmein", "696969", "shadow", "master", "666666", "qwertyuiop", "123321", "mustang", "1234567890", "michael", "654321", "superman", "1qaz2wsx", "password1", "iloveyou", "admin", "welcome"];
    function human(sec) {
      if (sec < 1) return "instantly";
      var u = [["year", 31557600], ["day", 86400], ["hour", 3600], ["minute", 60], ["second", 1]];
      if (sec > 31557600 * 1e9) return "longer than the age of the universe";
      for (var i = 0; i < u.length; i++) if (sec >= u[i][1]) { var n = sec / u[i][1]; return (n >= 1e6 ? n.toExponential(1) : Math.floor(n).toLocaleString("en")) + " " + u[i][0] + (Math.floor(n) === 1 ? "" : "s"); }
      return "instantly";
    }
    function analyse() {
      var v = pw.value, bar = $("#pw-meter i"), out = $("#pw-out");
      if (!v) { bar.style.width = "0"; out.innerHTML = '<p class="muted" style="margin:0">Type something. It never leaves this page.</p>'; return; }
      var pool = 0; if (/[a-z]/.test(v)) pool += 26; if (/[A-Z]/.test(v)) pool += 26; if (/[0-9]/.test(v)) pool += 10; if (/[^a-zA-Z0-9]/.test(v)) pool += 33;
      var bits = Math.log2(Math.max(pool, 2)) * v.length, common = COMMON.indexOf(v.toLowerCase()) > -1;
      if (/(.)\1{2,}/.test(v) || /(0123|1234|2345|abcd|qwer)/i.test(v)) bits *= 0.6;
      var secs = common ? 0 : Math.pow(2, bits) / 2 / 1e10;
      var lvl = common || bits < 28 ? 0 : bits < 40 ? 1 : bits < 60 ? 2 : bits < 80 ? 3 : 4, name = ["Very weak", "Weak", "Fair", "Strong", "Excellent"][lvl], col = ["var(--pink)", "var(--amber)", "var(--amber)", "var(--mint)", "var(--mint)"][lvl];
      bar.style.width = (lvl + 1) * 20 + "%"; bar.style.background = col;
      out.innerHTML = '<div class="kv"><div><b style="color:' + col + '">' + name + '</b><span>rating</span></div><div><b>' + v.length + '</b><span>characters</span></div><div><b>' + Math.round(bits) + '</b><span>bits (rough)</span></div><div><b>' + human(secs) + '</b><span>to guess, at 10 billion a second</span></div></div>' +
        (common ? '<div class="note">This one is in every attacker\'s first list. They would try it before anything else.</div>' : lvl < 3 ? '<div class="note">Longer beats clever. Try four random words, or let a password manager make one.</div>' : '<div class="note">Good. Make it unique for every account, and keep it in a password manager.</div>');
    }
    pw.addEventListener("input", analyse); analyse();
    $("#pw-gen").addEventListener("click", function () {
      var w = ["river", "lantern", "copper", "meadow", "falcon", "marble", "orchid", "thunder", "pebble", "velvet", "harbor", "cobalt", "saffron", "glacier", "willow", "ember", "quartz", "jungle", "mirror", "anchor", "violet", "canyon", "pepper", "summit"], a = new Uint32Array(4);
      crypto.getRandomValues(a); pw.value = Array.prototype.map.call(a, function (n) { return w[n % w.length]; }).join("-"); analyse(); toast("Four random words, made in your browser");
    });
  }

  // ── 3. link inspector ──
  var lk = $("#lk");
  if (lk) {
    function inspect() {
      var raw = lk.value.trim(), out = $("#lk-out");
      if (!raw) { out.innerHTML = ""; return; }
      var u; try { u = new URL(/^[a-z]+:\/\//i.test(raw) ? raw : "http://" + raw); } catch (e) { out.innerHTML = '<div class="note">That does not look like a web address.</div>'; return; }
      var host = u.hostname, parts = host.split("."), reg = parts.length > 2 && !/^\d+\.\d+\.\d+\.\d+$/.test(host) ? parts.slice(-2).join(".") : host, sub = parts.length > 2 ? parts.slice(0, -2).join(".") : "";
      var w = [];
      if (u.protocol === "http:") w.push("It uses http, not https: nothing is encrypted.");
      if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) w.push("The address is bare numbers, not a company name.");
      if (/xn--/.test(host)) w.push("Punycode (xn--): letters from other alphabets can imitate real names.");
      if (raw.indexOf("@") > -1) w.push("An @ sign: what comes before it is ignored by the browser, a common trick.");
      if (parts.length > 3) w.push("Many sub-domains: the real owner is the LAST two parts before the path.");
      if (/(rn|vv|0|1)/.test(reg.split(".")[0]) && /(paypal|google|bank|apple|micro|amazon|face|insta)/.test(reg.replace(/rn/g, "m").replace(/vv/g, "w").replace(/0/g, "o").replace(/1/g, "l"))) w.push("Looks like a famous name with letters swapped (rn for m, 0 for o, 1 for l).");
      if (/(login|verify|secure|account|update|confirm)/i.test(host) && sub) w.push("Words like login or secure in the SUB-domain prove nothing.");
      out.innerHTML = '<div class="kv"><div><b>' + esc(u.protocol.replace(":", "")) + '</b><span>protocol</span></div><div><b style="color:var(--accent)">' + esc(reg) + '</b><span>who really owns it</span></div><div><b>' + esc(sub || "none") + '</b><span>sub-domain</span></div><div><b>' + esc(u.pathname + u.search || "/") + '</b><span>path and options</span></div></div>' +
        (w.length ? '<div class="note"><b>' + w.length + ' warning' + (w.length > 1 ? "s" : "") + ':</b><br>' + w.map(function (x) { return "• " + esc(x); }).join("<br>") + '</div>' : '<div class="note">No obvious tricks in the address itself. That does not prove the site is honest: check who sent you here.</div>');
    }
    lk.addEventListener("input", inspect);
    $$("[data-link]").forEach(function (b) { b.addEventListener("click", function () { lk.value = b.getAttribute("data-link"); inspect(); }); });
    inspect();
  }

  // ── 4. the terminal demo ──
  var tb = $("#term-body"), ti = $("#term-in");
  if (tb && ti) {
    var FILES = { "notes.txt": "buy milk\nchange my passwords\nupdate the phone", "auth.log": "Nov 22 09:14 sshd: Accepted password for sam\nNov 22 09:15 sshd: Failed password for root from 203.0.113.9\nNov 22 09:15 sshd: Failed password for root from 203.0.113.9\nNov 22 09:16 sshd: Failed password for admin from 203.0.113.9\nNov 22 09:20 sshd: Accepted password for sam" };
    var CMDS = {
      help: function () { return "Try: ls, cat notes.txt, grep Failed auth.log, whoami, pwd, echo hello, clear\nThis is a small demo: the app has nine real units."; },
      ls: function () { return Object.keys(FILES).join("   "); },
      pwd: function () { return "/home/sam"; },
      whoami: function () { return "sam"; },
      clear: function () { tb.innerHTML = ""; return null; }
    };
    function line(html) { tb.insertAdjacentHTML("beforeend", html + "\n"); tb.scrollTop = tb.scrollHeight; }
    function runCmd(c) {
      line('<span class="p">sam@lab</span>:<span class="d">~</span>$ ' + esc(c));
      var p = c.trim().split(/\s+/), cmd = p[0];
      if (!cmd) return;
      if (CMDS[cmd]) { var r = CMDS[cmd](); if (r != null) line(esc(r)); }
      else if (cmd === "echo") line(esc(p.slice(1).join(" ")));
      else if (cmd === "cat") { if (FILES[p[1]]) line(esc(FILES[p[1]])); else line('<span class="e">cat: ' + esc(p[1] || "") + ': No such file</span>'); }
      else if (cmd === "grep") { var f = FILES[p[2]]; if (!p[1] || !f) line('<span class="e">usage: grep WORD FILE</span>'); else { var hits = f.split("\n").filter(function (l) { return l.indexOf(p[1]) > -1; }); line(hits.length ? esc(hits.join("\n")) : '<span class="d">(no match)</span>'); if (/Failed/.test(p[1]) && hits.length > 2) line('<span class="p">↳ three failed logins in a row from one address: that is a guessing attempt.</span>'); } }
      else line('<span class="e">' + esc(cmd) + ': command not found. Type help.</span>');
    }
    line('<span class="d">A tiny demo shell. Type help.</span>');
    ti.addEventListener("keydown", function (e) { if (e.key === "Enter") { runCmd(ti.value); ti.value = ""; } });
    $$("[data-cmd]").forEach(function (b) { b.addEventListener("click", function () { runCmd(b.getAttribute("data-cmd")); ti.focus(); }); });
  }

  // ── 5. the C editor preview ──
  var csel = $("#c-sel");
  if (csel) {
    var SAMPLES = {
      squares: { code: '<span class="k">#include</span> <span class="s">&lt;stdio.h&gt;</span>\n\n<span class="k">int</span> main(<span class="k">void</span>) {\n    <span class="k">for</span> (<span class="k">int</span> i = <span class="n">1</span>; i &lt;= <span class="n">5</span>; i++) {\n        printf(<span class="s">"%d squared is %d\\n"</span>, i, i * i);\n    }\n    <span class="k">return</span> <span class="n">0</span>;\n}', out: ["1 squared is 1", "2 squared is 4", "3 squared is 9", "4 squared is 16", "5 squared is 25"] },
      sum: { code: '<span class="k">#include</span> <span class="s">&lt;stdio.h&gt;</span>\n\n<span class="k">int</span> main(<span class="k">void</span>) {\n    <span class="k">int</span> a[] = {<span class="n">4</span>, <span class="n">8</span>, <span class="n">15</span>, <span class="n">16</span>, <span class="n">23</span>, <span class="n">42</span>};\n    <span class="k">int</span> sum = <span class="n">0</span>;\n    <span class="k">for</span> (<span class="k">int</span> i = <span class="n">0</span>; i &lt; <span class="n">6</span>; i++) sum += a[i];\n    printf(<span class="s">"sum = %d\\n"</span>, sum);\n    <span class="k">return</span> <span class="n">0</span>;\n}', out: ["sum = 108"] },
      search: { code: '<span class="c">// binary search: the list must be sorted</span>\n<span class="k">int</span> find(<span class="k">int</span> a[], <span class="k">int</span> n, <span class="k">int</span> x) {\n    <span class="k">int</span> lo = <span class="n">0</span>, hi = n - <span class="n">1</span>;\n    <span class="k">while</span> (lo &lt;= hi) {\n        <span class="k">int</span> mid = (lo + hi) / <span class="n">2</span>;\n        <span class="k">if</span> (a[mid] == x) <span class="k">return</span> mid;\n        <span class="k">if</span> (a[mid] &lt; x) lo = mid + <span class="n">1</span>; <span class="k">else</span> hi = mid - <span class="n">1</span>;\n    }\n    <span class="k">return</span> -<span class="n">1</span>;\n}', out: ["find({2,5,8,12,16,23,38}, 7, 23)", "step 1: mid = 3 → 12 < 23, go right", "step 2: mid = 5 → 23 == 23", "result: 5 (found in 2 steps, not 6)"] }
    };
    var cc = $("#c-code"), co = $("#c-out");
    function show() { var s = SAMPLES[csel.value]; cc.innerHTML = s.code; co.textContent = "Press Run."; }
    csel.addEventListener("change", show); show();
    $("#c-run").addEventListener("click", function () {
      var s = SAMPLES[csel.value], i = 0; co.textContent = "";
      (function next() { if (i < s.out.length) { co.textContent += (i ? "\n" : "") + s.out[i++]; setTimeout(next, reduce ? 0 : 260); } })();
    });
  }

  // ── 6. encrypt and hash (real Web Crypto, in this page) ──
  var enc = $("#enc-text");
  if (enc && window.crypto && crypto.subtle) {
    var te = new TextEncoder(), td = new TextDecoder();
    function hex(b) { return Array.prototype.map.call(new Uint8Array(b), function (x) { return ("0" + x.toString(16)).slice(-2); }).join(""); }
    function unhex(s) { var a = new Uint8Array(s.length / 2); for (var i = 0; i < a.length; i++) a[i] = parseInt(s.substr(i * 2, 2), 16); return a; }
    async function key(pass, salt) { var base = await crypto.subtle.importKey("raw", te.encode(pass), "PBKDF2", false, ["deriveKey"]); return crypto.subtle.deriveKey({ name: "PBKDF2", salt: salt, iterations: 150000, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]); }
    var packed = "";
    $("#enc-go").addEventListener("click", async function () {
      var pass = $("#enc-pass").value || "demo";
      var salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12)), k = await key(pass, salt);
      var ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, k, te.encode(enc.value));
      packed = hex(salt) + hex(iv) + hex(ct);
      $("#enc-ct").textContent = packed; $("#enc-pt").textContent = "(press Decrypt)";
      $("#enc-h").textContent = hex(await crypto.subtle.digest("SHA-256", te.encode(enc.value)));
    });
    $("#enc-back").addEventListener("click", async function () {
      if (!packed) { toast("Encrypt something first"); return; }
      try { var k = await key($("#enc-pass").value || "demo", unhex(packed.slice(0, 32))); var pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unhex(packed.slice(32, 56)) }, k, unhex(packed.slice(56))); $("#enc-pt").textContent = td.decode(pt); toast("Decrypted, and the tag matched"); }
      catch (e) { $("#enc-pt").textContent = "Wrong passphrase, or the data was changed: AES-GCM refuses it."; }
    });
    $("#enc-flip").addEventListener("click", function () { if (!packed) { toast("Encrypt something first"); return; } var i = 60 + Math.floor(Math.random() * 10); packed = packed.slice(0, i) + (packed[i] === "0" ? "1" : "0") + packed.slice(i + 1); $("#enc-ct").textContent = packed; toast("One character of the ciphertext changed. Now try Decrypt."); });
  }

  // ── the Cyber Trail map ──
  var HOUSES = [
    ["lock", "Lock Screen House", "Your phone's front door", "🔒", "#2E8B7A", 0, 7], ["updates", "Update Tower", "Patches close the holes", "🔄", "#3D6FD8", 0, 6],
    ["passwords", "Password Forge", "Long, unique, remembered for you", "🔑", "#E08A1E", 0, 7], ["accounts", "Account Fortress", "Two locks on every door", "🛡️", "#6A4FD0", 0, 7],
    ["phishing", "Phishing Pier", "Don't take the bait", "🎣", "#1E7FB8", 0, 6], ["browser", "Browser Bay", "Surf without sinking", "🌐", "#3C9B47", 0, 8],
    ["apps", "App Market", "Download without regret", "📲", "#D9548C", 0, 7], ["permissions", "Permission Plaza", "Only the keys each app needs", "🧩", "#B8860B", 0, 6],
    ["malware", "Malware Lab", "Find it, stop it, clean it", "🦠", "#5E9C23", 1, 6], ["spyware", "Spy Shield House", "Nobody reads over your shoulder", "🔍", "#5E35B1", 1, 7],
    ["wifi", "Wi-Fi Harbor", "Safe networks, safe signals", "📶", "#00838F", 1, 6], ["vpn", "VPN Tunnel", "A private road, not an invisibility cloak", "🚇", "#546E7A", 1, 7],
    ["shopping", "Safe Shopping Mall", "Buy smart, pay safe", "🛒", "#EF6C00", 1, 6], ["identity", "Identity Hideout", "Share less, show less", "🎭", "#AD1457", 1, 6],
    ["messages", "Message Castle", "Real voices, real friends", "💬", "#1565C0", 1, 6], ["backup", "Backup Vault", "Lose the phone, keep your life", "💾", "#2E7D32", 1, 6]
  ];
  var tm = $("#trail-svg");
  if (tm) {
    var NS = "http://www.w3.org/2000/svg", X = [110, 290, 470, 650], Y = [90, 250, 410, 570], pts = [];
    // A serpentine road: four rows of four houses, the road turning at the ends (like a snake), so the names never collide.
    for (var r = 0; r < 4; r++) for (var c = 0; c < 4; c++) pts.push([X[r % 2 ? 3 - c : c], Y[r]]);
    var path = "M" + X[0] + "," + Y[0] + " H" + X[3] +
      " C" + (X[3] + 70) + "," + Y[0] + " " + (X[3] + 70) + "," + Y[1] + " " + X[3] + "," + Y[1] + " H" + X[0] +
      " C" + (X[0] - 70) + "," + Y[1] + " " + (X[0] - 70) + "," + Y[2] + " " + X[0] + "," + Y[2] + " H" + X[3] +
      " C" + (X[3] + 70) + "," + Y[2] + " " + (X[3] + 70) + "," + Y[3] + " " + X[3] + "," + Y[3] + " H" + X[0];
    function sv(tag, attrs, txt) { var e = doc.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (txt != null) e.textContent = txt; return e; }
    tm.appendChild(sv("path", { d: path, "class": "road" })); tm.appendChild(sv("path", { d: path, "class": "road-dash" }));
    var card = $("#h-card"), sel = null;
    function showHouse(i, g) {
      var h = HOUSES[i]; if (sel) sel.classList.remove("sel"); sel = g; g.classList.add("sel");
      card.innerHTML = '<div class="big">' + h[3] + '</div><span class="hbadge ' + (h[5] ? "elite" : "free") + '">' + (h[5] ? "ELITE" : "FREE") + ' · HOUSE ' + (i + 1) + '</span><h3>' + esc(h[1]) + '</h3><p class="muted" style="margin:6px 0 14px">' + esc(h[2]) + '</p><div class="kv"><div><b>' + h[6] + '</b><span>real steps for your own phone</span></div><div><b>Tasks + exam</b><span>small games, an exam and a coach</span></div></div><p class="muted" style="font-size:13px;margin:14px 0 0">' + (h[5] ? "The first task of every Elite house is free to try." : "Free for everyone.") + '</p>';
    }
    HOUSES.forEach(function (h, i) {
      var g = sv("g", { "class": "h" + (h[5] ? " pro" : ""), tabindex: "0", role: "button", "aria-label": (i + 1) + ". " + h[1] + (h[5] ? ", Elite" : ", free"), style: "--c:" + h[4] });
      var x = pts[i][0], y = pts[i][1];
      g.appendChild(sv("rect", { "class": "body", x: x - 28, y: y - 24, width: 56, height: 48, rx: 14 }));
      g.appendChild(sv("text", { "class": "em", x: x, y: y + 7 }, h[3]));
      g.appendChild(sv("text", { x: x, y: y + 44 }, (i + 1) + ". " + h[1].replace(" House", "").replace("Safe ", "")));
      g.addEventListener("click", function () { showHouse(i, g); });
      g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); showHouse(i, g); } });
      tm.appendChild(g);
      if (i === 0) showHouse(0, g);
    });
    // the walking dot
    var dot = sv("circle", { r: 7, fill: "var(--accent)", stroke: "#fff", "stroke-width": 2 }); tm.appendChild(dot);
    var p0 = tm.querySelector(".road"), len = p0.getTotalLength();
    if (!reduce) {
      // The dot walks only while the map is on screen (a loop that never stops keeps a phone busy), about 30 frames a second.
      var t0 = performance.now(), seen = true, last = 0;
      (function walk(t) {
        if (seen && t - last > 32) { last = t; var f = ((t - t0) / 14000) % 1, p = p0.getPointAtLength(f * len); dot.setAttribute("cx", p.x); dot.setAttribute("cy", p.y); }
        requestAnimationFrame(walk);
      })(t0);
      if ("IntersectionObserver" in window) new IntersectionObserver(function (en) { seen = en[0].isIntersecting; }).observe(tm);
    }
    else { var p = p0.getPointAtLength(0); dot.setAttribute("cx", p.x); dot.setAttribute("cy", p.y); }
  }

  // ── the timeline fills as you scroll ──
  var tl = $(".timeline");
  if (tl) {
    var fill = $(".fill", tl), steps = $$(".tl", tl);
    function tlUpdate() { var r = tl.getBoundingClientRect(), p = Math.max(0, Math.min(1, (innerHeight * 0.6 - r.top) / r.height)); fill.style.height = p * 100 + "%"; steps.forEach(function (s) { s.classList.toggle("on", s.getBoundingClientRect().top < innerHeight * 0.62); }); }
    addEventListener("scroll", tlUpdate, { passive: true }); tlUpdate();
  }

  // ── the quick quiz ──
  var qz = $("#qz");
  if (qz) {
    var Q = [
      { q: "An email says your account closes in 24 hours unless you click. What is the best move?", o: ["Click quickly", "Open the official app or type the address yourself", "Reply with your password to check"], a: 1, w: "Urgency is how scams work. Go to the real site yourself." },
      { q: "Which password is the strongest?", o: ["P@ssw0rd1", "river-copper-falcon-lantern", "qwerty123"], a: 1, w: "Length wins: four random words beat a short clever one." },
      { q: "A VPN on public Wi-Fi mainly hides…", o: ["your traffic from the local network", "you from every website", "malware from your phone"], a: 0, w: "A VPN is a private road, not an invisibility cloak." }
    ], qi = 0, ok = 0;
    function qshow() {
      if (qi >= Q.length) { qz.innerHTML = '<h3 style="margin:0 0 6px">' + ok + ' of ' + Q.length + '</h3><p class="muted">' + (ok === Q.length ? "Perfect. The app goes much further, one idea at a time." : "Good start. Every idea in the app ends with a question like these, and mistakes are explained, never punished.") + '</p><div class="run-row"><button class="pill-btn main" id="qz-again" type="button">Try again</button><a class="pill-btn" href="/quiz.html">The full free quiz</a></div>'; if (ok === Q.length) confetti(); $("#qz-again").addEventListener("click", function () { qi = 0; ok = 0; qshow(); }); return; }
      var x = Q[qi]; qz.innerHTML = '<p class="muted" style="margin:0 0 6px;font-size:13px">Question ' + (qi + 1) + ' of ' + Q.length + '</p><h3 style="margin:0">' + esc(x.q) + '</h3><div class="qopts">' + x.o.map(function (o, i) { return '<button class="qopt" type="button" data-i="' + i + '">' + esc(o) + '</button>'; }).join("") + '</div><div id="qz-why" class="note" hidden></div>';
      $$(".qopt", qz).forEach(function (b) {
        b.addEventListener("click", function () {
          var i = +b.getAttribute("data-i"); $$(".qopt", qz).forEach(function (n) { n.disabled = true; }); b.classList.add(i === x.a ? "ok" : "no"); if (i !== x.a) $$(".qopt", qz)[x.a].classList.add("ok"); else ok++;
          var w = $("#qz-why"); w.hidden = false; w.innerHTML = esc(x.w) + ' <button class="pill-btn main" id="qz-next" type="button" style="margin-left:8px">Next</button>'; $("#qz-next").addEventListener("click", function () { qi++; qshow(); }); $("#qz-next").focus();
        });
      });
    }
    qshow();
  }

  // ── the plans preview ──
  var sw = $$("[data-bill]");
  if (sw.length) {
    var pr = $("#price-n"), per = $("#price-per"), save = $("#price-save");
    sw.forEach(function (b) { b.addEventListener("click", function () { var y = b.getAttribute("data-bill") === "year"; sw.forEach(function (n) { n.setAttribute("aria-pressed", String(n === b)); }); pr.textContent = y ? "$40" : "$5"; per.textContent = y ? "/ year" : "/ month"; save.textContent = y ? "That is $3.33 a month: $20 less than twelve months." : "Cancel any time; you keep access until the period ends."; }); });
  }

  // ── the bar on small screens, once the hero has scrolled away ──
  var mb = $(".mobile-bar");
  if (mb) addEventListener("scroll", function () { mb.classList.toggle("on", scrollY > 900); }, { passive: true });
})();
