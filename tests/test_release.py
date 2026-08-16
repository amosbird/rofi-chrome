#!/usr/bin/env python3
import json
import pathlib
import subprocess
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]


class ReleaseTest(unittest.TestCase):
    def test_manifest_has_only_used_permissions(self):
        manifest = json.loads((ROOT / "extension/manifest.json").read_text())
        self.assertEqual(
            manifest["permissions"],
            ["nativeMessaging", "tabs", "history", "downloads"],
        )
        self.assertEqual(manifest["version"], "1.3.0")
        self.assertNotIn("content_scripts", manifest)
        self.assertEqual(manifest["action"]["default_popup"], "popup.html")
        self.assertEqual(
            manifest["icons"],
            {
                "16": "icons/icon16.png",
                "32": "icons/icon32.png",
                "48": "icons/icon48.png",
                "128": "icons/icon128.png",
            },
        )

    def test_bookmark_manager_uses_optional_permission_and_chrome_api(self):
        manifest = json.loads((ROOT / "extension/manifest.json").read_text())
        page = (ROOT / "extension/bookmarks.html").read_text()
        script = (ROOT / "extension/bookmarks.js").read_text()
        popup = (ROOT / "extension/popup.html").read_text()
        popup_script = (ROOT / "extension/popup.js").read_text()

        self.assertEqual(manifest["optional_permissions"], ["bookmarks"])
        self.assertNotIn("bookmarks", manifest["permissions"])
        self.assertIn('id="url-input"', page)
        self.assertIn('id="move-folder-select"', page)
        self.assertIn("[hidden]", (ROOT / "extension/bookmarks.css").read_text())
        self.assertIn('id="permission-panel"', page)
        self.assertIn('id="bookmark-count"', page)
        self.assertIn('id="empty-bookmarks"', page)
        self.assertIn("chrome.permissions.request", script)
        self.assertIn("chrome.bookmarks.create", script)
        self.assertIn("chrome.bookmarks.move", script)
        self.assertIn("chrome.bookmarks.remove", script)
        self.assertIn("chrome.bookmarks.getTree", script)
        self.assertIn('data-page="bookmarks.html"', popup)
        self.assertIn("chrome.tabs.create", popup_script)

    def test_bookmark_manager_has_capture_and_library_workflows(self):
        page = (ROOT / "extension/bookmarks.html").read_text()
        script = (ROOT / "extension/bookmarks.js").read_text()
        for marker in (
            'id="add-section"',
            'id="library-section"',
            'id="preview-list"',
            'id="preview-summary"',
            'id="library-actions"',
            'id="undo-add"',
            'id="edit-dialog"',
        ):
            self.assertIn(marker, page)
        self.assertNotIn('class="tabs"', page)
        self.assertNotIn('id="library-section" class="library" hidden', page)
        self.assertNotIn("activeView", script)
        self.assertNotIn("setView(", script)
        self.assertIn('event.ctrlKey && event.key === "1"', script)
        self.assertIn('event.ctrlKey && event.key === "2"', script)
        self.assertIn("input.focus()", script)
        self.assertIn("searchInput.focus()", script)
        self.assertIn("renderPreview", script)
        self.assertIn("defaultBookmarkParent", script)
        self.assertIn("chrome.bookmarks.update", script)
        self.assertIn("chrome.bookmarks.onCreated", script)
        self.assertIn("undoCreatedIds", script)

    def test_bookmark_manager_supports_hierarchical_markdown_outline(self):
        page = (ROOT / "extension/bookmarks.html").read_text()
        script = (ROOT / "extension/bookmarks.js").read_text()
        for text in (
            "Markdown Bookmark Outline",
            "# Bookmarks",
            "## Work",
            "- [ClickHouse Docs](https://clickhouse.com/docs)",
        ):
            self.assertIn(text, page)
        self.assertIn('id="format-help-dialog"', page)
        self.assertIn('id="show-format-help"', page)
        self.assertNotIn("<details", page)
        self.assertNotIn('id="paste-clipboard"', page)
        self.assertIn("parseBookmarkOutline", script)
        self.assertIn("headingStack", script)
        self.assertIn("folderPath", script)
        self.assertIn("ensureFolderPath", script)
        self.assertIn("folderCache", script)
        self.assertIn("Format error", script)

    def test_bookmark_manager_accepts_space_separated_title_and_url(self):
        script = (ROOT / "extension/bookmarks.js").read_text()
        parser = "function parseBookmarkOutline" + script.split(
            "function parseBookmarkOutline", 1
        )[1].split("function flattenTree", 1)[0]
        result = subprocess.run(
            [
                "node",
                "-e",
                parser
                + '\nconsole.log(JSON.stringify(parseUrls("ClickHouse Docs https://clickhouse.com/docs\\nArchWiki https://wiki.archlinux.org/")));',
            ],
            check=True,
            capture_output=True,
            text=True,
        )
        self.assertEqual(
            json.loads(result.stdout),
            {
                "items": [
                    {
                        "title": "ClickHouse Docs",
                        "url": "https://clickhouse.com/docs",
                        "folderPath": [],
                        "line": 1,
                    },
                    {
                        "title": "ArchWiki",
                        "url": "https://wiki.archlinux.org/",
                        "folderPath": [],
                        "line": 2,
                    },
                ],
                "errors": [],
            },
        )

    def test_bookmark_manager_opens_urls_in_a_normal_browser_window(self):
        script = (ROOT / "extension/bookmarks.js").read_text()
        self.assertIn("async function openInBrowser", script)
        self.assertIn('chrome.runtime.sendNativeMessage("io.github.amosbird.rofi.chrome",', script)
        self.assertIn('info: "openInBrowser"', script)
        self.assertNotIn("chrome.windows.create", script)
        self.assertIn("await openInBrowser(bookmark.url)", script)
        self.assertNotIn("await chrome.tabs.create({ url: bookmark.url })", script)

    def test_add_uses_chromium_default_bookmark_folder(self):
        page = (ROOT / "extension/bookmarks.html").read_text()
        script = (ROOT / "extension/bookmarks.js").read_text()
        add_section = page.split('id="add-section"', 1)[1].split('id="library-section"', 1)[0]
        self.assertNotIn('id="folder-select"', add_section)
        self.assertNotIn('id="choose-new-folder"', add_section)
        self.assertIn("async function defaultBookmarkParent", script)
        self.assertIn('folder.folderType === "other"', script)
        self.assertNotIn("localStorage.lastFolderId", script)

    def test_popup_requests_bookmark_permission_before_opening_manager(self):
        script = (ROOT / "extension/popup.js").read_text()
        self.assertIn("chrome.permissions.request", script)
        self.assertIn('permissions: ["bookmarks"]', script)
        self.assertIn("openExtensionPage", script)

    def test_bookmark_manager_keeps_raw_urls_and_has_no_network_access(self):
        manifest = json.loads((ROOT / "extension/manifest.json").read_text())
        script = (ROOT / "extension/bookmarks.js").read_text()
        self.assertNotIn("host_permissions", manifest)
        self.assertNotIn("fetch(", script)
        self.assertNotIn("XMLHttpRequest", script)
        self.assertIn("parseUrls", script)
        self.assertIn("new URL", script)

    def test_native_host_is_portable(self):
        source = (ROOT / "host/main.py").read_text()
        self.assertNotIn("libqtile", source)
        self.assertNotIn("/tmp/rofi_script.log", source)
        self.assertIn("struct.pack(\"<I\"", source)
        self.assertIn("read_exact", source)

    def test_install_supports_noninteractive_custom_profile(self):
        source = (ROOT / "scripts/install.sh").read_text()
        self.assertIn("--chromium-config-dir", source)
        self.assertIn("--prefix", source)
        self.assertNotIn("read -n 1", source)
        self.assertIn("chromium", source)

    def test_store_submission_assets_exist(self):
        for path in (
            "extension/bookmarks.html",
            "extension/bookmarks.css",
            "extension/bookmarks.js",
            "extension/icons/icon16.png",
            "extension/icons/icon32.png",
            "extension/icons/icon48.png",
            "extension/icons/icon128.png",
            "store-assets/screenshot-tabs.png",
            "store-assets/screenshot-history.png",
            "store-assets/screenshot-site-history.png",
            "store-assets/small-promo.png",
            "PRIVACY.md",
            "store-listing.md",
        ):
            self.assertTrue((ROOT / path).is_file(), path)

    def test_store_metadata_uses_live_privacy_url(self):
        listing = (ROOT / "store-listing.md").read_text()
        self.assertIn("https://amosbird.github.io/rofi-chrome/privacy", listing)
        self.assertNotIn("after enabling GitHub Pages", listing)

    def test_release_builder_emits_store_zip_without_development_key(self):
        source = (ROOT / "scripts/build-release.sh").read_text()
        self.assertIn("rofi-chrome-cws-", source)
        self.assertIn('manifest.pop("key", None)', source)

    def test_native_host_uses_amosbird_identifier_only(self):
        files = [
            ROOT / "extension/bg.js",
            ROOT / "scripts/install.sh",
            ROOT / "scripts/uninstall.sh",
            *ROOT.glob("host/*.json"),
        ]
        combined = "\n".join(path.read_text() for path in files)
        self.assertIn("io.github.amosbird.rofi.chrome", combined)
        self.assertNotIn("HOST_NAME = \"io.github.tcode2k16.rofi.chrome\"", combined)
        self.assertNotIn('"name": "io.github.tcode2k16.rofi.chrome"', combined)
        self.assertTrue(
            (ROOT / "host/io.github.amosbird.rofi.chrome.chromium.json").is_file()
        )

    def test_installer_removes_legacy_native_host_manifest(self):
        source = (ROOT / "scripts/install.sh").read_text()
        self.assertIn("LEGACY_NAME=io.github.tcode2k16.rofi.chrome", source)
        self.assertIn('rm -f "$manifest_dir/$LEGACY_NAME.json"', source)

    def test_native_host_allows_extension_id_override(self):
        source = (ROOT / "scripts/install.sh").read_text()
        self.assertIn("jpgfhlaplofoaempbhliigmjbpofeghk", source)
        self.assertIn("--extension-id", source)
        self.assertIn("EXTENSION_ID", source)

    def test_release_builder_emits_extension_and_host_assets(self):
        source = (ROOT / "scripts/build-release.sh").read_text()
        self.assertIn("rofi-chrome-extension-", source)
        self.assertIn("rofi-chrome-host-", source)
        self.assertIn("SHA256SUMS", source)


if __name__ == "__main__":
    unittest.main()
