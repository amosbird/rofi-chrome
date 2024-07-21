/*** data ***/

const HOST_NAME = "io.github.tcode2k16.rofi.chrome";

let state = {
    port: null,
    lastTabId: [0, 0],
};

/*** utils ***/

function goToTab(id) {
    chrome.tabs.get(id, function (tabInfo) {
        chrome.windows.update(tabInfo.windowId, { focused: true }, function () {
            chrome.tabs.update(id, { active: true, highlighted: true });
        });
    });
}

function openUrlInNewTab(input) {
    const urlRegex = /^(ftp|http|https):\/\/[^ "]+$/;

    if (urlRegex.test(input)) {
        chrome.tabs.create({ url: input });
    } else {
        const domainPattern = /^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
        if (domainPattern.test(input)) {
            chrome.tabs.create({ url: `https://${input}` });
        } else {
            let searchUrl = `https://www.google.com/search?q=${encodeURIComponent(input)}`;
            chrome.tabs.create({ url: searchUrl });
        }
    }
}

/// TODO: Filter results
function refreshHistory(callback) {
    const oneWeekAgo = new Date().getTime() - 7 * 24 * 60 * 60 * 1000;
    chrome.history.search(
        {
            text: "",
            startTime: oneWeekAgo,
            maxResults: 5000,
        },
        function (results) {
            callback(results);
        },
    );
}

/*** commands ***/

const CMDS = {
    switchTab() {
        chrome.tabs.query({}, function (tabs) {
            // Ensure state.port is initialized
            if (!state.port) {
                console.error("Error: state.port is not initialized.");
                return;
            }

            // Check for any errors in the tabs query
            if (chrome.runtime.lastError) {
                console.error("Error querying tabs:", chrome.runtime.lastError);
                return;
            }

            // Fetch browsing history
            refreshHistory(function (historyResults) {
                // Check for any errors in the history query
                if (chrome.runtime.lastError) {
                    console.error(
                        "Error querying history:",
                        chrome.runtime.lastError,
                    );
                    return;
                }

                // Combine tabs and history results
                const combinedOpts = [
                    ...tabs.map((e) => `${e.title} ::: ${e.url}`),
                    ...historyResults.map((e) => `${e.title} ::: ${e.url}`),
                ];

                const tabIds = tabs.map((e) => e.id);

                // Send combined options to rofi
                try {
                    state.port.postMessage({
                        info: "switchTab",
                        param: {
                            "rofi-opts": [
                                "-matching",
                                "normal",
                                "-i",
                                "-p",
                                "Search",
                            ],
                            opts: combinedOpts,
                            tabIds: tabIds,
                        },
                    });
                } catch (error) {
                    console.error(
                        "Error sending message via state.port:",
                        error,
                    );
                }
            });
        });
    },

    listDownloads() {
        chrome.downloads.search({}, function (results) {
            // Ensure state.port is initialized
            if (!state.port) {
                console.error("Error: state.port is not initialized.");
                return;
            }

            // Check for any errors in the tabs query
            if (chrome.runtime.lastError) {
                console.error("Error querying tabs:", chrome.runtime.lastError);
                return;
            }

            const existingDownloads = results.filter(
                (downloadItem) => downloadItem.exists,
            );

            existingDownloads.sort(
                (a, b) => new Date(b.startTime) - new Date(a.startTime),
            );

            try {
                state.port.postMessage({
                    info: "listDownloads",
                    param: {
                        "rofi-opts": [
                            "-matching",
                            "normal",
                            "-i",
                            "-p",
                            "Search",
                            "-kb-accept-custom",
                            "Shift-Return",
                            "-kb-custom-1",
                            "Control-Return",
                        ],
                        opts: existingDownloads.map((e) => e.filename),
                    },
                });
            } catch (error) {
                console.error("Error sending message via state.port:", error);
            }
        });
    },

    openHistory() {
        refreshHistory(function (results) {
            state.port.postMessage({
                info: "openHistory",
                param: {
                    "rofi-opts": ["-matching", "normal", "-i", "-p", "history"],
                    opts: results.map((e) => e.title + " ::: " + e.url),
                },
            });
        });
    },

    goLastTab() {
        goToTab(state.lastTabId[1]);
    },

    pageFunc() {
        chrome.tabs.query(
            { active: true, currentWindow: true },
            async function (tabInfo) {
                if (tabInfo.length < 1) return;
                const pageOrigin = new URL(tabInfo[0].url).origin;

                refreshHistory(function (results) {
                    state.port.postMessage({
                        info: "changeToPage",
                        param: {
                            "rofi-opts": [
                                "-matching",
                                "normal",
                                "-i",
                                "-p",
                                "page",
                            ],
                            opts: results
                                .filter((e) => e.url.indexOf(pageOrigin) === 0)
                                .map((e) => e.title + " ::: " + e.url),
                        },
                    });
                });
            },
        );
    },
};

/*** listeners ***/

function onNativeMessage(message) {
    if (message.info === "switchTab" && message.result !== "") {
        if (typeof message.result === "string") {
            if (message.result.startsWith("g ")) {
                let url = message.result.substring(2);
                openUrlInNewTab(url);
            } else {
                chrome.tabs.create({ url: message.result });
            }
        } else {
            goToTab(parseInt(message.result));
        }
    } else if (message.info === "openHistory" && message.result !== "") {
        let parts = message.result.split(" ::: ");

        openUrlInNewTab(parts[parts.length - 1]);
    } else if (message.info === "changeToPage" && message.result !== "") {
        let parts = message.result.split(" ::: ");
        chrome.tabs.query(
            { active: true, currentWindow: true },
            function (tabInfo) {
                chrome.tabs.update(tabInfo[0].id, {
                    url: parts[parts.length - 1],
                });
            },
        );
    } else if (message.result === "") {
        // do nothing
    } else {
        console.log(JSON.stringify(message));
    }

    // console.log
}

function onDisconnected() {
    console.log("Failed to connect: " + chrome.runtime.lastError.message);
    state.port = null;
}

function addChromeListeners() {
    const listeners = {
        runtime: {
            onMessage: function (message, sender, sendsendResponse) {
                if (message.command in CMDS) {
                    CMDS[message.command]();
                } else {
                    console.log("unknown command: " + message.command);
                }
            },
        },
        commands: {
            onCommand: function (command) {
                if (command in CMDS) {
                    CMDS[command]();
                } else {
                    console.log("unknown command: " + command);
                }
            },
        },
        tabs: {
            onActivated: function (activeInfo) {
                state.lastTabId[1] = state.lastTabId[0];
                state.lastTabId[0] = activeInfo.tabId;
            },
        },

        downloads: {
            onChanged: function (downloadDelta) {
                if (
                    downloadDelta.state &&
                    downloadDelta.state.current === "complete"
                ) {
                    chrome.downloads.search(
                        { id: downloadDelta.id },
                        function (results) {
                            if (results.length > 0) {
                                const downloadItem = results[0];
                                if (downloadItem.exists) {
                                    // Ensure state.port is initialized
                                    if (!state.port) {
                                        console.error("Error: state.port is not initialized.");
                                        return;
                                    }

                                    // Check for any errors in the tabs query
                                    if (chrome.runtime.lastError) {
                                        console.error("Error querying tabs:", chrome.runtime.lastError);
                                        return;
                                    }

                                    try {
                                        state.port.postMessage({
                                            info: "copyDownload",
                                            param: downloadItem.filename,
                                        });
                                    } catch (error) {
                                        console.error("Error sending message via state.port:", error);
                                    }
                                }
                            }
                        },
                    );
                }
            },
        },
    };

    for (let api in listeners) {
        for (let method in listeners[api]) {
            chrome[api][method].addListener(listeners[api][method]);
        }
    }
}

/*** main ***/

state.port = chrome.runtime.connectNative(HOST_NAME);
state.port.onMessage.addListener(onNativeMessage);
state.port.onDisconnect.addListener(onDisconnected);

addChromeListeners();
