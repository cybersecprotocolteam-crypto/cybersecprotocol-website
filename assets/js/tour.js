// The app tour on the home page: nine scenes in a phone. Plain JavaScript, no library, no network.
//
// - It plays by itself, one scene every few seconds, and pauses while the phone is hovered or has the
//   keyboard focus, when the tab is hidden, and when the phone is off the screen.
// - The chips under the phone jump to a scene; the round button pauses or plays.
// - With "reduce motion" it does not play by itself (the chips and the button still work) and nothing animates.
(function () {
  var root = document.querySelector("[data-tour]");
  if (!root) return;
  var scenes = Array.prototype.slice.call(root.querySelectorAll(".scene"));
  var tabsBox = root.querySelector(".tour-tabs");
  var caption = root.querySelector(".tour-caption");
  var playBtn = root.querySelector(".tour-play");
  var phone = root.querySelector(".phone");
  if (!scenes.length || !tabsBox) return;

  var SCENE_MS = 6000;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var current = 0;
  var timer = null;
  var wantPlay = !reduce; // what the person chose (the button)
  var hovering = false;
  var onScreen = true;

  root.setAttribute("data-js", "");
  root.style.setProperty("--scene-ms", SCENE_MS + "ms");

  var tabs = scenes.map(function (scene, n) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "tour-tab";
    b.setAttribute("aria-label", scene.dataset.label + " (" + (n + 1) + " of " + scenes.length + ")");
    b.innerHTML = '<span aria-hidden="true">' + (scene.dataset.icon || "") + "</span><span>" + scene.dataset.label + '</span><i class="tp"></i>';
    b.addEventListener("click", function () { go(n); schedule(); });
    tabsBox.appendChild(b);
    return b;
  });

  function setPlayIcon() {
    var playing = wantPlay && !hovering && onScreen && !document.hidden;
    if (playing) root.setAttribute("data-playing", ""); else root.removeAttribute("data-playing");
    playBtn.setAttribute("aria-label", wantPlay ? "Pause the tour" : "Play the tour");
    playBtn.innerHTML = wantPlay
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>';
  }

  function go(n) {
    current = (n + scenes.length) % scenes.length;
    scenes.forEach(function (s, k) {
      var on = k === current;
      s.classList.remove("on");
      if (on) { void s.offsetWidth; s.classList.add("on"); } // restart its animations
      s.setAttribute("aria-hidden", on ? "false" : "true");
    });
    tabs.forEach(function (t, k) {
      var on = k === current;
      t.classList.remove("on");
      if (on) { void t.offsetWidth; t.classList.add("on"); }
      t.setAttribute("aria-current", on ? "true" : "false");
    });
    caption.textContent = scenes[current].dataset.caption || "";
    phone.setAttribute("data-nav", scenes[current].dataset.nav || "home");
    // Keep the chip in view inside the strip (not the page).
    var t = tabs[current];
    var left = t.offsetLeft - (tabsBox.clientWidth - t.offsetWidth) / 2;
    tabsBox.scrollTo({ left: left, behavior: reduce ? "auto" : "smooth" });
  }

  function schedule() {
    clearTimeout(timer);
    setPlayIcon();
    if (wantPlay && !hovering && onScreen && !document.hidden) {
      timer = setTimeout(function () { go(current + 1); schedule(); }, SCENE_MS);
    }
  }

  playBtn.addEventListener("click", function () { wantPlay = !wantPlay; schedule(); });
  phone.addEventListener("mouseenter", function () { hovering = true; schedule(); });
  phone.addEventListener("mouseleave", function () { hovering = false; schedule(); });
  phone.addEventListener("focusin", function () { hovering = true; schedule(); });
  phone.addEventListener("focusout", function () { hovering = false; schedule(); });
  document.addEventListener("visibilitychange", schedule);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      onScreen = entries[0].isIntersecting;
      schedule();
    }, { threshold: 0.25 }).observe(phone);
  }
  // Arrow keys on the phone move through the scenes.
  phone.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") { go(current + 1); schedule(); e.preventDefault(); }
    if (e.key === "ArrowLeft") { go(current - 1); schedule(); e.preventDefault(); }
  });

  go(0);
  schedule();
})();


// THE HERO'S FIRST LINE: encrypted, then decrypted for real.
//
// The phrase is encrypted with AES-256-GCM (the browser's own Web Crypto, a fresh 256-bit key that cannot be
// exported, a fresh IV each time). While it is "encrypted" you see the real ciphertext bytes, and the text is
// encrypted again with a new IV on every frame, so it keeps changing. Then the last ciphertext is decrypted (GCM also
// checks its tag: a changed byte would make this fail) and the real plaintext appears letter by letter.
// It is a show, not a secret: the key lives in this page. Sound is off until the person turns it on (browsers allow
// sound only after a click), and with "reduce motion" the text just stays as it is.
(function () {
  var el = document.querySelector("[data-cipher]");
  if (!el) return;
  var textEl = el.querySelector(".cipher-text");
  var meta = document.querySelector(".cipher-meta");
  var soundBtn = document.querySelector(".cipher-sound");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var subtle = window.crypto && window.crypto.subtle;
  if (reduce || !subtle || !textEl) { if (soundBtn) soundBtn.hidden = true; return; }

  var phrase = el.getAttribute("data-cipher");
  var GLYPHS = "ABCDEF0123456789@#$%&*+=?!<>/{}[]";
  var enc = new TextEncoder();
  var dec = new TextDecoder();
  var running = false;
  var soundOn = false;
  var ctx = null, master = null;

  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function setMeta(t) { if (meta) meta.textContent = t; }
  function toGlyphs(bytes, n) {
    var out = "";
    for (var i = 0; i < n; i++) out += GLYPHS.charAt(bytes[i % bytes.length] % GLYPHS.length);
    return out;
  }

  // The sound: short digital blips while it is encrypted, a tick for every letter that is decrypted, a soft chime at the end.
  function audio() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.06;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return true;
  }
  function tone(freq, dur, type, gain, delay) {
    if (!soundOn || !ctx) return;
    var t = ctx.currentTime + (delay || 0);
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.03);
  }

  async function run() {
    if (running) return;
    running = true;
    var n = phrase.length;
    el.style.minWidth = el.offsetWidth + "px"; // the pill keeps its size while the letters change
    try {
      var key = await subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
      el.classList.add("is-cipher");
      setMeta("AES-256-GCM · encrypting…");
      var iv, ct;
      var t0 = performance.now();
      while (performance.now() - t0 < 1200) {
        iv = crypto.getRandomValues(new Uint8Array(12));
        ct = new Uint8Array(await subtle.encrypt({ name: "AES-GCM", iv: iv }, key, enc.encode(phrase)));
        textEl.textContent = toGlyphs(ct, n);
        tone(500 + Math.random() * 1700, 0.035, "square", 0.45);
        await sleep(75);
      }
      setMeta("AES-256-GCM · ciphertext " + Array.prototype.slice.call(ct, 0, 6).map(function (b) { return ("0" + b.toString(16)).slice(-2); }).join("") + "…");
      await sleep(450);
      var plain = dec.decode(await subtle.decrypt({ name: "AES-GCM", iv: iv }, key, ct)); // fails if the tag does not match
      setMeta("AES-256-GCM · decrypting…");
      for (var i = 1; i <= n; i++) {
        var noise = crypto.getRandomValues(new Uint8Array(n));
        textEl.textContent = plain.slice(0, i) + toGlyphs(noise, n - i);
        if (plain.charAt(i - 1) !== " ") tone(700 + i * 28, 0.05, "triangle", 0.55);
        await sleep(42);
      }
      textEl.textContent = plain;
      tone(659.25, 0.2, "sine", 0.9);
      tone(987.77, 0.35, "sine", 0.9, 0.13);
      setMeta("AES-256-GCM · decrypted, tag verified ✓");
    } catch (e) {
      textEl.textContent = phrase; // whatever went wrong, the line is always readable at the end
      setMeta("AES-256-GCM");
    } finally {
      el.classList.remove("is-cipher");
      el.style.minWidth = "";
      running = false;
    }
  }

  el.addEventListener("click", run);
  el.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); run(); } });
  if (soundBtn) {
    soundBtn.addEventListener("click", function () {
      soundOn = !soundOn;
      soundBtn.setAttribute("aria-pressed", String(soundOn));
      soundBtn.setAttribute("aria-label", soundOn ? "Sound is on. Press to turn it off." : "Sound is off. Turn it on to hear the encryption and replay it.");
      if (soundOn) { if (!audio()) { soundOn = false; soundBtn.setAttribute("aria-pressed", "false"); return; } run(); }
    });
  }
  setTimeout(run, 500); // silent when the page opens
})();
