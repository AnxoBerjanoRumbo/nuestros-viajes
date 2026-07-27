import { geoMercator, geoBounds, geoArea } from "d3-geo";

const DOS_PI = 2 * Math.PI;

function invertirAnillo(anillo) {
  return [...anillo].reverse();
}

function invertirGeometria(geom) {
  if (!geom) return geom;
  if (geom.type === "Polygon") {
    return { ...geom, coordinates: geom.coordinates.map(invertirAnillo) };
  }
  if (geom.type === "MultiPolygon") {
    return { ...geom, coordinates: geom.coordinates.map((poly) => poly.map(invertirAnillo)) };
  }
  return geom;
}

/**
 * Corrige automáticamente el sentido de giro de cada región,
 * detectándolo por el ÁREA que calcula geoArea (que mide bien
 * geometrías esféricas, incluidas las que cruzan la línea de cambio
 * de fecha, como Alaska). Ninguna región real del planeta ocupa más
 * de la mitad de la esfera; si el área medida supera eso, el
 * polígono está invertido (d3 está midiendo "todo menos la forma").
 * En ese caso se invierten sus anillos, lo que arregla a la vez el
 * área y el dibujo. Esto corrige solo lo que de verdad está mal —
 * los archivos que ya venían bien orientados (como España) no se
 * tocan.
 */
function corregirPorArea(feature) {
  let area;
  try {
    area = Math.abs(geoArea(feature));
  } catch {
    return feature;
  }
  if (!Number.isFinite(area) || area <= DOS_PI) return feature;
  return { ...feature, geometry: invertirGeometria(feature.geometry) };
}

/**
 * Corrige el giro donde haga falta y descarta lo que, aun así, siga
 * siendo disparatado (geometría genuinamente corrupta, no solo
 * invertida).
 */
export function limpiarGeoJSON(geoData) {
  if (!geoData?.features?.length) return geoData;

  const corregidas = geoData.features.map(corregirPorArea);

  const conArea = corregidas
    .map((f) => {
      try {
        return { feature: f, area: Math.abs(geoArea(f)) };
      } catch {
        return { feature: f, area: null };
      }
    })
    .filter((x) => x.area !== null && Number.isFinite(x.area) && x.area > 0);

  if (conArea.length === 0) return { ...geoData, features: corregidas };

  const areas = conArea.map((x) => x.area).sort((a, b) => a - b);
  const mediana = areas[Math.floor(areas.length / 2)] || 0.0001;

  const UMBRAL_ABSOLUTO = 1.0; // ni Rusia entera (~0.42 sr) llega aquí
  const UMBRAL_RELATIVO = 100;

  const limpias = conArea
    .filter((x) => x.area <= UMBRAL_ABSOLUTO && x.area <= mediana * UMBRAL_RELATIVO)
    .map((x) => x.feature);

  if (limpias.length === 0) return { ...geoData, features: corregidas };

  return { ...geoData, features: limpias };
}

function centroDe(feature) {
  try {
    const [[minLon, minLat], [maxLon, maxLat]] = geoBounds(feature);
    if (![minLon, minLat, maxLon, maxLat].every(Number.isFinite)) return null;
    return [(minLon + maxLon) / 2, (minLat + maxLat) / 2];
  } catch {
    return null;
  }
}

function percentil(valoresOrdenados, p) {
  const idx = p * (valoresOrdenados.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return valoresOrdenados[lo];
  return valoresOrdenados[lo] + (valoresOrdenados[hi] - valoresOrdenados[lo]) * (idx - lo);
}

/**
 * Descarta territorios muy alejados del grueso del país (Canarias,
 * Alaska, Hawái...) solo para calcular la vista, sin dejar de
 * dibujarlos.
 */
function filtrarOutliers(conCentro) {
  if (conCentro.length < 4) return conCentro;

  const lons = conCentro.map((x) => x.centro[0]).slice().sort((a, b) => a - b);
  const lats = conCentro.map((x) => x.centro[1]).slice().sort((a, b) => a - b);

  const q1Lon = percentil(lons, 0.25);
  const q3Lon = percentil(lons, 0.75);
  const q1Lat = percentil(lats, 0.25);
  const q3Lat = percentil(lats, 0.75);
  const iqrLon = q3Lon - q1Lon || 0.0001;
  const iqrLat = q3Lat - q1Lat || 0.0001;

  const lonMin = q1Lon - 1.5 * iqrLon;
  const lonMax = q3Lon + 1.5 * iqrLon;
  const latMin = q1Lat - 1.5 * iqrLat;
  const latMax = q3Lat + 1.5 * iqrLat;

  const filtrado = conCentro.filter(
    (x) =>
      x.centro[0] >= lonMin &&
      x.centro[0] <= lonMax &&
      x.centro[1] >= latMin &&
      x.centro[1] <= latMax
  );

  return filtrado.length > 0 ? filtrado : conCentro;
}

export function calcularVistaAjustada(geoData, width = 800, height = 500, padding = 40) {
  if (!geoData?.features?.length) {
    return { scale: 400, center: [0, 0] };
  }

  const conCentro = geoData.features
    .map((f) => ({ feature: f, centro: centroDe(f) }))
    .filter((x) => x.centro);

  if (conCentro.length === 0) {
    return { scale: 400, center: [0, 0] };
  }

  const nucleo = filtrarOutliers(conCentro).map((x) => x.feature);
  const geoParaVista = { ...geoData, features: nucleo };

  let escala = 400;
  try {
    const proyeccionTemporal = geoMercator().fitExtent(
      [
        [padding, padding],
        [width - padding, height - padding],
      ],
      geoParaVista
    );
    escala = proyeccionTemporal.scale();
  } catch (e) {
    console.error("No se pudo calcular la escala del mapa:", e);
  }

  let centro = [0, 0];
  try {
    const [[minLon, minLat], [maxLon, maxLat]] = geoBounds(geoParaVista);
    centro = [(minLon + maxLon) / 2, (minLat + maxLat) / 2];
  } catch (e) {
    console.error("No se pudo calcular el centro del mapa:", e);
  }

  return { scale: escala, center: centro };
}