# rofi-chrome

A Chromium extension and native messaging host for controlling tabs, history, and downloads with
[Rofi](https://github.com/davatorium/rofi).

Extension ID: `aocepclkpgckjeikiphffdlileoaceec`.

## Features

- Switch between open tabs and recent history
- Open recent history
- Search history from the current origin
- Return to the previously active tab
- List, copy, and open downloads

## Install from a release

Requirements: Chromium, Python 3, and Rofi.

```bash
version=1.1.0
base=https://github.com/amosbird/rofi-chrome/releases/download/v$version
curl -fLO "$base/rofi-chrome-extension-$version.zip"
curl -fLO "$base/rofi-chrome-host-$version.tar.gz"
mkdir -p ~/.local/share/rofi-chrome
unzip -q "rofi-chrome-extension-$version.zip" -d ~/.local/share/rofi-chrome/extension
tar -xzf "rofi-chrome-host-$version.tar.gz" -C ~/.local/share/rofi-chrome
~/.local/share/rofi-chrome/scripts/install.sh \
    --prefix ~/.local/share/rofi-chrome \
    --chromium-config-dir ~/.config/chromium
```

Load `~/.local/share/rofi-chrome/extension` as an unpacked extension, or launch Chromium with:

```bash
chromium --load-extension="$HOME/.local/share/rofi-chrome/extension"
```

For a custom Chromium profile, pass its user-data directory to `--chromium-config-dir` so the
native messaging manifest is installed beside that profile.

Configure commands at `chrome://extensions/shortcuts`.

## Development install

```bash
./scripts/install.sh
chromium --load-extension="$PWD/extension"
```

## Build a release

```bash
./scripts/build-release.sh
sha256sum -c dist/SHA256SUMS
```

## Security

The extension can read tab URLs, browser history, and download paths because those are its core
inputs. Data is sent only to the local native messaging host. The host invokes local commands
(`rofi`, and optionally `fcp`, `xdg-open`, and `rofi-browser-blocklist.sh`) without a shell.
