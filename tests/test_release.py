#!/usr/bin/env python3
import json
import pathlib
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]


class ReleaseTest(unittest.TestCase):
    def test_manifest_has_only_used_permissions(self):
        manifest = json.loads((ROOT / "extension/manifest.json").read_text())
        self.assertEqual(
            manifest["permissions"],
            ["nativeMessaging", "tabs", "history", "downloads"],
        )
        self.assertEqual(manifest["version"], "1.2.1")
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
        self.assertIn("--extension-id", source)
        self.assertIn("EXTENSION_ID", source)

    def test_release_builder_emits_extension_and_host_assets(self):
        source = (ROOT / "scripts/build-release.sh").read_text()
        self.assertIn("rofi-chrome-extension-", source)
        self.assertIn("rofi-chrome-host-", source)
        self.assertIn("SHA256SUMS", source)


if __name__ == "__main__":
    unittest.main()
