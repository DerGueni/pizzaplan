/* PizzaPlan · gemeinsame Eingabemasken
   ----------------------------------------------------------------------------
   Schicht, Mitarbeiter, Wunsch, Zeit, Termin, Vorlage, Einlesen, Versand.
   PC-Fassung und Handy-Fassung benutzen dieselben Masken – so sieht überall
   dasselbe Fenster gleich aus und es gibt jede Regel nur einmal.
   Jede Maske bekommt eine Funktion „nachher“, die nach dem Speichern läuft.
*/
var Masken = (function () {
  'use strict';

  function ruf(f) { if (typeof f === 'function') f(); }

  function kuerzel(name) {
    return String(name || '').split(/\s+/).slice(0, 2)
      .map(function (t) { return t.charAt(0).toUpperCase(); }).join('');
  }

  function appLink(maId) {
    var m = Kern.ma(maId);
    return location.origin + location.pathname.replace(/[^/]*$/, '')
      + 'team.html?k=' + (m ? m.zugangscode : '');
  }

  function farbeFuerPosition(position, ersatz) {
    var v = Kern.vorlagen().find(function (x) { return x.position === position; });
    return v ? v.farbe : (ersatz || '#7f8c8d');
  }

  function warnungenZeigen(liste) {
    if (!liste || !liste.length) return;
    UI.fenster({
      titel: 'Bitte kurz prüfen',
      inhalt: '<p>Gespeichert ist alles. Dabei ist aufgefallen:</p>'
        + '<ul style="padding-left:20px;line-height:1.6">'
        + liste.map(function (w) { return '<li>' + UI.sicher(w) + '</li>'; }).join('') + '</ul>',
      knoepfe: [{ text: 'Verstanden', art: 'haupt', wert: true }]
    });
  }

  /* =========================================================================
     Schicht
     ========================================================================= */

  function schicht(id, vorgabeTag, vorgabeMa, nachher) {
    var s = id ? Kern.schicht(id) : null;
    var leute = Kern.maListe(false).map(function (m) { return { wert: m.id, text: m.name }; });
    var vorlagen = Kern.vorlagen();

    var inhalt = '<div class="feldreihe">'
      + UI.feld('datum', T.t('datum'), s ? s.datum : (vorgabeTag || Kern.heute()), 'date')
      + UI.auswahl('mitarbeiter_id', T.t('mitarbeiter'), leute,
        s ? s.mitarbeiter_id : (vorgabeMa || ''), '— ' + T.t('offen_bez') + ' —')
      + '</div>'
      + (vorlagen.length
        ? '<div class="feld"><label>' + T.t('vorlagen') + '</label><select id="mk_vorlage">'
          + '<option value="">— frei eintragen —</option>'
          + vorlagen.map(function (v) {
            return '<option value="' + v.id + '">' + UI.sicher(v.name) + ' · ' + v.von + '–'
              + v.bis + '</option>';
          }).join('') + '</select></div>'
        : '')
      + '<div class="feldreihe">'
      + UI.feld('von', T.t('von'), s ? s.von : (vorlagen[0] ? vorlagen[0].von : '17:00'), 'time')
      + UI.feld('bis', T.t('bis'), s ? s.bis : (vorlagen[0] ? vorlagen[0].bis : '22:00'), 'time')
      + '</div>'
      + UI.schieber('pause_min', T.t('pause'), s ? s.pause_min : 0, 0, 120, 5, 'min')
      + '<div class="feldreihe">'
      + UI.auswahl('position', T.t('position'), Kern.positionen(),
        s ? s.position : (vorlagen[0] ? vorlagen[0].position : ''))
      + UI.feld('notiz', T.t('notiz'), s ? s.notiz : '')
      + '</div>'
      + '<div id="mk_dauer" class="hinweis"></div>'
      + UI.haken('veroeffentlicht', T.t('freigegeben'), s ? s.veroeffentlicht : 0);

    return UI.formular({
      titel: s ? T.t('schicht_bearbeiten') : T.t('schicht_anlegen'),
      inhalt: inhalt,
      loeschen: !!s,
      beimOeffnen: function (hg) {
        function rechne() {
          var v = hg.querySelector('[name=von]').value;
          var b = hg.querySelector('[name=bis]').value;
          var p = Number(hg.querySelector('[name=pause_min]').value || 0);
          var min = Kern.dauerMinuten(v, b, p);
          var soll = Kern.pausenvorgabe(Kern.dauerMinuten(v, b, 0));
          hg.querySelector('#mk_dauer').innerHTML = min
            ? T.t('dauer') + ': <b>' + UI.zahl(Kern.stunden(min), 2) + ' ' + T.t('stunden') + '</b>'
              + (soll > p ? ' · gesetzlich wären <b>' + soll + ' Minuten</b> Pause fällig' : '')
            : 'Diese Zeiten ergeben noch keine Arbeitszeit.';
        }
        hg.querySelectorAll('[name=von],[name=bis],[name=pause_min],[data-schieber]')
          .forEach(function (e) { e.addEventListener('input', rechne); });
        var vs = hg.querySelector('#mk_vorlage');
        if (vs) {
          vs.onchange = function () {
            var v = Kern.vorlagen().find(function (x) { return String(x.id) === vs.value; });
            if (!v) return;
            hg.querySelector('[name=von]').value = v.von;
            hg.querySelector('[name=bis]').value = v.bis;
            hg.querySelector('[name=pause_min]').value = v.pause_min;
            var sr = hg.querySelector('[data-schieber=pause_min]');
            if (sr) sr.value = v.pause_min;
            hg.querySelector('[name=position]').value = v.position;
            rechne();
          };
        }
        rechne();
      }
    }).then(function (r) {
      if (!r) return;
      try {
        if (r.aktion === 'loeschen') {
          Kern.schichtLoeschen(s.id);
          UI.rueckStreifen('Schicht gelöscht', nachher);
        } else {
          var res = Kern.schichtSpeichern(Object.assign({ id: s ? s.id : 0 }, r.werte));
          UI.rueckStreifen(s ? 'Schicht geändert' : 'Schicht angelegt', nachher);
          warnungenZeigen(res.warnungen);
        }
        ruf(nachher);
      } catch (e) { UI.fehler(e); }
    });
  }

  /* =========================================================================
     Vorlage
     ========================================================================= */

  function vorlage(id, nachher) {
    var v = id ? Kern.vorlagen().find(function (x) { return Number(x.id) === Number(id); }) : null;
    return UI.formular({
      titel: v ? 'Vorlage bearbeiten' : 'Neue Vorlage',
      inhalt: UI.feld('name', 'Name', v ? v.name : '')
        + '<div class="feldreihe">'
        + UI.feld('von', T.t('von'), v ? v.von : '17:00', 'time')
        + UI.feld('bis', T.t('bis'), v ? v.bis : '22:00', 'time')
        + '</div>'
        + UI.schieber('pause_min', T.t('pause'), v ? v.pause_min : 30, 0, 120, 5, 'min')
        + UI.auswahl('position', T.t('position'), Kern.positionen(), v ? v.position : '')
        + UI.farbwahl('farbe', T.t('farbe'), v ? v.farbe : Kern.FARBTOPF[1]),
      loeschen: !!v
    }).then(function (r) {
      if (!r) return;
      try {
        if (r.aktion === 'loeschen') Kern.vorlageLoeschen(v.id);
        else Kern.vorlageSpeichern(Object.assign({ id: v ? v.id : 0 }, r.werte));
        UI.melde(T.t('gespeichert'), 'gut');
        ruf(nachher);
      } catch (e) { UI.fehler(e); }
    });
  }

  /* =========================================================================
     Mitarbeiter
     ========================================================================= */

  function mitarbeiter(id, nachher) {
    var m = id ? Kern.ma(id) : null;
    return UI.formular({
      titel: m ? T.t('ma_bearbeiten') : T.t('ma_anlegen'),
      breite: 640,
      inhalt: '<div class="feldreihe">'
        + UI.feld('name', 'Name', m ? m.name : '')
        + UI.auswahl('rolle', T.t('rolle'), Kern.positionen().concat(['Leitung']),
          m ? m.rolle : '', '—')
        + '</div><div class="feldreihe">'
        + UI.auswahl('vertrag', T.t('vertrag'), Kern.VERTRAEGE, m ? m.vertrag : 'Teilzeit')
        + UI.auswahl('sprache', T.t('sprache'), [
          { wert: 'de', text: 'Deutsch' }, { wert: 'it', text: 'Italiano' }
        ], m ? m.sprache : 'de')
        + '</div><div class="feldreihe">'
        + UI.feld('telefon', T.t('telefon'), m ? m.telefon : '', 'tel')
        + UI.feld('email', T.t('email'), m ? m.email : '', 'email')
        + '</div>'
        + UI.schieber('stundenlohn', T.t('stundenlohn') + ' (€)',
          m ? m.stundenlohn : Kern.einstZahl('mindestlohn'), 0, 40, 0.5, '€')
        + UI.schieber('wochenstunden', T.t('wochenstunden'), m ? m.wochenstunden : 0, 0, 48, 0.5, 'h')
        + UI.schieber('urlaubstage', T.t('urlaubstage'), m ? m.urlaubstage : 24, 0, 40, 1, 'Tage')
        + '<div class="feldreihe">'
        + UI.feld('eintritt', T.t('eintritt'), m ? m.eintritt : '', 'date')
        + UI.feld('pin', 'PIN für die Mitarbeiter-App', m ? m.pin : '1234')
        + '</div>'
        + UI.farbwahl('farbe', T.t('farbe'), m ? m.farbe : Kern.FARBTOPF[1])
        + UI.feld('notiz', T.t('notiz'), m ? m.notiz : '')
        + UI.haken('aktiv', T.t('aktiv'), m ? m.aktiv : 1)
        + UI.haken('ist_chef', T.t('ist_chef'), m ? m.ist_chef : 0)
        + (m ? '<div class="hinweis" style="margin-top:10px">' + T.t('persoenlicher_link')
          + ':<br><code style="word-break:break-all">' + UI.sicher(appLink(m.id))
          + '</code></div>' : ''),
      loeschen: !!m,
      weitere: m ? [{ text: '🔗 ' + T.t('link_kopieren'), aktion: 'link' }] : []
    }).then(function (r) {
      if (!r) return;
      try {
        if (r.aktion === 'link') { UI.kopieren(appLink(m.id)); return; }
        if (r.aktion === 'loeschen') {
          var info = Kern.maLoeschen(m.id);
          UI.rueckStreifen(info, nachher);
          UI.melde(info, 'gut');
        } else {
          Kern.maSpeichern(Object.assign({ id: m ? m.id : 0 }, r.werte));
          UI.rueckStreifen(T.t('gespeichert'), nachher);
        }
        ruf(nachher);
      } catch (e) { UI.fehler(e); }
    });
  }

  /* =========================================================================
     Wunsch / Abwesenheit
     ========================================================================= */

  function wunsch(id, nachher, nurMaId) {
    var w = id
      ? Kern.wuensche(null, null).find(function (x) { return Number(x.id) === Number(id); })
      : null;
    var inhalt = '';
    if (!nurMaId) {
      inhalt += UI.auswahl('mitarbeiter_id', T.t('mitarbeiter'),
        Kern.maListe(false).map(function (m) { return { wert: m.id, text: m.name }; }),
        w ? w.mitarbeiter_id : '');
    }
    inhalt += '<div class="feldreihe">'
      + UI.auswahl('typ', T.t('typ'), Kern.WUNSCH_TYPEN, w ? w.typ : 'Frei-Wunsch')
      + (nurMaId ? '' : UI.auswahl('status', T.t('status'), [
        { wert: 'offen', text: T.t('offen') },
        { wert: 'genehmigt', text: T.t('genehmigt') },
        { wert: 'abgelehnt', text: T.t('abgelehnt') }
      ], w ? w.status : 'genehmigt'))
      + '</div><div class="feldreihe">'
      + UI.feld('von_datum', T.t('von'), w ? w.von_datum : Kern.heute(), 'date')
      + UI.feld('bis_datum', T.t('bis'), w ? w.bis_datum : Kern.heute(), 'date')
      + '</div>'
      + UI.feld('bemerkung', T.t('bemerkung'), w ? w.bemerkung : '');

    return UI.formular({
      titel: w ? 'Eintrag bearbeiten' : T.t('wunsch_neu'),
      inhalt: inhalt,
      loeschen: !!w
    }).then(function (r) {
      if (!r) return;
      try {
        if (r.aktion === 'loeschen') {
          Kern.wunschLoeschen(w.id, nurMaId || null);
          UI.rueckStreifen('Eintrag gelöscht', nachher);
        } else {
          var res = Kern.wunschSpeichern(Object.assign({ id: w ? w.id : 0 }, r.werte),
            nurMaId || null);
          UI.rueckStreifen(T.t('gespeichert'), nachher);
          res.warnungen.forEach(function (x) { UI.melde(x, 'warn'); });
        }
        ruf(nachher);
      } catch (e) { UI.fehler(e); }
    });
  }

  /* =========================================================================
     Arbeitszeit
     ========================================================================= */

  function zeit(id, nachher, nurMaId) {
    var alle = Kern.zeiten('0000-01-01', '9999-12-31', null);
    var z = id ? alle.find(function (x) { return Number(x.id) === Number(id); }) : null;
    var inhalt = '';
    if (!nurMaId) {
      inhalt += UI.auswahl('mitarbeiter_id', T.t('mitarbeiter'),
        Kern.maListe(true).map(function (m) { return { wert: m.id, text: m.name }; }),
        z ? z.mitarbeiter_id : '');
    }
    inhalt += '<div class="feldreihe">'
      + UI.feld('datum', T.t('datum'), z ? z.datum : Kern.heute(), 'date')
      + UI.feld('start', T.t('beginn'), z ? z.start : '17:00', 'time')
      + UI.feld('ende', T.t('ende'), z ? z.ende : '', 'time')
      + '</div>'
      + UI.schieber('pause_min', T.t('pause'), z ? z.pause_min : 0, 0, 120, 5, 'min')
      + UI.feld('bemerkung', T.t('bemerkung'), z ? z.bemerkung : '')
      + (nurMaId ? '' : UI.haken('freigegeben', 'geprüft und freigegeben', z ? z.freigegeben : 0));

    return UI.formular({
      titel: z ? 'Zeit bearbeiten' : T.t('zeit_neu'),
      inhalt: inhalt,
      loeschen: !!z && !nurMaId
    }).then(function (r) {
      if (!r) return;
      try {
        if (r.aktion === 'loeschen') {
          Kern.zeitLoeschen(z.id);
          UI.rueckStreifen('Zeit gelöscht', nachher);
        } else {
          Kern.zeitSpeichern(Object.assign({
            id: z ? z.id : 0, quelle: z ? z.quelle : 'Korrektur'
          }, r.werte), nurMaId || null);
          UI.rueckStreifen(T.t('gespeichert'), nachher);
        }
        ruf(nachher);
      } catch (e) { UI.fehler(e); }
    });
  }

  /* =========================================================================
     Termin
     ========================================================================= */

  function erinnerungText(min) {
    if (!min) return '';
    if (min >= 1440) return Math.round(min / 1440) + ' Tag(e) vorher';
    if (min >= 60) return Math.round(min / 60) + ' Std. vorher';
    return min + ' Min. vorher';
  }

  function termin(id, vorbelegt, nachher) {
    var t = id
      ? Kern.termine(null, null, false).find(function (x) { return Number(x.id) === Number(id); })
      : (vorbelegt || null);
    return UI.formular({
      titel: id ? 'Termin bearbeiten' : T.t('termin_neu'),
      inhalt: UI.feld('titel', T.t('titel'), t ? t.titel : '')
        + '<div class="feldreihe">'
        + UI.feld('datum', T.t('datum'), t ? t.datum : Kern.heute(), 'date')
        + UI.feld('von_zeit', T.t('von'), t ? t.von_zeit : '', 'time')
        + UI.feld('bis_zeit', T.t('bis'), t ? t.bis_zeit : '', 'time')
        + '</div>'
        + UI.haken('ganztags', T.t('ganztags'), t ? t.ganztags : 0)
        + '<div class="feldreihe">'
        + UI.feld('ort', T.t('ort'), t ? t.ort : '')
        + UI.auswahl('kategorie', T.t('kategorie'), Kern.terminKategorien(),
          t ? t.kategorie : 'Allgemein')
        + '</div><div class="feldreihe">'
        + UI.auswahl('erinnerung_min', T.t('erinnerung'), [
          { wert: 0, text: 'keine' }, { wert: 15, text: '15 Minuten vorher' },
          { wert: 30, text: '30 Minuten vorher' }, { wert: 60, text: '1 Stunde vorher' },
          { wert: 120, text: '2 Stunden vorher' }, { wert: 1440, text: '1 Tag vorher' },
          { wert: 2880, text: '2 Tage vorher' }
        ], t ? t.erinnerung_min : Kern.einstZahl('termin_erinnerung_standard'))
        + UI.auswahl('wiederholung', T.t('wiederholung'), [
          { wert: 'keine', text: 'einmalig' }, { wert: 'taeglich', text: 'täglich' },
          { wert: 'woechentlich', text: 'wöchentlich' }, { wert: 'monatlich', text: 'monatlich' }
        ], t ? t.wiederholung : 'keine')
        + '</div>'
        + UI.feld('notiz', T.t('notiz'), t ? t.notiz : ''),
      loeschen: !!id
    }).then(function (r) {
      if (!r) return;
      try {
        if (r.aktion === 'loeschen') {
          Kern.terminLoeschen(id);
          UI.rueckStreifen('Termin gelöscht', nachher);
        } else {
          Kern.terminSpeichern(Object.assign({ id: id || 0 }, r.werte));
          UI.rueckStreifen(T.t('gespeichert'), nachher);
        }
        ruf(nachher);
      } catch (e) { UI.fehler(e); }
    });
  }

  function erinnerungen(nachher) {
    Kern.terminErinnerungen().forEach(function (t) {
      UI.fenster({
        titel: '⏰ ' + t.titel,
        inhalt: '<p><b>' + UI.tagLang(t.datum) + '</b>'
          + (t.von_zeit ? ' um ' + t.von_zeit + ' Uhr' : '') + '</p>'
          + (t.ort ? '<p>' + T.t('ort') + ': ' + UI.sicher(t.ort) + '</p>' : '')
          + (t.notiz ? '<p>' + UI.sicher(t.notiz) + '</p>' : '')
          + '<p style="color:var(--text-leise)">'
          + (t.minuten_bis >= 0 ? 'in ' + t.minuten_bis + ' Minuten' : 'liegt gerade an') + '</p>',
        knoepfe: [
          { text: 'In 10 Minuten nochmal', wert: 'schlummer' },
          { text: T.t('erledigt'), wert: 'fertig' },
          { text: 'Gesehen', art: 'haupt', wert: 'ok' }
        ]
      }).then(function (w) {
        if (w === 'schlummer') setTimeout(function () { Kern.terminSchlummern(t.id); }, 600000);
        if (w === 'fertig') { Kern.terminErledigt(t.id, 1); ruf(nachher); }
      });
    });
  }

  /* =========================================================================
     Mitarbeiter einlesen
     ========================================================================= */

  var FELD_TEXT = {
    name: 'Name', rolle: 'Rolle', vertrag: 'Vertrag', telefon: 'Telefon', email: 'E-Mail',
    stundenlohn: 'Stundenlohn', wochenstunden: 'Wochenstunden', urlaubstage: 'Urlaubstage',
    eintritt: 'Im Betrieb seit', sprache: 'Sprache', notiz: 'Notiz'
  };

  /* Zeichnet die Vorschau in ein beliebiges Element und kümmert sich um alles
     Weitere: Spalten ändern, Zeilen abwählen, übernehmen. */
  function importVorschau(zielEl, text, nachher, zuordnung) {
    var p;
    try { p = Kern.importPruefen(text, zuordnung); } catch (e) { UI.fehler(e); return; }

    var h = '<div class="karte"><h3>' + T.t('vorschau') + '</h3>'
      + '<div class="hinweis' + (p.fehler ? ' warn' : ' gut') + '"><b>' + p.neu + '</b> '
      + T.t('neu_bez') + ' · <b>' + p.aktualisieren + '</b> ' + T.t('aktualisieren')
      + (p.fehler ? ' · <b>' + p.fehler + '</b> ' + T.t('fehler_bez') : '') + '</div>';

    h += '<label>' + T.t('zuordnung') + '</label><div class="zuordnungsleiste">';
    p.zuordnung.forEach(function (feld, i) {
      h += '<div class="sp"><b>'
        + UI.sicher(p.kopfDa ? (p.kopf[i] || T.t('spalte') + ' ' + (i + 1))
          : T.t('spalte') + ' ' + (i + 1)) + '</b>'
        + '<select data-spalte="' + i + '"><option value="">— ' + T.t('nicht_verwenden')
        + ' —</option>';
      Object.keys(FELD_TEXT).forEach(function (k) {
        h += '<option value="' + k + '"' + (feld === k ? ' selected' : '') + '>'
          + FELD_TEXT[k] + '</option>';
      });
      h += '</select></div>';
    });
    h += '</div>';

    h += '<div class="tabelle" style="max-height:420px"><table><thead><tr>'
      + '<th style="width:34px"><input type="checkbox" data-alle="1" checked></th>'
      + '<th>Name</th><th>' + T.t('rolle') + '</th><th>' + T.t('vertrag') + '</th>'
      + '<th>' + T.t('telefon') + '</th><th>' + T.t('email') + '</th>'
      + '<th class="zahl">' + T.t('stundenlohn') + '</th>'
      + '<th class="zahl">' + T.t('wochenstunden') + '</th><th></th></tr></thead><tbody>';
    p.zeilen.forEach(function (z) {
      var s = z.satz;
      h += '<tr class="zeile-' + z.art + '">'
        + '<td>' + (z.art === 'fehler' ? ''
          : '<input type="checkbox" data-nr="' + z.nr + '" checked>') + '</td>'
        + '<td><b>' + UI.sicher(s.name || '—') + '</b></td>'
        + '<td>' + UI.sicher(s.rolle) + '</td>'
        + '<td>' + UI.sicher(s.vertrag) + '</td>'
        + '<td>' + UI.sicher(s.telefon) + '</td>'
        + '<td>' + UI.sicher(s.email) + '</td>'
        + '<td class="zahl">' + (s.stundenlohn ? UI.euro(s.stundenlohn) : '') + '</td>'
        + '<td class="zahl">' + (s.wochenstunden ? UI.zahl(s.wochenstunden, 1) : '') + '</td>'
        + '<td>' + UI.etikett(
          z.art === 'neu' ? T.t('neu_bez')
            : (z.art === 'aktualisieren' ? T.t('aktualisieren') : T.t('fehler_bez')),
          z.art === 'fehler' ? 'abgelehnt' : (z.art === 'neu' ? 'genehmigt' : 'laeuft'))
        + (z.hinweise.length
          ? '<br><small style="color:var(--text-leise)">'
            + UI.sicher(z.hinweise.join(' · ')) + '</small>' : '')
        + '</td></tr>';
    });
    h += '</tbody></table></div>'
      + '<button type="button" class="haupt gross" data-nehmen="1" style="margin-top:13px">'
      + T.t('uebernehmen') + '</button></div>';

    zielEl.innerHTML = h;

    zielEl.querySelectorAll('[data-spalte]').forEach(function (s) {
      s.onchange = function () {
        var neu = p.zuordnung.slice();
        neu[Number(s.getAttribute('data-spalte'))] = s.value;
        importVorschau(zielEl, text, nachher, neu);
      };
    });
    var alle = zielEl.querySelector('[data-alle]');
    alle.onchange = function () {
      zielEl.querySelectorAll('[data-nr]').forEach(function (c) { c.checked = alle.checked; });
    };
    zielEl.querySelector('[data-nehmen]').onclick = function () {
      var nr = [];
      zielEl.querySelectorAll('[data-nr]').forEach(function (c) {
        if (c.checked) nr.push(Number(c.getAttribute('data-nr')));
      });
      try {
        var r = Kern.importUebernehmen(p, nr);
        UI.melde(T.t('einlesen_fertig') + ': ' + r.neu + ' ' + T.t('neu_bez') + ', '
          + r.geaendert + ' ' + T.t('aktualisieren') + '.', 'gut');
        UI.rueckStreifen(r.neu + ' neu · ' + r.geaendert + ' ergänzt', nachher);
        zielEl.innerHTML = '';
        ruf(nachher);
      } catch (e) { UI.fehler(e); }
    };
  }

  /* =========================================================================
     Versand
     ========================================================================= */

  function versand(von, bis, weg, ids) {
    var r;
    try {
      r = Kern.versandVorbereiten({ von: von, bis: bis, weg: weg, mitarbeiter: ids });
    } catch (e) { UI.fehler(e); return; }
    if (!r.bereit) {
      UI.melde('Für die Auswahl fehlen Telefonnummern oder E-Mail-Adressen.', 'warn');
      return;
    }
    var h = '<p>Für jeden Mitarbeiter öffnet sich ein Fenster mit dem fertigen Text. '
      + 'Abgeschickt wird erst dort – hier passiert noch nichts.</p>'
      + '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px">';
    r.eintraege.forEach(function (e, i) {
      h += e.ok
        ? '<button type="button" class="haupt" data-vs="' + i + '">' + UI.sicher(e.name) + '</button>'
        : '<button type="button" disabled title="' + UI.sicher(e.grund) + '">'
          + UI.sicher(e.name) + '</button>';
    });
    h += '</div>';

    UI.fenster({
      titel: T.t('jetzt_verschicken') + ' · ' + r.bereit,
      breite: 620,
      inhalt: h,
      knoepfe: [
        { text: T.t('schliessen'), wert: null },
        { text: T.t('vorschau'), wert: 'vorschau' },
        { text: 'Alle nacheinander', art: 'haupt', wert: 'alle' }
      ],
      beimOeffnen: function (hg) {
        hg.querySelectorAll('[data-vs]').forEach(function (b) {
          b.onclick = function () {
            window.open(r.eintraege[Number(b.getAttribute('data-vs'))].url, '_blank');
            b.className = 'gruen';
            if (b.textContent.indexOf('✓') < 0) b.textContent = '✓ ' + b.textContent;
          };
        });
      }
    }).then(function (w) {
      if (w === 'vorschau') {
        var erste = r.eintraege.filter(function (e) { return e.ok; })[0];
        UI.fenster({
          titel: erste.name,
          breite: 620,
          inhalt: '<pre class="plantext" style="white-space:pre-wrap;font-family:Consolas,monospace;'
            + 'font-size:13px;background:var(--flaeche2);border:1px solid var(--linie);'
            + 'border-radius:8px;padding:13px;overflow:auto">' + UI.sicher(erste.text) + '</pre>'
        });
        return;
      }
      if (w !== 'alle') return;
      var fertig = r.eintraege.filter(function (e) { return e.ok; });
      var i = 0;
      (function naechste() {
        if (i >= fertig.length) {
          UI.melde(fertig.length + ' Nachrichten wurden geöffnet.', 'gut');
          return;
        }
        window.open(fertig[i].url, '_blank');
        i++;
        setTimeout(naechste, 900);
      })();
    });
  }

  /* =========================================================================
     Sprache
     ========================================================================= */

  function zuhoeren(knopf, statusFeld, fertig) {
    var Erkenner = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Erkenner) {
      UI.melde('Dieser Browser kann nicht zuhören. In Chrome, Edge oder Safari klappt es.', 'warn');
      return;
    }
    var r = new Erkenner();
    r.lang = T.aktuell() === 'it' ? 'it-IT' : 'de-DE';
    r.interimResults = false;
    r.maxAlternatives = 1;
    if (knopf) knopf.classList.add('hoert');
    if (statusFeld) statusFeld.textContent = 'Ich höre zu …';
    r.onresult = function (e) { fertig(e.results[0][0].transcript); };
    r.onerror = function () { UI.melde('Es kam nichts an. Bitte noch einmal.', 'warn'); };
    r.onend = function () {
      if (knopf) knopf.classList.remove('hoert');
      if (statusFeld) statusFeld.textContent = 'Auf das Mikrofon tippen und sprechen.';
    };
    r.start();
  }

  function befehl(knopf, nachher) {
    zuhoeren(knopf, null, function (text) {
      try {
        var v = Kern.befehlDeuten(text);
        if (v.aktion === 'auskunft') {
          UI.fenster({ titel: v.beschreibung, inhalt: '<p>' + UI.sicher(v.antwort) + '</p>' });
          return;
        }
        UI.fenster({
          titel: 'Habe ich das richtig verstanden?',
          inhalt: '<p style="font-size:13px;color:var(--text-leise)">„' + UI.sicher(v.original)
            + '“</p><p style="font-size:17px"><b>' + UI.sicher(v.beschreibung) + '</b></p>'
            + (v.unklar.length
              ? '<div class="hinweis warn">Unsicher: ' + UI.sicher(v.unklar.join(', ')) + '</div>'
              : ''),
          knoepfe: [
            { text: T.t('abbrechen'), wert: false },
            { text: 'Ja, eintragen', art: 'haupt', wert: true }
          ]
        }).then(function (ja) {
          if (!ja) return;
          var r = Kern.befehlAusfuehren(v);
          UI.melde(r.text, 'gut');
          UI.rueckStreifen(r.text, nachher);
          r.warnungen.forEach(function (x) { UI.melde(x, 'warn'); });
          ruf(nachher);
        });
      } catch (e) { UI.fehler(e); }
    });
  }

  return {
    schicht: schicht, vorlage: vorlage, mitarbeiter: mitarbeiter, wunsch: wunsch,
    zeit: zeit, termin: termin, erinnerungen: erinnerungen,
    importVorschau: importVorschau, versand: versand,
    zuhoeren: zuhoeren, befehl: befehl,
    kuerzel: kuerzel, appLink: appLink, farbeFuerPosition: farbeFuerPosition,
    erinnerungText: erinnerungText, warnungenZeigen: warnungenZeigen
  };
})();

window.Masken = Masken;
