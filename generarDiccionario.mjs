// generarDiccionario.mjs
// Uso: node generarDiccionario.mjs
//
// Genera src/app/fuentesMapas.mjs — la lista país -> URL REMOTA de
// origen en geoBoundaries. Este archivo es la "fuente de verdad" de
// dónde sale cada país. descargarMapas.mjs LEE de aquí y escribe el
// resultado final (rutas locales) en diccionarioMapas.js — nunca al
// revés — así puedes volver a ejecutar la descarga las veces que
// quieras sin perder las URLs de origen.
//
// Usamos directamente media.githubusercontent.com/media/... porque el
// repo de geoBoundaries guarda todos sus archivos con Git LFS desde la
// versión 5.0.0: raw.githubusercontent.com solo devuelve el puntero
// LFS (texto), no el geojson real.

import fs from "fs";

const paisesISO = {
  "Spain": "ESP", "France": "FRA", "Italy": "ITA", "Germany": "DEU",
  "Portugal": "PRT", "United Kingdom": "GBR", "Ireland": "IRL",
  "Netherlands": "NLD", "Belgium": "BEL", "Switzerland": "CHE",
  "Austria": "AUT", "Greece": "GRC", "Turkey": "TUR", "Poland": "POL",
  "Czechia": "CZE", "Czech Republic": "CZE", "Romania": "ROU",
  "Ukraine": "UKR", "Sweden": "SWE", "Norway": "NOR", "Finland": "FIN",
  "Denmark": "DNK", "Russia": "RUS", "Japan": "JPN", "China": "CHN",
  "India": "IND", "South Korea": "KOR", "North Korea": "PRK",
  "Philippines": "PHL", "Indonesia": "IDN", "Malaysia": "MYS",
  "Thailand": "THA", "Nepal": "NPL", "Pakistan": "PAK",
  "Afghanistan": "AFG", "Mongolia": "MNG", "Bhutan": "BTN",
  "Maldives": "MDV", "Brunei": "BRN", "Singapore": "SGP",
  "East Timor": "TLS", "Timor-Leste": "TLS",
  "Australia": "AUS", "New Zealand": "NZL", "Papua New Guinea": "PNG",
  "Fiji": "FJI", "Solomon Islands": "SLB", "Vanuatu": "VUT",
  "Samoa": "WSM", "Tonga": "TON", "Kiribati": "KIR",
  "United States of America": "USA", "United States": "USA",
  "Canada": "CAN", "Mexico": "MEX", "Brazil": "BRA",
  "Argentina": "ARG", "Chile": "CHL", "Colombia": "COL", "Peru": "PER",
  "Venezuela": "VEN", "Ecuador": "ECU", "Bolivia": "BOL",
  "Paraguay": "PRY", "Uruguay": "URY", "Guyana": "GUY",
  "Suriname": "SUR", "Cuba": "CUB", "Jamaica": "JAM", "Haiti": "HTI",
  "Dominican Republic": "DOM", "Bahamas": "BHS", "The Bahamas": "BHS",
  "Trinidad and Tobago": "TTO", "Belize": "BLZ",
  "Costa Rica": "CRI", "Panama": "PAN", "Guatemala": "GTM",
  "Honduras": "HND", "Nicaragua": "NIC", "El Salvador": "SLV",
  "South Africa": "ZAF", "Nigeria": "NGA", "Kenya": "KEN",
  "Morocco": "MAR", "Western Sahara": "ESH", "Egypt": "EGY",
  "Iceland": "ISL", "Croatia": "HRV", "Slovenia": "SVN",
  "Slovakia": "SVK", "Hungary": "HUN", "Bulgaria": "BGR",
  "Serbia": "SRB", "Bosnia and Herzegovina": "BIH",
  "Montenegro": "MNE", "North Macedonia": "MKD", "Macedonia": "MKD",
  "Kosovo": "XKX", "Albania": "ALB", "Estonia": "EST",
  "Latvia": "LVA", "Lithuania": "LTU", "Moldova": "MDA",
  "Belarus": "BLR", "Georgia": "GEO", "Armenia": "ARM",
  "Azerbaijan": "AZE", "Kazakhstan": "KAZ", "Uzbekistan": "UZB",
  "Turkmenistan": "TKM", "Kyrgyzstan": "KGZ", "Tajikistan": "TJK",
  "Vietnam": "VNM", "Cambodia": "KHM", "Laos": "LAO",
  "Myanmar": "MMR", "Bangladesh": "BGD", "Sri Lanka": "LKA",
  "Israel": "ISR", "Palestine": "PSE", "Jordan": "JOR",
  "Lebanon": "LBN", "Syria": "SYR", "Cyprus": "CYP",
  "Saudi Arabia": "SAU", "United Arab Emirates": "ARE",
  "Qatar": "QAT", "Kuwait": "KWT", "Bahrain": "BHR", "Oman": "OMN",
  "Yemen": "YEM", "Iran": "IRN", "Iraq": "IRQ",
  "Luxembourg": "LUX", "Malta": "MLT", "Monaco": "MCO",
  "Andorra": "AND", "San Marino": "SMR", "Vatican": "VAT",
  "Liechtenstein": "LIE",
  "Ghana": "GHA", "Senegal": "SEN", "Tunisia": "TUN",
  "Algeria": "DZA", "Libya": "LBY", "Sudan": "SDN",
  "South Sudan": "SSD", "Ethiopia": "ETH", "Somalia": "SOM",
  "Djibouti": "DJI", "Eritrea": "ERI", "Tanzania": "TZA",
  "United Republic of Tanzania": "TZA", "Uganda": "UGA",
  "Rwanda": "RWA", "Burundi": "BDI", "Zambia": "ZMB",
  "Zimbabwe": "ZWE", "Namibia": "NAM", "Botswana": "BWA",
  "Mozambique": "MOZ", "Angola": "AGO", "Malawi": "MWI",
  "Democratic Republic of the Congo": "COD",
  "Republic of the Congo": "COG", "Congo": "COG",
  "Gabon": "GAB", "Cameroon": "CMR", "Central African Republic": "CAF",
  "Chad": "TCD", "Niger": "NER", "Mali": "MLI",
  "Burkina Faso": "BFA", "Ivory Coast": "CIV", "Cote d'Ivoire": "CIV",
  "Guinea": "GIN", "Guinea-Bissau": "GNB", "Sierra Leone": "SLE",
  "Liberia": "LBR", "Togo": "TGO", "Benin": "BEN",
  "Mauritania": "MRT", "Gambia": "GMB", "Equatorial Guinea": "GNQ",
  "Lesotho": "LSO", "Eswatini": "SWZ", "Swaziland": "SWZ",
  "Madagascar": "MDG", "Comoros": "COM", "Cape Verde": "CPV",
  "Sao Tome and Principe": "STP", "Seychelles": "SYC", "Mauritius": "MUS",
};

const BASE = "https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/main/releaseData/gbOpen";

async function obtenerUrl(iso3, nivel) {
  const candidatas = [
    `${BASE}/${iso3}/${nivel}/geoBoundaries-${iso3}-${nivel}_simplified.geojson`,
    `${BASE}/${iso3}/${nivel}/geoBoundaries-${iso3}-${nivel}.geojson`,
  ];
  for (const url of candidatas) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const texto = await res.text();
      JSON.parse(texto); // lanza si no es JSON válido (ej. 404 en HTML)
      return url;
    } catch {
      // sigue probando con la siguiente candidata
    }
  }
  return null;
}

const encontrados = {};
const sinProvincias = [];
const noEncontrados = [];

const entradas = Object.entries(paisesISO);
console.log(`Probando ${entradas.length} países contra geoBoundaries...\n`);

for (const [pais, iso3] of entradas) {
  const urlADM1 = await obtenerUrl(iso3, "ADM1");
  if (urlADM1) {
    encontrados[pais] = urlADM1;
    console.log(`✅ ${pais.padEnd(35)} -> ADM1 (provincias/estados)`);
  } else {
    const urlADM0 = await obtenerUrl(iso3, "ADM0");
    if (urlADM0) {
      encontrados[pais] = urlADM0;
      sinProvincias.push(pais);
      console.log(`🟡 ${pais.padEnd(35)} -> solo ADM0 (país entero, sin provincias)`);
    } else {
      noEncontrados.push(pais);
      console.log(`❌ ${pais.padEnd(35)} (no encontrado en geoBoundaries)`);
    }
  }
}

const contenido = `// Generado por generarDiccionario.mjs — ${new Date().toISOString()}
// Fuente: geoBoundaries (www.geoboundaries.org), licencia CC-BY 4.0.
//
// ESTE ARCHIVO ES LA FUENTE DE VERDAD (URLs remotas). No lo edites a
// mano y no lo confundas con diccionarioMapas.js: ese lo genera
// descargarMapas.mjs A PARTIR de este archivo, con rutas locales.
// Si alguna vez necesitas volver a descargar todo desde cero, este es
// el archivo que hay que conservar.

export const mapasProvincias = ${JSON.stringify(encontrados, null, 2)};

export const paisesSinProvincias = ${JSON.stringify(sinProvincias, null, 2)};
`;

fs.writeFileSync("./src/app/fuentesMapas.mjs", contenido);

console.log(`\n${Object.keys(encontrados).length} de ${entradas.length} países añadidos a fuentesMapas.mjs`);
console.log(`  - Con provincias reales (ADM1): ${Object.keys(encontrados).length - sinProvincias.length}`);
console.log(`  - Solo contorno país (ADM0):     ${sinProvincias.length}`);
console.log(`  - No encontrados:                ${noEncontrados.length}`);
if (noEncontrados.length) {
  console.log(`\nNo encontrados: ${noEncontrados.join(", ")}`);
}
