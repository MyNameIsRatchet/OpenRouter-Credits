# OpenRouter-Credits

Ein iOS/macOS-Widget für [Scriptable](https://scriptable.app), das dein OpenRouter-Guthaben, Verbrauch und API-Key-Details anzeigt.

## Features

- **Restguthaben** als Ring-Chart mit Gradient
- **Verbrauch** nach Zeitraum: Heute / Woche / Monat
- **Progress-Bar** mit farblicher Warnung bei hohem Verbrauch (>70% orange, >90% rot)
- **API-Key-Details** im Large-Widget (Name, Limit, Rate Limit)
- **Sichere Key-Speicherung** im iOS Keychain
- Unterstützt **Small**, **Medium** und **Large** Widgets
- Automatische Aktualisierung ca. alle 15 Minuten
- Dark-Theme mit Gradient-Hintergrund

## Voraussetzungen

- iPhone oder iPad mit iOS 14+
- [Scriptable](https://apps.apple.com/app/scriptable/id1405459188) aus dem App Store
- Ein [OpenRouter](https://openrouter.ai) Account mit API-Key

### API-Key Typen

| Key-Typ | Credits-Guthaben | Verbrauchsdaten | Key-Details |
|---------|:---:|:---:|:---:|
| **Management Key** | Ja | Ja | Ja |
| **Normaler API Key** | Nein | Ja | Ja |

> Mit einem normalen API-Key siehst du Verbrauchsdaten (Heute/Woche/Monat), aber kein Gesamtguthaben. Für die volle Credits-Anzeige brauchst du einen **Management Key** aus den [OpenRouter Settings](https://openrouter.ai/settings/keys).

## Installation

### 1. Scriptable installieren

Lade [Scriptable](https://apps.apple.com/app/scriptable/id1405459188) aus dem App Store.

### 2. Script hinzufuegen

**Option A – iCloud Drive (empfohlen):**

1. Oeffne die Dateien-App auf deinem iPhone/iPad
2. Navigiere zu `iCloud Drive` > `Scriptable`
3. Kopiere die Datei `OpenRouter-Credits.js` in diesen Ordner

**Option B – Manuell in Scriptable:**

1. Oeffne Scriptable
2. Tippe auf **+** oben rechts
3. Kopiere den gesamten Inhalt von `OpenRouter-Credits.js` hinein
4. Benenne das Script: `OpenRouter-Credits`

### 3. API-Key einrichten

1. Oeffne Scriptable und starte das Script einmal manuell
2. Es erscheint ein Dialog zur Key-Eingabe
3. Gib deinen OpenRouter API-Key ein (`sk-or-v1-...`)
4. Der Key wird sicher im iOS Keychain gespeichert

### 4. Widget auf dem Homescreen platzieren

1. Halte den Homescreen gedrueckt (langer Druck auf leere Stelle)
2. Tippe auf **+** oben links
3. Suche nach **Scriptable**
4. Waehle die gewuenschte Groesse (Small / Medium / Large)
5. Tippe auf **Widget hinzufuegen**
6. Halte das neue Widget gedrueckt > **Widget bearbeiten**
7. Unter **Script** waehle `OpenRouter-Credits`

## Widget-Groessen

### Small
Zeigt das Restguthaben als Ring-Chart mit Dollarbetrag. Falls kein Guthaben verfuegbar: Gesamtverbrauch + Tagesverbrauch.

### Medium
Links der Ring-Chart, rechts die Statistiken (Gekauft / Verbraucht / Verbrauch in %). Falls kein Guthaben: Verbrauch nach Zeitraum.

### Large
Wie Medium, plus zusaetzlich:
- Verbrauch nach Zeitraum (Heute / Woche / Monat)
- API-Key-Details (Name, Limit, Rate Limit)

## Key verwalten

Starte das Script manuell in Scriptable (nicht als Widget), um das Menue zu oeffnen:

- **Vorschau anzeigen** – Widget-Vorschau in beliebiger Groesse
- **Key aendern** – Neuen API-Key eingeben
- **Key loeschen** – Gespeicherten Key aus dem Keychain entfernen

## Aktualisierung

Das Widget aktualisiert sich automatisch. Der eingestellte Intervall ist 15 Minuten, aber iOS kontrolliert die tatsaechliche Frequenz basierend auf Nutzungsverhalten und Batteriestatus. In der Praxis: alle 15–60 Minuten.

## Fehlerbehebung

| Problem | Loesung |
|---------|---------|
| "Keine Daten" | API-Key pruefen, Internetverbindung testen |
| "Kein API-Key" | Script manuell in Scriptable oeffnen und Key eingeben |
| Kein Guthaben angezeigt | Du brauchst einen Management Key fuer Credits-Daten |
| Widget aktualisiert nicht | iOS beschraenkt Refreshes – Widget antippen oeffnet die App und aktualisiert |

## Lizenz

MIT
