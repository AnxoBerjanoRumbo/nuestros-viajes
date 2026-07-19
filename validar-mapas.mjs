// validar-mapas.mjs
// Uso: node validar-mapas.mjs
import { mapasProvincias } from "./src/app/diccionarioMapas.js";

console.log(`Comprobando ${Object.keys(mapasProvincias).length} enlaces...\n`);

for (const [pais, url] of Object.entries(mapasProvincias)) {
  try {
    const res = await fetch(url);
    const icono = res.ok ? "✅" : "❌";
    console.log(`${icono} ${pais.padEnd(25)} [${res.status}]`);
  } catch (e) {
    console.log(`❌ ${pais.padEnd(25)} [ERROR DE RED: ${e.message}]`);
  }
}