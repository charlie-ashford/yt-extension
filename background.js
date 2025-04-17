chrome.runtime.onInstalled.addListener(details => {
  if (details.reason === 'install') {
    chrome.storage.sync.set({ videosPerRow: 4 });
  } else if (details.reason === 'update') {
    migrateSettings();
  }
});

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'keepAliveAlarm') {
    console.log('Keep-alive alarm triggered.');
  }
});

chrome.alarms.create('keepAliveAlarm', { periodInMinutes: 1 });

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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

  return true;
});

function migrateSettings() {
  chrome.storage.sync.get(['videosPerRow'], result => {
    const videosPerRow = result.videosPerRow || 4;
    updateAllYouTubeTabs(videosPerRow);
  });
}

function updateAllYouTubeTabs(videosPerRow) {
  try {
    chrome.tabs.query({ url: 'https://www.youtube.com/*' }, tabs => {
      if (chrome.runtime.lastError) {
        console.error('Tab query error:', chrome.runtime.lastError);
        return;
      }

      if (!tabs || !tabs.length) {
        return;
      }

      tabs.forEach(tab => {
        try {
          if (!tab.id) return;

          chrome.tabs.sendMessage(
            tab.id,
            {
              action: 'updateGrid',
              videosPerRow: videosPerRow,
            },
            response => {
              if (chrome.runtime.lastError) {
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
