function blockSite() {
    const messageElement = document.createElement('div');
    messageElement.textContent = 'Disabled site';
    messageElement.style.fontSize = '24px';
    messageElement.style.textAlign = 'center';
    messageElement.style.marginTop = '50px';
  
    document.documentElement.innerHTML = '';
    document.body.appendChild(messageElement);
}

async function checkSites() {
    const item = await chrome.storage.sync.get(['status'])
    await chrome.storage.sync.get({ urls: [] }, async function (data) {
        if (item.status == "work") {
            let currentURL = location.href;
            if (data.urls.some(url => currentURL.includes(url))) {
                blockSite();
            }
        }
    })
}

checkSites()