// mejorarTodosLosMapas.mjs
// Uso: node mejorarTodosLosMapas.mjs
import fs from "fs";
import { mapasProvincias } from "./src/app/diccionarioMapas.js";

const BASE = "https://raw.githubusercontent.com/codeforgermany/click_that_hood/main/public/data/";

// Orden de prioridad: preferimos las versiones detalladas ANTES que
// la versión "pelada", que en este dataset suele ser la más pobre.
const sufijos = [
  "-provinces", "-states", "-regions", "-communities",
  "-districts", "-departments", "-counties", "-cantons", "-prefectures",
  "", // la pelada, como último recurso
];

function normalizar(nombre) {
  return nombre
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function aUrlLfs(url) {
  return url.replace("raw.githubusercontent.com", "media.githubusercontent.com/media");
}

function calidadDe(geo) {
  if (!geo?.features?.length) return 0;
  const puntos = geo.features.map((f) => {
    const anillo =
      f.geometry?.type === "Polygon"
        ? f.geometry.coordinates?.[0]
        : f.geometry?.coordinates?.[0]?.[0];
    return anillo?.length || 0;
  });
  puntos.sort((a, b) => a - b);
  return puntos[Math.floor(puntos.length / 2)]; // mediana de puntos por región
}

async function descargarSiValido(url) {
  try {
    let res = await fetch(url);
    if (!res.ok) return null;
    let texto = await res.text();
    if (texto.startsWith("version https://git-lfs")) {
      res = await fetch(aUrlLfs(url));
      if (!res.ok) return null;
      texto = await res.text();
    }
    const geo = JSON.parse(texto);
    return { texto, geo };
  } catch {
    return null;
  }
}

console.log(`Revisando ${Object.keys(mapasProvincias).length} países, buscando la mejor versión de cada uno...\n`);

let mejorados = 0;

for (const pais of Object.keys(mapasProvincias)) {
  const slug = normalizar(pais);
  let mejorOpcion = null; // { sufijo, texto, calidad }

  for (const sufijo of sufijos) {
    const url = `${BASE}${slug}${sufijo}.geojson`;
    const resultado = await descargarSiValido(url);
    if (!resultado) continue;

    const calidad = calidadDe(resultado.geo);
    if (!mejorOpcion || calidad > mejorOpcion.calidad) {
      mejorOpcion = { sufijo: sufijo || "(sin sufijo)", texto: resultado.texto, calidad };
    }
    // Si ya es muy detallado, no hace falta seguir probando más variantes
    if (calidad > 200) break;
  }

  if (!mejorOpcion) {
    console.log(`❌ ${pais.padEnd(30)} no encontré ninguna variante válida`);
    continue;
  }

  const destino = `./public/data/${slug}.geojson`;
  fs.writeFileSync(destino, mejorOpcion.texto);

  const aviso = mejorOpcion.calidad < 15 ? " ⚠️ sigue siendo tosco" : "";
  console.log(`✅ ${pais.padEnd(30)} -> ${mejorOpcion.sufijo.padEnd(16)} (mediana ${mejorOpcion.calidad} pts/región)${aviso}`);
  mejorados++;
}

console.log(`\nListo. ${mejorados} archivos actualizados en public/data/.`);