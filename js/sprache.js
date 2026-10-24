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

    /* --- Startbild Handy (neu) --- */
    menue_titel: ['Menü', 'Menu'],
    zu_erledigen: ['Zu erledigen', 'Da fare'],
    alles_erledigt: ['Alles erledigt – nichts offen.', 'Tutto fatto – niente in sospeso.'],
    todo_unbesetzt: ['Schichten ohne Namen', 'Turni senza nome'],
    todo_entwurf: ['Noch nicht freigegeben', 'Non ancora pubblicati'],
    todo_wuensche: ['Wünsche offen', 'Richieste aperte'],
    todo_zeiten: ['Zeiten zu prüfen', 'Ore da controllare'],
    jetzt_im_dienst: ['Gerade im Dienst', 'Ora al lavoro'],
    nach_tag: ['nach Tag', 'per giorno'],
    nach_person: ['nach Person', 'per persona'],
    tag_frei: ['frei', 'libero'],
    woche_frei: ['keine Schicht', 'nessun turno'],
    kachel_kosten: ['Lohn diese Woche', 'Paga questa settimana'],
    /* Kurzfassungen für die Kacheln am Handy */
    kachel_woche_k: ['Std. Woche', 'Ore sett.'],
    kachel_unbesetzt_k: ['Unbesetzt', 'Scoperti'],
    kachel_kosten_k: ['Lohn Woche', 'Paga sett.'],
    h_heute_weitere: ['+ {n} weitere ›', '+ altri {n} ›'],
    h_heute_weniger: ['Weniger anzeigen', 'Mostra meno'],
    schichten_wort: ['Schichten', 'Turni'],
    schicht_wort: ['Schicht', 'Turno'],
    heute_nichts: ['Heute steht nichts im Plan.', 'Oggi non c’è nulla in programma.'],
    woche_nichts: ['In dieser Woche ist noch niemand eingeplant.',
      'Questa settimana non è ancora in turno nessuno.'],
    ganze_woche: ['Ganze Woche ansehen', 'Vedi tutta la settimana'],
    naechste_woche: ['Nächste Woche', 'Prossima settimana'],
    vorwoche: ['Vorige Woche', 'Settimana scorsa'],

    /* --- Dienstplan --- */
    woche_zurueck: ['‹ Woche', '‹ Settimana'],
    woche_vor: ['Woche ›', 'Settimana ›'],
    diese_woche: ['Diese Woche', 'Questa settimana'],
    vorwoche_uebernehmen: ['Vorwoche übernehmen', 'Copia settimana precedente'],
    schicht_neu: ['+ Schicht', '+ Turno'],
    plan_freigeben: ['Plan freigeben', 'Pubblica il piano'],
    freigeben_kurz: ['Freigeben', 'Pubblica'],
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
    offen: ['offen', 'aperte'],
    offen_eine: ['offen', 'aperta'],
    offen_turni: ['offen', 'scoperti'],
    zeit_offen: ['offen', 'da controllare'],
    genehmigt: ['genehmigt', 'approvata'],
    abgelehnt: ['abgelehnt', 'respinta'],
    wunsch_neu: ['+ Eintrag für einen Mitarbeiter', '+ Voce per un dipendente'],
    typ: ['Art', 'Tipo'],
    bemerkung: ['Bemerkung', 'Osservazione'],
    zeitraum: ['Zeitraum', 'Periodo'],
    keine_wuensche: ['Hier ist gerade nichts eingetragen.', 'Al momento non c\'è nulla.'],

    /* --- Zeiten --- */
    stunden_je_ma: ['Stunden je Mitarbeiter', 'Ore per dipendente'],
    tag_ohne_zeiten: ['An diesem Tag ist nichts erfasst und nichts geplant.',
      'Per questo giorno non c’è né orario registrato né turno.'],
    erfasst: ['erfasst', 'registrate'],
    tage_wort: ['Tage', 'giorni'],
    eintraege: ['Einträge', 'voci'],
    pause_wort: ['Pause', 'pausa'],
    person_freigeben: ['Alle freigeben', 'Approva tutto'],
    zeiten_freigegeben: ['Zeiten freigegeben', 'ore approvate'],
    nichts_offen: ['Es war nichts offen.', 'Non c’era nulla in sospeso.'],
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

    /* --- Kontakt und Adresse --- */
    kontakt_adresse: ['Kontakt & Adresse', 'Contatti e indirizzo'],
    handy_nr: ['Handy', 'Cellulare'],
    telegram: ['Telegram', 'Telegram'],
    telegram_platz: ['Name ohne @', 'nome senza @'],
    strasse: ['Straße und Nr.', 'Via e n. civico'],
    plz: ['PLZ', 'CAP'],
    wohnort: ['Ort', 'Città'],
    geburtsdatum: ['Geburtsdatum', 'Data di nascita'],
    notfallkontakt: ['Notfallkontakt', 'Contatto di emergenza'],
    notfall_platz: ['Name und Telefonnummer', 'Nome e numero di telefono'],
    vorname: ['Vorname', 'Nome'],
    nachname: ['Nachname', 'Cognome'],
    adresse: ['Adresse', 'Indirizzo'],

    /* --- App-Einladung --- */
    app_einladung: ['App-Einladung', 'Invito all’app'],
    einladen_kurz: ['Einladen', 'Invita'],
    alle_einladen: ['Alle einladen', 'Invita tutti'],
    eingeladen_am: ['eingeladen {datum}', 'invito {datum}'],
    ein_zuletzt: ['Zuletzt eingeladen am {datum}.', 'Ultimo invito inviato il {datum}.'],
    ein_sprache_info: ['Die Nachricht ist auf {sprache} – so, wie es bei {name} eingestellt ist.',
      'Il messaggio è in {sprache}, come impostato per {name}.'],
    ein_sprache_de: ['Deutsch', 'tedesco'],
    ein_sprache_it: ['Italienisch', 'italiano'],
    ein_per_mail: ['Per E-Mail', 'Per e-mail'],
    ein_per_telegram: ['Per Telegram', 'Su Telegram'],
    ein_per_whatsapp: ['Per WhatsApp', 'Su WhatsApp'],
    ein_text_kopieren: ['Text kopieren', 'Copia il testo'],
    ein_tg_kopiert: ['Text ist kopiert – im Chat einfügen.', 'Testo copiato – incollalo nella chat.'],
    ein_kein_kontakt: ['Für {name} ist weder E-Mail noch Telegram noch Handynummer eingetragen. '
      + 'Bitte zuerst einen Kontakt eintragen – oder den Text kopieren und selbst weitergeben.',
      'Per {name} non c’è né un’e-mail, né Telegram, né un numero di cellulare. Inserisci prima '
      + 'un contatto – oppure copia il testo e invialo tu.'],
    ein_kontakt_eintragen: ['Kontakt eintragen', 'Inserisci un contatto'],
    ein_weiter: ['Weiter ›', 'Avanti ›'],
    ein_ueberspringen: ['Überspringen', 'Salta'],
    ein_alle_titel: ['Alle einladen · {n} bereit', 'Invita tutti · {n} pronti'],
    ein_alle_info: ['Einen Namen antippen öffnet die Einladung für diese Person. „Alle nacheinander“ '
      + 'zeigt ein Fenster nach dem anderen – je ein Tipp verschickt.',
      'Tocca un nome per aprire il suo invito. Con «Tutti uno dopo l’altro» si apre una finestra '
      + 'dopo l’altra – basta un tocco per inviare.'],
    ein_ohne_kontakt: ['kein Kontakt eingetragen', 'nessun contatto inserito'],
    ein_alle_fertig: ['{n} Einladungen erledigt.', '{n} inviti completati.'],
    ein_keiner: ['Im Team ist niemand zum Einladen.', 'Nella squadra non c’è nessuno da invitare.'],
    ein_niemand_bereit: ['Bei niemandem ist ein Kontakt eingetragen.',
      'Nessuno ha un contatto inserito.'],
    pc_tt_einladen: ['Fertige Einladung zur Mitarbeiter-App öffnen – per E-Mail, Telegram oder '
      + 'WhatsApp verschicken',
      'Apri l’invito pronto per l’app dei dipendenti – da inviare per e-mail, Telegram o WhatsApp'],
    pc_tt_alle_einladen: ['Alle Mitarbeiter nacheinander zur App einladen',
      'Invita all’app tutti i dipendenti, uno dopo l’altro'],

    /* Die Einladung selbst – geht in der Sprache des Mitarbeiters hinaus */
    ein_betreff: ['Dein Dienstplan als App – {betrieb}', 'I tuoi turni nell’app – {betrieb}'],
    ein_text_anfang: ['Hallo {name},\n\nab sofort hast du deinen Dienstplan bei {betrieb} immer '
      + 'dabei – als App auf deinem Handy. Dort siehst du deine Schichten, trägst Wünsche ein und '
      + 'stempelst ein und aus.',
      'Ciao {name},\n\nda oggi hai sempre con te i tuoi turni da {betrieb} – con un’app sul tuo '
      + 'telefono. Lì vedi i tuoi turni, inserisci le tue richieste e timbri entrata e uscita.'],
    ein_text_link: ['Dein persönlicher Link:\n{link}', 'Il tuo link personale:\n{link}'],
    ein_text_rest: ['Einfach antippen – dann bist du direkt drin. Falls du dich einmal mit deinem '
      + 'Namen anmelden musst: Deine PIN ist {pin}. Ändern kannst du sie in der App unter „Ich“.'
      + '\n\nSo legst du die App auf den Home-Bildschirm:'
      + '\n• iPhone: Link in Safari öffnen → unten auf „Teilen“ (Kästchen mit Pfeil) → '
      + '„Zum Home-Bildschirm“'
      + '\n• Android: Link in Chrome öffnen → Menü ⋮ oben rechts → „App installieren“'
      + '\n\nViele Grüße\n{betrieb}',
      'Basta toccarlo e sei subito dentro. Se dovessi accedere con il tuo nome, il tuo PIN è {pin}. '
      + 'Puoi cambiarlo nell’app alla voce «Io».'
      + '\n\nCosì metti l’app nella schermata Home:'
      + '\n• iPhone: apri il link in Safari → tocca «Condividi» in basso (il quadrato con la '
      + 'freccia) → «Aggiungi alla schermata Home»'
      + '\n• Android: apri il link in Chrome → menu ⋮ in alto a destra → «Installa app»'
      + '\n\nUn caro saluto\n{betrieb}'],

    /* --- Einlesen --- */
    einlesen_titel: ['Vorhandene Mitarbeiterdaten einlesen', 'Importa i dati dei dipendenti'],
    ein_s1: ['Vorlage holen', 'Scarica il modello'],
    ein_s1_text: ['Eine Excel-Tabelle mit den richtigen Überschriften. Hinein gehören Personal-, '
      + 'Adress- und Kontaktdaten: Rolle, Vertrag, Lohn und Stunden, Straße und Ort, Handy, E-Mail, '
      + 'Telegram, Notfallkontakt.',
      'Una tabella Excel con le intestazioni giuste. Dentro vanno i dati del personale, l’indirizzo '
      + 'e i contatti: ruolo, contratto, paga e ore, via e città, cellulare, e-mail, Telegram, '
      + 'contatto di emergenza.'],
    ein_xl_vorlage: ['Excel-Vorlage herunterladen', 'Scarica il modello Excel'],
    ein_csv_vorlage: ['oder als CSV-Datei', 'oppure come file CSV'],
    ein_s2: ['In Excel ausfüllen', 'Compila in Excel'],
    ein_s2_text: ['Eine Zeile je Mitarbeiter. Nur der Vorname ist Pflicht, alles andere darf leer '
      + 'bleiben. Einfach speichern – die Excel-Datei wird direkt eingelesen.',
      'Una riga per dipendente. Solo il nome è obbligatorio, il resto può restare vuoto. Basta '
      + 'salvare – il file Excel si importa direttamente.'],
    ein_s3: ['Datei einlesen', 'Importa il file'],
    ein_s3_text: ['PizzaPlan zeigt erst eine Vorschau. Bekannte Namen werden ergänzt, neue Namen '
      + 'angelegt – einzeln anlegen muss niemand.',
      'PizzaPlan mostra prima un’anteprima. I nomi già presenti vengono completati, i nuovi '
      + 'creati – non serve inserirli a mano.'],
    spalten_verstanden: ['Diese Spalten werden verstanden', 'Colonne riconosciute'],
    nur_csv: ['Diese Datei kann ich nicht lesen. Bitte als Excel-Datei (.xlsx) oder als CSV speichern.',
      'Non riesco a leggere questo file. Salvalo come file Excel (.xlsx) o come CSV.'],
    ui_excel_fehler: ['Die Excel-Datei ließ sich nicht lesen. Bitte in Excel noch einmal speichern '
      + 'und erneut versuchen.',
      'Non riesco a leggere il file Excel. Salvalo di nuovo in Excel e riprova.'],
    ui_excel_fehlt: ['Der Excel-Leser ließ sich nicht laden. Bitte die Seite neu laden.',
      'Non riesco a caricare il lettore Excel. Ricarica la pagina.'],
    einlesen_text: ['Datei auswählen (Excel oder CSV) oder die Tabelle hier hineinkopieren – aus Excel, '
      + 'aus einer Liste, aus dem alten Programm. PizzaPlan erkennt die Spalten selbst und zeigt '
      + 'vorher, was passieren wird.',
      'Scegli un file (Excel o CSV) oppure incolla qui la tabella – da Excel, da un elenco, dal vecchio '
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

    /* --- nur PC-Fassung (vorher in pc.js) --- */
    pc_handy_hinweis: ['Am Handy gibt es eine eigene Fassung – größer und einfacher zu bedienen.',
      'Sul cellulare c\'è una versione apposita – più grande e più facile da usare.'],
    pc_handy_oeffnen: ['Handy-Fassung öffnen', 'Apri versione cellulare'],
    pc_hinweis_zu: ['Hinweis ausblenden', 'Nascondi avviso'],
    pc_tt_mikro: ['Sprachbefehl', 'Comando vocale'],
    pc_tt_schema: ['Hell / Dunkel umschalten', 'Passa a chiaro / scuro'],
    pc_tt_hilfe: ['Hilfe und Tastenkürzel (Taste ?)', 'Aiuto e scorciatoie (tasto ?)'],
    pc_tt_abmelden: ['Abmelden – die Daten bleiben auf diesem Gerät',
      'Esci – i dati restano su questo dispositivo'],
    pc_tt_m1: ['Übersicht (Taste 1)', 'Panoramica (tasto 1)'],
    pc_tt_m2: ['Dienstplan (Taste 2)', 'Piano turni (tasto 2)'],
    pc_tt_m3: ['Wünsche & Abwesenheit (Taste 3)', 'Richieste e assenze (tasto 3)'],
    pc_tt_m4: ['Zeiterfassung (Taste 4)', 'Ore lavorate (tasto 4)'],
    pc_tt_m5: ['Team (Taste 5)', 'Squadra (tasto 5)'],
    pc_tt_m6: ['Mitarbeiter einlesen (Taste 6)', 'Importa dipendenti (tasto 6)'],
    pc_tt_m7: ['Auswertung (Taste 7)', 'Riepilogo (tasto 7)'],
    pc_tt_m8: ['Termine (Taste 8)', 'Appuntamenti (tasto 8)'],
    pc_tt_m9: ['Plan verschicken (Taste 9)', 'Invia il piano (tasto 9)'],
    pc_tt_m0: ['Einstellungen (Taste 0)', 'Impostazioni (tasto 0)'],
    pc_tt_zurueck: ['Eine Woche zurück (Taste ←)', 'Settimana precedente (tasto ←)'],
    pc_tt_vor: ['Eine Woche vor (Taste →)', 'Settimana successiva (tasto →)'],
    pc_tt_heute: ['Zur laufenden Woche springen', 'Vai alla settimana in corso'],
    pc_tt_kopieren: ['Schichten der Vorwoche als Entwurf in diese Woche kopieren',
      'Copia i turni della settimana precedente come bozza'],
    pc_tt_neu: ['Neue Schicht anlegen (Taste N)', 'Nuovo turno (tasto N)'],
    pc_tt_freigeben: ['Alle Schichten dieser Woche für das Team sichtbar machen',
      'Rendi visibili alla squadra tutti i turni della settimana'],
    pc_tt_drucken: ['Wochenplan drucken', 'Stampa il piano settimanale'],
    pc_tt_vorlage_neu: ['Neue Schicht-Vorlage anlegen', 'Nuovo modello di turno'],
    pc_tt_leeren: ['Alle Schichten dieser Woche entfernen', 'Elimina tutti i turni della settimana'],
    pc_tt_sperren: ['Schichten dieser Woche wieder zum Entwurf machen – das Team sieht sie nicht mehr',
      'Riporta i turni della settimana in bozza – la squadra non li vede più'],
    pc_tt_vorlage: ['In eine Zelle ziehen = Schicht anlegen · Klicken = Vorlage bearbeiten',
      'Trascina in una cella = nuovo turno · Clic = modifica modello'],
    pc_tt_schicht: ['Klicken = bearbeiten · Ziehen = verschieben',
      'Clic = modifica · Trascina = sposta'],
    pc_tt_zelle: ['Klicken = neue Schicht', 'Clic = nuovo turno'],
    pc_tt_zum_plan: ['Diese Woche im Dienstplan öffnen', 'Apri questa settimana nel piano turni'],
    pc_tt_tag: ['Diesen Tag im Dienstplan zeigen', 'Mostra questo giorno nel piano turni'],
    pc_tt_genehmigen: ['Genehmigen', 'Approva'],
    pc_tt_ablehnen: ['Ablehnen', 'Respingi'],
    pc_tt_bearbeiten: ['Bearbeiten', 'Modifica'],
    pc_tt_zeit_ok: ['Als geprüft markieren (nochmal klicken = zurücknehmen)',
      'Segna come controllato (clic di nuovo = annulla)'],
    pc_tt_erledigt: ['Als erledigt abhaken', 'Segna come fatto'],
    pc_tt_wieder_offen: ['Wieder als offen markieren', 'Segna di nuovo come aperto'],
    pc_tt_link: ['Persönlichen App-Link in die Zwischenablage kopieren',
      'Copia negli appunti il link personale dell\'app'],
    pc_tt_whatsapp: ['Link per WhatsApp schicken', 'Invia il link via WhatsApp'],
    pc_tt_lohnzeile: ['Klicken = einzelne Tage zeigen', 'Clic = mostra i singoli giorni'],
    pc_tt_kachel: ['Klicken = dorthin wechseln', 'Clic = vai alla pagina'],
    pc_versand_keine_nummer: ['Im Moment ist bei niemandem eine Handynummer eingetragen – '
      + 'das geht unter „Team“ beim jeweiligen Mitarbeiter.',
      'Al momento nessuno ha un numero di cellulare – si aggiunge in «Squadra» per ogni dipendente.'],
    pc_versand_keine_adresse: ['Im Moment ist bei niemandem eine E-Mail-Adresse eingetragen – '
      + 'das geht unter „Team“ beim jeweiligen Mitarbeiter.',
      'Al momento nessuno ha un indirizzo e-mail – si aggiunge in «Squadra» per ogni dipendente.'],
    pc_tt_w_neu: ['Wunsch oder Abwesenheit für einen Mitarbeiter eintragen',
      'Inserisci una richiesta o un\'assenza per un dipendente'],
    pc_tt_z_anzeigen: ['Liste für Zeitraum und Mitarbeiter neu zeigen',
      'Aggiorna l\'elenco per periodo e dipendente'],
    pc_tt_z_freigeben: ['Alle abgeschlossenen Zeiten dieser Auswahl als geprüft markieren',
      'Segna come controllate tutte le ore concluse di questa selezione'],
    pc_tt_z_neu: ['Vergessene Arbeitszeit von Hand eintragen',
      'Inserisci a mano un orario dimenticato'],
    pc_tt_t_einlesen: ['Mitarbeiter aus Excel oder einer Liste übernehmen',
      'Importa dipendenti da Excel o da un elenco'],
    pc_tt_t_neu: ['Neuen Mitarbeiter anlegen',
      'Aggiungi un nuovo dipendente'],
    pc_tt_e_datei: ['Excel-, CSV- oder Textdatei vom Rechner wählen',
      'Scegli un file Excel, CSV o di testo dal computer'],
    pc_tt_e_vorlage: ['Dieselbe Vorlage als CSV-Datei (Semikolon-getrennt) speichern',
      'Salva lo stesso modello come file CSV (separato da punto e virgola)'],
    pc_tt_e_beispiel: ['Beispieltabelle ins Feld einfügen, um das Einlesen auszuprobieren',
      'Inserisci una tabella di esempio per provare l\'importazione'],
    pc_tt_e_pruefen: ['Tabelle prüfen und Vorschau zeigen – gespeichert wird noch nichts',
      'Controlla la tabella e mostra l\'anteprima – non si salva ancora nulla'],
    pc_tt_e_leeren: ['Eingabefeld und Vorschau leeren',
      'Svuota il campo e l\'anteprima'],
    pc_tt_a_rechnen: ['Stunden und Lohn für den gewählten Monat berechnen',
      'Calcola ore e paga del mese scelto'],
    pc_tt_a_csv: ['Monatsübersicht als Datei für Excel speichern',
      'Salva il riepilogo mensile come file per Excel'],
    pc_tt_a_drucken: ['Monatsübersicht drucken',
      'Stampa il riepilogo mensile'],
    pc_tt_tm_anzeigen: ['Termine im gewählten Zeitraum zeigen',
      'Mostra gli appuntamenti del periodo scelto'],
    pc_tt_tm_neu: ['Neuen Termin anlegen',
      'Nuovo appuntamento'],
    pc_tt_v_alle: ['Alle erreichbaren Mitarbeiter auswählen',
      'Seleziona tutti i dipendenti raggiungibili'],
    pc_tt_v_keiner: ['Auswahl aufheben',
      'Togli la selezione'],
    pc_tt_v_vorschau: ['Zeigt, wie die Nachricht beim ersten Empfänger aussieht',
      'Mostra come appare il messaggio al primo destinatario'],
    pc_tt_v_start: ['Nachrichten an alle ausgewählten Mitarbeiter vorbereiten und verschicken',
      'Prepara e invia i messaggi ai dipendenti selezionati'],
    pc_tt_v_gesamt: ['Gesamtplan als Text hier unten anzeigen',
      'Mostra qui sotto il piano completo come testo'],
    pc_tt_v_kopieren: ['Gesamtplan kopieren – z. B. für die WhatsApp-Gruppe',
      'Copia il piano completo – ad es. per il gruppo WhatsApp'],
    pc_tt_ei_sicherung: ['Alle Daten als Datei speichern – für ein anderes Gerät oder zur Sicherheit',
      'Salva tutti i dati in un file – per un altro dispositivo o per sicurezza'],
    pc_tt_ei_wiederherstellen: ['Eine gespeicherte Sicherung zurückholen – ersetzt den jetzigen Stand',
      'Ripristina un backup salvato – sostituisce i dati attuali'],
    pc_tt_ei_beispiel_weg: ['Nur die Beispieldaten vom ersten Start entfernen, eigene Eingaben bleiben',
      'Rimuovi solo i dati di esempio, i tuoi dati restano'],
    pc_tt_ei_alles_weg: ['Team, Pläne, Zeiten und Termine löschen (gleich danach rückgängig machbar)',
      'Elimina squadra, piani, ore e appuntamenti (annullabile subito dopo)'],
    pc_tt_ei_speichern: ['Einstellungen speichern',
      'Salva le impostazioni'],
    pc_tt_schliessen: ['Schließen (Esc)', 'Chiudi (Esc)'],
    pc_tt_speichern: ['Speichern (Enter)', 'Salva (Invio)'],

    /* --- nur Handy-Fassung (vorher in handy.js) --- */
    h_seit: ['seit {z} Uhr', 'dalle {z}'],
    h_uhr: [' Uhr', ''],
    h_tag: ['Tag', 'Giorno'],
    h_offen_spalte: ['offen', 'scoperti'],
    h_entwurf: ['Entwurf', 'bozza'],
    h_plan_frei_n: ['Schichten freigegeben – das Team sieht den Plan jetzt.',
      'turni pubblicati – la squadra ora vede il piano.'],
    h_plan_schon_frei: ['In dieser Woche war schon alles freigegeben.',
      'Questa settimana era già tutto pubblicato.'],
    h_plan_freigegeben: ['Plan freigegeben', 'Piano pubblicato'],
    h_uebernommen: ['Schichten übernommen', 'turni copiati'],
    h_nichts_uebernehmen: ['Es gab nichts zu übernehmen.', 'Non c\u2019era nulla da copiare.'],
    h_datei_gespeichert: ['Die Datei ist gespeichert.', 'Il file è stato salvato.'],
    h_vorlage_gespeichert: ['Die Vorlage ist gespeichert.', 'Il modello è stato salvato.'],
    h_sicherung_gespeichert: ['Die Sicherung ist gespeichert.', 'La copia di sicurezza è stata salvata.'],
    h_keine_beispiele: ['Es sind keine Beispieldaten mehr da.', 'Non ci sono più dati di esempio.'],
    h_beispiel_frage: ['Alle Beispieleinträge verschwinden, eigene bleiben.',
      'Spariscono tutte le voci di esempio, le tue restano.'],
    h_beispiel_entfernt: ['Beispieldaten entfernt', 'Dati di esempio rimossi'],
    h_daten_ort: ['Die Daten liegen in diesem Gerät ({art}).',
      'I dati sono salvati su questo dispositivo ({art}).'],
    h_betrieb_fehlt: ['Der Betrieb braucht einen Namen.', 'Il locale ha bisogno di un nome.'],
    h_pin_regel: ['Die Chef-PIN muss aus 4 bis 8 Ziffern bestehen.',
      'Il PIN del titolare deve avere da 4 a 8 cifre.'],
    h_pin_falsch: ['Diese PIN stimmt nicht. Beim ersten Start ist sie 1234.',
      'PIN errato. Al primo avvio è 1234.'],
    h_erst_datei: ['Erst eine Datei wählen oder eine Tabelle einfügen.',
      'Prima scegli un file o incolla una tabella.'],
    h_wunsch: ['Wunsch', 'Richiesta'],
    h_termin_erledigt: ['Termin erledigt', 'Appuntamento fatto'],
    h_niemand_erreichbar: ['Bei niemandem ist dafür etwas hinterlegt. Nummer oder E-Mail '
      + 'im Team beim Mitarbeiter eintragen.',
      'Nessuno ha questo dato. Aggiungi numero o e-mail nella scheda del dipendente (Squadra).'],

    /* --- Meldungen --- */
    gespeichert: ['Gespeichert.', 'Salvato.'],
    geloescht: ['Gelöscht.', 'Eliminato.'],
    kopiert: ['In die Zwischenablage kopiert.', 'Copiato negli appunti.'],
    wirklich_loeschen: ['Wirklich löschen?', 'Eliminare davvero?'],
    nichts_gewaehlt: ['Es ist nichts ausgewählt.', 'Non hai selezionato nulla.'],

    /* --- Allgemein, mehrfach benutzt --- */
    name: ['Name', 'Nome'],
    morgen: ['Morgen', 'Domani'],
    kw: ['KW', 'Sett.'],
    um_uhr: [' um {zeit} Uhr', ' alle {zeit}'],
    schichten_klein: ['Schichten', 'turni'],
    sprache_de: ['Deutsch', 'Tedesco'],
    sprache_it: ['Italiano', 'Italiano'],
    sprache_titel: ['Deutsch / Italiano', 'Tedesco / Italiano'],
    untertitel: ['Personal & Dienstplan', 'Personale e turni'],
    pc_handy_weiter: ['Auf dem Handy geht es hier weiter:', 'Sul cellulare si continua qui:'],
    pc_handy_fassung: ['Handy-Fassung', 'Versione cellulare'],
    pc_mitarbeiter_app: ['Mitarbeiter-App', 'App dei dipendenti'],
    h_zur_team_app: ['Zur Mitarbeiter-App', "All’app dei dipendenti"],
    h_pc_fassung: ['PC-Fassung', 'Versione PC'],
    titel_pc: ['PizzaPlan · PC-Fassung', 'PizzaPlan · versione PC'],
    titel_handy: ['PizzaPlan · Handy', 'PizzaPlan · cellulare'],
    tm_mikro_hinweis: ['Auf das Mikrofon tippen und zum Beispiel sagen: „Morgen um 14 Uhr Termin beim '
      + 'Steuerberater, eine Stunde vorher erinnern.“',
      'Tocca il microfono e di’ per esempio: «Domani alle 14 dal commercialista, ricordami due ore '
      + 'prima.»'],

    /* --- Gespeicherte Werte, die übersetzt angezeigt werden (siehe T.wert) --- */
    wa_frei: ['Frei-Wunsch', 'Giorno libero'],
    wa_urlaub: ['Urlaub', 'Ferie'],
    wa_krank: ['Krank', 'Malattia'],
    wa_schule: ['Schule', 'Scuola'],
    wa_termin: ['Termin', 'Appuntamento'],
    wa_sonstiges: ['Sonstiges', 'Altro'],
    vt_vollzeit: ['Vollzeit', 'Tempo pieno'],
    vt_teilzeit: ['Teilzeit', 'Part-time'],
    vt_minijob: ['Minijob', 'Minijob'],
    vt_aushilfe: ['Aushilfe', 'Lavoro occasionale'],
    vt_azubi: ['Azubi', 'Apprendista'],
    vt_werkstudent: ['Werkstudent', 'Studente lavoratore'],
    po_kueche: ['Küche', 'Cucina'],
    po_pizzaofen: ['Pizzaofen', 'Forno pizza'],
    po_service: ['Service', 'Sala'],
    po_theke: ['Theke', 'Banco'],
    po_lieferung: ['Lieferung', 'Consegne'],
    po_spuele: ['Spüle', 'Lavaggio'],
    po_leitung: ['Leitung', 'Responsabile'],
    po_vorbereitung: ['Vorbereitung', 'Preparazione'],
    po_abendleitung: ['stellv. Abendleitung', 'Vice responsabile serale'],
    ka_allgemein: ['Allgemein', 'Generale'],
    ka_lieferant: ['Lieferant', 'Fornitore'],
    ka_behoerde: ['Behörde', 'Uffici pubblici'],
    ka_steuerberater: ['Steuerberater', 'Commercialista'],
    ka_wartung: ['Wartung', 'Manutenzione'],
    ka_personal: ['Personal', 'Personale'],
    ka_privat: ['Privat', 'Privato'],
    qu_stempel: ['Stempel', 'Timbratura'],
    qu_korrektur: ['Korrektur', 'Correzione'],
    wdh_keine: ['einmalig', 'una volta'],
    wdh_taeglich: ['täglich', 'ogni giorno'],
    wdh_woechentlich: ['wöchentlich', 'ogni settimana'],
    wdh_monatlich: ['monatlich', 'ogni mese'],

    /* --- Rückgängig-Streifen und Aktionen --- */
    r_einst_geaendert: ['Einstellungen geändert', 'Impostazioni modificate'],
    r_ma_geaendert: ['Mitarbeiter geändert', 'Dipendente modificato'],
    r_ma_angelegt: ['Mitarbeiter angelegt', 'Dipendente aggiunto'],
    r_ma_entfernt: ['Mitarbeiter „{name}“ entfernt', 'Dipendente «{name}» rimosso'],
    r_ma_eingelesen: ['{n} Mitarbeiter eingelesen', '{n} dipendenti importati'],
    r_schicht_geaendert: ['Schicht geändert', 'Turno modificato'],
    r_schicht_angelegt: ['Schicht angelegt', 'Turno creato'],
    r_schicht_geloescht: ['Schicht gelöscht', 'Turno eliminato'],
    r_schicht_verschoben: ['Schicht verschoben', 'Turno spostato'],
    r_woche_uebernommen: ['Woche übernommen', 'Settimana copiata'],
    r_freigabe_zurueck: ['Freigabe zurückgenommen', 'Pubblicazione annullata'],
    r_woche_geleert: ['Woche geleert', 'Settimana svuotata'],
    r_eintrag_geaendert: ['Eintrag geändert', 'Voce modificata'],
    r_wunsch_eingetragen: ['Wunsch eingetragen', 'Richiesta inserita'],
    r_eintrag_geloescht: ['Eintrag gelöscht', 'Voce eliminata'],
    r_zeit_geaendert: ['Zeit geändert', 'Orario modificato'],
    r_zeit_nachgetragen: ['Zeit nachgetragen', 'Orario aggiunto'],
    r_zeit_geloescht: ['Zeit gelöscht', 'Orario eliminato'],
    r_zeit_freigegeben: ['Zeit freigegeben', 'Orario approvato'],
    r_zeiten_freigegeben: ['Zeiten freigegeben', 'Ore approvate'],
    r_eingestempelt: ['eingestempelt', 'entrata timbrata'],
    r_ausgestempelt: ['ausgestempelt', 'uscita timbrata'],
    r_termin_geaendert: ['Termin geändert', 'Appuntamento modificato'],
    r_termin_angelegt: ['Termin angelegt', 'Appuntamento creato'],
    r_termin_geloescht: ['Termin gelöscht', 'Appuntamento eliminato'],
    r_termin_offen: ['Termin wieder offen', 'Appuntamento riaperto'],
    r_sicherung_eingespielt: ['Sicherung eingespielt', 'Copia di sicurezza ripristinata'],
    r_alles_geloescht: ['alle Daten gelöscht', 'tutti i dati eliminati'],
    r_vorlage_gespeichert: ['Vorlage gespeichert', 'Modello salvato'],
    r_vorlage_geloescht: ['Vorlage gelöscht', 'Modello eliminato'],

    /* --- Meldungen aus dem Datenkern (kern.js) --- */
    k_nichts_rueck: ['Es gibt nichts zum Rückgängigmachen.', 'Non c\'è nulla da annullare.'],
    k_name_fehlt: ['Bitte einen Namen eintragen.', 'Inserisci un nome.'],
    k_email_falsch: ['Die E-Mail-Adresse sieht nicht richtig aus.',
      'L\'indirizzo e-mail non sembra corretto.'],
    k_name_doppelt: ['„{name}“ steht schon im Team.', '«{name}» è già nella squadra.'],
    k_ma_weg: ['Diesen Mitarbeiter gibt es nicht mehr.', 'Questo dipendente non esiste più.'],
    k_ma_inaktiv: ['Für {name} sind Arbeitszeiten erfasst – der Eintrag wurde deshalb nur '
      + 'auf inaktiv gesetzt.',
      'Per {name} ci sono ore registrate: per questo è stato solo disattivato.'],
    k_ma_entfernt: ['{name} wurde entfernt.', '{name} è stato rimosso.'],
    k_imp_leer: ['In der Datei stand keine einzige Zeile.', 'Nel file non c\'è nemmeno una riga.'],
    k_imp_kein_name: ['kein Name', 'manca il nome'],
    k_imp_doppelt: ['steht in der Datei doppelt', 'compare due volte nel file'],
    k_imp_vorhanden: ['gibt es schon als „{name}“ – wird ergänzt',
      'esiste già come «{name}» – viene completato'],
    k_imp_email: ['E-Mail-Adresse sieht komisch aus', 'indirizzo e-mail non valido'],
    k_imp_plz: ['PLZ hat nicht 5 Ziffern', 'il CAP non ha 5 cifre'],
    k_plz_komisch: ['Die PLZ hat nicht 5 Ziffern – bitte kurz prüfen.',
      'Il CAP non ha 5 cifre – controlla per favore.'],
    k_imp_mindestlohn: ['Stundenlohn liegt unter dem Mindestlohn', 'paga oraria sotto il salario minimo'],
    k_imp_nichts: ['Es ist keine übernehmbare Zeile ausgewählt.',
      'Non è selezionata nessuna riga da importare.'],
    k_ueberschneidung: ['Überschneidet sich mit {zeit} ({pos}).', 'Si sovrappone al turno {zeit} ({pos}).'],
    k_ueberschneidung_tag: ['Überschneidet sich mit {zeit} am {datum} ({pos}).',
      'Si sovrappone al turno {zeit} del {datum} ({pos}).'],
    k_wunsch_genehmigt: ['An diesem Tag ist {typ} genehmigt.', 'In questo giorno è approvato: {typ}.'],
    k_wunsch_offen: ['Für diesen Tag liegt ein offener Wunsch vor: {typ}.',
      'Per questo giorno c\'è una richiesta aperta: {typ}.'],
    k_ruhe_vortag: ['Nur {std} Stunden Ruhezeit nach der Schicht am Vortag ({soll} empfohlen).',
      'Solo {std} ore di riposo dopo il turno del giorno prima ({soll} consigliate).'],
    k_ruhe_folgetag: ['Nur {std} Stunden Ruhezeit bis zur Schicht am Folgetag ({soll} empfohlen).',
      'Solo {std} ore di riposo prima del turno del giorno dopo ({soll} consigliate).'],
    k_wochenstunden: ['Damit sind es {std} Stunden in dieser Woche – vereinbart sind {soll}.',
      'Così questa settimana sono {std} ore – quelle concordate sono {soll}.'],
    k_datum_fehlt: ['Bitte ein Datum wählen.', 'Scegli una data.'],
    k_uhrzeit_fehlt: ['Bitte Anfang und Ende als Uhrzeit eintragen.',
      'Inserisci l\'ora di inizio e di fine.'],
    k_keine_arbeitszeit_pruefen: ['Diese Zeiten ergeben keine Arbeitszeit. Bitte Anfang, Ende und '
      + 'Pause prüfen.',
      'Con questi orari non risulta tempo di lavoro. Controlla inizio, fine e pausa.'],
    k_keine_arbeitszeit: ['Diese Zeiten ergeben keine Arbeitszeit.',
      'Con questi orari non risulta tempo di lavoro.'],
    k_schicht_weg: ['Diese Schicht gibt es nicht mehr.', 'Questo turno non esiste più.'],
    k_gleiche_woche: ['Quelle und Ziel sind dieselbe Woche.',
      'Origine e destinazione sono la stessa settimana.'],
    k_ma_waehlen: ['Bitte einen Mitarbeiter wählen.', 'Scegli un dipendente.'],
    k_ende_vor_anfang: ['Das Ende liegt vor dem Anfang.', 'La fine è prima dell\'inizio.'],
    k_schicht_geplant_am: ['Am {datum} ist bereits eine Schicht geplant.',
      'Il {datum} è già previsto un turno.'],
    k_status_unbekannt: ['Unbekannter Status.', 'Stato sconosciuto.'],
    k_beginn_fehlt: ['Bitte den Beginn eintragen.', 'Inserisci l\'ora di inizio.'],
    k_schon_schicht: ['Es läuft schon eine Schicht. Bitte zuerst Feierabend stempeln.',
      'C\'è già un turno in corso. Prima timbra l\'uscita.'],
    k_kommen_um: ['Kommen gestempelt um {zeit} Uhr.', 'Entrata timbrata alle {zeit}.'],
    k_keine_schicht_laeuft: ['Gerade läuft keine Schicht.', 'Al momento non c\'è nessun turno in corso.'],
    k_zu_lange: ['Eingestempelt seit {datum}, {zeit} Uhr – das sind 24 Stunden oder mehr. Bitte die '
      + 'Zeit vom Chef eintragen lassen.',
      'Entrata timbrata il {datum} alle {zeit}: sono 24 ore o più. Fai inserire l\'orario dal '
      + 'titolare.'],
    k_feierabend_um: ['Feierabend um {zeit} Uhr – {std} Stunden.', 'Uscita alle {zeit} – {std} ore.'],
    k_aktion_unbekannt: ['Unbekannte Aktion.', 'Azione sconosciuta.'],
    k_monat_fehlt: ['Bitte einen Monat wählen.', 'Scegli un mese.'],
    k_titel_fehlt: ['Bitte einen Titel eintragen.', 'Inserisci un titolo.'],
    k_zeitraum_fehlt: ['Bitte einen Zeitraum wählen.', 'Scegli un periodo.'],
    k_mind_ein_ma: ['Bitte mindestens einen Mitarbeiter auswählen.', 'Seleziona almeno un dipendente.'],
    k_keine_tel: ['keine Telefonnummer hinterlegt', 'nessun numero di telefono'],
    k_keine_mail: ['keine E-Mail-Adresse hinterlegt', 'nessun indirizzo e-mail'],
    k_keine_sicherung: ['Das ist keine PizzaPlan-Sicherung.',
      'Questa non è una copia di sicurezza di PizzaPlan.'],
    k_team_fehlt: ['In der Datei fehlt das Team.', 'Nel file manca la squadra.'],
    k_zugang_ungueltig: ['Dieser Zugang gilt nicht mehr.', 'Questo accesso non è più valido.'],
    k_link_ungueltig: ['Dieser Link gilt nicht mehr. Bitte beim Chef melden.',
      'Questo link non è più valido. Rivolgiti al titolare.'],
    k_vorlage_name: ['Bitte einen Namen für die Vorlage eintragen.', 'Inserisci un nome per il modello.'],
    k_speicher_gross: ['Browserspeicher (groß)', 'memoria del browser (grande)'],
    k_speicher_klein: ['Browserspeicher (klein)', 'memoria del browser (piccola)'],
    k_speicher_ram: ['Arbeitsspeicher', 'memoria temporanea'],

    /* --- Sprachbefehle (kern.js) --- */
    k_nichts_verstanden: ['Es wurde nichts verstanden. Bitte noch einmal sprechen.',
      'Non ho capito nulla. Riprova a parlare.'],
    k_plan_am: ['Dienstplan am {datum}', 'Piano turni del {datum}'],
    k_niemand_am_tag: ['Für diesen Tag ist niemand eingeplant.', 'Per questo giorno non è in turno nessuno.'],
    k_unklar_datum: ['Datum – auf heute gesetzt', 'Data – impostata a oggi'],
    k_unklar_anfang: ['Anfang – 17:00 angenommen', 'Inizio – considerate le 17:00'],
    k_unklar_ende: ['Ende – 5 Stunden angenommen', 'Fine – considerate 5 ore'],
    k_unklar_namen: ['mehrere Namen erkannt: {namen}', 'riconosciuti più nomi: {namen}'],
    k_unklar_uhrzeit: ['Uhrzeit', 'Ora'],
    k_bes_abw: ['{name}: {typ} ab {datum}', '{name}: {typ} dal {datum}'],
    k_bes_bis: [' bis {datum}', ' al {datum}'],
    k_nichts_streichen: ['Nichts zu streichen', 'Niente da cancellare'],
    k_nicht_eingeplant: ['{name} ist am {datum} gar nicht eingeplant.', '{name} il {datum} non è in turno.'],
    k_bes_streichen: ['Schicht von {name} am {datum}, {zeit} streichen',
      'Cancellare il turno di {name} del {datum}, {zeit}'],
    k_bes_schicht: ['{name} am {datum} von {von} bis {bis} Uhr ({pos})',
      '{name} il {datum} dalle {von} alle {bis} ({pos})'],
    k_bes_termin: ['Termin „{titel}“ am {datum}', 'Appuntamento «{titel}» il {datum}'],
    k_nicht_verstanden: ['Das habe ich nicht verstanden. Zum Beispiel: „Teile Annik am 5.6. um 17 Uhr '
      + 'ein“, „Filippo hat morgen frei“, „Streiche Valeria am Freitag“, „Wer arbeitet am Samstag?“',
      'Non ho capito. Per esempio: «Metti Annik il 5.6. alle 17», «Filippo domani è libero», '
      + '«Cancella Valeria venerdì», «Chi lavora sabato?»'],
    k_schicht_eingetragen: ['Schicht eingetragen: {text}', 'Turno inserito: {text}'],
    k_schicht_gestrichen: ['Schicht gestrichen.', 'Turno cancellato.'],
    k_eingetragen: ['Eingetragen: {text}', 'Inserito: {text}'],
    k_termin_gespeichert: ['Termin gespeichert: {titel}', 'Appuntamento salvato: {titel}'],
    k_befehl_unmoeglich: ['Dieser Befehl lässt sich nicht ausführen.',
      'Questo comando non si può eseguire.'],

    /* --- Bausteine der Oberfläche (oberflaeche.js) --- */
    ui_kopieren_nicht: ['Das Kopieren hat der Browser nicht erlaubt.',
      'Il browser non ha permesso di copiare.'],
    ui_datei_unlesbar: ['Die Datei ließ sich nicht lesen.', 'Non è stato possibile leggere il file.'],

    /* --- Eingabefenster (masken.js) --- */
    m_kurz_pruefen: ['Bitte kurz prüfen', 'Controlla un attimo'],
    m_aufgefallen: ['Gespeichert ist alles. Dabei ist aufgefallen:',
      'È stato salvato tutto. Però abbiamo notato:'],
    m_verstanden: ['Verstanden', 'Capito'],
    m_frei_eintragen: ['frei eintragen', 'inserisci a mano'],
    m_pause_faellig: [' · gesetzlich wären <b>{min} Minuten</b> Pause fällig',
      ' · per legge spetterebbero <b>{min} minuti</b> di pausa'],
    m_noch_keine_arbeitszeit: ['Diese Zeiten ergeben noch keine Arbeitszeit.',
      'Con questi orari non risulta ancora tempo di lavoro.'],
    m_vorlage_bearbeiten: ['Vorlage bearbeiten', 'Modifica modello'],
    m_vorlage_neu: ['Neue Vorlage', 'Nuovo modello'],
    m_pin_app: ['PIN für die Mitarbeiter-App', 'PIN per l\'app dei dipendenti'],
    m_eintrag_bearbeiten: ['Eintrag bearbeiten', 'Modifica la voce'],
    m_geprueft_frei: ['geprüft und freigegeben', 'controllato e approvato'],
    m_zeit_bearbeiten: ['Zeit bearbeiten', 'Modifica orario'],
    m_termin_bearbeiten: ['Termin bearbeiten', 'Modifica appuntamento'],
    m_vorher_tag: ['{n} Tag(e) vorher', '{n} giorno prima'],
    m_vorher_tage: ['{n} Tag(e) vorher', '{n} giorni prima'],
    m_vorher_std: ['{n} Std. vorher', '{n} ora prima'],
    m_vorher_stdn: ['{n} Std. vorher', '{n} ore prima'],
    m_vorher_min: ['{n} Min. vorher', '{n} min prima'],
    m_erinnerung_keine: ['keine', 'nessuno'],
    m_erinnerung_15: ['15 Minuten vorher', '15 minuti prima'],
    m_erinnerung_30: ['30 Minuten vorher', '30 minuti prima'],
    m_erinnerung_60: ['1 Stunde vorher', '1 ora prima'],
    m_erinnerung_120: ['2 Stunden vorher', '2 ore prima'],
    m_erinnerung_1440: ['1 Tag vorher', '1 giorno prima'],
    m_erinnerung_2880: ['2 Tage vorher', '2 giorni prima'],
    m_in_minuten: ['in {n} Minuten', 'tra {n} minuti'],
    m_jetzt_an: ['liegt gerade an', 'è adesso'],
    m_schlummern: ['In 10 Minuten nochmal', 'Ricordamelo tra 10 minuti'],
    m_gesehen: ['Gesehen', 'Visto'],
    m_import_rueck: ['{neu} neu · {geaendert} ergänzt', '{neu} nuovi · {geaendert} aggiornati'],
    m_versand_fehlt: ['Für die Auswahl fehlen Telefonnummern oder E-Mail-Adressen.',
      'Per la selezione mancano numeri di telefono o indirizzi e-mail.'],
    m_versand_info: ['Für jeden Mitarbeiter öffnet sich ein Fenster mit dem fertigen Text. '
      + 'Abgeschickt wird erst dort – hier passiert noch nichts.',
      'Per ogni dipendente si apre una finestra con il testo già pronto. L\'invio avviene solo '
      + 'lì: qui non succede ancora nulla.'],
    m_alle_nacheinander: ['Alle nacheinander', 'Tutti uno dopo l\'altro'],
    m_nachrichten_offen: ['{n} Nachrichten wurden geöffnet.', 'Sono stati aperti {n} messaggi.'],
    m_kein_mikro: ['Dieser Browser kann nicht zuhören. In Chrome, Edge oder Safari klappt es.',
      'Questo browser non può ascoltare. Funziona con Chrome, Edge o Safari.'],
    m_hoere: ['Ich höre zu …', 'Ti ascolto …'],
    m_nichts_an: ['Es kam nichts an. Bitte noch einmal.', 'Non è arrivato nulla. Riprova.'],
    m_mikro_tippen: ['Auf das Mikrofon tippen und sprechen.', 'Tocca il microfono e parla.'],
    m_richtig_verstanden: ['Habe ich das richtig verstanden?', 'Ho capito bene?'],
    m_unsicher: ['Unsicher: ', 'Da verificare: '],
    m_ja_eintragen: ['Ja, eintragen', 'Sì, inserisci'],

    /* --- Mitarbeiter-App (team.js) --- */
    wunsch_melden_titel: ['Frei-Wunsch oder Abwesenheit melden', 'Segnala un giorno libero o un\'assenza'],
    tm_eintrag_aendern: ['Eintrag ändern', 'Modifica la richiesta'],
    tm_pin_falsch: ['Die PIN stimmt nicht. Bitte beim Chef melden.', 'PIN sbagliato. Chiedi al titolare.'],
    tm_eingestempelt_seit: ['Eingestempelt seit {zeit} Uhr', 'Entrata alle {zeit}'],
    tm_nicht_eingestempelt: ['Du bist nicht eingestempelt.', 'Non hai timbrato l\'entrata.'],
    tm_heute_nichts: ['Heute noch nichts erfasst.', 'Oggi ancora niente.'],
    keine_schicht_ueberhaupt: ['Für dich ist gerade keine Schicht eingeplant. Sobald der Chef den '
      + 'Plan freigibt, steht sie hier.',
      'Al momento non hai turni. Appena il titolare pubblica il piano, li trovi qui.'],
    naechste_folgewoche: ['Das ist deine nächste:', 'Ecco il tuo prossimo:'],
    tm_pause_frage: ['Angefangen um {zeit} Uhr. Wie lange war die Pause?',
      'Hai iniziato alle {zeit}. Quanta pausa hai fatto?'],
    tm_wunsch_tippen: ['Oben tippen, um einen freien Tag zu melden.',
      'Tocca il pulsante in alto per segnalare un giorno libero.'],
    tm_schon_entschieden: ['Dieser Eintrag ist schon entschieden – bitte beim Chef melden.',
      'Questa richiesta è già stata decisa.'],
    tm_pro_stunde: ['pro Stunde', 'all\'ora'],
    tm_rechenhilfe: ['Rechenhilfe – das ist keine Lohnabrechnung.',
      'Calcolo indicativo, non è la busta paga.'],
    tm_daten_chef: ['Wochenstunden, Urlaubstage und Kontaktdaten werden in der Chef-Fassung '
      + 'eingetragen.',
      'Ore settimanali, ferie e contatti si inseriscono nella versione del titolare.'],
    tm_app_schon: ['Die App liegt schon auf deinem Home-Bildschirm. 👍',
      'L\'app è già sulla tua schermata Home. 👍'],
    tm_iphone_wie: ['Auf dem iPhone in Safari unten auf „Teilen“ (Kästchen mit Pfeil) tippen, '
      + 'dann „Zum Home-Bildschirm“.',
      'Su iPhone in Safari tocca „Condividi“ in basso (quadrato con freccia), poi '
      + '„Aggiungi alla schermata Home“.'],
    tm_pin_regel: ['Die PIN muss aus 4 bis 8 Ziffern bestehen.', 'Il PIN deve avere da 4 a 8 cifre.'],

    /* --- PC-Fassung: Meldungen und Hilfe (pc.js) --- */
    pc_hilfe_titel: ['Kurz erklärt', 'In breve'],
    pc_h_tasten: ['Tasten', 'Tasti'],
    pc_h_woche: ['eine Woche zurück oder vor', 'una settimana indietro o avanti'],
    pc_h_neu: ['neue Schicht', 'nuovo turno'],
    pc_h_fenster: ['dieses Fenster', 'questa finestra'],
    pc_h_enter_taste: ['Enter', 'Invio'],
    pc_h_enter: ['im Fenster: speichern bzw. bestätigen', 'nella finestra: salva o conferma'],
    pc_h_esc: ['Fenster schließen, ohne zu speichern', 'chiudi la finestra senza salvare'],
    pc_h_plan: ['Im Dienstplan', 'Nel piano turni'],
    pc_h_l1: ['Leere Zelle anklicken → neue Schicht für diese Person an diesem Tag.',
      'Clic su una cella vuota → nuovo turno per questa persona in questo giorno.'],
    pc_h_l2: ['Schicht anklicken → bearbeiten.', 'Clic su un turno → modifica.'],
    pc_h_l3: ['Schicht mit der Maus in eine andere Zelle ziehen → verschieben.',
      'Trascina un turno con il mouse in un\'altra cella → sposta.'],
    pc_h_l4: ['Vorlage aus der linken Spalte in eine Zelle ziehen → Schicht in einem Zug.',
      'Trascina un modello dalla colonna di sinistra in una cella → turno in un attimo.'],
    pc_h_l5: ['Gestrichelt umrandet heißt: noch nicht freigegeben, das Team sieht sie nicht.',
      'Bordo tratteggiato significa: non ancora pubblicato, la squadra non lo vede.'],
    pc_h_l6: ['⚠ auf einer Schicht heißt: es gibt einen Hinweis, z. B. zu wenig Ruhezeit.',
      '⚠ su un turno significa: c\'è un avviso, ad es. poco riposo.'],
    pc_h_schief: ['Wenn etwas schiefgeht', 'Se qualcosa va storto'],
    pc_h_rueck: ['Nach jeder Änderung erscheint unten kurz ein Streifen mit <b>Rückgängig</b>. '
      + 'Ein Klick darauf stellt den Zustand davor wieder her.',
      'Dopo ogni modifica compare per poco in basso una barra con <b>Annulla modifica</b>. '
      + 'Un clic ripristina lo stato precedente.'],
    pc_tt_hinweise: ['Es gibt Hinweise', 'Ci sono avvisi'],
    pc_vorwoche_frage: ['Die Schichten der Woche davor werden in diese Woche kopiert – als Entwurf, '
      + 'noch nicht freigegeben. Bereits vorhandene Schichten bleiben unberührt.',
      'I turni della settimana precedente vengono copiati in questa settimana come bozza, non '
      + 'ancora pubblicati. I turni già presenti restano invariati.'],
    pc_uebernommen_n: ['{n} Schichten übernommen.', '{n} turni copiati.'],
    pc_zurueckgezogen: ['Schichten wieder zurückgezogen.', 'turni riportati in bozza.'],
    pc_nichts_aendern: ['Es gab nichts zu ändern.', 'Non c\'era nulla da cambiare.'],
    pc_leeren_frage: ['Alle Schichten dieser Woche werden entfernt. Mit „Rückgängig“ lässt sich '
      + 'das gleich danach zurücknehmen.',
      'Tutti i turni di questa settimana vengono eliminati. Con «Annulla modifica» puoi '
      + 'ripristinarli subito dopo.'],
    pc_entfernt_n: ['{n} Schichten entfernt', '{n} turni eliminati'],
    pc_zeiten_frei_n: ['{n} Zeiten geprüft und freigegeben.', '{n} orari controllati e approvati.'],
    pc_beispiel: ['Beispiel', 'Esempio'],
    pc_nicht_mehr_da: ['nicht mehr da', 'non lavora più qui'],
    pc_seit_datum: [' · seit {datum}', ' · dal {datum}'],
    pc_vorlage_downloads: ['Die Vorlage liegt jetzt in den Downloads.',
      'Il modello è nella cartella Download.'],
    pc_urlaub_n: ['{n} Urlaub', '{n} gg. di ferie'],
    pc_krank_n: ['{n} krank', '{n} gg. di malattia'],
    pc_von_betrag: ['von {betrag}', 'su {betrag}'],
    pc_auswertung_satz: ['Auf eine Zeile klicken zeigt die einzelnen Tage. Zuschläge: Sonntag {so} %, '
      + 'Nacht {na} % ab {ab} Uhr. Diese Übersicht ist eine Rechenhilfe und ersetzt keine '
      + 'Lohnabrechnung.',
      'Clicca su una riga per vedere i singoli giorni. Maggiorazioni: domenica {so} %, notte {na} % '
      + 'dalle {ab}. Questo riepilogo è solo un aiuto di calcolo e non sostituisce la busta paga.'],
    pc_csv_downloads: ['Die Datei liegt in den Downloads und öffnet sich in Excel.',
      'Il file è nella cartella Download e si apre in Excel.'],
    pc_fehlen_nummern: ['Für die Auswahl fehlen Nummern oder Adressen.',
      'Per la selezione mancano numeri o indirizzi.'],
    pc_so_sieht: ['So sieht die Nachricht aus · {name}', 'Ecco come appare il messaggio · {name}'],
    pc_bereit: ['{a} von {b} Nachrichten sind versandbereit.', '{a} messaggi su {b} sono pronti da inviare.'],
    pc_daten_ort: ['Die Daten liegen in diesem Gerät ({art}). Eine Sicherungskopie ab und zu schadet '
      + 'nie.',
      'I dati sono salvati su questo dispositivo ({art}). Una copia di sicurezza ogni tanto non '
      + 'guasta mai.'],
    pc_sicherung_downloads: ['Die Sicherung liegt jetzt in den Downloads.',
      'La copia di sicurezza è nella cartella Download.'],
    pc_sicherung_frage: ['Der jetzige Stand wird durch die Sicherung ersetzt. Fortfahren?',
      'I dati attuali vengono sostituiti dalla copia di sicurezza. Continuare?'],
    pc_eingespielt: ['{n} Mitarbeiter eingespielt.', '{n} dipendenti ripristinati.'],
    pc_beispiel_frage: ['Alle Einträge, die beim ersten Start als Beispiel angelegt wurden, '
      + 'verschwinden. Eigene Eingaben bleiben.',
      'Spariscono tutte le voci create come esempio al primo avvio. I tuoi dati restano.'],
    pc_alles_frage: ['Team, Dienstpläne, Zeiten und Termine werden gelöscht. Das lässt sich nur '
      + 'direkt danach mit „Rückgängig“ zurücknehmen. Wirklich löschen?',
      'Squadra, piani, ore e appuntamenti vengono eliminati. Si può annullare solo subito dopo '
      + 'con «Annulla modifica». Eliminare davvero?'],
    pc_alles_geloescht: ['Alle Daten gelöscht', 'Tutti i dati eliminati'],

    /* --- Gemeinsamer Server (verbindung.js) --- */
    sv_titel: ['Server', 'Server'],
    sv_geraet_verbinden: ['Gerät verbinden', 'Collega il dispositivo'],
    sv_schluessel: ['Betriebsschlüssel', 'Chiave del locale'],
    sv_schluessel_erklaerung: ['Damit dieses Gerät denselben Plan sieht wie alle anderen, einmal den '
      + 'Betriebsschlüssel eintragen. Du bekommst ihn als Einrichtungslink oder auf einem Zettel. '
      + 'Danach merkt sich das Gerät den Schlüssel.',
      'Perché questo dispositivo veda lo stesso piano di tutti gli altri, inserisci una volta la '
      + 'chiave del locale. La ricevi come link di configurazione o su un foglietto. Poi il '
      + 'dispositivo se la ricorda.'],
    sv_verbinden: ['Verbinden', 'Collega'],
    sv_schluessel_leer: ['Bitte den Betriebsschlüssel eintragen.', 'Inserisci la chiave del locale.'],
    sv_schluessel_falsch: ['Dieser Betriebsschlüssel stimmt nicht. Bitte noch einmal genau prüfen.',
      'Questa chiave del locale non è giusta. Controllala ancora una volta con calma.'],
    sv_schluessel_ungueltig: ['Der Betriebsschlüssel gilt nicht mehr. Bitte das Gerät in den '
      + 'Einstellungen abmelden und neu verbinden.',
      'La chiave del locale non vale più. Scollega il dispositivo nelle impostazioni e ricollegalo.'],
    sv_gesperrt: ['Zu viele falsche Versuche. Bitte in einigen Minuten noch einmal versuchen.',
      'Troppi tentativi sbagliati. Riprova tra qualche minuto.'],
    sv_kein_netz: ['Der Server ist gerade nicht erreichbar. Bitte die Internetverbindung prüfen und '
      + 'noch einmal versuchen.',
      'Il server in questo momento non risponde. Controlla la connessione a internet e riprova.'],
    sv_nochmal: ['Noch einmal versuchen', 'Riprova'],
    sv_start_titel: ['Erste Einrichtung', 'Prima configurazione'],
    sv_start_frage: ['Auf dem Server liegt noch kein Plan. Mit den Beispieldaten beginnen (zum '
      + 'Ausprobieren) oder leer starten? Die Einstellungen bleiben in beiden Fällen erhalten.',
      'Sul server non c’è ancora nessun piano. Vuoi iniziare con i dati di esempio (per provare) o '
      + 'partire da zero? Le impostazioni restano comunque.'],
    sv_mit_beispiel: ['Mit Beispieldaten', 'Con dati di esempio'],
    sv_leer: ['Leer starten', 'Parti da zero'],
    sv_verbunden: ['Mit dem Server verbunden', 'Collegato al server'],
    sv_offline: ['Offline – Änderungen gehen raus, sobald wieder Netz da ist',
      'Offline – le modifiche partono appena torna la rete'],
    sv_wird_uebertragen: ['Änderungen werden übertragen …', 'Invio delle modifiche …'],
    sv_fehler_kurz: ['Abgleich gestört', 'Sincronizzazione interrotta'],
    sv_zuletzt: ['letzte Sicherung {zeit}', 'ultimo salvataggio {zeit}'],
    sv_noch_nie: ['noch nicht gesichert', 'non ancora salvato'],
    sv_jetzt_abgleichen: ['Jetzt abgleichen', 'Sincronizza ora'],
    sv_abgeglichen: ['Abgeglichen – alles auf dem neuesten Stand.', 'Sincronizzato – tutto aggiornato.'],
    sv_einrichtungslink: ['Einrichtungslink kopieren', 'Copia link di configurazione'],
    sv_link_kopiert: ['Link kopiert. Nur an eigene Chef-Geräte geben – wer ihn hat, kann alles ändern.',
      'Link copiato. Dallo solo ai tuoi dispositivi – chi ce l’ha può modificare tutto.'],
    sv_abmelden: ['Gerät abmelden (Schlüssel entfernen)', 'Scollega il dispositivo (togli la chiave)'],
    sv_abmelden_frage: ['Dieses Gerät wird vom Server getrennt, Schlüssel und Daten im Gerät werden '
      + 'entfernt. Der Plan auf dem Server bleibt erhalten. Weiter?',
      'Questo dispositivo viene scollegato dal server, chiave e dati sul dispositivo vengono tolti. '
      + 'Il piano sul server resta. Continuare?'],
    sv_abmelden_offen: ['Achtung: Noch nicht alle Änderungen sind übertragen – sie gehen dabei verloren.',
      'Attenzione: non tutte le modifiche sono state inviate – andranno perse.'],
    sv_konflikt: ['Auf einem anderen Gerät wurde gerade geändert – neu geladen. Deine letzte '
      + 'Änderung bitte noch einmal eintragen.',
      'Su un altro dispositivo è appena cambiato qualcosa – ricaricato. Inserisci di nuovo la tua '
      + 'ultima modifica.'],
    sv_nicht_gespeichert: ['Die Änderung konnte auf dem Server nicht gespeichert werden. Bitte später '
      + 'noch einmal „Jetzt abgleichen“ tippen.',
      'Non è stato possibile salvare la modifica sul server. Più tardi tocca di nuovo «Sincronizza ora».'],
    sv_codes_neu: ['{n} Zugangslinks wurden sicherer gemacht – bitte diesen Mitarbeitern die '
      + 'Einladung neu schicken.',
      '{n} link di accesso sono stati resi più sicuri – manda di nuovo l’invito a questi dipendenti.'],
    sv_team_pin: ['PIN in der Mitarbeiter-App verlangen', 'Chiedi il PIN nell’app dei dipendenti'],
    sv_team_pin_hinweis: ['Aus: der persönliche Link reicht. An: zusätzlich die eigene PIN.',
      'Spento: basta il link personale. Acceso: serve anche il proprio PIN.'],

    /* --- Mitarbeiter-App am Server --- */
    tv_link_fehlt: ['Bitte öffne deinen persönlichen Link, den du vom Chef bekommen hast.',
      'Apri il tuo link personale che ti ha mandato il titolare.'],
    tv_link_ungueltig: ['Dieser Link gilt nicht (mehr). Bitte beim Chef einen neuen Link holen.',
      'Questo link non vale (più). Chiedi un link nuovo al titolare.'],
    tv_kein_netz: ['Keine Verbindung zum Server. Bitte gleich noch einmal versuchen.',
      'Nessuna connessione al server. Riprova tra poco.'],
    tv_wird_uebertragen: ['wird übertragen', 'invio in corso'],
    tv_offline: ['offline', 'offline'],
    tv_schon_bearbeitet: ['Nicht übernommen: Der Chef hat diesen Eintrag schon bearbeitet.',
      'Non salvato: il titolare ha già gestito questa voce.'],
    tv_nicht_erlaubt: ['Nicht übernommen: Diesen Eintrag darfst du nicht ändern.',
      'Non salvato: questa voce non puoi modificarla.'],
    tv_nicht_mehr_da: ['Nicht übernommen: Den Eintrag gibt es nicht mehr.',
      'Non salvato: questa voce non esiste più.'],
    tv_abgelehnt: ['Die Änderung wurde vom Server nicht angenommen.',
      'Il server non ha accettato la modifica.']
  };

  /* Gespeicherte Datenwerte bleiben deutsch (so rechnet und vergleicht der Kern),
     angezeigt werden sie in der gewählten Sprache. Eigene Werte bleiben, wie sie sind. */
  var WERTE = {
    'Frei-Wunsch': 'wa_frei', 'Urlaub': 'wa_urlaub', 'Krank': 'wa_krank', 'Schule': 'wa_schule',
    'Termin': 'wa_termin', 'Sonstiges': 'wa_sonstiges',
    'Vollzeit': 'vt_vollzeit', 'Teilzeit': 'vt_teilzeit', 'Minijob': 'vt_minijob',
    'Aushilfe': 'vt_aushilfe', 'Azubi': 'vt_azubi', 'Werkstudent': 'vt_werkstudent',
    'Küche': 'po_kueche', 'Pizzaofen': 'po_pizzaofen', 'Service': 'po_service', 'Theke': 'po_theke',
    'Lieferung': 'po_lieferung', 'Spüle': 'po_spuele', 'Leitung': 'po_leitung',
    'Vorbereitung': 'po_vorbereitung', 'stellv. Abendleitung': 'po_abendleitung',
    'Allgemein': 'ka_allgemein', 'Lieferant': 'ka_lieferant', 'Behörde': 'ka_behoerde',
    'Steuerberater': 'ka_steuerberater', 'Wartung': 'ka_wartung', 'Personal': 'ka_personal',
    'Privat': 'ka_privat',
    'Stempel': 'qu_stempel', 'Korrektur': 'qu_korrektur',
    'taeglich': 'wdh_taeglich', 'woechentlich': 'wdh_woechentlich', 'monatlich': 'wdh_monatlich'
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

  /* Gespeicherten Wert (z. B. „Urlaub“, „Teilzeit“, „Küche“) für die Anzeige übersetzen.
     Ohne Eintrag kommt der Wert unverändert zurück. Mit „sprache“ für Texte an Mitarbeiter. */
  function wert(w, sprache) {
    var k = WERTE[String(w === null || w === undefined ? '' : w).trim()];
    var e = k && W[k];
    if (!e) return w === null || w === undefined ? '' : w;
    return (sprache || jetzt) === 'it' ? e[1] : e[0];
  }

  /* Status eines einzelnen Wunsches: „offen“ heißt dort „aperta“ (Einzahl). */
  function status(s) { return t(s === 'offen' ? 'offen_eine' : s); }

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

  return {
    setze: setze, aktuell: aktuell, t: t, wert: wert, status: status,
    anwenden: anwenden, fehlende: fehlende, W: W
  };
})();

window.T = T;
