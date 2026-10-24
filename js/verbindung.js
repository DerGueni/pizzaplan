/* PizzaPlan · Verbindung zum gemeinsamen Server
   ----------------------------------------------------------------------------
   Läuft die Seite unter …/api/pizzaplan/app/, sehen alle Chef-Geräte und die
   Mitarbeiter-Handys denselben Stand. Sonst (GitHub, Datei, Testserver) ist das
   der Vorführmodus: hier passiert dann gar nichts, alles bleibt wie bisher im Gerät.

   Chef (pc.html, handy.html): ganzer Stand, Kopfzeile X-PP-Betrieb.
     Jede Änderung wird sofort im Gerät gespeichert (Kern) und kurz danach als
     ganzer Stand hochgeladen. Haben Mitarbeiter inzwischen gestempelt oder etwas
     gewünscht, führt der Server das zusammen und schickt den neuen Stand zurück.
   Mitarbeiter (team.html): verkleinerter Stand, Kopfzeile X-PP-Zugang.
     Jede eigene Änderung wird als einzelne Aktion geschickt – ohne Netz kommt sie
     in eine Warteschlange und geht raus, sobald wieder Netz da ist.
*/
var Verbindung = (function () {
  'use strict';

  var APP_PFAD = '/api/pizzaplan/app/';
  var pfad = location.pathname;
  var SERVER = /^https?:$/.test(location.protocol) && pfad.indexOf(APP_PFAD) >= 0;
  var SEITE = /team\.html$/i.test(pfad) ? 'team' : (/(pc|handy)\.html$/i.test(pfad) ? 'chef' : '');
  var API = SERVER ? location.origin + pfad.slice(0, pfad.indexOf(APP_PFAD)) + '/api/pizzaplan' : '';

  var ZEIT_FELDER = ['datum', 'start', 'ende', 'pause_min', 'bemerkung', 'quelle'];
  var WUNSCH_FELDER = ['typ', 'von_datum', 'bis_datum', 'bemerkung'];

  /* =========================================================================
     Kleinigkeiten
     ========================================================================= */

  function lies(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function schreib(k, v) {
    try {
      if (v === null || v === undefined) window.localStorage.removeItem(k);
      else window.localStorage.setItem(k, String(v));
    } catch (e) { /* gesperrt */ }
  }
  function tt(k) { return window.T ? T.t(k) : k; }
  function zweisprachig(k) {
    var e = window.T && T.W[k];
    return e ? e[0] + '\n' + e[1] : k;
  }
  function melde(text, art) { if (window.UI) UI.melde(text, art); }
  function uhrzeit(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    return isNaN(d) ? '' : d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  }
  function fensterOffen() { return !!document.querySelector('.hintergrund'); }
  function netzDa() { return navigator.onLine !== false; }
  function gleich(a, b) { return String(a) === String(b); }

  var domFertig = new Promise(function (fertig) {
    if (document.readyState !== 'loading') fertig();
    else document.addEventListener('DOMContentLoaded', function () { fertig(); });
  });

  /* Eine Anfrage an den Server. Liefert immer {status, j}; ohne Netz status 0. */
  function anfrage(methode, weg, kopf, koerper) {
    var steuer = window.AbortController ? new AbortController() : null;
    var uhr = setTimeout(function () { if (steuer) steuer.abort(); }, 15000);
    var o = {
      method: methode, cache: 'no-store', credentials: 'omit',
      headers: Object.assign({ Accept: 'application/json' }, kopf || {})
    };
    if (koerper !== undefined) {
      o.headers['Content-Type'] = 'application/json';
      o.body = JSON.stringify(koerper);
    }
    if (steuer) o.signal = steuer.signal;
    return fetch(API + weg, o).then(function (r) {
      clearTimeout(uhr);
      return r.json().catch(function () { return {}; })
        .then(function (j) { return { status: r.status, j: j || {} }; });
    }, function () {
      clearTimeout(uhr);
      return { status: 0, j: {} };
    });
  }

  /* Status-Punkt im Kopf: grün verbunden, gelb wird übertragen, grau offline, rot Fehler. */
  var FARBE = { verbunden: 'var(--gruen)', senden: 'var(--gelb)', offline: '#9a948e', fehler: 'var(--rot-dunkel)' };

  function punktBauen() {
    var p = document.getElementById('pp_server_punkt');
    if (p) return p;
    var rechts = document.querySelector('#haupt .kopf .rechts');
    if (!rechts) return null;
    p = document.createElement('span');
    p.id = 'pp_server_punkt';
    p.setAttribute('role', 'status');
    p.style.cssText = 'display:inline-flex;align-items:center;gap:5px;font-size:11.5px;'
      + 'line-height:1;white-space:nowrap;cursor:pointer;color:#fff;margin-right:2px';
    p.innerHTML = '<i style="display:inline-block;width:10px;height:10px;border-radius:50%;'
      + 'border:2px solid rgba(255,255,255,.85);flex:none"></i><b style="font-weight:600"></b>';
    rechts.insertBefore(p, rechts.firstChild);
    return p;
  }

  function punktSetzen(art, titel, kurz) {
    var p = punktBauen();
    if (!p) return;
    p.querySelector('i').style.background = FARBE[art] || FARBE.offline;
    p.querySelector('b').textContent = kurz || '';
    p.title = titel;
    p.setAttribute('aria-label', titel);
  }

  /* =========================================================================
     Chef
     ========================================================================= */

  var C = {
    schluessel: lies('pp_betrieb_schluessel') || '',
    version: Number(lies('pp_server_version') || 0),
    offen: lies('pp_server_offen') === '1',
    gesichert: lies('pp_server_gesichert') || '',
    status: 'offline',
    laeuft: false,
    entprell: null,
    nr: 0,
    letzterText: '',
    wartend: null,
    nutzer: false,
    aus: false,
    zuletztGefragt: 0
  };

  /* Einrichtungslink …#betrieb=<schlüssel>: sofort merken und aus der Adresse nehmen. */
  (function schluesselAusAdresse() {
    if (!SERVER || SEITE !== 'chef') return;
    var m = /(?:^#|&)betrieb=([^&]+)/.exec(location.hash || '');
    if (!m) return;
    var k = '';
    try { k = decodeURIComponent(m[1]).trim(); } catch (e) { k = ''; }
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { location.hash = ''; }
    if (k && k !== C.schluessel) {
      C.schluessel = k;
      C.version = 0;
      C.offen = false;
      schreib('pp_betrieb_schluessel', k);
      schreib('pp_server_version', 0);
      schreib('pp_server_offen', null);
    }
  })();

  function chefKopf() { return { 'X-PP-Betrieb': C.schluessel }; }

  function chefMerken() {
    schreib('pp_server_version', C.version);
    schreib('pp_server_offen', C.offen ? '1' : null);
    schreib('pp_server_gesichert', C.gesichert || null);
  }

  function chefStatus(art) {
    if (art) C.status = art;
    var text;
    if (C.status === 'fehler') text = tt('sv_fehler_kurz');
    else if (C.status === 'offline') text = tt('sv_offline');
    else if (C.offen || C.laeuft) text = tt('sv_wird_uebertragen');
    else text = tt('sv_verbunden');
    var zeit = C.gesichert ? tt('sv_zuletzt').replace('{zeit}', uhrzeit(C.gesichert)) : tt('sv_noch_nie');
    var art2 = C.status === 'verbunden' && (C.offen || C.laeuft) ? 'senden' : C.status;
    punktSetzen(art2, tt('sv_titel') + ': ' + text + ' · ' + zeit, '');
    var s = document.getElementById('pp_sv_status');
    if (s) {
      s.innerHTML = '<i style="display:inline-block;width:10px;height:10px;border-radius:50%;'
        + 'margin-right:7px;background:' + (FARBE[art2] || FARBE.offline) + '"></i>';
      s.appendChild(document.createTextNode(text + ' · ' + zeit));
    }
  }

  /* Ganzer Stand fürs Hochladen. Die Einstellung „PIN in der Mitarbeiter-App“ reist
     zusätzlich in jedem Mitarbeiter mit – der Server gibt Mitarbeitern nur den eigenen Satz. */
  function chefNutzlast(text) {
    var d = JSON.parse(text);
    var pin = String((d.einstellung || {}).team_pin_verlangen || '0') === '1' ? 1 : 0;
    (d.mitarbeiter || []).forEach(function (m) { m.app_pin = pin; });
    return d;
  }

  function chefStand(daten, version) {
    C.version = Number(version) || 0;
    C.gesichert = new Date().toISOString();
    C.wartend = null;
    Kern.uebernehmen(daten);
    C.letzterText = JSON.stringify(Kern.daten());
    C.offen = false;
    C.nutzer = false;
    chefMerken();
    chefStatus('verbunden');
  }

  /* Nach jedem Speichern im Kern. */
  function chefGeaendert() {
    if (C.aus || !C.schluessel) return;
    var text;
    try { text = JSON.stringify(Kern.daten()); } catch (e) { return; }
    if (text === C.letzterText) return;
    C.nr++;
    if (!C.offen) { C.offen = true; chefMerken(); }
    chefStatus();
    clearTimeout(C.entprell);
    C.entprell = setTimeout(hochladen, 800);
  }

  function hochladen() {
    clearTimeout(C.entprell);
    if (C.aus || !C.schluessel || !C.offen) return Promise.resolve();
    if (C.laeuft) { C.entprell = setTimeout(hochladen, 400); return Promise.resolve(); }
    if (!netzDa()) { chefStatus('offline'); return Promise.resolve(); }
    C.laeuft = true;
    chefStatus();
    var meineNr = C.nr;
    var text = JSON.stringify(Kern.daten());
    return anfrage('PUT', '/stand', chefKopf(), { basis: C.version, daten: chefNutzlast(text) })
      .then(function (r) {
        C.laeuft = false;
        if (r.status === 200 && r.j.ok) {
          C.gesichert = new Date().toISOString();
          if (r.j.zusammengefuehrt && r.j.daten) {
            /* Mitarbeiter haben inzwischen gestempelt/gewünscht: zusammengeführten Stand übernehmen. */
            var verloren = C.nr !== meineNr;
            chefStand(r.j.daten, r.j.version);
            if (verloren) melde(tt('sv_konflikt'), 'warn');
            return;
          }
          C.version = Number(r.j.version) || C.version;
          C.letzterText = text;
          C.offen = C.nr !== meineNr;
          if (!C.offen) C.nutzer = false;
          chefMerken();
          chefStatus('verbunden');
          if (C.offen) C.entprell = setTimeout(hochladen, 300);
          return;
        }
        if (r.status === 409 && r.j.code === 'konflikt') {
          if (r.j.daten) {
            var zeigen = C.nutzer;
            chefStand(r.j.daten, r.j.version);
            if (zeigen) melde(tt('sv_konflikt'), 'warn');
          } else {
            /* Server wurde geleert: eigenen Stand neu hochladen. */
            C.version = Number(r.j.version) || 0;
            chefMerken();
            C.entprell = setTimeout(hochladen, 300);
          }
          return;
        }
        chefFehler(r);
      });
  }

  function chefFehler(r) {
    if (r.status === 0 || r.status >= 500) { chefStatus('offline'); return; }
    if (r.status === 401 || (r.status === 403 && /schluessel/.test(r.j.code || ''))) {
      chefStatus('fehler');
      melde(tt('sv_schluessel_ungueltig'), 'fehler');
      return;
    }
    if (r.status === 429) { chefStatus('fehler'); melde(tt('sv_gesperrt'), 'warn'); return; }
    chefStatus('fehler');
    melde(tt('sv_nicht_gespeichert'), 'fehler');
  }

  /* Neuer Stand vom Server? Nur übernehmen, wenn hier nichts Ungesendetes liegt. */
  function abgleichen() {
    if (C.aus || !C.schluessel) return Promise.resolve();
    if (C.offen) return hochladen();
    if (C.laeuft) return Promise.resolve();
    if (!netzDa()) { chefStatus('offline'); return Promise.resolve(); }
    C.zuletztGefragt = Date.now();
    var versionVorher = C.version;
    return anfrage('GET', '/stand', chefKopf()).then(function (r) {
      if (!(r.status === 200 && r.j.ok)) { chefFehler(r); return; }
      if (C.offen || C.laeuft || C.version !== versionVorher) { chefStatus('verbunden'); return; }
      var v = Number(r.j.version) || 0;
      if (!r.j.daten && C.version > 0) {
        /* Server wurde zurückgesetzt: eigenen Stand wieder hochladen. */
        C.version = 0;
        C.offen = true;
        chefMerken();
        return hochladen();
      }
      if (v > C.version && r.j.daten) {
        if (fensterOffen()) { C.wartend = r.j; chefStatus('verbunden'); return; }
        chefStand(r.j.daten, v);
        return;
      }
      if (v === C.version) { C.gesichert = new Date().toISOString(); chefMerken(); }
      chefStatus('verbunden');
    });
  }

  /* Ein Fenster war offen, als ein neuer Stand kam – nach dem Schließen übernehmen. */
  function wartendePruefen() {
    if (!C.wartend || fensterOffen()) return;
    var w = C.wartend;
    C.wartend = null;
    if (C.offen || C.laeuft || !(Number(w.version) > C.version)) return;
    chefStand(w.daten, w.version);
  }

  /* --- Erstverbindung --------------------------------------------------- */

  function holen() {
    if (!netzDa()) return Promise.resolve({ art: 'netz' });
    return anfrage('GET', '/stand', chefKopf()).then(function (r) {
      if (r.status === 200 && r.j.ok) return { art: 'ok', j: r.j };
      if (r.status === 401 || r.status === 403) return { art: 'falsch' };
      if (r.status === 429) return { art: 'gesperrt' };
      return { art: 'netz' };
    });
  }

  function schluesselEntfernen() {
    C.schluessel = '';
    C.version = 0;
    C.offen = false;
    schreib('pp_betrieb_schluessel', null);
    chefMerken();
  }

  var GRUND_TEXT = { falsch: 'sv_schluessel_falsch', gesperrt: 'sv_gesperrt', netz: 'sv_kein_netz', leer: 'sv_schluessel_leer' };

  /* Eingabe des Betriebsschlüssels – erscheint vor der PIN-Anmeldung. */
  function schluesselFenster(grund) {
    return new Promise(function (fertig) {
      var alt = document.getElementById('pp_verbinden');
      if (alt) alt.remove();
      var hg = document.createElement('div');
      hg.id = 'pp_verbinden';
      hg.className = 'anmeldung';
      hg.innerHTML = '<div class="karte" style="text-align:center">'
        + '<div style="font-size:46px">🍕</div>'
        + '<h1 data-t="sv_geraet_verbinden"></h1>'
        + '<p style="color:var(--text-leise);font-size:14px;text-align:left;margin-top:-2px" '
        + 'data-t="sv_schluessel_erklaerung"></p>'
        + '<div style="text-align:left;margin-top:12px">'
        + '<label for="pp_schluessel" data-t="sv_schluessel"></label>'
        + '<input id="pp_schluessel" type="text" autocomplete="off" autocapitalize="off" '
        + 'spellcheck="false" style="font-family:monospace"></div>'
        + '<button type="button" class="haupt gross" id="pp_verbinden_los" style="margin-top:12px" '
        + 'data-t="sv_verbinden"></button>'
        + '<p id="pp_verbinden_fehler" class="hinweis rot" style="display:none;margin-top:12px;text-align:left"></p>'
        + '<p style="margin-top:14px"><button type="button" class="still" id="pp_verbinden_sprache"></button></p>'
        + '</div>';
      document.body.appendChild(hg);
      var feld = hg.querySelector('#pp_schluessel');
      var knopf = hg.querySelector('#pp_verbinden_los');
      var fehlerFeld = hg.querySelector('#pp_verbinden_fehler');
      var fehlerJetzt = grund || '';
      if (C.schluessel && grund === 'netz') feld.value = C.schluessel;

      function zeichnen() {
        T.anwenden(hg);
        hg.querySelector('#pp_verbinden_sprache').textContent = T.aktuell() === 'it' ? 'Deutsch' : 'Italiano';
        fehlerFeld.style.display = fehlerJetzt ? '' : 'none';
        fehlerFeld.textContent = fehlerJetzt ? tt(GRUND_TEXT[fehlerJetzt] || fehlerJetzt) : '';
      }
      hg.querySelector('#pp_verbinden_sprache').onclick = function () {
        T.setze(T.aktuell() === 'it' ? 'de' : 'it');
        zeichnen();
      };
      function los() {
        var k = String(feld.value || '').trim();
        var m = /betrieb=([^&\s]+)/.exec(k);
        if (m) { try { k = decodeURIComponent(m[1]); } catch (e) { k = m[1]; } }
        if (!k) { fehlerJetzt = 'leer'; zeichnen(); return; }
        knopf.disabled = true;
        C.schluessel = k;
        holen().then(function (r) {
          knopf.disabled = false;
          if (r.art !== 'ok') {
            C.schluessel = '';
            fehlerJetzt = r.art;
            zeichnen();
            return;
          }
          if (k !== lies('pp_betrieb_schluessel')) { C.version = 0; C.offen = false; }
          schreib('pp_betrieb_schluessel', k);
          chefMerken();
          hg.remove();
          fertig(ersteDaten(r.j));
        });
      }
      knopf.onclick = los;
      feld.onkeydown = function (e) { if (e.key === 'Enter') los(); };
      zeichnen();
      setTimeout(function () { feld.focus(); }, 60);
    });
  }

  function ersteFrage() {
    return UI.fenster({
      titel: tt('sv_start_titel'),
      inhalt: '<p>' + UI.sicher(tt('sv_start_frage')) + '</p>',
      knoepfe: [
        { text: tt('sv_leer'), wert: 'leer' },
        { text: tt('sv_mit_beispiel'), art: 'haupt', wert: 'beispiel' }
      ]
    }).then(function (w) { return w || ersteFrage(); });
  }

  function codesPruefen() {
    var n = Kern.codesVerlaengern();
    if (n) setTimeout(function () { melde(tt('sv_codes_neu').replace('{n}', n), 'warn'); }, 600);
  }

  /* Erster Kontakt nach dem Start: Serverstand übernehmen oder – bei leerem Server – hochladen. */
  function ersteDaten(j) {
    if (j.daten) {
      if (C.offen && C.version > 0) {
        /* Hier liegen noch ungesendete Änderungen von früher: hochladen statt überschreiben. */
        C.letzterText = '';
        chefStatus('verbunden');
        hochladen().then(codesPruefen);
        return Promise.resolve();
      }
      chefStand(j.daten, j.version);
      codesPruefen();
      return Promise.resolve();
    }
    var frage = Kern.hatBeispieldaten() ? ersteFrage() : Promise.resolve('eigene');
    return frage.then(function (w) {
      if (w === 'leer') Kern.beispielEntfernen();
      Kern.codesVerlaengern();
      C.version = Number(j.version) || 0;
      C.letzterText = '';
      C.offen = true;
      chefMerken();
      chefStatus('verbunden');
      return hochladen();
    });
  }

  function chefVerbinden() {
    T.setze(Kern.einst('sprache'));
    if (!C.schluessel) return schluesselFenster('');
    return holen().then(function (r) {
      if (r.art === 'ok') return ersteDaten(r.j);
      if (r.art === 'netz' && C.version > 0) {
        /* Schon einmal verbunden: mit dem Stand im Gerät weiterarbeiten. */
        C.letzterText = C.offen ? '' : JSON.stringify(Kern.daten());
        chefStatus('offline');
        return null;
      }
      if (r.art === 'falsch') schluesselEntfernen();
      return schluesselFenster(r.art);
    });
  }

  /* --- Einstellungen: Abschnitt „Server“ --------------------------------- */

  function abschnittBauen() {
    var seite = document.getElementById('s_einstellungen') || document.getElementById('t_einstellungen');
    if (!seite || document.getElementById('pp_sv_karte')) return;
    var handy = seite.id === 't_einstellungen';
    var anker = document.getElementById(handy ? 'es_sicherung' : 'ei_sicherung');
    var vor = anker ? anker.closest('.karte') : null;
    var k = document.createElement('div');
    k.className = 'karte';
    k.id = 'pp_sv_karte';
    if (handy) k.style.marginTop = '14px';
    var h = handy ? 'h3' : 'h2';
    k.innerHTML = '<' + h + ' data-t="sv_titel"></' + h + '>'
      + '<p id="pp_sv_status" style="display:flex;align-items:center;font-size:14px;margin:4px 0 10px"></p>'
      + '<div class="' + (handy ? '' : 'leiste') + '">'
      + '<button type="button" id="pp_sv_jetzt" class="' + (handy ? 'gross' : '') + '" data-t="sv_jetzt_abgleichen"></button>'
      + '<button type="button" id="pp_sv_link" class="' + (handy ? 'gross' : '') + '"'
      + (handy ? ' style="margin-top:9px"' : '') + ' data-t="sv_einrichtungslink"></button>'
      + '<button type="button" id="pp_sv_weg" class="' + (handy ? 'gross' : '') + '"'
      + (handy ? ' style="margin-top:9px"' : '') + ' data-t="sv_abmelden"></button>'
      + '</div>'
      + '<label class="haken" style="margin-top:12px"><input type="checkbox" id="pp_sv_teampin">'
      + '<span data-t="sv_team_pin"></span></label>'
      + '<p style="font-size:12.5px;color:var(--text-leise);margin-top:4px" data-t="sv_team_pin_hinweis"></p>';
    if (vor) vor.parentNode.insertBefore(k, vor);
    else seite.appendChild(k);
    if (window.T) T.anwenden(k);

    k.querySelector('#pp_sv_jetzt').onclick = function () {
      var vorher = C.status;
      (C.offen ? hochladen() : abgleichen()).then(function () {
        if (C.status === 'verbunden' && !C.offen) melde(tt('sv_abgeglichen'), 'gut');
        else if (C.status === 'offline') melde(tt('sv_kein_netz'), 'warn');
        return vorher;
      });
    };
    k.querySelector('#pp_sv_link').onclick = function () {
      var b = Kern.appBasis();
      var k2 = encodeURIComponent(C.schluessel);
      UI.kopieren(b + 'pc.html#betrieb=' + k2 + '\n' + b + 'handy.html#betrieb=' + k2).then(function () {
        melde(tt('sv_link_kopiert'), 'warn');
      });
    };
    k.querySelector('#pp_sv_weg').onclick = function () {
      UI.frage(tt('sv_abmelden'), tt('sv_abmelden_frage') + (C.offen ? ' ' + tt('sv_abmelden_offen') : ''))
        .then(function (ja) {
          if (!ja) return;
          C.aus = true;
          clearTimeout(C.entprell);
          schluesselEntfernen();
          schreib('pp_server_gesichert', null);
          try { sessionStorage.removeItem('pp_chef'); } catch (e) { /* egal */ }
          Kern.ablageLoeschen().then(function () { location.replace(location.pathname); });
        });
    };
    var haken = k.querySelector('#pp_sv_teampin');
    haken.checked = Kern.einst('team_pin_verlangen') === '1';
    haken.onchange = function () {
      Kern.einstSetzen({ team_pin_verlangen: haken.checked ? '1' : '0' });
      melde(tt('gespeichert'), 'gut');
    };
    Kern.beiAenderung(function (grund) {
      if (grund === 'server') haken.checked = Kern.einst('team_pin_verlangen') === '1';
    });
    chefStatus();
  }

  function chefStart() {
    Kern.nachSichern(chefGeaendert);
    Kern.beiAenderung(function (grund) { if (grund !== 'server') C.nutzer = true; });
    return chefVerbinden().then(function () {
      abschnittBauen();
      setInterval(function () { if (C.offen) hochladen(); else abgleichen(); }, 20000);
      function gleichFragen() {
        if (document.visibilityState === 'hidden') return;
        if (Date.now() - C.zuletztGefragt < 2000) return;
        abgleichen();
      }
      window.addEventListener('focus', gleichFragen);
      document.addEventListener('visibilitychange', gleichFragen);
      window.addEventListener('online', function () { if (C.offen) hochladen(); else abgleichen(); });
      window.addEventListener('offline', function () { chefStatus('offline'); });
      new MutationObserver(wartendePruefen).observe(document.body, { childList: true });
      /* Kopf erscheint erst nach der PIN – dann Punkt zeichnen. */
      new MutationObserver(function () { if (!document.getElementById('pp_server_punkt')) chefStatus(); })
        .observe(document.getElementById('haupt') || document.body, { attributes: true, attributeFilter: ['style'] });
      chefStatus();
    });
  }

  /* =========================================================================
     Mitarbeiter
     ========================================================================= */

  var TM = {
    code: '', ich: null, version: 0,
    schlange: [], lokal: {}, idMap: {},
    spiegel: null, laeuft: false, letzte: null, wartend: null, zugangWeg: false,
    status: 'offline', zuletztGefragt: 0, gestartet: false
  };

  function teamKopf() { return { 'X-PP-Zugang': TM.code }; }

  function teamMerken() {
    schreib('pp_team_schlange', JSON.stringify({
      code: TM.code, schlange: TM.schlange.map(function (a) {
        var b = Object.assign({}, a);
        delete b.unterwegs;
        return b;
      }), lokal: TM.lokal, idMap: TM.idMap, version: TM.version
    }));
  }

  function teamLaden() {
    var s = null;
    try { s = JSON.parse(lies('pp_team_schlange') || 'null'); } catch (e) { s = null; }
    if (!s || s.code !== TM.code) return;
    TM.schlange = Array.isArray(s.schlange) ? s.schlange : [];
    TM.lokal = s.lokal || {};
    TM.idMap = s.idMap || {};
    TM.version = Number(s.version) || 0;
  }

  function teamStatus(art) {
    if (art) TM.status = art;
    var n = TM.schlange.length;
    var kurz = n ? tt('tv_wird_uebertragen') + (n > 1 ? ' (' + n + ')' : '') : (TM.status === 'offline' ? tt('tv_offline') : '');
    var text = TM.status === 'fehler' ? tt('sv_fehler_kurz')
      : (n ? tt('tv_wird_uebertragen') : (TM.status === 'offline' ? tt('sv_offline') : tt('sv_verbunden')));
    punktSetzen(TM.status === 'verbunden' && n ? 'senden' : TM.status, text, kurz);
  }

  function auswahl(o, felder) {
    var aus = {};
    felder.forEach(function (f) { if (o[f] !== undefined) aus[f] = o[f]; });
    return aus;
  }

  function schnappschuss() {
    var D = Kern.daten();
    var s = { zeit: {}, wunsch: {}, ma: null };
    (D.zeit || []).forEach(function (z) {
      if (gleich(z.mitarbeiter_id, TM.ich)) s.zeit[z.id] = auswahl(z, ZEIT_FELDER);
    });
    (D.wunsch || []).forEach(function (w) {
      if (gleich(w.mitarbeiter_id, TM.ich)) s.wunsch[w.id] = auswahl(w, WUNSCH_FELDER);
    });
    var m = (D.mitarbeiter || []).find(function (x) { return gleich(x.id, TM.ich); });
    if (m) s.ma = { sprache: m.sprache || '', pin: String(m.pin === undefined ? '' : m.pin) };
    return s;
  }

  function unterschied(a, b, felder) {
    var d = null;
    felder.forEach(function (f) {
      if (JSON.stringify(a[f]) !== JSON.stringify(b[f])) { d = d || {}; d[f] = b[f] === undefined ? '' : b[f]; }
    });
    return d;
  }

  /* Nach jedem Speichern im Kern: Was hat sich am eigenen Stand geändert? → Aktionen. */
  function teamGeaendert() {
    if (!TM.spiegel || TM.zugangWeg) return;
    var neu = schnappschuss(), alt = TM.spiegel, aktionen = [];
    [['zeit', ZEIT_FELDER], ['wunsch', WUNSCH_FELDER]].forEach(function (p) {
      var tab = p[0], felder = p[1];
      Object.keys(neu[tab]).forEach(function (id) {
        if (!alt[tab][id]) {
          aktionen.push({ art: tab + '_setzen', tab: tab, id: id, neu: true, eintrag: neu[tab][id] });
          return;
        }
        var d = unterschied(alt[tab][id], neu[tab][id], felder);
        if (d) aktionen.push({ art: tab + '_setzen', tab: tab, id: id, eintrag: d });
      });
      if (tab === 'wunsch') {
        Object.keys(alt.wunsch).forEach(function (id) {
          if (!neu.wunsch[id]) aktionen.push({ art: 'wunsch_loeschen', tab: 'wunsch', id: id, eintrag: {} });
        });
      }
    });
    if (alt.ma && neu.ma) {
      var d = unterschied(alt.ma, neu.ma, ['sprache', 'pin']);
      if (d) aktionen.push({ art: 'ich_setzen', tab: 'ma', id: '', eintrag: d });
    }
    TM.spiegel = neu;
    if (!aktionen.length) return;
    aktionen.forEach(einreihen);
    teamMerken();
    teamStatus();
    senden();
  }

  function einreihen(a) {
    a.zeit = new Date().toISOString();
    var schluessel = a.tab + ':' + a.id;
    if (!a.neu && TM.lokal[schluessel]) {
      /* Bezieht sich auf einen hier neu angelegten Eintrag, der noch nicht raus ist? Zusammenlegen. */
      var neuer = TM.schlange.find(function (x) {
        return x.neu && !x.unterwegs && x.tab === a.tab && String(x.id) === String(a.id);
      });
      if (neuer) {
        if (a.art === 'wunsch_loeschen') {
          TM.schlange = TM.schlange.filter(function (x) { return x !== neuer; });
          delete TM.lokal[schluessel];
        } else {
          Object.assign(neuer.eintrag, a.eintrag);
        }
        return;
      }
      a.verweis = schluessel;
    }
    if (a.neu) TM.lokal[schluessel] = true;
    TM.schlange.push(a);
  }

  var ABGELEHNT = {
    gesperrt: 'tv_schon_bearbeitet', nicht_erlaubt: 'tv_nicht_erlaubt', nicht_gefunden: 'tv_nicht_mehr_da'
  };

  function senden() {
    if (TM.laeuft || TM.zugangWeg) return Promise.resolve();
    if (!TM.schlange.length) return Promise.resolve();
    if (!netzDa()) { teamStatus('offline'); return Promise.resolve(); }
    TM.laeuft = true;
    var a = TM.schlange[0];
    a.unterwegs = true;
    var eintrag = Object.assign({}, a.eintrag || {});
    if (a.art !== 'ich_setzen' && !a.neu) {
      var id = a.verweis && TM.idMap[a.verweis] !== undefined ? TM.idMap[a.verweis] : a.id;
      eintrag.id = Number(id);
    }
    teamStatus();
    return anfrage('POST', '/team/aktion', teamKopf(), { art: a.art, eintrag: eintrag }).then(function (r) {
      TM.laeuft = false;
      a.unterwegs = false;
      if (r.status === 200 && r.j.ok) {
        if (a.neu) TM.idMap[a.tab + ':' + a.id] = r.j.id;
        TM.schlange.shift();
        TM.letzte = r.j;
        TM.version = Number(r.j.version) || TM.version;
      } else if (r.status === 401 || (r.status === 403 && /zugang/.test(r.j.code || ''))) {
        zugangUngueltig();
        return;
      } else if (r.status === 0 || r.status === 429 || r.status >= 500) {
        teamStatus(r.status === 0 ? 'offline' : 'fehler');
        teamMerken();
        return;
      } else {
        /* Vom Server abgelehnt (z. B. Chef hat den Eintrag schon bearbeitet). */
        TM.schlange.shift();
        melde(tt(ABGELEHNT[r.j.code] || 'tv_abgelehnt'), 'warn');
      }
      teamMerken();
      if (TM.schlange.length) return senden();
      return teamFertig();
    });
  }

  /* Schlange leer: Stand des Servers übernehmen, Zuordnungen vergessen. */
  function teamFertig() {
    TM.lokal = {};
    TM.idMap = {};
    var l = TM.letzte;
    TM.letzte = null;
    teamMerken();
    if (l && l.daten) { teamStand(l.daten, l.version); return Promise.resolve(); }
    return teamHolen();
  }

  function teamStand(daten, version) {
    if (fensterOffen()) { TM.wartend = { daten: daten, version: version }; teamStatus('verbunden'); return; }
    TM.wartend = null;
    TM.version = Number(version) || 0;
    Kern.uebernehmen(daten);
    TM.spiegel = schnappschuss();
    teamMerken();
    teamStatus('verbunden');
  }

  function teamWartendePruefen() {
    if (!TM.wartend || fensterOffen()) return;
    if (TM.schlange.length || TM.laeuft) { TM.wartend = null; return; }
    var w = TM.wartend;
    TM.wartend = null;
    teamStand(w.daten, w.version);
  }

  function teamHolen() {
    if (TM.zugangWeg) return Promise.resolve();
    if (TM.schlange.length || TM.laeuft) return senden();
    if (!netzDa()) { teamStatus('offline'); return Promise.resolve(); }
    TM.zuletztGefragt = Date.now();
    return anfrage('GET', '/team', teamKopf()).then(function (r) {
      if (r.status === 200 && r.j.ok) {
        if (TM.schlange.length || TM.laeuft) return;
        TM.ich = r.j.ich;
        teamStand(r.j.daten, r.j.version);
        return;
      }
      if (r.status === 401 || r.status === 403) { zugangUngueltig(); return; }
      teamStatus(r.status === 429 ? 'fehler' : 'offline');
    });
  }

  function zugangUngueltig() {
    TM.zugangWeg = true;
    TM.laeuft = false;
    teamStatus('fehler');
    melde(tt('tv_link_ungueltig'), 'fehler');
  }

  /* Start der Mitarbeiter-App. Liefert {ok:true} oder {ok:false, grund:'link'|'netz'|'gesperrt'}. */
  function teamStart(code) {
    TM.code = String(code || '').trim();
    teamLaden();
    var D = Kern.daten();
    var imGeraet = (D.mitarbeiter || []).find(function (m) { return m.zugangscode === TM.code; });

    function offlineWeiter() {
      if (!imGeraet) return { ok: false, grund: 'netz' };
      TM.ich = imGeraet.id;
      TM.spiegel = schnappschuss();
      laufenLassen();
      teamStatus('offline');
      return { ok: true };
    }

    if (!netzDa()) return Promise.resolve(offlineWeiter());

    if (TM.schlange.length && imGeraet) {
      /* Ungesendetes von früher zuerst übertragen. */
      TM.ich = imGeraet.id;
      TM.spiegel = schnappschuss();
      laufenLassen();
      return senden().then(function () {
        if (TM.zugangWeg) return { ok: false, grund: 'link' };
        return { ok: true };
      });
    }

    return anfrage('GET', '/team', teamKopf()).then(function (r) {
      if (r.status === 200 && r.j.ok) {
        TM.ich = r.j.ich;
        TM.schlange = [];
        TM.version = Number(r.j.version) || 0;
        Kern.uebernehmen(r.j.daten);
        TM.spiegel = schnappschuss();
        teamMerken();
        laufenLassen();
        teamStatus('verbunden');
        return { ok: true };
      }
      if (r.status === 401 || r.status === 403) return { ok: false, grund: 'link' };
      if (r.status === 429) return { ok: false, grund: 'gesperrt' };
      return offlineWeiter();
    });
  }

  function laufenLassen() {
    if (TM.gestartet) return;
    TM.gestartet = true;
    Kern.nachSichern(teamGeaendert);
    setInterval(teamHolen, 30000);
    setInterval(function () { if (TM.schlange.length) senden(); }, 20000);
    function gleichFragen() {
      if (document.visibilityState === 'hidden') return;
      if (Date.now() - TM.zuletztGefragt < 2000) return;
      teamHolen();
    }
    window.addEventListener('focus', gleichFragen);
    document.addEventListener('visibilitychange', gleichFragen);
    window.addEventListener('online', function () { teamStatus('verbunden'); teamHolen(); });
    window.addEventListener('offline', function () { teamStatus('offline'); });
    new MutationObserver(teamWartendePruefen).observe(document.body, { childList: true });
    new MutationObserver(function () { if (!document.getElementById('pp_server_punkt')) teamStatus(); })
      .observe(document.getElementById('haupt') || document.body, { attributes: true, attributeFilter: ['style'] });
  }

  /* =========================================================================
     Start
     ========================================================================= */

  /* Chef-Seiten am Server: die App startet erst, wenn der Stand vom Server da ist
     (oder klar ist, dass ohne Netz mit dem Gerätestand weitergearbeitet wird). */
  if (SERVER && SEITE === 'chef' && window.Kern) {
    var kernBereit = Kern.bereit;
    Kern.bereit = Promise.all([kernBereit, domFertig]).then(chefStart).catch(function () { return null; });
  }

  return {
    server: function () { return SERVER; },
    teamStart: teamStart,
    jetztAbgleichen: function () { return SEITE === 'team' ? teamHolen() : (C.offen ? hochladen() : abgleichen()); },
    zweisprachig: zweisprachig,
    zustand: function () {
      return SEITE === 'team'
        ? { seite: 'team', version: TM.version, schlange: TM.schlange.length, status: TM.status }
        : { seite: 'chef', version: C.version, offen: C.offen, status: C.status, gesichert: C.gesichert };
    }
  };
})();

window.Verbindung = Verbindung;
