// Handle extension installation and updates
chrome.runtime.onInstalled.addListener(details => {
  if (details.reason === 'install') {
    // Set default value on installation
    chrome.storage.sync.set({ videosPerRow: 4 });
  } else if (details.reason === 'update') {
    // Handle any necessary migrations when the extension updates
    migrateSettings();
  }
});

// Service worker to keep the extension alive
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Always respond to keepAlive messages promptly
  if (message.action === 'keepAlive') {
    sendResponse({ status: 'alive' });
    return true;
  }

  // Handle grid update requests from popup
  if (message.action === 'updateAllTabs' && message.videosPerRow) {
    try {
      updateAllYouTubeTabs(message.videosPerRow);
      sendResponse({ success: true });
    } catch (error) {
      console.error('Error updating tabs:', error);
      sendResponse({ success: false, error: error.message });
    }
    return true;
  }

  return true; // Keep messaging channel open
});

// Update all YouTube tabs when extension updates
function migrateSettings() {
  // Get the current settings
  chrome.storage.sync.get(['videosPerRow'], result => {
    const videosPerRow = result.videosPerRow || 4;
    updateAllYouTubeTabs(videosPerRow);
  });
}

// Helper function to update all YouTube tabs
function updateAllYouTubeTabs(videosPerRow) {
  try {
    // Find and update all YouTube tabs
    chrome.tabs.query({ url: 'https://www.youtube.com/*' }, tabs => {
      if (chrome.runtime.lastError) {
        console.error('Tab query error:', chrome.runtime.lastError);
        return;
      }

      if (!tabs || !tabs.length) {
        return; // No YouTube tabs open
      }

      tabs.forEach(tab => {
        try {
          if (!tab.id) return;

          // Send message to update the grids with proper error handling
          chrome.tabs.sendMessage(
            tab.id,
            {
              action: 'updateGrid',
              videosPerRow: videosPerRow,
            },
            response => {
              // Just log errors but don't take further action
              if (chrome.runtime.lastError) {
                // This is expected if the content script isn't ready yet
                console.log(
                  `Tab ${tab.id} not ready:`,
                  chrome.runtime.lastError.message
                );
              }
            }
          );
        } catch (tabError) {
          console.error(`Error with tab ${tab.id}:`, tabError);
        }
      });
    });
  } catch (error) {
    console.error('Critical error in updateAllYouTubeTabs:', error);
  }
}
