import { geoMercator } from "d3-geo";

/**
 * Calcula la escala ideal para que un país (GeoJSON) encaje
 * dentro de un lienzo de width x height, con margen.
 */
export function calcularEscalaAjustada(geoData, width = 800, height = 500, padding = 40) {
  try {
    const proyeccionTemporal = geoMercator().fitExtent(
      [
        [padding, padding],
        [width - padding, height - padding],
      ],
      geoData
    );
    return proyeccionTemporal.scale();
  } catch (e) {
    console.error("No se pudo calcular la escala del mapa:", e);
    return 400; // valor de emergencia razonable
  }
}