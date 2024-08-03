chrome.runtime.sendMessage({ command: "listDownloads" }, function(response) {
  console.log("Message sent to background script");
  chrome.runtime.sendMessage({ command: "goLastTab" });
  window.close();
});
