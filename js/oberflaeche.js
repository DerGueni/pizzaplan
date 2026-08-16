/* PizzaPlan · gemeinsame Bausteine der Oberfläche
   ----------------------------------------------------------------------------
   Meldungen, Fenster, Formulare, Formatierung, Schieberegler, Farbschema.
   Kein Wissen über Dienstpläne – nur Bedienung.
*/
var UI = (function () {
  'use strict';

  /* =========================================================================
     1 · Text und Zahlen
     ========================================================================= */

  function sicher(s) {
    return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function std(z) {
    return (Math.round((z || 0) * 100) / 100).toFixed(2).replace('.', ',') + ' h';
  }

  function euro(z) {
    return (Math.round((z || 0) * 100) / 100).toFixed(2).replace('.', ',') + ' €';
  }

  function zahl(z, stellen) {
    return Number(z || 0).toFixed(stellen === undefined ? 2 : stellen).replace('.', ',');
  }

  function tagLang(datum) {
    return Kern.WT_LANG[T.aktuell()][Kern.wochentag(datum)] + ', ' + Kern.dmy(datum);
  }

  function tagKurz(datum) {
    return Kern.WT_KURZ[T.aktuell()][Kern.wochentag(datum)] + ' ' + Kern.dm(datum);
  }

  function monatName(monat) {
    var namen = {
      de: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August',
        'September', 'Oktober', 'November', 'Dezember'],
      it: ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto',
        'Settembre', 'Ottobre', 'Novembre', 'Dicembre']
    };
    var j = monat.slice(0, 4), m = Number(monat.slice(5, 7));
    return namen[T.aktuell()][m - 1] + ' ' + j;
  }

  function anfangGross(s) {
    s = String(s || '');
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  /* =========================================================================
     2 · Meldungen
     ========================================================================= */

  function melde(text, art) {
    var box = document.querySelector('.melder');
    if (!box) {
      box = document.createElement('div');
      box.className = 'melder';
      document.body.appendChild(box);
    }
    var d = document.createElement('div');
    d.className = 'meldung ' + (art || '');
    d.textContent = text;
    box.appendChild(d);
    setTimeout(function () {
      d.style.opacity = '0';
      setTimeout(function () { d.remove(); }, 300);
    }, art === 'fehler' ? 7000 : 3600);
    return d;
  }

  function fehler(e) {
    melde(e && e.message ? e.message : String(e), 'fehler');
  }

  /* Rückgängig-Streifen: erscheint nach einer Änderung und verschwindet von selbst. */
  var rueckTimer = null;
  function rueckStreifen(was, nachher) {
    var alt = document.querySelector('.rueckstreifen');
    if (alt) alt.remove();
    clearTimeout(rueckTimer);
    var d = document.createElement('div');
    d.className = 'rueckstreifen';
    d.innerHTML = '<span></span><button type="button"></button>';
    d.querySelector('span').textContent = was;
    var b = d.querySelector('button');
    b.textContent = '↩ ' + T.t('rueckgaengig');
    b.onclick = function () {
      try {
        Kern.rueckgaengig();
        melde(T.t('rueckgaengig') + ' – ' + was, 'gut');
        if (nachher) nachher();
      } catch (e) { fehler(e); }
      d.remove();
    };
    document.body.appendChild(d);
    rueckTimer = setTimeout(function () {
      d.style.opacity = '0';
      setTimeout(function () { d.remove(); }, 300);
    }, 9000);
  }

  /* =========================================================================
     3 · Fenster
     ========================================================================= */

  function fenster(o) {
    return new Promise(function (fertig) {
      var hg = document.createElement('div');
      hg.className = 'hintergrund';
      hg.innerHTML = '<div class="fenster" style="max-width:' + (o.breite || 560) + 'px">'
        + '<div class="fkopf"><h2></h2><button type="button" class="still" data-x="1">✕</button></div>'
        + '<div class="frumpf"></div><div class="ffuss"></div></div>';
      hg.querySelector('h2').textContent = o.titel || '';
      var rumpf = hg.querySelector('.frumpf');
      if (typeof o.inhalt === 'string') rumpf.innerHTML = o.inhalt;
      else if (o.inhalt) rumpf.appendChild(o.inhalt);
      var fuss = hg.querySelector('.ffuss');
      (o.knoepfe || [{ text: T.t('schliessen'), wert: null }]).forEach(function (k) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = k.text;
        b.className = (k.art || '') + (k.links ? ' links' : '');
        b.onclick = function () { schliesse(k.wert === undefined ? true : k.wert); };
        fuss.appendChild(b);
      });
      function schliesse(wert) {
        document.removeEventListener('keydown', taste, true);
        hg.remove();
        fertig(wert);
      }
      function taste(e) { if (e.key === 'Escape') { e.stopPropagation(); schliesse(null); } }
      hg.querySelector('[data-x]').onclick = function () { schliesse(null); };
      hg.onclick = function (e) { if (e.target === hg) schliesse(null); };
      document.addEventListener('keydown', taste, true);
      document.body.appendChild(hg);
      if (o.beimOeffnen) o.beimOeffnen(hg);
      var erstes = rumpf.querySelector('input:not([type=hidden]),select,textarea');
      if (erstes && !o.keinFokus) setTimeout(function () { erstes.focus(); }, 60);
    });
  }

  function frage(titel, text) {
    return fenster({
      titel: titel,
      inhalt: '<p>' + sicher(text) + '</p>',
      knoepfe: [
        { text: T.t('abbrechen'), wert: false },
        { text: T.t('ja'), art: 'haupt', wert: true }
      ]
    });
  }

  /* Formularfenster. Alle Felder mit name="…" werden eingesammelt.
     Liefert {aktion, werte} oder null. */
  function formular(o) {
    return new Promise(function (fertig) {
      var hg = document.createElement('div');
      hg.className = 'hintergrund';
      hg.innerHTML = '<div class="fenster" style="max-width:' + (o.breite || 560) + 'px">'
        + '<div class="fkopf"><h2></h2><button type="button" class="still" data-x="1">✕</button></div>'
        + '<div class="frumpf"></div><div class="ffuss"></div></div>';
      hg.querySelector('h2').textContent = o.titel || '';
      hg.querySelector('.frumpf').innerHTML = o.inhalt || '';
      var fuss = hg.querySelector('.ffuss');

      function sammle() {
        var w = {};
        hg.querySelectorAll('[name]').forEach(function (e) {
          if (e.type === 'checkbox') w[e.name] = e.checked ? 1 : 0;
          else if (e.type === 'radio') { if (e.checked) w[e.name] = e.value; }
          else if (e.type === 'number' || e.type === 'range') {
            w[e.name] = e.value === '' ? '' : Number(e.value);
          } else w[e.name] = e.value;
        });
        return w;
      }
      function schliesse(aktion) {
        document.removeEventListener('keydown', taste, true);
        hg.remove();
        fertig(aktion ? { aktion: aktion, werte: sammle() } : null);
      }
      function taste(e) { if (e.key === 'Escape') { e.stopPropagation(); schliesse(null); } }

      if (o.loeschen) {
        var bl = document.createElement('button');
        bl.type = 'button';
        bl.textContent = T.t('loeschen');
        bl.className = 'gefahr links';
        bl.onclick = function () { schliesse('loeschen'); };
        fuss.appendChild(bl);
      }
      (o.weitere || []).forEach(function (k) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = k.text;
        b.className = k.art || '';
        b.onclick = function () { schliesse(k.aktion); };
        fuss.appendChild(b);
      });
      var ab = document.createElement('button');
      ab.type = 'button';
      ab.textContent = T.t('abbrechen');
      ab.onclick = function () { schliesse(null); };
      fuss.appendChild(ab);
      var sp = document.createElement('button');
      sp.type = 'button';
      sp.textContent = o.speichernText || T.t('speichern');
      sp.className = 'haupt';
      sp.onclick = function () { schliesse('speichern'); };
      fuss.appendChild(sp);

      hg.querySelector('[data-x]').onclick = function () { schliesse(null); };
      hg.onclick = function (e) { if (e.target === hg) schliesse(null); };
      hg.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'checkbox') {
          e.preventDefault();
          schliesse('speichern');
        }
      });
      document.addEventListener('keydown', taste, true);
      document.body.appendChild(hg);
      regler(hg);
      if (o.beimOeffnen) o.beimOeffnen(hg, sammle);
      var erstes = hg.querySelector('.frumpf input:not([type=hidden]),.frumpf select,.frumpf textarea');
      if (erstes) setTimeout(function () { erstes.focus(); erstes.select && erstes.select(); }, 60);
    });
  }

  /* =========================================================================
     4 · Bausteine für Formulare
     ========================================================================= */

  /* Schieberegler mit Zahlenfeld daneben – beide bleiben gleich. */
  function schieber(name, beschriftung, wert, min, max, schritt, einheit) {
    var id = 'sr_' + name + '_' + Math.random().toString(36).slice(2, 7);
    return '<div class="feld schieberfeld">'
      + '<label for="' + id + '">' + sicher(beschriftung) + '</label>'
      + '<div class="schieber">'
      + '<input type="range" id="' + id + '" data-schieber="' + name + '" min="' + min
      + '" max="' + max + '" step="' + schritt + '" value="' + Number(wert || 0) + '">'
      + '<input type="number" name="' + name + '" data-zahl="' + name + '" min="' + min
      + '" max="' + max + '" step="' + schritt + '" value="' + Number(wert || 0) + '">'
      + '<span class="einheit">' + sicher(einheit || '') + '</span>'
      + '</div></div>';
  }

  /* Verbindet alle Schieberegler eines Bereichs mit ihrem Zahlenfeld. */
  function regler(wurzel) {
    (wurzel || document).querySelectorAll('[data-schieber]').forEach(function (s) {
      var name = s.getAttribute('data-schieber');
      var z = (wurzel || document).querySelector('[data-zahl="' + name + '"]');
      if (!z || s.dataset.verbunden) return;
      s.dataset.verbunden = '1';
      s.addEventListener('input', function () { z.value = s.value; z.dispatchEvent(new Event('change')); });
      z.addEventListener('input', function () { s.value = z.value; });
    });
  }

  function auswahl(name, beschriftung, werte, gewaehlt, leerText) {
    var h = '<div class="feld"><label>' + sicher(beschriftung) + '</label>'
      + '<select name="' + name + '">';
    if (leerText !== undefined) {
      h += '<option value=""' + (!gewaehlt ? ' selected' : '') + '>' + sicher(leerText) + '</option>';
    }
    werte.forEach(function (w) {
      var wert = typeof w === 'object' ? w.wert : w;
      var text = typeof w === 'object' ? w.text : w;
      h += '<option value="' + sicher(wert) + '"'
        + (String(wert) === String(gewaehlt) ? ' selected' : '') + '>' + sicher(text) + '</option>';
    });
    return h + '</select></div>';
  }

  function feld(name, beschriftung, wert, art, zusatz) {
    return '<div class="feld"><label>' + sicher(beschriftung) + '</label>'
      + '<input type="' + (art || 'text') + '" name="' + name + '" value="'
      + sicher(wert === null || wert === undefined ? '' : wert) + '" ' + (zusatz || '') + '></div>';
  }

  function haken(name, beschriftung, an) {
    return '<label class="haken"><input type="checkbox" name="' + name + '"'
      + (an ? ' checked' : '') + '><span>' + sicher(beschriftung) + '</span></label>';
  }

  function farbwahl(name, beschriftung, wert) {
    var h = '<div class="feld"><label>' + sicher(beschriftung) + '</label><div class="farbtopf">';
    Kern.FARBTOPF.forEach(function (f) {
      h += '<label class="farbe"><input type="radio" name="' + name + '" value="' + f + '"'
        + (String(wert).toLowerCase() === f ? ' checked' : '')
        + '><span style="background:' + f + '"></span></label>';
    });
    return h + '</div></div>';
  }

  /* =========================================================================
     5 · Farbschema, Zwischenablage, Dateien
     ========================================================================= */

  function schemaSetzen(wert) {
    var s = wert === 'dunkel' ? 'dunkel' : 'hell';
    document.documentElement.setAttribute('data-schema', s);
    try { localStorage.setItem('pp_schema', s); } catch (e) { /* egal */ }
    return s;
  }

  function schemaLesen() {
    try { return localStorage.getItem('pp_schema') || Kern.einst('farbschema') || 'hell'; }
    catch (e) { return 'hell'; }
  }

  function kopieren(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text)
        .then(function () { melde(T.t('kopiert'), 'gut'); return true; })
        .catch(function () { return ersatzKopie(text); });
    }
    return Promise.resolve(ersatzKopie(text));
  }

  function ersatzKopie(text) {
    var t = document.createElement('textarea');
    t.value = text;
    t.style.cssText = 'position:fixed;left:-2000px;top:0';
    document.body.appendChild(t);
    t.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    t.remove();
    melde(ok ? T.t('kopiert') : 'Das Kopieren hat der Browser nicht erlaubt.', ok ? 'gut' : 'warn');
    return ok;
  }

  function dateiSpeichern(name, inhalt, art) {
    /* Excel braucht die Byte-Kennung am Anfang, sonst zerlegt es die Umlaute.
       In JSON hat sie nichts verloren – dort würde sie das Einlesen stören. */
    var kennung = (art || '').indexOf('csv') >= 0 ? '﻿' : '';
    var b = new Blob([kennung + inhalt], { type: (art || 'text/plain') + ';charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
  }

  function dateiLesen(datei) {
    return new Promise(function (fertig, schief) {
      var l = new FileReader();
      l.onload = function () { fertig(String(l.result || '')); };
      l.onerror = function () { schief(Kern.Fehler('Die Datei ließ sich nicht lesen.')); };
      /* Windows-Listen kommen oft als Westeuropäisch; erst UTF-8 versuchen. */
      l.readAsText(datei, 'utf-8');
    }).then(function (text) {
      if (text.indexOf('�') < 0) return text;
      return new Promise(function (fertig) {
        var l2 = new FileReader();
        l2.onload = function () { fertig(String(l2.result || text)); };
        l2.onerror = function () { fertig(text); };
        l2.readAsText(datei, 'windows-1252');
      });
    });
  }

  /* =========================================================================
     6 · Kleinigkeiten
     ========================================================================= */

  function leer(text) { return '<div class="leer">' + sicher(text) + '</div>'; }

  function etikett(text, art) {
    return '<span class="etikett ' + (art || '') + '">' + sicher(text) + '</span>';
  }

  function balken(anteil, art) {
    var p = Math.max(0, Math.min(1, anteil || 0));
    return '<div class="balken ' + (art || '') + '"><i style="width:'
      + Math.round(p * 100) + '%"></i></div>';
  }

  function tippen(el) {
    if (navigator.vibrate) { try { navigator.vibrate(8); } catch (e) { /* egal */ } }
    if (el) {
      el.classList.add('gedrueckt');
      setTimeout(function () { el.classList.remove('gedrueckt'); }, 180);
    }
  }

  /* Wischen nach links/rechts – für die Handy-Fassung. */
  function wischen(el, nachLinks, nachRechts) {
    var x0 = 0, y0 = 0, an = false;
    el.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) return;
      x0 = e.touches[0].clientX;
      y0 = e.touches[0].clientY;
      an = true;
    }, { passive: true });
    el.addEventListener('touchend', function (e) {
      if (!an) return;
      an = false;
      var t = e.changedTouches[0];
      var dx = t.clientX - x0, dy = t.clientY - y0;
      if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx) * 0.8) return;
      if (dx < 0 && nachLinks) nachLinks();
      if (dx > 0 && nachRechts) nachRechts();
    }, { passive: true });
  }

  return {
    sicher: sicher, std: std, euro: euro, zahl: zahl, tagLang: tagLang, tagKurz: tagKurz,
    monatName: monatName, anfangGross: anfangGross,
    melde: melde, fehler: fehler, rueckStreifen: rueckStreifen,
    fenster: fenster, frage: frage, formular: formular,
    schieber: schieber, regler: regler, auswahl: auswahl, feld: feld, haken: haken,
    farbwahl: farbwahl,
    schemaSetzen: schemaSetzen, schemaLesen: schemaLesen, kopieren: kopieren,
    dateiSpeichern: dateiSpeichern, dateiLesen: dateiLesen,
    leer: leer, etikett: etikett, balken: balken, tippen: tippen, wischen: wischen
  };
})();

window.UI = UI;
