/* PizzaPlan · Deutsch und Italienisch
   ----------------------------------------------------------------------------
   Ein Wörterbuch, zwei Sprachen. Im HTML steht das Kürzel im Attribut:
     <button data-t="plan_freigeben">Plan freigeben</button>
     <input data-t-platz="suche_platz">
     <button data-t-titel="hilfe_titel">
   Der Aufruf T.anwenden() setzt alle Texte in der gewählten Sprache.
*/
var T = (function () {
  'use strict';

  var W = {

    /* --- Kopf und Menü --- */
    app_pc: ['Dienstplan · PC-Fassung', 'Piano turni · versione PC'],
    app_handy: ['Dienstplan · Handy', 'Piano turni · cellulare'],
    app_team: ['Mein Dienstplan', 'Il mio piano turni'],
    uebersicht: ['Übersicht', 'Panoramica'],
    dienstplan: ['Dienstplan', 'Piano turni'],
    wuensche: ['Wünsche & Abwesenheit', 'Richieste e assenze'],
    wuensche_kurz: ['Wünsche', 'Richieste'],
    zeiten: ['Zeiterfassung', 'Ore lavorate'],
    zeiten_kurz: ['Zeiten', 'Ore'],
    team: ['Team', 'Squadra'],
    auswertung: ['Auswertung', 'Riepilogo'],
    termine: ['Termine', 'Appuntamenti'],
    versand: ['Plan verschicken', 'Invia il piano'],
    versand_kurz: ['Verschicken', 'Invia'],
    einstellungen: ['Einstellungen', 'Impostazioni'],
    einlesen: ['Mitarbeiter einlesen', 'Importa dipendenti'],
    einlesen_kurz: ['Einlesen', 'Importa'],
    mehr: ['Mehr', 'Altro'],
    heute: ['Heute', 'Oggi'],
    abmelden: ['Abmelden', 'Esci'],
    anmelden: ['Anmelden', 'Entra'],
    sprache: ['Sprache', 'Lingua'],
    dunkel: ['Dunkel', 'Scuro'],
    hell: ['Hell', 'Chiaro'],
    hilfe: ['Hilfe', 'Aiuto'],
    drucken: ['Drucken', 'Stampa'],
    schliessen: ['Schließen', 'Chiudi'],
    speichern: ['Speichern', 'Salva'],
    abbrechen: ['Abbrechen', 'Annulla'],
    loeschen: ['Löschen', 'Elimina'],
    zurueck: ['Zurück', 'Indietro'],
    weiter: ['Weiter', 'Avanti'],
    ja: ['Ja', 'Sì'],
    nein: ['Nein', 'No'],
    rueckgaengig: ['Rückgängig', 'Annulla modifica'],
    suchen: ['Suchen', 'Cerca'],
    alle: ['alle', 'tutti'],
    keiner: ['keiner', 'nessuno'],

    /* --- Übersicht --- */
    kachel_team: ['Im Team', 'In squadra'],
    kachel_woche: ['Stunden diese Woche', 'Ore questa settimana'],
    kachel_offen: ['Offene Wünsche', 'Richieste aperte'],
    kachel_unbesetzt: ['Unbesetzte Schichten', 'Turni scoperti'],
    kachel_entwurf: ['Noch nicht freigegeben', 'Non ancora pubblicati'],
    kachel_zeiten: ['Zeiten zu prüfen', 'Ore da controllare'],
    heute_im_dienst: ['Heute im Dienst', 'Oggi in servizio'],
    gerade_gestempelt: ['Gerade eingestempelt', 'Attualmente al lavoro'],
    naechste_termine: ['Nächste Termine', 'Prossimi appuntamenti'],
    niemand_gestempelt: ['Gerade ist niemand eingestempelt.', 'Al momento non timbra nessuno.'],
    heute_niemand: ['Heute ist niemand eingeplant.', 'Oggi non è in turno nessuno.'],
    keine_termine: ['Keine Termine in den nächsten zwei Wochen.',
      'Nessun appuntamento nelle prossime due settimane.'],
    schnellstart: ['Schnell erledigt', 'Fatto in un attimo'],

    /* --- Dienstplan --- */
    woche_zurueck: ['‹ Woche', '‹ Settimana'],
    woche_vor: ['Woche ›', 'Settimana ›'],
    diese_woche: ['Diese Woche', 'Questa settimana'],
    vorwoche_uebernehmen: ['Vorwoche übernehmen', 'Copia settimana precedente'],
    schicht_neu: ['+ Schicht', '+ Turno'],
    plan_freigeben: ['Plan freigeben', 'Pubblica il piano'],
    plan_sperren: ['Freigabe zurücknehmen', 'Annulla pubblicazione'],
    woche_leeren: ['Woche leeren', 'Svuota settimana'],
    vorlagen: ['Vorlagen', 'Modelli'],
    vorlage_ziehen: ['Vorlage in eine Zelle ziehen', 'Trascina un modello in una cella'],
    plan_hinweis: ['Auf eine leere Zelle klicken legt eine Schicht an. Schichten lassen sich mit der '
      + 'Maus in einen anderen Tag ziehen. Gestrichelt = noch nicht freigegeben.',
      'Clicca una cella vuota per creare un turno. I turni si possono trascinare in un altro '
      + 'giorno. Tratteggiato = non ancora pubblicato.'],
    summe: ['Summe', 'Totale'],
    soll: ['Soll', 'Previsto'],
    offen_bez: ['noch offen', 'ancora libero'],
    schicht_bearbeiten: ['Schicht bearbeiten', 'Modifica turno'],
    schicht_anlegen: ['Neue Schicht', 'Nuovo turno'],
    von: ['Von', 'Dalle'],
    bis: ['Bis', 'Alle'],
    pause: ['Pause (Minuten)', 'Pausa (minuti)'],
    position: ['Position', 'Postazione'],
    mitarbeiter: ['Mitarbeiter', 'Dipendente'],
    notiz: ['Notiz', 'Nota'],
    freigegeben: ['freigegeben – Mitarbeiter sehen die Schicht',
      'pubblicato – i dipendenti vedono il turno'],
    dauer: ['Dauer', 'Durata'],
    datum: ['Datum', 'Data'],

    /* --- Wünsche --- */
    status: ['Status', 'Stato'],
    offen: ['offen', 'aperta'],
    genehmigt: ['genehmigt', 'approvata'],
    abgelehnt: ['abgelehnt', 'respinta'],
    wunsch_neu: ['+ Eintrag für einen Mitarbeiter', '+ Voce per un dipendente'],
    typ: ['Art', 'Tipo'],
    bemerkung: ['Bemerkung', 'Osservazione'],
    zeitraum: ['Zeitraum', 'Periodo'],
    keine_wuensche: ['Hier ist gerade nichts eingetragen.', 'Al momento non c\'è nulla.'],

    /* --- Zeiten --- */
    zeit_neu: ['+ Zeit nachtragen', '+ Aggiungi ore'],
    alle_freigeben: ['Alle prüfen und freigeben', 'Controlla e approva tutto'],
    beginn: ['Beginn', 'Inizio'],
    ende: ['Ende', 'Fine'],
    quelle: ['Erfasst über', 'Registrato con'],
    laeuft: ['läuft', 'in corso'],
    keine_zeiten: ['Für diesen Zeitraum ist nichts erfasst.', 'Per questo periodo non c\'è nulla.'],

    /* --- Team --- */
    ma_neu: ['+ Mitarbeiter', '+ Dipendente'],
    auch_inaktive: ['auch ausgeschiedene anzeigen', 'mostra anche chi non lavora più'],
    rolle: ['Rolle', 'Ruolo'],
    vertrag: ['Vertrag', 'Contratto'],
    telefon: ['Telefon', 'Telefono'],
    email: ['E-Mail', 'E-mail'],
    stundenlohn: ['Stundenlohn', 'Paga oraria'],
    wochenstunden: ['Wochenstunden', 'Ore settimanali'],
    urlaubstage: ['Urlaubstage', 'Giorni di ferie'],
    eintritt: ['Im Betrieb seit', 'In azienda dal'],
    farbe: ['Farbe im Plan', 'Colore nel piano'],
    aktiv: ['arbeitet hier', 'lavora qui'],
    ist_chef: ['darf alles verwalten', 'può gestire tutto'],
    persoenlicher_link: ['Persönlicher Link', 'Link personale'],
    link_kopieren: ['Link kopieren', 'Copia link'],
    per_whatsapp: ['Per WhatsApp schicken', 'Manda su WhatsApp'],
    ma_bearbeiten: ['Mitarbeiter bearbeiten', 'Modifica dipendente'],
    ma_anlegen: ['Neuer Mitarbeiter', 'Nuovo dipendente'],

    /* --- Einlesen --- */
    einlesen_titel: ['Vorhandene Mitarbeiterdaten einlesen', 'Importa i dati dei dipendenti'],
    einlesen_text: ['Datei auswählen oder die Tabelle einfach hier hineinkopieren – aus Excel, '
      + 'aus einer Liste, aus dem alten Programm. PizzaPlan erkennt die Spalten selbst und zeigt '
      + 'vorher, was passieren wird.',
      'Scegli un file oppure incolla qui la tabella – da Excel, da un elenco, dal vecchio '
      + 'programma. PizzaPlan riconosce le colonne da solo e mostra prima cosa succederà.'],
    datei_waehlen: ['Datei auswählen', 'Scegli il file'],
    einfuegen_hier: ['… oder Tabelle hier einfügen', '… oppure incolla qui la tabella'],
    vorlage_holen: ['Importvorlage herunterladen', 'Scarica il modello'],
    pruefen: ['Prüfen', 'Controlla'],
    uebernehmen: ['Jetzt übernehmen', 'Importa adesso'],
    spalte: ['Spalte', 'Colonna'],
    zuordnung: ['Zuordnung', 'Assegnazione'],
    nicht_verwenden: ['nicht verwenden', 'non usare'],
    vorschau: ['Vorschau', 'Anteprima'],
    neu_bez: ['neu', 'nuovo'],
    aktualisieren: ['wird ergänzt', 'viene aggiornato'],
    fehler_bez: ['wird übersprungen', 'viene saltato'],
    einlesen_fertig: ['Eingelesen', 'Importato'],

    /* --- Auswertung --- */
    monat: ['Monat', 'Mese'],
    berechnen: ['Berechnen', 'Calcola'],
    als_datei: ['Als Excel-Datei', 'Come file Excel'],
    stunden: ['Stunden', 'Ore'],
    geplant: ['geplant', 'previsto'],
    differenz: ['Differenz', 'Differenza'],
    sonntag: ['davon Sonntag', 'di cui domenica'],
    nacht: ['davon Nacht', 'di cui notte'],
    grundlohn: ['Grundlohn', 'Paga base'],
    zuschlaege: ['Zuschläge', 'Maggiorazioni'],
    gesamt: ['Gesamt', 'Totale'],
    minijob_hinweis: ['über der Minijob-Grenze', 'oltre il limite del minijob'],

    /* --- Termine --- */
    termin_neu: ['+ Neuer Termin', '+ Nuovo appuntamento'],
    termin_sprechen: ['Termin einfach sprechen', 'Detta l\'appuntamento'],
    nur_offene: ['nur offene', 'solo aperti'],
    erledigt: ['erledigt', 'fatto'],
    erinnerung: ['Erinnerung', 'Promemoria'],
    wiederholung: ['Wiederholung', 'Ripetizione'],
    ort: ['Ort', 'Luogo'],
    kategorie: ['Kategorie', 'Categoria'],
    titel: ['Titel', 'Titolo'],
    ganztags: ['ganztägig', 'tutto il giorno'],

    /* --- Versand --- */
    versand_titel: ['Dienstplan an das Team schicken', 'Manda il piano alla squadra'],
    weg: ['Weg', 'Come'],
    empfaenger: ['Wer bekommt seinen Plan?', 'Chi riceve il suo piano?'],
    vorschau_ansehen: ['Vorschau ansehen', 'Guarda l\'anteprima'],
    jetzt_verschicken: ['Jetzt verschicken', 'Invia adesso'],
    gesamtplan: ['Gesamtplan zum Aushängen', 'Piano completo da appendere'],
    kopieren: ['In die Zwischenablage', 'Copia negli appunti'],

    /* --- Einstellungen --- */
    betrieb: ['Name des Betriebs', 'Nome del locale'],
    chef_pin: ['Chef-PIN', 'PIN del titolare'],
    positionen: ['Positionen (mit Komma trennen)', 'Postazioni (separate da virgola)'],
    oeffnung: ['Öffnungszeit', 'Orario di apertura'],
    arbeitszeit: ['Arbeitszeit und Lohn', 'Orario e paga'],
    pause6: ['Pause ab 6 Stunden (Minuten)', 'Pausa oltre 6 ore (minuti)'],
    pause9: ['Pause ab 9 Stunden (Minuten)', 'Pausa oltre 9 ore (minuti)'],
    ruhezeit: ['Ruhezeit zwischen zwei Schichten (Stunden)', 'Riposo fra due turni (ore)'],
    zuschlag_so: ['Zuschlag Sonntag (%)', 'Maggiorazione domenica (%)'],
    zuschlag_nacht: ['Zuschlag Nacht (%)', 'Maggiorazione notte (%)'],
    nacht_ab: ['Nacht beginnt um', 'La notte inizia alle'],
    minijob_grenze: ['Minijob-Grenze (€ im Monat)', 'Limite minijob (€ al mese)'],
    mindestlohn: ['Mindestlohn (€)', 'Salario minimo (€)'],
    daten: ['Daten', 'Dati'],
    sicherung: ['Sicherungskopie anlegen', 'Crea una copia di sicurezza'],
    sicherung_laden: ['Sicherung einspielen', 'Ripristina una copia'],
    beispiel_weg: ['Beispieldaten entfernen', 'Rimuovi i dati di esempio'],
    nachrichtentext: ['Nachrichtentext', 'Testo del messaggio'],

    /* --- Mitarbeiter-App --- */
    stempeln: ['Stempeln', 'Timbra'],
    kommen: ['Kommen stempeln', 'Timbra entrata'],
    feierabend: ['Feierabend stempeln', 'Timbra uscita'],
    mein_plan: ['Mein Plan', 'Il mio piano'],
    meine_stunden: ['Meine Stunden', 'Le mie ore'],
    ich: ['Ich', 'Io'],
    heute_erfasst: ['Heute erfasst', 'Registrato oggi'],
    naechste_schicht: ['Deine nächste Schicht', 'Il tuo prossimo turno'],
    wunsch_melden: ['+ Frei-Wunsch oder Abwesenheit melden', '+ Segnala un giorno libero o un\'assenza'],
    wer_bist_du: ['Wer bist du?', 'Chi sei?'],
    deine_pin: ['Deine PIN', 'Il tuo PIN'],
    pin_aendern: ['PIN ändern', 'Cambia PIN'],
    app_aufs_handy: ['App aufs Handy legen', 'Metti l\'app sul telefono'],
    keine_schicht: ['In dieser Woche ist für dich nichts eingeplant.',
      'Questa settimana non hai turni.'],

    /* --- Knöpfe und Beschriftungen, die sonst nirgends stehen --- */
    anzeigen: ['Anzeigen', 'Mostra'],
    vorlage_neu: ['+ Vorlage', '+ Modello'],
    feld_leeren: ['Feld leeren', 'Svuota il campo'],
    beispiel_einfuegen: ['Beispieldaten des Herstellers einfügen', 'Inserisci i dati di esempio'],
    einfuegen_wie: ['In Excel markieren, kopieren, hier hineinklicken und einfügen – oder die '
      + 'Datei einfach in dieses Feld ziehen.',
      'Seleziona in Excel, copia, clicca qui e incolla – oppure trascina il file in questo campo.'],
    betrieb_titel: ['Betrieb', 'Il locale'],
    app_verteilen: ['Mitarbeiter-App verteilen', 'Distribuire l\'app ai dipendenti'],
    app_verteilen_text: ['Jeder Mitarbeiter hat einen persönlichen Link. Wer ihn antippt, ist '
      + 'sofort in seiner App – ohne Anmeldung – und kann sie mit „Zum Home-Bildschirm“ wie eine '
      + 'richtige App aufs Handy legen.',
      'Ogni dipendente ha un link personale. Chi lo tocca entra subito nella sua app, senza '
      + 'accesso, e può metterla sul telefono con „Aggiungi a Home“ come una vera app.'],
    allgemeine_adresse: ['Allgemeine Adresse', 'Indirizzo generale'],
    erinnerung_standard: ['Erinnerung standardmäßig (Minuten vorher)',
      'Promemoria predefinito (minuti prima)'],
    alles_loeschen: ['Alle Daten löschen', 'Cancella tutti i dati'],
    gesamtplan_wozu: ['Der ganze Wochenplan als Text – für die WhatsApp-Gruppe, für den Aushang '
      + 'oder zum Ausdrucken.',
      'Tutto il piano della settimana come testo – per il gruppo WhatsApp, per la bacheca o da '
      + 'stampare.'],
    zuschlaege_hinweis: ['Die Zuschläge sind eine Rechenhilfe für die Monatsübersicht und '
      + 'ersetzen keine Lohnabrechnung.',
      'Le maggiorazioni servono solo al riepilogo mensile e non sostituiscono la busta paga.'],
    platzhalter: ['Platzhalter', 'Segnaposto'],
    tage7: ['7 Tage', '7 giorni'],
    tage14: ['14 Tage', '14 giorni'],
    tage30: ['30 Tage', '30 giorni'],
    neue_pin: ['Neue PIN (4–8 Ziffern)', 'Nuovo PIN (4–8 cifre)'],
    install_wie: ['Im Browser-Menü auf „Zum Home-Bildschirm“ tippen – dann startet dein '
      + 'Dienstplan wie eine richtige App.',
      'Nel menu del browser tocca „Aggiungi a Home“: il tuo piano turni parte come una vera app.'],
    install_jetzt: ['Jetzt installieren', 'Installa adesso'],
    pin_vergessen: ['PIN vergessen? Dann kurz beim Chef melden.',
      'PIN dimenticato? Chiedi al titolare.'],

    wischen_tag: ['← wischen für den nächsten Tag →', '← scorri per il giorno successivo →'],
    wischen_woche: ['← wischen für die nächste Woche →', '← scorri per la settimana successiva →'],
    woche_knopf: ['Woche', 'Settimana'],
    termin_beispiel: ['Antippen und sprechen: „Morgen um 14 Uhr Steuerberater“.',
      'Tocca e parla: „Domani alle 14 dal commercialista“.'],

    versand_hinweis_whatsapp: ['Für jeden Mitarbeiter öffnet sich WhatsApp mit dem fertigen '
      + 'Text – abgeschickt wird erst dort. Voraussetzung ist eine Telefonnummer beim Mitarbeiter.',
      'Per ogni dipendente si apre WhatsApp con il testo già pronto: l\'invio avviene solo lì. '
      + 'Serve un numero di telefono nel dipendente.'],
    versand_hinweis_email: ['Für jeden Mitarbeiter öffnet sich das E-Mail-Programm mit fertigem '
      + 'Betreff und Text. Voraussetzung ist eine E-Mail-Adresse beim Mitarbeiter.',
      'Per ogni dipendente si apre il programma di posta con oggetto e testo già pronti. '
      + 'Serve un indirizzo e-mail nel dipendente.'],
    keine_nummer: ['keine Nummer', 'nessun numero'],
    keine_adresse: ['keine Adresse', 'nessun indirizzo'],
    niemand_gefunden: ['Niemand gefunden.', 'Nessuno trovato.'],
    niemand_eingeteilt: ['noch niemand eingeteilt', 'ancora nessuno assegnato'],
    kein_plan_tag: ['An diesem Tag ist noch niemand eingeteilt.',
      'Per questo giorno non è ancora in turno nessuno.'],
    keine_vorlage: ['Noch keine Vorlage.', 'Ancora nessun modello.'],
    geprueft: ['geprüft', 'controllato'],
    ungeprueft: ['ungeprüft', 'da controllare'],

    /* --- Meldungen --- */
    gespeichert: ['Gespeichert.', 'Salvato.'],
    geloescht: ['Gelöscht.', 'Eliminato.'],
    kopiert: ['In die Zwischenablage kopiert.', 'Copiato negli appunti.'],
    wirklich_loeschen: ['Wirklich löschen?', 'Eliminare davvero?'],
    nichts_gewaehlt: ['Es ist nichts ausgewählt.', 'Non hai selezionato nulla.']
  };

  var jetzt = 'de';

  function setze(sprache) {
    jetzt = sprache === 'it' ? 'it' : 'de';
    try { document.documentElement.lang = jetzt; } catch (e) { /* egal */ }
    return jetzt;
  }

  function aktuell() { return jetzt; }

  function t(schluessel) {
    var e = W[schluessel];
    if (!e) return schluessel;
    return jetzt === 'it' ? e[1] : e[0];
  }

  function anwenden(wurzel) {
    var w = wurzel || document;
    w.querySelectorAll('[data-t]').forEach(function (e) {
      e.textContent = t(e.getAttribute('data-t'));
    });
    w.querySelectorAll('[data-t-platz]').forEach(function (e) {
      e.setAttribute('placeholder', t(e.getAttribute('data-t-platz')));
    });
    w.querySelectorAll('[data-t-titel]').forEach(function (e) {
      e.setAttribute('title', t(e.getAttribute('data-t-titel')));
    });
  }

  /* Prüfhilfe: liefert alle Kürzel, die im HTML stehen, aber hier fehlen. */
  function fehlende(wurzel) {
    var aus = [];
    (wurzel || document).querySelectorAll('[data-t],[data-t-platz],[data-t-titel]')
      .forEach(function (e) {
        ['data-t', 'data-t-platz', 'data-t-titel'].forEach(function (a) {
          var k = e.getAttribute(a);
          if (k && !W[k] && aus.indexOf(k) < 0) aus.push(k);
        });
      });
    return aus;
  }

  return { setze: setze, aktuell: aktuell, t: t, anwenden: anwenden, fehlende: fehlende, W: W };
})();

window.T = T;
