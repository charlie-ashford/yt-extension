const select = document.getElementById('videosPerRow');
const refreshBtn = document.getElementById('refreshBtn');
const statusMessage = document.querySelector('.status-message');
let statusMessageTimeout;

function showStatus(message, isError = false) {
  if (statusMessageTimeout) {
    clearTimeout(statusMessageTimeout);
  }

  statusMessage.textContent = message;
  statusMessage.className = `status-message ${
    isError ? 'error' : 'success'
  } visible`;

  statusMessageTimeout = setTimeout(() => {
    statusMessage.classList.remove('visible');
  }, 5000);
}

function loadSavedValue() {
  try {
    if (!chrome || !chrome.storage) {
      console.warn('Chrome storage API not available.');
      return;
    }

    chrome.storage.sync.get(['videosPerRow'], result => {
      if (chrome.runtime.lastError) {
        console.error(
          'Error getting data from storage:',
          chrome.runtime.lastError
        );
        showStatus(
          `Error loading saved setting: ${chrome.runtime.lastError.message}`,
          true
        );
        return;
      }

      if (result.videosPerRow) {
        select.value = result.videosPerRow;
      }
    });
  } catch (error) {
    console.error('Error during storage retrieval:', error);
    showStatus(`Error: ${error.message}`, true);
  }
}

loadSavedValue();

select.addEventListener('change', () => {
  const value = select.value;

  try {
    if (!chrome || !chrome.storage) {
      console.warn('Chrome storage API not available.');
      showStatus('Chrome storage API not available.', true);
      return;
    }

    chrome.storage.sync.set({ videosPerRow: value }, () => {
      if (chrome.runtime.lastError) {
        showStatus(
          `Error saving setting: ${chrome.runtime.lastError.message}`,
          true
        );
        return;
      }

      try {
        chrome.runtime.sendMessage(
          { action: 'updateAllTabs', videosPerRow: value },
          response => {
            if (chrome.runtime.lastError) {
              console.log('Background update error:', chrome.runtime.lastError);
              updateCurrentTab(value);
              return;
            }

            showStatus(`Updated to ${value} videos per row`);
          }
        );
      } catch (error) {
        console.error('Error sending message to background:', error);
        updateCurrentTab(value);
      }
    });
  } catch (error) {
    console.error('Error during storage save:', error);
    showStatus(`Error: ${error.message}`, true);
  }
});

function updateCurrentTab(videosPerRow) {
  try {
    if (!chrome || !chrome.tabs) {
      console.warn('Chrome tabs API not available.');
      showStatus('Chrome tabs API not available.', true);
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (chrome.runtime.lastError) {
        showStatus(
          `Error querying tabs: ${chrome.runtime.lastError.message}`,
          true
        );
        return;
      }

      if (!tabs || !tabs[0]?.id) {
        showStatus('No active YouTube tab found', true);
        return;
      }

      try {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: 'updateGrid', videosPerRow: videosPerRow },
          response => {
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

refreshBtn.addEventListener('click', () => {
  try {
    if (!chrome || !chrome.tabs) {
      console.warn('Chrome tabs API not available.');
      showStatus('Chrome tabs API not available.', true);
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (chrome.runtime.lastError) {
        showStatus(
          `Error querying tabs: ${chrome.runtime.lastError.message}`,
          true
        );
        return;
      }

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
  } catch (error) {
    showStatus(`Error accessing tabs: ${error.message}`, true);
  }
});
