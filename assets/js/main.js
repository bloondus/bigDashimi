// ===== bigDashimi - Dashboard =====

// ----- Konfiguration -----
const CONFIG = {
    // OpenWeatherMap: Gratis API Key holen unter https://openweathermap.org/api
    weatherApiKey: 'DEIN_API_KEY',
    weatherCity: 'Zürich',
    weatherCountry: 'CH',

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

// ----- Wetter -----
async function updateWeather() {
    const el = document.getElementById('weather-content');
    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${CONFIG.weatherCity},${CONFIG.weatherCountry}&appid=${CONFIG.weatherApiKey}&lang=de&units=metric`;
        const res = await fetch(url);

        if (!res.ok) {
            el.innerHTML = `<div class="error">⚠ Wetter API nicht erreichbar (API Key setzen!)</div>
                <div style="margin-top:15px; color:#555; font-size:0.85rem">
                    Trage deinen kostenlosen API Key in <code>assets/js/main.js</code> ein.<br>
                    Hol dir einen unter <a href="https://openweathermap.org/api" style="color:#00d4ff">openweathermap.org</a>
                </div>`;
            return;
        }

        const data = await res.json();
        const icon = getWeatherEmoji(data.weather[0].icon);

        el.innerHTML = `
            <div class="weather-main">
                <div class="weather-icon">${icon}</div>
                <div>
                    <div class="weather-temp">${Math.round(data.main.temp)}°</div>
                    <div class="weather-desc">${data.weather[0].description}</div>
                </div>
            </div>
            <div class="weather-details">
                <span>💧 ${data.main.humidity}% Feuchtigkeit</span>
                <span>🌬 ${Math.round(data.wind.speed * 3.6)} km/h Wind</span>
                <span>🌡 Gefühlt ${Math.round(data.main.feels_like)}°</span>
                <span>👁 ${(data.visibility / 1000).toFixed(1)} km Sicht</span>
            </div>
        `;
    } catch (err) {
        el.innerHTML = '<div class="error">⚠ Wetter konnte nicht geladen werden</div>';
        console.error('Wetter-Fehler:', err);
    }
}

function getWeatherEmoji(iconCode) {
    const map = {
        '01d': '☀️', '01n': '🌙',
        '02d': '⛅', '02n': '☁️',
        '03d': '☁️', '03n': '☁️',
        '04d': '☁️', '04n': '☁️',
        '09d': '🌧', '09n': '🌧',
        '10d': '🌦', '10n': '🌧',
        '11d': '⛈', '11n': '⛈',
        '13d': '❄️', '13n': '❄️',
        '50d': '🌫', '50n': '🌫',
    };
    return map[iconCode] || '🌤';
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