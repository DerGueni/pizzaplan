/* PizzaPlan · Handy-Fassung (iPhone)
   ----------------------------------------------------------------------------
   Dieselben Daten wie am PC, aber für den Daumen gebaut: Fußleiste unten,
   ein Tag auf einmal, Wischen von Tag zu Tag, große Flächen.
*/
var Handy = (function () {
  'use strict';

  var plTag = Kern.heute();
  var zeitTage = 7;
  var ztTag = Kern.heute();
  var wunschStatus = 'offen';
  var wochenAnsicht = 'tag';
  var wochenVersatz = 0;

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
    zurueckEinrichten();
    T.anwenden();
    spracheKnopf();
    alleZeichnen();
    setInterval(function () { Masken.erinnerungen(alleZeichnen); }, 40000);
    setTimeout(function () { Masken.erinnerungen(alleZeichnen); }, 3000);
  }

  /* =========================================================================
     Zurück-Taste des Handys
     Erst das oberste offene Fenster schließen, dann eine Seite zurück,
     auf der Startseite bleibt die App stehen.
     ========================================================================= */

  function zurueckPuffer() {
    try { history.pushState({ pp: 1 }, ''); } catch (e) { /* egal */ }
  }

  function zurueckSchritt() {
    var fenster = document.querySelectorAll('.hintergrund');
    if (fenster.length) {
      var oben = fenster[fenster.length - 1];
      var x = oben.querySelector('[data-x]');
      if (x) x.click(); else oben.remove();
      return;
    }
    if ($('menueblende') && $('menueblende').style.display !== 'none') {
      menueZeigen(false);
      return;
    }
    var an = document.querySelector('.seite.an');
    if (an && an.id !== 's_heute') seiteZeigen('heute');
  }

  function zurueckEinrichten() {
    zurueckPuffer();
    window.addEventListener('popstate', function () {
      zurueckPuffer();
      zurueckSchritt();
    });
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
    spaltenlisteZeichnen();
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
      /* Die Schieberegler tragen ihre Beschriftung im Text, deshalb neu bauen. */
      $('es_regler').dataset.gebaut = '';
      alleZeichnen();
    };
    $('knopf_mikro').onclick = function () { Masken.befehl($('knopf_mikro'), alleZeichnen); };

    $('knopf_menue').onclick = function () { menueZeigen(true); };
    $('menueblende').onclick = function (e) { if (e.target === $('menueblende')) menueZeigen(false); };

    $('h_wo_zurueck').onclick = function () { wochenVersatz -= 1; wocheZeichnen(); };
    $('h_wo_vor').onclick = function () { wochenVersatz += 1; wocheZeichnen(); };

    /* Woche: nach Tag oder nach Person */
    $('h_ansicht').querySelectorAll('button').forEach(function (b) {
      b.onclick = function () {
        wochenAnsicht = b.getAttribute('data-ansicht');
        $('h_ansicht').querySelectorAll('button').forEach(function (x) {
          x.classList.toggle('an', x === b);
        });
        heuteZeichnen();
      };
    });

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
    $('zt_zurueck').onclick = function () { ztTag = Kern.plusTage(ztTag, -1); zeitstrahlZeichnen(); };
    $('zt_vor').onclick = function () { ztTag = Kern.plusTage(ztTag, 1); zeitstrahlZeichnen(); };
    $('zt_heute').onclick = function () { ztTag = Kern.heute(); zeitstrahlZeichnen(); };
    UI.wischen($('s_zeiten'),
      function () { ztTag = Kern.plusTage(ztTag, 1); zeitstrahlZeichnen(); },
      function () { ztTag = Kern.plusTage(ztTag, -1); zeitstrahlZeichnen(); });

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
      if (/\.(xlsx?|ods|numbers)$/i.test(d.name)) {
        UI.melde(T.t('nur_csv'), 'warn');
        $('ei_dateifeld').value = '';
        return;
      }
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

  function kurzName(name) {
    var teile = String(name || '').trim().split(/\s+/);
    if (teile.length < 2) return teile[0] || '?';
    return teile[0] + ' ' + teile[teile.length - 1].charAt(0) + '.';
  }

  function wochenSchichten(u) {
    return Kern.schichten(u.woche_von, u.woche_bis, false, null);
  }

  /* Welche Woche wird gerade gezeigt? 0 = die laufende. */
  function gezeigteWoche() {
    var mo = Kern.plusTage(Kern.wochenstart(Kern.heute()), 7 * wochenVersatz);
    return { von: mo, bis: Kern.plusTage(mo, 6) };
  }

  function lohnSumme(rows) {
    var summe = 0;
    rows.forEach(function (s) {
      if (!s.mitarbeiter_id) return;
      var m = Kern.ma(s.mitarbeiter_id);
      summe += (s.dauer_std || 0) * Number((m && m.stundenlohn) || 0);
    });
    return Math.round(summe * 100) / 100;
  }

  /* --- Kopfzeile: welcher Tag ist heute, was steht an? --------------------- */
  function tageskopfZeichnen(u) {
    var h = Kern.heute();
    var std = u.heute.reduce(function (s, r) { return s + (r.dauer_std || 0); }, 0);
    $('h_datum').textContent = Kern.WT_LANG[T.aktuell()][Kern.wochentag(h)] + ', ' + Kern.dmy(h);
    $('h_lage').textContent = u.heute.length
      ? u.heute.length + ' ' + T.t(u.heute.length === 1 ? 'schicht_wort' : 'schichten_wort')
        + ' · ' + UI.zahl(std, 1) + ' ' + T.t('stunden')
      : T.t('heute_nichts');
  }

  /* --- Ganz oben steht, was der Chef entscheiden muss ---------------------- */
  function todoZeichnen(u) {
    var punkte = [];
    if (u.unbesetzt) punkte.push(['unbesetzt', u.unbesetzt, T.t('todo_unbesetzt'), 'rot']);
    if (u.nicht_freigegeben) punkte.push(['entwurf', u.nicht_freigegeben, T.t('todo_entwurf'), 'warn']);
    if (u.offene_wuensche) punkte.push(['wuensche', u.offene_wuensche, T.t('todo_wuensche'), 'warn']);
    if (u.offene_zeiten) punkte.push(['zeiten', u.offene_zeiten, T.t('todo_zeiten'), 'warn']);

    if (!punkte.length) {
      $('h_todo').innerHTML = '<div class="karte fertig">✓ '
        + UI.sicher(T.t('alles_erledigt')) + '</div>';
      return;
    }
    $('h_todo').innerHTML = '<div class="karte todo">'
      + '<div class="todokopf">' + UI.sicher(T.t('zu_erledigen')) + '</div>'
      + punkte.map(function (p) {
        return '<button type="button" class="todozeile" data-tun="' + p[0] + '">'
          + '<span class="zahl ' + p[3] + '">' + p[1] + '</span>'
          + '<span class="txt">' + UI.sicher(p[2]) + '</span>'
          + '<span class="pfeil">›</span></button>';
      }).join('') + '</div>';

    $('h_todo').querySelectorAll('[data-tun]').forEach(function (b) {
      b.onclick = function () {
        UI.tippen(b);
        var was = b.getAttribute('data-tun');
        if (was === 'unbesetzt') { seiteZeigen('plan'); planZeichnen(); }
        if (was === 'entwurf') wocheFreigeben();
        if (was === 'wuensche') { seiteZeigen('mehr'); teilZeigen('wuensche'); }
        if (was === 'zeiten') seiteZeigen('zeiten');
      };
    });
  }

  /* --- Diese Woche: wer hat wann Dienst? ---------------------------------- */
  function wocheZeichnen() {
    var w = gezeigteWoche();
    var rows = Kern.schichten(w.von, w.bis, false, null);
    var std = rows.reduce(function (s, r) { return s + (r.dauer_std || 0); }, 0);

    $('h_wochentitel').textContent = wochenVersatz === 0 ? T.t('diese_woche')
      : (wochenVersatz === 1 ? T.t('naechste_woche')
        : (wochenVersatz === -1 ? T.t('vorwoche') : Kern.dm(w.von) + '–' + Kern.dm(w.bis)));
    $('h_wochenkopf').innerHTML = '<b>' + Kern.dm(w.von) + '–' + Kern.dm(w.bis)
      + '</b><span>' + rows.length + ' ' + UI.sicher(T.t('schichten_wort'))
      + ' · ' + UI.zahl(std, 1) + ' ' + UI.sicher(T.t('stunden')) + '</span>';

    if (!rows.length) { $('h_woche').innerHTML = UI.leer(T.t('woche_nichts')); return; }
    if (wochenAnsicht === 'person') wochePersonen(w, rows); else wocheTage(w, rows);
  }

  function wocheTage(w, rows) {
    var h = Kern.heute();
    $('h_woche').innerHTML = Kern.tageZwischen(w.von, w.bis).map(function (d) {
      var tag = rows.filter(function (r) { return r.datum === d; });
      var std = tag.reduce(function (s, r) { return s + (r.dauer_std || 0); }, 0);
      var chips = tag.length ? tag.map(function (r) {
        return '<span class="wchip' + (r.mitarbeiter_id ? '' : ' offen')
          + (r.veroeffentlicht ? '' : ' entwurf') + '">'
          + '<i style="background:' + (r.mitarbeiter_id ? r.farbe : 'var(--linie-stark)') + '"></i>'
          + '<b>' + r.von + '–' + r.bis + '</b> '
          + UI.sicher(r.mitarbeiter_id ? kurzName(r.ma_name) : T.t('offen_bez')) + '</span>';
      }).join('') : '<span class="wfrei">' + UI.sicher(T.t('tag_frei')) + '</span>';

      return '<button type="button" class="wtag' + (d === h ? ' heute' : '')
        + '" data-tag="' + d + '">'
        + '<div class="wdatum"><b>' + UI.sicher(Kern.WT_KURZ[T.aktuell()][Kern.wochentag(d)])
        + '</b><span>' + Kern.dm(d) + '</span></div>'
        + '<div class="wschichten">' + chips + '</div>'
        + '<div class="wsum">' + (tag.length ? UI.zahl(std, 1) + ' h' : '') + '</div></button>';
    }).join('');

    $('h_woche').querySelectorAll('[data-tag]').forEach(function (b) {
      b.onclick = function () {
        UI.tippen(b);
        plTag = b.getAttribute('data-tag');
        seiteZeigen('plan');
        planZeichnen();
      };
    });
  }

  function wochePersonen(w, rows) {
    var h = '';
    var offen = rows.filter(function (r) { return !r.mitarbeiter_id; });
    if (offen.length) {
      h += '<div class="wperson">'
        + '<div class="wpinhalt"><b>' + UI.sicher(T.t('offen_bez')) + '</b>'
        + '<span>' + offen.length + ' ' + UI.sicher(T.t('schichten_wort')) + '</span>'
        + '<div class="wchips">' + offen.map(function (r) {
          return '<span class="wchip offen"><b>'
            + UI.sicher(Kern.WT_KURZ[T.aktuell()][Kern.wochentag(r.datum)]) + '</b> '
            + r.von + '–' + r.bis + '</span>';
        }).join('') + '</div></div></div>';
    }

    /* Wer arbeitet, steht oben – die meisten Stunden zuerst. */
    var leute = Kern.maListe(false).map(function (m) {
      var meine = rows.filter(function (r) { return Number(r.mitarbeiter_id) === Number(m.id); });
      return {
        m: m, meine: meine,
        std: meine.reduce(function (s, r) { return s + (r.dauer_std || 0); }, 0)
      };
    }).sort(function (a, b) { return b.std - a.std; });

    leute.forEach(function (e) {
      var m = e.m;
      var meine = e.meine;
      var std = e.std;
      h += '<div class="wperson' + (meine.length ? '' : ' ruht') + '" data-ma="' + m.id
        + '" style="border-left:4px solid ' + (m.farbe || '#7f8c8d') + '">'
        + '<div class="wpinhalt"><b>' + UI.sicher(m.name) + '</b>'
        + '<span>' + UI.sicher(m.rolle || '')
        + (meine.length ? ' · ' + UI.zahl(std, 1) + ' ' + UI.sicher(T.t('stunden')) : '')
        + '</span>'
        + (meine.length
          ? '<div class="wchips">' + meine.map(function (r) {
            return '<span class="wchip' + (r.veroeffentlicht ? '' : ' entwurf') + '"><b>'
              + UI.sicher(Kern.WT_KURZ[T.aktuell()][Kern.wochentag(r.datum)]) + '</b> '
              + r.von + '–' + r.bis + '</span>';
          }).join('') + '</div>'
          : '<div class="wchips"><span class="wfrei">' + UI.sicher(T.t('woche_frei'))
            + '</span></div>')
        + '</div></div>';
    });
    $('h_woche').innerHTML = h;
    $('h_woche').querySelectorAll('[data-ma]').forEach(function (z) {
      z.onclick = function () {
        Masken.mitarbeiter(Number(z.getAttribute('data-ma')), alleZeichnen);
      };
    });
  }

  /* --- Vier Zahlen, die der Chef wirklich braucht -------------------------- */
  function kachelnZeichnen(u) {
    var rows = wochenSchichten(u);
    $('h_kacheln').innerHTML = [
      [T.t('kachel_woche'), UI.zahl(u.wochenstunden, 1), 'gut', 'plan'],
      [T.t('kachel_unbesetzt'), u.unbesetzt, u.unbesetzt ? 'rot' : 'gut', 'plan'],
      [T.t('kachel_kosten'), UI.euro(lohnSumme(rows)), '', 'mehr'],
      [T.t('kachel_team'), u.team_aktiv, '', 'team']
    ].map(function (k) {
      return '<div class="kachel ' + k[2] + '" data-ziel="' + k[3] + '">'
        + '<div class="wert">' + UI.sicher(k[1]) + '</div>'
        + '<div class="bez">' + UI.sicher(k[0]) + '</div></div>';
    }).join('');
    $('h_kacheln').querySelectorAll('.kachel').forEach(function (k) {
      k.onclick = function () {
        var ziel = k.getAttribute('data-ziel');
        seiteZeigen(ziel);
        if (ziel === 'mehr') teilZeigen('auswertung');
      };
    });
  }

  function heuteZeichnen() {
    var u = Kern.uebersicht();
    tageskopfZeichnen(u);
    todoZeichnen(u);

    $('h_jetzt_block').style.display = u.eingestempelt.length ? '' : 'none';
    $('h_stempel').innerHTML = u.eingestempelt.map(function (z) {
      return '<div class="zeile" style="border-left-color:var(--gruen)">'
        + '<div class="haupttext"><b>' + UI.sicher(z.ma_name) + '</b>'
        + '<span>seit ' + UI.sicher(z.start) + ' Uhr</span></div>'
        + '<div class="rechts">' + UI.etikett(T.t('laeuft'), 'laeuft') + '</div></div>';
    }).join('');

    $('h_heute').innerHTML = u.heute.length ? u.heute.map(function (s) {
      return '<div class="zeile schichtzeile' + (s.veroeffentlicht ? '' : ' entwurf')
        + '" data-schicht="' + s.id + '" style="border-left-color:'
        + (s.mitarbeiter_id ? s.farbe : 'var(--linie-stark)') + '">'
        + '<div class="uhrzeit"><b>' + s.von + '</b><span>' + s.bis + '</span></div>'
        + '<div class="haupttext"><b>'
        + UI.sicher(s.mitarbeiter_id ? s.ma_name : T.t('offen_bez')) + '</b>'
        + '<span>' + UI.sicher(s.position) + ' · ' + UI.zahl(s.dauer_std, 1) + ' '
        + UI.sicher(T.t('stunden')) + '</span></div>'
        + '</div>';
    }).join('') : UI.leer(T.t('heute_niemand'));
    $('h_heute').querySelectorAll('[data-schicht]').forEach(function (z) {
      z.onclick = function () {
        Masken.schicht(Number(z.getAttribute('data-schicht')), null, null, alleZeichnen);
      };
    });

    wocheZeichnen();
    kachelnZeichnen(u);

    $('h_termine').innerHTML = u.termine.length ? u.termine.slice(0, 4).map(function (t) {
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

  /* =========================================================================
     Menü hinter dem Symbol oben rechts
     ========================================================================= */

  var MENUE = [
    ['plan', '📅', 'dienstplan'],
    ['team', '👥', 'team'],
    ['zeiten', '⏱', 'zeiten'],
    ['wuensche', '✋', 'wuensche'],
    ['termine', '📌', 'termine'],
    ['auswertung', '📊', 'auswertung'],
    ['versand', '📤', 'versand'],
    ['einlesen', '📥', 'einlesen'],
    ['einstellungen', '⚙', 'einstellungen']
  ];

  function menueZeigen(an) {
    var blende = $('menueblende');
    if (!an) { blende.style.display = 'none'; return; }

    var u = Kern.uebersicht();
    var zahlen = { wuensche: u.offene_wuensche, zeiten: u.offene_zeiten, plan: u.unbesetzt };
    $('menueliste').innerHTML = MENUE.map(function (m) {
      var n = zahlen[m[0]] || 0;
      return '<button type="button" data-menue="' + m[0] + '">'
        + '<span class="bild">' + m[1] + '</span>'
        + '<span class="txt">' + UI.sicher(T.t(m[2])) + '</span>'
        + (n ? '<span class="zahl">' + n + '</span>' : '')
        + '<span class="pfeil">›</span></button>';
    }).join('')
      + '<button type="button" class="abmelde" data-menue="abmelden">'
      + '<span class="bild">🚪</span><span class="txt">'
      + UI.sicher(T.t('abmelden')) + '</span></button>';

    $('menueliste').querySelectorAll('[data-menue]').forEach(function (b) {
      b.onclick = function () {
        var was = b.getAttribute('data-menue');
        menueZeigen(false);
        if (was === 'abmelden') {
          try { sessionStorage.removeItem('pp_chef'); } catch (e) { /* egal */ }
          location.reload();
          return;
        }
        if (was === 'plan' || was === 'team' || was === 'zeiten') { seiteZeigen(was); return; }
        seiteZeigen('mehr');
        teilZeigen(was);
      };
    });
    blende.style.display = '';
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
      $('pl_liste').innerHTML = UI.leer(T.t('kein_plan_tag'));
    } else {
      $('pl_liste').innerHTML = rows.map(function (s) {
        var warn = Kern.konflikte(s, s.id);
        return '<div class="zeile' + (s.veroeffentlicht ? '' : ' entwurf')
          + '" data-schicht="' + s.id + '" style="border-left-color:'
          + Masken.farbeFuerPosition(s.position, s.farbe) + '">'
          + '<div class="haupttext"><b>' + UI.sicher(s.ma_name || T.t('offen_bez')) + '</b>'
          + '<span>' + UI.sicher(s.position) + ' · ' + UI.zahl(s.dauer_std, 1) + ' h'
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
        + '<div class="haupttext"><b>' + UI.sicher(m.name) + '</b><span>'
        + UI.sicher(m.rolle || '') + (m.vertrag ? ' · ' + UI.sicher(m.vertrag) : '')
        + (m.telefon ? ' · ' + UI.sicher(m.telefon) : '') + '</span></div>'
        + '<div class="rechts">' + (m.stundenlohn ? UI.euro(m.stundenlohn) : '') + '</div></div>';
    }).join('') : UI.leer(T.t('niemand_gefunden'));
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

  /* --- Ein Tag als Zeitstrahl: alle Mitarbeiter untereinander -------------- */
  function zeitstrahlZeichnen() {
    var tag = ztTag;
    var zeiten = Kern.zeiten(tag, tag, null);
    var schichten = Kern.schichten(tag, tag, false, null);
    var heute = Kern.heute();

    $('zt_datum').textContent = Kern.WT_KURZ[T.aktuell()][Kern.wochentag(tag)] + ' '
      + Kern.dmy(tag);

    var leute = {};
    function hol(id, name, farbe) {
      if (!leute[id]) {
        leute[id] = { id: id, name: kurzName(name), farbe: farbe, stuecke: [], std: 0, offen: 0 };
      }
      return leute[id];
    }

    schichten.forEach(function (s) {
      if (!s.mitarbeiter_id) return;
      var e = hol(s.mitarbeiter_id, s.ma_name, s.farbe);
      var a = Kern.minuten(s.von), b = Kern.minuten(s.bis);
      if (b <= a) b = 1440;
      e.stuecke.push({ von: a, bis: b, art: 'geplant', text: s.von + '–' + s.bis });
    });

    zeiten.forEach(function (z) {
      var m = Kern.ma(z.mitarbeiter_id) || {};
      var e = hol(z.mitarbeiter_id, z.ma_name, m.farbe);
      var a = Kern.minuten(z.start);
      var b = z.ende ? Kern.minuten(z.ende) : Kern.minuten(Kern.jetztZeit());
      if (b <= a) b = 1440;
      e.stuecke.push({
        von: a, bis: b, art: z.ende ? 'erfasst' : 'laeuft',
        text: z.start + (z.ende ? '–' + z.ende : ' …')
      });
      e.std += z.dauer_std;
      if (z.ende && !z.freigegeben) e.offen++;
    });

    var zeilen = Object.keys(leute).map(function (k) { return leute[k]; })
      .sort(function (a, b) { return b.std - a.std || a.name.localeCompare(b.name); });

    if (!zeilen.length) {
      $('zt_strahl').innerHTML = UI.leer(T.t('tag_ohne_zeiten'));
      $('zt_tagsumme').innerHTML = '';
      return;
    }

    var von = 24 * 60, bis = 0;
    zeilen.forEach(function (z) {
      z.stuecke.forEach(function (s) {
        von = Math.min(von, s.von);
        bis = Math.max(bis, s.bis);
      });
      z.summe = z.std ? UI.zahl(z.std, 1) + ' h' : '';
    });
    von = Math.max(0, Math.floor(von / 60) * 60 - 30);
    bis = Math.min(1440, Math.ceil(bis / 60) * 60 + 30);
    if (bis - von < 300) bis = Math.min(1440, von + 300);

    $('zt_strahl').innerHTML = UI.zeitstrahl({
      von: von, bis: bis, zeilen: zeilen,
      jetzt: tag === heute ? Kern.minuten(Kern.jetztZeit()) : null
    }) + '<div class="legende"><span class="l geplant"></span>' + UI.sicher(T.t('geplant'))
      + '<span class="l erfasst"></span>' + UI.sicher(T.t('erfasst')) + '</div>';
    $('zt_strahl').querySelectorAll('[data-strahl]').forEach(function (z) {
      z.onclick = function () {
        UI.tippen(z);
        maZeitenFenster(Number(z.getAttribute('data-strahl')));
      };
    });

    var summeStd = zeilen.reduce(function (a, z) { return a + z.std; }, 0);
    var summeOffen = zeilen.reduce(function (a, z) { return a + z.offen; }, 0);
    var geplant = schichten.reduce(function (a, s) { return a + (s.dauer_std || 0); }, 0);
    $('zt_tagsumme').innerHTML = '<b>' + UI.zahl(summeStd, 1) + ' h</b> '
      + UI.sicher(T.t('erfasst')) + ' · ' + UI.zahl(geplant, 1) + ' h '
      + UI.sicher(T.t('geplant')) + (summeOffen
        ? ' · <b class="warnzahl">' + summeOffen + '</b> ' + UI.sicher(T.t('ungeprueft'))
        : ' · ✓');
  }

  /* --- Summen je Mitarbeiter über den gewählten Zeitraum ------------------- */
  function zeitenZeichnen() {
    zeitstrahlZeichnen();

    var von = Kern.plusTage(Kern.heute(), -zeitTage + 1);
    var rows = Kern.zeiten(von, Kern.heute(), null);
    var summe = rows.reduce(function (a, z) { return a + z.dauer_std; }, 0);
    var offen = rows.filter(function (z) { return z.ende && !z.freigegeben; }).length;
    $('ze_summe').innerHTML = '<b>' + UI.zahl(summe, 1) + ' ' + UI.sicher(T.t('stunden'))
      + '</b><span>' + zeitTage + ' ' + UI.sicher(T.t('tage_wort'))
      + (offen ? ' · ' + offen + ' ' + UI.sicher(T.t('ungeprueft')) : ' · ✓') + '</span>';

    var proMa = {};
    rows.forEach(function (z) {
      var k = String(z.mitarbeiter_id);
      if (!proMa[k]) proMa[k] = { id: z.mitarbeiter_id, name: z.ma_name, std: 0, n: 0, offen: 0, laeuft: 0 };
      proMa[k].std += z.dauer_std;
      proMa[k].n++;
      if (!z.ende) proMa[k].laeuft++;
      else if (!z.freigegeben) proMa[k].offen++;
    });
    var liste = Object.keys(proMa).map(function (k) { return proMa[k]; })
      .sort(function (a, b) { return b.std - a.std; });

    $('ze_liste').innerHTML = liste.length ? liste.map(function (e) {
      var m = Kern.ma(e.id) || {};
      return '<div class="zeile eng" data-maz="' + e.id + '" style="border-left-color:'
        + (m.farbe || 'var(--linie-stark)') + '">'
        + '<div class="haupttext"><b>' + UI.sicher(e.name) + '</b><span>'
        + UI.sicher(m.rolle || '') + ' · ' + e.n + ' ' + UI.sicher(T.t('eintraege'))
        + (e.laeuft ? ' · ' + UI.sicher(T.t('laeuft')) : '') + '</span></div>'
        + '<div class="rechts"><b class="wertgross">' + UI.zahl(e.std, 1) + ' h</b>'
        + (e.offen ? '<span class="warnzahl">' + e.offen + ' '
          + UI.sicher(T.t('offen')) + '</span>' : '<span>✓</span>') + '</div></div>';
    }).join('') : UI.leer(T.t('keine_zeiten'));

    $('ze_liste').querySelectorAll('[data-maz]').forEach(function (z) {
      z.onclick = function () {
        UI.tippen(z);
        maZeitenFenster(Number(z.getAttribute('data-maz')));
      };
    });
  }

  /* --- Detailansicht: alle Zeiten einer Person im Zeitraum ----------------- */
  function maZeitenFenster(maId) {
    var m = Kern.ma(maId);
    if (!m) return;
    var von = Kern.plusTage(Kern.heute(), -zeitTage + 1);
    var rows = Kern.zeiten(von, Kern.heute(), maId);
    var std = rows.reduce(function (a, z) { return a + z.dauer_std; }, 0);
    var offen = rows.filter(function (z) { return z.ende && !z.freigegeben; }).length;

    var h = '<div class="detailkopf"><b>' + UI.zahl(std, 1) + ' ' + UI.sicher(T.t('stunden'))
      + '</b><span>' + zeitTage + ' ' + UI.sicher(T.t('tage_wort')) + ' · '
      + rows.length + ' ' + UI.sicher(T.t('eintraege'))
      + (offen ? ' · ' + offen + ' ' + UI.sicher(T.t('ungeprueft')) : '') + '</span></div>';

    h += rows.length ? rows.map(function (z) {
      return '<div class="zeile eng" data-zeit="' + z.id + '" style="border-left-color:'
        + (z.ende ? (z.freigegeben ? 'var(--gruen)' : 'var(--gelb)') : 'var(--blau)') + '">'
        + '<div class="haupttext"><b>' + UI.tagKurz(z.datum) + ' · ' + z.start
        + (z.ende ? '–' + z.ende : ' …') + '</b><span>'
        + (z.pause_min ? z.pause_min + ' min ' + UI.sicher(T.t('pause_wort')) + ' · ' : '')
        + (z.ende ? (z.freigegeben ? '✓ ' + UI.sicher(T.t('geprueft'))
          : UI.sicher(T.t('offen'))) : UI.sicher(T.t('laeuft'))) + '</span></div>'
        + '<div class="rechts"><b class="wertgross">'
        + (z.ende ? UI.zahl(z.dauer_std, 1) + ' h' : '–') + '</b></div></div>';
    }).join('') : UI.leer(T.t('keine_zeiten'));

    UI.fenster({
      titel: m.name,
      inhalt: h,
      knoepfe: [
        { text: T.t('schliessen'), wert: null },
        { text: T.t('zeit_neu'), wert: 'neu' },
        { text: T.t('person_freigeben'), art: 'haupt', wert: 'frei' }
      ],
      beimOeffnen: function (hg) {
        hg.querySelectorAll('[data-zeit]').forEach(function (z) {
          z.onclick = function () {
            hg.querySelector('[data-x]').click();
            Masken.zeit(Number(z.getAttribute('data-zeit')), function () {
              alleZeichnen();
              maZeitenFenster(maId);
            });
          };
        });
      }
    }).then(function (w) {
      if (w === 'neu') {
        Masken.zeit(null, function () { alleZeichnen(); maZeitenFenster(maId); });
      }
      if (w === 'frei') {
        var n = Kern.zeitenFreigeben(von, Kern.heute(), maId);
        UI.melde(n ? n + ' ' + T.t('zeiten_freigegeben') : T.t('nichts_offen'), n ? 'gut' : 'warn');
        if (n) UI.rueckStreifen(n + ' ' + T.t('zeiten_freigegeben'), alleZeichnen);
        alleZeichnen();
      }
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
        + (z.offen ? ' · ' + z.offen + ' ' + T.t('ungeprueft') : '') + '</span>'
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
          + T.t(weg === 'whatsapp' ? 'keine_nummer' : 'keine_adresse') + '</small>' : '')
        + '</span></label>';
    }).join('');
  }

  /* =========================================================================
     Einlesen
     ========================================================================= */

  function spaltenlisteZeichnen() {
    var kopf = String(Kern.importVorlage()).split(/[\r\n]+/)[0]
      .replace(/^\ufeff/, '');
    $('ei_spalten').innerHTML = '<label>' + UI.sicher(T.t('spalten_verstanden')) + '</label>'
      + kopf.split(';').map(function (w) {
        return '<span class="wchip">' + UI.sicher(w) + '</span>';
      }).join('');
  }

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
