#!/usr/bin/env python3
import pathlib
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]


class PopupTest(unittest.TestCase):
    def test_download_page_loads_its_script(self):
        page = (ROOT / "extension/download.html").read_text()
        self.assertIn('<script src="download.js"></script>', page)

    def test_tab_page_loads_its_script(self):
        page = (ROOT / "extension/tab.html").read_text()
        self.assertIn('<script src="tab.js"></script>', page)


if __name__ == "__main__":
    unittest.main()
