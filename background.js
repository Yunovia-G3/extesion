// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener(async (tab) => {
  try {
    // Open the side panel
    await chrome.sidePanel.open({ windowId: tab.windowId });
    
    // Optionally focus the side panel
    await chrome.sidePanel.setOptions({
      path: "sidepanel.html",
      enabled: true
    });
  } catch (error) {
    console.error('Error opening side panel:', error);
  }
});

// Optional: Keep side panel enabled by default
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setOptions({
    enabled: true
  });
});