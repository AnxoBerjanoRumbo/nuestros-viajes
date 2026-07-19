// generarDiccionario.mjs
// Uso: node generarDiccionario.mjs
// Prueba cada país contra varias variantes de nombre de archivo reales
// (peticiones HTTP de verdad, no adivinadas) y genera diccionarioMapas.js

import fs from "fs";

const paises = [
  "Spain","France","Italy","Germany","Portugal","United Kingdom","Ireland","Netherlands",
  "Belgium","Switzerland","Austria","Greece","Turkey","Poland","Czech Republic","Romania",
  "Ukraine","Sweden","Norway","Finland","Denmark","Russia","Japan","China","India",
  "South Korea","Philippines","Indonesia","Malaysia","Thailand","Nepal","Pakistan",
  "Australia","New Zealand","United States of America","Canada","Mexico","Brazil",
  "Argentina","Chile","Colombia","Peru","Venezuela","Ecuador","Bolivia","Paraguay",
  "Uruguay","Cuba","South Africa","Nigeria","Kenya","Morocco","Egypt","Iceland",
  "Croatia","Slovenia","Slovakia","Hungary","Bulgaria","Serbia","Bosnia and Herzegovina",
  "Albania","Estonia","Latvia","Lithuania","Belarus","Georgia","Armenia","Azerbaijan",
  "Kazakhstan","Uzbekistan","Vietnam","Cambodia","Laos","Myanmar","Bangladesh","Sri Lanka",
  "Israel","Jordan","Lebanon","Saudi Arabia","United Arab Emirates","Qatar","Kuwait",
  "Iran","Iraq","Costa Rica","Panama","Guatemala","Honduras","Nicaragua","El Salvador",
  "Dominican Republic","Jamaica","Haiti","Ghana","Senegal","Tunisia","Algeria","Ethiopia",
  "Tanzania","Uganda","Zambia","Zimbabwe","Namibia","Botswana","Mozambique","Angola",
  "Fiji","Papua New Guinea"
  // Añade aquí más nombres si quieres cubrir más países.
  // Deben coincidir con "properties.name" del mapa mundial (world-atlas).
];

function normalizar(nombre) {
  return nombre
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const sufijos = [
  "", "-states", "-provinces", "-regions", "-communities",
  "-districts", "-departments", "-counties", "-cantons", "-prefectures",
];

const BASE = "https://raw.githubusercontent.com/codeforgermany/click_that_hood/main/public/data/";

const encontrados = {};
console.log(`Probando ${paises.length} países...\n`);

for (const pais of paises) {
  const slug = normalizar(pais);
  let hallado = null;

  for (const sufijo of sufijos) {
    const url = `${BASE}${slug}${sufijo}.geojson`;
    try {
      const res = await fetch(url);
      if (res.ok) {
        hallado = url;
        break;
      }
    } catch {
      // sigue probando con el siguiente sufijo
    }
  }

  if (hallado) {
    console.log(`✅ ${pais.padEnd(30)} -> ${hallado}`);
    encontrados[pais] = hallado;
  } else {
    console.log(`❌ ${pais.padEnd(30)} (no encontrado)`);
  }
}

const contenido = `// Generado automáticamente por generarDiccionario.mjs — ${new Date().toISOString()}
// Fuente: codeforgermany/click_that_hood
export const mapasProvincias = ${JSON.stringify(encontrados, null, 2)};
`;

fs.writeFileSync("./src/app/diccionarioMapas.js", contenido);
console.log(`\n${Object.keys(encontrados).length} de ${paises.length} países añadidos a diccionarioMapas.js`);