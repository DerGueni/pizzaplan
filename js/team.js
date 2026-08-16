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

  function anmeldungZeigen() {
    $('anmeldung').style.display = '';
    T.anwenden();
    $('an_leute').innerHTML = Kern.maListe(false).map(function (m) {
      return '<button type="button" data-ma="' + m.id + '">'
        + '<span class="kreis" style="background:' + m.farbe + '">'
        + UI.sicher(Masken.kuerzel(m.name)) + '</span>'
        + '<span>' + UI.sicher(m.name)
        + '<small style="display:block;color:var(--text-leise);font-size:12.5px">'
        + UI.sicher(m.rolle || '') + '</small></span></button>';
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
      f.textContent = T.aktuell() === 'it'
        ? 'PIN sbagliato. Chiedi al titolare.'
        : 'Die PIN stimmt nicht. Bitte beim Chef melden.';
      $('an_pin').value = '';
      return;
    }
    ich = Kern.anmelden(gewaehlt.id);
    merkeCode(ich.zugangscode);
    hinein();
  }

  function hinein() {
    $('anmeldung').style.display = 'none';
    $('haupt').style.display = '';
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

    $('wu_neu').onclick = function () { Masken.wunsch(null, alleZeichnen, ich.id); };

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

  function stempelZeichnen() {
    uhrZeichnen();
    var s = Kern.stempelStatus(ich.id);
    var knopf = $('st_knopf');
    if (s.laufend) {
      var seit = Kern.dauerMinuten(s.laufend.start, Kern.jetztZeit(), 0);
      $('st_lage').textContent = T.aktuell() === 'it'
        ? 'Entrata alle ' + s.laufend.start
        : 'Eingestempelt seit ' + s.laufend.start + ' Uhr';
      $('st_lauf').innerHTML = '<div class="laufband"><span class="pulspunkt"></span>'
        + UI.zahl(Kern.stunden(seit), 2) + ' ' + T.t('stunden') + '</div>';
      knopf.textContent = T.t('feierabend');
      knopf.className = 'grossknopf stop';
    } else {
      $('st_lage').textContent = T.aktuell() === 'it'
        ? 'Non hai timbrato l\'entrata.' : 'Du bist nicht eingestempelt.';
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
      : UI.leer(T.aktuell() === 'it' ? 'Oggi ancora niente.' : 'Heute noch nichts erfasst.');

    var kommend = Kern.schichten(Kern.heute(), Kern.plusTage(Kern.heute(), 21), true, ich.id);
    $('st_naechste').innerHTML = kommend.length
      ? kommend.slice(0, 3).map(function (x) {
        return '<div class="zeile" style="border-left-color:'
          + Masken.farbeFuerPosition(x.position, ich.farbe) + '">'
          + '<div class="haupttext"><b>' + UI.tagLang(x.datum) + '</b>'
          + '<span>' + UI.sicher(x.position)
          + (x.notiz ? ' · ' + UI.sicher(x.notiz) : '') + '</span></div>'
          + '<div class="rechts"><b style="color:var(--text)">' + x.von + '</b><br>'
          + x.bis + '</div></div>';
      }).join('')
      : UI.leer(T.t('keine_schicht'));
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
    var vorgabe = Kern.pausenvorgabe(Kern.dauerMinuten(s.laufend.start, Kern.jetztZeit(), 0));
    UI.formular({
      titel: T.t('feierabend'),
      inhalt: '<p>' + (T.aktuell() === 'it'
        ? 'Hai iniziato alle ' + s.laufend.start + '. Quanta pausa hai fatto?'
        : 'Angefangen um ' + s.laufend.start + ' Uhr. Wie lange war die Pause?') + '</p>'
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
          + (ab ? UI.sicher(ab.typ) : (T.aktuell() === 'it' ? 'libero' : 'frei'))
          + '</span></div></div>';
      }
      return meine.map(function (s) {
        return '<div class="zeile" style="border-left-color:'
          + Masken.farbeFuerPosition(s.position, ich.farbe) + '">'
          + '<div class="haupttext"><b>' + UI.tagKurz(d) + '</b><span>'
          + UI.sicher(s.position) + ' · ' + UI.zahl(s.dauer_std, 2) + ' h'
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
      + rows.length + (T.aktuell() === 'it' ? ' turni' : ' Schichten') + '</div>';
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
        + '<div class="haupttext"><b>' + UI.sicher(w.typ) + '</b><span>'
        + UI.tagKurz(w.von_datum)
        + (w.bis_datum !== w.von_datum ? ' – ' + UI.tagKurz(w.bis_datum) : '')
        + (w.bemerkung ? ' · ' + UI.sicher(w.bemerkung) : '') + '</span></div>'
        + '<div class="rechts">' + UI.etikett(T.t(w.status), w.status) + '</div></div>';
    }).join('') : UI.leer(T.t('keine_wuensche'));
    $('wu_liste').querySelectorAll('[data-w]').forEach(function (z) {
      z.onclick = function () {
        var id = Number(z.getAttribute('data-w'));
        var w = rows.find(function (x) { return Number(x.id) === id; });
        if (w.status !== 'offen') {
          UI.melde(T.aktuell() === 'it'
            ? 'Questa richiesta è già stata decisa.'
            : 'Dieser Eintrag ist schon entschieden – bitte beim Chef melden.', 'warn');
          return;
        }
        Masken.wunsch(id, alleZeichnen, ich.id);
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
        + UI.euro(z.stundenlohn) + ' ' + (T.aktuell() === 'it' ? 'all\'ora' : 'pro Stunde')
        + (z.zuschlaege ? ' · ' + T.t('zuschlaege') + ' ' + UI.euro(z.zuschlaege) : '')
        + '<br><small>' + (T.aktuell() === 'it'
          ? 'Calcolo indicativo, non è la busta paga.'
          : 'Rechenhilfe – das ist keine Lohnabrechnung.') + '</small></div>';
    }
    h += z.tage.length ? z.tage.map(function (t) {
      return '<div class="zeile" style="border-left-color:'
        + (t.freigegeben ? 'var(--gruen)' : 'var(--gelb)') + '">'
        + '<div class="haupttext"><b>' + UI.tagKurz(t.datum) + '</b><span>'
        + t.start + '–' + t.ende + (t.pause_min ? ' · ' + t.pause_min + ' min' : '')
        + '</span></div><div class="rechts"><b style="color:var(--text)">'
        + UI.zahl(t.std, 2) + ' h</b><br>'
        + (t.freigegeben ? '✓' : (T.aktuell() === 'it' ? 'da controllare' : 'offen'))
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
    $('ic_rolle').textContent = (ich.rolle || '') + (ich.vertrag ? ' · ' + ich.vertrag : '');
    var zeilen = [];
    if (ich.wochenstunden) zeilen.push(T.t('wochenstunden') + ': ' + UI.zahl(ich.wochenstunden, 1));
    if (ich.urlaubstage) zeilen.push(T.t('urlaubstage') + ': ' + ich.urlaubstage);
    if (ich.telefon) zeilen.push(T.t('telefon') + ': ' + ich.telefon);
    if (ich.email) zeilen.push(T.t('email') + ': ' + ich.email);
    if (ich.eintritt) zeilen.push(T.t('eintritt') + ': ' + Kern.dmy(ich.eintritt));
    $('ic_daten').innerHTML = zeilen.map(UI.sicher).join('<br>')
      || '<span style="color:var(--text-leise)">–</span>';
    $('ic_sprache').querySelectorAll('[data-s]').forEach(function (b) {
      b.classList.toggle('an', b.getAttribute('data-s') === T.aktuell());
    });
  }

  function pinAendern() {
    var neu = String($('ic_pin').value || '').trim();
    if (!/^\d{4,8}$/.test(neu)) {
      UI.melde(T.aktuell() === 'it' ? 'Il PIN deve avere da 4 a 8 cifre.'
        : 'Die PIN muss aus 4 bis 8 Ziffern bestehen.', 'warn');
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
