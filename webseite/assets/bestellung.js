/* Online-Bestellung zur Abholung – gemeinsame Logik für alle Entwürfe (ohne Oberfläche).
   Braucht assets/karte.js davor. Jeder Entwurf baut seine eigene Oberfläche und ruft nur BESTELLUNG.* auf.
   Entwurfsstand: Die Bestellung wird noch NICHT übertragen (BESTELLUNG.demo = true). */
(function () {
  var G = window.GABRIELS;
  var SCHLUESSEL = "gabriels.warenkorb";
  var VORLAUF = 20, TAKT = 15, SCHLUSS_VORHER = 15; /* Minuten */
  var liste = [];
  var hoerer = [];

  /* Zusatzzutaten je 1 € (nur Zutaten, die auf der Karte vorkommen) */
  var ZUTATEN = ["Salami", "Scharfe Salami", "Schinken", "Parmaschinken", "Champignons", "Paprika", "Peperoni",
    "Zwiebeln", "Knoblauch", "Kapern", "Sardellen", "Thunfisch", "Ananas", "Mozzarella", "Gorgonzola",
    "Schafskäse", "Parmesan", "Frische Tomaten", "Rucola", "Spinat", "Ei", "Erbsen"];

  function laden() {
    try { liste = JSON.parse(localStorage.getItem(SCHLUESSEL)) || []; } catch (e) { liste = []; }
    if (!Array.isArray(liste)) liste = [];
  }
  function speichern() {
    try { localStorage.setItem(SCHLUESSEL, JSON.stringify(liste)); } catch (e) { /* privat-Modus */ }
    hoerer.forEach(function (f) { try { f(api.inhalt()); } catch (e) { console.warn(e); } });
  }
  /* Gericht über Kategorie-ID und Index finden: schluessel = "pizza:0" */
  function gericht(schluessel) {
    var t = String(schluessel).split(":"), k = G.karte.filter(function (x) { return x.id === t[0]; })[0];
    return k && k.gerichte[+t[1]] ? { kat: k, g: k.gerichte[+t[1]] } : null;
  }
  function zeitText(d) { return ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2); }

  var api = {
    demo: true,
    zutaten: ZUTATEN,
    aufpreis: 1,
    /* Schlüssel eines Gerichts für data-Attribute: BESTELLUNG.schluessel("pizza", 0) */
    schluessel: function (katId, index) { return katId + ":" + index; },
    hinzu: function (schluessel, extras, anmerkung) {
      if (!gericht(schluessel)) return;
      extras = (extras || []).filter(function (z) { return ZUTATEN.indexOf(z) >= 0; }).sort();
      anmerkung = String(anmerkung || "").trim().slice(0, 120);
      var gleich = liste.filter(function (p) {
        return p.s === schluessel && p.e.join("|") === extras.join("|") && p.a === anmerkung;
      })[0];
      if (gleich) gleich.m = Math.min(gleich.m + 1, 30); else liste.push({ s: schluessel, e: extras, a: anmerkung, m: 1 });
      speichern();
    },
    menge: function (position, m) {
      if (!liste[position]) return;
      if (m <= 0) liste.splice(position, 1); else liste[position].m = Math.min(m, 30);
      speichern();
    },
    leeren: function () { liste = []; speichern(); },
    /* Inhalt für die Anzeige: Positionen mit Name, Nummer, Einzelpreis, Summe */
    inhalt: function () {
      var pos = [], summe = 0, anzahl = 0;
      liste.forEach(function (p, i) {
        var t = gericht(p.s); if (!t) return;
        var einzel = t.g.preis + p.e.length * api.aufpreis;
        pos.push({ position: i, nr: t.g.nr, name: t.g.name, kategorie: t.kat.titel, extras: p.e.slice(),
                   anmerkung: p.a, menge: p.m, einzel: einzel, gesamt: einzel * p.m });
        summe += einzel * p.m; anzahl += p.m;
      });
      return { positionen: pos, summe: summe, anzahl: anzahl };
    },
    beiAenderung: function (f) { hoerer.push(f); },
    /* Abholzeiten für heute (oder den nächsten Öffnungstag): [{wert:"18:15", text:"Heute, 18:15 Uhr", datum}] */
    abholzeiten: function (jetzt) {
      jetzt = jetzt || new Date();
      for (var tag = 0; tag < 7; tag++) {
        var d = new Date(jetzt.getFullYear(), jetzt.getMonth(), jetzt.getDate() + tag);
        var z = G.zeiten.filter(function (x) { return x.von.indexOf(d.getDay()) >= 0; })[0];
        if (!z) continue;
        var auf = z.auf.split(":"), zu = z.zu.split(":");
        var start = new Date(d); start.setHours(+auf[0], +auf[1], 0, 0);
        var ende = new Date(d); ende.setHours(+zu[0], +zu[1] - SCHLUSS_VORHER, 0, 0);
        var frueh = new Date(jetzt.getTime() + VORLAUF * 60000);
        var t = new Date(Math.max(start.getTime(), frueh.getTime()));
        t.setSeconds(0, 0);
        var rest = t.getMinutes() % TAKT; if (rest) t.setMinutes(t.getMinutes() + TAKT - rest);
        var aus = [];
        var vorsatz = tag === 0 ? "Heute" : tag === 1 ? "Morgen" :
          ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"][d.getDay()];
        for (; t <= ende; t = new Date(t.getTime() + TAKT * 60000))
          aus.push({ wert: zeitText(t), text: vorsatz + ", " + zeitText(t) + " Uhr", datum: new Date(t) });
        if (aus.length) {
          if (tag === 0 && G.offen(jetzt)) aus.unshift({ wert: "sofort", text: "So schnell wie möglich (ca. " + VORLAUF + " Min.)", datum: frueh });
          return aus;
        }
      }
      return [];
    },
    /* Prüft die Eingaben; gibt Fehlermeldungen je Feld zurück (leer = in Ordnung) */
    pruefen: function (daten) {
      var f = {};
      if (!api.inhalt().anzahl) f.warenkorb = "Bitte zuerst etwas auswählen.";
      if (!daten || !String(daten.name || "").trim()) f.name = "Bitte einen Namen angeben.";
      var tel = String((daten && daten.telefon) || "").replace(/[^\d+]/g, "");
      if (tel.length < 6) f.telefon = "Bitte eine Telefonnummer für Rückfragen angeben.";
      if (!daten || !daten.zeit) f.zeit = "Bitte eine Abholzeit wählen.";
      return f;
    },
    /* Bestellung abschicken. Im Entwurf nur Bestätigung, keine Übertragung. Gibt {ok, nummer, text} zurück. */
    absenden: function (daten) {
      var fehler = api.pruefen(daten);
      if (Object.keys(fehler).length) return { ok: false, fehler: fehler };
      var inh = api.inhalt();
      var nummer = "G" + String(Date.now()).slice(-5);
      var zeilen = inh.positionen.map(function (p) {
        return p.menge + "× " + (p.nr ? "Nr. " + p.nr + " " : "") + p.name +
          (p.extras.length ? " + " + p.extras.join(", ") : "") + (p.anmerkung ? " (" + p.anmerkung + ")" : "") +
          "  " + G.preis(p.gesamt);
      });
      var text = "Bestellung " + nummer + " zur Abholung\n" + zeilen.join("\n") + "\nSumme: " + G.preis(inh.summe) +
        "\nAbholung: " + daten.zeit + "\nName: " + daten.name + "\nTelefon: " + daten.telefon +
        (daten.hinweis ? "\nHinweis: " + daten.hinweis : "");
      api.leeren();
      return { ok: true, nummer: nummer, text: text, summe: inh.summe, demo: api.demo };
    }
  };

  laden();
  window.BESTELLUNG = api;
})();
