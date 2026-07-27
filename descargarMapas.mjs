// descargarMapas.mjs
// Uso: node descargarMapas.mjs
//
// Requiere: npm install --save-dev mapshaper
//
// Lee las URLs remotas de fuentesMapas.mjs (generado por
// generarDiccionario.mjs) — NO de diccionarioMapas.js, para no volver
// a perder las fuentes originales (ver el lío anterior con eso).
//
// NUEVO: cualquier país que pese más de 200 KB en bruto se simplifica
// automáticamente con mapshaper antes de guardarlo. El porcentaje de
// simplificación se ajusta según el peso: cuanto más pesado, más
// agresivo (con un suelo del 2%, y "keep-shapes" para que ninguna
// provincia pequeña desaparezca del todo).
import fs from "fs";
import mapshaper from "mapshaper";
import { mapasProvincias } from "./src/app/fuentesMapas.mjs";

const DIR_DESTINO = "./public/data";
fs.mkdirSync(DIR_DESTINO, { recursive: true });

function aUrlLfs(url) {
  return url.replace(
    "raw.githubusercontent.com",
    "media.githubusercontent.com/media"
  );
}

function simplificarGeoJSON(textoJSON, porcentaje) {
  return new Promise((resolve, reject) => {
    const input = { "entrada.geojson": textoJSON };
    const comando = `-i entrada.geojson -simplify ${porcentaje}% keep-shapes -o format=geojson salida.geojson`;
    mapshaper.applyCommands(comando, input, (err, salida) => {
      if (err) return reject(err);
      resolve(salida["salida.geojson"].toString());
    });
  });
}

const UMBRAL_SIMPLIFICAR_KB = 200;

const nuevoDiccionario = {};
let pesoTotal = 0;
const masPesados = [];

for (const [pais, url] of Object.entries(mapasProvincias)) {
  const slug = pais.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  try {
    let res = await fetch(url);
    let texto = await res.text();

    if (texto.startsWith("version https://git-lfs")) {
      console.log(`↻ ${pais}: era un puntero LFS, reintentando...`);
      res = await fetch(aUrlLfs(url));
      texto = await res.text();
    }

    JSON.parse(texto); // verifica que es JSON válido

    const pesoOriginalKB = Buffer.byteLength(texto) / 1024;
    let textoFinal = texto;
    let etiquetaSimplificado = "";

    if (pesoOriginalKB > UMBRAL_SIMPLIFICAR_KB) {
      const porcentaje = Math.max(2, Math.min(10, 2000 / pesoOriginalKB)).toFixed(1);
      try {
        textoFinal = await simplificarGeoJSON(texto, porcentaje);
        const pesoFinalKB = Buffer.byteLength(textoFinal) / 1024;
        etiquetaSimplificado = `  [${pesoOriginalKB.toFixed(0)} KB -> ${pesoFinalKB.toFixed(0)} KB, simplify ${porcentaje}%]`;
      } catch (e) {
        console.log(`   ⚠️  No se pudo simplificar ${pais}, se guarda tal cual (${e.message})`);
      }
    }

    const destino = `${DIR_DESTINO}/${slug}.json`;
    fs.writeFileSync(destino, textoFinal);
    nuevoDiccionario[pais] = `/data/${slug}.json`;

    const pesoKB = Buffer.byteLength(textoFinal) / 1024;
    pesoTotal += pesoKB;
    masPesados.push({ pais, pesoKB });
    console.log(`✅ ${pais.padEnd(30)} -> ${destino}${etiquetaSimplificado}`);
  } catch (e) {
    console.log(`❌ ${pais.padEnd(30)} [${e.message}]`);
  }
}

const contenido = `// Generado por descargarMapas.mjs — ${new Date().toISOString()}
// NO EDITAR A MANO. Las URLs de origen viven en fuentesMapas.mjs;
// este archivo solo apunta a las copias locales ya descargadas
// (y simplificadas si pesaban más de ${UMBRAL_SIMPLIFICAR_KB} KB).
export const mapasProvincias = ${JSON.stringify(nuevoDiccionario, null, 2)};
`;
fs.writeFileSync("./src/app/diccionarioMapas.js", contenido);

masPesados.sort((a, b) => b.pesoKB - a.pesoKB);
console.log(`\nPeso total final: ${(pesoTotal / 1024).toFixed(1)} MB`);
console.log("\nLos 10 países más pesados AHORA (tras simplificar):");
masPesados.slice(0, 10).forEach(({ pais, pesoKB }) => {
  console.log(`  ${pais.padEnd(30)} ${(pesoKB / 1024).toFixed(2)} MB`);
});

console.log("\nListo. diccionarioMapas.js ahora apunta a archivos locales simplificados (.json).");
