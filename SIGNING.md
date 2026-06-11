# Code Signing Setup

How to sign Kirutma for Mac (sign + notarize) and Windows before GitHub Releases.

**Related:** [DISTRIBUTION.md](./DISTRIBUTION.md) · [.github/workflows/release.yml](./.github/workflows/release.yml)

---

## Overview

| Platform | What you need | GitHub secrets |
|----------|---------------|----------------|
| **Mac** | Apple Developer account, **Developer ID Application** certificate | `APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `KEYCHAIN_PASSWORD`, `APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID` |
| **Windows** | Code signing `.pfx` certificate (OV) | `WINDOWS_CERTIFICATE`, `WINDOWS_CERTIFICATE_PASSWORD`, `WINDOWS_CERTIFICATE_THUMBPRINT` |

If secrets are **not** set, the Release workflow still runs but produces **unsigned** installers (users may see security warnings).

---

## Mac signing and notarization

### 1. Apple Developer account

Enroll at [developer.apple.com](https://developer.apple.com/programs/) ($99/year for distribution outside the App Store).

### 2. Create a certificate

1. On your Mac, create a **Certificate Signing Request (CSR)** in Keychain Access.
2. In [Certificates, IDs & Profiles](https://developer.apple.com/account/resources/certificates/list), create **Developer ID Application** (not App Store distribution).
3. Download and double-click the `.cer` to install it in Keychain.

Verify locally:

```bash
security find-identity -v -p codesigning
```

You should see **Developer ID Application: Your Name (TEAMID)**.

### 3. Export certificate for GitHub Actions

1. Open **Keychain Access → My Certificates**.
2. Expand your **Developer ID Application** entry.
3. Right-click the **private key** → **Export** → save as `.p12` with a password.

Convert to base64:

```bash
openssl base64 -A -in /path/to/certificate.p12 -out certificate-base64.txt
```

### 4. App-specific password (notarization)

1. Go to [appleid.apple.com](https://appleid.apple.com) → Sign-In and Security → **App-Specific Passwords**.
2. Generate a password for “GitHub Actions Kirutma”.
3. Use this as `APPLE_PASSWORD` — **not** your main Apple ID password.

### 5. Team ID

Find **Team ID** in [Apple Developer → Membership details](https://developer.apple.com/account#MembershipDetailsCard).

---

## Windows signing

### 1. Get a code signing certificate

Purchase an **OV code signing certificate** from a provider (DigiCert, Sectigo, etc.). Must be a **code signing** cert, not SSL.

### 2. Export as `.pfx`

If you have `.cer` + private key:

```bash
openssl pkcs12 -export -in cert.cer -inkey private-key.key -out certificate.pfx
```

Remember the export password.

### 3. Base64 for GitHub

On Windows:

```powershell
certutil -encode certificate.pfx base64cert.txt
```

Copy the contents (without BEGIN/END lines if using certutil output format — use the full base64 body as GitHub expects).

On Mac:

```bash
openssl base64 -A -in certificate.pfx -out base64cert.txt
```

### 4. Certificate thumbprint

On Windows, open **certmgr.msc → Personal → Certificates**, open your cert → **Details → Thumbprint**.

Copy the hex string (no spaces), e.g. `A1B2C3D4E5F6...`.

---

## GitHub repository secrets

In your GitHub repo: **Settings → Secrets and variables → Actions → New repository secret**

| Secret | Value |
|--------|--------|
| `APPLE_CERTIFICATE` | Full base64 contents of exported `.p12` |
| `APPLE_CERTIFICATE_PASSWORD` | Password used when exporting `.p12` |
| `KEYCHAIN_PASSWORD` | Any strong random password (CI-only temp keychain) |
| `APPLE_ID` | Your Apple ID email |
| `APPLE_PASSWORD` | App-specific password |
| `APPLE_TEAM_ID` | 10-character Team ID |
| `WINDOWS_CERTIFICATE` | Base64-encoded `.pfx` |
| `WINDOWS_CERTIFICATE_PASSWORD` | `.pfx` export password |
| `WINDOWS_CERTIFICATE_THUMBPRINT` | Cert thumbprint from certmgr |

Also enable **Settings → Actions → General → Workflow permissions → Read and write permissions**.

---

## Local signed builds (optional)

### Mac

With the cert in your keychain:

```bash
export APPLE_SIGNING_IDENTITY="Developer ID Application: Your Name (TEAMID)"
export APPLE_ID="you@example.com"
export APPLE_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="XXXXXXXXXX"

cd apps/desktop
npm run build:app
```

### Windows

Add to `apps/desktop/src-tauri/tauri.conf.json` under `bundle.windows`:

```json
"windows": {
  "certificateThumbprint": "YOUR_THUMBPRINT",
  "digestAlgorithm": "sha256",
  "timestampUrl": "http://timestamp.digicert.com"
}
```

Then run `npm run build:app` on a Windows PC with the cert installed.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Mac: “Developer ID Application” not found in CI | Export `.p12` including the **private key** |
| Mac: notarization fails | Use app-specific password; verify `APPLE_TEAM_ID` |
| Windows: signtool fails | Confirm thumbprint matches imported cert; use `sha256` |
| Release not created | Enable **Read and write** workflow permissions |
| Unsigned builds | Add secrets above; re-run Release workflow |

---

## References

- [Tauri — macOS code signing](https://v2.tauri.app/distribute/sign/macos/)
- [Tauri — Windows code signing](https://v2.tauri.app/distribute/sign/windows/)
- [Tauri — GitHub Actions](https://v2.tauri.app/distribute/pipelines/github/)
