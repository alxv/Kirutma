#!/usr/bin/env bash
# Encode a .p12 or .pfx certificate for GitHub Actions secrets (stdout only — do not commit output).
set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Usage: $0 /path/to/certificate.p12" >&2
  exit 1
fi

cert="$1"
if [ ! -f "$cert" ]; then
  echo "File not found: $cert" >&2
  exit 1
fi

echo "Paste the line below into GitHub secret APPLE_CERTIFICATE or WINDOWS_CERTIFICATE:"
echo "---"
openssl base64 -A -in "$cert"
echo
echo "---"
echo "Done. Do not save this output to a file in the repository."
