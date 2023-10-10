const button = document.getElementById( 'notify-button' );

chrome.windows.getCurrent(async function (currentWindow) {  
    await chrome.storage.sync.set({restWindow: currentWindow.id})
  });

button.addEventListener( 'click', function () {
    chrome.runtime.sendMessage( 'now-done' );
    chrome.windows.getCurrent(async function (currentWindow) {
      chrome.windows.remove(currentWindow.id);
    });
});