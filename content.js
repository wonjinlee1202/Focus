// Function to block the site content and display a message
function blockSite() {
    // Create a message element to display on the page
    const messageElement = document.createElement('div');
    messageElement.textContent = 'Disabled site';
    messageElement.style.fontSize = '24px';
    messageElement.style.textAlign = 'center';
    messageElement.style.marginTop = '50px';
  
    // Replace the page content with the message
    document.documentElement.innerHTML = '';
    document.body.appendChild(messageElement);
  }
  
// List of URLs to disable

async function checkSites() {
    const item = await chrome.storage.sync.get(['status'])
    await chrome.storage.sync.get({ urls: [] }, async function (data) {
        // Get the current URL
        if (item.status == "work") {
            let currentURL = location.href;
            if (data.urls.some(url => currentURL.includes(url))) {
                blockSite();
            }
        }
    })
}

checkSites()