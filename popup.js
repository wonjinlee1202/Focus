const text = document.getElementById( 'notify-text' );
const toggle = document.getElementById( 'toggle' );
const loopCheck = document.getElementById( 'loop' );
const workSlider = document.getElementById( 'workRange' );
const restSlider = document.getElementById( 'restRange' );
const workText = document.getElementById('work-text');
const restText = document.getElementById('rest-text');
const urlForm = document.getElementById('url-form');
const newUrlInput = document.getElementById('new-url');
const dropdownHeader = document.querySelector('.dropdown-header');
const dropdownContent = document.getElementById('dropdown-content');

async function startCount() {
  const item = await chrome.storage.sync.get(['status'])
  if (item.status == "work") {
    const item = await chrome.storage.sync.get(['workEnd'])
    startCountdown(item.workEnd);
    toggle.checked = true;
  }
  if (item.status == "rest") {
    const item = await chrome.storage.sync.get(['restEnd'])
    startCountdown(item.restEnd);
    toggle.checked = true;
  }
}

async function setOptions() {
  const loopitem = await chrome.storage.sync.get(['loop'])
  if (loopitem.loop == true) {
    loopCheck.checked = true;
  }
  else {
    loopCheck.checked = false;
  }

  const workslideritem = await chrome.storage.sync.get(['workLength'])
  var workMin = Math.floor(workslideritem.workLength);
  workSlider.value = (workMin / 60) * 100

  const restslideritem = await chrome.storage.sync.get(['restLength'])
  var restMin = Math.floor(restslideritem.restLength);
  restSlider.value = (restMin / 60) * 100

  const workText = document.getElementById('work-text');
  workText.textContent = `Work Time: ${workMin} min`;

  const restText = document.getElementById('rest-text');
  restText.textContent = `Rest Time: ${restMin} min`;
}

function updateCountdownTimer(endTime) {
  const countdownTimer = document.getElementById('time-left-display');
  if (countdownTimer) {
    const currentTime = new Date().getTime();
    const timeLeft = Math.max(0, endTime - currentTime);

    const minutes = Math.floor((timeLeft / 1000) / 60);
    const seconds = Math.floor((timeLeft / 1000) % 60);

    if (seconds < 10) {
      countdownTimer.textContent = `${minutes}:0${seconds}`;
    }
    else {
      countdownTimer.textContent = `${minutes}:${seconds}`;
    }
  }
}

function startCountdown(endTime) {
  updateCountdownTimer(endTime);

  const countdownInterval = setInterval(async function () {
    updateCountdownTimer(endTime);

    var curstatus = await chrome.storage.sync.get(['status'])
    if (endTime - new Date().getTime() <= 0 || curstatus.status == "off") {
      clearInterval(countdownInterval);
      document.getElementById('time-left-display').textContent = '0:00';
    }
  }, 1000);
}

async function addURLToCollection(url) {
  await chrome.storage.sync.get({ urls: [] }, async function (data) {
    const urls = data.urls;
    if (!urls.includes(url)) {
      urls.push(url);
      await chrome.storage.sync.set({ urls: urls }, function () {
        populateURLList();
      });
    }
  });
}

async function removeURLFromCollection(urlToRemove) {
  await chrome.storage.sync.get({ urls: [] }, async function (data) {
    const urls = data.urls.filter((url) => url !== urlToRemove);

    await chrome.storage.sync.set({ urls: urls }, function () {
      populateURLList();
    });
  });
}

async function populateURLList() {
  const urlList = document.getElementById('url-list');

  await chrome.storage.sync.get({ urls: [] }, function (data) {
    const urls = data.urls;

    urlList.innerHTML = '';

    urls.forEach(function (url) {
      const listItem = document.createElement('li');
      listItem.className = 'url-item';

      const urlText = document.createElement('span');
      urlText.textContent = url;
      listItem.appendChild(urlText);

      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Remove';
      deleteButton.className = 'remove-button';
      deleteButton.addEventListener('click', function () {
        removeURLFromCollection(url);
      });

      listItem.appendChild(deleteButton);
      urlList.appendChild(listItem);
    });
  });
}

startCount();
setOptions();
populateURLList();

document.addEventListener('DOMContentLoaded', function () {
  const toggle = document.getElementById('toggle');

  toggle.addEventListener('change', function (event) {
      if (event.currentTarget.checked) {
          chrome.runtime.sendMessage('toggle-on');
      }
      else {
          chrome.runtime.sendMessage('toggle-off');
      }
  });
});

chrome.runtime.onMessage.addListener( (message, sender, sendResponse) => {
  if ( message === 'turn-off' ) {
    toggle.checked = false;
    document.getElementById('time-left-display').textContent = '0:00';
  }
  else if (message != 'now-rest' && message != 'turn-off' && message != 'now-done') {
    startCountdown(message)
  }
});

dropdownHeader.addEventListener('click', function() {
  if (dropdownContent.style.display != "block") {
    dropdownContent.style.display = "block"
    document.getElementById('dropheader').textContent = '\u25BC Disabled Websites';
  }
  else {
    dropdownContent.style.display = "none";
    document.getElementById('dropheader').textContent = '\u25B6 Disabled Websites';
  }
});

loop.addEventListener('click', async function() {
  const item = await chrome.storage.sync.get(['loop'])
  if (loopCheck.checked == true) {
    await chrome.storage.sync.set({loop: true})
  }
  else {
    await chrome.storage.sync.set({loop: false})
  }
});

workSlider.addEventListener('change', async function() {
  var newMin = Math.floor((workSlider.value / 100) * 60)
  await chrome.storage.sync.set({workLength: newMin})
  workText.textContent = `Work Time: ${newMin} min`;
})

restSlider.addEventListener('change', async function() {
  var newMin = Math.floor((restSlider.value / 100) * 60)
  await chrome.storage.sync.set({restLength: newMin})
  restText.textContent = `Rest Time: ${newMin} min`;
})

urlForm.addEventListener('submit', function (event) {
  event.preventDefault();

  const newUrl = newUrlInput.value.trim();

  if (newUrl) {
    addURLToCollection(newUrl);
    newUrlInput.value = '';
  }
});