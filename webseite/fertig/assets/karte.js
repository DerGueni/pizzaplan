/* Stammdaten und Speisekarte Pizzeria Gabriel's, Postbauer-Heng
   Stand: www.pizza-gabriels.de, abgerufen 31.10.2026. Alle Entwürfe lesen nur aus dieser Datei. */
window.GABRIELS = {
  name: "Pizzeria Gabriel's",
  zusatz: "Café · Pizzeria · Ristorante",
  terrasse: true,
  ort: "Postbauer-Heng",
  strasse: "Centrum 12",
  plzOrt: "92353 Postbauer-Heng",
  telefon: "09188 541",
  telefonLink: "tel:+499188541",
  mail: "cafegabriels95@gmail.com",
  inhaber: "Gennaro Lo Giudice",
  ustId: "235/245/90018", /* ist die Steuernummer, keine USt-IdNr. */
  steuernummer: "235/245/90018",
  facebook: "https://www.facebook.com/Gabriels-168510146515009/",
  karteLink: "https://www.google.com/maps/search/?api=1&query=Pizzeria+Gabriel%27s+Centrum+12+92353+Postbauer-Heng",
  zeiten: [
    { tage: "Montag – Samstag", zeit: "16:00 – 22:00 Uhr", von: [1, 2, 3, 4, 5, 6], auf: "16:00", zu: "22:00" },
    { tage: "Sonntag", zeit: "12:00 – 22:00 Uhr", von: [0], auf: "12:00", zu: "22:00" }
  ],
  hinweis: "Jede weitere Zutat wird mit 1,00 € Aufpreis berechnet.",
  karte: [
    { id: "antipasti", titel: "Antipasti", untertitel: "Vorspeisen", gerichte: [
      { nr: "", name: "Bruschetta", text: "Geröstetes Brot mit Tomaten und Knoblauch", preis: 5.50, veg: true },
      { nr: "", name: "Antipasti", text: "Gegrilltes Gemüse, Garnelen auf Rucola", preis: 15.00 },
      { nr: "75", name: "Caprese", text: "Mozzarella mit Tomaten", preis: 12.50, veg: true, neu: true },
      { nr: "", name: "Carpaccio", text: "Dünne Rindfleischscheiben", preis: 14.00 }
    ]},
    { id: "insalata", titel: "Insalata", untertitel: "Salate", gerichte: [
      { nr: "60", name: "Insalata Schafskäse", text: "Gemischter Salat, gebackener Schafskäse, Parmaschinken", preis: 13.50 },
      { nr: "62", name: "Insalata Casareccia", text: "Hühnerbrust auf großem Salatbett", preis: 13.50 },
      { nr: "63", name: "Insalata Mista", text: "Gemischter Salat", preis: 9.50, veg: true },
      { nr: "64", name: "Insalata Scampi", text: "Gemischter Salat, Gemüse, Scampi", preis: 15.50 },
      { nr: "64", name: "Insalata Chicken Crossies", text: "Gemischter Salat, Chicken Crossies, Parmesanstücke", preis: 13.50 },
      { nr: "69", name: "Insalata Italia", text: "Gemischter Salat, Thunfisch, Schinken, Käse, Ei", preis: 13.50 }
    ]},
    { id: "pizza", titel: "Pizze", untertitel: "Frisch aus dem Ofen", gerichte: [
      { nr: "1", name: "Margherita", text: "Tomaten und Käse", preis: 12.50, veg: true },
      { nr: "2", name: "Salami", text: "Salami", preis: 13.50 },
      { nr: "5", name: "Marasciallo", text: "Basilikum, Knoblauch, Parmesan", preis: 13.50, veg: true },
      { nr: "6", name: "Prosciutto", text: "Schinken", preis: 13.50 },
      { nr: "8", name: "Regina", text: "Schinken, Champignons", preis: 13.50 },
      { nr: "9", name: "Mista", text: "Salami, Peperoni, Champignons", preis: 13.50 },
      { nr: "10", name: "Speciale", text: "Salami, Schinken, Champignons, Paprika", preis: 14.00 },
      { nr: "11", name: "Capricciosa", text: "Schinken, Champignons, Paprika", preis: 14.00 },
      { nr: "12", name: "Quattro Stagioni", text: "Schinken, Salami, Peperoni, Zwiebeln", preis: 14.00 },
      { nr: "13", name: "Hawaii", text: "Schinken, Ananas", preis: 14.00 },
      { nr: "14", name: "Tonno", text: "Thunfisch, Zwiebeln", preis: 14.00 },
      { nr: "15", name: "Vegetariana", text: "Champignons, Peperoni, Paprika, Kapern", preis: 14.00, veg: true },
      { nr: "16", name: "Gabriel's", text: "Salami, Champignons, Peperoni, Zwiebeln, Sardellen", preis: 14.00, haus: true },
      { nr: "17", name: "Parma", text: "Mozzarella, Parmaschinken", preis: 14.50 },
      { nr: "18", name: "Rustica", text: "Salami, Schinken, Champignons", preis: 14.00 },
      { nr: "20", name: "Caprese", text: "Frische Tomaten, Mozzarella, Rucola, Parmesanstücke", preis: 14.00, veg: true },
      { nr: "21", name: "Piccante", text: "Sardellen, Kapern, Peperoni", preis: 13.50 },
      { nr: "22", name: "della Casa", text: "Frische Tomaten, Zwiebeln, Knoblauch", preis: 13.50, veg: true },
      { nr: "23", name: "Calabria", text: "Schinken, Sardellen, Knoblauch", preis: 13.50 },
      { nr: "24", name: "Gorgonzola", text: "Gorgonzola", preis: 14.00, veg: true },
      { nr: "25", name: "Mit allem", text: "Alles drauf – ohne Fisch", preis: 14.50 },
      { nr: "26", name: "Calzone", text: "Gefüllt mit Salami, Schinken, Champignons", preis: 14.00 },
      { nr: "27", name: "Frutti di Mare", text: "Meeresfrüchte", preis: 15.00 },
      { nr: "28", name: "Carpaccio", text: "Dünne Rindfleischscheiben, Mozzarella, Parmesanstücke, Champignons", preis: 15.00 },
      { nr: "29", name: "Vincenzo", text: "Parmaschinken, Mozzarella, Rucola, Parmesanstücke", preis: 14.50 },
      { nr: "29", name: "Garnele", text: "Gemüse, Garnelen", preis: 15.50 },
      { nr: "152", name: "Quattro Formaggi", text: "Vier Käsesorten", preis: 14.00, veg: true },
      { nr: "154", name: "Napoli", text: "Scharfe Salami", preis: 14.50, scharf: true },
      { nr: "158", name: "Pastorello", text: "Schafskäse, Knoblauch, frische Tomaten, Schinken", preis: 14.00 }
    ]},
    { id: "pasta", titel: "Pasta", untertitel: "Nudelgerichte", gerichte: [
      { nr: "30", name: "Spaghetti Napoli", text: "Tomatensauce", preis: 13.00, veg: true },
      { nr: "31", name: "Spaghetti Bolognese", text: "Hackfleischsauce", preis: 13.50 },
      { nr: "32", name: "Spaghetti Carbonara", text: "Schinken, Käse, Ei", preis: 13.50 },
      { nr: "35", name: "Spaghetti Frutti di Mare", text: "Meeresfrüchte", preis: 15.00 },
      { nr: "37", name: "Rigatoni all'Arrabbiata", text: "Knoblauch, scharf", preis: 13.00, veg: true, scharf: true },
      { nr: "40", name: "Rigatoni Pasticciati", text: "Schinken, Erbsen, Champignons", preis: 13.50 },
      { nr: "41", name: "Penne alla Panna", text: "Schinken in Sahnesauce", preis: 13.00 }
    ]},
    { id: "forno", titel: "Al Forno", untertitel: "Aus dem Backofen", gerichte: [
      { nr: "47", name: "Lasagne al Forno", text: "Überbacken", preis: 13.50 },
      { nr: "49", name: "Cannelloni al Forno", text: "Überbacken", preis: 13.50 },
      { nr: "51", name: "Duetto", text: "Lasagne und Cannelloni", preis: 13.50 },
      { nr: "52", name: "Rigatoni al Forno", text: "Schinken, Champignons, Erbsen", preis: 13.50 },
      { nr: "56", name: "Crespelle", text: "Schafskäse, Spinat, überbacken", preis: 13.00, veg: true }
    ]},
    { id: "imbiss", titel: "Panzerotti", untertitel: "Imbiss", gerichte: [
      { nr: "105", name: "Panzerotti", text: "Schafskäse, Schinken, Tomaten, auf Salatbett", preis: 10.00 },
      { nr: "107", name: "Panzerotti", text: "Mozzarella, Tomaten, Schinken, auf Salatbett", preis: 10.00 },
      { nr: "108", name: "Panzerotti", text: "Mozzarella, Tomaten, Parmaschinken, Rucola, auf Salatbett", preis: 10.50 }
    ]},
    { id: "carne", titel: "Carne & Pesce", untertitel: "Fleisch und Fisch", gerichte: [
      { nr: "89", name: "Schnitzel Wiener Art", text: "Vom Schwein, mit Pommes frites und gemischtem Salat", preis: 15.50 },
      { nr: "110", name: "Calamari Fritti", text: "Gebackener Tintenfisch, Pommes frites, gemischter Salat", preis: 16.00 }
    ]},
    { id: "kinder", titel: "Bambini", untertitel: "Für unsere kleinen Gäste", gerichte: [
      { nr: "100", name: "Spaghetti „Diddl“", text: "Kleine Spaghetti Bolognese", preis: 9.00 },
      { nr: "101", name: "Schnitzel „Sieben Zwerge“", text: "Kleines Schnitzel mit Pommes frites", preis: 11.00 },
      { nr: "102", name: "Portion Pommes frites", text: "Mit Ketchup", preis: 5.50, veg: true }
    ]}
  ]
};
window.GABRIELS.preis = function (p) { return p.toFixed(2).replace(".", ",") + " €"; };
/* true, wenn gerade geöffnet (Ortszeit des Besuchers) */
window.GABRIELS.offen = function (d) {
  d = d || new Date();
  var hm = ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
  return window.GABRIELS.zeiten.some(function (z) {
    return z.von.indexOf(d.getDay()) >= 0 && hm >= z.auf && hm < z.zu;
  });
};
