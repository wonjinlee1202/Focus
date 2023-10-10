async function setAlarm() {
    const statusitem = await chrome.storage.sync.get(['status']);
    if (statusitem.status == "work") {
        const workLengthitem = await chrome.storage.sync.get(['workLength']);
        chrome.alarms.create({delayInMinutes: workLengthitem.workLength});
        var end = new Date().getTime() + workLengthitem.workLength * 60000
        await chrome.storage.sync.set({workEnd: end})
        chrome.runtime.sendMessage(end);
    }
    else {
        const restLengthitem = await chrome.storage.sync.get(['restLength']);
        chrome.alarms.create({delayInMinutes: restLengthitem.restLength});
        var end = new Date().getTime() + restLengthitem.restLength * 60000
        await chrome.storage.sync.set({restEnd: end})
        chrome.runtime.sendMessage(end);
    }
}

chrome.runtime.onInstalled.addListener(async function () {
    await chrome.storage.sync.set({workLength: 25});
    await chrome.storage.sync.set({restLength: 5});
    await chrome.storage.sync.set({status: "off"});
    await chrome.storage.sync.set({loop: false});

    chrome.system.display.getInfo(async function (displayInfo) {
        const primaryDisplay = displayInfo[0];
        const screenWidth = primaryDisplay.bounds.width;
        const screenHeight = primaryDisplay.bounds.height;
        await chrome.storage.sync.set({width: screenWidth});
        await chrome.storage.sync.set({height: screenHeight});
    });
});

chrome.runtime.onMessage.addListener(async function (message, sender, sendResponse) {
    if ( message === 'toggle-on' ) {
        await chrome.storage.sync.set({status: "work"});
        setAlarm()
    }
    else if ( message === 'toggle-off' ) {
        await chrome.storage.sync.set({status: "off"});
        chrome.alarms.clearAll()
    }
    else if ( message === 'now-rest' ) {
        await chrome.storage.sync.set({status: "rest"})
        setAlarm()
    }
    else if ( message === 'now-done' ) {
        const loopitem = await chrome.storage.sync.get(['loop'])
        if (loopitem.loop == true) {
            await chrome.storage.sync.set({status: "work"})
            setAlarm()
        }
        else {
            await chrome.storage.sync.set({status: "off"})
            chrome.runtime.sendMessage('turn-off');
        }
    }
    else {
        chrome.windows.remove(message);
    }
});

chrome.alarms.onAlarm.addListener(async function () {
    const statusitem = await chrome.storage.sync.get(['status']);
    const width = await chrome.storage.sync.get(['width'])
    const height = await chrome.storage.sync.get(['height'])
    if (statusitem.status == "work") {
        chrome.windows.create({
            height: height.height/2,
            width: width.width/2,
            left: width.width/4,
            top: height.height/4,
            url: chrome.runtime.getURL("workdone.html"),
            type: "popup",
        });
    }
    else {
        chrome.windows.create({
            height: height.height/2,
            width: width.width/2,
            left: width.width/4,
            top: height.height/4,
            url: chrome.runtime.getURL("restdone.html"),
            type: "popup",
        });
    }
});

chrome.webNavigation.onCompleted.addListener(async function(details) {
    chrome.tabs.query({
        "currentWindow": true,
        "active": true,
    }, tabs => {
        let currentURL = tabs[0].url;
        if (!currentURL.startsWith("chrome://")) {
            chrome.scripting.executeScript( {
                    target: {tabId: tabs[0].id, allFrames: true},
                    files: ["content.js"]
            })
        }
    })
})

chrome.windows.onRemoved.addListener(async function (window) {
    const workID = await chrome.storage.sync.get(['workWindow']);
    const restID = await chrome.storage.sync.get(['restWindow']);
    if (window == workID.workWindow) {
        await chrome.storage.sync.set({status: "rest"})
        setAlarm()
    }
    if (window == restID.restWindow) {
        const loopitem = await chrome.storage.sync.get(['loop'])
        if (loopitem.loop == true) {
            await chrome.storage.sync.set({status: "work"})
            setAlarm()
        }
        else {
            await chrome.storage.sync.set({status: "off"})
            chrome.runtime.sendMessage('turn-off');
        }
    }
})