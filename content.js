// Debounce helper to avoid excessive calls
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Apply user setting by updating CSS variables on ytd-rich-grid-renderer
function applyGridItemsPerRow(videosPerRow) {
  try {
    const gridRenderer = document.querySelector('ytd-rich-grid-renderer');

    if (!gridRenderer) {
      // If we're on a YouTube page that should have a grid but doesn't yet, retry
      if (
        window.location.pathname === '/' ||
        window.location.pathname === '/feed/subscriptions'
      ) {
        setTimeout(() => applyGridItemsPerRow(videosPerRow), 1000);
      }
      return;
    }

    // Use responsive calculation for max-width based on viewport and grid columns
    const viewportWidth = Math.max(
      document.documentElement.clientWidth || 0,
      window.innerWidth || 0
    );
    const availableWidth = viewportWidth * 0.9; // Account for margins/padding
    const maxWidth = Math.min(
      500,
      Math.floor(availableWidth / videosPerRow) - 16
    );

    // Apply the custom grid settings
    gridRenderer.style.setProperty(
      '--ytd-rich-grid-items-per-row',
      videosPerRow
    );
    gridRenderer.style.setProperty(
      '--ytd-rich-grid-item-max-width',
      `${maxWidth}px`
    );
    gridRenderer.style.setProperty('--ytd-rich-grid-item-margin', '16px');
  } catch (error) {
    console.error('Error in applyGridItemsPerRow:', error);
    // Don't throw, just log the error
  }
}

// Initialize with a retry mechanism
function initializeGrid() {
  // Check if we're on a YouTube page where grid customization makes sense
  const isRelevantPage =
    window.location.pathname === '/' ||
    window.location.pathname === '/feed/subscriptions' ||
    window.location.pathname.includes('/c/') ||
    window.location.pathname.includes('/channel/') ||
    window.location.pathname.includes('/@');

  if (!isRelevantPage) return;

  // Use a Promise wrapper with a timeout to handle potential errors
  const getStorageSettings = () => {
    return new Promise(resolve => {
      try {
        const defaultValue = 4;

        // First check if chrome.runtime is still available
        if (!chrome || !chrome.runtime || !chrome.storage) {
          console.warn('Chrome API not available, using default value');
          resolve(defaultValue);
          return;
        }

        // Use a timeout to prevent hanging if chrome.storage becomes unavailable
        const timeoutId = setTimeout(() => {
          console.warn('Storage request timed out, using default value');
          resolve(defaultValue);
        }, 1000);

        try {
          chrome.storage.sync.get(['videosPerRow'], result => {
            clearTimeout(timeoutId);

            if (chrome.runtime.lastError) {
              console.warn('Storage error:', chrome.runtime.lastError.message);
              resolve(defaultValue);
              return;
            }

            const videosPerRow = parseInt(result?.videosPerRow) || defaultValue;
            resolve(videosPerRow);
          });
        } catch (innerError) {
          clearTimeout(timeoutId);
          console.warn('Inner storage error:', innerError.message);
          resolve(defaultValue);
        }
      } catch (outerError) {
        console.warn('Outer storage error:', outerError.message);
        resolve(4); // Default to 4 videos per row
      }
    });
  };

  // Use the promise to get settings, then apply them
  getStorageSettings()
    .then(videosPerRow => {
      // Wait for YouTube's dynamic content to load
      if (!document.querySelector('ytd-rich-grid-renderer')) {
        // Retry after a short delay if grid renderer is not yet available
        setTimeout(() => initializeGrid(), 500);
        return;
      }

      applyGridItemsPerRow(videosPerRow);
    })
    .catch(error => {
      console.error('Error in initializeGrid promise chain:', error);

      // Don't retry if we have a critical extension error
      if (!error.message?.includes('Extension context invalidated')) {
        setTimeout(() => initializeGrid(), 1000);
      }
    });
}

// Handle page navigation with History API
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    setTimeout(() => {
      try {
        initializeGrid();
      } catch (e) {
        console.error('Error after navigation:', e);
      }
    }, 1000);
  }
}).observe(document, { subtree: true, childList: true });

// Run on initial load with error handling
try {
  // Ping the service worker to make sure it's active
  try {
    chrome.runtime.sendMessage({ action: 'keepAlive' });
  } catch (e) {
    console.log('Service worker initialization:', e);
    // Non-critical error, continue with content script
  }

  initializeGrid();

  // Observe DOM changes to reapply layout (YouTube loads dynamically)
  const observer = new MutationObserver(
    debounce(() => {
      try {
        initializeGrid();
      } catch (e) {
        console.error('Error in mutation observer:', e);
      }
    }, 300)
  );

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
} catch (e) {
  console.error('Critical initialization error:', e);
}

// Listen for messages from popup to update immediately
try {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateGrid' && message.videosPerRow) {
      try {
        applyGridItemsPerRow(parseInt(message.videosPerRow));
        sendResponse({ success: true });
      } catch (error) {
        console.error('Error applying grid changes:', error);
        sendResponse({ success: false, error: error.message });
      }
    }
    return true; // Keep the messaging channel open for async responses
  });
} catch (error) {
  console.error('Error setting up message listener:', error);
}
