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
        self.assertEqual(manifest["version"], "1.1.1")
        self.assertNotIn("content_scripts", manifest)

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

    def test_release_builder_emits_extension_and_host_assets(self):
        source = (ROOT / "scripts/build-release.sh").read_text()
        self.assertIn("rofi-chrome-extension-", source)
        self.assertIn("rofi-chrome-host-", source)
        self.assertIn("SHA256SUMS", source)


if __name__ == "__main__":
    unittest.main()
