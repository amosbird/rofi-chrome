#!/usr/bin/env bash

set -euo pipefail

VERSION=${1:-$(python3 -c 'import json; print(json.load(open("extension/manifest.json"))["version"])')}
DIST=${DIST:-dist}
ROOT=$(pwd)

rm -rf "$DIST"
mkdir -p "$DIST/extension" "$DIST/host/host" "$DIST/host/scripts"
cp -R extension/. "$DIST/extension/"
cp host/main.py host/io.github.tcode2k16.rofi.chrome.chromium-browser.json "$DIST/host/host/"
cp scripts/install.sh "$DIST/host/scripts/"

(
    cd "$DIST/extension"
    zip -qr "$ROOT/$DIST/rofi-chrome-extension-$VERSION.zip" .
)
(
    cd "$DIST/host"
    tar -czf "$ROOT/$DIST/rofi-chrome-host-$VERSION.tar.gz" .
)
(
    cd "$DIST"
    sha256sum "rofi-chrome-extension-$VERSION.zip" "rofi-chrome-host-$VERSION.tar.gz" \
        > SHA256SUMS
)
