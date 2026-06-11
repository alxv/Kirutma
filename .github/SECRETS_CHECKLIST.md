# GitHub Actions Secrets — Kirutma

**Owner:** Alexandar Vincent Paulraj  
**Repository:** [github.com/alxv/Kirutma](https://github.com/alxv/Kirutma)  
**Secrets page:** [github.com/alxv/Kirutma/settings/secrets/actions](https://github.com/alxv/Kirutma/settings/secrets/actions)

## Quick setup (recommended)

1. Copy the template and fill in your values (paths and passwords stay on your Mac only):

```bash
cp .signing-secrets.env.example .signing-secrets.env
# Edit .signing-secrets.env in a text editor
```

2. Install and log in to GitHub CLI:

```bash
brew install gh
gh auth login
```

3. Upload all secrets to [alxv/Kirutma](https://github.com/alxv/Kirutma):

```bash
chmod +x scripts/setup-github-secrets.sh
./scripts/setup-github-secrets.sh
```

4. Re-run the Release workflow or push a new tag for signed builds.

---

## Manual setup

Direct link: [github.com/alxv/Kirutma/settings/secrets/actions](https://github.com/alxv/Kirutma/settings/secrets/actions)

These secrets are **not stored in the repository**. Add each one in GitHub after you obtain your signing certificates.

---

## Required for signed Mac builds

| Secret | What to paste |
|--------|----------------|
| `APPLE_CERTIFICATE` | Base64 of exported `.p12` (Developer ID Application) |
| `APPLE_CERTIFICATE_PASSWORD` | Password used when exporting `.p12` |
| `KEYCHAIN_PASSWORD` | Any strong random password (CI-only temp keychain) |
| `APPLE_ID` | Apple ID email used for notarization |
| `APPLE_PASSWORD` | [App-specific password](https://appleid.apple.com) (not your login password) |
| `APPLE_TEAM_ID` | 10-character Team ID from Apple Developer membership |

### Create `APPLE_CERTIFICATE` on your Mac

```bash
openssl base64 -A -in /path/to/certificate.p12 -out certificate-base64.txt
```

Copy the **entire** contents of `certificate-base64.txt` into the GitHub secret.
Do not commit that file (it is listed in `.gitignore`).

### Certificate type

Use **Developer ID Application** (for distribution outside the App Store), registered to
**Alexandar Vincent Paulraj** or your organization.

---

## Required for signed Windows builds

| Secret | What to paste |
|--------|----------------|
| `WINDOWS_CERTIFICATE` | Base64-encoded `.pfx` code signing certificate |
| `WINDOWS_CERTIFICATE_PASSWORD` | Export password for the `.pfx` |
| `WINDOWS_CERTIFICATE_THUMBPRINT` | Certificate thumbprint from certmgr (no spaces) |

### Create `WINDOWS_CERTIFICATE` on Windows

```powershell
certutil -encode certificate.pfx base64cert.txt
```

Use the base64 body as the secret value.

### Create `WINDOWS_CERTIFICATE` on Mac

```bash
openssl base64 -A -in certificate.pfx -out base64cert.txt
```

---

## Optional helper script (Mac)

From the project root, after exporting `certificate.p12`:

```bash
./scripts/encode-signing-cert.sh /path/to/certificate.p12
```

This prints base64 to paste into `APPLE_CERTIFICATE`. The file is not saved in the repo.

---

## After adding secrets

1. **Settings → Actions → General → Workflow permissions → Read and write permissions**
2. Push a release tag:

```bash
git tag v1.0.0
git push origin v1.0.0
```

3. Watch **Actions → Release** on GitHub  
4. Download signed installers from **Releases**

---

## If secrets are not set yet

The Release workflow still runs and publishes **unsigned** installers. Add secrets when
your Apple and Windows certificates are ready, then push a new tag (e.g. `v1.0.1`) or
re-run the Release workflow.

Full setup guide: [SIGNING.md](../SIGNING.md)
