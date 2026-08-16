/* PizzaPlan · Handy-Fassung (iPhone)
   ----------------------------------------------------------------------------
   Dieselben Daten wie am PC, aber für den Daumen gebaut: Fußleiste unten,
   ein Tag auf einmal, Wischen von Tag zu Tag, große Flächen.
*/
var Handy = (function () {
  'use strict';

  var plTag = Kern.heute();
  var zeitTage = 7;
  var wunschStatus = 'offen';

  function $(id) { return document.getElementById(id); }

  /* =========================================================================
     Start
     ========================================================================= */

  function start() {
    Kern.bereit.then(function () {
      T.setze(Kern.einst('sprache'));
      UI.schemaSetzen(UI.schemaLesen());
      $('anmeldung_betrieb').textContent = Kern.einst('betrieb');
      $('kopf_betrieb').textContent = Kern.einst('betrieb');
      var frei = false;
      try { frei = sessionStorage.getItem('pp_chef') === '1'; } catch (e) { frei = false; }
      if (frei) hinein(); else anmeldungZeigen();
    });
  }

  function anmeldungZeigen() {
    $('anmeldung').style.display = '';
    T.anwenden();
    var block = $('ziffern');
    var tasten = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '←'];
    block.innerHTML = tasten.map(function (z) {
      return '<button type="button" data-z="' + z + '">' + z + '</button>';
    }).join('');
    block.querySelectorAll('[data-z]').forEach(function (b) {
      b.onclick = function () {
        UI.tippen(b);
        var f = $('pin_feld');
        var z = b.getAttribute('data-z');
        if (z === 'C') f.value = '';
        else if (z === '←') f.value = f.value.slice(0, -1);
        else if (f.value.length < 8) f.value += z;
        if (f.value.length >= 4) $('pin_fehler').style.display = 'none';
      };
    });
    $('pin_knopf').onclick = pruefePin;
  }

  function pruefePin() {
    if (!Kern.chefPinPruefen($('pin_feld').value)) {
      var f = $('pin_fehler');
      f.style.display = '';
      f.textContent = 'Diese PIN stimmt nicht. Beim ersten Start ist sie 1234.';
      $('pin_feld').value = '';
      return;
    }
    try { sessionStorage.setItem('pp_chef', '1'); } catch (e) { /* egal */ }
    hinein();
  }

  function hinein() {
    $('anmeldung').style.display = 'none';
    $('haupt').style.display = '';
    var c = Kern.chef();
    if (c) Kern.anmelden(c.id);
    verdrahten();
    T.anwenden();
    spracheKnopf();
    alleZeichnen();
    setInterval(function () { Masken.erinnerungen(alleZeichnen); }, 40000);
    setTimeout(function () { Masken.erinnerungen(alleZeichnen); }, 3000);
  }

  function alleZeichnen() {
    heuteZeichnen();
    planZeichnen();
    teamZeichnen();
    zeitenZeichnen();
    wuenscheZeichnen();
    termineZeichnen();
    versandZeichnen();
    einstellungenFuellen();
    punkteZeichnen();
  }

  function punkteZeichnen() {
    var u = Kern.uebersicht();
    var b = $('fussleiste').querySelector('[data-seite=mehr]');
    var alt = b.querySelector('.punkt');
    if (alt) alt.remove();
    if (u.offene_wuensche) {
      var p = document.createElement('span');
      p.className = 'punkt';
      b.appendChild(p);
    }
  }

  /* =========================================================================
     Navigation
     ========================================================================= */

  function seiteZeigen(name) {
    document.querySelectorAll('.fussleiste button').forEach(function (b) {
      b.classList.toggle('an', b.getAttribute('data-seite') === name);
    });
    document.querySelectorAll('.seite').forEach(function (s) {
      s.classList.toggle('an', s.id === 's_' + name);
    });
    window.scrollTo(0, 0);
  }

  function teilZeigen(name) {
    $('me_streifen').querySelectorAll('button').forEach(function (b) {
      b.classList.toggle('an', b.getAttribute('data-teil') === name);
    });
    document.querySelectorAll('.teil').forEach(function (t) {
      t.classList.toggle('an', t.id === 't_' + name);
      t.style.display = t.id === 't_' + name ? '' : 'none';
    });
    if (name === 'auswertung') auswertungZeichnen();
  }

  function verdrahten() {
    $('fussleiste').querySelectorAll('button').forEach(function (b) {
      b.onclick = function () { UI.tippen(b); seiteZeigen(b.getAttribute('data-seite')); };
    });
    $('me_streifen').querySelectorAll('button').forEach(function (b) {
      b.onclick = function () { teilZeigen(b.getAttribute('data-teil')); };
    });
    teilZeigen('wuensche');

    $('knopf_schema').onclick = function () {
      var neu = UI.schemaSetzen(
        document.documentElement.getAttribute('data-schema') === 'dunkel' ? 'hell' : 'dunkel');
      $('knopf_schema').textContent = neu === 'dunkel' ? '☀' : '🌙';
      Kern.einstSetzen({ farbschema: neu });
    };
    $('knopf_schema').textContent = UI.schemaLesen() === 'dunkel' ? '☀' : '🌙';
    $('knopf_sprache').onclick = function () {
      var neu = T.aktuell() === 'de' ? 'it' : 'de';
      Kern.einstSetzen({ sprache: neu });
      T.setze(neu);
      spracheKnopf();
      T.anwenden();
      alleZeichnen();
    };
    $('knopf_mikro').onclick = function () { Masken.befehl($('knopf_mikro'), alleZeichnen); };

    /* Heute */
    $('h_schicht').onclick = function () { Masken.schicht(null, Kern.heute(), null, alleZeichnen); };
    $('h_frei').onclick = function () { seiteZeigen('mehr'); teilZeigen('wuensche'); };
    $('h_freigeben').onclick = wocheFreigeben;
    $('h_versand').onclick = function () { seiteZeigen('mehr'); teilZeigen('versand'); };

    /* Plan */
    $('pl_zurueck').onclick = function () { tagWechseln(-1); };
    $('pl_vor').onclick = function () { tagWechseln(1); };
    $('pl_heute').onclick = function () { plTag = Kern.heute(); planZeichnen(); };
    $('pl_woche').onclick = wochenUebersicht;
    $('pl_neu').onclick = function () { Masken.schicht(null, plTag, null, alleZeichnen); };
    UI.wischen($('s_plan'), function () { tagWechseln(1); }, function () { tagWechseln(-1); });

    /* Team */
    $('tm_suche').oninput = teamZeichnen;
    $('tm_neu').onclick = function () { Masken.mitarbeiter(null, alleZeichnen); };
    $('tm_einlesen').onclick = function () { seiteZeigen('mehr'); teilZeigen('einlesen'); };

    /* Zeiten */
    $('ze_streifen').querySelectorAll('button').forEach(function (b) {
      b.onclick = function () {
        zeitTage = Number(b.getAttribute('data-tage'));
        $('ze_streifen').querySelectorAll('button').forEach(function (x) {
          x.classList.toggle('an', x === b);
        });
        zeitenZeichnen();
      };
    });
    $('ze_freigeben').onclick = function () {
      var n = Kern.zeitenFreigeben(Kern.plusTage(Kern.heute(), -zeitTage + 1), Kern.heute(), null);
      UI.melde(n ? n + ' Zeiten freigegeben.' : 'Es war nichts offen.', n ? 'gut' : 'warn');
      if (n) UI.rueckStreifen(n + ' Zeiten freigegeben', alleZeichnen);
      alleZeichnen();
    };
    $('ze_neu').onclick = function () { Masken.zeit(null, alleZeichnen); };

    /* Wünsche */
    $('wu_streifen').querySelectorAll('button').forEach(function (b) {
      b.onclick = function () {
        wunschStatus = b.getAttribute('data-status');
        $('wu_streifen').querySelectorAll('button').forEach(function (x) {
          x.classList.toggle('an', x === b);
        });
        wuenscheZeichnen();
      };
    });
    $('wu_neu').onclick = function () { Masken.wunsch(null, alleZeichnen); };

    /* Termine */
    $('te_neu').onclick = function () { Masken.termin(null, null, alleZeichnen); };
    $('te_mikro').onclick = function () {
      Masken.zuhoeren($('te_mikro'), $('te_status'), function (text) {
        Masken.termin(null, Kern.terminAusText(text, Kern.heute()), alleZeichnen);
      });
    };

    /* Auswertung */
    $('au_monat').value = Kern.heute().slice(0, 7);
    $('au_monat').onchange = auswertungZeichnen;
    $('au_csv').onclick = function () {
      var monat = $('au_monat').value || Kern.heute().slice(0, 7);
      UI.dateiSpeichern('PizzaPlan_' + monat + '.csv', Kern.auswertungCsv(monat), 'text/csv');
      UI.melde('Die Datei ist gespeichert.', 'gut');
    };

    /* Versand */
    $('vs_von').value = Kern.wochenstart(Kern.heute());
    $('vs_bis').value = Kern.plusTage(Kern.wochenstart(Kern.heute()), 6);
    $('vs_weg').onchange = versandZeichnen;
    $('vs_start').onclick = function () {
      var ids = [];
      $('vs_empfaenger').querySelectorAll('input:checked').forEach(function (c) {
        ids.push(Number(c.value));
      });
      Masken.versand($('vs_von').value, $('vs_bis').value, $('vs_weg').value, ids);
    };
    $('vs_gesamt').onclick = function () {
      var text = Kern.planTextGesamt($('vs_von').value, $('vs_bis').value, T.aktuell());
      UI.fenster({
        titel: T.t('gesamtplan'),
        inhalt: '<pre style="white-space:pre-wrap;font-family:Consolas,monospace;font-size:13px;'
          + 'background:var(--flaeche2);border:1px solid var(--linie);border-radius:8px;'
          + 'padding:12px;overflow:auto">' + UI.sicher(text) + '</pre>',
        knoepfe: [
          { text: T.t('schliessen'), wert: null },
          { text: T.t('kopieren'), art: 'haupt', wert: 'kopie' }
        ]
      }).then(function (w) { if (w === 'kopie') UI.kopieren(text); });
    };

    /* Einlesen */
    $('ei_datei').onclick = function () { $('ei_dateifeld').click(); };
    $('ei_dateifeld').onchange = function () {
      var d = $('ei_dateifeld').files[0];
      if (!d) return;
      UI.dateiLesen(d).then(function (text) {
        $('ei_text').value = text;
        einlesenPruefen();
      }).catch(UI.fehler);
      $('ei_dateifeld').value = '';
    };
    $('ei_pruefen').onclick = einlesenPruefen;
    $('ei_vorlage').onclick = function () {
      UI.dateiSpeichern('Importvorlage_Mitarbeiter.csv', Kern.importVorlage(), 'text/csv');
      UI.melde('Die Vorlage ist gespeichert.', 'gut');
    };

    /* Einstellungen */
    $('es_speichern').onclick = einstellungenSpeichern;
    $('es_sicherung').onclick = function () {
      UI.dateiSpeichern('PizzaPlan_Sicherung_' + Kern.heute() + '.json',
        Kern.sicherungText(), 'application/json');
      UI.melde('Die Sicherung ist gespeichert.', 'gut');
    };
    $('es_beispiel').onclick = function () {
      if (!Kern.hatBeispieldaten()) { UI.melde('Es sind keine Beispieldaten mehr da.', 'warn'); return; }
      UI.frage(T.t('beispiel_weg'), 'Alle Beispieleinträge verschwinden, eigene bleiben.')
        .then(function (ja) {
          if (!ja) return;
          Kern.beispielEntfernen();
          UI.rueckStreifen('Beispieldaten entfernt', alleZeichnen);
          alleZeichnen();
        });
    };
    $('es_abmelden').onclick = function () {
      try { sessionStorage.removeItem('pp_chef'); } catch (e) { /* egal */ }
      location.reload();
    };
  }

  function spracheKnopf() { $('knopf_sprache').textContent = T.aktuell() === 'de' ? 'DE' : 'IT'; }

  /* =========================================================================
     Heute
     ========================================================================= */

  function heuteZeichnen() {
    var u = Kern.uebersicht();
    $('h_kacheln').innerHTML = [
      [T.t('kachel_team'), u.team_aktiv, '', 'team'],
      [T.t('kachel_woche'), UI.zahl(u.wochenstunden, 1), 'gut', 'plan'],
      [T.t('kachel_offen'), u.offene_wuensche, u.offene_wuensche ? 'warn' : 'gut', 'mehr'],
      [T.t('kachel_entwurf'), u.nicht_freigegeben, u.nicht_freigegeben ? 'warn' : 'gut', 'plan']
    ].map(function (k) {
      return '<div class="kachel ' + k[2] + '" data-ziel="' + k[3] + '">'
        + '<div class="wert">' + UI.sicher(k[1]) + '</div>'
        + '<div class="bez">' + UI.sicher(k[0]) + '</div></div>';
    }).join('');
    $('h_kacheln').querySelectorAll('.kachel').forEach(function (k) {
      k.onclick = function () { seiteZeigen(k.getAttribute('data-ziel')); };
    });

    $('h_heute').innerHTML = u.heute.length ? u.heute.map(function (s) {
      return '<div class="zeile" data-schicht="' + s.id + '" style="border-left-color:'
        + s.farbe + '"><div class="kreis" style="background:' + s.farbe + '">'
        + UI.sicher(Masken.kuerzel(s.ma_name || '?')) + '</div>'
        + '<div class="haupttext"><b>' + UI.sicher(s.ma_name || T.t('offen_bez')) + '</b>'
        + '<span>' + UI.sicher(s.position) + '</span></div>'
        + '<div class="rechts">' + s.von + '<br>' + s.bis + '</div></div>';
    }).join('') : UI.leer(T.t('heute_niemand'));
    $('h_heute').querySelectorAll('[data-schicht]').forEach(function (z) {
      z.onclick = function () {
        Masken.schicht(Number(z.getAttribute('data-schicht')), null, null, alleZeichnen);
      };
    });

    $('h_stempel').innerHTML = u.eingestempelt.length ? u.eingestempelt.map(function (z) {
      return '<div class="zeile" style="border-left-color:var(--gruen)">'
        + '<div class="haupttext"><b>' + UI.sicher(z.ma_name) + '</b>'
        + '<span>seit ' + UI.sicher(z.start) + ' Uhr</span></div>'
        + '<div class="rechts">' + UI.etikett(T.t('laeuft'), 'laeuft') + '</div></div>';
    }).join('') : UI.leer(T.t('niemand_gestempelt'));

    $('h_termine').innerHTML = u.termine.length ? u.termine.slice(0, 5).map(function (t) {
      return '<div class="zeile" data-termin="' + t.id + '" style="border-left-color:var(--gelb)">'
        + '<div class="haupttext"><b>' + UI.sicher(t.titel) + '</b><span>'
        + UI.tagKurz(t.datum) + (t.von_zeit ? ' · ' + t.von_zeit + ' Uhr' : '')
        + '</span></div></div>';
    }).join('') : UI.leer(T.t('keine_termine'));
    $('h_termine').querySelectorAll('[data-termin]').forEach(function (z) {
      z.onclick = function () {
        Masken.termin(Number(z.getAttribute('data-termin')), null, alleZeichnen);
      };
    });
  }

  function wocheFreigeben() {
    var mo = Kern.wochenstart(plTag);
    var n = Kern.wocheFreigeben(mo, Kern.plusTage(mo, 6), 1);
    UI.melde(n ? n + ' Schichten freigegeben – das Team sieht den Plan jetzt.'
      : 'In dieser Woche war schon alles freigegeben.', n ? 'gut' : 'warn');
    if (n) UI.rueckStreifen('Plan freigegeben', alleZeichnen);
    alleZeichnen();
  }

  /* =========================================================================
     Plan
     ========================================================================= */

  function tagWechseln(n) {
    plTag = Kern.plusTage(plTag, n);
    planZeichnen();
  }

  function planZeichnen() {
    var mo = Kern.wochenstart(plTag);
    var tage = Kern.tageZwischen(mo, Kern.plusTage(mo, 6));
    var h = Kern.heute();

    $('pl_band').innerHTML = tage.map(function (d) {
      var n = Kern.schichten(d, d, false, null).length;
      return '<button type="button" data-tag="' + d + '" class="'
        + (d === plTag ? 'an ' : '') + (d === h ? 'heute' : '') + '">'
        + UI.sicher(Kern.WT_KURZ[T.aktuell()][Kern.wochentag(d)])
        + '<b>' + Kern.ausIso(d).getDate() + '</b>'
        + (n ? '<span class="pkt"></span>' : '<span style="height:5px"></span>') + '</button>';
    }).join('');
    $('pl_band').querySelectorAll('[data-tag]').forEach(function (b) {
      b.onclick = function () {
        UI.tippen(b);
        plTag = b.getAttribute('data-tag');
        planZeichnen();
      };
    });
    /* Der gewählte Tag soll immer sichtbar sein, auch wenn das Band scrollt. */
    var anKnopf = $('pl_band').querySelector('button.an');
    if (anKnopf && anKnopf.scrollIntoView) {
      anKnopf.scrollIntoView({ block: 'nearest', inline: 'center' });
    }

    $('pl_titel').textContent = UI.tagLang(plTag);

    var rows = Kern.schichten(plTag, plTag, false, null);
    if (!rows.length) {
      $('pl_liste').innerHTML = UI.leer('An diesem Tag ist noch niemand eingeteilt.');
    } else {
      $('pl_liste').innerHTML = rows.map(function (s) {
        var warn = Kern.konflikte(s, s.id);
        return '<div class="zeile' + (s.veroeffentlicht ? '' : ' entwurf')
          + '" data-schicht="' + s.id + '" style="border-left-color:'
          + Masken.farbeFuerPosition(s.position, s.farbe) + '">'
          + '<div class="kreis" style="background:' + s.farbe + '">'
          + UI.sicher(Masken.kuerzel(s.ma_name || '?')) + '</div>'
          + '<div class="haupttext"><b>' + UI.sicher(s.ma_name || T.t('offen_bez')) + '</b>'
          + '<span>' + UI.sicher(s.position) + ' · ' + UI.zahl(s.dauer_std, 2) + ' h'
          + (s.pause_min ? ' · ' + s.pause_min + ' min Pause' : '')
          + (s.veroeffentlicht ? '' : ' · Entwurf')
          + (warn.length ? ' · ⚠' : '') + '</span></div>'
          + '<div class="rechts"><b style="font-size:15px;color:var(--text)">' + s.von
          + '</b><br>' + s.bis + '</div></div>';
      }).join('');
      $('pl_liste').querySelectorAll('[data-schicht]').forEach(function (z) {
        z.onclick = function () {
          UI.tippen(z);
          Masken.schicht(Number(z.getAttribute('data-schicht')), null, null, alleZeichnen);
        };
      });
    }

    /* Abwesende an diesem Tag als Hinweis darunter */
    var frei = Kern.maListe(false).filter(function (m) { return Kern.abwesend(m.id, plTag); });
    if (frei.length) {
      $('pl_liste').innerHTML += '<div class="hinweis" style="margin-top:10px">'
        + frei.map(function (m) {
          return UI.sicher(m.name) + ' – ' + UI.sicher(Kern.abwesend(m.id, plTag).typ);
        }).join('<br>') + '</div>';
    }
  }

  function wochenUebersicht() {
    var mo = Kern.wochenstart(plTag);
    var bes = Kern.besetzung(mo, Kern.plusTage(mo, 6));
    var h = '<table><thead><tr><th>Tag</th><th class="zahl">Schichten</th>'
      + '<th class="zahl">Stunden</th><th class="zahl">offen</th></tr></thead><tbody>';
    bes.forEach(function (b) {
      h += '<tr><td>' + UI.tagKurz(b.datum) + '</td>'
        + '<td class="zahl">' + b.anzahl + '</td>'
        + '<td class="zahl">' + UI.zahl(b.stunden, 1) + '</td>'
        + '<td class="zahl"' + (b.offen ? ' style="color:var(--rot);font-weight:600"' : '') + '>'
        + (b.offen || '–') + '</td></tr>';
    });
    h += '</tbody></table>';
    UI.fenster({
      titel: 'Woche ' + Kern.dm(mo) + ' – ' + Kern.dmy(Kern.plusTage(mo, 6)),
      inhalt: '<div class="tabelle">' + h + '</div>',
      knoepfe: [
        { text: T.t('schliessen'), wert: null },
        { text: T.t('vorwoche_uebernehmen'), wert: 'kopie' },
        { text: T.t('plan_freigeben'), art: 'haupt', wert: 'frei' }
      ]
    }).then(function (w) {
      if (w === 'frei') wocheFreigeben();
      if (w === 'kopie') {
        try {
          var n = Kern.wocheKopieren(Kern.plusTage(mo, -7), mo);
          UI.melde(n ? n + ' Schichten übernommen.' : 'Es gab nichts zu übernehmen.',
            n ? 'gut' : 'warn');
          if (n) UI.rueckStreifen(n + ' Schichten übernommen', alleZeichnen);
          alleZeichnen();
        } catch (e) { UI.fehler(e); }
      }
    });
  }

  /* =========================================================================
     Team
     ========================================================================= */

  function teamZeichnen() {
    var suche = String($('tm_suche').value || '').toLowerCase().trim();
    var rows = Kern.maListe(false).filter(function (m) {
      if (!suche) return true;
      return (m.name + ' ' + (m.rolle || '')).toLowerCase().indexOf(suche) >= 0;
    });
    $('tm_liste').innerHTML = rows.length ? rows.map(function (m) {
      return '<div class="zeile" data-ma="' + m.id + '" style="border-left-color:' + m.farbe + '">'
        + '<div class="kreis" style="background:' + m.farbe + '">'
        + UI.sicher(Masken.kuerzel(m.name)) + '</div>'
        + '<div class="haupttext"><b>' + UI.sicher(m.name) + '</b><span>'
        + UI.sicher(m.rolle || '') + (m.vertrag ? ' · ' + UI.sicher(m.vertrag) : '')
        + (m.telefon ? ' · ' + UI.sicher(m.telefon) : '') + '</span></div>'
        + '<div class="rechts">' + (m.stundenlohn ? UI.euro(m.stundenlohn) : '') + '</div></div>';
    }).join('') : UI.leer('Niemand gefunden.');
    $('tm_liste').querySelectorAll('[data-ma]').forEach(function (z) {
      z.onclick = function () {
        UI.tippen(z);
        Masken.mitarbeiter(Number(z.getAttribute('data-ma')), alleZeichnen);
      };
    });
  }

  /* =========================================================================
     Zeiten
     ========================================================================= */

  function zeitenZeichnen() {
    var von = Kern.plusTage(Kern.heute(), -zeitTage + 1);
    var rows = Kern.zeiten(von, Kern.heute(), null);
    var summe = rows.reduce(function (a, z) { return a + z.dauer_std; }, 0);
    var offen = rows.filter(function (z) { return z.ende && !z.freigegeben; }).length;
    $('ze_summe').innerHTML = '<b>' + UI.zahl(summe, 2) + ' ' + T.t('stunden') + '</b> in '
      + zeitTage + ' Tagen' + (offen ? ' · <b>' + offen + '</b> noch ungeprüft' : ' · alles geprüft');

    $('ze_liste').innerHTML = rows.length ? rows.map(function (z) {
      return '<div class="zeile" data-zeit="' + z.id + '" style="border-left-color:'
        + (z.ende ? (z.freigegeben ? 'var(--gruen)' : 'var(--gelb)') : 'var(--blau)') + '">'
        + '<div class="haupttext"><b>' + UI.sicher(z.ma_name) + '</b><span>'
        + UI.tagKurz(z.datum) + ' · ' + z.start + (z.ende ? '–' + z.ende : ' · läuft')
        + (z.pause_min ? ' · ' + z.pause_min + ' min' : '') + '</span></div>'
        + '<div class="rechts"><b style="color:var(--text)">'
        + (z.ende ? UI.zahl(z.dauer_std, 2) + ' h' : '–') + '</b><br>'
        + (z.ende ? (z.freigegeben ? '✓ geprüft' : 'offen') : T.t('laeuft')) + '</div></div>';
    }).join('') : UI.leer(T.t('keine_zeiten'));
    $('ze_liste').querySelectorAll('[data-zeit]').forEach(function (z) {
      z.onclick = function () {
        UI.tippen(z);
        Masken.zeit(Number(z.getAttribute('data-zeit')), alleZeichnen);
      };
    });
  }

  /* =========================================================================
     Wünsche
     ========================================================================= */

  function wuenscheZeichnen() {
    var rows = Kern.wuensche(null, wunschStatus || null);
    $('wu_liste').innerHTML = rows.length ? rows.map(function (w) {
      return '<div class="zeile" style="border-left-color:'
        + (w.status === 'genehmigt' ? 'var(--gruen)'
          : (w.status === 'abgelehnt' ? 'var(--rot)' : 'var(--gelb)')) + '">'
        + '<div class="haupttext"><b>' + UI.sicher(w.ma_name) + ' · ' + UI.sicher(w.typ) + '</b>'
        + '<span>' + UI.tagKurz(w.von_datum)
        + (w.bis_datum !== w.von_datum ? ' – ' + UI.tagKurz(w.bis_datum) : '')
        + (w.bemerkung ? ' · ' + UI.sicher(w.bemerkung) : '') + '</span></div>'
        + '<div class="rechts" style="white-space:nowrap">'
        + (w.status !== 'genehmigt'
          ? '<button type="button" class="gruen" data-ja="' + w.id + '">✓</button> ' : '')
        + (w.status !== 'abgelehnt'
          ? '<button type="button" data-nein="' + w.id + '">✕</button> ' : '')
        + '<button type="button" data-bearb="' + w.id + '">…</button></div></div>';
    }).join('') : UI.leer(T.t('keine_wuensche'));

    $('wu_liste').querySelectorAll('[data-ja]').forEach(function (b) {
      b.onclick = function () { statusSetzen(Number(b.getAttribute('data-ja')), 'genehmigt'); };
    });
    $('wu_liste').querySelectorAll('[data-nein]').forEach(function (b) {
      b.onclick = function () { statusSetzen(Number(b.getAttribute('data-nein')), 'abgelehnt'); };
    });
    $('wu_liste').querySelectorAll('[data-bearb]').forEach(function (b) {
      b.onclick = function () { Masken.wunsch(Number(b.getAttribute('data-bearb')), alleZeichnen); };
    });
  }

  function statusSetzen(id, status) {
    try {
      Kern.wunschStatus(id, status);
      UI.rueckStreifen('Wunsch ' + T.t(status), alleZeichnen);
      alleZeichnen();
    } catch (e) { UI.fehler(e); }
  }

  /* =========================================================================
     Termine
     ========================================================================= */

  function termineZeichnen() {
    var rows = Kern.termine(Kern.heute(), Kern.plusTage(Kern.heute(), 120), true);
    $('te_liste').innerHTML = rows.length ? rows.map(function (t) {
      return '<div class="zeile" data-termin="' + t.id + '" style="border-left-color:var(--gelb)">'
        + '<div class="haupttext"><b>' + UI.sicher(t.titel) + '</b><span>'
        + UI.tagKurz(t.datum)
        + (t.ganztags ? ' · ' + T.t('ganztags') : (t.von_zeit ? ' · ' + t.von_zeit + ' Uhr' : ''))
        + (t.ort ? ' · ' + UI.sicher(t.ort) : '') + '</span></div>'
        + '<div class="rechts"><button type="button" data-fertig="' + t.id + '">✓</button></div>'
        + '</div>';
    }).join('') : UI.leer(T.t('keine_termine'));

    $('te_liste').querySelectorAll('[data-fertig]').forEach(function (b) {
      b.onclick = function (e) {
        e.stopPropagation();
        Kern.terminErledigt(Number(b.getAttribute('data-fertig')), 1);
        UI.rueckStreifen('Termin erledigt', alleZeichnen);
        alleZeichnen();
      };
    });
    $('te_liste').querySelectorAll('[data-termin]').forEach(function (z) {
      z.onclick = function () {
        Masken.termin(Number(z.getAttribute('data-termin')), null, alleZeichnen);
      };
    });
  }

  /* =========================================================================
     Auswertung
     ========================================================================= */

  function auswertungZeichnen() {
    var monat = $('au_monat').value || Kern.heute().slice(0, 7);
    var a;
    try { a = Kern.auswertung(monat, null); } catch (e) { UI.fehler(e); return; }
    var h = '<div class="hinweis gut"><b>' + UI.zahl(a.summe_stunden, 1) + ' '
      + T.t('stunden') + '</b> · ' + UI.euro(a.summe_lohn) + '</div>';
    h += a.zeilen.length ? a.zeilen.map(function (z) {
      return '<div class="zeile" style="border-left-color:' + (z.farbe || 'var(--blau)') + '">'
        + '<div class="haupttext"><b>' + UI.sicher(z.name) + '</b><span>'
        + UI.zahl(z.stunden, 2) + ' h · ' + T.t('geplant') + ' ' + UI.zahl(z.geplant_std, 2) + ' h'
        + (z.offen ? ' · ' + z.offen + ' ungeprüft' : '') + '</span>'
        + (z.vertrag === 'Minijob' && a.minijob_grenze
          ? UI.balken(z.anteil_grenze,
            z.ueber_grenze ? 'rot' : (z.anteil_grenze > 0.85 ? 'warn' : '')) : '')
        + '</div><div class="rechts"><b style="color:var(--text)">' + UI.euro(z.gesamt)
        + '</b></div></div>';
    }).join('') : UI.leer(T.t('keine_zeiten'));
    $('au_inhalt').innerHTML = h;
  }

  /* =========================================================================
     Versand
     ========================================================================= */

  function versandZeichnen() {
    var weg = $('vs_weg').value;
    $('vs_empfaenger').innerHTML = Kern.maListe(false).map(function (m) {
      var fehlt = weg === 'whatsapp' ? !m.telefon : !m.email;
      return '<label class="haken" style="background:var(--flaeche);border:1px solid var(--linie);'
        + 'border-radius:10px;padding:11px 12px;margin-bottom:7px">'
        + '<input type="checkbox" value="' + m.id + '"' + (fehlt ? ' disabled' : ' checked')
        + '><span>' + UI.sicher(m.name)
        + (fehlt ? ' <small style="color:var(--rot)">'
          + (weg === 'whatsapp' ? 'keine Nummer' : 'keine Adresse') + '</small>' : '')
        + '</span></label>';
    }).join('');
  }

  /* =========================================================================
     Einlesen
     ========================================================================= */

  function einlesenPruefen() {
    var text = $('ei_text').value;
    if (!String(text).trim()) {
      UI.melde('Erst eine Datei wählen oder eine Tabelle einfügen.', 'warn');
      return;
    }
    Masken.importVorschau($('ei_ergebnis'), text, function () {
      $('ei_text').value = '';
      alleZeichnen();
      seiteZeigen('team');
    });
  }

  /* =========================================================================
     Einstellungen
     ========================================================================= */

  var REGLER = [
    ['pause_ab_6h', 'pause6', 0, 90, 5, 'min'],
    ['pause_ab_9h', 'pause9', 0, 120, 5, 'min'],
    ['zuschlag_sonntag', 'zuschlag_so', 0, 100, 5, '%'],
    ['zuschlag_nacht', 'zuschlag_nacht', 0, 100, 5, '%'],
    ['minijob_grenze', 'minijob_grenze', 0, 1200, 1, '€'],
    ['mindestlohn', 'mindestlohn', 0, 30, 0.01, '€']
  ];

  function einstellungenFuellen() {
    ['betrieb', 'chef_pin', 'positionen'].forEach(function (k) {
      var e = $('es_' + k);
      if (e) e.value = Kern.einst(k);
    });
    if (!$('es_regler').dataset.gebaut) {
      $('es_regler').innerHTML = REGLER.map(function (r) {
        return UI.schieber(r[0], T.t(r[1]), Kern.einstZahl(r[0]), r[2], r[3], r[4], r[5]);
      }).join('');
      $('es_regler').dataset.gebaut = '1';
      UI.regler($('es_regler'));
    }
    $('es_ort').textContent = 'Die Daten liegen in diesem Gerät (' + Kern.speicherArt() + ').';
  }

  function einstellungenSpeichern() {
    var w = {};
    ['betrieb', 'chef_pin', 'positionen'].forEach(function (k) { w[k] = $('es_' + k).value; });
    REGLER.forEach(function (r) {
      var e = $('es_regler').querySelector('[name="' + r[0] + '"]');
      if (e) w[r[0]] = e.value;
    });
    if (!String(w.betrieb || '').trim()) { UI.melde('Der Betrieb braucht einen Namen.', 'warn'); return; }
    if (!/^\d{4,8}$/.test(String(w.chef_pin || ''))) {
      UI.melde('Die Chef-PIN muss aus 4 bis 8 Ziffern bestehen.', 'warn');
      return;
    }
    Kern.einstSetzen(w);
    $('kopf_betrieb').textContent = w.betrieb;
    UI.melde(T.t('gespeichert'), 'gut');
    alleZeichnen();
  }

  return { start: start };
})();

window.Handy = Handy;
document.addEventListener('DOMContentLoaded', function () { Handy.start(); });
