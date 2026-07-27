// depurar-mapa.mjs
// Uso: node depurar-mapa.mjs public/data/spain.geojson
import fs from "fs";

const ruta = process.argv[2];
const geo = JSON.parse(fs.readFileSync(ruta, "utf-8"));
const features = geo.features || [];

function recorrerCoords(coords, cb) {
  if (typeof coords[0] === "number") {
    cb(coords);
  } else {
    coords.forEach((c) => recorrerCoords(c, cb));
  }
}

function bboxManual(geometry) {
  let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
  recorrerCoords(geometry.coordinates, ([lon, lat]) => {
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  });
  return { minLon, maxLon, minLat, maxLat };
}

function areaConSigno(anillo) {
  let suma = 0;
  for (let i = 0; i < anillo.length - 1; i++) {
    const [x1, y1] = anillo[i];
    const [x2, y2] = anillo[i + 1];
    suma += x1 * y2 - x2 * y1;
  }
  return suma / 2;
}

console.log(`${features.length} regiones.\n`);

features.forEach((f, i) => {
  const nombre = f.properties?.name || f.properties?.shapeName || `#${i}`;
  const geom = f.geometry;
  if (!geom) {
    console.log(`❌ ${nombre.padEnd(28)} sin geometría`);
    return;
  }
  const { minLon, maxLon, minLat, maxLat } = bboxManual(geom);

  // Área del primer anillo, para ver el sentido de giro
  let primerAnillo;
  if (geom.type === "Polygon") primerAnillo = geom.coordinates[0];
  else if (geom.type === "MultiPolygon") primerAnillo = geom.coordinates[0][0];
  const area = primerAnillo ? areaConSigno(primerAnillo) : null;
  const sentido = area === null ? "?" : area > 0 ? "antihorario" : "horario";

  const numPuntos = primerAnillo ? primerAnillo.length : 0;

  console.log(
    `${nombre.padEnd(28)} tipo:${geom.type.padEnd(12)} lon:[${minLon.toFixed(2)}, ${maxLon.toFixed(2)}] lat:[${minLat.toFixed(2)}, ${maxLat.toFixed(2)}] giro:${sentido} pts:${numPuntos}`
  );
});