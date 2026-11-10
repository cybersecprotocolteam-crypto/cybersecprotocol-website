# cybersecprotocol.app

The app's website: plain HTML, CSS and a little JavaScript. No framework, no build step, no cookies, no trackers, no external fonts.

| File | What it is |
|---|---|
| `index.html` | Home: hero, animated app tour, features, how it works, FAQ teaser |
| `download.html` | Google Play and APK, install steps, SHA-256 fingerprints |
| `pricing.html` | Free, Pro, Elite (monthly/yearly) and one-time packs |
| `privacy.html`, `terms.html`, `refunds.html` | Legal pages (update the date at the top when they change) |
| `about.html`, `contact.html`, `faq.html` | About the app and how to reach us |
| `security.html`, `.well-known/security.txt` | Vulnerability disclosure |
| `delete-account.html` | Account deletion (Google Play asks for this link) |
| `assets/js/main.js` | `RELEASE` and `CHECKOUT` at the top: the only things to edit for a new version or new checkout links |

## Preview on your computer

```
python -m http.server 8770 --directory website
```

Then open http://localhost:8770.

## Publish on GitHub Pages (free, with free HTTPS)

1. On GitHub, create a **public** repository, for example `cybersecprotocol-website`.
2. Upload everything inside this `website` folder to it (keep `.nojekyll`, `CNAME` and `.well-known`).
3. Repository **Settings → Pages**: *Deploy from a branch*, branch `main`, folder `/ (root)`.
4. Same page, **Custom domain**: `cybersecprotocol.app`, then Save.
5. At **Name.com → My Domains → cybersecprotocol.app → DNS records**, add:
   - four `A` records for `@`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - one `CNAME` record for `www`: `YOUR-GITHUB-USERNAME.github.io`
6. Wait until GitHub shows the domain as ready (minutes to a few hours), then tick **Enforce HTTPS**. A `.app` site only opens over HTTPS, so it appears once the certificate is issued.
7. Recommended: GitHub **Settings (your profile) → Pages → Add a verified domain**, so nobody else can ever use your domain on GitHub.

## When the app is released

- Put the signed APK at `download/cybersec-protocol.apk` (or link a GitHub Release asset in `RELEASE.apk`).
- In `assets/js/main.js`, fill `RELEASE.sizeMb`, `RELEASE.sha256` (`certutil -hashfile cybersec-protocol.apk SHA256`), `RELEASE.certSha256` (`keytool -printcert -jarfile cybersec-protocol.apk`) and set `apkReady: true`.
- When the Play listing is live, set `playLive: true`.
- When the Lemon Squeezy products exist, paste each checkout link into `CHECKOUT`.
- If Unity Ads asks for an `app-ads.txt`, add the line it gives you as `app-ads.txt` at the root.
