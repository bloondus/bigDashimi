// ===== bigDashimi - Dashboard =====

// ----- Standards -----
const DEFAULT_STATIONS = [
    { name: 'Spital Zollikerberg', query: 'Zollikerberg, Spital' },
    { name: 'Einfangstrasse', query: 'Zürich, Einfangstrasse' },
    { name: 'Schumacherweg', query: 'Zürich, Schumacherweg' },
];

const DEFAULT_WEATHER_LOCATIONS = [
    { city: 'Zürich', lat: 47.3769, lon: 8.5417 },
];

// ----- Konfiguration -----
const CONFIG = {
    // Wetter-Standorte – aus localStorage
    weatherLocations: loadWeatherLocations(),

    // ÖV Stationen – aus localStorage
    oevStations: loadStations(),
    oevLimit: 6,

    // Update-Intervalle
    clockInterval: 1000,
    weatherInterval: 5 * 60 * 1000,
    oevInterval: 30 * 1000,
};

// ----- localStorage: Stationen -----
function loadStations() {
    try {
        const saved = localStorage.getItem('bigdashimi-stations');
        if (saved) return JSON.parse(saved);
    } catch (e) { console.warn('Stations laden fehlgeschlagen', e); }
    return DEFAULT_STATIONS.map(s => ({...s}));
}

function saveStations() {
    localStorage.setItem('bigdashimi-stations', JSON.stringify(CONFIG.oevStations));
}

// ----- localStorage: Wetter-Standorte -----
function loadWeatherLocations() {
    try {
        const saved = localStorage.getItem('bigdashimi-weather-locations');
        if (saved) return JSON.parse(saved);
    } catch (e) { console.warn('Wetter-Standorte laden fehlgeschlagen', e); }
    return DEFAULT_WEATHER_LOCATIONS.map(w => ({...w}));
}

function saveWeatherLocations() {
    localStorage.setItem('bigdashimi-weather-locations', JSON.stringify(CONFIG.weatherLocations));
}

// ----- Settings Panel -----
let activeTab = 'stations';

function openSettings() {
    document.getElementById('settings-overlay').classList.add('active');
    switchTab(activeTab);
}

function closeSettings() {
    document.getElementById('settings-overlay').classList.remove('active');
}

function switchTab(tab) {
    activeTab = tab;
    document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.settings-tab[data-tab="${tab}"]`).classList.add('active');
    document.getElementById('tab-stations').style.display = tab === 'stations' ? 'block' : 'none';
    document.getElementById('tab-weather').style.display = tab === 'weather' ? 'block' : 'none';
    if (tab === 'stations') renderStationList();
    if (tab === 'weather') renderWeatherLocationList();
}

// -- Stationen Tab --
function renderStationList() {
    const list = document.getElementById('station-list');
    if (CONFIG.oevStations.length === 0) {
        list.innerHTML = '<div class="loading">Keine Stationen konfiguriert</div>';
        return;
    }
    list.innerHTML = CONFIG.oevStations.map((s, i) => `
        <div class="settings-station-item">
            <div class="settings-station-info">
                <span class="settings-station-name">🚏 ${s.name}</span>
                <span class="settings-station-query">${s.query}</span>
            </div>
            <div class="settings-station-actions">
                <button class="btn-move" onclick="moveStation(${i}, -1)" ${i === 0 ? 'disabled' : ''} title="Nach oben">▲</button>
                <button class="btn-move" onclick="moveStation(${i}, 1)" ${i === CONFIG.oevStations.length - 1 ? 'disabled' : ''} title="Nach unten">▼</button>
                <button class="btn-delete" onclick="removeStation(${i})" title="Entfernen">✕</button>
            </div>
        </div>
    `).join('');
    updateStationCount();
}

function addStation() {
    const input = document.getElementById('new-station-input');
    const val = input.value.trim();
    if (!val) return;
    CONFIG.oevStations.push({ name: val, query: val });
    saveStations();
    input.value = '';
    renderStationList();
}

function removeStation(index) {
    CONFIG.oevStations.splice(index, 1);
    saveStations();
    renderStationList();
}

function moveStation(index, direction) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= CONFIG.oevStations.length) return;
    const temp = CONFIG.oevStations[index];
    CONFIG.oevStations[index] = CONFIG.oevStations[newIndex];
    CONFIG.oevStations[newIndex] = temp;
    saveStations();
    renderStationList();
}

function resetStations() {
    CONFIG.oevStations.length = 0;
    DEFAULT_STATIONS.forEach(s => CONFIG.oevStations.push({...s}));
    saveStations();
    renderStationList();
}

function updateStationCount() {
    const countEl = document.getElementById('station-count');
    if (countEl) countEl.textContent = `${CONFIG.oevStations.length} Haltestelle${CONFIG.oevStations.length !== 1 ? 'n' : ''}`;
}

// -- Wetter Tab (Multi-Standorte) --
function renderWeatherLocationList() {
    const container = document.getElementById('weather-settings-content');

    const locationItems = CONFIG.weatherLocations.length === 0
        ? '<div class="loading">Keine Wetter-Standorte konfiguriert</div>'
        : CONFIG.weatherLocations.map((w, i) => `
            <div class="settings-station-item">
                <div class="settings-station-info">
                    <span class="settings-station-name">🏙 ${w.city}</span>
                    <span class="settings-station-query">${w.lat.toFixed(4)}, ${w.lon.toFixed(4)}</span>
                </div>
                <div class="settings-station-actions">
                    <button class="btn-move" onclick="moveWeatherLocation(${i}, -1)" ${i === 0 ? 'disabled' : ''} title="Nach oben">▲</button>
                    <button class="btn-move" onclick="moveWeatherLocation(${i}, 1)" ${i === CONFIG.weatherLocations.length - 1 ? 'disabled' : ''} title="Nach unten">▼</button>
                    <button class="btn-delete" onclick="removeWeatherLocation(${i})" title="Entfernen">✕</button>
                </div>
            </div>
        `).join('');

    container.innerHTML = `
        <div class="settings-add">
            <input type="text" id="weather-city-input" placeholder="Stadt suchen (z.B. Bern, Basel, Wien...)" onkeydown="if(event.key==='Enter') searchWeatherCity()">
            <button class="btn-add" onclick="searchWeatherCity()">🔍 Suchen</button>
        </div>
        <div id="weather-search-results"></div>
        <div class="settings-section-title">📍 Aktive Standorte (${CONFIG.weatherLocations.length})</div>
        <div class="settings-station-list">${locationItems}</div>
    `;
    updateWeatherCount();
}

async function searchWeatherCity() {
    const input = document.getElementById('weather-city-input');
    const query = input.value.trim();
    if (!query) return;

    const resultsEl = document.getElementById('weather-search-results');
    resultsEl.innerHTML = '<div class="loading">Suche...</div>';

    try {
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=de`;
        const res = await fetch(url);
        const data = await res.json();

        if (!data.results || data.results.length === 0) {
            resultsEl.innerHTML = '<div class="error">⚠ Keine Stadt gefunden</div>';
            return;
        }

        resultsEl.innerHTML = '<div class="settings-section-title">🔍 Suchergebnisse – klicke zum Hinzufügen</div>' +
            data.results.map((r, i) => `
            <div class="settings-station-item weather-result" onclick="addWeatherLocation(${i})">
                <div class="settings-station-info">
                    <span class="settings-station-name">🏙 ${r.name}</span>
                    <span class="settings-station-query">${r.admin1 || ''} ${r.country || ''} • ${r.latitude.toFixed(2)}, ${r.longitude.toFixed(2)}</span>
                </div>
                <span style="color:#00d4ff; font-size:1.2rem;" title="Hinzufügen">+</span>
            </div>
        `).join('');

        window._weatherResults = data.results;
    } catch (err) {
        resultsEl.innerHTML = '<div class="error">⚠ Suche fehlgeschlagen</div>';
    }
}

function addWeatherLocation(index) {
    const r = window._weatherResults[index];
    // Duplikat prüfen
    const exists = CONFIG.weatherLocations.some(w => w.city === r.name && Math.abs(w.lat - r.latitude) < 0.01);
    if (exists) {
        alert(`${r.name} ist bereits in der Liste!`);
        return;
    }
    CONFIG.weatherLocations.push({ city: r.name, lat: r.latitude, lon: r.longitude });
    saveWeatherLocations();
    renderWeatherLocationList();
}

function removeWeatherLocation(index) {
    CONFIG.weatherLocations.splice(index, 1);
    saveWeatherLocations();
    renderWeatherLocationList();
}

function moveWeatherLocation(index, direction) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= CONFIG.weatherLocations.length) return;
    const temp = CONFIG.weatherLocations[index];
    CONFIG.weatherLocations[index] = CONFIG.weatherLocations[newIndex];
    CONFIG.weatherLocations[newIndex] = temp;
    saveWeatherLocations();
    renderWeatherLocationList();
}

function resetWeather() {
    CONFIG.weatherLocations.length = 0;
    DEFAULT_WEATHER_LOCATIONS.forEach(w => CONFIG.weatherLocations.push({...w}));
    saveWeatherLocations();
    renderWeatherLocationList();
}

function updateWeatherCount() {
    const el = document.getElementById('weather-count');
    if (el) el.textContent = `${CONFIG.weatherLocations.length} Standort${CONFIG.weatherLocations.length !== 1 ? 'e' : ''}`;
}

function applySettings() {
    closeSettings();
    updateDepartures();
    updateWeather();
    updateStationCount();
    updateWeatherCount();
}

// ----- Uhrzeit & Datum -----
function updateClock() {
    const now = new Date();

    const timeStr = now.toLocaleTimeString('de-CH', {
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
    document.getElementById('header-time').textContent = timeStr;

    const dateStr = now.toLocaleDateString('de-CH', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    document.getElementById('header-date').textContent = dateStr;

    // Kalender-Widget
    document.getElementById('date-day').textContent = now.getDate();
    document.getElementById('date-month').textContent = now.toLocaleDateString('de-CH', { month: 'long', year: 'numeric' });
    document.getElementById('date-weekday').textContent = now.toLocaleDateString('de-CH', { weekday: 'long' });
}

// ----- Wetter (Open-Meteo – Multi-Standorte) -----
async function fetchWeather(location) {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m&timezone=auto`;
        const res = await fetch(url);
        if (!res.ok) return null;
        return await res.json();
    } catch (err) {
        console.error(`Wetter-Fehler für ${location.city}:`, err);
        return null;
    }
}

function renderWeatherCard(data, cityName) {
    if (!data || !data.current) {
        return `<div class="weather-section">
            <div class="weather-city-header">🏙 ${cityName}</div>
            <div class="error">⚠ Nicht verfügbar</div>
        </div>`;
    }

    const current = data.current;
    const icon = getWeatherEmoji(current.weather_code);
    const desc = getWeatherDescription(current.weather_code);

    return `
        <div class="weather-section">
            <div class="weather-city-header">🏙 ${cityName}</div>
            <div class="weather-main">
                <div class="weather-icon">${icon}</div>
                <div>
                    <div class="weather-temp">${Math.round(current.temperature_2m)}°</div>
                    <div class="weather-desc">${desc}</div>
                </div>
            </div>
            <div class="weather-details">
                <span>💧 ${current.relative_humidity_2m}%</span>
                <span>🌬 ${Math.round(current.wind_speed_10m)} km/h</span>
                <span>🌡 Gefühlt ${Math.round(current.apparent_temperature)}°</span>
            </div>
        </div>
    `;
}

async function updateWeather() {
    const el = document.getElementById('weather-content');
    if (CONFIG.weatherLocations.length === 0) {
        el.innerHTML = '<div class="loading">Keine Wetter-Standorte – ⚙️ klicken</div>';
        return;
    }
    try {
        const results = await Promise.all(
            CONFIG.weatherLocations.map(loc => fetchWeather(loc))
        );
        let html = '';
        CONFIG.weatherLocations.forEach((loc, i) => {
            html += renderWeatherCard(results[i], loc.city);
        });
        el.innerHTML = html;
    } catch (err) {
        el.innerHTML = '<div class="error">⚠ Wetter konnte nicht geladen werden</div>';
        console.error('Wetter-Fehler:', err);
    }
}

function getWeatherEmoji(code) {
    if (code === 0) return '☀️';
    if (code <= 3) return '⛅';
    if (code <= 48) return '🌫';
    if (code <= 57) return '🌧';
    if (code <= 65) return '🌧';
    if (code <= 67) return '🌨';
    if (code <= 77) return '❄️';
    if (code <= 82) return '🌧';
    if (code <= 86) return '❄️';
    if (code <= 99) return '⛈';
    return '🌤';
}

function getWeatherDescription(code) {
    const descriptions = {
        0: 'Klar',
        1: 'Überwiegend klar',
        2: 'Teilweise bewölkt',
        3: 'Bewölkt',
        45: 'Nebel',
        48: 'Reifnebel',
        51: 'Leichter Nieselregen',
        53: 'Nieselregen',
        55: 'Starker Nieselregen',
        56: 'Gefrierender Nieselregen',
        57: 'Starker gefr. Nieselregen',
        61: 'Leichter Regen',
        63: 'Regen',
        65: 'Starker Regen',
        66: 'Gefrierender Regen',
        67: 'Starker gefr. Regen',
        71: 'Leichter Schneefall',
        73: 'Schneefall',
        75: 'Starker Schneefall',
        77: 'Schneekörner',
        80: 'Leichte Regenschauer',
        81: 'Regenschauer',
        82: 'Starke Regenschauer',
        85: 'Leichte Schneeschauer',
        86: 'Starke Schneeschauer',
        95: 'Gewitter',
        96: 'Gewitter mit leichtem Hagel',
        99: 'Gewitter mit starkem Hagel',
    };
    return descriptions[code] || 'Unbekannt';
}

// ----- ÖV Abfahrten (3 Stationen) -----
async function fetchStation(station) {
    try {
        const url = `https://transport.opendata.ch/v1/stationboard?station=${encodeURIComponent(station.query)}&limit=${CONFIG.oevLimit}`;
        const res = await fetch(url);
        const data = await res.json();
        return data;
    } catch (err) {
        console.error(`Fehler bei ${station.name}:`, err);
        return null;
    }
}

function renderDepartures(data, stationName) {
    if (!data || !data.stationboard || data.stationboard.length === 0) {
        return `<div class="station-section">
            <div class="station-header">${stationName}</div>
            <div class="loading">Keine Abfahrten</div>
        </div>`;
    }

    const rows = data.stationboard.map(dep => {
        const depTime = new Date(dep.stop.departure);
        const now = new Date();
        const diffMin = Math.round((depTime - now) / 60000);
        const timeStr = depTime.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' });

        let lineClass = '';
        const cat = (dep.category || '').toUpperCase();
        if (cat === 'B' || cat === 'BUS' || cat === 'NFB') lineClass = 'bus';
        if (cat === 'T' || cat === 'TRAM' || cat === 'NFT') lineClass = 'tram';

        const lineLabel = dep.number || dep.name || '?';
        const countdown = diffMin <= 0 ? 'jetzt' : `${diffMin}'`;

        return `
            <div class="departure-item">
                <span class="dep-line ${lineClass}">${lineLabel}</span>
                <span class="dep-destination">${dep.to}</span>
                <span class="dep-time">${timeStr}</span>
                <span class="dep-countdown">${countdown}</span>
            </div>
        `;
    }).join('');

    const realName = data.station ? data.station.name : stationName;
    return `<div class="station-section">
        <div class="station-header">🚏 ${realName}</div>
        ${rows}
    </div>`;
}

async function updateDepartures() {
    const el = document.getElementById('departures-list');
    try {
        const results = await Promise.all(
            CONFIG.oevStations.map(s => fetchStation(s))
        );

        let html = '';
        CONFIG.oevStations.forEach((station, i) => {
            html += renderDepartures(results[i], station.name);
        });

        el.innerHTML = html;
    } catch (err) {
        el.innerHTML = '<div class="error">⚠ ÖV-Daten nicht verfügbar</div>';
        console.error('ÖV-Fehler:', err);
    }
}

// ----- Status Widget -----
function updateStatus() {
    const lastUpdate = new Date().toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('last-update').textContent = lastUpdate;
}

// ----- Init -----
document.addEventListener('DOMContentLoaded', () => {
    updateClock();
    updateWeather();
    updateDepartures();
    updateStatus();
    updateStationCount();
    updateWeatherCount();

    setInterval(updateClock, CONFIG.clockInterval);
    setInterval(() => { updateWeather(); updateStatus(); }, CONFIG.weatherInterval);
    setInterval(() => { updateDepartures(); updateStatus(); }, CONFIG.oevInterval);
});