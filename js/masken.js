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

  function appLink(maId) { return Kern.maAppLink(maId); }

  function farbeFuerPosition(position, ersatz) {
    var v = Kern.vorlagen().find(function (x) { return x.position === position; });
    return v ? v.farbe : (ersatz || '#7f8c8d');
  }

  /* Gespeicherte Werte (Positionen, Vertrag, Wunschart …) übersetzt zur Auswahl anbieten –
     der Wert selbst bleibt deutsch. */
  function werteListe(liste) {
    return liste.map(function (w) { return { wert: w, text: T.wert(w) }; });
  }

  function warnungenZeigen(liste) {
    if (!liste || !liste.length) return;
    UI.fenster({
      titel: T.t('m_kurz_pruefen'),
      inhalt: '<p>' + T.t('m_aufgefallen') + '</p>'
        + '<ul style="padding-left:20px;line-height:1.6">'
        + liste.map(function (w) { return '<li>' + UI.sicher(w) + '</li>'; }).join('') + '</ul>',
      knoepfe: [{ text: T.t('m_verstanden'), art: 'haupt', wert: true }]
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
          + '<option value="">— ' + T.t('m_frei_eintragen') + ' —</option>'
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
      + UI.auswahl('position', T.t('position'), werteListe(Kern.positionen()),
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
              + (soll > p ? T.t('m_pause_faellig').replace('{min}', soll) : '')
            : T.t('m_noch_keine_arbeitszeit');
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
          UI.rueckStreifen(T.t('r_schicht_geloescht'), nachher);
        } else {
          var res = Kern.schichtSpeichern(Object.assign({ id: s ? s.id : 0 }, r.werte));
          UI.rueckStreifen(T.t(s ? 'r_schicht_geaendert' : 'r_schicht_angelegt'), nachher);
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
      titel: v ? T.t('m_vorlage_bearbeiten') : T.t('m_vorlage_neu'),
      inhalt: UI.feld('name', T.t('name'), v ? v.name : '')
        + '<div class="feldreihe">'
        + UI.feld('von', T.t('von'), v ? v.von : '17:00', 'time')
        + UI.feld('bis', T.t('bis'), v ? v.bis : '22:00', 'time')
        + '</div>'
        + UI.schieber('pause_min', T.t('pause'), v ? v.pause_min : 30, 0, 120, 5, 'min')
        + UI.auswahl('position', T.t('position'), werteListe(Kern.positionen()), v ? v.position : '')
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
        + UI.feld('name', T.t('name'), m ? m.name : '')
        + UI.auswahl('rolle', T.t('rolle'), werteListe(Kern.positionen().indexOf('Leitung') < 0
          ? Kern.positionen().concat(['Leitung']) : Kern.positionen()), m ? m.rolle : '', '—')
        + '</div><div class="feldreihe">'
        + UI.auswahl('vertrag', T.t('vertrag'), werteListe(Kern.VERTRAEGE), m ? m.vertrag : 'Teilzeit')
        + UI.auswahl('sprache', T.t('sprache'), [
          { wert: 'de', text: T.t('sprache_de') }, { wert: 'it', text: T.t('sprache_it') }
        ], m ? m.sprache : 'de')
        + '</div>'
        + kontaktGruppe(m)
        + UI.schieber('stundenlohn', T.t('stundenlohn') + ' (€)',
          m ? m.stundenlohn : Kern.einstZahl('mindestlohn'), 0, 40, 0.5, '€')
        + UI.schieber('wochenstunden', T.t('wochenstunden'), m ? m.wochenstunden : 0, 0, 48, 0.5, 'h')
        + UI.schieber('urlaubstage', T.t('urlaubstage'), m ? m.urlaubstage : 24, 0, 40, 1, T.t('tage_wort'))
        + '<div class="feldreihe">'
        + UI.feld('eintritt', T.t('eintritt'), m ? m.eintritt : '', 'date')
        + UI.feld('pin', T.t('m_pin_app'), m ? m.pin : '1234')
        + '</div>'
        + UI.farbwahl('farbe', T.t('farbe'), m ? m.farbe : Kern.FARBTOPF[1])
        + UI.feld('notiz', T.t('notiz'), m ? m.notiz : '')
        + UI.haken('aktiv', T.t('aktiv'), m ? m.aktiv : 1)
        + UI.haken('ist_chef', T.t('ist_chef'), m ? m.ist_chef : 0)
        + (m ? '<div class="hinweis" style="margin-top:10px">' + T.t('persoenlicher_link')
          + ':<br><code style="word-break:break-all">' + UI.sicher(appLink(m.id))
          + '</code></div>' : ''),
      loeschen: !!m,
      weitere: m ? [{ text: '🔗 ' + T.t('link_kopieren'), aktion: 'link' }] : [],
      beimOeffnen: function (hg) {
        var plz = hg.querySelector('[name=plz]');
        var hinweis = hg.querySelector('#mk_plz_hinweis');
        function pruefe() { hinweis.style.display = Kern.plzOk(plz.value) ? 'none' : ''; }
        plz.addEventListener('change', pruefe);
        plz.addEventListener('blur', pruefe);
        plz.addEventListener('input', function () { if (Kern.plzOk(plz.value)) pruefe(); });
      }
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
          Kern.maHinweise(r.werte).forEach(function (x) { UI.melde(x, 'warn'); });
        }
        ruf(nachher);
      } catch (e) { UI.fehler(e); }
    });
  }

  /* Kontakt & Adresse – kompakt in Zweierreihen, PLZ schmal neben dem Ort. */
  function kontaktGruppe(m) {
    var w = function (f) { return m && m[f] ? m[f] : ''; };
    return '<div class="kontaktgruppe">'
      + '<div class="abschnitt">' + UI.sicher(T.t('kontakt_adresse')) + '</div>'
      + '<div class="feldreihe">'
      + UI.feld('telefon', T.t('handy_nr'), w('telefon'), 'tel', 'autocomplete="off"')
      + UI.feld('email', T.t('email'), w('email'), 'email', 'autocomplete="off"')
      + '</div><div class="feldreihe">'
      + UI.feld('telegram', T.t('telegram'), w('telegram'), 'text',
        'autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="'
        + UI.sicher(T.t('telegram_platz')) + '"')
      + UI.feld('strasse', T.t('strasse'), w('strasse'), 'text', 'autocomplete="off"')
      + '</div><div class="feldreihe" style="grid-template-columns:minmax(76px,118px) minmax(0,1fr)">'
      + UI.feld('plz', T.t('plz'), w('plz'), 'text', 'inputmode="numeric" maxlength="10" autocomplete="off"')
      + UI.feld('ort', T.t('wohnort'), w('ort'), 'text', 'autocomplete="off"')
      + '</div>'
      + '<div class="hinweis warn" id="mk_plz_hinweis" style="display:none">'
      + UI.sicher(T.t('k_plz_komisch')) + '</div>'
      + '<div class="feldreihe">'
      + UI.feld('geburtsdatum', T.t('geburtsdatum'), w('geburtsdatum'), 'date')
      + UI.feld('notfallkontakt', T.t('notfallkontakt'), w('notfallkontakt'), 'text',
        'autocomplete="off" placeholder="' + UI.sicher(T.t('notfall_platz')) + '"')
      + '</div></div>';
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
      + UI.auswahl('typ', T.t('typ'), werteListe(Kern.WUNSCH_TYPEN), w ? w.typ : 'Frei-Wunsch')
      + (nurMaId ? '' : UI.auswahl('status', T.t('status'), [
        { wert: 'offen', text: T.status('offen') },
        { wert: 'genehmigt', text: T.status('genehmigt') },
        { wert: 'abgelehnt', text: T.status('abgelehnt') }
      ], w ? w.status : 'genehmigt'))
      + '</div><div class="feldreihe">'
      + UI.feld('von_datum', T.t('von'), w ? w.von_datum : Kern.heute(), 'date')
      + UI.feld('bis_datum', T.t('bis'), w ? w.bis_datum : Kern.heute(), 'date')
      + '</div>'
      + UI.feld('bemerkung', T.t('bemerkung'), w ? w.bemerkung : '');

    return UI.formular({
      titel: w ? T.t('m_eintrag_bearbeiten') : T.t('wunsch_neu'),
      inhalt: inhalt,
      loeschen: !!w
    }).then(function (r) {
      if (!r) return;
      try {
        if (r.aktion === 'loeschen') {
          Kern.wunschLoeschen(w.id, nurMaId || null);
          UI.rueckStreifen(T.t('r_eintrag_geloescht'), nachher);
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
      + (nurMaId ? '' : UI.haken('freigegeben', T.t('m_geprueft_frei'), z ? z.freigegeben : 0));

    return UI.formular({
      titel: z ? T.t('m_zeit_bearbeiten') : T.t('zeit_neu'),
      inhalt: inhalt,
      loeschen: !!z && !nurMaId
    }).then(function (r) {
      if (!r) return;
      try {
        if (r.aktion === 'loeschen') {
          Kern.zeitLoeschen(z.id);
          UI.rueckStreifen(T.t('r_zeit_geloescht'), nachher);
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
    var n;
    if (min >= 1440) {
      n = Math.round(min / 1440);
      return T.t(n === 1 ? 'm_vorher_tag' : 'm_vorher_tage').replace('{n}', n);
    }
    if (min >= 60) {
      n = Math.round(min / 60);
      return T.t(n === 1 ? 'm_vorher_std' : 'm_vorher_stdn').replace('{n}', n);
    }
    return T.t('m_vorher_min').replace('{n}', min);
  }

  function termin(id, vorbelegt, nachher) {
    var t = id
      ? Kern.termine(null, null, false).find(function (x) { return Number(x.id) === Number(id); })
      : (vorbelegt || null);
    return UI.formular({
      titel: id ? T.t('m_termin_bearbeiten') : T.t('termin_neu'),
      inhalt: UI.feld('titel', T.t('titel'), t ? t.titel : '')
        + '<div class="feldreihe">'
        + UI.feld('datum', T.t('datum'), t ? t.datum : Kern.heute(), 'date')
        + UI.feld('von_zeit', T.t('von'), t ? t.von_zeit : '', 'time')
        + UI.feld('bis_zeit', T.t('bis'), t ? t.bis_zeit : '', 'time')
        + '</div>'
        + UI.haken('ganztags', T.t('ganztags'), t ? t.ganztags : 0)
        + '<div class="feldreihe">'
        + UI.feld('ort', T.t('ort'), t ? t.ort : '')
        + UI.auswahl('kategorie', T.t('kategorie'), werteListe(Kern.terminKategorien()),
          t ? t.kategorie : 'Allgemein')
        + '</div><div class="feldreihe">'
        + UI.auswahl('erinnerung_min', T.t('erinnerung'), [
          { wert: 0, text: T.t('m_erinnerung_keine') }, { wert: 15, text: T.t('m_erinnerung_15') },
          { wert: 30, text: T.t('m_erinnerung_30') }, { wert: 60, text: T.t('m_erinnerung_60') },
          { wert: 120, text: T.t('m_erinnerung_120') }, { wert: 1440, text: T.t('m_erinnerung_1440') },
          { wert: 2880, text: T.t('m_erinnerung_2880') }
        ], t ? t.erinnerung_min : Kern.einstZahl('termin_erinnerung_standard'))
        + UI.auswahl('wiederholung', T.t('wiederholung'), [
          { wert: 'keine', text: T.t('wdh_keine') }, { wert: 'taeglich', text: T.t('wdh_taeglich') },
          { wert: 'woechentlich', text: T.t('wdh_woechentlich') },
          { wert: 'monatlich', text: T.t('wdh_monatlich') }
        ], t ? t.wiederholung : 'keine')
        + '</div>'
        + UI.feld('notiz', T.t('notiz'), t ? t.notiz : ''),
      loeschen: !!id
    }).then(function (r) {
      if (!r) return;
      try {
        if (r.aktion === 'loeschen') {
          Kern.terminLoeschen(id);
          UI.rueckStreifen(T.t('r_termin_geloescht'), nachher);
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
          + (t.von_zeit ? T.t('um_uhr').replace('{zeit}', t.von_zeit) : '') + '</p>'
          + (t.ort ? '<p>' + T.t('ort') + ': ' + UI.sicher(t.ort) + '</p>' : '')
          + (t.notiz ? '<p>' + UI.sicher(t.notiz) + '</p>' : '')
          + '<p style="color:var(--text-leise)">'
          + (t.minuten_bis >= 0 ? T.t('m_in_minuten').replace('{n}', t.minuten_bis) : T.t('m_jetzt_an'))
          + '</p>',
        knoepfe: [
          { text: T.t('m_schlummern'), wert: 'schlummer' },
          { text: T.t('erledigt'), wert: 'fertig' },
          { text: T.t('m_gesehen'), art: 'haupt', wert: 'ok' }
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

  /* Feld → Kürzel im Wörterbuch */
  var FELD_TEXT = {
    name: 'name', vorname: 'vorname', nachname: 'nachname', rolle: 'rolle', vertrag: 'vertrag',
    telefon: 'telefon', email: 'email', telegram: 'telegram', strasse: 'strasse', plz: 'plz',
    ort: 'wohnort', geburtsdatum: 'geburtsdatum',
    stundenlohn: 'stundenlohn', wochenstunden: 'wochenstunden', urlaubstage: 'urlaubstage',
    eintritt: 'eintritt', sprache: 'sprache', notfallkontakt: 'notfallkontakt', notiz: 'notiz'
  };

  function adresseText(s) {
    var ort = [s.plz, s.ort].filter(Boolean).join(' ');
    return [s.strasse, ort].filter(Boolean).join(', ');
  }

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
          + UI.sicher(T.t(FELD_TEXT[k])) + '</option>';
      });
      h += '</select></div>';
    });
    h += '</div>';

    h += '<div class="tabelle" style="max-height:420px"><table><thead><tr>'
      + '<th style="width:34px"><input type="checkbox" data-alle="1" checked></th>'
      + '<th>' + T.t('name') + '</th><th>' + T.t('rolle') + '</th><th>' + T.t('vertrag') + '</th>'
      + '<th>' + T.t('telefon') + '</th><th>' + T.t('email') + '</th>'
      + '<th>' + T.t('telegram') + '</th><th>' + T.t('adresse') + '</th>'
      + '<th class="zahl">' + T.t('stundenlohn') + '</th>'
      + '<th class="zahl">' + T.t('wochenstunden') + '</th><th></th></tr></thead><tbody>';
    p.zeilen.forEach(function (z) {
      var s = z.satz;
      h += '<tr class="zeile-' + z.art + '">'
        + '<td>' + (z.art === 'fehler' ? ''
          : '<input type="checkbox" data-nr="' + z.nr + '" checked>') + '</td>'
        + '<td><b>' + UI.sicher(s.name || '—') + '</b></td>'
        + '<td>' + UI.sicher(T.wert(s.rolle)) + '</td>'
        + '<td>' + UI.sicher(T.wert(s.vertrag)) + '</td>'
        + '<td>' + UI.sicher(s.telefon) + '</td>'
        + '<td>' + UI.sicher(s.email) + '</td>'
        + '<td>' + UI.sicher(s.telegram ? '@' + s.telegram : '') + '</td>'
        + '<td>' + UI.sicher(adresseText(s)) + '</td>'
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
        UI.rueckStreifen(T.t('m_import_rueck').replace('{neu}', r.neu)
          .replace('{geaendert}', r.geaendert), nachher);
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
      UI.melde(T.t('m_versand_fehlt'), 'warn');
      return;
    }
    var h = '<p>' + T.t('m_versand_info') + '</p>'
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
        { text: T.t('m_alle_nacheinander'), art: 'haupt', wert: 'alle' }
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
          UI.melde(T.t('m_nachrichten_offen').replace('{n}', fertig.length), 'gut');
          return;
        }
        window.open(fertig[i].url, '_blank');
        i++;
        setTimeout(naechste, 900);
      })();
    });
  }

  /* =========================================================================
     App-Einladung
     ========================================================================= */

  /* Fenster mit fertiger Einladung für einen Mitarbeiter. Mit „folge“ ist es Teil von
     „Alle nacheinander“: ein Tipp verschickt und es geht zum Nächsten.
     Liefert 'weiter' (weiter zum Nächsten) oder null (abgebrochen). */
  function einladung(maId, nachher, folge) {
    var e;
    try { e = Kern.einladung(maId); } catch (x) { UI.fehler(x); return Promise.resolve(null); }
    var verschickt = false;

    var wege = [];
    if (e.mail) wege.push(['mail', '✉️ ' + T.t('ein_per_mail')]);
    if (e.telegram.url) wege.push(['telegram', '✈️ ' + T.t('ein_per_telegram')]);
    if (e.whatsapp) wege.push(['whatsapp', '💬 ' + T.t('ein_per_whatsapp')]);
    wege.push(['kopie', '📋 ' + T.t('ein_text_kopieren')]);

    var h = (e.hatKontakt ? ''
      : '<div class="hinweis warn">' + UI.sicher(T.t('ein_kein_kontakt').replace('{name}', e.name))
        + '<div style="margin-top:8px"><button type="button" class="haupt" data-ein-kontakt="1">'
        + UI.sicher(T.t('ein_kontakt_eintragen')) + '</button></div></div>')
      + '<p style="margin:0 0 8px;font-size:13.5px;color:var(--text-leise)">'
      + UI.sicher(T.t('ein_sprache_info')
        .replace('{sprache}', T.t(e.sprache === 'it' ? 'ein_sprache_it' : 'ein_sprache_de'))
        .replace('{name}', e.name.split(' ')[0]))
      + (e.eingeladen_am ? ' ' + UI.sicher(T.t('ein_zuletzt').replace('{datum}', Kern.dmy(e.eingeladen_am))) : '')
      + '</p>'
      + '<div class="einladewege" style="display:flex;flex-wrap:wrap;gap:7px;margin-bottom:10px">'
      + wege.map(function (w, i) {
        return '<button type="button" data-ein-weg="' + w[0] + '"'
          + (i === 0 && e.hatKontakt ? ' class="haupt"' : '') + '>' + UI.sicher(w[1]) + '</button>';
      }).join('') + '</div>'
      + '<pre class="einladetext" style="white-space:pre-wrap;word-break:break-word;margin:0;'
      + 'font-family:inherit;font-size:13.5px;line-height:1.45;background:var(--flaeche2);'
      + 'border:1px solid var(--linie);border-radius:8px;padding:10px 12px;max-height:32vh;'
      + 'overflow:auto">' + UI.sicher(e.text) + '</pre>';

    var knoepfe = folge
      ? [{ text: T.t('abbrechen'), wert: null },
        { text: folge.letzter ? T.t('schliessen') : T.t('ein_ueberspringen'), wert: 'weiter' }]
      : [{ text: T.t('schliessen'), wert: null }];

    return UI.fenster({
      titel: T.t('app_einladung') + ' · ' + e.name + (folge ? ' (' + folge.nr + '/' + folge.gesamt + ')' : ''),
      breite: 640,
      inhalt: h,
      keinFokus: true,
      knoepfe: knoepfe,
      beimOeffnen: function (hg) {
        var kontakt = hg.querySelector('[data-ein-kontakt]');
        if (kontakt) {
          kontakt.onclick = function () {
            hg.querySelector('[data-x]').click();
            mitarbeiter(maId, nachher);
          };
        }
        hg.querySelectorAll('[data-ein-weg]').forEach(function (b) {
          b.onclick = function () {
            var weg = b.getAttribute('data-ein-weg');
            if (weg === 'mail') window.open(e.mail, '_blank');
            else if (weg === 'whatsapp') window.open(e.whatsapp, '_blank');
            else if (weg === 'telegram') {
              if (e.telegram.art === 'name') {
                UI.kopieren(e.text).then(function (ok) {
                  if (ok !== false) UI.melde(T.t('ein_tg_kopiert'), 'gut');
                });
              }
              window.open(e.telegram.url, '_blank');
            } else UI.kopieren(e.text);
            Kern.eingeladenSetzen(maId, weg);
            verschickt = true;
            if (folge) folge.verschickt = true;
            b.classList.add('gruen');
            b.classList.remove('haupt');
            if (b.textContent.indexOf('✓') < 0) b.textContent = '✓ ' + b.textContent;
            if (folge) {
              /* Kurz stehen lassen, damit der Haken zu sehen ist – dann der Nächste. */
              setTimeout(function () {
                var knopfe = hg.querySelectorAll('.ffuss button');
                if (document.body.contains(hg) && knopfe.length) knopfe[knopfe.length - 1].click();
              }, 650);
            }
          };
        });
      }
    }).then(function (w) {
      if (verschickt) ruf(nachher);
      return w;
    });
  }

  /* Übersicht „Alle einladen“: einzeln antippen oder alle nacheinander. */
  function alleEinladen(nachher) {
    var leute = Kern.maListe(false).filter(function (m) { return !m.ist_chef; });
    if (!leute.length) { UI.melde(T.t('ein_keiner'), 'warn'); return; }
    var liste = leute.map(function (m) { return Kern.einladung(m.id); });
    var bereit = liste.filter(function (e) { return e.hatKontakt; });

    var h = '<p style="margin:0 0 10px">' + UI.sicher(T.t('ein_alle_info')) + '</p>'
      + '<div style="display:flex;flex-wrap:wrap;gap:8px">'
      + liste.map(function (e, i) {
        return '<button type="button" data-ein-ma="' + i + '"'
          + (e.hatKontakt ? (e.eingeladen_am ? ' class="gruen"' : ' class="haupt"')
            : ' title="' + UI.sicher(T.t('ein_ohne_kontakt')) + '"')
          + '>' + (e.eingeladen_am ? '✓ ' : (e.hatKontakt ? '' : '⚠ ')) + UI.sicher(e.name)
          + '</button>';
      }).join('') + '</div>';

    UI.fenster({
      titel: T.t('ein_alle_titel').replace('{n}', bereit.length),
      breite: 620,
      inhalt: h,
      knoepfe: [
        { text: T.t('schliessen'), wert: null },
        { text: T.t('m_alle_nacheinander'), art: 'haupt', wert: 'alle' }
      ],
      beimOeffnen: function (hg) {
        hg.querySelectorAll('[data-ein-ma]').forEach(function (b) {
          b.onclick = function () {
            var e = liste[Number(b.getAttribute('data-ein-ma'))];
            hg.querySelector('[data-x]').click();
            einladung(e.id, nachher).then(function () { alleEinladen(nachher); });
          };
        });
      }
    }).then(function (w) {
      if (w !== 'alle') return;
      if (!bereit.length) { UI.melde(T.t('ein_niemand_bereit'), 'warn'); return; }
      var i = 0, erledigt = 0;
      (function naechste() {
        if (i >= bereit.length) {
          UI.melde(T.t('ein_alle_fertig').replace('{n}', erledigt), 'gut');
          return;
        }
        var e = bereit[i];
        i++;
        var f = { nr: i, gesamt: bereit.length, letzter: i === bereit.length, verschickt: false };
        einladung(e.id, nachher, f).then(function (antwort) {
          if (f.verschickt) erledigt++;
          if (antwort === 'weiter') naechste();
        });
      })();
    });
  }

  /* =========================================================================
     Sprache
     ========================================================================= */

  function zuhoeren(knopf, statusFeld, fertig) {
    var Erkenner = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Erkenner) {
      UI.melde(T.t('m_kein_mikro'), 'warn');
      return;
    }
    var r = new Erkenner();
    r.lang = T.aktuell() === 'it' ? 'it-IT' : 'de-DE';
    r.interimResults = false;
    r.maxAlternatives = 1;
    if (knopf) knopf.classList.add('hoert');
    if (statusFeld) statusFeld.textContent = T.t('m_hoere');
    r.onresult = function (e) { fertig(e.results[0][0].transcript); };
    r.onerror = function () { UI.melde(T.t('m_nichts_an'), 'warn'); };
    r.onend = function () {
      if (knopf) knopf.classList.remove('hoert');
      if (statusFeld) statusFeld.textContent = T.t('m_mikro_tippen');
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
          titel: T.t('m_richtig_verstanden'),
          inhalt: '<p style="font-size:13px;color:var(--text-leise)">„' + UI.sicher(v.original)
            + '“</p><p style="font-size:17px"><b>' + UI.sicher(v.beschreibung) + '</b></p>'
            + (v.unklar.length
              ? '<div class="hinweis warn">' + T.t('m_unsicher') + UI.sicher(v.unklar.join(', ')) + '</div>'
              : ''),
          knoepfe: [
            { text: T.t('abbrechen'), wert: false },
            { text: T.t('m_ja_eintragen'), art: 'haupt', wert: true }
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
    einladung: einladung, alleEinladen: alleEinladen,
    zuhoeren: zuhoeren, befehl: befehl,
    kuerzel: kuerzel, appLink: appLink, farbeFuerPosition: farbeFuerPosition,
    erinnerungText: erinnerungText, warnungenZeigen: warnungenZeigen
  };
})();

window.Masken = Masken;
