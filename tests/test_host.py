#!/usr/bin/env python3
import importlib.util
import io
import pathlib
import struct
import unittest
from unittest import mock


PATH = pathlib.Path(__file__).resolve().parents[1] / "host/main.py"
SPEC = importlib.util.spec_from_file_location("rofi_chrome_host", PATH)
HOST = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(HOST)


class HostTest(unittest.TestCase):
    def test_read_exact_handles_short_reads(self):
        class Stream:
            chunks = iter((b"ab", b"c"))

            def read(self, _):
                return next(self.chunks, b"")

        self.assertEqual(HOST.read_exact(Stream(), 3), b"abc")

    def test_send_message_uses_little_endian_length(self):
        stream = io.BytesIO()
        stdout = mock.Mock(buffer=stream)
        with mock.patch.object(HOST.sys, "stdout", stdout):
            HOST.send_message({"result": "ok"})
        payload = stream.getvalue()
        self.assertEqual(struct.unpack("<I", payload[:4])[0], len(payload[4:]))

    def test_switch_tab_keeps_tab_id_alignment_without_external_filter(self):
        param = {
            "opts": ["First ::: https://first", "Second ::: https://second"],
            "tabIds": [10, 20],
        }
        with mock.patch.object(HOST, "rofi_select", return_value=(0, param["opts"][1])):
            self.assertEqual(HOST.switch_tab(param), 20)

    def test_download_selection_returns_browser_action(self):
        param = {"opts": ["/tmp/first", "/tmp/second"], "downloadIds": [10, 20]}
        with mock.patch.object(HOST, "rofi_select", return_value=(0, param["opts"][1])):
            self.assertEqual(HOST.list_downloads(param), {"action": "copy", "id": 20})
        with mock.patch.object(HOST, "rofi_select", return_value=(10, param["opts"][0])):
            self.assertEqual(HOST.list_downloads(param), {"action": "open", "id": 10})

    def test_host_has_no_personal_filter_or_download_helper_dependencies(self):
        source = PATH.read_text()
        self.assertNotIn("rofi-browser-blocklist", source)
        self.assertNotIn('"copyDownload"', source)
        self.assertNotIn('["fcp"', source)

    def test_open_bookmark_delegates_to_desktop_browser(self):
        with mock.patch.object(HOST.subprocess, "Popen") as popen:
            self.assertEqual(HOST.open_in_browser({"url": "https://example.com/path"}), "")
        popen.assert_called_once_with(
            ["xdg-open", "https://example.com/path"],
            stdout=HOST.subprocess.DEVNULL,
            stderr=HOST.subprocess.DEVNULL,
        )

    def test_open_bookmark_rejects_non_http_urls(self):
        with mock.patch.object(HOST.subprocess, "Popen") as popen:
            self.assertEqual(HOST.open_in_browser({"url": "file:///tmp/private"}), "")
        popen.assert_not_called()

    def test_history_is_handled_by_native_host(self):
        with mock.patch.object(HOST, "rofi_select", return_value=(0, "Title ::: https://x")):
            self.assertEqual(
                HOST.handle_message({"info": "openHistory", "param": {"opts": []}}),
                {"result": "Title ::: https://x", "info": "openHistory"},
            )


if __name__ == "__main__":
    unittest.main()
