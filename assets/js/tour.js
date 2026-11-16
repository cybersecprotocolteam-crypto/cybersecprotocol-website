// The app tour on the home page: ten scenes in a phone. Plain JavaScript, no library, no network.
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
