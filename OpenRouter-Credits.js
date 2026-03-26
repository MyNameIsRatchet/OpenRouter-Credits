// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: coins;

/************************************************************
 *  OpenRouter Credits Widget – für Scriptable (iOS/macOS)
 *
 *  ◆ Zeigt Credits, Verbrauch & Restguthaben
 *  ◆ Tages-/Wochen-/Monatsverbrauch
 *  ◆ API-Key wird beim 1. Start abgefragt & im Keychain gespeichert
 *  ◆ Unterstützt Small, Medium & Large Widgets
 *
 *  API-Hinweise:
 *  - /api/v1/key      → funktioniert mit jedem Key (Usage, Limits, Rate)
 *  - /api/v1/credits   → braucht einen Management Key (Gesamtguthaben)
 *    Falls kein Management Key → Credits-Daten nicht verfügbar,
 *    Widget zeigt dann nur Key-basierte Usage-Daten.
 ************************************************************/

// ─── Config ───────────────────────────────────────────────
const KEYCHAIN_KEY = "openrouter_api_key";
const REFRESH_INTERVAL = 15; // Minuten

// ─── Farben ───────────────────────────────────────────────
const C = {
  bgGrad1:    new Color("#0f0f1e"),
  bgGrad2:    new Color("#161630"),
  accent:     new Color("#7c6ff7"),
  accentSoft: new Color("#a5a0fb"),
  cyan:       new Color("#22d3ee"),
  green:      new Color("#34d399"),
  orange:     new Color("#fb923c"),
  red:        new Color("#f87171"),
  text:       new Color("#eeeef5"),
  textDim:    new Color("#eeeef5", 0.5),
  textDimmer: new Color("#eeeef5", 0.25),
  barBg:      new Color("#ffffff", 0.08),
  ring:       new Color("#6366f1"),
};

// ─── API-Key verwalten ────────────────────────────────────
async function getApiKey() {
  if (Keychain.contains(KEYCHAIN_KEY)) {
    return Keychain.get(KEYCHAIN_KEY);
  }
  return await promptForKey();
}

async function promptForKey() {
  let a = new Alert();
  a.title = "OpenRouter API-Key";
  a.message = "Gib deinen OpenRouter API-Key ein.\nEr wird sicher im iOS Keychain gespeichert.\n\nFür Credits-Guthaben brauchst du einen Management Key.\nMit einem normalen Key siehst du nur Verbrauchsdaten.";
  a.addTextField("sk-or-v1-...");
  a.addAction("Speichern");
  a.addCancelAction("Abbrechen");
  let idx = await a.present();
  if (idx === -1) return null;
  let key = a.textFieldValue(0).trim();
  if (key.length > 0) {
    Keychain.set(KEYCHAIN_KEY, key);
    return key;
  }
  return null;
}

// ─── In-App Menü ──────────────────────────────────────────
async function showMenu() {
  let a = new Alert();
  a.title = "OpenRouter Widget";
  a.addAction("▶ Vorschau anzeigen");
  a.addAction("🔑 Key ändern");
  a.addAction("🗑 Key löschen");
  a.addCancelAction("Abbrechen");
  let idx = await a.present();
  if (idx === 0) return "preview";
  if (idx === 1) {
    await promptForKey();
    return "preview";
  }
  if (idx === 2) {
    if (Keychain.contains(KEYCHAIN_KEY)) Keychain.remove(KEYCHAIN_KEY);
    let b = new Alert();
    b.title = "Gelöscht";
    b.message = "API-Key wurde entfernt.";
    b.addAction("OK");
    await b.present();
    return "quit";
  }
  return "quit";
}

// ─── API Calls ────────────────────────────────────────────
async function fetchCredits(apiKey) {
  try {
    let req = new Request("https://openrouter.ai/api/v1/credits");
    req.headers = { "Authorization": "Bearer " + apiKey };
    req.timeoutInterval = 10;
    let res = await req.loadJSON();
    if (res.error) {
      console.log("Credits API: " + res.error.message + " (code " + res.error.code + ")");
      return null;
    }
    return res.data || null;
  } catch (e) {
    console.log("Credits API error: " + e);
    return null;
  }
}

async function fetchKeyInfo(apiKey) {
  try {
    let req = new Request("https://openrouter.ai/api/v1/key");
    req.headers = { "Authorization": "Bearer " + apiKey };
    req.timeoutInterval = 10;
    let res = await req.loadJSON();
    if (res.error) {
      console.log("Key API: " + res.error.message);
      return null;
    }
    return res.data || null;
  } catch (e) {
    console.log("Key API error: " + e);
    return null;
  }
}

// ─── Hilfsfunktionen ─────────────────────────────────────
function fmt$(val) {
  if (val == null || isNaN(val)) return "$0.00";
  if (Math.abs(val) < 0.01 && val !== 0) return "$" + val.toFixed(4);
  return "$" + val.toFixed(2);
}

function fmtPct(val) {
  return val.toFixed(1) + "%";
}

function nowStr() {
  let d = new Date();
  let hh = String(d.getHours()).padStart(2, "0");
  let mm = String(d.getMinutes()).padStart(2, "0");
  return hh + ":" + mm;
}

function hexToRgb(hex) {
  hex = hex.replace("#", "");
  return {
    r: parseInt(hex.substring(0, 2), 16) / 255,
    g: parseInt(hex.substring(2, 4), 16) / 255,
    b: parseInt(hex.substring(4, 6), 16) / 255,
  };
}

function rgbToHex(r, g, b) {
  let rr = Math.round(r * 255).toString(16).padStart(2, "0");
  let gg = Math.round(g * 255).toString(16).padStart(2, "0");
  let bb = Math.round(b * 255).toString(16).padStart(2, "0");
  return "#" + rr + gg + bb;
}

function lerpColor(hex1, hex2, t) {
  let c1 = hexToRgb(hex1);
  let c2 = hexToRgb(hex2);
  return rgbToHex(
    c1.r + t * (c2.r - c1.r),
    c1.g + t * (c2.g - c1.g),
    c1.b + t * (c2.b - c1.b)
  );
}

// ─── Ring als Bild ────────────────────────────────────────
function drawRing(percent, size, hexColor1, hexColor2) {
  let ctx = new DrawContext();
  ctx.size = new Size(size, size);
  ctx.opaque = false;
  ctx.respectScreenScale = true;

  let lw = Math.round(size * 0.09);
  let r = (size - lw) / 2;
  let cx = size / 2;
  let cy = size / 2;
  let startAngle = -Math.PI / 2;
  let totalSegs = 100;

  // Background ring
  ctx.setStrokeColor(new Color("#ffffff", 0.08));
  ctx.setLineWidth(lw);
  let bgPath = new Path();
  for (let i = 0; i <= totalSegs; i++) {
    let angle = startAngle + (i / totalSegs) * 2 * Math.PI;
    let x = cx + r * Math.cos(angle);
    let y = cy + r * Math.sin(angle);
    if (i === 0) bgPath.move(new Point(x, y));
    else bgPath.addLine(new Point(x, y));
  }
  ctx.addPath(bgPath);
  ctx.strokePath();

  // Foreground arc
  let pct = Math.min(Math.max(percent / 100, 0), 1);
  if (pct > 0.005) {
    let arcSegs = Math.max(Math.round(totalSegs * pct), 2);
    for (let i = 0; i < arcSegs; i++) {
      let t = i / Math.max(arcSegs - 1, 1);
      let hex = lerpColor(hexColor1, hexColor2, t);
      ctx.setStrokeColor(new Color(hex));
      ctx.setLineWidth(lw);
      let a1 = startAngle + (i / totalSegs) * 2 * Math.PI;
      let a2 = startAngle + ((i + 1) / totalSegs) * 2 * Math.PI;
      let segPath = new Path();
      segPath.move(new Point(cx + r * Math.cos(a1), cy + r * Math.sin(a1)));
      segPath.addLine(new Point(cx + r * Math.cos(a2), cy + r * Math.sin(a2)));
      ctx.addPath(segPath);
      ctx.strokePath();
    }
    // Round end cap
    let endAngle = startAngle + pct * 2 * Math.PI;
    ctx.setFillColor(new Color(hexColor2));
    let capEnd = new Path();
    capEnd.addEllipse(new Rect(
      cx + r * Math.cos(endAngle) - lw / 2,
      cy + r * Math.sin(endAngle) - lw / 2, lw, lw
    ));
    ctx.addPath(capEnd);
    ctx.fillPath();
    // Round start cap
    ctx.setFillColor(new Color(hexColor1));
    let capStart = new Path();
    capStart.addEllipse(new Rect(
      cx + r * Math.cos(startAngle) - lw / 2,
      cy + r * Math.sin(startAngle) - lw / 2, lw, lw
    ));
    ctx.addPath(capStart);
    ctx.fillPath();
  }
  return ctx.getImage();
}

// ─── Progress-Bar als Bild ────────────────────────────────
function drawBar(percent, width, height, barColor) {
  let ctx = new DrawContext();
  ctx.size = new Size(width, height);
  ctx.opaque = false;
  ctx.respectScreenScale = true;
  let rad = height / 2;
  let bgP = new Path();
  bgP.addRoundedRect(new Rect(0, 0, width, height), rad, rad);
  ctx.addPath(bgP);
  ctx.setFillColor(new Color("#ffffff", 0.08));
  ctx.fillPath();
  let pct = Math.min(Math.max(percent / 100, 0), 1);
  let fillW = Math.max(pct * width, height);
  let fgP = new Path();
  fgP.addRoundedRect(new Rect(0, 0, fillW, height), rad, rad);
  ctx.addPath(fgP);
  ctx.setFillColor(barColor);
  ctx.fillPath();
  return ctx.getImage();
}

// ─── Daten zusammenführen ─────────────────────────────────
function mergeData(credits, keyInfo) {
  let d = {
    hasCredits: false,
    totalCredits: 0,
    totalUsage: 0,
    remaining: 0,
    usagePct: 0,
    remainPct: 0,
    // Key-basierte Daten
    usage: 0,
    usageDaily: 0,
    usageWeekly: 0,
    usageMonthly: 0,
    limit: null,
    limitRemaining: null,
    label: null,
    isFreeTier: false,
    rateLimit: null,
  };

  if (keyInfo) {
    d.usage = keyInfo.usage || 0;
    d.usageDaily = keyInfo.usage_daily || 0;
    d.usageWeekly = keyInfo.usage_weekly || 0;
    d.usageMonthly = keyInfo.usage_monthly || 0;
    d.limit = keyInfo.limit;
    d.limitRemaining = keyInfo.limit_remaining;
    d.label = keyInfo.label || keyInfo.name || null;
    d.isFreeTier = keyInfo.is_free_tier || false;
    d.rateLimit = keyInfo.rate_limit || null;
  }

  if (credits && credits.total_credits != null) {
    d.hasCredits = true;
    d.totalCredits = credits.total_credits || 0;
    d.totalUsage = credits.total_usage || 0;
    d.remaining = Math.max(d.totalCredits - d.totalUsage, 0);
    d.usagePct = d.totalCredits > 0 ? (d.totalUsage / d.totalCredits) * 100 : 0;
    d.remainPct = d.totalCredits > 0 ? (d.remaining / d.totalCredits) * 100 : 0;
  } else if (d.limit != null && d.limit > 0) {
    // Fallback: Key-Limit als "Budget" verwenden
    d.hasCredits = true;
    d.totalCredits = d.limit;
    d.totalUsage = d.usage;
    d.remaining = d.limitRemaining != null ? d.limitRemaining : Math.max(d.limit - d.usage, 0);
    d.usagePct = d.limit > 0 ? (d.usage / d.limit) * 100 : 0;
    d.remainPct = 100 - d.usagePct;
  }

  return d;
}

// ─── Widget bauen ─────────────────────────────────────────
function buildWidget(data, widgetFamily) {
  let w = new ListWidget();
  let grad = new LinearGradient();
  grad.locations = [0, 1];
  grad.colors = [C.bgGrad1, C.bgGrad2];
  w.backgroundGradient = grad;
  w.setPadding(14, 14, 14, 14);

  let isSmall = (widgetFamily === "small");
  let isLarge = (widgetFamily === "large");

  // ── Header ──
  let header = w.addStack();
  header.layoutHorizontally();
  header.centerAlignContent();
  let dot = header.addText("◆");
  dot.font = Font.systemFont(isSmall ? 13 : 15);
  dot.textColor = C.accent;
  header.addSpacer(6);
  let title = header.addText("OpenRouter");
  title.font = Font.boldSystemFont(isSmall ? 13 : 15);
  title.textColor = C.text;
  header.addSpacer();
  let time = header.addText(nowStr());
  time.font = Font.mediumSystemFont(10);
  time.textColor = C.textDimmer;

  w.addSpacer(isSmall ? 6 : 10);

  // ── Keine Daten ──
  if (!data || (data.usage === 0 && !data.hasCredits)) {
    w.addSpacer();
    let err = w.addText("Keine Daten");
    err.font = Font.mediumSystemFont(13);
    err.textColor = C.red;
    let hint = w.addText("Key prüfen / API nicht erreichbar");
    hint.font = Font.regularSystemFont(10);
    hint.textColor = C.textDim;
    w.addSpacer();
    return w;
  }

  // ─── SMALL ─────────────────────────────────────────────
  if (isSmall) {
    if (data.hasCredits) {
      // Ring + Restguthaben
      let ringSize = 70;
      let ringImg = drawRing(data.remainPct, ringSize, "#6366f1", "#22d3ee");
      let ringRow = w.addStack();
      ringRow.layoutHorizontally();
      ringRow.addSpacer();
      let ringEl = ringRow.addImage(ringImg);
      ringEl.imageSize = new Size(ringSize, ringSize);
      ringRow.addSpacer();

      w.addSpacer(6);

      let valRow = w.addStack();
      valRow.layoutHorizontally();
      valRow.addSpacer();
      let valCol = valRow.addStack();
      valCol.layoutVertically();
      let val = valCol.addText(fmt$(data.remaining));
      val.font = Font.boldSystemFont(20);
      val.textColor = C.text;
      val.centerAlignText();
      let lbl = valCol.addText("VERFÜGBAR");
      lbl.font = Font.boldSystemFont(8);
      lbl.textColor = C.textDimmer;
      lbl.centerAlignText();
      valRow.addSpacer();
    } else {
      // Nur Usage-Daten
      let val = w.addText(fmt$(data.usage));
      val.font = Font.boldSystemFont(22);
      val.textColor = C.orange;
      let lbl = w.addText("GESAMT");
      lbl.font = Font.boldSystemFont(8);
      lbl.textColor = C.textDimmer;

      w.addSpacer(8);

      let todayLbl = w.addText("HEUTE");
      todayLbl.font = Font.boldSystemFont(8);
      todayLbl.textColor = C.textDimmer;
      let todayVal = w.addText(fmt$(data.usageDaily));
      todayVal.font = Font.boldSystemFont(16);
      todayVal.textColor = C.cyan;
    }
    w.addSpacer();
    return w;
  }

  // ─── MEDIUM / LARGE ────────────────────────────────────
  let main = w.addStack();
  main.layoutHorizontally();
  main.centerAlignContent();

  // Links: Ring oder Usage-Anzeige
  let leftCol = main.addStack();
  leftCol.layoutVertically();
  leftCol.centerAlignContent();

  let ringSize = isLarge ? 100 : 76;
  if (data.hasCredits) {
    let ringImg = drawRing(data.remainPct, ringSize, "#6366f1", "#22d3ee");
    let ringEl = leftCol.addImage(ringImg);
    ringEl.imageSize = new Size(ringSize, ringSize);
    leftCol.addSpacer(5);
    let ringVal = leftCol.addText(fmt$(data.remaining));
    ringVal.font = Font.boldSystemFont(15);
    ringVal.textColor = C.text;
    let ringSub = leftCol.addText("Verfügbar");
    ringSub.font = Font.mediumSystemFont(9);
    ringSub.textColor = C.textDim;
  } else {
    let usagePctFake = Math.min(data.usage * 10, 100);
    let ringImg = drawRing(usagePctFake, ringSize, "#fb923c", "#f87171");
    let ringEl = leftCol.addImage(ringImg);
    ringEl.imageSize = new Size(ringSize, ringSize);
    leftCol.addSpacer(5);
    let ringVal = leftCol.addText(fmt$(data.usage));
    ringVal.font = Font.boldSystemFont(15);
    ringVal.textColor = C.orange;
    let ringSub = leftCol.addText("Verbraucht");
    ringSub.font = Font.mediumSystemFont(9);
    ringSub.textColor = C.textDim;
  }

  main.addSpacer(14);

  // Rechts: Stats
  let rightCol = main.addStack();
  rightCol.layoutVertically();

  if (data.hasCredits) {
    addStatRow(rightCol, "GEKAUFT", fmt$(data.totalCredits), C.accentSoft);
    rightCol.addSpacer(5);
    addStatRow(rightCol, "VERBRAUCHT", fmt$(data.totalUsage), C.orange);
    rightCol.addSpacer(5);
    let barColor = data.usagePct > 90 ? C.red : (data.usagePct > 70 ? C.orange : C.accent);
    addStatRow(rightCol, "VERBRAUCH", fmtPct(data.usagePct), barColor);
    rightCol.addSpacer(4);
    let barImg = drawBar(data.usagePct, 130, 5, barColor);
    let barEl = rightCol.addImage(barImg);
    barEl.imageSize = new Size(130, 5);
  } else {
    addStatRow(rightCol, "HEUTE", fmt$(data.usageDaily), C.cyan);
    rightCol.addSpacer(5);
    addStatRow(rightCol, "DIESE WOCHE", fmt$(data.usageWeekly), C.green);
    rightCol.addSpacer(5);
    addStatRow(rightCol, "DIESER MONAT", fmt$(data.usageMonthly), C.accentSoft);
  }

  // ─── Large: Zusätzliche Details ────────────────────────
  if (isLarge) {
    w.addSpacer(12);

    // Zeitraum-Verbrauch (auch wenn Credits vorhanden)
    if (data.hasCredits) {
      let periodTitle = w.addText("VERBRAUCH NACH ZEITRAUM");
      periodTitle.font = Font.boldSystemFont(9);
      periodTitle.textColor = C.textDimmer;
      w.addSpacer(6);
      addDetailRow(w, "Heute", fmt$(data.usageDaily));
      addDetailRow(w, "Diese Woche", fmt$(data.usageWeekly));
      addDetailRow(w, "Dieser Monat", fmt$(data.usageMonthly));
      w.addSpacer(8);
    }

    // Key-Details
    let detailTitle = w.addText("API-KEY DETAILS");
    detailTitle.font = Font.boldSystemFont(9);
    detailTitle.textColor = C.textDimmer;
    w.addSpacer(6);

    if (data.label) addDetailRow(w, "Name", data.label);
    if (data.isFreeTier) addDetailRow(w, "Tier", "Free");

    if (data.limit != null) {
      let limitStr = (data.limit === 0 || data.limit == null) ? "Unbegrenzt" : fmt$(data.limit);
      addDetailRow(w, "Limit", limitStr);
    }
    if (data.limitRemaining != null && data.limit > 0) {
      addDetailRow(w, "Limit Rest", fmt$(data.limitRemaining));
    }
    if (data.rateLimit) {
      addDetailRow(w, "Rate Limit", data.rateLimit.requests + " / " + data.rateLimit.interval);
    }

    w.addSpacer();
  }

  return w;
}

function addStatRow(stack, label, value, color) {
  let lbl = stack.addText(label);
  lbl.font = Font.boldSystemFont(9);
  lbl.textColor = C.textDimmer;
  stack.addSpacer(2);
  let val = stack.addText(value);
  val.font = Font.boldSystemFont(17);
  val.textColor = color;
}

function addDetailRow(stack, label, value) {
  let row = stack.addStack();
  row.layoutHorizontally();
  let lbl = row.addText(label);
  lbl.font = Font.mediumSystemFont(12);
  lbl.textColor = C.textDim;
  lbl.lineLimit = 1;
  row.addSpacer();
  let val = row.addText(String(value));
  val.font = Font.semiboldSystemFont(12);
  val.textColor = C.text;
  val.lineLimit = 1;
  val.rightAlignText();
  stack.addSpacer(4);
}

// ─── Error Widget ─────────────────────────────────────────
function buildErrorWidget(message) {
  let w = new ListWidget();
  let grad = new LinearGradient();
  grad.locations = [0, 1];
  grad.colors = [C.bgGrad1, C.bgGrad2];
  w.backgroundGradient = grad;
  w.setPadding(14, 14, 14, 14);
  let header = w.addStack();
  header.layoutHorizontally();
  header.centerAlignContent();
  let dot = header.addText("◆");
  dot.font = Font.systemFont(15);
  dot.textColor = C.accent;
  header.addSpacer(6);
  let t = header.addText("OpenRouter");
  t.font = Font.boldSystemFont(15);
  t.textColor = C.text;
  w.addSpacer();
  let err = w.addText("⚠ " + message);
  err.font = Font.mediumSystemFont(12);
  err.textColor = C.orange;
  w.addSpacer(6);
  let hint = w.addText("Script in Scriptable öffnen → Key eingeben");
  hint.font = Font.regularSystemFont(10);
  hint.textColor = C.textDim;
  w.addSpacer();
  return w;
}

// ─── Main ─────────────────────────────────────────────────
async function main() {
  if (!config.runsInWidget) {
    let action = await showMenu();
    if (action === "quit") return;
  }

  let apiKey = await getApiKey();
  if (!apiKey) {
    let w = buildErrorWidget("Kein API-Key");
    if (config.runsInWidget) Script.setWidget(w);
    else w.presentMedium();
    Script.complete();
    return;
  }

  // Beide Endpoints parallel abfragen
  let [credits, keyInfo] = await Promise.all([
    fetchCredits(apiKey),
    fetchKeyInfo(apiKey),
  ]);

  if (!credits && !keyInfo) {
    let w = buildErrorWidget("API nicht erreichbar");
    if (config.runsInWidget) Script.setWidget(w);
    else w.presentMedium();
    Script.complete();
    return;
  }

  let data = mergeData(credits, keyInfo);

  let family = config.widgetFamily || "medium";
  let w = buildWidget(data, family);
  w.refreshAfterDate = new Date(Date.now() + REFRESH_INTERVAL * 60 * 1000);

  if (config.runsInWidget) {
    Script.setWidget(w);
  } else {
    let a = new Alert();
    a.title = "Vorschau-Größe";
    a.addAction("Small");
    a.addAction("Medium");
    a.addAction("Large");
    let idx = await a.present();
    let sizes = ["small", "medium", "large"];
    let preview = buildWidget(data, sizes[idx]);
    if (idx === 0) preview.presentSmall();
    else if (idx === 1) preview.presentMedium();
    else preview.presentLarge();
  }

  Script.complete();
}

await main();
