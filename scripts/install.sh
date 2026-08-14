#!/usr/bin/env bash

set -euo pipefail

NAME=io.github.tcode2k16.rofi.chrome
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
ROOT=$(cd "$SCRIPT_DIR/.." && pwd)
PREFIX="$HOME/.local/share/rofi-chrome"
CHROMIUM_CONFIG_DIR="$HOME/.config/chromium"
EXTENSION_ID=aocepclkpgckjeikiphffdlileoaceec

usage() {
    printf 'usage: %s [--prefix DIR] [--chromium-config-dir DIR] [--extension-id ID]\n' "$0"
}

while (($#)); do
    case "$1" in
    --prefix)
        PREFIX=$2
        shift 2
        ;;
    --chromium-config-dir)
        CHROMIUM_CONFIG_DIR=$2
        shift 2
        ;;
    --extension-id)
        EXTENSION_ID=$2
        shift 2
        ;;
    -h|--help)
        usage
        exit 0
        ;;
    *)
        usage >&2
        exit 2
        ;;
    esac
done

command -v python3 >/dev/null
command -v rofi >/dev/null

mkdir -p "$PREFIX/host" "$PREFIX/extension"
if [[ $(realpath "$ROOT/host") != $(realpath "$PREFIX/host") ]]; then
    cp "$ROOT/host/main.py" "$PREFIX/host/"
fi
if [[ -d "$ROOT/extension" && $(realpath "$ROOT/extension") != $(realpath "$PREFIX/extension") ]]; then
    cp -R "$ROOT/extension/." "$PREFIX/extension/"
fi
chmod +x "$PREFIX/host/main.py"

manifest_dir="$CHROMIUM_CONFIG_DIR/NativeMessagingHosts"
mkdir -p "$manifest_dir"
sed -e "s|HOST_PATH|$PREFIX/host/main.py|" \
    -e "s|EXTENSION_ID|$EXTENSION_ID|" \
    "$ROOT/host/$NAME.chromium-browser.json" > "$manifest_dir/$NAME.json"

printf 'Native host: %s\nExtension: %s\n' "$manifest_dir/$NAME.json" "$PREFIX/extension"
