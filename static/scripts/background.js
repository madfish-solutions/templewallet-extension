// On first install, open a new tab with Thanos
chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === "install") {
    chrome.tabs.create({
      url: chrome.runtime.getURL("main.html")
    });
  }
});
