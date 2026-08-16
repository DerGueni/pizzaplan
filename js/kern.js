/* PizzaPlan · Datenkern
   ----------------------------------------------------------------------------
   Hier liegt alles, was gerechnet und gespeichert wird. Die Oberflächen
   (PC-Fassung, Handy-Fassung, Mitarbeiter-App) benutzen nur diese Funktionen
   und enthalten selbst keine Rechenlogik.

   Gespeichert wird im Gerät: bevorzugt im großen Browserspeicher (IndexedDB),
   ersatzweise im kleinen (localStorage). Ist beides gesperrt, läuft alles
   trotzdem – die Daten bleiben dann bis zum Schließen des Fensters erhalten.
*/
var Kern = (function () {
  'use strict';

  var ABLAGE = 'pizzaplan_gabriels';
  var FASSUNG = 3;

  /* =========================================================================
     1 · Datum und Zeit
     ========================================================================= */

  function zwei(n) { return String(n).padStart(2, '0'); }

  function iso(j, m, t) { return String(j).padStart(4, '0') + '-' + zwei(m) + '-' + zwei(t); }

  function alsIso(d) { return iso(d.getFullYear(), d.getMonth() + 1, d.getDate()); }

  function ausIso(s) {
    var p = String(s || '').split('-');
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }

  function heute() { return alsIso(new Date()); }

  function plusTage(datum, n) {
    var d = ausIso(datum);
    d.setDate(d.getDate() + n);
    return alsIso(d);
  }

  /* 0 = Montag … 6 = Sonntag */
  function wochentag(datum) { return (ausIso(datum).getDay() + 6) % 7; }

  function wochenstart(datum) { return plusTage(datum, -wochentag(datum)); }

  function istSonntag(datum) { return wochentag(datum) === 6; }

  function tageZwischen(von, bis) {
    var aus = [], d = von;
    var schutz = 0;
    while (d <= bis && schutz++ < 2000) { aus.push(d); d = plusTage(d, 1); }
    return aus;
  }

  function jetztZeit() {
    var d = new Date();
    return zwei(d.getHours()) + ':' + zwei(d.getMinutes());
  }

  function minuten(hhmm) {
    var m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || '').trim());
    return m ? Number(m[1]) * 60 + Number(m[2]) : 0;
  }

  function alsZeit(min) {
    var m = ((Math.round(min) % 1440) + 1440) % 1440;
    return zwei(Math.floor(m / 60)) + ':' + zwei(m % 60);
  }

  /* Arbeitszeit in Minuten; über Mitternacht wird mitgerechnet. */
  function dauerMinuten(von, bis, pause) {
    var a = minuten(von), b = minuten(bis);
    if (b <= a) b += 1440;
    return Math.max(0, b - a - Number(pause || 0));
  }

  function stunden(min) { return Math.round(min / 60 * 100) / 100; }

  /* Minuten, die in der Nachtzeit liegen (ab Nachtbeginn bis 6 Uhr früh). */
  function nachtMinuten(von, bis, nachtAb) {
    var a = minuten(von), b = minuten(bis);
    if (b <= a) b += 1440;
    var grenze = minuten(nachtAb || '22:00');
    var treffer = 0;
    for (var m = a; m < b; m++) {
      var t = ((m % 1440) + 1440) % 1440;
      if (t >= grenze || t < 360) treffer++;
    }
    return treffer;
  }

  function dm(datum) {
    var d = ausIso(datum);
    return zwei(d.getDate()) + '.' + zwei(d.getMonth() + 1) + '.';
  }

  function dmy(datum) { return dm(datum) + ausIso(datum).getFullYear(); }

  function datumGueltig(datum) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(datum || ''))) return false;
    var p = String(datum).split('-').map(Number);
    var d = new Date(p[0], p[1] - 1, p[2]);
    return d.getFullYear() === p[0] && d.getMonth() + 1 === p[1] && d.getDate() === p[2];
  }

  /* =========================================================================
     2 · Fehler
     ========================================================================= */

  function Fehler(text) {
    var e = new Error(text);
    e.freundlich = true;
    return e;
  }

  /* =========================================================================
     3 · Grundeinstellungen und Beispieldaten
     ========================================================================= */

  var STANDARD = {
    betrieb: 'Pizzeria Gabriels',
    chef_pin: '1234',
    sprache: 'de',
    farbschema: 'hell',
    positionen: 'Küche,Pizzaofen,Service,Theke,Lieferung,Spüle',
    oeffnung_von: '11:00',
    oeffnung_bis: '23:00',
    pause_ab_6h: '30',
    pause_ab_9h: '45',
    ruhezeit_std: '11',
    zuschlag_sonntag: '0',
    zuschlag_nacht: '0',
    nacht_ab: '22:00',
    minijob_grenze: '556',
    mindestlohn: '12.82',
    termin_kategorien: 'Allgemein,Lieferant,Behörde,Steuerberater,Wartung,Personal,Privat',
    termin_erinnerung_standard: '60',
    versand_text: 'Hallo {name},\n\nhier ist dein Dienstplan für {zeitraum}:\n\n{plan}\n\n'
      + 'Deinen Plan immer aktuell – und zum Ein- und Ausstempeln – findest du hier:\n{link}\n\n'
      + 'Viele Grüße\n{betrieb}',
    versand_text_it: 'Ciao {name},\n\necco il tuo turno per {zeitraum}:\n\n{plan}\n\n'
      + 'Il piano sempre aggiornato – e per timbrare entrata e uscita – lo trovi qui:\n{link}\n\n'
      + 'Un saluto\n{betrieb}'
  };

  var VORLAGEN_START = [
    ['Mittag Service', '11:00', '15:00', 0, 'Service', '#3d8bfd'],
    ['Abend Service', '17:00', '23:00', 30, 'Service', '#2e86c1'],
    ['Abend Küche', '16:30', '23:30', 30, 'Küche', '#e67e22'],
    ['Pizzaofen Abend', '16:00', '23:00', 30, 'Pizzaofen', '#d35400'],
    ['Lieferung Abend', '17:30', '22:30', 0, 'Lieferung', '#16a085'],
    ['Ganztag', '11:00', '22:00', 60, 'Service', '#8e44ad']
  ];

  /* Kleines Beispiel-Team, damit nichts leer aussieht. Wird beim ersten
     eigenen Eintrag nie wieder angefasst und lässt sich in einem Zug löschen. */
  var TEAM_START = [
    ['Gabriele Esposito', 'Leitung', '#c0392b', 'Vollzeit', 1, 0, 'it'],
    ['Anna Rossi', 'Service', '#3d8bfd', 'Teilzeit', 0, 13.5, 'it'],
    ['Marco Bianchi', 'Küche', '#e67e22', 'Vollzeit', 0, 16, 'it'],
    ['Luca Greco', 'Lieferung', '#16a085', 'Minijob', 0, 13, 'it'],
    ['Sara Meier', 'Theke', '#8e44ad', 'Minijob', 0, 13, 'de']
  ];

  /* =========================================================================
     4 · Speicher
     ========================================================================= */

  var D = null;
  var ablage = null;
  var speicherArt = 'Arbeitsspeicher';

  function ablageOeffnen() {
    return new Promise(function (fertig) {
      var a;
      try { a = indexedDB.open('pizzaplan', 2); } catch (e) { return fertig(null); }
      a.onupgradeneeded = function () {
        if (!a.result.objectStoreNames.contains('kv')) a.result.createObjectStore('kv');
      };
      a.onsuccess = function () { fertig(a.result); };
      a.onerror = function () { fertig(null); };
      setTimeout(function () { fertig(null); }, 4000);
    });
  }

  function ablageLesen() {
    return new Promise(function (fertig) {
      if (!ablage) return fertig(null);
      try {
        var t = ablage.transaction('kv', 'readonly').objectStore('kv').get(ABLAGE);
        t.onsuccess = function () { fertig(t.result || null); };
        t.onerror = function () { fertig(null); };
      } catch (e) { fertig(null); }
    });
  }

  var schreibZeit = null;
  function ablageSchreiben(text) {
    if (ablage) {
      clearTimeout(schreibZeit);
      schreibZeit = setTimeout(function () {
        try {
          ablage.transaction('kv', 'readwrite').objectStore('kv').put(text, ABLAGE);
        } catch (e) { /* voll oder gesperrt */ }
      }, 120);
      return;
    }
    try { window.localStorage.setItem(ABLAGE, text); } catch (e) { /* gesperrt */ }
  }

  function ersatzLesen() {
    try { return window.localStorage.getItem(ABLAGE); } catch (e) { return null; }
  }

  var horcher = [];
  function sichern(still) {
    try { ablageSchreiben(JSON.stringify(D)); } catch (e) { /* egal */ }
    if (!still) horcher.forEach(function (f) { try { f(); } catch (e) { /* egal */ } });
  }

  function beiAenderung(f) { horcher.push(f); }

  function neueId(tabelle) {
    D.zaehler[tabelle] = (D.zaehler[tabelle] || 0) + 1;
    return D.zaehler[tabelle];
  }

  function zugangscode() {
    var z = 'abcdefghijkmnpqrstuvwxyz23456789', s = '';
    for (var i = 0; i < 12; i++) s += z[Math.floor(Math.random() * z.length)];
    return s;
  }

  function leerBau() {
    return {
      fassung: FASSUNG,
      mitarbeiter: [], schicht: [], wunsch: [], zeit: [], termin: [], vorlage: [],
      einstellung: Object.assign({}, STANDARD),
      zaehler: {}, ichId: 0, beispiel: 0
    };
  }

  function nachziehen() {
    Object.keys(STANDARD).forEach(function (k) {
      if (D.einstellung[k] === undefined || D.einstellung[k] === null) D.einstellung[k] = STANDARD[k];
    });
    ['mitarbeiter', 'schicht', 'wunsch', 'zeit', 'termin', 'vorlage'].forEach(function (t) {
      if (!Array.isArray(D[t])) D[t] = [];
    });
    if (!D.zaehler) D.zaehler = {};
    /* Zähler nie unter den höchsten vorhandenen Schlüssel fallen lassen. */
    ['mitarbeiter', 'schicht', 'wunsch', 'zeit', 'termin', 'vorlage'].forEach(function (t) {
      var hoch = D[t].reduce(function (a, x) { return Math.max(a, Number(x.id) || 0); }, 0);
      if ((D.zaehler[t] || 0) < hoch) D.zaehler[t] = hoch;
    });
    D.mitarbeiter.forEach(function (m) {
      if (!m.zugangscode) m.zugangscode = zugangscode();
      if (!m.sprache) m.sprache = 'de';
      if (m.aktiv === undefined) m.aktiv = 1;
    });
    D.fassung = FASSUNG;
  }

  function beispielFuellen() {
    TEAM_START.forEach(function (r) {
      D.mitarbeiter.push({
        id: neueId('mitarbeiter'), name: r[0], rolle: r[1], farbe: r[2], vertrag: r[3],
        ist_chef: r[4], stundenlohn: r[5], sprache: r[6],
        pin: '1234', telefon: '', email: '', wochenstunden: 0, urlaubstage: 0,
        eintritt: '', notiz: '', aktiv: 1, beispiel: 1, zugangscode: zugangscode()
      });
    });
    VORLAGEN_START.forEach(function (r) {
      D.vorlage.push({
        id: neueId('vorlage'), name: r[0], von: r[1], bis: r[2],
        pause_min: r[3], position: r[4], farbe: r[5]
      });
    });
    /* Zwei Wochen Beispielplan rund um heute. */
    var start = plusTage(wochenstart(heute()), -7);
    var muster = [
      [1, '11:00', '15:00', 0, 'Service'],
      [2, '16:30', '23:30', 30, 'Küche'],
      [3, '17:30', '22:30', 0, 'Lieferung'],
      [4, '17:00', '23:00', 30, 'Theke']
    ];
    for (var t = 0; t < 21; t++) {
      var datum = plusTage(start, t);
      muster.forEach(function (r, i) {
        if ((t + i) % 4 === 3) return;                 // nicht jeder arbeitet jeden Tag
        var m = D.mitarbeiter[r[0]];
        if (!m) return;
        D.schicht.push({
          id: neueId('schicht'), datum: datum, von: r[1], bis: r[2], pause_min: r[3],
          mitarbeiter_id: m.id, position: r[4], notiz: '',
          veroeffentlicht: datum <= plusTage(heute(), 6) ? 1 : 0, beispiel: 1
        });
      });
    }
    /* Ein paar erfasste Zeiten der Vorwoche, damit die Auswertung etwas zeigt. */
    D.schicht.filter(function (s) { return s.datum < heute() && s.mitarbeiter_id; })
      .forEach(function (s) {
        D.zeit.push({
          id: neueId('zeit'), mitarbeiter_id: s.mitarbeiter_id, datum: s.datum,
          start: s.von, ende: s.bis, pause_min: s.pause_min, quelle: 'Stempel',
          bemerkung: '', freigegeben: s.datum < plusTage(heute(), -3) ? 1 : 0, beispiel: 1
        });
      });
    /* Ein paar Wünsche und Termine, damit die Bereiche nicht leer wirken. */
    [[1, 4, 5, 'Frei-Wunsch', 'offen', 'Hochzeit einer Freundin'],
      [3, 9, 13, 'Urlaub', 'genehmigt', ''],
      [4, -2, -2, 'Krank', 'genehmigt', '']].forEach(function (r) {
      var m = D.mitarbeiter[r[0]];
      if (!m) return;
      D.wunsch.push({
        id: neueId('wunsch'), mitarbeiter_id: m.id,
        von_datum: plusTage(heute(), r[1]), bis_datum: plusTage(heute(), r[2]),
        typ: r[3], status: r[4], bemerkung: r[5],
        erstellt: new Date().toISOString().slice(0, 19), beispiel: 1
      });
    });
    [['Lieferung Getränke', 2, '09:00', 'Lieferant', 60],
      ['Steuerberater – Unterlagen', 6, '14:00', 'Steuerberater', 1440],
      ['Wartung Pizzaofen', 12, '10:00', 'Wartung', 1440]].forEach(function (r) {
      D.termin.push({
        id: neueId('termin'), titel: r[0], datum: plusTage(heute(), r[1]), von_zeit: r[2],
        bis_zeit: '', ganztags: 0, ort: '', kategorie: r[3], notiz: '',
        erinnerung_min: r[4], erledigt: 0, wiederholung: 'keine', quelle: 'Beispiel',
        erinnert: 1, beispiel: 1
      });
    });
    D.beispiel = 1;
  }

  async function laden() {
    ablage = await ablageOeffnen();
    var roh = null;
    try { roh = JSON.parse((await ablageLesen()) || ersatzLesen() || 'null'); } catch (e) { roh = null; }
    speicherArt = ablage ? 'Browserspeicher (groß)' : (ersatzLesen() !== null || window.localStorage
      ? 'Browserspeicher (klein)' : 'Arbeitsspeicher');
    if (roh && Array.isArray(roh.mitarbeiter) && roh.mitarbeiter.length) {
      D = roh;
      nachziehen();
      return;
    }
    D = leerBau();
    beispielFuellen();
    sichern(true);
  }

  /* =========================================================================
     5 · Rückgängig
     ========================================================================= */

  var stapel = [];

  function merken(was) {
    try { stapel.push({ was: was, stand: JSON.stringify(D) }); } catch (e) { return; }
    if (stapel.length > 25) stapel.shift();
  }

  function rueckgaengigMoeglich() { return stapel.length > 0; }

  function letzteAktion() { return stapel.length ? stapel[stapel.length - 1].was : ''; }

  function rueckgaengig() {
    var e = stapel.pop();
    if (!e) throw Fehler('Es gibt nichts zum Rückgängigmachen.');
    D = JSON.parse(e.stand);
    sichern();
    return e.was;
  }

  /* =========================================================================
     6 · Einstellungen, Stammlisten
     ========================================================================= */

  function E() { return D.einstellung; }

  function einst(schluessel) {
    var w = D.einstellung[schluessel];
    return w === undefined ? '' : w;
  }

  function einstZahl(schluessel) { return Number(String(einst(schluessel)).replace(',', '.')) || 0; }

  function einstSetzen(werte) {
    merken('Einstellungen geändert');
    Object.keys(werte).forEach(function (k) { D.einstellung[k] = String(werte[k]); });
    sichern();
  }

  function positionen() {
    return String(einst('positionen') || '').split(',')
      .map(function (s) { return s.trim(); }).filter(Boolean);
  }

  function terminKategorien() {
    return String(einst('termin_kategorien') || '').split(',')
      .map(function (s) { return s.trim(); }).filter(Boolean);
  }

  function nachName(a, b) { return String(a.name).localeCompare(String(b.name), 'de'); }

  /* Vergleichsschlüssel für Namen: Groß-/Kleinschreibung, Satzzeichen und die
     Reihenfolge sind egal. „Rossi Anna“ und „Anna Rossi“ sind damit dieselbe Person. */
  function nameSchluessel(name) {
    return String(name || '').toLowerCase()
      .replace(/[.,;]/g, ' ')
      .split(/[\s-]+/)
      .filter(Boolean)
      .sort()
      .join(' ');
  }

  /* =========================================================================
     7 · Mitarbeiter
     ========================================================================= */

  function ma(id) {
    return D.mitarbeiter.find(function (m) { return Number(m.id) === Number(id); }) || null;
  }

  function maName(id) { var m = ma(id); return m ? m.name : ''; }

  function maListe(auchInaktive) {
    return D.mitarbeiter
      .filter(function (m) { return auchInaktive ? true : m.aktiv; })
      .slice()
      .sort(function (a, b) {
        return (b.aktiv ? 1 : 0) - (a.aktiv ? 1 : 0)
          || (b.ist_chef ? 1 : 0) - (a.ist_chef ? 1 : 0)
          || nachName(a, b);
      })
      .map(function (m) { return Object.assign({}, m); });
  }

  var MA_FELDER = ['name', 'rolle', 'farbe', 'pin', 'telefon', 'email', 'wochenstunden',
    'stundenlohn', 'vertrag', 'urlaubstage', 'eintritt', 'aktiv', 'ist_chef', 'notiz', 'sprache'];

  function maSpeichern(d) {
    var name = String(d.name || '').trim();
    if (!name) throw Fehler('Bitte einen Namen eintragen.');
    if (d.email && !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(String(d.email).trim())) {
      throw Fehler('Die E-Mail-Adresse sieht nicht richtig aus.');
    }
    var doppelt = D.mitarbeiter.find(function (m) {
      return Number(m.id) !== Number(d.id || 0)
        && nameSchluessel(m.name) === nameSchluessel(name);
    });
    if (doppelt) throw Fehler('„' + doppelt.name + '“ steht schon im Team.');
    merken(d.id ? 'Mitarbeiter geändert' : 'Mitarbeiter angelegt');
    var ziel = d.id ? ma(d.id) : null;
    if (!ziel) {
      ziel = { id: neueId('mitarbeiter'), zugangscode: zugangscode(), beispiel: 0 };
      D.mitarbeiter.push(ziel);
    }
    MA_FELDER.forEach(function (f) { if (d[f] !== undefined) ziel[f] = d[f]; });
    ziel.name = name;
    ziel.aktiv = d.aktiv ? 1 : 0;
    ziel.ist_chef = d.ist_chef ? 1 : 0;
    ziel.stundenlohn = Number(String(d.stundenlohn || 0).replace(',', '.')) || 0;
    ziel.wochenstunden = Number(String(d.wochenstunden || 0).replace(',', '.')) || 0;
    ziel.urlaubstage = Number(d.urlaubstage || 0) || 0;
    ziel.beispiel = 0;
    sichern();
    return ziel.id;
  }

  function maLoeschen(id) {
    var m = ma(id);
    if (!m) throw Fehler('Diesen Mitarbeiter gibt es nicht mehr.');
    merken('Mitarbeiter „' + m.name + '“ entfernt');
    var hatZeiten = D.zeit.some(function (z) { return Number(z.mitarbeiter_id) === Number(id); });
    if (hatZeiten) {
      m.aktiv = 0;
      sichern();
      return 'Für ' + m.name + ' sind Arbeitszeiten erfasst – der Eintrag wurde deshalb nur '
        + 'auf inaktiv gesetzt.';
    }
    D.mitarbeiter = D.mitarbeiter.filter(function (x) { return Number(x.id) !== Number(id); });
    D.wunsch = D.wunsch.filter(function (w) { return Number(w.mitarbeiter_id) !== Number(id); });
    D.schicht.forEach(function (s) {
      if (Number(s.mitarbeiter_id) === Number(id)) s.mitarbeiter_id = null;
    });
    sichern();
    return m.name + ' wurde entfernt.';
  }

  function beispielEntfernen() {
    merken('Beispieldaten entfernt');
    D.mitarbeiter = D.mitarbeiter.filter(function (m) { return !m.beispiel; });
    var bleiben = {};
    D.mitarbeiter.forEach(function (m) { bleiben[m.id] = 1; });
    D.schicht = D.schicht.filter(function (s) {
      return !s.beispiel && (!s.mitarbeiter_id || bleiben[s.mitarbeiter_id]);
    });
    D.zeit = D.zeit.filter(function (z) { return !z.beispiel && bleiben[z.mitarbeiter_id]; });
    D.wunsch = D.wunsch.filter(function (w) { return !w.beispiel && bleiben[w.mitarbeiter_id]; });
    D.termin = D.termin.filter(function (t) { return !t.beispiel; });
    D.beispiel = 0;
    sichern();
  }

  function hatBeispieldaten() {
    return D.mitarbeiter.some(function (m) { return m.beispiel; });
  }

  /* =========================================================================
     8 · Mitarbeiter einlesen (Import)
     ========================================================================= */

  /* Erkennt Semikolon, Komma oder Tabulator und kommt mit Anführungszeichen klar. */
  function tabelleLesen(text) {
    var roh = String(text || '').replace(/^﻿/, '').replace(/\r\n?/g, '\n').trim();
    if (!roh) return [];
    var erste = roh.split('\n')[0];
    var kandidaten = [';', '\t', ','];
    var trenner = kandidaten.map(function (t) {
      return { t: t, n: erste.split(t).length };
    }).sort(function (a, b) { return b.n - a.n; })[0];
    var tz = trenner.n > 1 ? trenner.t : ';';

    var zeilen = [], feld = '', zeile = [], inAnf = false;
    for (var i = 0; i < roh.length; i++) {
      var c = roh[i];
      if (inAnf) {
        if (c === '"') {
          if (roh[i + 1] === '"') { feld += '"'; i++; } else inAnf = false;
        } else feld += c;
      } else if (c === '"' && feld === '') inAnf = true;
      else if (c === tz) { zeile.push(feld); feld = ''; }
      else if (c === '\n') { zeile.push(feld); zeilen.push(zeile); zeile = []; feld = ''; }
      else feld += c;
    }
    zeile.push(feld);
    zeilen.push(zeile);
    return zeilen.filter(function (z) {
      return z.some(function (f) { return String(f).trim() !== ''; });
    }).map(function (z) { return z.map(function (f) { return String(f).trim(); }); });
  }

  /* Welche Spalte ist was? Es zählt der Anfang der Überschrift, deutsch oder italienisch. */
  var SPALTEN = [
    ['name', ['name', 'mitarbeiter', 'nome', 'nominativo', 'dipendente', 'vor- und nachname']],
    ['rolle', ['rolle', 'position', 'funktion', 'bereich', 'ruolo', 'mansione', 'reparto']],
    ['vertrag', ['vertrag', 'anstellung', 'vertragsart', 'contratto', 'tipo']],
    ['telefon', ['telefon', 'handy', 'mobil', 'nummer', 'telefono', 'cellulare']],
    ['email', ['mail', 'e-mail', 'email', 'posta']],
    ['stundenlohn', ['stundenlohn', 'lohn', 'stundensatz', 'paga', 'retribuzione', 'euro']],
    ['wochenstunden', ['wochenstunden', 'stunden pro woche', 'sollstunden', 'ore settimanali', 'ore']],
    ['urlaubstage', ['urlaub', 'urlaubstage', 'ferien', 'ferie']],
    ['eintritt', ['eintritt', 'eintrittsdatum', 'seit', 'beginn', 'assunzione', 'data']],
    ['sprache', ['sprache', 'lingua']],
    ['notiz', ['notiz', 'bemerkung', 'hinweis', 'nota', 'note']]
  ];

  function spalteErkennen(ueberschrift) {
    var u = String(ueberschrift || '').toLowerCase().replace(/[^a-zäöüß0-9 -]/g, '').trim();
    if (!u) return '';
    var treffer = '';
    SPALTEN.forEach(function (s) {
      if (treffer) return;
      s[1].forEach(function (w) {
        if (!treffer && (u === w || u.indexOf(w) === 0)) treffer = s[0];
      });
    });
    return treffer;
  }

  /* Erkennt, ob die erste Zeile Überschriften enthält. */
  function hatUeberschrift(zeilen) {
    if (!zeilen.length) return false;
    var erkannt = zeilen[0].filter(function (f) { return spalteErkennen(f); }).length;
    return erkannt >= 2;
  }

  var VERTRAEGE = ['Vollzeit', 'Teilzeit', 'Minijob', 'Aushilfe', 'Azubi', 'Werkstudent'];

  function vertragNormieren(w) {
    var t = String(w || '').toLowerCase().trim();
    if (!t) return 'Teilzeit';
    if (/voll|full|pieno|tempo pieno/.test(t)) return 'Vollzeit';
    if (/mini|geringf|450|538|556/.test(t)) return 'Minijob';
    if (/aushilf|kurzfr/.test(t)) return 'Aushilfe';
    if (/azubi|ausbild|lehr|apprend/.test(t)) return 'Azubi';
    if (/werkstud|student/.test(t)) return 'Werkstudent';
    if (/teil|part|parziale/.test(t)) return 'Teilzeit';
    var passend = VERTRAEGE.find(function (v) { return v.toLowerCase() === t; });
    return passend || 'Teilzeit';
  }

  function zahlLesen(w) {
    var t = String(w || '').replace(/[^0-9,.\-]/g, '').trim();
    if (!t) return 0;
    if (t.indexOf(',') >= 0 && t.indexOf('.') >= 0) t = t.replace(/\./g, '');
    return Number(t.replace(',', '.')) || 0;
  }

  function datumLesen(w) {
    var t = String(w || '').trim();
    if (!t) return '';
    var m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(t);
    if (m) return iso(Number(m[1]), Number(m[2]), Number(m[3]));
    m = /^(\d{1,2})[.\/](\d{1,2})[.\/](\d{2,4})/.exec(t);
    if (m) {
      var j = Number(m[3]);
      if (j < 100) j += j < 70 ? 2000 : 1900;
      var k = iso(j, Number(m[2]), Number(m[1]));
      return datumGueltig(k) ? k : '';
    }
    return '';
  }

  var FARBTOPF = ['#c0392b', '#3d8bfd', '#e67e22', '#16a085', '#8e44ad', '#2e86c1',
    '#d35400', '#27ae60', '#7f8c8d', '#b03a2e', '#1f618d', '#af601a'];

  function farbeFuer(nr) { return FARBTOPF[nr % FARBTOPF.length]; }

  /* Liest eine Tabelle und liefert eine Vorschau – gespeichert wird noch nichts. */
  function importPruefen(text, zuordnungVorgabe) {
    var zeilen = tabelleLesen(text);
    if (!zeilen.length) throw Fehler('In der Datei stand keine einzige Zeile.');

    var kopfDa = hatUeberschrift(zeilen);
    var kopf = kopfDa ? zeilen[0] : [];
    var daten = kopfDa ? zeilen.slice(1) : zeilen;

    var zuordnung = [];
    var breite = zeilen.reduce(function (a, z) { return Math.max(a, z.length); }, 0);
    for (var i = 0; i < breite; i++) {
      zuordnung.push(zuordnungVorgabe && zuordnungVorgabe[i] !== undefined
        ? zuordnungVorgabe[i]
        : (kopfDa ? spalteErkennen(kopf[i]) : (i === 0 ? 'name' : '')));
    }
    if (zuordnung.indexOf('name') < 0) {
      /* Ohne Überschrift: die erste Spalte mit Buchstaben ist der Name. */
      for (var j = 0; j < breite; j++) {
        if (/[a-zäöüA-ZÄÖÜ]{2,}/.test(daten[0] ? daten[0][j] || '' : '')) { zuordnung[j] = 'name'; break; }
      }
    }

    var bekannt = {};
    D.mitarbeiter.forEach(function (m) { bekannt[nameSchluessel(m.name)] = m; });
    var gesehen = {};
    var zeilenAus = [];

    daten.forEach(function (z, nr) {
      var s = { name: '', rolle: '', vertrag: '', telefon: '', email: '', stundenlohn: 0,
        wochenstunden: 0, urlaubstage: 0, eintritt: '', sprache: '', notiz: '' };
      zuordnung.forEach(function (feld, sp) {
        if (!feld) return;
        var w = (z[sp] === undefined ? '' : z[sp]).trim();
        if (!w) return;
        if (feld === 'stundenlohn' || feld === 'wochenstunden') s[feld] = zahlLesen(w);
        else if (feld === 'urlaubstage') s[feld] = Math.round(zahlLesen(w));
        else if (feld === 'eintritt') s[feld] = datumLesen(w);
        else if (feld === 'vertrag') s[feld] = vertragNormieren(w);
        else if (feld === 'sprache') s[feld] = /it|ital/i.test(w) ? 'it' : 'de';
        else s[feld] = w;
      });

      var hinweise = [];
      var art = 'neu';
      s.name = s.name.replace(/\s{2,}/g, ' ').trim();
      if (!s.name) { art = 'fehler'; hinweise.push('kein Name'); }
      else {
        var kl = nameSchluessel(s.name);
        if (gesehen[kl]) { art = 'fehler'; hinweise.push('steht in der Datei doppelt'); }
        else if (bekannt[kl]) {
          art = 'aktualisieren';
          hinweise.push('gibt es schon als „' + bekannt[kl].name + '“ – wird ergänzt');
        }
        gesehen[kl] = 1;
      }
      if (s.email && !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(s.email)) {
        hinweise.push('E-Mail-Adresse sieht komisch aus');
        s.email = '';
      }
      if (s.telefon) s.telefon = s.telefon.replace(/[^\d+ \/()-]/g, '').trim();
      if (!s.vertrag) s.vertrag = 'Teilzeit';
      if (!s.rolle) s.rolle = 'Service';
      if (s.stundenlohn && s.stundenlohn < einstZahl('mindestlohn')) {
        hinweise.push('Stundenlohn liegt unter dem Mindestlohn');
      }
      zeilenAus.push({ nr: nr + 1, art: art, satz: s, hinweise: hinweise });
    });

    return {
      kopf: kopfDa ? kopf : [],
      kopfDa: kopfDa,
      zuordnung: zuordnung,
      spaltenNamen: SPALTEN.map(function (s) { return s[0]; }),
      zeilen: zeilenAus,
      neu: zeilenAus.filter(function (z) { return z.art === 'neu'; }).length,
      aktualisieren: zeilenAus.filter(function (z) { return z.art === 'aktualisieren'; }).length,
      fehler: zeilenAus.filter(function (z) { return z.art === 'fehler'; }).length
    };
  }

  /* Übernimmt die geprüften Zeilen wirklich ins Team. */
  function importUebernehmen(pruefung, nurZeilen) {
    var nehmen = pruefung.zeilen.filter(function (z) {
      if (z.art === 'fehler') return false;
      return !nurZeilen || nurZeilen.indexOf(z.nr) >= 0;
    });
    if (!nehmen.length) throw Fehler('Es ist keine übernehmbare Zeile ausgewählt.');
    merken(nehmen.length + ' Mitarbeiter eingelesen');

    var neu = 0, geaendert = 0;
    nehmen.forEach(function (z) {
      var s = z.satz;
      var vorhanden = D.mitarbeiter.find(function (m) {
        return nameSchluessel(m.name) === nameSchluessel(s.name);
      });
      if (!vorhanden) {
        vorhanden = {
          id: neueId('mitarbeiter'), name: s.name, farbe: farbeFuer(D.mitarbeiter.length),
          pin: '1234', aktiv: 1, ist_chef: 0, beispiel: 0, zugangscode: zugangscode(),
          rolle: '', vertrag: 'Teilzeit', telefon: '', email: '', stundenlohn: 0,
          wochenstunden: 0, urlaubstage: 0, eintritt: '', sprache: 'de', notiz: ''
        };
        D.mitarbeiter.push(vorhanden);
        neu++;
      } else geaendert++;
      /* Nur gefüllte Werte überschreiben – Bestehendes bleibt sonst erhalten. */
      ['rolle', 'vertrag', 'telefon', 'email', 'eintritt', 'sprache', 'notiz'].forEach(function (f) {
        if (s[f]) vorhanden[f] = s[f];
      });
      ['stundenlohn', 'wochenstunden', 'urlaubstage'].forEach(function (f) {
        if (s[f]) vorhanden[f] = s[f];
      });
      vorhanden.beispiel = 0;
    });
    sichern();
    return { neu: neu, geaendert: geaendert };
  }

  var IMPORT_VORLAGE =
    'Name;Rolle;Vertrag;Telefon;E-Mail;Stundenlohn;Wochenstunden;Urlaubstage;Eintritt;Sprache;Notiz\r\n'
    + 'Rossi Anna;Service;Teilzeit;0170 1234567;anna.rossi@example.de;13,50;20;24;01.03.2024;it;\r\n'
    + 'Bianchi Marco;Küche;Vollzeit;0171 2345678;marco.bianchi@example.de;16,00;40;28;15.09.2022;it;Pizzaiolo\r\n'
    + 'Greco Luca;Lieferung;Minijob;0172 3456789;;13,00;10;10;01.06.2025;it;eigener Roller\r\n'
    + 'Meier Sara;Theke;Minijob;0175 4567890;sara.meier@example.de;13,00;10;10;;de;\r\n';

  /* =========================================================================
     9 · Dienstplan
     ========================================================================= */

  function schichten(von, bis, nurFreigegeben, maId) {
    return D.schicht
      .filter(function (s) { return s.datum >= von && s.datum <= bis; })
      .filter(function (s) { return nurFreigegeben ? s.veroeffentlicht : true; })
      .filter(function (s) { return maId ? Number(s.mitarbeiter_id) === Number(maId) : true; })
      .sort(function (a, b) {
        return a.datum.localeCompare(b.datum) || a.von.localeCompare(b.von);
      })
      .map(function (s) {
        var m = ma(s.mitarbeiter_id) || {};
        return Object.assign({}, s, {
          ma_name: m.name || '', farbe: m.farbe || '#7f8c8d',
          dauer_std: stunden(dauerMinuten(s.von, s.bis, s.pause_min))
        });
      });
  }

  function schicht(id) {
    return D.schicht.find(function (s) { return Number(s.id) === Number(id); }) || null;
  }

  /* Alles, was bei einer Schicht auffällt – wird angezeigt, blockiert aber nie. */
  function konflikte(s, eigeneId) {
    var warn = [];
    if (!s.mitarbeiter_id) return warn;
    var maId = Number(s.mitarbeiter_id);
    var a = minuten(s.von), b = minuten(s.bis);
    if (b <= a) b += 1440;

    D.schicht.filter(function (r) {
      return Number(r.mitarbeiter_id) === maId && r.datum === s.datum
        && (!eigeneId || Number(r.id) !== Number(eigeneId));
    }).forEach(function (r) {
      var c = minuten(r.von), e = minuten(r.bis);
      if (e <= c) e += 1440;
      if (a < e && c < b) warn.push('Überschneidet sich mit ' + r.von + '–' + r.bis + ' (' + r.position + ').');
    });

    D.wunsch.filter(function (w) {
      return Number(w.mitarbeiter_id) === maId && w.von_datum <= s.datum && w.bis_datum >= s.datum;
    }).forEach(function (w) {
      warn.push(w.status === 'genehmigt'
        ? 'An diesem Tag ist ' + w.typ + ' genehmigt.'
        : 'Für diesen Tag liegt ein offener Wunsch vor: ' + w.typ + '.');
    });

    var ruhe = einstZahl('ruhezeit_std') || 11;
    var vortag = plusTage(s.datum, -1);
    D.schicht.filter(function (r) {
      return Number(r.mitarbeiter_id) === maId && r.datum === vortag;
    }).forEach(function (r) {
      var ende = minuten(r.bis);
      if (minuten(r.bis) <= minuten(r.von)) ende += 1440;
      var pause = (a + 1440 - ende) / 60;
      if (pause >= 0 && pause < ruhe) {
        warn.push('Nur ' + pause.toFixed(1).replace('.', ',') + ' Stunden Ruhezeit nach der Schicht '
          + 'am Vortag (' + ruhe + ' empfohlen).');
      }
    });

    var wocheVon = wochenstart(s.datum);
    var geplant = D.schicht.filter(function (r) {
      return Number(r.mitarbeiter_id) === maId && r.datum >= wocheVon
        && r.datum <= plusTage(wocheVon, 6) && (!eigeneId || Number(r.id) !== Number(eigeneId));
    }).reduce(function (sum, r) { return sum + dauerMinuten(r.von, r.bis, r.pause_min); }, 0);
    var soll = Number((ma(maId) || {}).wochenstunden || 0);
    if (soll) {
      var neuGesamt = stunden(geplant + dauerMinuten(s.von, s.bis, s.pause_min));
      if (neuGesamt > soll + 0.01) {
        warn.push('Damit sind es ' + neuGesamt.toFixed(2).replace('.', ',') + ' Stunden in dieser '
          + 'Woche – vereinbart sind ' + soll + '.');
      }
    }
    return warn;
  }

  function schichtSpeichern(d) {
    if (!datumGueltig(d.datum)) throw Fehler('Bitte ein Datum wählen.');
    if (!/^\d{1,2}:\d{2}$/.test(d.von || '') || !/^\d{1,2}:\d{2}$/.test(d.bis || '')) {
      throw Fehler('Bitte Anfang und Ende als Uhrzeit eintragen.');
    }
    if (dauerMinuten(d.von, d.bis, d.pause_min || 0) <= 0) {
      throw Fehler('Diese Zeiten ergeben keine Arbeitszeit. Bitte Anfang, Ende und Pause prüfen.');
    }
    merken(d.id ? 'Schicht geändert' : 'Schicht angelegt');
    var s = d.id ? schicht(d.id) : null;
    if (!s) { s = { id: neueId('schicht'), beispiel: 0 }; D.schicht.push(s); }
    s.datum = d.datum;
    s.von = d.von;
    s.bis = d.bis;
    s.pause_min = Number(d.pause_min || 0);
    s.mitarbeiter_id = d.mitarbeiter_id ? Number(d.mitarbeiter_id) : null;
    s.position = d.position || positionen()[0] || 'Service';
    s.notiz = d.notiz || '';
    s.veroeffentlicht = d.veroeffentlicht ? 1 : 0;
    s.beispiel = 0;
    sichern();
    return { id: s.id, warnungen: konflikte(s, s.id) };
  }

  function schichtLoeschen(id) {
    merken('Schicht gelöscht');
    D.schicht = D.schicht.filter(function (s) { return Number(s.id) !== Number(id); });
    sichern();
  }

  function schichtVerschieben(id, neuesDatum, neueMaId) {
    var s = schicht(id);
    if (!s) throw Fehler('Diese Schicht gibt es nicht mehr.');
    merken('Schicht verschoben');
    s.datum = neuesDatum;
    if (neueMaId !== undefined) s.mitarbeiter_id = neueMaId ? Number(neueMaId) : null;
    s.veroeffentlicht = 0;
    sichern();
    return konflikte(s, s.id);
  }

  function wocheKopieren(quelleMontag, zielMontag) {
    var versatz = Math.round((ausIso(zielMontag) - ausIso(quelleMontag)) / 86400000);
    if (!versatz) throw Fehler('Quelle und Ziel sind dieselbe Woche.');
    merken('Woche übernommen');
    var bis = plusTage(quelleMontag, 6), anzahl = 0;
    D.schicht.filter(function (s) {
      return s.datum >= quelleMontag && s.datum <= bis;
    }).slice().forEach(function (r) {
      var neu = plusTage(r.datum, versatz);
      var da = D.schicht.some(function (s) {
        return s.datum === neu && s.von === r.von && s.bis === r.bis
          && Number(s.mitarbeiter_id || 0) === Number(r.mitarbeiter_id || 0);
      });
      if (da) return;
      D.schicht.push({
        id: neueId('schicht'), datum: neu, von: r.von, bis: r.bis, pause_min: r.pause_min,
        mitarbeiter_id: r.mitarbeiter_id, position: r.position, notiz: r.notiz,
        veroeffentlicht: 0, beispiel: 0
      });
      anzahl++;
    });
    sichern();
    return anzahl;
  }

  function wocheFreigeben(von, bis, wert) {
    merken(wert ? 'Plan freigegeben' : 'Freigabe zurückgenommen');
    var n = 0;
    D.schicht.forEach(function (s) {
      if (s.datum >= von && s.datum <= bis && !!s.veroeffentlicht !== !!wert) {
        s.veroeffentlicht = wert ? 1 : 0;
        n++;
      }
    });
    sichern();
    return n;
  }

  function wocheLeeren(von, bis) {
    merken('Woche geleert');
    var vorher = D.schicht.length;
    D.schicht = D.schicht.filter(function (s) { return !(s.datum >= von && s.datum <= bis); });
    sichern();
    return vorher - D.schicht.length;
  }

  /* =========================================================================
     10 · Wünsche und Abwesenheiten
     ========================================================================= */

  var WUNSCH_TYPEN = ['Frei-Wunsch', 'Urlaub', 'Krank', 'Schule', 'Termin', 'Sonstiges'];

  function wuensche(maId, status) {
    return D.wunsch
      .filter(function (w) { return maId ? Number(w.mitarbeiter_id) === Number(maId) : true; })
      .filter(function (w) { return status ? w.status === status : true; })
      .sort(function (a, b) { return b.von_datum.localeCompare(a.von_datum); })
      .map(function (w) {
        return Object.assign({}, w, { ma_name: maName(w.mitarbeiter_id) });
      });
  }

  function wunschSpeichern(d, zwangMaId) {
    var maId = zwangMaId || d.mitarbeiter_id;
    if (!maId) throw Fehler('Bitte einen Mitarbeiter wählen.');
    if (!datumGueltig(d.von_datum)) throw Fehler('Bitte ein Datum wählen.');
    var bis = datumGueltig(d.bis_datum) ? d.bis_datum : d.von_datum;
    if (bis < d.von_datum) throw Fehler('Das Ende liegt vor dem Anfang.');
    merken(d.id ? 'Eintrag geändert' : 'Wunsch eingetragen');
    var w = d.id ? D.wunsch.find(function (x) { return Number(x.id) === Number(d.id); }) : null;
    if (!w) { w = { id: neueId('wunsch') }; D.wunsch.push(w); }
    Object.assign(w, {
      mitarbeiter_id: Number(maId), von_datum: d.von_datum, bis_datum: bis,
      typ: d.typ || 'Frei-Wunsch', bemerkung: d.bemerkung || '',
      status: d.status || 'offen', erstellt: new Date().toISOString().slice(0, 19)
    });
    sichern();
    var hinweise = [];
    tageZwischen(d.von_datum, bis).forEach(function (t) {
      if (D.schicht.some(function (s) {
        return Number(s.mitarbeiter_id) === Number(maId) && s.datum === t;
      })) hinweise.push('Am ' + dm(t) + ' ist bereits eine Schicht geplant.');
    });
    return { id: w.id, warnungen: hinweise };
  }

  function wunschStatus(id, status) {
    if (['offen', 'genehmigt', 'abgelehnt'].indexOf(status) < 0) throw Fehler('Unbekannter Status.');
    merken('Wunsch ' + status);
    var w = D.wunsch.find(function (x) { return Number(x.id) === Number(id); });
    if (w) w.status = status;
    sichern();
  }

  function wunschLoeschen(id, zwangMaId) {
    merken('Eintrag gelöscht');
    D.wunsch = D.wunsch.filter(function (w) {
      return !(Number(w.id) === Number(id)
        && (!zwangMaId || Number(w.mitarbeiter_id) === Number(zwangMaId)));
    });
    sichern();
  }

  /* Ist jemand an diesem Tag abwesend? Liefert den Eintrag oder null. */
  function abwesend(maId, datum) {
    return D.wunsch.find(function (w) {
      return Number(w.mitarbeiter_id) === Number(maId) && w.status === 'genehmigt'
        && w.von_datum <= datum && w.bis_datum >= datum;
    }) || null;
  }

  function wunschOffen(maId, datum) {
    return D.wunsch.find(function (w) {
      return Number(w.mitarbeiter_id) === Number(maId) && w.status === 'offen'
        && w.von_datum <= datum && w.bis_datum >= datum;
    }) || null;
  }

  /* =========================================================================
     11 · Arbeitszeiten und Stempeluhr
     ========================================================================= */

  function zeiten(von, bis, maId) {
    return D.zeit
      .filter(function (z) { return z.datum >= von && z.datum <= bis; })
      .filter(function (z) { return maId ? Number(z.mitarbeiter_id) === Number(maId) : true; })
      .sort(function (a, b) {
        return b.datum.localeCompare(a.datum) || String(b.start).localeCompare(String(a.start));
      })
      .map(function (z) {
        return Object.assign({}, z, {
          ma_name: maName(z.mitarbeiter_id),
          dauer_std: z.ende ? stunden(dauerMinuten(z.start, z.ende, z.pause_min)) : 0
        });
      });
  }

  function pausenvorgabe(bruttoMin) {
    if (bruttoMin > 9 * 60) return einstZahl('pause_ab_9h') || 45;
    if (bruttoMin > 6 * 60) return einstZahl('pause_ab_6h') || 30;
    return 0;
  }

  function zeitSpeichern(d, zwangMaId) {
    var maId = zwangMaId || d.mitarbeiter_id;
    if (!maId) throw Fehler('Bitte einen Mitarbeiter wählen.');
    if (!datumGueltig(d.datum)) throw Fehler('Bitte ein Datum wählen.');
    if (!/^\d{1,2}:\d{2}$/.test(d.start || '')) throw Fehler('Bitte den Beginn eintragen.');
    if (d.ende && dauerMinuten(d.start, d.ende, d.pause_min || 0) <= 0) {
      throw Fehler('Diese Zeiten ergeben keine Arbeitszeit.');
    }
    merken(d.id ? 'Zeit geändert' : 'Zeit nachgetragen');
    var z = d.id ? D.zeit.find(function (x) { return Number(x.id) === Number(d.id); }) : null;
    if (!z) { z = { id: neueId('zeit'), beispiel: 0 }; D.zeit.push(z); }
    Object.assign(z, {
      mitarbeiter_id: Number(maId), datum: d.datum, start: d.start, ende: d.ende || '',
      pause_min: Number(d.pause_min || 0), quelle: d.quelle || 'Korrektur',
      bemerkung: d.bemerkung || '', freigegeben: d.freigegeben ? 1 : 0, beispiel: 0
    });
    sichern();
    return z.id;
  }

  function zeitLoeschen(id) {
    merken('Zeit gelöscht');
    D.zeit = D.zeit.filter(function (z) { return Number(z.id) !== Number(id); });
    sichern();
  }

  function zeitFreigeben(id, wert) {
    var z = D.zeit.find(function (x) { return Number(x.id) === Number(id); });
    if (!z) return;
    merken(wert ? 'Zeit freigegeben' : 'Freigabe zurückgenommen');
    z.freigegeben = wert ? 1 : 0;
    sichern();
  }

  function zeitenFreigeben(von, bis, maId) {
    merken('Zeiten freigegeben');
    var n = 0;
    D.zeit.forEach(function (z) {
      if (z.datum >= von && z.datum <= bis && z.ende && !z.freigegeben
        && (!maId || Number(z.mitarbeiter_id) === Number(maId))) {
        z.freigegeben = 1;
        n++;
      }
    });
    sichern();
    return n;
  }

  function stempelStatus(maId) {
    var laufend = D.zeit.filter(function (z) {
      return Number(z.mitarbeiter_id) === Number(maId) && !z.ende;
    }).sort(function (a, b) { return b.id - a.id; })[0] || null;
    var heuteRows = D.zeit.filter(function (z) {
      return Number(z.mitarbeiter_id) === Number(maId) && z.datum === heute();
    }).sort(function (a, b) { return String(a.start).localeCompare(String(b.start)); });
    var ges = heuteRows.filter(function (z) { return z.ende; })
      .reduce(function (s, z) { return s + dauerMinuten(z.start, z.ende, z.pause_min); }, 0);
    return { laufend: laufend, heute_std: stunden(ges), heute: heuteRows.slice() };
  }

  function stempeln(maId, aktion, pauseMin) {
    var offen = D.zeit.filter(function (z) {
      return Number(z.mitarbeiter_id) === Number(maId) && !z.ende;
    }).sort(function (a, b) { return b.id - a.id; })[0] || null;

    if (aktion === 'start') {
      if (offen) throw Fehler('Es läuft schon eine Schicht. Bitte zuerst Feierabend stempeln.');
      merken('eingestempelt');
      D.zeit.push({
        id: neueId('zeit'), mitarbeiter_id: Number(maId), datum: heute(), start: jetztZeit(),
        ende: '', pause_min: 0, quelle: 'Stempel', bemerkung: '', freigegeben: 0, beispiel: 0
      });
      sichern();
      return { text: 'Kommen gestempelt um ' + jetztZeit() + ' Uhr.', zeit: jetztZeit() };
    }
    if (aktion === 'stop') {
      if (!offen) throw Fehler('Gerade läuft keine Schicht.');
      merken('ausgestempelt');
      var ende = jetztZeit();
      var vorgabe = pausenvorgabe(dauerMinuten(offen.start, ende, 0));
      var pause = (pauseMin === null || pauseMin === undefined || pauseMin === '')
        ? vorgabe : Number(pauseMin);
      offen.ende = ende;
      offen.pause_min = pause;
      sichern();
      var std = stunden(dauerMinuten(offen.start, ende, pause));
      return {
        text: 'Feierabend um ' + ende + ' Uhr – ' + std.toFixed(2).replace('.', ',') + ' Stunden.',
        zeit: ende, pause_min: pause, stunden: std
      };
    }
    throw Fehler('Unbekannte Aktion.');
  }

  /* =========================================================================
     12 · Auswertung
     ========================================================================= */

  function monatsgrenzen(monat) {
    if (!/^\d{4}-\d{2}$/.test(monat || '')) throw Fehler('Bitte einen Monat wählen.');
    var j = Number(monat.slice(0, 4)), m = Number(monat.slice(5, 7));
    return [iso(j, m, 1), alsIso(new Date(j, m, 0))];
  }

  function auswertung(monat, maId) {
    var g = monatsgrenzen(monat);
    var von = g[0], bis = g[1];
    var zs = einstZahl('zuschlag_sonntag');
    var zn = einstZahl('zuschlag_nacht');
    var nachtAb = einst('nacht_ab') || '22:00';
    var grenze = einstZahl('minijob_grenze');
    var zeilen = [];

    D.mitarbeiter.slice().sort(nachName).forEach(function (m) {
      if (maId && Number(m.id) !== Number(maId)) return;
      var rows = D.zeit.filter(function (z) {
        return Number(z.mitarbeiter_id) === Number(m.id) && z.datum >= von && z.datum <= bis && z.ende;
      }).sort(function (a, b) {
        return a.datum.localeCompare(b.datum) || String(a.start).localeCompare(String(b.start));
      });
      if (!rows.length && !maId && !m.aktiv) return;

      var ges = 0, son = 0, nac = 0, tage = [];
      rows.forEach(function (r) {
        var d = dauerMinuten(r.start, r.ende, r.pause_min);
        ges += d;
        if (istSonntag(r.datum)) son += d;
        nac += Math.min(nachtMinuten(r.start, r.ende, nachtAb), d);
        tage.push({
          id: r.id, datum: r.datum, start: r.start, ende: r.ende, pause_min: r.pause_min,
          std: stunden(d), quelle: r.quelle, freigegeben: r.freigegeben, bemerkung: r.bemerkung
        });
      });

      var lohn = Number(m.stundenlohn || 0);
      var grund = stunden(ges) * lohn;
      var zuschlag = stunden(son) * lohn * zs / 100 + stunden(nac) * lohn * zn / 100;
      var geplantMin = D.schicht.filter(function (s) {
        return Number(s.mitarbeiter_id) === Number(m.id) && s.datum >= von && s.datum <= bis;
      }).reduce(function (sum, s) { return sum + dauerMinuten(s.von, s.bis, s.pause_min); }, 0);
      var urlaub = D.wunsch.filter(function (w) {
        return Number(w.mitarbeiter_id) === Number(m.id) && w.status === 'genehmigt' && w.typ === 'Urlaub';
      }).reduce(function (sum, w) {
        return sum + tageZwischen(w.von_datum, w.bis_datum)
          .filter(function (t) { return t >= von && t <= bis; }).length;
      }, 0);
      var krank = D.wunsch.filter(function (w) {
        return Number(w.mitarbeiter_id) === Number(m.id) && w.status === 'genehmigt' && w.typ === 'Krank';
      }).reduce(function (sum, w) {
        return sum + tageZwischen(w.von_datum, w.bis_datum)
          .filter(function (t) { return t >= von && t <= bis; }).length;
      }, 0);

      zeilen.push({
        mitarbeiter_id: m.id, name: m.name, rolle: m.rolle, vertrag: m.vertrag, farbe: m.farbe,
        stundenlohn: lohn, stunden: stunden(ges), sonntag_std: stunden(son), nacht_std: stunden(nac),
        geplant_std: stunden(geplantMin),
        differenz_std: Math.round((stunden(ges) - stunden(geplantMin)) * 100) / 100,
        urlaubstage: urlaub, kranktage: krank,
        offen: rows.filter(function (r) { return !r.freigegeben; }).length,
        grundlohn: Math.round(grund * 100) / 100,
        zuschlaege: Math.round(zuschlag * 100) / 100,
        gesamt: Math.round((grund + zuschlag) * 100) / 100,
        ueber_grenze: !!(grenze && (grund + zuschlag) > grenze && m.vertrag === 'Minijob'),
        anteil_grenze: grenze ? Math.min(1, (grund + zuschlag) / grenze) : 0,
        tage: tage
      });
    });

    return {
      monat: monat, von: von, bis: bis, zeilen: zeilen,
      zuschlag_sonntag: zs, zuschlag_nacht: zn, minijob_grenze: grenze,
      summe_stunden: Math.round(zeilen.reduce(function (s, z) { return s + z.stunden; }, 0) * 100) / 100,
      summe_lohn: Math.round(zeilen.reduce(function (s, z) { return s + z.gesamt; }, 0) * 100) / 100
    };
  }

  function auswertungCsv(monat) {
    var d = auswertung(monat);
    var k = function (n) { return Number(n || 0).toFixed(2).replace('.', ','); };
    var zeilen = ['Mitarbeiter;Rolle;Vertrag;Stunden;geplant;Differenz;davon Sonntag;davon Nacht;'
      + 'Urlaubstage;Kranktage;Stundenlohn;Grundlohn;Zuschlaege;Gesamt'];
    d.zeilen.forEach(function (z) {
      zeilen.push([z.name, z.rolle, z.vertrag, k(z.stunden), k(z.geplant_std), k(z.differenz_std),
        k(z.sonntag_std), k(z.nacht_std), z.urlaubstage, z.kranktage, k(z.stundenlohn),
        k(z.grundlohn), k(z.zuschlaege), k(z.gesamt)].join(';'));
    });
    zeilen.push('');
    zeilen.push('Summe;;;' + k(d.summe_stunden) + ';;;;;;;;;;' + k(d.summe_lohn));
    return zeilen.join('\r\n');
  }

  /* =========================================================================
     13 · Übersicht
     ========================================================================= */

  function uebersicht() {
    var h = heute();
    var mo = wochenstart(h), so = plusTage(mo, 6);
    var wocheMin = D.schicht.filter(function (s) { return s.datum >= mo && s.datum <= so; })
      .reduce(function (s, w) { return s + dauerMinuten(w.von, w.bis, w.pause_min); }, 0);
    return {
      woche_von: mo, woche_bis: so,
      offene_wuensche: D.wunsch.filter(function (w) { return w.status === 'offen'; }).length,
      unbesetzt: D.schicht.filter(function (s) { return !s.mitarbeiter_id && s.datum >= h; }).length,
      nicht_freigegeben: D.schicht.filter(function (s) {
        return !s.veroeffentlicht && s.datum >= h;
      }).length,
      offene_zeiten: D.zeit.filter(function (z) { return z.ende && !z.freigegeben; }).length,
      wochenstunden: stunden(wocheMin),
      eingestempelt: D.zeit.filter(function (z) { return !z.ende; }).map(function (z) {
        return Object.assign({}, z, { ma_name: maName(z.mitarbeiter_id) });
      }),
      heute: schichten(h, h, false, null),
      team_aktiv: D.mitarbeiter.filter(function (m) { return m.aktiv; }).length,
      termine: D.termin.filter(function (t) {
        return !t.erledigt && t.datum >= h && t.datum <= plusTage(h, 14);
      }).sort(function (a, b) {
        return a.datum.localeCompare(b.datum)
          || (a.von_zeit || '00:00').localeCompare(b.von_zeit || '00:00');
      }).slice(0, 8).map(function (t) { return Object.assign({}, t); })
    };
  }

  /* Besetzung je Tag: wie viele Leute stehen wann im Plan? */
  function besetzung(von, bis) {
    var aus = [];
    tageZwischen(von, bis).forEach(function (t) {
      var rows = D.schicht.filter(function (s) { return s.datum === t; });
      aus.push({
        datum: t,
        anzahl: rows.length,
        offen: rows.filter(function (s) { return !s.mitarbeiter_id; }).length,
        stunden: stunden(rows.reduce(function (s, r) {
          return s + dauerMinuten(r.von, r.bis, r.pause_min);
        }, 0))
      });
    });
    return aus;
  }

  /* =========================================================================
     14 · Termine
     ========================================================================= */

  function termine(von, bis, nurOffene) {
    return D.termin
      .filter(function (t) { return von ? t.datum >= von : true; })
      .filter(function (t) { return bis ? t.datum <= bis : true; })
      .filter(function (t) { return nurOffene ? !t.erledigt : true; })
      .sort(function (a, b) {
        return a.datum.localeCompare(b.datum)
          || (a.von_zeit || '00:00').localeCompare(b.von_zeit || '00:00');
      })
      .map(function (t) { return Object.assign({}, t); });
  }

  function terminSpeichern(d) {
    if (!String(d.titel || '').trim()) throw Fehler('Bitte einen Titel eintragen.');
    if (!datumGueltig(d.datum)) throw Fehler('Bitte ein Datum wählen.');
    if (d.von_zeit && d.bis_zeit && !d.ganztags && minuten(d.bis_zeit) <= minuten(d.von_zeit)) {
      throw Fehler('Das Ende liegt vor dem Anfang.');
    }
    merken(d.id ? 'Termin geändert' : 'Termin angelegt');
    var t = d.id ? D.termin.find(function (x) { return Number(x.id) === Number(d.id); }) : null;
    if (!t) {
      t = { id: neueId('termin'), erstellt: new Date().toISOString().slice(0, 19) };
      D.termin.push(t);
    }
    Object.assign(t, {
      titel: String(d.titel).trim(), datum: d.datum, von_zeit: d.von_zeit || '',
      bis_zeit: d.bis_zeit || '', ganztags: d.ganztags ? 1 : 0, ort: d.ort || '',
      kategorie: d.kategorie || 'Allgemein', notiz: d.notiz || '',
      erinnerung_min: Number(d.erinnerung_min || 0), erledigt: d.erledigt ? 1 : 0,
      wiederholung: d.wiederholung || 'keine', quelle: d.quelle || 'Formular', erinnert: 0
    });
    sichern();
    return t.id;
  }

  function terminLoeschen(id) {
    merken('Termin gelöscht');
    D.termin = D.termin.filter(function (t) { return Number(t.id) !== Number(id); });
    sichern();
  }

  function terminErledigt(id, wert) {
    var t = D.termin.find(function (x) { return Number(x.id) === Number(id); });
    if (!t) return;
    merken(wert ? 'Termin erledigt' : 'Termin wieder offen');
    t.erledigt = wert ? 1 : 0;
    sichern();
  }

  function naechsteWiederholung(t) {
    var d = t.datum, h = heute(), schutz = 0;
    if (t.wiederholung === 'taeglich') { while (d < h && schutz++ < 800) d = plusTage(d, 1); }
    else if (t.wiederholung === 'woechentlich') { while (d < h && schutz++ < 400) d = plusTage(d, 7); }
    else if (t.wiederholung === 'monatlich') {
      while (d < h && schutz++ < 120) {
        var x = ausIso(d), j = x.getFullYear(), mo = x.getMonth() + 1;
        if (mo === 12) { mo = 1; j++; } else mo++;
        d = iso(j, mo, Math.min(x.getDate(), new Date(j, mo, 0).getDate()));
      }
    }
    return d;
  }

  function terminErinnerungen() {
    var jetzt = new Date(), faellig = [];
    D.termin.filter(function (t) { return !t.erledigt && t.erinnerung_min; }).forEach(function (t) {
      var d = naechsteWiederholung(t);
      if (t.wiederholung !== 'keine' && d !== t.datum) { t.datum = d; t.erinnert = 0; }
      if (t.erinnert) return;
      var zeit = t.von_zeit || '09:00';
      var p = ausIso(t.datum);
      var start = new Date(p.getFullYear(), p.getMonth(), p.getDate(),
        Math.floor(minuten(zeit) / 60), minuten(zeit) % 60);
      var weck = new Date(start.getTime() - t.erinnerung_min * 60000);
      if (weck <= jetzt && jetzt <= new Date(start.getTime() + 12 * 3600000)) {
        faellig.push(Object.assign({}, t, {
          minuten_bis: Math.floor((start - jetzt) / 60000)
        }));
        t.erinnert = 1;
      }
    });
    if (faellig.length) sichern(true);
    return faellig;
  }

  function terminSchlummern(id) {
    var t = D.termin.find(function (x) { return Number(x.id) === Number(id); });
    if (t) { t.erinnert = 0; sichern(true); }
  }

  /* =========================================================================
     15 · Plan als Text, Versand
     ========================================================================= */

  var WT_KURZ = { de: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
    it: ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'] };
  var WT_LANG = {
    de: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'],
    it: ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica']
  };

  function planText(maId, von, bis, sprache) {
    var s = sprache === 'it' ? 'it' : 'de';
    var rows = D.schicht.filter(function (r) {
      return Number(r.mitarbeiter_id) === Number(maId) && r.datum >= von && r.datum <= bis
        && r.veroeffentlicht;
    }).sort(function (a, b) {
      return a.datum.localeCompare(b.datum) || a.von.localeCompare(b.von);
    });
    if (!rows.length) {
      return s === 'it' ? 'In questo periodo non sei in turno.'
        : 'In diesem Zeitraum ist für dich nichts eingeplant.';
    }
    var ges = 0;
    var zeilen = rows.map(function (r) {
      ges += dauerMinuten(r.von, r.bis, r.pause_min);
      return WT_KURZ[s][wochentag(r.datum)] + ' ' + dm(r.datum) + '  ' + r.von + '–' + r.bis
        + '  ' + r.position + (r.notiz ? '  (' + r.notiz + ')' : '');
    });
    zeilen.push('');
    zeilen.push((s === 'it' ? 'Totale: ' : 'Summe: ')
      + stunden(ges).toFixed(2).replace('.', ',') + (s === 'it' ? ' ore' : ' Stunden'));
    return zeilen.join('\n');
  }

  function planTextGesamt(von, bis, sprache) {
    var s = sprache === 'it' ? 'it' : 'de';
    var rows = D.schicht.filter(function (r) {
      return r.datum >= von && r.datum <= bis && r.veroeffentlicht;
    }).sort(function (a, b) {
      return a.datum.localeCompare(b.datum) || a.von.localeCompare(b.von);
    });
    var aus = [], letzter = '';
    rows.forEach(function (r) {
      if (r.datum !== letzter) {
        aus.push('');
        aus.push(WT_LANG[s][wochentag(r.datum)] + ' ' + dmy(r.datum));
        letzter = r.datum;
      }
      aus.push('  ' + r.von + '–' + r.bis + '  '
        + (maName(r.mitarbeiter_id) || (s === 'it' ? 'ancora libero' : 'noch offen'))
        + '  (' + r.position + ')');
    });
    return aus.join('\n').trim()
      || (s === 'it' ? 'In questo periodo non è pubblicato nulla.'
        : 'Im gewählten Zeitraum ist nichts freigegeben.');
  }

  function nachricht(m, von, bis, basis) {
    var s = m.sprache === 'it' ? 'it' : 'de';
    var vorlage = einst(s === 'it' ? 'versand_text_it' : 'versand_text') || '{plan}';
    var link = basis ? String(basis).replace(/\/+$/, '') + '/team.html?k=' + (m.zugangscode || '') : '';
    return vorlage
      .replace(/\{name\}/g, String(m.name).split(' ')[0])
      .replace(/\{zeitraum\}/g, dm(von) + ' – ' + dmy(bis))
      .replace(/\{plan\}/g, planText(m.id, von, bis, s))
      .replace(/\{link\}/g, link)
      .replace(/\{betrieb\}/g, einst('betrieb'));
  }

  function nummerNormieren(nr) {
    var s = String(nr || '').replace(/[^\d+]/g, '');
    if (!s) return '';
    if (s.indexOf('00') === 0) s = '+' + s.slice(2);
    if (s.charAt(0) === '0') s = '+49' + s.slice(1);
    return s.replace(/\+/g, '');
  }

  /* Baut die fertigen Links – geöffnet werden sie von der Oberfläche. */
  function versandVorbereiten(d) {
    if (!datumGueltig(d.von) || !datumGueltig(d.bis)) throw Fehler('Bitte einen Zeitraum wählen.');
    if (!d.mitarbeiter || !d.mitarbeiter.length) throw Fehler('Bitte mindestens einen Mitarbeiter auswählen.');
    var basis = String(d.basis || '').trim()
      || location.origin + location.pathname.replace(/[^/]*$/, '');
    var betreff = 'Dienstplan ' + dm(d.von) + ' – ' + dmy(d.bis);
    var aus = [];
    d.mitarbeiter.map(ma).filter(Boolean).forEach(function (m) {
      var text = nachricht(m, d.von, d.bis, basis);
      if (d.weg === 'whatsapp') {
        var nr = nummerNormieren(m.telefon);
        aus.push({
          id: m.id, name: m.name, ok: !!nr,
          grund: nr ? '' : 'keine Telefonnummer hinterlegt',
          url: nr ? 'https://wa.me/' + nr + '?text=' + encodeURIComponent(text) : '',
          text: text
        });
      } else {
        aus.push({
          id: m.id, name: m.name, ok: !!m.email,
          grund: m.email ? '' : 'keine E-Mail-Adresse hinterlegt',
          url: m.email ? 'mailto:' + encodeURIComponent(m.email)
            + '?subject=' + encodeURIComponent(betreff)
            + '&body=' + encodeURIComponent(text) : '',
          text: text
        });
      }
    });
    return { betreff: betreff, eintraege: aus, bereit: aus.filter(function (x) { return x.ok; }).length };
  }

  /* =========================================================================
     16 · Sicherung
     ========================================================================= */

  function sicherungText() { return JSON.stringify(D, null, 1); }

  function sicherungEinlesen(text) {
    var neu;
    try {
      neu = JSON.parse(String(text).replace(/^﻿/, '').trim());
    } catch (e) { throw Fehler('Das ist keine PizzaPlan-Sicherung.'); }
    if (!neu || !Array.isArray(neu.mitarbeiter)) throw Fehler('In der Datei fehlt das Team.');
    merken('Sicherung eingespielt');
    D = neu;
    nachziehen();
    sichern();
    return D.mitarbeiter.length;
  }

  function allesLoeschen() {
    merken('alle Daten gelöscht');
    D = leerBau();
    sichern();
  }

  /* =========================================================================
     17 · Anmeldung
     ========================================================================= */

  function chef() {
    return D.mitarbeiter.find(function (m) { return m.ist_chef && m.aktiv; }) || D.mitarbeiter[0] || null;
  }

  function ich() { return ma(D.ichId) || null; }

  function anmelden(maId) {
    var m = ma(maId);
    if (!m || !m.aktiv) throw Fehler('Dieser Zugang gilt nicht mehr.');
    D.ichId = m.id;
    sichern(true);
    return m;
  }

  function anmeldenMitCode(k) {
    var m = D.mitarbeiter.find(function (x) { return x.zugangscode === k && x.aktiv; });
    if (!m) throw Fehler('Dieser Link gilt nicht mehr. Bitte beim Chef melden.');
    D.ichId = m.id;
    sichern(true);
    return m;
  }

  function abmelden() { D.ichId = 0; sichern(true); }

  function chefPinPruefen(pin) {
    return String(pin || '') === String(einst('chef_pin') || '1234');
  }

  /* =========================================================================
     18 · Sprache verstehen (Diktat)
     ========================================================================= */

  var G0 = '(?<![0-9A-Za-zÄÖÜäöüß_])';
  var G1 = '(?![0-9A-Za-zÄÖÜäöüß_])';
  function re(muster, flags) { return new RegExp(muster, flags === undefined ? 'i' : flags); }

  var WOCHENTAGE = {
    montag: 0, dienstag: 1, mittwoch: 2, donnerstag: 3, freitag: 4, samstag: 5,
    sonnabend: 5, sonntag: 6,
    'lunedì': 0, lunedi: 0, 'martedì': 1, martedi: 1, 'mercoledì': 2, mercoledi: 2,
    'giovedì': 3, giovedi: 3, 'venerdì': 4, venerdi: 4, sabato: 5, domenica: 6
  };
  var MONATE = {
    januar: 1, februar: 2, 'märz': 3, maerz: 3, april: 4, mai: 5, juni: 6, juli: 7,
    august: 8, september: 9, oktober: 10, november: 11, dezember: 12,
    gennaio: 1, febbraio: 2, marzo: 3, aprile: 4, maggio: 5, giugno: 6, luglio: 7,
    agosto: 8, settembre: 9, ottobre: 10, novembre: 11, dicembre: 12
  };
  var ZAHLWORT = {
    eins: 1, eine: 1, ein: 1, einem: 1, einer: 1, zwei: 2, drei: 3, vier: 4, 'fünf': 5,
    fuenf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9, zehn: 10, elf: 11, 'zwölf': 12, zwoelf: 12,
    una: 1, uno: 1, due: 2, tre: 3, quattro: 4, cinque: 5, sei: 6, sette: 7, otto: 8,
    nove: 9, dieci: 10, undici: 11, dodici: 12
  };
  function zahlwoerter() { return Object.keys(ZAHLWORT).join('|'); }
  function zahlAus(w) {
    var t = String(w).toLowerCase();
    return /^\d+$/.test(t) ? Number(t) : (ZAHLWORT[t] || 0);
  }

  function datumAusText(t, basis) {
    var m = re(G0 + '(\\d{1,2})\\.\\s*(\\d{1,2})\\.\\s*(\\d{2,4})?').exec(t);
    if (m) {
      var j = Number(m[3] || ausIso(basis).getFullYear());
      if (j < 100) j += 2000;
      var d = iso(j, Number(m[2]), Number(m[1]));
      if (!datumGueltig(d)) return null;
      if (!m[3] && d < basis) d = iso(j + 1, Number(m[2]), Number(m[1]));
      return d;
    }
    m = re(G0 + '(\\d{1,2})\\.?\\s*(?:di\\s+|del\\s+)?(' + Object.keys(MONATE).join('|') + ')' + G1).exec(t);
    if (m) {
      var jj = ausIso(basis).getFullYear();
      var k = iso(jj, MONATE[m[2].toLowerCase()], Number(m[1]));
      if (!datumGueltig(k)) return null;
      if (k < basis) k = iso(jj + 1, MONATE[m[2].toLowerCase()], Number(m[1]));
      return k;
    }
    if (re(G0 + '(übermorgen|uebermorgen|dopodomani)' + G1).test(t)) return plusTage(basis, 2);
    if (re(G0 + '(morgen|domani)' + G1).test(t)) return plusTage(basis, 1);
    if (re(G0 + '(heute|oggi)' + G1).test(t)) return basis;
    m = re(G0 + '(' + Object.keys(WOCHENTAGE).join('|') + ')' + G1).exec(t);
    if (m) {
      var diff = (WOCHENTAGE[m[1].toLowerCase()] - wochentag(basis) + 7) % 7;
      return plusTage(basis, diff || 7);
    }
    m = re(G0 + 'in\\s+(\\d+|' + zahlwoerter() + ')\\s+tagen?' + G1).exec(t);
    if (m) return plusTage(basis, zahlAus(m[1]));
    return null;
  }

  function zeitenAusText(t) {
    var rein = t.replace(/\d{1,2}\s*\.\s*\d{1,2}\s*\.(\s*\d{2,4})?/g, ' ');
    var muster = new RegExp(
      G0 + '(\\d{1,2})[:.](\\d{2})' + G1
      + '|' + G0 + '(\\d{1,2})\\s*(?:uhr|ore)' + G1
      + '|' + G0 + '(?:um|alle|dalle|ab|von|bis|dalla|alla)\\s+(\\d{1,2})' + G1, 'gi');
    var treffer = [], m;
    while ((m = muster.exec(rein)) !== null) {
      var std, mi;
      if (m[1] !== undefined) { std = Number(m[1]); mi = m[2]; }
      else if (m[3] !== undefined) { std = Number(m[3]); mi = '00'; }
      else { std = Number(m[4]); mi = '00'; }
      if (std > 23) continue;
      var z = zwei(std) + ':' + mi;
      if (treffer.indexOf(z) < 0) treffer.push(z);
    }
    var von = treffer[0] || '', bis = treffer[1] || '';
    if (von && bis && minuten(bis) < minuten(von) && minuten(bis) < 8 * 60) {
      bis = zwei(Math.floor(minuten(bis) / 60) + 12) + bis.slice(2);
    }
    return [von, bis];
  }

  function maAusText(t) {
    var gefunden = [];
    D.mitarbeiter.filter(function (m) { return m.aktiv; }).forEach(function (m) {
      var teile = String(m.name).replace(/-/g, ' ').split(/\s+/);
      for (var i = 0; i < teile.length; i++) {
        if (teile[i].length < 3) continue;
        var p = teile[i].toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (re(G0 + p + '[0-9A-Za-zÄÖÜäöüß_]{0,2}' + G1).test(t)) { gefunden.push(m); break; }
      }
    });
    return gefunden;
  }

  function befehlDeuten(text) {
    var roh = String(text || '').trim();
    if (!roh) throw Fehler('Es wurde nichts verstanden. Bitte noch einmal sprechen.');
    var t = ' ' + roh.toLowerCase() + ' ';
    var basis = heute(), unklar = [];
    var treffer = maAusText(t);
    var datum = datumAusText(t, basis);
    var zt = zeitenAusText(t);
    var von = zt[0], bis = zt[1];
    var pos = positionen();
    var position = pos.find(function (p) { return t.indexOf(p.toLowerCase()) >= 0; }) || '';

    var istFrage = /(wer arbeitet|wer ist|wer hat|chi lavora|chi è|chi c'è)/i.test(t);
    var istStreichen = re(G0 + '(streiche|streich|lösche|loesche|entferne|austragen|absagen|'
      + 'cancella|elimina|togli|rimuovi)' + G1).test(t) || /nimm\s+\w+\s+raus/i.test(t);
    var istFrei = re(G0 + '(frei|urlaub|krank|abwesend|ferien|libero|libera|ferie|malato|malata|'
      + 'assente)' + G1).test(t);
    var istTermin = re(G0 + '(termin|erinnere|erinnerung|appuntamento|ricorda|promemoria)' + G1).test(t);

    if (istFrage) {
      var tag = datum || basis;
      var rows = D.schicht.filter(function (s) { return s.datum === tag; })
        .sort(function (a, b) { return a.von.localeCompare(b.von); });
      return {
        aktion: 'auskunft', original: roh, unklar: [],
        beschreibung: 'Dienstplan am ' + dmy(tag),
        antwort: rows.length
          ? rows.map(function (r) {
            return (maName(r.mitarbeiter_id) || 'noch offen') + ' ' + r.von + '–' + r.bis;
          }).join(' · ')
          : 'Für diesen Tag ist niemand eingeplant.'
      };
    }

    if (istFrei && treffer.length) {
      if (!datum) { unklar.push('Datum'); datum = basis; }
      var typ = /urlaub|ferie/i.test(t) ? 'Urlaub' : (/krank|malat/i.test(t) ? 'Krank' : 'Frei-Wunsch');
      var bisDatum = datum;
      var mb = re(G0 + 'bis\\s+(?:zum\\s+)?(\\d{1,2})\\.\\s*(\\d{1,2})\\.?').exec(t);
      if (mb) {
        var kd = iso(ausIso(datum).getFullYear(), Number(mb[2]), Number(mb[1]));
        if (datumGueltig(kd)) bisDatum = kd;
      }
      return {
        aktion: 'abwesenheit', original: roh, unklar: unklar,
        mitarbeiter_id: treffer[0].id, mitarbeiter_name: treffer[0].name,
        von_datum: datum, bis_datum: bisDatum, typ: typ, status: 'genehmigt',
        beschreibung: treffer[0].name + ': ' + typ + ' ab ' + dmy(datum)
          + (bisDatum !== datum ? ' bis ' + dmy(bisDatum) : '')
      };
    }

    if (istStreichen && treffer.length) {
      if (!datum) { unklar.push('Datum'); datum = basis; }
      var rs = D.schicht.filter(function (s) {
        return Number(s.mitarbeiter_id) === Number(treffer[0].id) && s.datum === datum;
      }).sort(function (a, b) { return a.von.localeCompare(b.von); });
      if (!rs.length) {
        return {
          aktion: 'auskunft', original: roh, unklar: [], beschreibung: 'Nichts zu streichen',
          antwort: treffer[0].name + ' ist am ' + dmy(datum) + ' gar nicht eingeplant.'
        };
      }
      var ziel = (von && rs.find(function (r) { return r.von === von; })) || rs[0];
      return {
        aktion: 'schicht_loeschen', original: roh, unklar: unklar, schicht_id: ziel.id,
        beschreibung: 'Schicht von ' + treffer[0].name + ' am ' + dmy(datum) + ', '
          + ziel.von + '–' + ziel.bis + ' streichen'
      };
    }

    if (treffer.length && (von || datum || re(G0 + '(teile|trage|plane|schicht|dienst|arbeitet|'
      + 'inserisci|metti|pianifica|turno|lavora)' + G1).test(t))) {
      if (treffer.length > 1) {
        unklar.push('mehrere Namen erkannt: ' + treffer.map(function (x) { return x.name; }).join(', '));
      }
      if (!datum) { datum = basis; unklar.push('Datum – auf heute gesetzt'); }
      if (!von) { von = '17:00'; unklar.push('Anfang – 17:00 angenommen'); }
      if (!bis) {
        var md = re(G0 + '(\\d+|' + zahlwoerter() + ')\\s*(stunden?|ore)' + G1).exec(t);
        var dauer = md ? zahlAus(md[1]) * 60 : 5 * 60;
        bis = alsZeit(minuten(von) + dauer);
        if (!md) unklar.push('Ende – 5 Stunden angenommen');
      }
      if (!position) {
        position = pos.indexOf(treffer[0].rolle) >= 0 ? treffer[0].rolle : (pos[0] || 'Service');
      }
      return {
        aktion: 'schicht', original: roh, unklar: unklar,
        mitarbeiter_id: treffer[0].id, mitarbeiter_name: treffer[0].name,
        datum: datum, von: von, bis: bis, position: position,
        pause_min: pausenvorgabe(dauerMinuten(von, bis, 0)),
        beschreibung: treffer[0].name + ' am ' + dmy(datum) + ' von ' + von + ' bis ' + bis
          + ' Uhr (' + position + ')'
      };
    }

    if (istTermin) {
      var v = terminAusText(roh, basis);
      v.aktion = 'termin';
      v.original = roh;
      v.beschreibung = 'Termin „' + v.titel + '“ am ' + dmy(v.datum)
        + (v.von_zeit ? ' um ' + v.von_zeit + ' Uhr' : '');
      return v;
    }

    throw Fehler('Das habe ich nicht verstanden. Zum Beispiel: „Teile Anna am 5.6. um 17 Uhr ein“, '
      + '„Marco hat morgen frei“, „Streiche Luca am Freitag“, „Wer arbeitet am Samstag?“');
  }

  function terminAusText(text, basis) {
    var roh = String(text || '').trim();
    var t = ' ' + roh.toLowerCase().replace(/,/g, ' , ') + ' ';
    var unklar = [];
    var datum = datumAusText(t, basis || heute());
    if (!datum) { datum = basis || heute(); unklar.push('Datum – auf heute gesetzt'); }

    var zt = zeitenAusText(t);
    var vonZeit = zt[0], bisZeit = zt[1];
    var mh = re(G0 + 'halb\\s+(\\d{1,2}|' + zahlwoerter() + ')' + G1).exec(t);
    if (!vonZeit && mh) vonZeit = alsZeit((zahlAus(mh[1]) - 1) * 60 + 30);
    if (vonZeit) {
      var std = Number(vonZeit.slice(0, 2));
      if (re(G0 + '(abends|am abend|nachmittag|nachmittags|di sera|pomeriggio)' + G1).test(t)
        && std < 12) vonZeit = zwei(std + 12) + vonZeit.slice(2);
    }
    var ganztags = 0;
    if (!vonZeit) {
      if (re(G0 + '(ganztägig|ganztaegig|ganzen tag|tutto il giorno)' + G1).test(t)) ganztags = 1;
      else unklar.push('Uhrzeit');
    }
    if (vonZeit && !bisZeit) {
      var dauer = 60;
      var md = re(G0 + '(\\d+|' + zahlwoerter() + ')\\s*(stunden?|std|ore)' + G1).exec(t);
      if (md) dauer = zahlAus(md[1]) * 60;
      else {
        var mm = re(G0 + '(\\d+)\\s*(minuten|minuti)' + G1).exec(t);
        if (mm) dauer = Number(mm[1]);
      }
      bisZeit = alsZeit(minuten(vonZeit) + dauer);
    }

    var erinnerung = einstZahl('termin_erinnerung_standard') || 60;
    var me = re(G0 + '(\\d+|' + zahlwoerter() + ')\\s*(stunden?|std|ore)\\s*(vorher|davor|früher|'
      + 'frueher|prima)' + G1).exec(t);
    if (me) erinnerung = zahlAus(me[1]) * 60;
    else if ((me = re(G0 + '(\\d+)\\s*(minuten|minuti)\\s*(vorher|davor|prima)' + G1).exec(t))) {
      erinnerung = Number(me[1]);
    } else if (re(G0 + 'halbe stunde\\s*(vorher|davor)' + G1).test(t)) erinnerung = 30;
    else if (re(G0 + 'tag\\s*(vorher|davor)' + G1).test(t)) erinnerung = 1440;
    else if (re(G0 + '(keine erinnerung|ohne erinnerung|senza promemoria)' + G1).test(t)) erinnerung = 0;

    var wdh = 'keine';
    if (re(G0 + '(jede woche|wöchentlich|woechentlich|ogni settimana|jeden ('
      + Object.keys(WOCHENTAGE).join('|') + '))' + G1).test(t)) wdh = 'woechentlich';
    else if (re(G0 + '(jeden monat|monatlich|ogni mese)' + G1).test(t)) wdh = 'monatlich';
    else if (re(G0 + '(jeden tag|täglich|taeglich|ogni giorno)' + G1).test(t)) wdh = 'taeglich';

    var ort = '';
    var mo = re(G0 + '(?:in|bei|beim|im|da|presso)\\s+(?:der\\s+|dem\\s+|den\\s+)?'
      + '([a-zäöüß0-9\\-. ]{3,40})').exec(t);
    if (mo) {
      ort = mo[1].replace(/^[\s.,]+|[\s.,]+$/g, '')
        .replace(/(^|\s)([a-zäöüß])/g, function (x, a, b) { return a + b.toUpperCase(); });
    }

    var kategorie = 'Allgemein';
    terminKategorien().some(function (k) {
      if (t.indexOf(k.toLowerCase()) >= 0) { kategorie = k; return true; }
      return false;
    });

    var titel = roh
      .replace(re('(erinnere mich|erinner mich|erinnere|erinnern|erinnerung|trag ein|trage ein|'
        + 'neuer termin|termin|bitte|denk daran|denke daran|ganztägig|ganztaegig|appuntamento|'
        + 'ricordami|promemoria)', 'gi'), ' ')
      .replace(re('(\\d+|' + zahlwoerter() + ')\\s*(stunden?|std|minuten|ore|minuti)\\s*'
        + '(vorher|davor|früher|frueher|prima)', 'gi'), ' ')
      .replace(re('(heute|morgen|übermorgen|uebermorgen|oggi|domani|dopodomani|am|um|ab|bis|alle)',
        'gi'), ' ')
      .replace(re('(\\d{1,2}[:.]\\d{2}|\\d{1,2}\\s*(uhr|ore)\\s*\\d{0,2}|halb\\s+\\w+)', 'gi'), ' ')
      .replace(re('(' + Object.keys(WOCHENTAGE).join('|') + ')', 'gi'), ' ')
      .replace(/\d{1,2}\.\d{1,2}\.\d{0,4}/g, ' ')
      .replace(/\s*,\s*/g, ' ').replace(/\s{2,}/g, ' ').replace(/^[\s.,-]+|[\s.,-]+$/g, '');
    if (titel.length < 3) { titel = roh.trim(); unklar.push('Titel'); }

    return {
      titel: titel.slice(0, 120), datum: datum, von_zeit: vonZeit, bis_zeit: bisZeit,
      ganztags: ganztags, ort: ort, kategorie: kategorie, erinnerung_min: erinnerung,
      wiederholung: wdh, notiz: roh, unklar: unklar
    };
  }

  function befehlAusfuehren(v) {
    if (v.aktion === 'schicht') {
      var r = schichtSpeichern({
        datum: v.datum, von: v.von, bis: v.bis, pause_min: v.pause_min || 0,
        mitarbeiter_id: v.mitarbeiter_id, position: v.position, notiz: '', veroeffentlicht: 0
      });
      return { text: 'Schicht eingetragen: ' + v.beschreibung, warnungen: r.warnungen };
    }
    if (v.aktion === 'schicht_loeschen') {
      schichtLoeschen(v.schicht_id);
      return { text: 'Schicht gestrichen.', warnungen: [] };
    }
    if (v.aktion === 'abwesenheit') {
      var w = wunschSpeichern(v);
      return { text: 'Eingetragen: ' + v.beschreibung, warnungen: w.warnungen };
    }
    if (v.aktion === 'termin') {
      terminSpeichern(Object.assign({}, v, { quelle: 'Sprache' }));
      return { text: 'Termin gespeichert: ' + v.titel, warnungen: [] };
    }
    throw Fehler('Dieser Befehl lässt sich nicht ausführen.');
  }

  /* =========================================================================
     19 · Nach außen
     ========================================================================= */

  var bereit = laden().catch(function (e) {
    if (!D) { D = leerBau(); beispielFuellen(); }
    return null;
  });

  return {
    bereit: bereit,
    daten: function () { return D; },
    speicherArt: function () { return speicherArt; },
    beiAenderung: beiAenderung,
    Fehler: Fehler,

    /* Datum und Zeit */
    heute: heute, iso: iso, alsIso: alsIso, ausIso: ausIso, plusTage: plusTage,
    wochentag: wochentag, wochenstart: wochenstart, istSonntag: istSonntag,
    tageZwischen: tageZwischen, jetztZeit: jetztZeit, minuten: minuten, alsZeit: alsZeit,
    dauerMinuten: dauerMinuten, stunden: stunden, dm: dm, dmy: dmy, datumGueltig: datumGueltig,
    monatsgrenzen: monatsgrenzen, WT_KURZ: WT_KURZ, WT_LANG: WT_LANG,

    /* Einstellungen */
    einst: einst, einstZahl: einstZahl, einstAlle: function () { return Object.assign({}, E()); },
    einstSetzen: einstSetzen, positionen: positionen, terminKategorien: terminKategorien,
    VERTRAEGE: VERTRAEGE, WUNSCH_TYPEN: WUNSCH_TYPEN, FARBTOPF: FARBTOPF,

    /* Rückgängig */
    merken: merken, rueckgaengig: rueckgaengig, rueckgaengigMoeglich: rueckgaengigMoeglich,
    letzteAktion: letzteAktion,

    /* Team */
    ma: ma, maName: maName, maListe: maListe, maSpeichern: maSpeichern, maLoeschen: maLoeschen,
    beispielEntfernen: beispielEntfernen, hatBeispieldaten: hatBeispieldaten,

    /* Einlesen */
    importPruefen: importPruefen, importUebernehmen: importUebernehmen,
    importVorlage: function () { return IMPORT_VORLAGE; }, tabelleLesen: tabelleLesen,

    /* Plan */
    schichten: schichten, schicht: schicht, schichtSpeichern: schichtSpeichern,
    schichtLoeschen: schichtLoeschen, schichtVerschieben: schichtVerschieben,
    konflikte: konflikte, wocheKopieren: wocheKopieren, wocheFreigeben: wocheFreigeben,
    wocheLeeren: wocheLeeren, besetzung: besetzung,

    /* Wünsche */
    wuensche: wuensche, wunschSpeichern: wunschSpeichern, wunschStatus: wunschStatus,
    wunschLoeschen: wunschLoeschen, abwesend: abwesend, wunschOffen: wunschOffen,

    /* Zeiten */
    zeiten: zeiten, zeitSpeichern: zeitSpeichern, zeitLoeschen: zeitLoeschen,
    zeitFreigeben: zeitFreigeben, zeitenFreigeben: zeitenFreigeben,
    stempelStatus: stempelStatus, stempeln: stempeln, pausenvorgabe: pausenvorgabe,

    /* Auswertung */
    auswertung: auswertung, auswertungCsv: auswertungCsv, uebersicht: uebersicht,

    /* Termine */
    termine: termine, terminSpeichern: terminSpeichern, terminLoeschen: terminLoeschen,
    terminErledigt: terminErledigt, terminErinnerungen: terminErinnerungen,
    terminSchlummern: terminSchlummern,

    /* Vorlagen */
    vorlagen: function () {
      return D.vorlage.slice().sort(nachName).map(function (v) { return Object.assign({}, v); });
    },
    vorlageSpeichern: function (d) {
      if (!String(d.name || '').trim()) throw Fehler('Bitte einen Namen für die Vorlage eintragen.');
      merken('Vorlage gespeichert');
      var v = d.id ? D.vorlage.find(function (x) { return Number(x.id) === Number(d.id); }) : null;
      if (!v) { v = { id: neueId('vorlage') }; D.vorlage.push(v); }
      Object.assign(v, {
        name: String(d.name).trim(), von: d.von || '17:00', bis: d.bis || '22:00',
        pause_min: Number(d.pause_min || 0), position: d.position || 'Service',
        farbe: d.farbe || '#3d8bfd'
      });
      sichern();
      return v.id;
    },
    vorlageLoeschen: function (id) {
      merken('Vorlage gelöscht');
      D.vorlage = D.vorlage.filter(function (v) { return Number(v.id) !== Number(id); });
      sichern();
    },

    /* Versand */
    planText: planText, planTextGesamt: planTextGesamt, nachricht: nachricht,
    versandVorbereiten: versandVorbereiten,

    /* Sicherung */
    sicherungText: sicherungText, sicherungEinlesen: sicherungEinlesen,
    allesLoeschen: allesLoeschen,

    /* Anmeldung */
    chef: chef, ich: ich, anmelden: anmelden, anmeldenMitCode: anmeldenMitCode,
    abmelden: abmelden, chefPinPruefen: chefPinPruefen,

    /* Sprache */
    befehlDeuten: befehlDeuten, befehlAusfuehren: befehlAusfuehren, terminAusText: terminAusText
  };
})();

window.Kern = Kern;
