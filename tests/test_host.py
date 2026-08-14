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

    def test_blocklist_keeps_tab_id_alignment(self):
        param = {
            "opts": ["Blocked ::: https://blocked", "Visible ::: https://visible"],
            "tabIds": [10, 20],
        }
        with (
            mock.patch.object(HOST, "blocklist_patterns", return_value=[]),
            mock.patch.object(HOST, "rofi_select", return_value=(0, param["opts"][1])),
        ):
            self.assertEqual(HOST.switch_tab(param), 20)

        import re

        with (
            mock.patch.object(HOST, "blocklist_patterns", return_value=[re.compile("blocked")]),
            mock.patch.object(HOST, "rofi_select", return_value=(0, param["opts"][1])),
        ):
            self.assertEqual(HOST.switch_tab(param), 20)

    def test_history_is_handled_by_native_host(self):
        with mock.patch.object(HOST, "rofi_select", return_value=(0, "Title ::: https://x")):
            self.assertEqual(
                HOST.handle_message({"info": "openHistory", "param": {"opts": []}}),
                {"result": "Title ::: https://x", "info": "openHistory"},
            )


if __name__ == "__main__":
    unittest.main()
