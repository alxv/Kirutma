#!/usr/bin/env bash
# Upload code-signing secrets to GitHub Actions for alxv/Kirutma.
# Requires: GitHub CLI (gh) logged in — run `gh auth login` first.
set -euo pipefail

REPO="alxv/Kirutma"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/.signing-secrets.env"

red() { printf '\033[0;31m%s\033[0m\n' "$*"; }
green() { printf '\033[0;32m%s\033[0m\n' "$*"; }

if ! command -v gh >/dev/null 2>&1; then
  red "GitHub CLI (gh) is not installed."
  echo "Install: brew install gh"
  echo "Then:    gh auth login"
  echo "Or add secrets manually: https://github.com/$REPO/settings/secrets/actions"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  red "Not logged in to GitHub CLI."
  echo "Run: gh auth login"
  exit 1
fi

if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  green "Loaded $ENV_FILE"
else
  echo "No .signing-secrets.env found."
  echo "Copy .signing-secrets.env.example to .signing-secrets.env and fill it in."
  echo ""
  read -r -p "Continue with interactive prompts instead? [y/N] " ans
  [[ "${ans,,}" == "y" ]] || exit 0
fi

set_secret() {
  local name="$1"
  local value="$2"
  if [[ -z "${value// /}" ]]; then
    echo "Skipping $name (empty)"
    return
  fi
  printf '%s' "$value" | gh secret set "$name" --repo "$REPO"
  green "Set $name"
}

prompt_if_empty() {
  local var_name="$1"
  local prompt_text="$2"
  local current="${!var_name:-}"
  if [[ -z "$current" ]]; then
    read -r -p "$prompt_text: " current
    printf -v "$var_name" '%s' "$current"
  fi
}

# --- Mac ---
prompt_if_empty APPLE_CERTIFICATE_FILE "Path to Apple .p12 file"
if [[ -n "${APPLE_CERTIFICATE_FILE:-}" && -f "$APPLE_CERTIFICATE_FILE" ]]; then
  APPLE_CERTIFICATE="$(openssl base64 -A -in "$APPLE_CERTIFICATE_FILE")"
  set_secret APPLE_CERTIFICATE "$APPLE_CERTIFICATE"
else
  echo "Apple .p12 not found — skipping Mac certificate secrets."
fi

prompt_if_empty APPLE_CERTIFICATE_PASSWORD "Apple .p12 export password"
set_secret APPLE_CERTIFICATE_PASSWORD "${APPLE_CERTIFICATE_PASSWORD:-}"

if [[ -z "${KEYCHAIN_PASSWORD:-}" ]]; then
  KEYCHAIN_PASSWORD="$(openssl rand -base64 24 | tr -d '/+=' | head -c 32)"
  echo "Generated KEYCHAIN_PASSWORD for CI (saved to GitHub only)."
fi
set_secret KEYCHAIN_PASSWORD "$KEYCHAIN_PASSWORD"

prompt_if_empty APPLE_ID "Apple ID email"
set_secret APPLE_ID "${APPLE_ID:-}"

prompt_if_empty APPLE_PASSWORD "Apple app-specific password (appleid.apple.com)"
set_secret APPLE_PASSWORD "${APPLE_PASSWORD:-}"

prompt_if_empty APPLE_TEAM_ID "Apple Team ID (10 characters)"
set_secret APPLE_TEAM_ID "${APPLE_TEAM_ID:-}"

# --- Windows ---
if [[ -n "${WINDOWS_CERTIFICATE_FILE:-}" && -f "$WINDOWS_CERTIFICATE_FILE" ]]; then
  WINDOWS_CERTIFICATE="$(openssl base64 -A -in "$WINDOWS_CERTIFICATE_FILE")"
  set_secret WINDOWS_CERTIFICATE "$WINDOWS_CERTIFICATE"
  prompt_if_empty WINDOWS_CERTIFICATE_PASSWORD "Windows .pfx password"
  set_secret WINDOWS_CERTIFICATE_PASSWORD "${WINDOWS_CERTIFICATE_PASSWORD:-}"
  prompt_if_empty WINDOWS_CERTIFICATE_THUMBPRINT "Windows cert thumbprint (no spaces)"
  set_secret WINDOWS_CERTIFICATE_THUMBPRINT "${WINDOWS_CERTIFICATE_THUMBPRINT:-}"
else
  echo "Windows certificate skipped."
fi

echo ""
green "Done. Secrets uploaded to https://github.com/$REPO/settings/secrets/actions"
echo "Re-run Release workflow or push a new tag (e.g. v1.0.1) for signed builds."
