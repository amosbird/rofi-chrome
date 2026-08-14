const status = document.querySelector("#native-status");

chrome.runtime.sendMessage({ command: "nativeStatus" }, function (response) {
    if (chrome.runtime.lastError || !response?.connected) {
        status.textContent = "Local host not connected";
        status.classList.add("error");
        return;
    }
    status.textContent = "Local host connected";
    status.classList.add("ready");
});

document.querySelectorAll("button[data-command]").forEach(function (button) {
    button.addEventListener("click", function () {
        chrome.runtime.sendMessage({ command: button.dataset.command });
        window.close();
    });
});
