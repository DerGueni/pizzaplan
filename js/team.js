/* PizzaPlan · Mitarbeiter-App
   ----------------------------------------------------------------------------
   Was der Mitarbeiter braucht und sonst nichts: stempeln, eigenen Plan sehen,
   frei wünschen, eigene Stunden nachschauen. Deutsch oder Italienisch.
*/
var Team = (function () {
  'use strict';

  var ich = null;
  var gewaehlt = null;
  var wocheMontag = Kern.wochenstart(Kern.heute());
  var installEreignis = null;

  function $(id) { return document.getElementById(id); }

  function istIphone() {
    var ua = navigator.userAgent || '';
    return /iPhone|iPad|iPod/.test(ua)
      || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  function alsAppGestartet() {
    try {
      return !!navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
    } catch (e) { return false; }
  }

  /* Wunschfenster aus masken.js: Überschrift für den Mitarbeiter passend beschriften
     (die Wunscharten übersetzt masken.js selbst). */
  function wunschFensterBeschriften(neu) {
    var alle = document.querySelectorAll('.hintergrund');
    var hg = alle[alle.length - 1];
    if (!hg) return;
    var h = hg.querySelector('.fkopf h2');
    if (h) {
      h.textContent = neu ? T.t('wunsch_melden_titel') : T.t('tm_eintrag_aendern');
    }
    var x = hg.querySelector('.fkopf [data-x]');
    if (x) x.setAttribute('aria-label', T.t('schliessen'));
  }

  /* =========================================================================
     Start und Anmeldung
     ========================================================================= */

  function start() {
    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      installEreignis = e;
      var b = $('ic_install');
      if (b) b.style.display = '';
    });

    Kern.bereit.then(function () {
      T.setze(Kern.einst('sprache'));
      UI.schemaSetzen(UI.schemaLesen());
      $('anmeldung_betrieb').textContent = Kern.einst('betrieb');
      $('kopf_betrieb').textContent = Kern.einst('betrieb');

      if (window.Verbindung && Verbindung.server()) { serverStart(); return; }

      var code = new URLSearchParams(location.search).get('k');
      if (code) {
        try {
          ich = Kern.anmeldenMitCode(code);
          merkeCode(code);
          hinein();
          return;
        } catch (e) { UI.melde(e.message, 'fehler'); }
      }
      var gemerkt = null;
      try { gemerkt = localStorage.getItem('pp_team_code'); } catch (e) { gemerkt = null; }
      if (gemerkt) {
        try { ich = Kern.anmeldenMitCode(gemerkt); hinein(); return; } catch (e) { /* weiter */ }
      }
      /* Bewusst kein Rückgriff auf die Chef-Anmeldung: wer die Mitarbeiter-App
         öffnet, wählt seinen Namen selbst. */
      anmeldungZeigen();
    });
  }

  function merkeCode(code) {
    try { localStorage.setItem('pp_team_code', code); } catch (e) { /* egal */ }
  }

  /* Am gemeinsamen Server: Anmeldung nur über den persönlichen Link, keine Namensliste.
     Die PIN wird nur verlangt, wenn der Chef das in den Einstellungen eingeschaltet hat. */
  function serverStart() {
    var code = new URLSearchParams(location.search).get('k');
    if (!code) { try { code = localStorage.getItem('pp_team_code'); } catch (e) { code = null; } }
    if (!code) { serverHinweis('tv_link_fehlt', false, false); return; }
    Verbindung.teamStart(code).then(function (r) {
      if (!r.ok) {
        if (r.grund === 'link') {
          try { localStorage.removeItem('pp_team_code'); } catch (e) { /* egal */ }
        }
        serverHinweis(r.grund === 'link' ? 'tv_link_ungueltig'
          : (r.grund === 'gesperrt' ? 'sv_gesperrt' : 'tv_kein_netz'), true, r.grund !== 'link');
        return;
      }
      try { ich = Kern.anmeldenMitCode(code); } catch (e) {
        serverHinweis('tv_link_ungueltig', true, false);
        return;
      }
      merkeCode(code);
      $('anmeldung_betrieb').textContent = Kern.einst('betrieb');
      $('kopf_betrieb').textContent = Kern.einst('betrieb');
      var pinOk = false;
      try { pinOk = sessionStorage.getItem('pp_team_pin') === code; } catch (e) { pinOk = false; }
      if (Number(ich.app_pin) === 1 && !pinOk) {
        gewaehlt = ich;
        anmeldungZeigen(true);
        pinSchritt();
        $('an_zurueck').style.display = 'none';
        return;
      }
      hinein();
    });
  }

  /* Meldung vor der Anmeldung – zweisprachig, die Sprache des Mitarbeiters ist noch unbekannt. */
  function serverHinweis(schluessel, rot, nochmal) {
    $('anmeldung').style.display = '';
    $('an_schritt2').style.display = 'none';
    var e = T.W[schluessel] || [schluessel, schluessel];
    var n = T.W.sv_nochmal;
    $('an_schritt1').style.display = '';
    $('an_schritt1').innerHTML = '<p class="hinweis' + (rot ? ' rot' : '') + '" id="an_server_hinweis">'
      + UI.sicher(e[0]) + '<br><i lang="it">' + UI.sicher(e[1]) + '</i></p>'
      + (nochmal ? '<button type="button" class="haupt gross" id="an_nochmal">'
        + UI.sicher(n[0] + ' · ' + n[1]) + '</button>' : '');
    if (nochmal) $('an_nochmal').onclick = function () { location.reload(); };
  }

  function anmeldungZeigen(ohneListe) {
    $('anmeldung').style.display = '';
    T.anwenden();
    if (!ohneListe) $('an_leute').innerHTML = Kern.maListe(false).map(function (m) {
      return '<button type="button" data-ma="' + m.id + '">'
        + '<span class="kreis" style="background:' + m.farbe + '">'
        + UI.sicher(Masken.kuerzel(m.name)) + '</span>'
        + '<span>' + UI.sicher(m.name)
        + '<small style="display:block;color:var(--text-leise);font-size:12.5px">'
        + UI.sicher(T.wert(m.rolle || '')) + '</small></span></button>';
    }).join('');
    $('an_leute').querySelectorAll('[data-ma]').forEach(function (b) {
      b.onclick = function () {
        UI.tippen(b);
        gewaehlt = Kern.ma(Number(b.getAttribute('data-ma')));
        pinSchritt();
      };
    });

    var block = $('an_ziffern');
    block.innerHTML = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '←']
      .map(function (z) { return '<button type="button" data-z="' + z + '">' + z + '</button>'; })
      .join('');
    block.querySelectorAll('[data-z]').forEach(function (b) {
      b.onclick = function () {
        UI.tippen(b);
        var f = $('an_pin');
        var z = b.getAttribute('data-z');
        if (z === 'C') f.value = '';
        else if (z === '←') f.value = f.value.slice(0, -1);
        else if (f.value.length < 8) f.value += z;
        $('an_fehler').style.display = 'none';
      };
    });
    $('an_los').onclick = anmelden;
    $('an_zurueck').onclick = function () {
      $('an_schritt1').style.display = '';
      $('an_schritt2').style.display = 'none';
    };
  }

  function pinSchritt() {
    $('an_schritt1').style.display = 'none';
    $('an_schritt2').style.display = '';
    $('an_name').textContent = gewaehlt.name;
    $('an_kreis').textContent = Masken.kuerzel(gewaehlt.name);
    $('an_kreis').style.background = gewaehlt.farbe;
    $('an_pin').value = '';
    $('an_fehler').style.display = 'none';
    if (gewaehlt.sprache) { T.setze(gewaehlt.sprache); T.anwenden(); }
  }

  function anmelden() {
    if (String($('an_pin').value) !== String(gewaehlt.pin || '1234')) {
      var f = $('an_fehler');
      f.style.display = '';
      f.textContent = T.t('tm_pin_falsch');
      $('an_pin').value = '';
      return;
    }
    ich = Kern.anmelden(gewaehlt.id);
    merkeCode(ich.zugangscode);
    if (window.Verbindung && Verbindung.server()) {
      try { sessionStorage.setItem('pp_team_pin', ich.zugangscode); } catch (e) { /* egal */ }
    }
    hinein();
  }

  function hinein() {
    $('anmeldung').style.display = 'none';
    $('haupt').style.display = '';
    /* Neuer Stand vom Server: eigenen Satz frisch holen und alles neu zeichnen. */
    Kern.beiAenderung(function (grund) {
      if (grund !== 'server') return;
      ich = Kern.ma(ich.id) || ich;
      alleZeichnen();
    });
    T.setze(ich.sprache || Kern.einst('sprache'));
    $('kopf_name').childNodes[0].nodeValue = ich.name.split(' ')[0] + ' ';
    verdrahten();
    T.anwenden();
    spracheKnopf();
    alleZeichnen();
    setInterval(uhrZeichnen, 15000);
  }

  function alleZeichnen() {
    stempelZeichnen();
    planZeichnen();
    wuenscheZeichnen();
    stundenZeichnen();
    ichZeichnen();
  }

  function spracheKnopf() { $('knopf_sprache').textContent = T.aktuell() === 'de' ? 'DE' : 'IT'; }

  function seiteZeigen(name) {
    document.querySelectorAll('.fussleiste button').forEach(function (b) {
      b.classList.toggle('an', b.getAttribute('data-seite') === name);
    });
    document.querySelectorAll('.seite').forEach(function (s) {
      s.classList.toggle('an', s.id === 's_' + name);
    });
    window.scrollTo(0, 0);
  }

  function verdrahten() {
    $('fussleiste').querySelectorAll('button').forEach(function (b) {
      b.onclick = function () { UI.tippen(b); seiteZeigen(b.getAttribute('data-seite')); };
    });
    $('knopf_schema').onclick = function () {
      var neu = UI.schemaSetzen(
        document.documentElement.getAttribute('data-schema') === 'dunkel' ? 'hell' : 'dunkel');
      $('knopf_schema').textContent = neu === 'dunkel' ? '☀' : '🌙';
    };
    $('knopf_schema').textContent = UI.schemaLesen() === 'dunkel' ? '☀' : '🌙';
    $('knopf_sprache').onclick = function () { spracheSetzen(T.aktuell() === 'de' ? 'it' : 'de'); };

    $('st_knopf').onclick = stempeln;

    $('pl_zurueck').onclick = function () { wocheWechseln(-7); };
    $('pl_vor').onclick = function () { wocheWechseln(7); };
    $('pl_heute').onclick = function () {
      wocheMontag = Kern.wochenstart(Kern.heute());
      planZeichnen();
    };
    UI.wischen($('s_plan'), function () { wocheWechseln(7); }, function () { wocheWechseln(-7); });

    $('wu_neu').onclick = function () {
      Masken.wunsch(null, alleZeichnen, ich.id);
      wunschFensterBeschriften(true);
    };

    $('su_monat').value = Kern.heute().slice(0, 7);
    $('su_monat').onchange = stundenZeichnen;

    $('ic_sprache').querySelectorAll('[data-s]').forEach(function (b) {
      b.onclick = function () { spracheSetzen(b.getAttribute('data-s')); };
    });
    $('ic_pin_speichern').onclick = pinAendern;
    $('ic_install').onclick = function () {
      if (!installEreignis) return;
      installEreignis.prompt();
      installEreignis = null;
      $('ic_install').style.display = 'none';
    };
    $('ic_abmelden').onclick = function () {
      try { localStorage.removeItem('pp_team_code'); } catch (e) { /* egal */ }
      Kern.abmelden();
      location.href = location.pathname;
    };
  }

  function spracheSetzen(s) {
    T.setze(s);
    T.anwenden();
    spracheKnopf();
    try {
      Kern.maSpeichern(Object.assign({}, ich, { sprache: s }));
      ich = Kern.ma(ich.id);
    } catch (e) { /* nicht schlimm */ }
    alleZeichnen();
  }

  /* =========================================================================
     Stempeln
     ========================================================================= */

  function uhrZeichnen() {
    var e = $('st_uhr');
    if (e) e.textContent = new Date().toLocaleTimeString('de-DE',
      { hour: '2-digit', minute: '2-digit' });
  }

  /* Minuten seit dem Kommen. Gleiche Minute ergibt 0 statt 24 Stunden
     (dauerMinuten rechnet Ende = Beginn als Schicht über Mitternacht). */
  function laufMinuten(start) {
    return Kern.dauerMinuten(start, Kern.jetztZeit(), 0) % (24 * 60);
  }

  function stempelZeichnen() {
    uhrZeichnen();
    var s = Kern.stempelStatus(ich.id);
    var knopf = $('st_knopf');
    if (s.laufend) {
      var seit = laufMinuten(s.laufend.start);
      $('st_lage').textContent = T.t('tm_eingestempelt_seit').replace('{zeit}', s.laufend.start);
      $('st_lauf').innerHTML = '<div class="laufband"><span class="pulspunkt"></span>'
        + UI.zahl(Kern.stunden(seit), 2) + ' ' + T.t('stunden') + '</div>';
      knopf.textContent = T.t('feierabend');
      knopf.className = 'grossknopf stop';
    } else {
      $('st_lage').textContent = T.t('tm_nicht_eingestempelt');
      $('st_lauf').innerHTML = '';
      knopf.textContent = T.t('kommen');
      knopf.className = 'grossknopf';
    }

    $('st_heute').innerHTML = s.heute.length ? s.heute.map(function (z) {
      return '<div class="zeile" style="border-left-color:'
        + (z.ende ? 'var(--gruen)' : 'var(--blau)') + '">'
        + '<div class="haupttext"><b>' + z.start + (z.ende ? ' – ' + z.ende : '') + '</b>'
        + '<span>' + (z.pause_min ? z.pause_min + ' min ' + T.t('pause') : '') + '</span></div>'
        + '<div class="rechts">' + (z.ende
          ? UI.zahl(Kern.stunden(Kern.dauerMinuten(z.start, z.ende, z.pause_min)), 2) + ' h'
          : T.t('laeuft')) + '</div></div>';
    }).join('') + '<div class="hinweis gut" style="margin-top:8px"><b>' + T.t('summe') + ': '
      + UI.zahl(s.heute_std, 2) + ' ' + T.t('stunden') + '</b></div>'
      : UI.leer(T.t('tm_heute_nichts'));

    naechsteZeichnen();
  }

  /* Die nächsten freigegebenen Schichten. Hat die laufende Woche keine mehr,
     wird die nächste aus den Folgewochen gezeigt – samt kurzem Hinweis. */
  function naechsteZeichnen() {
    var heute = Kern.heute();
    var jetzt = Kern.jetztZeit();
    var wocheEnde = Kern.plusTage(Kern.wochenstart(heute), 6);
    var kommend = Kern.schichten(heute, Kern.plusTage(heute, 366), true, ich.id)
      .filter(function (x) {
        /* heute schon vorbei (Nachtschichten über Mitternacht bleiben stehen) */
        return !(x.datum === heute && x.bis > x.von && x.bis <= jetzt);
      });
    if (!kommend.length) {
      $('st_naechste').innerHTML = UI.leer(T.t('keine_schicht_ueberhaupt'));
      return;
    }
    var h = '';
    if (kommend[0].datum > wocheEnde) {
      h += '<div class="hinweis naechste_hinweis">' + UI.sicher(T.t('keine_schicht')) + ' '
        + UI.sicher(T.t('naechste_folgewoche')) + '</div>';
    }
    h += kommend.slice(0, 3).map(function (x) {
      var wann = x.datum === heute ? T.t('heute') + ' · '
        : (x.datum === Kern.plusTage(heute, 1) ? T.t('morgen') + ' · ' : '');
      return '<div class="zeile tippbar" data-datum="' + x.datum + '" style="border-left-color:'
        + Masken.farbeFuerPosition(x.position, ich.farbe) + '">'
        + '<div class="haupttext"><b>' + wann + UI.tagLang(x.datum) + '</b>'
        + '<span>' + UI.sicher(T.wert(x.position))
        + (x.notiz ? ' · ' + UI.sicher(x.notiz) : '') + '</span></div>'
        + '<div class="rechts"><b style="color:var(--text)">' + x.von + '</b><br>'
        + x.bis + '</div></div>';
    }).join('');
    $('st_naechste').innerHTML = h;
    /* Antippen springt in „Mein Plan“ zur passenden Woche. */
    $('st_naechste').querySelectorAll('[data-datum]').forEach(function (z) {
      z.onclick = function () {
        wocheMontag = Kern.wochenstart(z.getAttribute('data-datum'));
        planZeichnen();
        seiteZeigen('plan');
      };
    });
  }

  function stempeln() {
    var s = Kern.stempelStatus(ich.id);
    if (!s.laufend) {
      try {
        var r = Kern.stempeln(ich.id, 'start');
        UI.melde(r.text, 'gut');
        UI.tippen($('st_knopf'));
        stempelZeichnen();
      } catch (e) { UI.fehler(e); }
      return;
    }
    var vorgabe = Kern.pausenvorgabe(laufMinuten(s.laufend.start));
    UI.formular({
      titel: T.t('feierabend'),
      inhalt: '<p>' + UI.sicher(T.t('tm_pause_frage').replace('{zeit}', s.laufend.start)) + '</p>'
        + UI.schieber('pause_min', T.t('pause'), vorgabe, 0, 120, 5, 'min'),
      speichernText: T.t('feierabend')
    }).then(function (r) {
      if (!r) return;
      try {
        var res = Kern.stempeln(ich.id, 'stop', r.werte.pause_min);
        UI.melde(res.text, 'gut');
        alleZeichnen();
      } catch (e) { UI.fehler(e); }
    });
  }

  /* =========================================================================
     Mein Plan
     ========================================================================= */

  function wocheWechseln(tage) {
    wocheMontag = Kern.plusTage(wocheMontag, tage);
    planZeichnen();
  }

  function planZeichnen() {
    var bis = Kern.plusTage(wocheMontag, 6);
    $('pl_titel').textContent = Kern.dm(wocheMontag) + ' – ' + Kern.dmy(bis);
    var rows = Kern.schichten(wocheMontag, bis, true, ich.id);
    var tage = Kern.tageZwischen(wocheMontag, bis);
    var h = Kern.heute();

    $('pl_liste').innerHTML = tage.map(function (d) {
      var meine = rows.filter(function (s) { return s.datum === d; });
      var ab = Kern.abwesend(ich.id, d);
      if (!meine.length) {
        return '<div class="zeile frei"' + (d === h ? ' style="border-left-color:var(--gelb)"' : '')
          + '><div class="haupttext"><b>' + UI.tagKurz(d) + '</b><span>'
          + (ab ? UI.sicher(T.wert(ab.typ)) : UI.sicher(T.t('tag_frei')))
          + '</span></div></div>';
      }
      return meine.map(function (s) {
        return '<div class="zeile" style="border-left-color:'
          + Masken.farbeFuerPosition(s.position, ich.farbe) + '">'
          + '<div class="haupttext"><b>' + UI.tagKurz(d) + '</b><span>'
          + UI.sicher(T.wert(s.position)) + ' · ' + UI.zahl(s.dauer_std, 2) + ' h'
          + (s.pause_min ? ' · ' + s.pause_min + ' min ' + T.t('pause') : '')
          + (s.notiz ? ' · ' + UI.sicher(s.notiz) : '') + '</span></div>'
          + '<div class="rechts"><b style="font-size:15px;color:var(--text)">' + s.von
          + '</b><br>' + s.bis + '</div></div>';
      }).join('');
    }).join('');

    var min = rows.reduce(function (a, s) {
      return a + Kern.dauerMinuten(s.von, s.bis, s.pause_min);
    }, 0);
    $('pl_summe').innerHTML = '<div class="hinweis gut" style="margin-bottom:0"><b>'
      + UI.zahl(Kern.stunden(min), 2) + ' ' + T.t('stunden') + '</b> · '
      + rows.length + ' ' + UI.sicher(T.t('schichten_klein')) + '</div>';
  }

  /* =========================================================================
     Wünsche
     ========================================================================= */

  function wuenscheZeichnen() {
    var rows = Kern.wuensche(ich.id, null);
    $('wu_liste').innerHTML = rows.length ? rows.map(function (w) {
      return '<div class="zeile" data-w="' + w.id + '" style="border-left-color:'
        + (w.status === 'genehmigt' ? 'var(--gruen)'
          : (w.status === 'abgelehnt' ? 'var(--rot)' : 'var(--gelb)')) + '">'
        + '<div class="haupttext"><b>' + UI.sicher(T.wert(w.typ)) + '</b><span>'
        + UI.tagKurz(w.von_datum)
        + (w.bis_datum !== w.von_datum ? ' – ' + UI.tagKurz(w.bis_datum) : '')
        + (w.bemerkung ? ' · ' + UI.sicher(w.bemerkung) : '') + '</span></div>'
        + '<div class="rechts">' + UI.etikett(T.status(w.status), w.status) + '</div></div>';
    }).join('') : UI.leer(T.t('keine_wuensche') + ' ' + T.t('tm_wunsch_tippen'));
    $('wu_liste').querySelectorAll('[data-w]').forEach(function (z) {
      z.onclick = function () {
        var id = Number(z.getAttribute('data-w'));
        var w = rows.find(function (x) { return Number(x.id) === id; });
        if (w.status !== 'offen') {
          UI.melde(T.t('tm_schon_entschieden'), 'warn');
          return;
        }
        Masken.wunsch(id, alleZeichnen, ich.id);
        wunschFensterBeschriften(false);
      };
    });
  }

  /* =========================================================================
     Meine Stunden
     ========================================================================= */

  function stundenZeichnen() {
    var monat = $('su_monat').value || Kern.heute().slice(0, 7);
    var a;
    try { a = Kern.auswertung(monat, ich.id); } catch (e) { UI.fehler(e); return; }
    var z = a.zeilen[0];
    if (!z) { $('su_inhalt').innerHTML = UI.leer(T.t('keine_zeiten')); return; }

    var h = '<div class="kacheln">'
      + '<div class="kachel gut"><div class="wert">' + UI.zahl(z.stunden, 1)
      + '</div><div class="bez">' + T.t('stunden') + '</div></div>'
      + '<div class="kachel"><div class="wert">' + UI.zahl(z.geplant_std, 1)
      + '</div><div class="bez">' + T.t('geplant') + '</div></div>'
      + '</div>';
    if (z.stundenlohn) {
      h += '<div class="hinweis"><b>' + UI.euro(z.gesamt) + '</b> · '
        + UI.euro(z.stundenlohn) + ' ' + UI.sicher(T.t('tm_pro_stunde'))
        + (z.zuschlaege ? ' · ' + T.t('zuschlaege') + ' ' + UI.euro(z.zuschlaege) : '')
        + '<br><small>' + UI.sicher(T.t('tm_rechenhilfe')) + '</small></div>';
    }
    h += z.tage.length ? z.tage.map(function (t) {
      return '<div class="zeile" style="border-left-color:'
        + (t.freigegeben ? 'var(--gruen)' : 'var(--gelb)') + '">'
        + '<div class="haupttext"><b>' + UI.tagKurz(t.datum) + '</b><span>'
        + t.start + '–' + t.ende + (t.pause_min ? ' · ' + t.pause_min + ' min' : '')
        + '</span></div><div class="rechts"><b style="color:var(--text)">'
        + UI.zahl(t.std, 2) + ' h</b><br>'
        + (t.freigegeben ? '✓' : UI.sicher(T.t('zeit_offen')))
        + '</div></div>';
    }).join('') : UI.leer(T.t('keine_zeiten'));
    $('su_inhalt').innerHTML = h;
  }

  /* =========================================================================
     Ich
     ========================================================================= */

  function ichZeichnen() {
    $('ic_kreis').textContent = Masken.kuerzel(ich.name);
    $('ic_kreis').style.background = ich.farbe;
    $('ic_name').textContent = ich.name;
    $('ic_rolle').textContent = T.wert(ich.rolle || '') + (ich.vertrag ? ' · ' + T.wert(ich.vertrag) : '');
    var zeilen = [];
    if (ich.wochenstunden) zeilen.push(T.t('wochenstunden') + ': ' + UI.zahl(ich.wochenstunden, 1));
    if (ich.urlaubstage) zeilen.push(T.t('urlaubstage') + ': ' + ich.urlaubstage);
    if (ich.eintritt) zeilen.push(T.t('eintritt') + ': ' + Kern.dmy(ich.eintritt));
    /* Kontakt & Adresse – nur zum Ansehen, ändern kann der Chef. */
    var kontakt = [];
    var ort = [ich.plz, ich.ort].filter(Boolean).join(' ');
    var adresse = [ich.strasse, ort].filter(Boolean).join(', ');
    if (ich.telefon) kontakt.push(T.t('handy_nr') + ': ' + ich.telefon);
    if (ich.email) kontakt.push(T.t('email') + ': ' + ich.email);
    if (ich.telegram) kontakt.push(T.t('telegram') + ': @' + ich.telegram);
    if (adresse) kontakt.push(T.t('adresse') + ': ' + adresse);
    if (ich.geburtsdatum) kontakt.push(T.t('geburtsdatum') + ': ' + Kern.dmy(ich.geburtsdatum));
    if (ich.notfallkontakt) kontakt.push(T.t('notfallkontakt') + ': ' + ich.notfallkontakt);
    var h = zeilen.map(UI.sicher).join('<br>');
    if (kontakt.length) {
      h += '<div class="abschnitt" id="ic_kontakt_kopf">' + UI.sicher(T.t('kontakt_adresse')) + '</div>'
        + '<div id="ic_kontakt">' + kontakt.map(UI.sicher).join('<br>') + '</div>';
    }
    $('ic_daten').innerHTML = h
      || '<span style="color:var(--text-leise)">' + UI.sicher(T.t('tm_daten_chef')) + '</span>';
    installHinweis();
    $('ic_sprache').querySelectorAll('[data-s]').forEach(function (b) {
      b.classList.toggle('an', b.getAttribute('data-s') === T.aktuell());
    });
  }

  function installHinweis() {
    var ios = $('ic_install_ios');
    if (!ios) return;
    if (alsAppGestartet()) {
      ios.textContent = T.t('tm_app_schon');
    } else if (istIphone()) {
      ios.textContent = T.t('tm_iphone_wie');
    } else {
      ios.style.display = 'none';
      $('ic_install_wie').style.display = '';
      return;
    }
    ios.style.display = '';
    $('ic_install_wie').style.display = 'none';
  }

  function pinAendern() {
    var neu = String($('ic_pin').value || '').trim();
    if (!/^\d{4,8}$/.test(neu)) {
      UI.melde(T.t('tm_pin_regel'), 'warn');
      return;
    }
    try {
      Kern.maSpeichern(Object.assign({}, ich, { pin: neu }));
      ich = Kern.ma(ich.id);
      $('ic_pin').value = '';
      UI.melde(T.t('gespeichert'), 'gut');
    } catch (e) { UI.fehler(e); }
  }

  return { start: start };
})();

window.Team = Team;
document.addEventListener('DOMContentLoaded', function () { Team.start(); });
