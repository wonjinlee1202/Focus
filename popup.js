const text = document.getElementById( 'notify-text' );
const toggle = document.getElementById( 'toggle' );
const loopCheck = document.getElementById( 'loop' );
const workSlider = document.getElementById( 'workRange' );
const restSlider = document.getElementById( 'restRange' );
const workText = document.getElementById('work-text');
const restText = document.getElementById('rest-text');
const urlForm = document.getElementById('url-form');
const newUrlInput = document.getElementById('new-url');

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

startCount();
setOptions();
populateURLList();

// notify.addEventListener( 'click', () => {
//   chrome.runtime.sendMessage( '', {
//     type: 'notification',
//     message: text.value
//   });
// } );


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

// Function to update the countdown timer
function updateCountdownTimer(endTime) {
  const countdownTimer = document.getElementById('time-left-display');
  if (countdownTimer) {
    // Calculate the time remaining
    const currentTime = new Date().getTime();
    const timeLeft = Math.max(0, endTime - currentTime); // Ensure the timer doesn't go negative

    // Calculate minutes and seconds
    const minutes = Math.floor((timeLeft / 1000) / 60);
    const seconds = Math.floor((timeLeft / 1000) % 60);

    // Update the countdown timer element
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

  // Update the countdown timer every second
  const countdownInterval = setInterval(async function () {
    updateCountdownTimer(endTime);

    // Check if the countdown has reached zero
    var curstatus = await chrome.storage.sync.get(['status'])
    if (endTime - new Date().getTime() <= 0 || curstatus.status == "off") {
      clearInterval(countdownInterval); // Stop the interval when the countdown ends
      document.getElementById('time-left-display').textContent = '0:00';
    }
  }, 1000);
}

const dropdownHeader = document.querySelector('.dropdown-header');
  const dropdownContent = document.getElementById('dropdown-content');

  // Toggle the "show" class on click
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

// Function to add a URL to the collection
async function addURLToCollection(url) {
  await chrome.storage.sync.get({ urls: [] }, async function (data) {
    const urls = data.urls;
    if (!urls.includes(url)) {
      urls.push(url);

      // const manifest = chrome.runtime.getManifest();

      // // Modify the manifest's content_scripts section
      // manifest.content_scripts[0].matches = urls;

      // // Update the extension
      // chrome.management.setEnabled(manifest.id, false, function () {
      //   chrome.management.setEnabled(manifest.id, true);
      // });

      await chrome.storage.sync.set({ urls: urls }, function () {
        populateURLList(); // Refresh the URL list after adding
      });
    }
  });
}

// Function to remove a URL from the collection
async function removeURLFromCollection(urlToRemove) {
  await chrome.storage.sync.get({ urls: [] }, async function (data) {
    const urls = data.urls.filter((url) => url !== urlToRemove);

    await chrome.storage.sync.set({ urls: urls }, function () {
      populateURLList(); // Refresh the URL list after removing
    });
  });
}

// Function to populate the URL list
async function populateURLList() {
  const urlList = document.getElementById('url-list');

  // Get the list of URLs from chrome.storage
  await chrome.storage.sync.get({ urls: [] }, function (data) {
    const urls = data.urls;

    // Clear the existing list
    urlList.innerHTML = '';

    // Iterate through the URLs and add them to the list with delete buttons
    urls.forEach(function (url) {
      const listItem = document.createElement('li');
      listItem.className = 'url-item'; // Add the "url-item" class

      const urlText = document.createElement('span');
      urlText.textContent = url;
      listItem.appendChild(urlText);

      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Remove';
      deleteButton.className = 'remove-button';
      deleteButton.addEventListener('click', function () {
        removeURLFromCollection(url); // Remove the URL when the button is clicked
      });

      listItem.appendChild(deleteButton);
      urlList.appendChild(listItem);
    });
  });
}


urlForm.addEventListener('submit', function (event) {
  event.preventDefault(); // Prevent the form from submitting as a traditional HTML form

  const newUrl = newUrlInput.value.trim();

  if (newUrl) {
    addURLToCollection(newUrl);
    newUrlInput.value = ''; // Clear the input field
  }
});