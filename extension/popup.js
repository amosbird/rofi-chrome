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

function openExtensionPage(page) {
    chrome.tabs.create({ url: chrome.runtime.getURL(page) });
    window.close();
}

document.querySelectorAll("button[data-page]").forEach(function (button) {
    button.addEventListener("click", async function () {
        if (button.dataset.page === "bookmarks.html") {
            const granted = await chrome.permissions.request({ permissions: ["bookmarks"] });
            if (!granted) return;
        }
        openExtensionPage(button.dataset.page);
    });
});

document.querySelectorAll("button[data-command]").forEach(function (button) {
    button.addEventListener("click", function () {
        chrome.runtime.sendMessage({ command: button.dataset.command });
        window.close();
    });
});
