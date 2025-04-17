const select = document.getElementById('videosPerRow');
const refreshBtn = document.getElementById('refreshBtn');
const statusMessage = document.createElement('p');

// Add status message element to the UI
statusMessage.className = 'status-message';
document.querySelector('.container').appendChild(statusMessage);

// Keep the service worker alive
function pingServiceWorker() {
  try {
    chrome.runtime.sendMessage({ action: 'keepAlive' }, response => {
      if (chrome.runtime.lastError) {
        console.error('Service worker ping error:', chrome.runtime.lastError);
      }
    });
  } catch (error) {
    console.error('Error pinging service worker:', error);
  }
}

// Ping the service worker when popup opens
pingServiceWorker();

// Helper function to show status messages
function showStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${isError ? 'error' : 'success'}`;
  statusMessage.style.display = 'block';

  // Hide the message after 3 seconds
  setTimeout(() => {
    statusMessage.style.display = 'none';
  }, 3000);
}

// Load saved value and set dropdown
chrome.storage.sync.get(['videosPerRow'], result => {
  if (result.videosPerRow) {
    select.value = result.videosPerRow;
  }
});

// Save new value and notify content script
select.addEventListener('change', () => {
  const value = select.value;

  // First, save to storage
  chrome.storage.sync.set({ videosPerRow: value }, () => {
    // Check if there was an error with storage
    if (chrome.runtime.lastError) {
      showStatus(
        `Error saving setting: ${chrome.runtime.lastError.message}`,
        true
      );
      return;
    }

    // Then, notify the background script to update all YouTube tabs
    try {
      chrome.runtime.sendMessage(
        { action: 'updateAllTabs', videosPerRow: value },
        response => {
          if (chrome.runtime.lastError) {
            console.log('Background update error:', chrome.runtime.lastError);
            // Still try to update the current tab directly
            updateCurrentTab(value);
            return;
          }

          showStatus(`Updated to ${value} videos per row`);
        }
      );
    } catch (error) {
      console.error('Error sending message to background:', error);
      // Fallback to updating just the current tab
      updateCurrentTab(value);
    }
  });
});

// Helper function to update just the current tab
function updateCurrentTab(videosPerRow) {
  try {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (!tabs || !tabs[0]?.id) {
        showStatus('No active YouTube tab found', true);
        return;
      }

      try {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: 'updateGrid', videosPerRow: videosPerRow },
          response => {
            // Handle response from content script
            if (chrome.runtime.lastError) {
              showStatus('YouTube page not ready. Please refresh.', true);
              return;
            }

            if (response && response.success) {
              showStatus(
                `Updated current tab to ${videosPerRow} videos per row`
              );
            } else if (response && response.error) {
              showStatus(`Error: ${response.error}`, true);
            }
          }
        );
      } catch (error) {
        showStatus(`Error: ${error.message}`, true);
      }
    });
  } catch (error) {
    showStatus(`Error accessing tabs: ${error.message}`, true);
  }
}

// Refresh button reloads the current tab
refreshBtn.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (!tabs || !tabs[0]?.id) {
      showStatus('No active tab found', true);
      return;
    }

    try {
      chrome.tabs.reload(tabs[0].id);
      showStatus('Page refreshed!');
    } catch (error) {
      showStatus(`Error refreshing: ${error.message}`, true);
    }
  });
});
