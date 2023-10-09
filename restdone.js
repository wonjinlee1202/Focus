const button = document.getElementById( 'notify-button' );

chrome.windows.getCurrent(async function (currentWindow) {  
    await chrome.storage.sync.set({restWindow: currentWindow.id})
  });

button.addEventListener( 'click', () => {
    chrome.runtime.sendMessage( 'now-done' );
    chrome.windows.getCurrent(async function (currentWindow) {    
        // Close the current window by its ID
        chrome.windows.remove(currentWindow.id);
      });
});