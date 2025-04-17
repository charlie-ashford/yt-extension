function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function applyGridItemsPerRow(videosPerRow) {
  try {
    const gridRenderer = document.querySelector('ytd-rich-grid-renderer');

    if (!gridRenderer) {
      if (
        window.location.pathname === '/' ||
        window.location.pathname === '/feed/subscriptions'
      ) {
        setTimeout(() => applyGridItemsPerRow(videosPerRow), 1000);
      }
      return;
    }

    videosPerRow = parseInt(videosPerRow, 10);
    if (isNaN(videosPerRow) || videosPerRow <= 0) {
      console.error('Invalid videosPerRow value:', videosPerRow);
      return;
    }

    let availableWidth =
      Math.max(
        document.documentElement.clientWidth || 0,
        window.innerWidth || 0
      ) * 0.9;

    if (document.body.scrollHeight > document.body.clientHeight) {
      availableWidth -= 15;
    }

    let itemMargin = 16;
    let itemWidth = (availableWidth - videosPerRow * itemMargin) / videosPerRow;

    const maxWidth = 500;
    if (itemWidth > maxWidth) {
      itemWidth = maxWidth;
      itemMargin = (availableWidth - videosPerRow * itemWidth) / videosPerRow;

      itemMargin = Math.max(0, itemMargin);
    }

    itemWidth = Math.max(0, itemWidth);
    gridRenderer.style.setProperty(
      '--ytd-rich-grid-items-per-row',
      videosPerRow
    );
    gridRenderer.style.setProperty(
      '--ytd-rich-grid-item-max-width',
      `${itemWidth}px`
    );
    gridRenderer.style.setProperty(
      '--ytd-rich-grid-item-margin',
      `${itemMargin / 2}px`
    );
    gridRenderer.style.display = '';
    gridRenderer.style.flexWrap = '';
    gridRenderer.style.justifyContent = '';
  } catch (error) {
    console.error('Error in applyGridItemsPerRow:', error);
  }
}

function initializeGrid() {
  const isRelevantPage =
    window.location.pathname === '/' ||
    window.location.pathname === '/feed/subscriptions' ||
    window.location.pathname.includes('/c/') ||
    window.location.pathname.includes('/channel/') ||
    window.location.pathname.includes('/@');

  if (!isRelevantPage) return;

  const getStorageSettings = () => {
    return new Promise(resolve => {
      try {
        const defaultValue = 4;

        if (!chrome || !chrome.runtime || !chrome.storage) {
          console.warn('Chrome API not available, using default value');
          resolve(defaultValue);
          return;
        }

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
        resolve(4);
      }
    });
  };

  getStorageSettings()
    .then(videosPerRow => {
      if (!document.querySelector('ytd-rich-grid-renderer')) {
        setTimeout(() => initializeGrid(), 500);
        return;
      }

      applyGridItemsPerRow(videosPerRow);
    })
    .catch(error => {
      console.error('Error in initializeGrid promise chain:', error);

      if (!error.message?.includes('Extension context invalidated')) {
        setTimeout(() => initializeGrid(), 1000);
      }
    });
}

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

try {
  try {
    chrome.runtime.sendMessage({ action: 'keepAlive' });
  } catch (e) {
    console.log('Service worker initialization:', e);
  }

  initializeGrid();

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
    return true;
  });
} catch (error) {
  console.error('Error setting up message listener:', error);
}
