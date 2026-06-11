# Kirutma — Distribution Guide

How to build, package, and share Kirutma with Mac and Windows users.

**Version:** 1.0.0 · **Stack:** Tauri 2

---

## 1. Build installable packages

Build **on each platform** (or use CI). Tauri does not reliably cross-compile between Mac and Windows from a single machine.

```bash
cd apps/desktop
npm install
npm run build:app
```

This runs `tauri build` with `"targets": "all"` in `apps/desktop/src-tauri/tauri.conf.json`, which produces:

| Platform | What users install | Output location |
|----------|-------------------|-----------------|
| **Mac (Apple Silicon)** | `.dmg` (recommended) or `.app` | `apps/desktop/src-tauri/target/release/bundle/dmg/` and `.../bundle/macos/` |
| **Mac (Intel)** | Same, but build on an Intel Mac or configure a separate target | Same paths, different arch in filename |
| **Windows** | `.msi` and/or `.exe` (NSIS) | `apps/desktop/src-tauri/target/release/bundle/msi/` and `.../bundle/nsis/` |

### Local Mac install (testing only)

```bash
cd apps/desktop
npm run install:mac
```

This builds, copies `Kirutma.app` to `/Applications/`, and opens it. For sharing with others, distribute the **DMG**, not the raw `.app` folder.

---

## 2. Build both platforms with GitHub Actions

CI already builds on `macos-latest` and `windows-latest` (see `.github/workflows/ci.yml`), but it does not publish install artifacts.

**Recommended flow for releases:**

1. Tag a version: `git tag v1.0.0 && git push origin v1.0.0`
2. CI builds Mac + Windows installers
3. Upload them as **GitHub Release assets**
4. Share the release URL as your download page

This is the simplest global distribution path: one link, both platforms, no store fees.

---

## 3. What to give users

### Mac users

1. Download `Kirutma_1.0.0_aarch64.dmg` (Apple Silicon) or an Intel build if you ship one
2. Open the DMG
3. Drag **Kirutma** to Applications
4. Launch from Applications

Example path after a local build:

```
apps/desktop/src-tauri/target/release/bundle/dmg/Kirutma_1.0.0_aarch64.dmg
```

### Windows users

1. Download the `.msi` (cleanest for IT/admin) or the NSIS `.exe` (familiar install wizard)
2. Run the installer
3. Launch from the Start menu

After building on Windows:

```
apps/desktop/src-tauri/target/release/bundle/msi/
apps/desktop/src-tauri/target/release/bundle/nsis/
```

### Optional landing page

Add a simple page with two buttons — **Download for Mac** and **Download for Windows** — linking to your GitHub Release files (or CDN).

---

## 4. Code signing (recommended before wide release)

Unsigned builds work, but users encounter security warnings.

### Mac

Without signing/notarization, Gatekeeper may show:

> *"Kirutma cannot be opened because the developer cannot be verified"*

**Fix:**

1. Enroll in the [Apple Developer Program](https://developer.apple.com/programs/) ($99/year)
2. Sign the app
3. **Notarize** with Apple
4. Staple the notarization ticket to the DMG

Tauri docs: [macOS Code Signing](https://v2.tauri.app/distribute/sign/macos/)

Typical CI secrets: `APPLE_CERTIFICATE`, `APPLE_ID`, `APPLE_PASSWORD` (app-specific password), `APPLE_TEAM_ID`.

### Windows

Without signing, SmartScreen may show:

> *"Windows protected your PC"*

**Fix:** Obtain an **Authenticode code-signing certificate** (e.g. DigiCert, Sectigo) and sign the `.exe` / `.msi`.

Tauri docs: [Windows Code Signing](https://v2.tauri.app/distribute/sign/windows/)

For early beta with trusted testers, unsigned builds are acceptable if you explain the one-time bypass. For a public launch, signing matters significantly.

---

## 5. Mac architecture

The default Apple Silicon build produces **`aarch64`** artifacts (e.g. `Kirutma_1.0.0_aarch64.dmg`).

Intel Mac users need either:

- A separate **`x86_64`** build, or
- A **universal binary** (both architectures in one app — larger file, single download)

Many indie apps ship ARM-only first and add Intel support if demand warrants it.

---

## 6. Distribution channels

| Channel | Effort | Best for |
|---------|--------|----------|
| **GitHub Releases** | Low | Developers, early adopters, global direct download |
| **Your website + CDN** | Low–medium | Brand control, analytics |
| **Homebrew cask** (Mac) | Medium | Power users (`brew install --cask kirutma`) |
| **winget** (Windows) | Medium | Windows power users |
| **Mac App Store / Microsoft Store** | High | Mass market and built-in updates — but review rules, sandboxing, revenue share |

For v1.0, **GitHub Releases plus a simple download page** is the standard approach.

---

## 7. Pre-release checklist

1. **Bump version** consistently in:
   - `apps/desktop/package.json`
   - `apps/desktop/src-tauri/tauri.conf.json`
   - `apps/desktop/src-tauri/Cargo.toml`
2. Build Mac DMG and Windows installer (locally or via CI)
3. Test a **fresh install** on a clean Mac and a clean Windows machine (or VM)
4. **Sign and notarize** when ready for a broad public audience
5. Upload to GitHub Release with clear filenames, e.g.:
   - `Kirutma_1.0.0_aarch64.dmg`
   - `Kirutma_1.0.0_x64-setup.exe`
6. Update placeholders in `marketing/` (`[DOWNLOAD_URL]`, etc.)
7. Document install steps in README or link to this file

---

## 8. Quick reference

### Build commands

```bash
# Production build (Mac or Windows)
cd apps/desktop
npm run build:app

# Local Mac install for testing
npm run install:mac
```

### Key paths

| Artifact | Path |
|----------|------|
| Mac `.app` | `apps/desktop/src-tauri/target/release/bundle/macos/Kirutma.app` |
| Mac `.dmg` | `apps/desktop/src-tauri/target/release/bundle/dmg/` |
| Windows `.msi` | `apps/desktop/src-tauri/target/release/bundle/msi/` |
| Windows NSIS `.exe` | `apps/desktop/src-tauri/target/release/bundle/nsis/` |

### Related docs

- [Tauri — Distribute](https://v2.tauri.app/distribute/)
- [marketing/README.md](./marketing/README.md) — launch copy and placeholders
- [.github/workflows/ci.yml](./.github/workflows/ci.yml) — CI build matrix
- [.github/workflows/release.yml](./.github/workflows/release.yml) — automated GitHub Releases

---

## 9. Connect the project to GitHub

**Your project is not linked to GitHub yet** until you initialize git, create a remote repository, and push.

### Step 1 — Create a GitHub repository

1. Go to [github.com/new](https://github.com/new)
2. Name it (e.g. `Kirutma`)
3. Leave it empty (no README/license — you already have files locally)
4. Copy the repository URL, e.g. `https://github.com/YOUR_USERNAME/Kirutma.git`

### Step 2 — Initialize git and push

From the project folder:

```bash
cd "/Volumes/Crucial X9 Pro For Mac/Kirutma"

git init
git add .
git commit -m "Initial commit: Kirutma v1.0.0"

git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/Kirutma.git
git push -u origin main
```

Replace `YOUR_USERNAME/Kirutma` with your actual repo path.

After this, GitHub Actions will run on pushes. The **Release** workflow runs when you push a version tag.

### Step 3 — Enable Actions permissions

In the GitHub repo:

**Settings → Actions → General → Workflow permissions → Read and write permissions → Save**

### Step 4 — Add signing secrets (recommended)

See [SIGNING.md](./SIGNING.md) for Mac and Windows certificate setup, then add secrets under **Settings → Secrets and variables → Actions**.

Without secrets, releases still build but installers are **unsigned**.

---

## 10. Automated GitHub Releases

The **Release** workflow (`.github/workflows/release.yml`) builds Mac and Windows installers and publishes them to GitHub Releases. It includes optional **code signing** steps when GitHub secrets are configured (see [SIGNING.md](./SIGNING.md)).

### What it builds

| Runner | Artifacts |
|--------|-----------|
| `macos-latest` (Apple Silicon) | `.dmg` for `aarch64-apple-darwin` |
| `macos-latest` (Intel cross-build) | `.dmg` for `x86_64-apple-darwin` |
| `windows-latest` | `.msi` and NSIS `.exe` |

### One-time GitHub setup

In your repository on GitHub:

1. Go to **Settings → Actions → General → Workflow permissions**
2. Select **Read and write permissions**
3. Save

This lets the workflow create releases and upload assets (`GITHUB_TOKEN` needs write access).

### Publish a release

1. Bump the version in all three places (must match):
   - `apps/desktop/package.json`
   - `apps/desktop/src-tauri/tauri.conf.json`
   - `apps/desktop/src-tauri/Cargo.toml`
2. Commit and push to `main`
3. Create and push a version tag (must start with `v`):

```bash
git tag v1.0.0
git push origin v1.0.0
```

The workflow starts automatically. When all three jobs finish, open **GitHub → Releases** to download:

- Mac DMG (Apple Silicon and Intel)
- Windows MSI / EXE

### Manual trigger

You can also run the workflow from **Actions → Release → Run workflow** (uses the version in `tauri.conf.json`).

### Download URL for marketing

After the release is published, use:

```
https://github.com/YOUR_ORG/YOUR_REPO/releases/latest
```

Replace placeholders in `marketing/` with that URL.

### How apps get to GitHub (summary)

```
Your Mac  →  git push  →  GitHub repo  →  Actions builds  →  Releases page
```

You do **not** upload `.dmg` or `.exe` files manually. After `git push origin v1.0.0`, GitHub Actions builds on Mac and Windows runners, signs (if secrets exist), and attaches installers to the Release automatically.
