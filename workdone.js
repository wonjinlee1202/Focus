const button = document.getElementById( 'notify-button' );

chrome.windows.getCurrent(async function (currentWindow) {  
    await chrome.storage.sync.set({workWindow: currentWindow.id})
  });

button.addEventListener( 'click', () => {
    chrome.runtime.sendMessage( 'now-rest' );
    chrome.windows.getCurrent(async function (currentWindow) {    
        // Close the current window by its ID
        chrome.windows.remove(currentWindow.id);
      });
});