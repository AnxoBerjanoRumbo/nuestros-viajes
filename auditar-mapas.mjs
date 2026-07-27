// auditar-mapas.mjs
// Uso: node auditar-mapas.mjs
import fs from "fs";
import { geoArea } from "d3-geo";
import { mapasProvincias } from "./src/app/diccionarioMapas.js";
import { limpiarGeoJSON } from "./src/app/utils/geoUtils.js";

console.log(`Auditando ${Object.keys(mapasProvincias).length} países (tras corrección automática)...\n`);

let paisesConProblemas = 0;

for (const [pais, ruta] of Object.entries(mapasProvincias)) {
  const rutaDisco = `./public${ruta}`;
  if (!fs.existsSync(rutaDisco)) {
    console.log(`❌ ${pais.padEnd(30)} archivo no encontrado`);
    paisesConProblemas++;
    continue;
  }

  let geo;
  try {
    geo = JSON.parse(fs.readFileSync(rutaDisco, "utf-8"));
  } catch (e) {
    console.log(`❌ ${pais.padEnd(30)} JSON inválido: ${e.message}`);
    paisesConProblemas++;
    continue;
  }

  const original = (geo.features || []).length;
  const limpio = limpiarGeoJSON(geo);
  const final = limpio.features.length;

  if (final < original) {
    paisesConProblemas++;
    console.log(`⚠️  ${pais.padEnd(30)} ${original - final} región(es) descartada(s) (de ${original})`);
  }
}

console.log(`\n${paisesConProblemas} países con regiones descartadas, de ${Object.keys(mapasProvincias).length} totales.`);