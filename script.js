// Store colleagues in localStorage
let colleagues = JSON.parse(localStorage.getItem('colleagues') || '[]');
let dstRules = null;

// Load DST rules
async function loadDSTRules() {
    try {
        const response = await fetch('dst_rules.json');
        dstRules = await response.json();
    } catch (error) {
        console.error('Error loading DST rules:', error);
    }
}

// Check if DST is active for a timezone
function isDSTActive(timezone) {
    if (!dstRules) return false;
    
    const region = dstRules.timezone_to_region[timezone];
    if (!region) return false;
    
    const rules = dstRules.regions[region];
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // JavaScript months are 0-based
    
    // Check if the city is in the exceptions list
    if (rules.exceptions && rules.exceptions.includes(timezone)) {
        return false;
    }
    
    const startMonth = rules.start.month;
    const endMonth = rules.end.month;
    
    // Southern hemisphere (e.g., Australia)
    if (startMonth > endMonth) {
        return currentMonth >= startMonth || currentMonth <= endMonth;
    }
    // Northern hemisphere
    else {
        return currentMonth >= startMonth && currentMonth <= endMonth;
    }
}

// Calculate time for a specific timezone offset with DST
function getTimeInTimezone(offset, timezone) {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    
    // Apply DST if active
    let finalOffset = offset;
    if (isDSTActive(timezone)) {
        finalOffset += 1; // Add one hour for DST
    }
    
    return new Date(utc + (3600000 * finalOffset));
}

// Format time for display
function formatTime(date) {
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
}

// Update local time
function updateLocalTime() {
    const localTimeElement = document.getElementById('local-time');
    if (!localTimeElement) return;
    
    const now = new Date();
    localTimeElement.textContent = formatTime(now);
}

// Update all colleague times
function updateColleagueTimes() {
    const grid = document.getElementById('colleagues-grid');
    if (!grid) return;
    
    grid.innerHTML = '';

    colleagues.forEach((colleague, index) => {
        const time = getTimeInTimezone(colleague.offset, colleague.timezone);
        const dstActive = isDSTActive(colleague.timezone);
        
        const card = document.createElement('div');
        card.className = 'colleague-card';
        card.innerHTML = `
            <div class="colleague-info">
                <h3>${colleague.name}</h3>
                <span class="colleague-time">${formatTime(time)}</span>
                <span class="colleague-location">${colleague.emoji} ${colleague.city}, ${colleague.country}</span>
                ${dstActive ? '<span class="dst-badge">DST</span>' : ''}
            </div>
            <button class="remove-btn" onclick="removeColleague(${index})">×</button>
        `;
        grid.appendChild(card);
    });
}

// Initialize location select
async function initializeLocationSelect() {
    const select = document.getElementById('colleague-location');
    if (!select) return;
    
    try {
        const response = await fetch('timezones.json');
        const timezones = await response.json();
        
        // First option as placeholder
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Select location';
        placeholder.selected = true;
        placeholder.disabled = true;
        select.appendChild(placeholder);
        
        timezones.forEach(location => {
            const option = document.createElement('option');
            option.value = JSON.stringify(location);
            option.textContent = `${location.emoji} ${location.city}, ${location.country}`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading locations:', error);
        select.innerHTML = '<option value="">Error loading locations</option>';
    }
}

// Add new colleague
function addColleague(event) {
    event.preventDefault();
    
    const nameInput = document.getElementById('colleague-name');
    const locationSelect = document.getElementById('colleague-location');
    
    if (!nameInput || !locationSelect) return;
    
    const name = nameInput.value.trim();
    
    try {
        const locationData = JSON.parse(locationSelect.value);
        
        if (!name || !locationData) {
            alert('Please enter both name and location');
            return;
        }
        
        colleagues.push({
            name,
            ...locationData
        });
        
        // Save to localStorage
        localStorage.setItem('colleagues', JSON.stringify(colleagues));
        
        // Update display
        updateColleagueTimes();
        
        // Clear form
        nameInput.value = '';
        locationSelect.value = '';
        
    } catch (error) {
        console.error('Error adding colleague:', error);
        alert('Please select a valid location');
    }
}

// Remove colleague
function removeColleague(index) {
    colleagues.splice(index, 1);
    localStorage.setItem('colleagues', JSON.stringify(colleagues));
    updateColleagueTimes();
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Load DST rules first
    await loadDSTRules();
    
    // Initialize the location select
    initializeLocationSelect();
    
    // Update times immediately
    updateLocalTime();
    updateColleagueTimes();
    
    // Update times every second
    setInterval(() => {
        updateLocalTime();
        updateColleagueTimes();
    }, 1000);
    
    // Set up form submission
    const form = document.getElementById('add-colleague-form');
    if (form) {
        form.addEventListener('submit', addColleague);
    }
});
