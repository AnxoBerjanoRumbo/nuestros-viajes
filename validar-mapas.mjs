// validar-mapas.mjs
import fs from "fs";
import path from "path";
import { mapasProvincias } from "./src/app/diccionarioMapas.js";

console.log(`Comprobando ${Object.keys(mapasProvincias).length} enlaces...\n`);

for (const [pais, ruta] of Object.entries(mapasProvincias)) {
  try {
    if (ruta.startsWith("/")) {
      // Ruta local (dentro de /public)
      const rutaDisco = path.join("./public", ruta);
      if (!fs.existsSync(rutaDisco)) throw new Error("archivo no encontrado en disco");
      const texto = fs.readFileSync(rutaDisco, "utf-8");
      JSON.parse(texto); // comprueba que es JSON válido
      console.log(`✅ ${pais.padEnd(30)} [local: ${rutaDisco}]`);
    } else {
      // Sigue siendo una URL externa
      const res = await fetch(ruta);
      const texto = await res.text();
      if (texto.startsWith("version https://git-lfs")) {
        console.log(`⚠️  ${pais.padEnd(30)} es un puntero de Git LFS`);
        continue;
      }
      JSON.parse(texto);
      console.log(`✅ ${pais.padEnd(30)} [${res.status}]`);
    }
  } catch (e) {
    console.log(`❌ ${pais.padEnd(30)} [${e.message}]`);
  }
}