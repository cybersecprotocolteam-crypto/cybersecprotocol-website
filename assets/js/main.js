// Cybersec Protocol website: a few small behaviours. No trackers, no cookies, no third-party scripts.
//
// RELEASE is the one place to update when a new version ships: the download
// buttons, the APK details and the Google Play link all read from it.
const RELEASE = {
  version: "1.0.0",
  // Published APK (same site). Leave as is, or point to a GitHub Release asset.
  apk: "/download/cybersec-protocol.apk",
  // Fill these in when the signed APK is published (see the website README).
  sizeMb: "",
  sha256: "",
  certSha256: "",
  minAndroid: "Android 8.0 or newer",
  apkReady: false,
  play: "https://play.google.com/store/apps/details?id=com.cybersec.protocol",
  playLive: false,
};

// Checkout links, filled in once the Lemon Squeezy products exist. Empty = "soon".
const CHECKOUT = {
  elite_month: "", elite_year: "",
  noads: "", vault_small: "", vault_big: "", vault_mega: "",
};

document.addEventListener("DOMContentLoaded", () => {
  // Mobile menu.
  const btn = document.querySelector(".menu-btn");
  const links = document.querySelector(".nav-links");
  if (btn && links) {
    btn.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(open));
    });
  }

  // The year in the footer.
  document.querySelectorAll("[data-year]").forEach((el) => { el.textContent = String(new Date().getFullYear()); });

  // Download buttons: live links when ready, an honest "soon" otherwise.
  document.querySelectorAll("[data-download='play']").forEach((a) => {
    if (RELEASE.playLive) {
      a.href = RELEASE.play;
      a.rel = "noopener";
    } else {
      a.removeAttribute("href");
      a.setAttribute("aria-disabled", "true");
      const s = a.querySelector("small");
      if (s) s.textContent = "Coming soon to";
    }
  });
  document.querySelectorAll("[data-download='apk']").forEach((a) => {
    if (RELEASE.apkReady) {
      a.href = RELEASE.apk;
      a.setAttribute("download", "");
    } else {
      a.href = "/download.html#apk";
    }
  });
  const fill = (sel, value) => document.querySelectorAll(sel).forEach((el) => { el.textContent = value; });
  fill("[data-release='version']", RELEASE.version);
  fill("[data-release='size']", RELEASE.sizeMb ? RELEASE.sizeMb + " MB" : "Published with the first release");
  fill("[data-release='sha256']", RELEASE.sha256 || "Published with the first release");
  fill("[data-release='cert']", RELEASE.certSha256 || "Published with the first release");
  fill("[data-release='android']", RELEASE.minAndroid);
  document.querySelectorAll("[data-release-status='apk']").forEach((el) => {
    el.className = "status " + (RELEASE.apkReady ? "live" : "soon");
    el.textContent = RELEASE.apkReady ? "Available" : "First release coming soon";
  });
  document.querySelectorAll("[data-release-status='play']").forEach((el) => {
    el.className = "status " + (RELEASE.playLive ? "live" : "soon");
    el.textContent = RELEASE.playLive ? "Available" : "In review, coming soon";
  });

  // Pricing: monthly or yearly.
  const toggle = document.querySelector(".toggle");
  if (toggle) {
    const set = (period) => {
      toggle.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.period === period)));
      document.querySelectorAll("[data-month][data-year-price]").forEach((el) => {
        el.innerHTML = period === "year" ? el.dataset.yearPrice + " <small>/ year</small>" : el.dataset.month + " <small>/ month</small>";
      });
      document.querySelectorAll("[data-per-month]").forEach((el) => { el.hidden = period !== "year"; });
      document.querySelectorAll("[data-plan]").forEach((a) => {
        const key = a.dataset.plan + "_" + period;
        const url = CHECKOUT[key];
        if (url) { a.href = url; a.removeAttribute("aria-disabled"); a.textContent = "Get " + a.dataset.label; }
        else { a.removeAttribute("href"); a.setAttribute("aria-disabled", "true"); a.textContent = "Checkout opens soon"; }
      });
    };
    toggle.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => set(b.dataset.period)));
    set("month");
  }
  document.querySelectorAll("[data-offer]").forEach((a) => {
    const url = CHECKOUT[a.dataset.offer];
    if (url) a.href = url;
    else { a.removeAttribute("href"); a.setAttribute("aria-disabled", "true"); a.textContent = "Checkout opens soon"; }
  });

  // The app tour: a caption that follows the screen on show.
  const caption = document.querySelector("[data-tour-caption]");
  if (caption && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const texts = JSON.parse(caption.dataset.tourCaption);
    let i = 0;
    caption.textContent = texts[0];
    setInterval(() => { i = (i + 1) % texts.length; caption.textContent = texts[i]; }, 5000);
  }
});
