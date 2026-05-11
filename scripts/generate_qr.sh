#!/usr/bin/env bash
# AMB-024 — Generate a QR PNG pointing at the meetup entry URL.
#
# Usage:
#   ./scripts/generate_qr.sh https://<short-url>
#
# Produces `bingo-qr.png` in the repo root. Verify the QR scans
# from ~30cm with iOS Safari + Android Chrome before printing on
# A4 signage.
#
# Requires `qrencode` (install via `brew install qrencode` on macOS).
set -euo pipefail

URL=${1:-}
if [ -z "$URL" ]; then
    echo "usage: $0 <url>" >&2
    exit 1
fi

if ! command -v qrencode >/dev/null 2>&1; then
    echo "qrencode is not installed. Install via 'brew install qrencode'." >&2
    exit 2
fi

OUT=${OUT:-bingo-qr.png}
qrencode -o "$OUT" -s 12 -m 4 "$URL"

echo "Wrote $OUT for URL: $URL"
echo "Verify:"
echo "  1. Open the PNG on screen at ~A4 size."
echo "  2. Scan from ~30cm with iOS Safari camera + Android Chrome."
echo "  3. Confirm the URL opens the login screen."
