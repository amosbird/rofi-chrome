# rofi-chrome

A Chromium extension and native messaging host for controlling tabs, history, downloads, and
bookmarks with [Rofi](https://github.com/davatorium/rofi).

Chrome Web Store Item ID: `jpgfhlaplofoaempbhliigmjbpofeghk`.
Development builds retain the historical local ID `aocepclkpgckjeikiphffdlileoaceec`.

## Features

- Switch between open tabs and recent history
- Open recent history
- Search history from the current origin
- Return to the previously active tab
- List, copy, and open downloads
- Optionally manage Chromium bookmarks from a local extension page
- Bulk-add raw HTTP(S) URLs without opening or resolving them
- Import a self-describing Markdown Bookmark Outline into nested Chromium folders
- Search, move, and delete selected bookmarks

## Hierarchical text import

The Bookmark Manager accepts a Markdown Bookmark Outline:

```markdown
# Bookmarks

## Work
### ClickHouse
- [ClickHouse Documentation](https://clickhouse.com/docs)
- https://presentations.clickhouse.com/

## Personal
- [ArchWiki](https://wiki.archlinux.org/)
```

`# Bookmarks` identifies the document. Headings from level two onward create nested folders beneath
the selected target folder. Markdown links keep their title; bare URLs use their hostname. Heading
levels cannot skip a level. URLs are stored unchanged and are never fetched or resolved.

## Install from a release

Requirements: Chromium, Python 3, and Rofi.

```bash
version=1.4.0
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

For a Chrome Web Store installation, also pass the Item ID shown in the Developer Dashboard:

```bash
~/.local/share/rofi-chrome/scripts/install.sh \
    --extension-id jpgfhlaplofoaempbhliigmjbpofeghk
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

## Chrome Web Store submission

Build the upload package and checksums:

```bash
./scripts/build-release.sh
unzip -l dist/rofi-chrome-cws-1.4.0.zip
```

Upload `dist/rofi-chrome-cws-1.4.0.zip`. It deliberately omits the development `key`; after the
first upload, use the Item ID from the dashboard when installing the native host. Submission copy is
in `store-listing.md`, the privacy policy is in `PRIVACY.md`, and listing images are in
`store-assets/`.

## Security

The extension can read tab URLs, browser history, and download paths because those are its core
inputs. Optional bookmark access is requested only from Bookmark Manager and stays inside Chromium.
Tab and history data, plus the displayed download list, is sent only to the local native messaging
host for Rofi selection. Download paths are copied with the browser Clipboard API, and files are
opened with the browser Downloads API. The native host invokes only `rofi` for selection; opening a
bookmark delegates its HTTP(S) URL to the configured main-browser wrapper.
