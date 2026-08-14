#!/usr/bin/env python3
import pathlib
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]


class PopupTest(unittest.TestCase):
    def test_toolbar_popup_exposes_all_commands(self):
        page = (ROOT / "extension/popup.html").read_text()
        script = (ROOT / "extension/popup.js").read_text()
        for command in ("switchTab", "openHistory", "pageFunc", "listDownloads", "goLastTab"):
            self.assertIn(f'data-command="{command}"', page)
        self.assertIn("chrome.runtime.sendMessage", script)
        self.assertIn("native-status", page)

    def test_download_page_loads_its_script(self):
        page = (ROOT / "extension/download.html").read_text()
        self.assertIn('<script src="download.js"></script>', page)

    def test_tab_page_loads_its_script(self):
        page = (ROOT / "extension/tab.html").read_text()
        self.assertIn('<script src="tab.js"></script>', page)


if __name__ == "__main__":
    unittest.main()
