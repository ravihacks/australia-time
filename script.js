const statesData = [
    { id: "syd", name: "New South Wales", capital: "Sydney", timeZone: "Australia/Sydney" },
    { id: "mel", name: "Victoria", capital: "Melbourne", timeZone: "Australia/Melbourne" },
    { id: "bne", name: "Queensland", capital: "Brisbane", timeZone: "Australia/Brisbane" },
    { id: "per", name: "Western Australia", capital: "Perth", timeZone: "Australia/Perth" },
    { id: "adl", name: "South Australia", capital: "Adelaide", timeZone: "Australia/Adelaide" },
    { id: "hba", name: "Tasmania", capital: "Hobart", timeZone: "Australia/Hobart" },
    { id: "cbr", name: "ACT", capital: "Canberra", timeZone: "Australia/Sydney" },
    { id: "drw", name: "Northern Territory", capital: "Darwin", timeZone: "Australia/Darwin" }
];

const tabLive = document.getElementById('tab-live');
const tabConvert = document.getElementById('tab-convert');
const viewLive = document.getElementById('view-live');
const viewConvert = document.getElementById('view-convert');
const headerTitle = document.getElementById('header-title');

const clockList = document.getElementById('clock-list');
const convertList = document.getElementById('convert-list');
const convertSource = document.getElementById('convert-source');

let liveInterval;
let selectedHour = "12";
let selectedMinute = "00";
let selectedAmpm = "AM";

// Tab Switching
tabLive.addEventListener('change', () => {
    if (tabLive.checked) {
        viewLive.classList.add('active');
        viewConvert.classList.remove('active');
        headerTitle.textContent = "Australia State Wise";
        startLiveClocks();
    }
});

tabConvert.addEventListener('change', () => {
    if (tabConvert.checked) {
        viewConvert.classList.add('active');
        viewLive.classList.remove('active');
        headerTitle.textContent = "Time Converter";
        stopLiveClocks();
        updateConverter();
    }
});

function getLiveOffsetString(date, tz) {
    const sysTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    const opts = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    opts.timeZone = sysTz;
    const sysStr = date.toLocaleString('en-US', opts);
    
    opts.timeZone = tz;
    const tgtStr = date.toLocaleString('en-US', opts);
    
    const diffMs = new Date(tgtStr).getTime() - new Date(sysStr).getTime();
    const diffHours = diffMs / 3600000;
    
    const sysDay = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: sysTz, day: 'numeric' }).format(date), 10);
    const tgtDay = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: tz, day: 'numeric' }).format(date), 10);
    
    let dayStr = "Today";
    if (tgtDay > sysDay || (tgtDay === 1 && sysDay >= 28)) dayStr = "Tomorrow";
    else if (tgtDay < sysDay || (tgtDay >= 28 && sysDay === 1)) dayStr = "Yesterday";

    let hourStr = '';
    if (diffHours === 0) {
        hourStr = "0HRS";
    } else if (diffHours > 0) {
        hourStr = "+" + diffHours + "HRS";
    } else {
        hourStr = diffHours + "HRS";
    }

    return `${dayStr}, ${hourStr}`;
}

function createClockNode(state, dateObj, dayOffsetString) {
    let timeStr = "";
    if (state.timeZone) {
        timeStr = dateObj.toLocaleTimeString('en-US', {
            timeZone: state.timeZone,
            hour12: true,
            hour: 'numeric',
            minute: '2-digit'
        });
    } else {
        timeStr = dateObj.toLocaleTimeString('en-US', {
            hour12: true,
            hour: 'numeric',
            minute: '2-digit'
        });
    }

    const timeMatch = timeStr.match(/^(\d{1,2}:\d{2})\s*(AM|PM)?/i);
    const timeOnly = timeMatch ? timeMatch[1] : timeStr;
    const ampmStr = timeMatch && timeMatch[2] ? timeMatch[2] : '';

    const li = document.createElement('li');
    li.className = 'clock-item';

    const left = document.createElement('div');
    left.className = 'clock-left';
    
    const offset = document.createElement('div');
    offset.className = 'clock-offset';
    offset.textContent = dayOffsetString;
    
    const city = document.createElement('div');
    city.className = 'clock-city';
    city.textContent = state.capital;
    
    const stateDiv = document.createElement('div');
    stateDiv.className = 'clock-state';
    stateDiv.textContent = state.name;

    left.appendChild(offset);
    left.appendChild(city);
    left.appendChild(stateDiv);

    const right = document.createElement('div');
    right.className = 'clock-right';
    
    const timeDiv = document.createElement('div');
    timeDiv.className = 'clock-time';
    timeDiv.textContent = timeOnly;
    
    const ampmDiv = document.createElement('div');
    ampmDiv.className = 'clock-ampm';
    ampmDiv.textContent = ampmStr;

    right.appendChild(timeDiv);
    right.appendChild(ampmDiv);

    li.appendChild(left);
    li.appendChild(right);

    return li;
}

function renderLiveClocks() {
    const now = new Date();
    clockList.replaceChildren(); // Safely clear DOM
    
    statesData.forEach(state => {
        const offsetString = getLiveOffsetString(now, state.timeZone);
        const node = createClockNode(state, now, offsetString);
        clockList.appendChild(node);
    });
}

function startLiveClocks() {
    renderLiveClocks();
    liveInterval = setInterval(renderLiveClocks, 1000);
}

function stopLiveClocks() {
    clearInterval(liveInterval);
}

// OS Picker Generating Functions
function createPickerItems(container, min, max, padZero) {
    container.replaceChildren(); // Safely clear nodes
    
    let topSpacer = document.createElement('div');
    topSpacer.className = 'picker-spacer';
    container.appendChild(topSpacer);

    for (let i = min; i <= max; i++) {
        const val = padZero ? String(i).padStart(2, '0') : String(i);
        let item = document.createElement('div');
        item.className = 'picker-item';
        item.dataset.val = val;
        item.textContent = val;
        container.appendChild(item);
    }
    
    let botSpacer = document.createElement('div');
    botSpacer.className = 'picker-spacer';
    container.appendChild(botSpacer);
}

function setupPickerColumn(colId, updateValueCb) {
    const col = document.getElementById(colId);
    let scrollTimeout;
    
    function onScroll() {
        const itemHeight = 38;
        const centerIndex = Math.round(col.scrollTop / itemHeight);
        const items = col.querySelectorAll('.picker-item');
        
        items.forEach((item, idx) => {
            if (idx === centerIndex) {
                 item.classList.add('selected');
                 updateValueCb(item.dataset.val);
            } else {
                 item.classList.remove('selected');
            }
        });
        
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            if (document.getElementById('convert-source').value) {
                updateConverter();
            }
        }, 150);
    }
    
    col.addEventListener('scroll', onScroll);
    
    // Smooth snapping on click
    const items = col.querySelectorAll('.picker-item');
    items.forEach((item, idx) => {
        item.addEventListener('click', () => {
            col.scrollTo({ top: idx * 38, behavior: 'smooth' });
        });
    });
}

// Converter logic
function setupConverter() {
    statesData.forEach(state => {
        const option = document.createElement('option');
        option.value = state.id;
        option.textContent = `${state.capital}, ${state.name}`;
        convertSource.appendChild(option);
    });

    createPickerItems(document.getElementById('picker-hour'), 1, 12, false);
    createPickerItems(document.getElementById('picker-minute'), 0, 59, true);

    setupPickerColumn('picker-hour', (val) => selectedHour = val);
    setupPickerColumn('picker-minute', (val) => selectedMinute = val);
    setupPickerColumn('picker-ampm', (val) => selectedAmpm = val);

    convertSource.addEventListener('change', updateConverter);

    // Initial time load
    const now = new Date();
    let hh = now.getHours();
    let mm = now.getMinutes();
    let ampm = hh >= 12 ? 'PM' : 'AM';
    hh = hh % 12;
    if (hh === 0) hh = 12;

    function setPickerValue(colId, valueIndex) {
        const col = document.getElementById(colId);
        col.scrollTo({ top: valueIndex * 38 });
        col.dispatchEvent(new Event('scroll'));
    }

    setTimeout(() => {
        setPickerValue('picker-hour', hh - 1);
        setPickerValue('picker-minute', mm);
        setPickerValue('picker-ampm', ampm === 'AM' ? 0 : 1);
    }, 10);
}

function updateConverter() {
    const sourceId = convertSource.value;
    const sourceState = statesData.find(s => s.id === sourceId);
    if (!sourceState) return;
    if (!selectedHour || !selectedMinute || !selectedAmpm) return;

    let hour24 = parseInt(selectedHour, 10);
    if (selectedAmpm === 'PM' && hour24 !== 12) hour24 += 12;
    if (selectedAmpm === 'AM' && hour24 === 12) hour24 = 0;

    const sourceMin = parseInt(selectedMinute, 10);

    const now = new Date();
    const baseDate = new Date();
    baseDate.setHours(hour24, sourceMin, 0, 0);

    const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };

    options.timeZone = sourceState.timeZone;
    const sourceLocDate = new Date(now.toLocaleString('en-US', options));

    // Use fragment for batched UI performance securely
    const fragment = document.createDocumentFragment();
    
    statesData.forEach(state => {
        if (state.id === sourceId) {
             const node = createClockNode({ ...state, timeZone: null }, baseDate, "Source Time");
             fragment.appendChild(node);
             return;
        }

        options.timeZone = state.timeZone;
        const targetLocDate = new Date(now.toLocaleString('en-US', options));
        const diffMs = targetLocDate.getTime() - sourceLocDate.getTime();
        const diffHours = diffMs / 3600000;

        const targetTimeDate = new Date(baseDate.getTime() + diffMs);
        
        let dayDiffStr = "Same Day";
        const dayDiff = targetTimeDate.getDate() - baseDate.getDate();
        if (dayDiff === 1 || dayDiff < -20) dayDiffStr = "Next Day";
        else if (dayDiff === -1 || dayDiff > 20) dayDiffStr = "Previous Day";
        
        let hourStr = '';
        if (diffHours > 0) hourStr = `+${diffHours}HRS`;
        else if (diffHours < 0) hourStr = `${diffHours}HRS`;
        else hourStr = "0HRS";

        const node = createClockNode({ ...state, timeZone: null }, targetTimeDate, `${dayDiffStr}, ${hourStr}`);
        fragment.appendChild(node);
    });

    convertList.replaceChildren(fragment); // Secure DOM injection
}

// Init
function start() {
    setupConverter();
    if (tabLive.checked) startLiveClocks();
    else updateConverter();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
} else {
    start();
}
