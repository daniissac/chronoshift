let clockElements = {
    display: document.getElementById('digital-display')
};

let timeControls = {
    currentTimeBtn: document.getElementById('use-current-time'),
    customTimeBtn: document.getElementById('use-custom-time')
};

let timezoneControls = {
    fromSelect: document.getElementById('timezone-from'),
    toSelect: document.getElementById('timezone-to'),
    swapBtn: document.getElementById('swap-timezones'),
    result: document.getElementById('result')
};

let clockInterval = null;

// Load and populate timezone dropdowns
async function loadTimezones() {
    try {
        const response = await fetch('timezones.json');
        const timezones = await response.json();
        populateTimezoneDropdowns(timezones);
        updateConversion();
    } catch (error) {
        console.error('Error loading timezones:', error);
    }
}

function populateTimezoneDropdowns(timezones) {
    // Clear existing options first
    timezoneControls.fromSelect.innerHTML = '';
    timezoneControls.toSelect.innerHTML = '';
    
    timezones.forEach(timezone => {
        const fromOption = new Option(timezone.text, timezone.abbr);
        const toOption = new Option(timezone.text, timezone.abbr);
        timezoneControls.fromSelect.add(fromOption);
        timezoneControls.toSelect.add(toOption);
    });
}

async function updateConversion() {
    try {
        const response = await fetch('timezones.json');
        const timezones = await response.json();
        
        const fromTimezone = timezones.find(tz => tz.abbr === timezoneControls.fromSelect.value);
        const toTimezone = timezones.find(tz => tz.abbr === timezoneControls.toSelect.value);
        
        if (!fromTimezone || !toTimezone) return;

        const currentTime = clockElements.display.contentEditable === 'true' 
            ? parseCustomTime(clockElements.display.textContent)
            : new Date();

        const utc = currentTime.getTime() + (currentTime.getTimezoneOffset() * 60000);
        const convertedTime = new Date(utc + (3600000 * toTimezone.offset));
        
        timezoneControls.result.innerHTML = `
            <div class="converted-time">
                <h3>${timezoneControls.toSelect.options[timezoneControls.toSelect.selectedIndex].text}</h3>
                <div class="time">${convertedTime.toLocaleTimeString()}</div>
            </div>
        `;
    } catch (error) {
        console.error('Error updating conversion:', error);
    }
}

function parseCustomTime(timeStr) {
    const [hours, minutes, seconds] = timeStr.split(':').map(num => parseInt(num));
    const date = new Date();
    date.setHours(hours || 0);
    date.setMinutes(minutes || 0);
    date.setSeconds(seconds || 0);
    return date;
}

// Make display editable when in custom mode
function makeClockEditable(editable) {
    clockElements.display.contentEditable = editable;
}

// Handle time input validation
function handleTimeInput(element) {
    element.addEventListener('blur', () => {
        let timeStr = element.textContent;
        let [hours, minutes, seconds] = timeStr.split(':').map(num => parseInt(num));
        
        // Validate hours, minutes, and seconds
        hours = isNaN(hours) || hours < 0 || hours > 23 ? 0 : hours;
        minutes = isNaN(minutes) || minutes < 0 || minutes > 59 ? 0 : minutes;
        seconds = isNaN(seconds) || seconds < 0 || seconds > 59 ? 0 : seconds;
        
        // Format and update display
        element.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        updateConversion();
    });

    element.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            element.blur();
        }
    });
}

// Setup event listeners
timeControls.currentTimeBtn.addEventListener('click', function() {
    timeControls.currentTimeBtn.classList.add('active');
    timeControls.customTimeBtn.classList.remove('active');
    makeClockEditable(false);
    startClock();
});

timeControls.customTimeBtn.addEventListener('click', function() {
    timeControls.customTimeBtn.classList.add('active');
    timeControls.currentTimeBtn.classList.remove('active');
    makeClockEditable(true);
    clearInterval(clockInterval);
});

// Add timezone control listeners
timezoneControls.swapBtn.addEventListener('click', () => {
    const tempValue = timezoneControls.fromSelect.value;
    timezoneControls.fromSelect.value = timezoneControls.toSelect.value;
    timezoneControls.toSelect.value = tempValue;
    updateConversion();
});

timezoneControls.fromSelect.addEventListener('change', updateConversion);
timezoneControls.toSelect.addEventListener('change', updateConversion);

// Add input handling to clock display
handleTimeInput(clockElements.display);

function startClock() {
    if (clockInterval) {
        clearInterval(clockInterval);
    }
    updateClock();
    clockInterval = setInterval(updateClock, 1000);
}

function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    clockElements.display.textContent = timeString;
    updateConversion();
}

// Initialize the clock and load timezones
startClock();
loadTimezones();
