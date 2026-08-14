#!/usr/bin/env bash

set -euo pipefail

NAME=io.github.amosbird.rofi.chrome
LEGACY_NAME=io.github.tcode2k16.rofi.chrome
CHROMIUM_CONFIG_DIR="$HOME/.config/chromium"
PREFIX="$HOME/.local/share/rofi-chrome"

while (($#)); do
    case "$1" in
    --chromium-config-dir)
        CHROMIUM_CONFIG_DIR=$2
        shift 2
        ;;
    --prefix)
        PREFIX=$2
        shift 2
        ;;
    -h|--help)
        printf 'usage: %s [--prefix DIR] [--chromium-config-dir DIR]\n' "$0"
        exit 0
        ;;
    *)
        exit 2
        ;;
    esac
done

manifest_dir="$CHROMIUM_CONFIG_DIR/NativeMessagingHosts"
rm -f "$manifest_dir/$NAME.json" "$manifest_dir/$LEGACY_NAME.json"
rm -rf "$PREFIX"
printf 'Removed Rofi Browser Controller native host.\n'
