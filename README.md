# Terminbuchung - Appointment Booking System

Eine moderne Website zur Auswahl und Buchung von Terminen mit interaktivem Kalender.

## 🎯 Features

✅ **Interaktiver Wochenkalender** - Wechsel zwischen Wochen
✅ **20-Minuten Zeitslots** - Flexible Terminoptionen
✅ **Buchungssystem** - Termine mit Name und E-Mail reservieren
✅ **Lokale Speicherung** - Gebuchte Termine im Browser speichern
✅ **Responsive Design** - Funktioniert auf Desktop, Tablet und Handy
✅ **Deutsche Sprache** - Vollständig auf Deutsch

## 🚀 Quick Start

1. **Repository klonen:**
```bash
git clone https://github.com/Ltblue25/termin-buchung.git
cd termin-buchung
```

2. **Lokal testen:**
   - Öffne die Datei `index.html` direkt im Browser
   - Oder starte einen lokalen Server:
   ```bash
   python -m http.server 8000
   # Dann http://localhost:8000 aufrufen
   ```

## 📁 Projektstruktur

```
termin-buchung/
├── index.html      # HTML-Struktur
├── style.css       # Styling und Layout
├── script.js       # Funktionalität und Logik
└── README.md       # Diese Datei
```

## 🔧 Funktionsweise

### HTML (`index.html`)
- Grundstruktur mit Kalender, Zeitslots und Buchungsformular
- Modal-Dialog für Bestätigung und Dateneingabe

### CSS (`style.css`)
- Modernes, responsives Design
- Gradient-Hintergrund und angepasste Farben
- Mobile-optimiert

### JavaScript (`script.js`)
- **Kalender-Verwaltung:** Wochenanzeige und Navigation
- **Zeitslot-Verwaltung:** Verfügbarkeit und Auswahl
- **Buchungssystem:** Speicherung in `localStorage`
- **Validierung:** Eingabeprüfung und Fehlerbehandlung

## 🎨 Anpassungen

### Zeitslots ändern
In `script.js` die `TIME_SLOTS` Konstante anpassen:
```javascript
const TIME_SLOTS = [
    '08:00', '08:30', '09:00', '09:30', // etc.
];
```

### Farben ändern
In `style.css` die CSS-Variablen anpassen:
```css
:root {
    --primary-color: #e74c3c;    /* Rot */
    --secondary-color: #3498db;  /* Blau */
    --success-color: #27ae60;    /* Grün */
}
```

### Verfügbare Tage
In `script.js` die Wochenstruktur anpassen (aktuell: Mo-Fr):
```javascript
for (let i = 0; i < 5; i++) { // Ändere 5 auf andere Anzahl
```

## 💾 Datenspeicherung

Gebuchte Termine werden in `localStorage` gespeichert:
```javascript
// Format der gespeicherten Daten
{
    id: 1234567890,
    date: "2026-09-21",
    time: "09:00",
    name: "Max Mustermann",
    email: "max@example.com",
    bookedAt: "2026-09-14T10:30:00.000Z"
}
```

## 🔒 Sicherheitshinweise

⚠️ **Wichtig:** Dieses System speichert Daten lokal im Browser. Für Produktivumgebung:
- Backend-Server implementieren
- Datenbank einrichten
- E-Mail-Versand konfigurieren
- Authentifizierung hinzufügen
- Datenschutz (DSGVO) beachten

## 🚀 Nächste Schritte (Optional)

- [ ] Backend mit Node.js/Express erstellen
- [ ] Datenbank (MongoDB/PostgreSQL) integrieren
- [ ] E-Mail-Bestätigung implementieren
- [ ] Admin-Panel für Terminkonfiguration
- [ ] SMS-Benachrichtigungen
- [ ] Automatische Erinnerungen

## 📝 Lizenz

Dieses Projekt ist öffentlich verfügbar.

## 👨‍💻 Autor

Erstellt von: Ltblue25