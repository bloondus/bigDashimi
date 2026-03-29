# 📊 bigDashimi

Dunkles Dashboard als GitHub Pages Seite – zeigt **Uhrzeit**, **Wetter**, **ÖV-Abfahrten** und mehr.

![Dashboard](https://img.shields.io/badge/Status-Live-brightgreen) ![GitHub Pages](https://img.shields.io/badge/Hosted-GitHub%20Pages-blue)

## 🚀 Live aufrufen

Nach dem Deployment erreichbar unter:
```
https://DEIN-USERNAME.github.io/bigDashimi/
```

## ⚙️ Einrichtung

### 1. Repository auf GitHub erstellen

```bash
cd my-github-pages-site
git init
git add .
git commit -m "bigDashimi Dashboard"
git branch -M main
git remote add origin https://github.com/DEIN-USERNAME/bigDashimi.git
git push -u origin main
```

### 2. GitHub Pages aktivieren

1. Gehe zu **Settings** → **Pages** in deinem Repository
2. Unter **Source** wähle: **Deploy from a branch**
3. Branch: `main` / Ordner: `/ (root)`
4. **Save** klicken
5. Nach ~1 Minute ist dein Dashboard live! 🎉

### 3. Wetter-API einrichten (optional)

1. Gratis API Key holen: [openweathermap.org/api](https://openweathermap.org/api)
2. In `assets/js/main.js` den Key eintragen:
   ```js
   weatherApiKey: 'DEIN_API_KEY',
   ```

### 4. ÖV-Station ändern

In `assets/js/main.js` die Station anpassen:
```js
oevStation: 'Bern',        // oder 'Basel SBB', 'Luzern', etc.
```

## 📁 Projektstruktur

```
├── _config.yml          # Jekyll Konfiguration
├── _layouts/default.html # Seiten-Template
├── _includes/
│   ├── header.html      # Dashboard-Header mit Uhr
│   └── footer.html      # (minimiert)
├── assets/
│   ├── css/style.css    # Dunkles Dashboard-Design
│   └── js/main.js       # API-Anbindung (Wetter, ÖV)
├── index.html           # Dashboard mit Widgets
└── README.md
```

## 🖥 Fullscreen-Kiosk Modus

Für ein TV/Monitor-Dashboard:

**Browser:** `F11` drücken

**Linux Autostart:**
```bash
chromium-browser --kiosk https://DEIN-USERNAME.github.io/bigDashimi/
```

**Windows:**
```cmd
start chrome --kiosk https://DEIN-USERNAME.github.io/bigDashimi/
```

## 🛠 Features

- 🕐 Echtzeit-Uhr und Datum
- 🌤 Wetter (OpenWeatherMap API)
- 🚉 ÖV-Abfahrten (transport.opendata.ch – Schweiz)
- 📊 Status-Übersicht
- 🌙 Dunkles Design
- 📱 Responsive (Desktop, Tablet, Mobile)
- ♻️ Auto-Refresh alle 5 Minuten