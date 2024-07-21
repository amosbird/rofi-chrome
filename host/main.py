#!/usr/bin/env python3

import struct
import sys
import json
import subprocess
from libqtile.command.client import CommandClient

cmd_client = CommandClient()
obj = cmd_client.navigate("group", "f")


def send_message(message):
    message_bytes = message.encode("utf-8")
    sys.stdout.buffer.write(struct.pack("I", len(message_bytes)))
    sys.stdout.buffer.write(message_bytes)
    sys.stdout.buffer.flush()


LOG_FILE = "/tmp/rofi_script.log"


def log(msg):
    with open(LOG_FILE, "a") as f:
        f.write(f"{msg}\n")


def switch_tab(param):
    try:
        options = param["opts"]
        rofi_opts = ["rofi", "-dmenu"]
        if "rofi-opts" in param:
            rofi_opts.extend(param["rofi-opts"])

        sh = subprocess.Popen(rofi_opts, stdout=subprocess.PIPE, stdin=subprocess.PIPE)
        input_data = "\n".join(options)
        stdout_data, _ = sh.communicate(input=input_data.encode("utf-8"))
        result = stdout_data.decode("utf-8").strip()

        if result == "":
            return ""

        obj.call("toscreen")

        try:
            selected_index = options.index(result)
            if selected_index < len(param["tabIds"]):
                return param["tabIds"][selected_index]
            else:
                return result.split(" ::: ")[-1]
        except ValueError:
            return "g " + result
    except Exception as e:
        log(f"Exception in switch_tab: {e}")
        return ""


def list_downloads(param):
    try:
        options = param["opts"]
        rofi_opts = ["rofi", "-dmenu"]
        if "rofi-opts" in param:
            rofi_opts.extend(param["rofi-opts"])

        sh = subprocess.Popen(rofi_opts, stdout=subprocess.PIPE, stdin=subprocess.PIPE)
        input_data = "\n".join(options)
        stdout_data, _ = sh.communicate(input=input_data.encode("utf-8"))
        ret = sh.wait()

        if ret == 0:
            subprocess.Popen(["fcp", stdout_data])
        elif ret == 10:
            subprocess.Popen(["xdg-open", stdout_data.decode("utf-8").strip()])
        return ""
    except Exception as e:
        log(f"Exception in list_downloads: {e}")
        return ""


def copy_download(param):
    try:
        subprocess.Popen(["fcp", param])
        return ""
    except Exception as e:
        log(f"Exception in copy_download: {e}")
        return ""


def main():
    while True:
        data_length_bytes = sys.stdin.buffer.read(4)

        if len(data_length_bytes) == 0:
            break

        data_length = struct.unpack("I", data_length_bytes)[0]
        data = sys.stdin.buffer.read(data_length).decode("utf-8")
        data = json.loads(data)

        param = data["param"]
        info = data["info"]
        if info == "switchTab":
            output = {"result": switch_tab(param), "info": info}
        elif info == "listDownloads":
            output = {"result": list_downloads(param), "info": info}
        elif info == "copyDownload":
            output = {"result": copy_download(param), "info": info}
        else:
            output = {"result": f"unknown command: {info}"}

        send_message(json.dumps(output))

    sys.exit(0)


if __name__ == "__main__":
    main()
