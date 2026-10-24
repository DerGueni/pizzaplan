/* PizzaPlan · PC-Fassung
   ----------------------------------------------------------------------------
   Die Oberfläche für den Rechner: breiter Wochenplan, Tabellen, Maus und Tastatur.
   Gerechnet wird hier nichts (das macht Kern), Eingabefenster kommen von Masken.
*/
var PC = (function () {
  'use strict';

  var wocheMontag = Kern.wochenstart(Kern.heute());
  var seiteJetzt = 'uebersicht';
  var gezogen = null;            // { art:'schicht'|'vorlage', id }

  function $(id) { return document.getElementById(id); }

  /* =========================================================================
     Start und Anmeldung
     ========================================================================= */

  function start() {
    handystreifen();
    Kern.bereit.then(function () {
      T.setze(Kern.einst('sprache'));
      UI.schemaSetzen(UI.schemaLesen());
      $('anmeldung_betrieb').textContent = Kern.einst('betrieb');
      $('kopf_betrieb').textContent = Kern.einst('betrieb');
      var frei = false;
      try { frei = sessionStorage.getItem('pp_chef') === '1'; } catch (e) { frei = false; }
      if (frei) hinein(); else zeigeAnmeldung();
    });
  }

  function zeigeAnmeldung() {
    $('anmeldung').style.display = '';
    T.anwenden();
    $('pin_knopf').onclick = pruefePin;
    $('pin_feld').onkeydown = function (e) { if (e.key === 'Enter') pruefePin(); };
    setTimeout(function () { $('pin_feld').focus(); }, 80);
  }

  function pruefePin() {
    if (!Kern.chefPinPruefen($('pin_feld').value)) {
      var f = $('pin_fehler');
      f.style.display = '';
      f.textContent = T.t('h_pin_falsch');
      $('pin_feld').value = '';
      $('pin_feld').focus();
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
    uhrLaufen();
    alleZeichnen();
    /* Neuer Stand vom gemeinsamen Server (nur dort): alles neu zeichnen. */
    Kern.beiAenderung(function (grund) {
      if (grund !== 'server') return;
      $('ei_regler').dataset.gebaut = '';
      $('kopf_betrieb').textContent = Kern.einst('betrieb');
      alleZeichnen();
    });
    setInterval(function () { Masken.erinnerungen(alleZeichnen); }, 30000);
    setTimeout(function () { Masken.erinnerungen(alleZeichnen); }, 2500);
  }

  /* Hinweis auf die Handy-Fassung (nur in schmalen Fenstern sichtbar, siehe pc.css).
     Weggeklickt bleibt er für diese Sitzung weg. */
  function handystreifen() {
    var zu = false;
    try { zu = sessionStorage.getItem('pp_handy_zu') === '1'; } catch (e) { zu = false; }
    if (zu) $('handystreifen').classList.add('zu');
    $('handystreifen_zu').onclick = function () {
      $('handystreifen').classList.add('zu');
      try { sessionStorage.setItem('pp_handy_zu', '1'); } catch (e) { /* egal */ }
    };
  }

  function uhrLaufen() {
    function tick() {
      $('kopf_uhr').textContent = UI.tagKurz(Kern.heute()) + '  '
        + new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    }
    tick();
    setInterval(tick, 20000);
  }

  function alleZeichnen() {
    uebersichtZeichnen();
    planZeichnen();
    wuenscheZeichnen();
    zeitenZeichnen();
    teamZeichnen();
    termineZeichnen();
    versandZeichnen();
    einstellungenFuellen();
    zaehlerZeichnen();
    if ($('a_inhalt').innerHTML) auswertungZeichnen();
  }

  function zaehlerZeichnen() {
    var u = Kern.uebersicht();
    [['zahl_wuensche', u.offene_wuensche], ['zahl_zeiten', u.offene_zeiten]].forEach(function (p) {
      var e = $(p[0]);
      e.textContent = p[1];
      e.style.display = p[1] ? '' : 'none';
    });
  }

  /* =========================================================================
     Menü und Tastatur
     ========================================================================= */

  function seiteZeigen(name) {
    seiteJetzt = name;
    document.querySelectorAll('.menue button').forEach(function (b) {
      b.classList.toggle('an', b.getAttribute('data-seite') === name);
    });
    document.querySelectorAll('.seite').forEach(function (s) {
      s.classList.toggle('an', s.id === 's_' + name);
    });
    window.scrollTo(0, 0);
    menueReiterZeigen();
    if (name === 'auswertung' && !$('a_inhalt').innerHTML) auswertungZeichnen();
  }

  /* Im schmalen Fenster ist das Menü waagrecht wischbar – der gewählte Reiter
     wird dann in den sichtbaren Bereich geschoben. */
  function menueReiterZeigen() {
    var m = $('menue');
    var b = m.querySelector('button.an');
    if (!b || m.scrollWidth <= m.clientWidth) return;
    if (b.offsetLeft < m.scrollLeft) m.scrollLeft = b.offsetLeft - 12;
    else if (b.offsetLeft + b.offsetWidth > m.scrollLeft + m.clientWidth) {
      m.scrollLeft = b.offsetLeft + b.offsetWidth - m.clientWidth + 12;
    }
  }

  /* -------------------------------------------------------------------------
     Tastatur in Fenstern
     Esc schließt nur das oberste Fenster, Enter löst den Hauptknopf aus
     (auch aus einer Auswahlliste, im Textfeld mit Strg+Enter), Tab bleibt im Fenster.
     Beim Öffnen landet der Fokus im Fenster, beim Schließen wieder dort, wo er war.
     ------------------------------------------------------------------------- */

  function oberstesFenster() {
    var alle = document.querySelectorAll('.hintergrund');
    return alle.length ? alle[alle.length - 1] : null;
  }

  function fokussierbar(hg) {
    return Array.prototype.filter.call(
      hg.querySelectorAll('button,input,select,textarea,a[href],[tabindex]:not([tabindex="-1"])'),
      function (e) { return !e.disabled && e.offsetParent !== null; });
  }

  function hauptknopf(hg) {
    var knoepfe = hg.querySelectorAll('.ffuss button');
    return hg.querySelector('.ffuss button.haupt') || knoepfe[knoepfe.length - 1] || null;
  }

  function fensterTasten(e) {
    var hg = oberstesFenster();
    if (!hg) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      var x = hg.querySelector('[data-x]');
      if (x) x.click();
      return;
    }
    var ziel = e.target;
    var drin = hg.contains(ziel);
    if (e.key === 'Enter' && !e.shiftKey && !e.altKey) {
      var knopf = hauptknopf(hg);
      var tag = drin ? ziel.tagName : '';
      var ausloesen = !drin || tag === 'SELECT'
        || (tag === 'TEXTAREA' && (e.ctrlKey || e.metaKey));
      if (ausloesen && knopf) {
        e.preventDefault();
        e.stopPropagation();
        knopf.click();
      }
      return;
    }
    if (e.key === 'Tab') {
      var f = fokussierbar(hg);
      if (!f.length) return;
      var i = f.indexOf(document.activeElement);
      if (i < 0 || (!e.shiftKey && i === f.length - 1)) { e.preventDefault(); f[0].focus(); }
      else if (e.shiftKey && i === 0) { e.preventDefault(); f[f.length - 1].focus(); }
    }
  }

  function fensterBeobachten() {
    var vorher = [];
    new MutationObserver(function (aenderungen) {
      aenderungen.forEach(function (a) {
        Array.prototype.forEach.call(a.addedNodes, function (n) {
          if (!n.classList || !n.classList.contains('hintergrund')) return;
          vorher.push({ hg: n, fokus: document.activeElement });
          var x = n.querySelector('[data-x]');
          if (x) { x.title = T.t('pc_tt_schliessen'); x.setAttribute('aria-label', x.title); }
          var sp = n.querySelector('.ffuss button.haupt');
          if (sp && !sp.title && n.querySelector('.frumpf input')) sp.title = T.t('pc_tt_speichern');
          /* Masken setzen den Fokus nach 60 ms ins erste Feld; ohne Feld nehmen wir den Hauptknopf. */
          setTimeout(function () {
            if (!document.body.contains(n) || n.contains(document.activeElement)) return;
            var k = hauptknopf(n) || x;
            if (k) k.focus();
          }, 120);
        });
        Array.prototype.forEach.call(a.removedNodes, function (n) {
          if (!n.classList || !n.classList.contains('hintergrund')) return;
          var i = vorher.findIndex(function (v) { return v.hg === n; });
          if (i < 0) return;
          var f = vorher.splice(i, 1)[0].fokus;
          if (f && f.focus && document.body.contains(f) && !oberstesFenster()) {
            try { f.focus({ preventScroll: true }); } catch (x) { /* egal */ }
          }
        });
      });
    }).observe(document.body, { childList: true });
  }

  /* Kacheln, Schicht-Chips und Auswertungszeilen sind keine Knöpfe,
     sollen aber auch mit Enter oder Leertaste gehen. */
  function tastenKlick(e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var el = e.target;
    if (!el || !el.getAttribute || el.getAttribute('role') !== 'button') return;
    if (/^(BUTTON|A|INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) return;
    e.preventDefault();
    el.click();
  }

  function verdrahten() {
    document.querySelectorAll('.menue button').forEach(function (b) {
      b.onclick = function () { seiteZeigen(b.getAttribute('data-seite')); };
    });
    $('knopf_abmelden').onclick = function () {
      try { sessionStorage.removeItem('pp_chef'); } catch (e) { /* egal */ }
      location.reload();
    };
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
      /* Die Schieberegler tragen ihre Beschriftung im Text, deshalb neu bauen. */
      $('ei_regler').dataset.gebaut = '';
      alleZeichnen();
    };
    $('knopf_hilfe').onclick = hilfeZeigen;
    $('knopf_mikro').onclick = function () { Masken.befehl($('knopf_mikro'), alleZeichnen); };

    /* Dienstplan */
    $('p_zurueck').onclick = function () { wocheWechseln(-7); };
    $('p_vor').onclick = function () { wocheWechseln(7); };
    $('p_heute').onclick = function () {
      wocheMontag = Kern.wochenstart(Kern.heute());
      planZeichnen();
    };
    $('p_neu').onclick = function () { Masken.schicht(null, Kern.heute(), null, nachPlan); };
    $('p_kopieren').onclick = vorwocheUebernehmen;
    $('p_freigeben').onclick = function () { freigeben(1); };
    $('p_sperren').onclick = function () { freigeben(0); };
    $('p_leeren').onclick = wocheLeeren;
    $('p_drucken').onclick = function () { window.print(); };
    $('p_vorlage_neu').onclick = function () {
      Masken.vorlage(null, function () { planZeichnen(); einstellungenFuellen(); });
    };

    /* Wünsche */
    $('w_status').onchange = wuenscheZeichnen;
    $('w_neu').onclick = function () { Masken.wunsch(null, nachWunsch); };

    /* Zeiten */
    $('z_von').value = Kern.plusTage(Kern.heute(), -13);
    $('z_bis').value = Kern.heute();
    $('z_anzeigen').onclick = zeitenZeichnen;
    $('z_neu').onclick = function () { Masken.zeit(null, nachZeit); };
    $('z_freigeben').onclick = zeitenFreigeben;

    /* Team */
    $('t_neu').onclick = function () { Masken.mitarbeiter(null, nachTeam); };
    $('t_inaktive').onchange = teamZeichnen;
    $('t_suche').oninput = teamZeichnen;
    $('t_einlesen').onclick = function () { seiteZeigen('einlesen'); };
    $('t_einladen').onclick = function () { Masken.alleEinladen(nachTeam); };

    einlesenVerdrahten();

    /* Auswertung */
    $('a_monat').value = Kern.heute().slice(0, 7);
    $('a_rechnen').onclick = auswertungZeichnen;
    $('a_csv').onclick = auswertungCsv;
    $('a_drucken').onclick = function () { window.print(); };

    /* Termine */
    $('tm_von').value = Kern.heute();
    $('tm_bis').value = Kern.plusTage(Kern.heute(), 90);
    $('tm_anzeigen').onclick = termineZeichnen;
    $('tm_offen').onchange = termineZeichnen;
    $('tm_neu').onclick = function () { Masken.termin(null, null, nachTermin); };
    $('tm_mikro').onclick = function () {
      Masken.zuhoeren($('tm_mikro'), $('tm_status'), function (text) {
        Masken.termin(null, Kern.terminAusText(text, Kern.heute()), nachTermin);
      });
    };

    /* Versand */
    $('v_von').value = wocheMontag;
    $('v_bis').value = Kern.plusTage(wocheMontag, 6);
    $('v_weg').onchange = versandZeichnen;
    $('v_alle').onclick = function () { empfaengerAlle(true); };
    $('v_keiner').onclick = function () { empfaengerAlle(false); };
    $('v_vorschau').onclick = versandVorschau;
    $('v_start').onclick = function () {
      Masken.versand($('v_von').value, $('v_bis').value, $('v_weg').value, gewaehlteEmpfaenger());
    };
    $('v_gesamt').onclick = gesamtplanZeigen;
    $('v_kopieren').onclick = function () {
      UI.kopieren(Kern.planTextGesamt($('v_von').value, $('v_bis').value, T.aktuell()));
    };

    /* Einstellungen */
    $('ei_speichern').onclick = einstellungenSpeichern;
    $('ei_sicherung').onclick = sicherungAnlegen;
    $('ei_wiederherstellen').onclick = function () { $('ei_sicherungdatei').click(); };
    $('ei_sicherungdatei').onchange = sicherungEinspielen;
    $('ei_beispiel_weg').onclick = beispielEntfernen;
    $('ei_alles_weg').onclick = allesLoeschen;
    $('ei_vorlage_neu').onclick = function () {
      Masken.vorlage(null, function () { planZeichnen(); einstellungenFuellen(); });
    };

    /* Übersicht: Wochenvorschau */
    $('u_zum_plan').onclick = function () {
      wocheMontag = Kern.wochenstart(Kern.heute());
      planZeichnen();
      seiteZeigen('plan');
    };
    $('tm_mikro').title = T.t('termin_sprechen');

    document.addEventListener('keydown', tastenkuerzel);
    document.addEventListener('keydown', tastenKlick);
    window.addEventListener('keydown', fensterTasten, true);
    window.addEventListener('resize', menueReiterZeigen);
    fensterBeobachten();
  }

  function nachPlan() { planZeichnen(); uebersichtZeichnen(); zaehlerZeichnen(); }
  function nachWunsch() { wuenscheZeichnen(); planZeichnen(); zaehlerZeichnen(); }
  function nachZeit() { zeitenZeichnen(); zaehlerZeichnen(); uebersichtZeichnen(); }
  function nachTeam() { teamZeichnen(); planZeichnen(); versandZeichnen(); uebersichtZeichnen(); }
  function nachTermin() { termineZeichnen(); uebersichtZeichnen(); }

  function spracheKnopf() { $('knopf_sprache').textContent = T.aktuell() === 'de' ? 'DE' : 'IT'; }

  function tastenkuerzel(e) {
    if (/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (document.querySelector('.hintergrund')) return;
    var karte = { '1': 'uebersicht', '2': 'plan', '3': 'wuensche', '4': 'zeiten', '5': 'team',
      '6': 'einlesen', '7': 'auswertung', '8': 'termine', '9': 'versand', '0': 'einstellungen' };
    if (karte[e.key]) { seiteZeigen(karte[e.key]); return; }
    if (seiteJetzt === 'plan') {
      if (e.key === 'ArrowLeft') { wocheWechseln(-7); e.preventDefault(); }
      if (e.key === 'ArrowRight') { wocheWechseln(7); e.preventDefault(); }
      if (e.key === 'n') { Masken.schicht(null, Kern.heute(), null, nachPlan); e.preventDefault(); }
    }
    if (e.key === '?') hilfeZeigen();
  }

  function hilfeZeigen() {
    UI.fenster({
      titel: T.t('pc_hilfe_titel'),
      breite: 640,
      inhalt: '<h3 style="margin-top:0">' + T.t('pc_h_tasten') + '</h3><div class="tasten">'
        + [['1', 'uebersicht'], ['2', 'dienstplan'], ['3', 'wuensche'], ['4', 'zeiten'],
          ['5', 'team'], ['6', 'einlesen'], ['7', 'auswertung'], ['8', 'termine'],
          ['9', 'versand'], ['0', 'einstellungen'], ['← →', 'pc_h_woche'], ['n', 'pc_h_neu'],
          ['?', 'pc_h_fenster'], [T.t('pc_h_enter_taste'), 'pc_h_enter'], ['Esc', 'pc_h_esc']]
          .map(function (k) {
            return '<kbd>' + UI.sicher(k[0]) + '</kbd><span>' + UI.sicher(T.t(k[1])) + '</span>';
          }).join('')
        + '</div>'
        + '<h3 style="margin-top:18px">' + T.t('pc_h_plan') + '</h3>'
        + '<ul style="font-size:14.5px;padding-left:20px;line-height:1.65">'
        + ['pc_h_l1', 'pc_h_l2', 'pc_h_l3', 'pc_h_l4', 'pc_h_l5', 'pc_h_l6'].map(function (k) {
          return '<li>' + UI.sicher(T.t(k)) + '</li>';
        }).join('')
        + '</ul>'
        + '<h3 style="margin-top:14px">' + T.t('pc_h_schief') + '</h3>'
        + '<p style="font-size:14.5px">' + T.t('pc_h_rueck') + '</p>'
    });
  }

  /* =========================================================================
     Übersicht
     ========================================================================= */

  function uebersichtZeichnen() {
    var u = Kern.uebersicht();
    var kacheln = [
      [T.t('kachel_team'), u.team_aktiv, '', 'team'],
      [T.t('kachel_woche'), UI.zahl(u.wochenstunden, 1), 'gut', 'plan'],
      [T.t('kachel_offen'), u.offene_wuensche, u.offene_wuensche ? 'warn' : 'gut', 'wuensche'],
      [T.t('kachel_unbesetzt'), u.unbesetzt, u.unbesetzt ? 'rot' : 'gut', 'plan'],
      [T.t('kachel_entwurf'), u.nicht_freigegeben, u.nicht_freigegeben ? 'warn' : 'gut', 'plan'],
      [T.t('kachel_zeiten'), u.offene_zeiten, u.offene_zeiten ? 'warn' : 'gut', 'zeiten']
    ];
    $('u_kacheln').innerHTML = kacheln.map(function (k) {
      return '<div class="kachel ' + k[2] + '" data-ziel="' + k[3] + '" role="button" tabindex="0"'
        + ' title="' + UI.sicher(T.t('pc_tt_kachel')) + '">'
        + '<div class="wert">' + UI.sicher(k[1]) + '</div>'
        + '<div class="bez">' + UI.sicher(k[0]) + '</div></div>';
    }).join('');
    $('u_kacheln').querySelectorAll('.kachel').forEach(function (k) {
      k.onclick = function () { seiteZeigen(k.getAttribute('data-ziel')); };
    });

    $('u_heute').innerHTML = u.heute.length ? u.heute.map(function (s) {
      return '<div class="zeile" style="border-left-color:' + s.farbe + '">'
        + '<div class="haupttext"><b>' + UI.sicher(s.ma_name || T.t('offen_bez')) + '</b>'
        + '<span>' + UI.sicher(T.wert(s.position)) + '</span></div>'
        + '<div class="rechts">' + s.von + '–' + s.bis + '</div></div>';
    }).join('') : UI.leer(T.t('heute_niemand'));

    $('u_stempel').innerHTML = u.eingestempelt.length ? u.eingestempelt.map(function (z) {
      return '<div class="zeile" style="border-left-color:var(--gruen)">'
        + '<div class="haupttext"><b>' + UI.sicher(z.ma_name) + '</b>'
        + '<span>' + UI.sicher(T.t('h_seit').replace('{z}', z.start)) + '</span></div>'
        + '<div class="rechts">' + UI.etikett(T.t('laeuft'), 'laeuft') + '</div></div>';
    }).join('') : UI.leer(T.t('niemand_gestempelt'));

    $('u_termine').innerHTML = u.termine.length ? u.termine.map(function (t) {
      return '<div class="zeile" style="border-left-color:var(--gelb)">'
        + '<div class="haupttext"><b>' + UI.sicher(t.titel) + '</b>'
        + '<span>' + UI.tagKurz(t.datum) + (t.von_zeit ? ' · ' + t.von_zeit + T.t('h_uhr') : '')
        + (t.ort ? ' · ' + UI.sicher(t.ort) : '') + '</span></div></div>';
    }).join('') : UI.leer(T.t('keine_termine'));

    wochenvorschauZeichnen(u.woche_von, u.woche_bis);
  }

  /* Die laufende Woche Tag für Tag: wer wann arbeitet, wer frei hat, was offen ist. */
  function wochenvorschauZeichnen(mo, so) {
    var h = Kern.heute();
    var rows = Kern.schichten(mo, so, false, null);
    var leute = Kern.maListe(false);
    $('u_woche_titel').textContent = T.t('kw') + ' ' + kalenderwoche(mo) + ' · '
      + Kern.dm(mo) + ' – ' + Kern.dmy(so);
    var tagTitel = UI.sicher(T.t('pc_tt_tag'));
    var chipTitel = T.t('pc_tt_schicht').split(' · ')[0];

    $('u_woche').innerHTML = Kern.besetzung(mo, so).map(function (b) {
      var d = b.datum;
      var meine = rows.filter(function (s) { return s.datum === d; });
      var weg = [];
      leute.forEach(function (m) {
        var ab = Kern.abwesend(m.id, d);
        if (ab) weg.push(UI.sicher(m.name) + ': ' + UI.sicher(T.wert(ab.typ)));
      });
      return '<div class="wtag' + (d === h ? ' heute' : '') + (d < h ? ' vorbei' : '') + '">'
        + '<button type="button" class="wkopf" data-wtag="' + d + '" title="' + tagTitel + '">'
        + '<b>' + UI.sicher(Kern.WT_LANG[T.aktuell()][Kern.wochentag(d)]) + '</b> '
        + Kern.dm(d)
        + '<small>' + b.anzahl + ' × · ' + UI.zahl(b.stunden, 1) + ' h'
        + (b.offen ? ' · <b>' + b.offen + ' ' + UI.sicher(T.t('offen_turni')) + '</b>' : '')
        + '</small></button>'
        + (meine.length ? meine.map(function (s) {
          var farbe = s.mitarbeiter_id ? Masken.farbeFuerPosition(s.position, s.farbe) : 'var(--rot)';
          var wer = s.mitarbeiter_id ? s.ma_name : T.t('offen_bez');
          return '<button type="button" class="wochenchip' + (s.veroeffentlicht ? '' : ' entwurf')
            + '" data-schicht="' + s.id + '" style="background:' + farbe + '" title="'
            + UI.sicher(wer + ' · ' + s.von + '–' + s.bis + ' · ' + T.wert(s.position) + ' – ' + chipTitel)
            + '">' + s.von + '–' + s.bis + '<small>' + UI.sicher(wer) + '</small></button>';
        }).join('') : '<div class="wleer">' + UI.sicher(T.t('woche_frei')) + '</div>')
        + weg.map(function (w) { return '<div class="wweg" title="' + w + '">' + w + '</div>'; }).join('')
        + '</div>';
    }).join('');

    $('u_woche').querySelectorAll('[data-wtag]').forEach(function (k) {
      k.onclick = function () {
        wocheMontag = Kern.wochenstart(k.getAttribute('data-wtag'));
        planZeichnen();
        seiteZeigen('plan');
      };
    });
    $('u_woche').querySelectorAll('[data-schicht]').forEach(function (c) {
      c.onclick = function () { Masken.schicht(Number(c.getAttribute('data-schicht')), null, null, nachPlan); };
    });
  }

  /* =========================================================================
     Dienstplan
     ========================================================================= */

  function wocheWechseln(tage) {
    wocheMontag = Kern.plusTage(wocheMontag, tage);
    planZeichnen();
  }

  function kalenderwoche(datum) {
    var d = Kern.ausIso(datum);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    var erster = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d - erster) / 86400000 - 3 + ((erster.getDay() + 6) % 7)) / 7);
  }

  function planZeichnen() {
    var bis = Kern.plusTage(wocheMontag, 6);
    $('p_titel').textContent = T.t('kw') + ' ' + kalenderwoche(wocheMontag) + ' · '
      + Kern.dm(wocheMontag) + ' – ' + Kern.dmy(bis);

    var leute = Kern.maListe(false);
    var rows = Kern.schichten(wocheMontag, bis, false, null);
    var tage = Kern.tageZwischen(wocheMontag, bis);
    var h = Kern.heute();

    $('p_band').innerHTML = Kern.besetzung(wocheMontag, bis).map(function (b) {
      return '<div class="tagbox' + (b.datum === h ? ' heute' : '') + '">'
        + '<b>' + UI.sicher(Kern.WT_KURZ[T.aktuell()][Kern.wochentag(b.datum)]) + ' '
        + Kern.dm(b.datum) + '</b><div class="zahlen">' + b.anzahl + ' × · '
        + UI.zahl(b.stunden, 1) + ' h'
        + (b.offen ? ' · <b style="color:var(--rot)">' + b.offen + ' ' + UI.sicher(T.t('offen_turni')) + '</b>' : '')
        + '</div></div>';
    }).join('');

    $('p_vorlagen').innerHTML = Kern.vorlagen().map(function (v) {
      return '<button type="button" class="vorlagechip" draggable="true" data-vorlage="' + v.id
        + '" style="background:' + v.farbe + '" title="' + UI.sicher(v.name + ' · ' + T.t('pc_tt_vorlage'))
        + '">' + UI.sicher(v.name)
        + '<small>' + v.von + '–' + v.bis + ' · ' + UI.sicher(T.wert(v.position)) + '</small></button>';
    }).join('') || '<div style="font-size:13px;color:var(--text-leise)">' + T.t('keine_vorlage')
      + '</div>';
    $('p_vorlagen').querySelectorAll('[data-vorlage]').forEach(function (b) {
      b.ondragstart = function (e) {
        gezogen = { art: 'vorlage', id: Number(b.getAttribute('data-vorlage')) };
        e.dataTransfer.effectAllowed = 'copy';
        try { e.dataTransfer.setData('text/plain', 'vorlage'); } catch (x) { /* egal */ }
      };
      b.ondragend = function () { gezogen = null; zielMarkeWeg(); };
      b.onclick = function () {
        Masken.vorlage(Number(b.getAttribute('data-vorlage')), function () {
          planZeichnen();
          einstellungenFuellen();
        });
      };
    });

    var t = '<table><thead><tr><th class="person">' + T.t('mitarbeiter') + '</th>';
    tage.forEach(function (d) {
      t += '<th class="tag' + (d === h ? ' heute' : '') + '">'
        + UI.sicher(Kern.WT_LANG[T.aktuell()][Kern.wochentag(d)])
        + '<small>' + Kern.dm(d) + '</small></th>';
    });
    t += '</tr></thead><tbody>';

    leute.forEach(function (m) {
      var wochenMin = rows.filter(function (s) {
        return Number(s.mitarbeiter_id) === Number(m.id);
      }).reduce(function (a, s) { return a + Kern.dauerMinuten(s.von, s.bis, s.pause_min); }, 0);
      var soll = Number(m.wochenstunden || 0);
      var farbeZahl = soll && Kern.stunden(wochenMin) > soll + 0.01 ? 'var(--rot)' : 'inherit';
      t += '<tr><td class="person" title="' + UI.sicher(m.name + (m.rolle ? ' · ' + T.wert(m.rolle) : '')
        + ' · ' + UI.zahl(Kern.stunden(wochenMin), 1) + (soll ? ' / ' + UI.zahl(soll, 0) : '') + ' h')
        + '"><span class="wochenzahl" style="color:' + farbeZahl + '">'
        + UI.zahl(Kern.stunden(wochenMin), 1) + (soll ? ' / ' + UI.zahl(soll, 0) : '') + ' h</span>'
        + '<span class="punkt" style="background:' + m.farbe + '"></span>'
        + UI.sicher(m.name) + '<small>' + UI.sicher(T.wert(m.rolle || '')) + '</small></td>';
      tage.forEach(function (d) {
        var meine = rows.filter(function (s) {
          return Number(s.mitarbeiter_id) === Number(m.id) && s.datum === d;
        });
        var ab = Kern.abwesend(m.id, d);
        var wu = ab ? null : Kern.wunschOffen(m.id, d);
        t += '<td class="zelle' + (d === h ? ' heute' : '') + (ab ? ' frei' : '')
          + (wu ? ' wunsch' : '') + '" data-tag="' + d + '" data-ma="' + m.id + '"'
          + (ab ? ' title="' + UI.sicher(T.wert(ab.typ)) + '"'
            : (wu ? ' title="' + UI.sicher(T.t('h_wunsch')) + ': ' + UI.sicher(T.wert(wu.typ)) + ' · '
              + UI.sicher(T.t('pc_tt_zelle')) + '"'
              : ' title="' + UI.sicher(T.t('pc_tt_zelle')) + '"')) + '>';
        meine.forEach(function (s) {
          var warn = Kern.konflikte(s, s.id).length;
          t += '<span class="schichtchip' + (s.veroeffentlicht ? '' : ' entwurf')
            + '" draggable="true" data-schicht="' + s.id + '" role="button" tabindex="0" title="'
            + UI.sicher(s.von + '–' + s.bis + ' · ' + T.wert(s.position) + ' – ' + T.t('pc_tt_schicht'))
            + '" style="background:' + Masken.farbeFuerPosition(s.position, m.farbe) + '">'
            + (warn ? '<span class="warnzeichen" title="' + UI.sicher(T.t('pc_tt_hinweise')) + '">⚠</span>' : '')
            + s.von + '–' + s.bis + '<small>' + UI.sicher(T.wert(s.position))
            + (s.pause_min ? ' · ' + s.pause_min + ' min' : '') + '</small></span>';
        });
        if (!meine.length && ab) {
          t += '<span style="font-size:12px;color:var(--gruen);font-weight:600">'
            + UI.sicher(T.wert(ab.typ)) + '</span>';
        }
        t += '</td>';
      });
      t += '</tr>';
    });

    var offene = rows.filter(function (s) { return !s.mitarbeiter_id; });
    if (offene.length) {
      t += '<tr><td class="person" style="color:var(--rot)">'
        + '<span class="punkt" style="background:var(--rot)"></span>'
        + T.t('offen_bez') + '<small>' + T.t('niemand_eingeteilt') + '</small></td>';
      tage.forEach(function (d) {
        t += '<td class="zelle" data-tag="' + d + '" data-ma="" title="'
          + UI.sicher(T.t('pc_tt_zelle')) + '">';
        offene.filter(function (s) { return s.datum === d; }).forEach(function (s) {
          t += '<span class="schichtchip' + (s.veroeffentlicht ? '' : ' entwurf')
            + '" draggable="true" data-schicht="' + s.id + '" role="button" tabindex="0" title="'
            + UI.sicher(s.von + '–' + s.bis + ' · ' + T.wert(s.position) + ' – ' + T.t('pc_tt_schicht'))
            + '" style="background:var(--rot)">'
            + s.von + '–' + s.bis + '<small>' + UI.sicher(T.wert(s.position)) + '</small></span>';
        });
        t += '</td>';
      });
      t += '</tr>';
    }

    t += '</tbody><tfoot><tr><td class="person">' + T.t('summe') + '</td>';
    tage.forEach(function (d) {
      var min = rows.filter(function (s) { return s.datum === d; })
        .reduce(function (a, s) { return a + Kern.dauerMinuten(s.von, s.bis, s.pause_min); }, 0);
      t += '<td>' + (min ? UI.zahl(Kern.stunden(min), 1) + ' h' : '–') + '</td>';
    });
    $('p_raster').innerHTML = t + '</tr></tfoot></table>';
    rasterVerdrahten();
  }

  function zielMarkeWeg() {
    document.querySelectorAll('.zelle.ziel').forEach(function (z) { z.classList.remove('ziel'); });
  }

  function rasterVerdrahten() {
    $('p_raster').querySelectorAll('.zelle').forEach(function (z) {
      z.onclick = function (e) {
        if (e.target.closest('.schichtchip')) return;
        Masken.schicht(null, z.getAttribute('data-tag'), z.getAttribute('data-ma') || null, nachPlan);
      };
      z.ondragover = function (e) { e.preventDefault(); z.classList.add('ziel'); };
      z.ondragleave = function () { z.classList.remove('ziel'); };
      z.ondrop = function (e) {
        e.preventDefault();
        z.classList.remove('ziel');
        if (!gezogen) return;
        var tag = z.getAttribute('data-tag');
        var maId = z.getAttribute('data-ma') || null;
        try {
          if (gezogen.art === 'schicht') {
            var warn = Kern.schichtVerschieben(gezogen.id, tag, maId);
            UI.rueckStreifen(T.t('r_schicht_verschoben'), nachPlan);
            if (warn.length) UI.melde(warn[0], 'warn');
          } else {
            var v = Kern.vorlagen().find(function (x) { return Number(x.id) === gezogen.id; });
            if (!v) return;
            var r = Kern.schichtSpeichern({
              datum: tag, von: v.von, bis: v.bis, pause_min: v.pause_min,
              mitarbeiter_id: maId, position: v.position, notiz: '', veroeffentlicht: 0
            });
            UI.rueckStreifen(T.t('r_schicht_angelegt'), nachPlan);
            if (r.warnungen.length) UI.melde(r.warnungen[0], 'warn');
          }
          nachPlan();
        } catch (err) { UI.fehler(err); }
        gezogen = null;
      };
    });

    $('p_raster').querySelectorAll('.schichtchip').forEach(function (c) {
      var id = Number(c.getAttribute('data-schicht'));
      c.onclick = function (e) { e.stopPropagation(); Masken.schicht(id, null, null, nachPlan); };
      c.ondragstart = function (e) {
        gezogen = { art: 'schicht', id: id };
        c.classList.add('gezogen');
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', 'schicht'); } catch (x) { /* egal */ }
      };
      c.ondragend = function () { c.classList.remove('gezogen'); gezogen = null; zielMarkeWeg(); };
    });
  }

  function vorwocheUebernehmen() {
    UI.frage(T.t('vorwoche_uebernehmen'), T.t('pc_vorwoche_frage')).then(function (ja) {
      if (!ja) return;
      try {
        var n = Kern.wocheKopieren(Kern.plusTage(wocheMontag, -7), wocheMontag);
        UI.melde(n ? T.t('pc_uebernommen_n').replace('{n}', n) : T.t('h_nichts_uebernehmen'),
          n ? 'gut' : 'warn');
        if (n) UI.rueckStreifen(n + ' ' + T.t('h_uebernommen'), nachPlan);
        nachPlan();
      } catch (e) { UI.fehler(e); }
    });
  }

  function freigeben(wert) {
    try {
      var n = Kern.wocheFreigeben(wocheMontag, Kern.plusTage(wocheMontag, 6), wert);
      UI.melde(n
        ? n + ' ' + T.t(wert ? 'h_plan_frei_n' : 'pc_zurueckgezogen')
        : T.t('pc_nichts_aendern'), n ? 'gut' : 'warn');
      if (n) UI.rueckStreifen(T.t(wert ? 'h_plan_freigegeben' : 'r_freigabe_zurueck'), nachPlan);
      nachPlan();
    } catch (e) { UI.fehler(e); }
  }

  function wocheLeeren() {
    UI.frage(T.t('woche_leeren'), T.t('pc_leeren_frage')).then(function (ja) {
      if (!ja) return;
      var n = Kern.wocheLeeren(wocheMontag, Kern.plusTage(wocheMontag, 6));
      UI.rueckStreifen(T.t('pc_entfernt_n').replace('{n}', n), nachPlan);
      nachPlan();
    });
  }

  /* =========================================================================
     Wünsche
     ========================================================================= */

  function wuenscheZeichnen() {
    var rows = Kern.wuensche(null, $('w_status').value || null);
    var t = '<thead><tr><th>' + T.t('mitarbeiter') + '</th><th>' + T.t('typ') + '</th>'
      + '<th>' + T.t('zeitraum') + '</th><th>' + T.t('bemerkung') + '</th>'
      + '<th>' + T.t('status') + '</th><th></th></tr></thead><tbody>';
    if (!rows.length) t += '<tr><td colspan="6">' + UI.leer(T.t('keine_wuensche')) + '</td></tr>';
    rows.forEach(function (w) {
      var anzahl = Kern.tageZwischen(w.von_datum, w.bis_datum).length;
      t += '<tr><td><b>' + UI.sicher(w.ma_name) + '</b></td>'
        + '<td>' + UI.sicher(T.wert(w.typ)) + '</td>'
        + '<td>' + UI.tagKurz(w.von_datum)
        + (w.bis_datum !== w.von_datum
          ? ' – ' + UI.tagKurz(w.bis_datum) + ' <small>(' + anzahl + ')</small>' : '') + '</td>'
        + '<td>' + UI.sicher(w.bemerkung || '') + '</td>'
        + '<td>' + UI.etikett(T.status(w.status), w.status) + '</td>'
        + '<td style="white-space:nowrap;text-align:right">'
        + (w.status !== 'genehmigt'
          ? '<button type="button" class="gruen" data-ja="' + w.id + '" title="'
            + UI.sicher(T.t('pc_tt_genehmigen')) + '">✓</button> ' : '')
        + (w.status !== 'abgelehnt'
          ? '<button type="button" data-nein="' + w.id + '" title="'
            + UI.sicher(T.t('pc_tt_ablehnen')) + '">✕</button> ' : '')
        + '<button type="button" data-bearb="' + w.id + '" title="'
        + UI.sicher(T.t('pc_tt_bearbeiten')) + '">…</button></td></tr>';
    });
    $('w_tabelle').innerHTML = t + '</tbody>';
    $('w_tabelle').querySelectorAll('[data-ja]').forEach(function (b) {
      b.onclick = function () { statusSetzen(Number(b.getAttribute('data-ja')), 'genehmigt'); };
    });
    $('w_tabelle').querySelectorAll('[data-nein]').forEach(function (b) {
      b.onclick = function () { statusSetzen(Number(b.getAttribute('data-nein')), 'abgelehnt'); };
    });
    $('w_tabelle').querySelectorAll('[data-bearb]').forEach(function (b) {
      b.onclick = function () { Masken.wunsch(Number(b.getAttribute('data-bearb')), nachWunsch); };
    });
  }

  function statusSetzen(id, status) {
    try {
      Kern.wunschStatus(id, status);
      UI.rueckStreifen(T.t('h_wunsch') + ' ' + T.status(status), nachWunsch);
      nachWunsch();
    } catch (e) { UI.fehler(e); }
  }

  /* =========================================================================
     Zeiterfassung
     ========================================================================= */

  function zeitenZeichnen() {
    var maWahl = $('z_ma');
    var alt = maWahl.value;
    maWahl.innerHTML = '<option value="">' + T.t('alle') + '</option>'
      + Kern.maListe(true).map(function (m) {
        return '<option value="' + m.id + '">' + UI.sicher(m.name) + '</option>';
      }).join('');
    maWahl.value = alt;

    var von = $('z_von').value || Kern.plusTage(Kern.heute(), -13);
    var bis = $('z_bis').value || Kern.heute();
    var rows = Kern.zeiten(von, bis, maWahl.value || null);

    var t = '<thead><tr><th>' + T.t('datum') + '</th><th>' + T.t('mitarbeiter') + '</th>'
      + '<th>' + T.t('beginn') + '</th><th>' + T.t('ende') + '</th>'
      + '<th class="zahl">' + T.t('pause') + '</th><th class="zahl">' + T.t('stunden') + '</th>'
      + '<th>' + T.t('quelle') + '</th><th>' + T.t('bemerkung') + '</th><th></th></tr></thead><tbody>';
    if (!rows.length) t += '<tr><td colspan="9">' + UI.leer(T.t('keine_zeiten')) + '</td></tr>';
    var summe = 0;
    rows.forEach(function (z) {
      summe += z.dauer_std;
      t += '<tr><td>' + UI.tagKurz(z.datum) + '</td>'
        + '<td>' + UI.sicher(z.ma_name) + '</td>'
        + '<td>' + UI.sicher(z.start) + '</td>'
        + '<td>' + (z.ende ? UI.sicher(z.ende) : UI.etikett(T.t('laeuft'), 'laeuft')) + '</td>'
        + '<td class="zahl">' + (z.pause_min || 0) + '</td>'
        + '<td class="zahl">' + (z.ende ? UI.zahl(z.dauer_std, 2) : '–') + '</td>'
        + '<td>' + UI.sicher(T.wert(z.quelle)) + '</td>'
        + '<td>' + UI.sicher(z.bemerkung || '') + '</td>'
        + '<td style="white-space:nowrap;text-align:right">'
        + (z.ende ? '<button type="button" class="' + (z.freigegeben ? 'gruen' : '')
          + '" data-frei="' + z.id + '" title="' + UI.sicher(T.t('pc_tt_zeit_ok')) + '">✓</button> ' : '')
        + '<button type="button" data-bearb="' + z.id + '" title="'
        + UI.sicher(T.t('pc_tt_bearbeiten')) + '">…</button></td></tr>';
    });
    $('z_tabelle').innerHTML = t + '</tbody><tfoot><tr><td colspan="5">' + T.t('summe') + '</td>'
      + '<td class="zahl">' + UI.zahl(summe, 2) + '</td><td colspan="3"></td></tr></tfoot>';

    $('z_tabelle').querySelectorAll('[data-frei]').forEach(function (b) {
      b.onclick = function () {
        var id = Number(b.getAttribute('data-frei'));
        var z = rows.find(function (x) { return Number(x.id) === id; });
        Kern.zeitFreigeben(id, z && z.freigegeben ? 0 : 1);
        nachZeit();
      };
    });
    $('z_tabelle').querySelectorAll('[data-bearb]').forEach(function (b) {
      b.onclick = function () { Masken.zeit(Number(b.getAttribute('data-bearb')), nachZeit); };
    });
  }

  function zeitenFreigeben() {
    var n = Kern.zeitenFreigeben($('z_von').value, $('z_bis').value, $('z_ma').value || null);
    UI.melde(n ? T.t('pc_zeiten_frei_n').replace('{n}', n) : T.t('nichts_offen'),
      n ? 'gut' : 'warn');
    if (n) UI.rueckStreifen(n + ' ' + T.t('zeiten_freigegeben'), nachZeit);
    nachZeit();
  }

  /* =========================================================================
     Team
     ========================================================================= */

  function teamZeichnen() {
    var suche = String($('t_suche').value || '').toLowerCase().trim();
    var rows = Kern.maListe($('t_inaktive').checked).filter(function (m) {
      if (!suche) return true;
      return (m.name + ' ' + (m.rolle || '') + ' ' + (m.telefon || '') + ' ' + (m.email || ''))
        .toLowerCase().indexOf(suche) >= 0;
    });
    $('t_adresse').textContent = Kern.appBasis() + 'team.html';

    var t = '<thead><tr><th>' + T.t('mitarbeiter') + '</th><th>' + T.t('rolle') + '</th>'
      + '<th>' + T.t('vertrag') + '</th><th>' + T.t('telefon') + '</th><th>' + T.t('email') + '</th>'
      + '<th class="zahl">' + T.t('stundenlohn') + '</th>'
      + '<th class="zahl">' + T.t('wochenstunden') + '</th>'
      + '<th>' + T.t('persoenlicher_link') + '</th><th></th></tr></thead><tbody>';
    if (!rows.length) t += '<tr><td colspan="9">' + UI.leer(T.t('niemand_gefunden')) + '</td></tr>';
    rows.forEach(function (m) {
      t += '<tr' + (m.aktiv ? '' : ' class="aus"') + '>'
        + '<td><div class="teamkarte"><div class="punkt" style="background:' + m.farbe + '">'
        + UI.sicher(Masken.kuerzel(m.name)) + '</div><div><b>' + UI.sicher(m.name) + '</b>'
        + (m.ist_chef ? ' ' + UI.etikett(T.wert('Leitung')) : '')
        + (m.beispiel ? ' ' + UI.etikett(T.t('pc_beispiel'), 'offen') : '')
        + (m.aktiv ? '' : ' ' + UI.etikett(T.t('pc_nicht_mehr_da')))
        + (m.eingeladen_am ? ' ' + UI.etikett(T.t('eingeladen_am')
          .replace('{datum}', Kern.dm(m.eingeladen_am)), 'genehmigt') : '')
        + '<small style="display:block;color:var(--text-leise)">'
        + T.t(m.sprache === 'it' ? 'sprache_it' : 'sprache_de')
        + (m.eintritt ? T.t('pc_seit_datum').replace('{datum}', Kern.dmy(m.eintritt)) : '')
        + '</small>'
        + (m.aktiv ? '<button type="button" class="alslink einladelink" data-einladen="' + m.id
          + '" title="' + UI.sicher(T.t('pc_tt_einladen')) + '">📲 '
          + UI.sicher(T.t('einladen_kurz')) + '</button>' : '')
        + '</div></div></td>'
        + '<td>' + UI.sicher(T.wert(m.rolle || '')) + '</td>'
        + '<td>' + UI.sicher(T.wert(m.vertrag || '')) + '</td>'
        + '<td>' + UI.sicher(m.telefon || '') + '</td>'
        + '<td>' + UI.sicher(m.email || '') + '</td>'
        + '<td class="zahl">' + (m.stundenlohn ? UI.euro(m.stundenlohn) : '–') + '</td>'
        + '<td class="zahl">' + (m.wochenstunden ? UI.zahl(m.wochenstunden, 1) : '–') + '</td>'
        + '<td style="white-space:nowrap">'
        + '<button type="button" data-link="' + m.id + '" title="' + UI.sicher(T.t('pc_tt_link')) + '">🔗 '
        + T.t('link_kopieren') + '</button> '
        + (m.telefon ? '<button type="button" data-wa="' + m.id + '" title="'
          + UI.sicher(T.t('pc_tt_whatsapp')) + '">WhatsApp</button>' : '')
        + '</td><td style="text-align:right">'
        + '<button type="button" data-bearb="' + m.id + '" title="'
        + UI.sicher(T.t('pc_tt_bearbeiten')) + '">…</button></td></tr>';
    });
    $('t_tabelle').innerHTML = t + '</tbody>';

    $('t_tabelle').querySelectorAll('[data-bearb]').forEach(function (b) {
      b.onclick = function () { Masken.mitarbeiter(Number(b.getAttribute('data-bearb')), nachTeam); };
    });
    $('t_tabelle').querySelectorAll('[data-einladen]').forEach(function (b) {
      b.onclick = function () { Masken.einladung(Number(b.getAttribute('data-einladen')), nachTeam); };
    });
    $('t_tabelle').querySelectorAll('[data-link]').forEach(function (b) {
      b.onclick = function () { UI.kopieren(Masken.appLink(Number(b.getAttribute('data-link')))); };
    });
    $('t_tabelle').querySelectorAll('[data-wa]').forEach(function (b) {
      b.onclick = function () {
        var m = Kern.ma(Number(b.getAttribute('data-wa')));
        var text = (m.sprache === 'it'
          ? 'Ciao ' + m.name.split(' ')[0] + ', qui trovi sempre il tuo piano turni: '
          : 'Hallo ' + m.name.split(' ')[0] + ', hier findest du immer deinen Dienstplan: ')
          + Masken.appLink(m.id);
        window.open('https://wa.me/' + String(m.telefon).replace(/[^\d]/g, '').replace(/^0/, '49')
          + '?text=' + encodeURIComponent(text), '_blank');
      };
    });
  }

  /* =========================================================================
     Mitarbeiter einlesen
     ========================================================================= */

  function einlesenVerdrahten() {
    $('e_datei').onclick = function () { $('e_dateifeld').click(); };
    $('e_dateifeld').onchange = function () {
      var d = $('e_dateifeld').files[0];
      if (!d) return;
      UI.tabelleDateiLesen(d).then(function (text) {
        $('e_text').value = text;
        einlesenPruefen();
      }).catch(UI.fehler);
      $('e_dateifeld').value = '';
    };
    $('e_vorlage').onclick = function () {
      UI.dateiSpeichern('Importvorlage_Mitarbeiter.csv', Kern.importVorlage(), 'text/csv');
      UI.melde(T.t('pc_vorlage_downloads'), 'gut');
    };
    $('e_beispiel').onclick = function () {
      $('e_text').value = Kern.importVorlage();
      einlesenPruefen();
    };
    $('e_pruefen').onclick = einlesenPruefen;
    $('e_leeren').onclick = function () {
      $('e_text').value = '';
      $('e_ergebnis').innerHTML = '';
    };

    var zone = $('e_zone');
    ['dragenter', 'dragover'].forEach(function (n) {
      zone.addEventListener(n, function (e) { e.preventDefault(); zone.classList.add('drueber'); });
    });
    ['dragleave', 'drop'].forEach(function (n) {
      zone.addEventListener(n, function (e) { e.preventDefault(); zone.classList.remove('drueber'); });
    });
    zone.addEventListener('drop', function (e) {
      var d = e.dataTransfer.files && e.dataTransfer.files[0];
      if (!d) return;
      UI.tabelleDateiLesen(d).then(function (text) {
        $('e_text').value = text;
        einlesenPruefen();
      }).catch(UI.fehler);
    });
  }

  function einlesenPruefen() {
    var text = $('e_text').value;
    if (!String(text).trim()) {
      UI.melde(T.t('h_erst_datei'), 'warn');
      return;
    }
    Masken.importVorschau($('e_ergebnis'), text, function () {
      $('e_text').value = '';
      alleZeichnen();
      seiteZeigen('team');
    });
  }

  /* =========================================================================
     Auswertung
     ========================================================================= */

  function auswertungZeichnen() {
    var monat = $('a_monat').value || Kern.heute().slice(0, 7);
    var a;
    try { a = Kern.auswertung(monat, null); } catch (e) { UI.fehler(e); return; }

    var h = '<div class="kacheln">'
      + '<div class="kachel gut"><div class="wert">' + UI.zahl(a.summe_stunden, 1)
      + '</div><div class="bez">' + T.t('stunden') + '</div></div>'
      + '<div class="kachel"><div class="wert">' + UI.euro(a.summe_lohn)
      + '</div><div class="bez">' + T.t('grundlohn') + ' + ' + T.t('zuschlaege') + '</div></div>'
      + '<div class="kachel"><div class="wert">' + a.zeilen.length
      + '</div><div class="bez">' + T.t('mitarbeiter') + '</div></div></div>';

    h += '<div class="karte"><h2>' + UI.monatName(monat) + '</h2><div class="tabelle"><table>'
      + '<thead><tr><th>' + T.t('mitarbeiter') + '</th><th>' + T.t('vertrag') + '</th>'
      + '<th class="zahl">' + T.t('stunden') + '</th><th class="zahl">' + T.t('geplant') + '</th>'
      + '<th class="zahl">' + T.t('differenz') + '</th><th class="zahl">' + T.t('sonntag') + '</th>'
      + '<th class="zahl">' + T.t('nacht') + '</th><th class="zahl">' + T.t('stundenlohn') + '</th>'
      + '<th class="zahl">' + T.t('gesamt') + '</th></tr></thead><tbody>';
    if (!a.zeilen.length) h += '<tr><td colspan="9">' + UI.leer(T.t('keine_zeiten')) + '</td></tr>';
    a.zeilen.forEach(function (z) {
      h += '<tr class="lohnzeile" data-ma="' + z.mitarbeiter_id + '" role="button" tabindex="0" title="'
        + UI.sicher(T.t('pc_tt_lohnzeile')) + '">'
        + '<td><b>' + UI.sicher(z.name) + '</b>'
        + (z.offen ? ' ' + UI.etikett(z.offen + ' ' + T.t('ungeprueft'), 'offen') : '')
        + (z.urlaubstage ? ' ' + UI.etikett(T.t('pc_urlaub_n').replace('{n}', z.urlaubstage)) : '')
        + (z.kranktage ? ' ' + UI.etikett(T.t('pc_krank_n').replace('{n}', z.kranktage)) : '') + '</td>'
        + '<td>' + UI.sicher(T.wert(z.vertrag || '')) + '</td>'
        + '<td class="zahl"><b>' + UI.zahl(z.stunden, 2) + '</b></td>'
        + '<td class="zahl">' + UI.zahl(z.geplant_std, 2) + '</td>'
        + '<td class="zahl" style="color:' + (z.differenz_std < 0 ? 'var(--rot)' : 'var(--gruen)')
        + '">' + (z.differenz_std > 0 ? '+' : '') + UI.zahl(z.differenz_std, 2) + '</td>'
        + '<td class="zahl">' + UI.zahl(z.sonntag_std, 2) + '</td>'
        + '<td class="zahl">' + UI.zahl(z.nacht_std, 2) + '</td>'
        + '<td class="zahl">' + UI.euro(z.stundenlohn) + '</td>'
        + '<td class="zahl"><b>' + UI.euro(z.gesamt) + '</b>'
        + (z.vertrag === 'Minijob' && a.minijob_grenze
          ? UI.balken(z.anteil_grenze,
            z.ueber_grenze ? 'rot' : (z.anteil_grenze > 0.85 ? 'warn' : ''))
            + '<small style="color:' + (z.ueber_grenze ? 'var(--rot)' : 'var(--text-leise)') + '">'
            + (z.ueber_grenze ? T.t('minijob_hinweis')
              : T.t('pc_von_betrag').replace('{betrag}', UI.euro(a.minijob_grenze)))
            + '</small>' : '')
        + '</td></tr>';
      h += '<tr class="lohndetail" data-detail="' + z.mitarbeiter_id + '" style="display:none">'
        + '<td colspan="9"><table><thead><tr><th>' + T.t('datum') + '</th>'
        + '<th>' + T.t('beginn') + '</th><th>' + T.t('ende') + '</th>'
        + '<th class="zahl">' + T.t('pause') + '</th><th class="zahl">' + T.t('stunden') + '</th>'
        + '<th>' + T.t('quelle') + '</th><th></th></tr></thead><tbody>'
        + (z.tage.length ? z.tage.map(function (d) {
          return '<tr><td>' + UI.tagKurz(d.datum) + '</td><td>' + d.start + '</td><td>' + d.ende
            + '</td><td class="zahl">' + d.pause_min + '</td><td class="zahl">'
            + UI.zahl(d.std, 2) + '</td><td>' + UI.sicher(T.wert(d.quelle)) + '</td><td>'
            + (d.freigegeben ? UI.etikett(T.t('geprueft'), 'genehmigt')
              : UI.etikett(T.t('zeit_offen'), 'offen'))
            + '</td></tr>';
        }).join('') : '<tr><td colspan="7">' + UI.leer(T.t('keine_zeiten')) + '</td></tr>')
        + '</tbody></table></td></tr>';
    });
    h += '</tbody><tfoot><tr><td colspan="2">' + T.t('summe') + '</td>'
      + '<td class="zahl">' + UI.zahl(a.summe_stunden, 2) + '</td><td colspan="5"></td>'
      + '<td class="zahl">' + UI.euro(a.summe_lohn) + '</td></tr></tfoot></table></div>'
      + '<p style="font-size:12.5px;color:var(--text-leise);margin-top:10px">'
      + UI.sicher(T.t('pc_auswertung_satz').replace('{so}', a.zuschlag_sonntag)
        .replace('{na}', a.zuschlag_nacht).replace('{ab}', Kern.einst('nacht_ab'))) + '</p></div>';
    $('a_inhalt').innerHTML = h;

    $('a_inhalt').querySelectorAll('.lohnzeile').forEach(function (r) {
      r.onclick = function () {
        var d = $('a_inhalt').querySelector('[data-detail="' + r.getAttribute('data-ma') + '"]');
        if (d) d.style.display = d.style.display === 'none' ? '' : 'none';
      };
    });
  }

  function auswertungCsv() {
    var monat = $('a_monat').value || Kern.heute().slice(0, 7);
    try {
      UI.dateiSpeichern('PizzaPlan_' + monat + '.csv', Kern.auswertungCsv(monat), 'text/csv');
      UI.melde(T.t('pc_csv_downloads'), 'gut');
    } catch (e) { UI.fehler(e); }
  }

  /* =========================================================================
     Termine
     ========================================================================= */

  function termineZeichnen() {
    var rows = Kern.termine($('tm_von').value, $('tm_bis').value, $('tm_offen').checked);
    if (!rows.length) { $('tm_liste').innerHTML = UI.leer(T.t('keine_termine')); return; }
    var h = '', letzter = '';
    rows.forEach(function (t) {
      if (t.datum !== letzter) {
        h += '<div style="margin:16px 0 8px;font-size:13px;font-weight:600;'
          + 'color:var(--text-leise)">' + UI.tagLang(t.datum) + '</div>';
        letzter = t.datum;
      }
      h += '<div class="zeile" style="border-left-color:'
        + (t.erledigt ? 'var(--linie-stark)' : 'var(--gelb)') + '">'
        + '<div class="haupttext"><b'
        + (t.erledigt ? ' style="text-decoration:line-through;opacity:.6"' : '') + '>'
        + UI.sicher(t.titel) + '</b><span>'
        + (t.ganztags ? T.t('ganztags')
          : (t.von_zeit || '') + (t.bis_zeit ? '–' + t.bis_zeit : '') + (t.von_zeit ? T.t('h_uhr') : ''))
        + (t.ort ? ' · ' + UI.sicher(t.ort) : '') + ' · ' + UI.sicher(T.wert(t.kategorie))
        + (t.wiederholung !== 'keine' ? ' · ' + UI.sicher(T.wert(t.wiederholung)) : '')
        + (t.erinnerung_min ? ' · ⏰ ' + Masken.erinnerungText(t.erinnerung_min) : '')
        + '</span></div><div class="rechts" style="white-space:nowrap">'
        + '<button type="button" data-fertig="' + t.id + '" title="'
        + UI.sicher(T.t(t.erledigt ? 'pc_tt_wieder_offen' : 'pc_tt_erledigt')) + '">'
        + (t.erledigt ? '↺' : '✓') + '</button> '
        + '<button type="button" data-bearb="' + t.id + '" title="'
        + UI.sicher(T.t('pc_tt_bearbeiten')) + '">…</button></div></div>';
    });
    $('tm_liste').innerHTML = h;
    $('tm_liste').querySelectorAll('[data-fertig]').forEach(function (b) {
      b.onclick = function () {
        var id = Number(b.getAttribute('data-fertig'));
        var t = rows.find(function (x) { return Number(x.id) === id; });
        Kern.terminErledigt(id, t && t.erledigt ? 0 : 1);
        nachTermin();
      };
    });
    $('tm_liste').querySelectorAll('[data-bearb]').forEach(function (b) {
      b.onclick = function () {
        Masken.termin(Number(b.getAttribute('data-bearb')), null, nachTermin);
      };
    });
  }

  /* =========================================================================
     Versand
     ========================================================================= */

  function versandZeichnen() {
    var weg = $('v_weg').value;
    var erreichbar = Kern.maListe(false).filter(function (m) {
      return weg === 'whatsapp' ? m.telefon : m.email;
    }).length;
    /* Kann niemand etwas bekommen, sagen wir gleich, woran es liegt. */
    $('v_hinweis').textContent = T.t(weg === 'whatsapp'
      ? 'versand_hinweis_whatsapp' : 'versand_hinweis_email')
      + (erreichbar ? '' : ' ' + T.t(weg === 'whatsapp' ? 'pc_versand_keine_nummer' : 'pc_versand_keine_adresse'));
    $('v_hinweis').classList.toggle('warn', !erreichbar);
    $('v_empfaenger').innerHTML = Kern.maListe(false).map(function (m) {
      var fehlt = weg === 'whatsapp' ? !m.telefon : !m.email;
      return '<label><input type="checkbox" value="' + m.id + '"' + (fehlt ? '' : ' checked')
        + (fehlt ? ' disabled' : '') + '><span>' + UI.sicher(m.name) + '</span>'
        + (fehlt ? '<span class="fehlt">'
          + T.t(weg === 'whatsapp' ? 'keine_nummer' : 'keine_adresse') + '</span>' : '')
        + '</label>';
    }).join('');
  }

  function empfaengerAlle(an) {
    $('v_empfaenger').querySelectorAll('input:not(:disabled)').forEach(function (c) {
      c.checked = an;
    });
  }

  function gewaehlteEmpfaenger() {
    var ids = [];
    $('v_empfaenger').querySelectorAll('input:checked').forEach(function (c) {
      ids.push(Number(c.value));
    });
    return ids;
  }

  function versandVorschau() {
    try {
      var r = Kern.versandVorbereiten({
        von: $('v_von').value, bis: $('v_bis').value, weg: $('v_weg').value,
        mitarbeiter: gewaehlteEmpfaenger()
      });
      var erste = r.eintraege.filter(function (e) { return e.ok; })[0];
      if (!erste) { UI.melde(T.t('pc_fehlen_nummern'), 'warn'); return; }
      UI.fenster({
        titel: T.t('pc_so_sieht').replace('{name}', erste.name),
        breite: 620,
        inhalt: '<pre class="plantext">' + UI.sicher(erste.text) + '</pre>'
          + '<p style="margin-top:11px;color:var(--text-leise);font-size:13.5px">'
          + UI.sicher(T.t('pc_bereit').replace('{a}', r.bereit).replace('{b}', r.eintraege.length))
          + '</p>'
      });
    } catch (e) { UI.fehler(e); }
  }

  function gesamtplanZeigen() {
    var e = $('v_gesamttext');
    e.textContent = Kern.planTextGesamt($('v_von').value, $('v_bis').value, T.aktuell());
    e.style.display = '';
  }

  /* =========================================================================
     Einstellungen
     ========================================================================= */

  var REGLER = [
    ['pause_ab_6h', 'pause6', 0, 90, 5, 'min'],
    ['pause_ab_9h', 'pause9', 0, 120, 5, 'min'],
    ['ruhezeit_std', 'ruhezeit', 8, 16, 1, 'h'],
    ['zuschlag_sonntag', 'zuschlag_so', 0, 100, 5, '%'],
    ['zuschlag_nacht', 'zuschlag_nacht', 0, 100, 5, '%'],
    ['minijob_grenze', 'minijob_grenze', 0, 1200, 1, '€'],
    ['mindestlohn', 'mindestlohn', 0, 30, 0.01, '€']
  ];

  var TEXTFELDER = ['betrieb', 'chef_pin', 'positionen', 'oeffnung_von', 'oeffnung_bis',
    'termin_kategorien', 'termin_erinnerung_standard', 'versand_text', 'versand_text_it'];

  function einstellungenFuellen() {
    TEXTFELDER.forEach(function (k) {
      var e = $('ei_' + k);
      if (e) e.value = Kern.einst(k);
    });
    if (!$('ei_regler').dataset.gebaut) {
      $('ei_regler').innerHTML = REGLER.map(function (r) {
        return UI.schieber(r[0], T.t(r[1]), Kern.einstZahl(r[0]), r[2], r[3], r[4], r[5]);
      }).join('') + UI.feld('nacht_ab', T.t('nacht_ab'), Kern.einst('nacht_ab'), 'time');
      $('ei_regler').dataset.gebaut = '1';
      UI.regler($('ei_regler'));
    }
    $('ei_speicherort').textContent = T.t('pc_daten_ort').replace('{art}', Kern.speicherArt());

    var t = '<thead><tr><th>' + T.t('name') + '</th><th>' + T.t('von') + '</th><th>' + T.t('bis') + '</th>'
      + '<th class="zahl">' + T.t('pause') + '</th><th>' + T.t('position') + '</th><th></th>'
      + '</tr></thead><tbody>';
    Kern.vorlagen().forEach(function (v) {
      t += '<tr><td><span style="display:inline-block;width:12px;height:12px;border-radius:3px;'
        + 'background:' + v.farbe + ';margin-right:7px"></span>' + UI.sicher(v.name) + '</td>'
        + '<td>' + v.von + '</td><td>' + v.bis + '</td><td class="zahl">' + v.pause_min + '</td>'
        + '<td>' + UI.sicher(T.wert(v.position)) + '</td><td style="text-align:right">'
        + '<button type="button" data-v="' + v.id + '" title="'
        + UI.sicher(T.t('pc_tt_bearbeiten')) + '">…</button></td></tr>';
    });
    $('ei_vorlagen').innerHTML = t + '</tbody>';
    $('ei_vorlagen').querySelectorAll('[data-v]').forEach(function (b) {
      b.onclick = function () {
        Masken.vorlage(Number(b.getAttribute('data-v')), function () {
          planZeichnen();
          einstellungenFuellen();
        });
      };
    });
  }

  function einstellungenSpeichern() {
    var w = {};
    TEXTFELDER.forEach(function (k) {
      var e = $('ei_' + k);
      if (e) w[k] = e.value;
    });
    REGLER.forEach(function (r) {
      var e = $('ei_regler').querySelector('[name="' + r[0] + '"]');
      if (e) w[r[0]] = e.value;
    });
    var na = $('ei_regler').querySelector('[name=nacht_ab]');
    if (na) w.nacht_ab = na.value;
    if (!String(w.betrieb || '').trim()) {
      UI.melde(T.t('h_betrieb_fehlt'), 'warn');
      return;
    }
    if (!/^\d{4,8}$/.test(String(w.chef_pin || ''))) {
      UI.melde(T.t('h_pin_regel'), 'warn');
      return;
    }
    Kern.einstSetzen(w);
    $('kopf_betrieb').textContent = w.betrieb;
    UI.melde(T.t('gespeichert'), 'gut');
    UI.rueckStreifen(T.t('r_einst_geaendert'), function () {
      $('ei_regler').dataset.gebaut = '';
      alleZeichnen();
    });
    alleZeichnen();
  }

  function sicherungAnlegen() {
    UI.dateiSpeichern('PizzaPlan_Sicherung_' + Kern.heute() + '.json',
      Kern.sicherungText(), 'application/json');
    UI.melde(T.t('pc_sicherung_downloads'), 'gut');
  }

  function sicherungEinspielen() {
    var d = $('ei_sicherungdatei').files[0];
    if (!d) return;
    UI.dateiLesen(d).then(function (text) {
      UI.frage(T.t('sicherung_laden'), T.t('pc_sicherung_frage')).then(function (ja) {
        if (!ja) return;
        try {
          var n = Kern.sicherungEinlesen(text);
          UI.melde(T.t('pc_eingespielt').replace('{n}', n), 'gut');
          $('ei_regler').dataset.gebaut = '';
          alleZeichnen();
        } catch (e) { UI.fehler(e); }
      });
    }).catch(UI.fehler);
    $('ei_sicherungdatei').value = '';
  }

  function beispielEntfernen() {
    if (!Kern.hatBeispieldaten()) {
      UI.melde(T.t('h_keine_beispiele'), 'warn');
      return;
    }
    UI.frage(T.t('beispiel_weg'), T.t('pc_beispiel_frage')).then(function (ja) {
      if (!ja) return;
      Kern.beispielEntfernen();
      UI.rueckStreifen(T.t('h_beispiel_entfernt'), alleZeichnen);
      alleZeichnen();
    });
  }

  function allesLoeschen() {
    UI.frage(T.t('alles_loeschen'), T.t('pc_alles_frage'))
      .then(function (ja) {
        if (!ja) return;
        Kern.allesLoeschen();
        $('ei_regler').dataset.gebaut = '';
        UI.rueckStreifen(T.t('pc_alles_geloescht'), alleZeichnen);
        alleZeichnen();
      });
  }

  return { start: start, seiteZeigen: seiteZeigen };
})();

window.PC = PC;
document.addEventListener('DOMContentLoaded', function () { PC.start(); });
