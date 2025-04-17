# YouTube Video Grid Customizer

## Overview
YouTube Video Grid Customizer is a simple Chrome extension that allows you to customize the number of videos displayed per row on the YouTube homepage, subscriptions feed, and channel pages. 

## Features
- **Adjustable Grid Size:** Choose between 3, 4, 5, or 6 videos per row.
- **Simple Interface:** Easy-to-use popup with a dropdown to select the desired number of videos per row.
- **Persistent Settings:** Your chosen setting is saved and applied across browser sessions.

## Installation (Manual - For GitHub)
Since this extension is not available on the Chrome Web Store, you need to install it manually by following these steps:

1.  **Download the Extension:**
    - Click on the "Code" button and choose "Download ZIP".
    - Extract the downloaded ZIP file to a folder on your computer. 

2.  **Open Chrome Extensions Page:**
    - In the address bar, type `chrome://extensions/` and press Enter.

3.  **Enable Developer Mode:**
    - In the top right corner of the Extensions page, toggle the "Developer mode" switch to the "ON" position.

4.  **Load the Unpacked Extension:**
    - Click the "Load unpacked" button in the top left corner of the Extensions page.
    - A file dialog will appear. Navigate to the folder where you extracted the extension files in Step 1.
    - Select the folder containing `manifest.json`, `popup.html`, `background.js`, `content.js`, `popup.css`, and the icon files (`icon16.png`, `icon48.png`, `icon128.png`, `logo.png`).
    - Click "Select Folder" (or "Open" depending on your operating system).

5.  **Extension Installed:**
    - The "YouTube Video Grid Customizer" extension should now be listed on your Chrome Extensions page. Ensure it is enabled.

## How to Use

1.  **Open the Extension Popup:**
    - Navigate to the YouTube homepage (`https://www.youtube.com/*`) or your subscriptions feed.
    - Click on the extension icon (it should appear in your Chrome toolbar, usually near the address bar). If you don't see it, click the puzzle icon (Extensions) and pin the "YouTube Video Grid Customizer" for easy access.

2.  **Select the Number of Videos per Row:**
    - Choose your desired number of videos per row (3, 4, 5, or 6) from the dropdown.

3.  **Automatic Application:**
    - The extension will automatically save your selection.
    - The changes to the video grid on the YouTube homepage or subscriptions feed should apply immediately or after a slight delay as new content loads.
    - For the changes to take effect on currently open YouTube tabs, you might need to refresh the page. You can click the "Refresh to Apply" button in the popup for the active tab.

4.  **Persistent Settings:**
    - Your chosen number of videos per row will be saved and will be applied automatically the next time you visit YouTube.

## Images

<img src="image1.png" width="60%">
<p style="margin-top: 4px; font-size: 14px; text-align: center; width: 60%;">
  <i>4 videos per row</i>
</p>

<img src="image2.png" width="60%">
<p style="margin-top: 4px; font-size: 14px; text-align: center; width: 60%;">
  <i>6 videos per row</i>
</p>

<img src="image3.png" width="60%">
<p style="margin-top: 4px; font-size: 14px; text-align: center; width: 60%;">
  <i>3 videos per row with popup open</i>
</p>

## Troubleshooting
- **Changes Not Applying:**
  - Try refreshing the YouTube page.
  - Ensure you are on a supported YouTube page (homepage, subscriptions, channel pages).
  - If you just installed the extension, close and reopen your Chrome browser.
- **Errors in Popup:** 
  - If you see any error messages in the extension popup, please report them as issues on the GitHub repository.

## Support and Contributions
This is a personal project and is provided as is. If you encounter any issues or have suggestions, please feel free to open an issue on the GitHub repository. Contributions, such as bug fixes or new features, are welcome!

## License
This project is open source. You can find the specific license details in the repository's license file. This license typically grants you the freedom to use, modify, and distribute the software, often with certain conditions regarding attribution and sharing of modifications. Please refer to the license file for the exact terms and conditions.

---

Enjoy customizing your YouTube viewing experience!
