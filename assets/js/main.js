// ===== bigDashimi - Dashboard =====

// ----- Konfiguration -----
const CONFIG = {
    // Wetter: Open-Meteo (GRATIS, kein API Key nötig!)
    weatherLat: 47.3769,    // Zürich Breitengrad
    weatherLon: 8.5417,     // Zürich Längengrad
    weatherCity: 'Zürich',

    // ÖV Station (transport.opendata.ch - Schweizer ÖV)
    oevStation: 'Zürich, HB',
    oevLimit: 10,

    // Update-Intervalle (in Millisekunden)
    clockInterval: 1000,
    weatherInterval: 5 * 60 * 1000,   // 5 Minuten
    oevInterval: 30 * 1000,            // 30 Sekunden
};

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

// ----- Wetter (Open-Meteo – GRATIS, kein Key nötig) -----
async function updateWeather() {
    const el = document.getElementById('weather-content');
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${CONFIG.weatherLat}&longitude=${CONFIG.weatherLon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m&timezone=auto`;
        const res = await fetch(url);

        if (!res.ok) {
            el.innerHTML = '<div class="error">⚠ Wetter API nicht erreichbar</div>';
            return;
        }

        const data = await res.json();
        const current = data.current;
        const icon = getWeatherEmoji(current.weather_code);
        const desc = getWeatherDescription(current.weather_code);

        el.innerHTML = `
            <div class="weather-main">
                <div class="weather-icon">${icon}</div>
                <div>
                    <div class="weather-temp">${Math.round(current.temperature_2m)}°</div>
                    <div class="weather-desc">${desc}</div>
                </div>
            </div>
            <div class="weather-details">
                <span>💧 ${current.relative_humidity_2m}% Feuchtigkeit</span>
                <span>🌬 ${Math.round(current.wind_speed_10m)} km/h Wind</span>
                <span>🌡 Gefühlt ${Math.round(current.apparent_temperature)}°</span>
                <span>📍 ${CONFIG.weatherCity}</span>
            </div>
        `;
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

// ----- ÖV Abfahrten -----
async function updateDepartures() {
    const el = document.getElementById('departures-list');
    try {
        const url = `https://transport.opendata.ch/v1/stationboard?station=${encodeURIComponent(CONFIG.oevStation)}&limit=${CONFIG.oevLimit}`;
        const res = await fetch(url);
        const data = await res.json();

        if (!data.stationboard || data.stationboard.length === 0) {
            el.innerHTML = '<div class="loading">Keine Abfahrten gefunden</div>';
            return;
        }

        // Station-Name aktualisieren
        const stationEl = document.getElementById('station-name');
        if (stationEl && data.station) {
            stationEl.textContent = data.station.name;
        }

        el.innerHTML = data.stationboard.map(dep => {
            const depTime = new Date(dep.stop.departure);
            const now = new Date();
            const diffMin = Math.round((depTime - now) / 60000);
            const timeStr = depTime.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' });

            // Typ erkennen (S-Bahn, Bus, Tram, etc.)
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
    // Sofort laden
    updateClock();
    updateWeather();
    updateDepartures();
    updateStatus();

    // Intervalle setzen
    setInterval(updateClock, CONFIG.clockInterval);
    setInterval(() => { updateWeather(); updateStatus(); }, CONFIG.weatherInterval);
    setInterval(() => { updateDepartures(); updateStatus(); }, CONFIG.oevInterval);
});