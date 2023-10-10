const button = document.getElementById( 'notify-button' );

chrome.windows.getCurrent(async function (currentWindow) {  
    await chrome.storage.sync.set({workWindow: currentWindow.id})
  });

button.addEventListener( 'click', function () {
    chrome.runtime.sendMessage( 'now-rest' );
    chrome.windows.getCurrent(async function (currentWindow) {  
      chrome.windows.remove(currentWindow.id);
    });
});