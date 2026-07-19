"use client";

import { useState, useEffect } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { geoCentroid } from "d3-geo";
import { mapasProvincias } from "./diccionarioMapas";
import { useGeografia } from "./hooks/useGeografia";
import { calcularEscalaAjustada } from "./utils/geoUtils";
import MemoriaCard from "./components/MemoriaCard";
import AlbumModal from "./components/AlbumModal";
import FormularioRecuerdo from "./components/FormularioRecuerdo";

const mapaMundo = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const CLAVE_STORAGE = "mapa-viajes-recuerdos";
const ANCHO_MAPA = 800;
const ALTO_MAPA = 500;

export default function Home() {
  const [nivel, setNivel] = useState("mundo");
  const [paisActual, setPaisActual] = useState("");
  const [provinciaActual, setProvinciaActual] = useState("");
  const [transicion, setTransicion] = useState("estable"); // 'estable' | 'saliendo' | 'entrando'
  const [albumAbierto, setAlbumAbierto] = useState(null);

  const [viajesGuardados, setViajesGuardados] = useState({});
  const [datosCargados, setDatosCargados] = useState(false);
  const [creandoNuevo, setCreandoNuevo] = useState(false);

  // --- Carga del GeoJSON del país seleccionado, con loading/error ---
  const { datos: geoPais, cargando: cargandoPais, error: errorPais } = useGeografia(
    mapasProvincias[paisActual]
  );

  // --- Escala y centro calculados dinámicamente cuando llega el GeoJSON ---
  const [vistaPais, setVistaPais] = useState({ scale: 150, center: [0, 0] });

  useEffect(() => {
    if (geoPais) {
      setVistaPais({
        scale: calcularEscalaAjustada(geoPais, ANCHO_MAPA, ALTO_MAPA),
        center: geoCentroid(geoPais),
      });
    }
  }, [geoPais]);

  // --- Persistencia en localStorage ---
  useEffect(() => {
    try {
      const guardado = localStorage.getItem(CLAVE_STORAGE);
      if (guardado) setViajesGuardados(JSON.parse(guardado));
    } catch (e) {
      console.error("Error leyendo localStorage:", e);
    }
    setDatosCargados(true);
  }, []);

  useEffect(() => {
    if (!datosCargados) return;
    try {
      localStorage.setItem(CLAVE_STORAGE, JSON.stringify(viajesGuardados));
    } catch (e) {
      console.error("Error guardando en localStorage:", e);
    }
  }, [viajesGuardados, datosCargados]);

  // --- Navegación con transición animada ---
  const irANivel = (nuevoNivel, cambios = {}) => {
    setTransicion("saliendo");
    setTimeout(() => {
      setNivel(nuevoNivel);
      Object.entries(cambios).forEach(([clave, valor]) => {
        if (clave === "pais") setPaisActual(valor);
        if (clave === "provincia") setProvinciaActual(valor);
      });
      setTransicion("entrando");
    }, 350);
  };

  const handleVolver = () => {
    if (creandoNuevo) {
      setCreandoNuevo(false);
    } else if (nivel === "provincia") {
      setNivel("pais");
      setProvinciaActual("");
    } else if (nivel === "pais") {
      irANivel("mundo", { pais: "" });
    }
  };

  const handleClicMundo = (geo) => {
    const nombrePais = geo.properties.name;
    if (!mapasProvincias[nombrePais]) {
      alert(`Todavía no tengo el mapa de provincias de ${nombrePais}. Elige otro país (mira diccionarioMapas.js).`);
      return;
    }
    irANivel("pais", { pais: nombrePais });
  };

  const handleClicPais = (geo) => {
    const nombreProv =
      geo.properties.name || geo.properties.NAME_2 || geo.properties.NAME_1 || "Provincia";
    setProvinciaActual(nombreProv);
    setNivel("provincia");
  };

  const guardarViaje = (nuevoRecuerdo) => {
    const viaje = { ...nuevoRecuerdo, id: Date.now() };
    setViajesGuardados((prev) => {
      const paisData = prev[paisActual] || {};
      const provData = paisData[provinciaActual] || [];
      return {
        ...prev,
        [paisActual]: {
          ...paisData,
          [provinciaActual]: [...provData, viaje],
        },
      };
    });
    setCreandoNuevo(false);
  };

  const viajesDeEstaProvincia = viajesGuardados[paisActual]?.[provinciaActual] || [];
  const claseTransicion =
    transicion === "saliendo" ? "mapa-saliendo" : transicion === "entrando" ? "mapa-entrando" : "";

  return (
    <main className="flex min-h-screen flex-col items-center justify-start bg-[#f4f1ea] p-10 overflow-hidden text-gray-800">
      <div className="w-full max-w-5xl flex justify-between items-center mb-6 h-12">
        {nivel !== "mundo" ? (
          <button
            onClick={handleVolver}
            className="px-4 py-2 bg-white text-gray-700 font-bold rounded-lg shadow hover:bg-gray-100 transition-all border border-gray-200"
          >
            ← Volver atrás
          </button>
        ) : (
          <div className="w-32" />
        )}

        <h2 className="text-3xl font-bold font-serif text-center flex-1">
          {nivel === "mundo" && "Nuestro Mapa de Viajes"}
          {nivel === "pais" && `Mapa de ${paisActual}`}
          {nivel === "provincia" && `Álbum de ${provinciaActual} (${paisActual})`}
        </h2>
        <div className="w-32" />
      </div>

      {nivel === "mundo" && (
        <div className={`w-full max-w-5xl bg-[#cce3eb] rounded-xl shadow-lg overflow-hidden border-4 border-white mb-8 ${claseTransicion}`}>
          <ComposableMap projectionConfig={{ scale: 140 }}>
            <Geographies geography={mapaMundo}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() => handleClicMundo(geo)}
                    fill="#d3d3d3"
                    stroke="#ffffff"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: "none" },
                      hover: { fill: "#ff7f50", outline: "none", cursor: "pointer" },
                      pressed: { outline: "none" },
                    }}
                  />
                ))
              }
            </Geographies>
          </ComposableMap>
        </div>
      )}

      {nivel === "pais" && (
        <div
          className={`w-full max-w-5xl bg-[#cce3eb] rounded-xl shadow-lg overflow-hidden border-4 border-white mb-8 flex justify-center items-center h-[500px] ${claseTransicion}`}
        >
          {cargandoPais && <div className="spinner-carga" />}

          {errorPais && (
            <div className="text-center p-8 text-gray-600 max-w-md">
              <p className="text-4xl mb-3">🗺️❌</p>
              <p className="font-bold mb-1">No se pudo cargar el mapa de {paisActual}</p>
              <p className="text-sm text-gray-500">{errorPais}</p>
              <p className="text-xs text-gray-400 mt-3">
                Revisa el enlace en diccionarioMapas.js con validar-mapas.mjs
              </p>
            </div>
          )}

          {geoPais && !cargandoPais && !errorPais && (
            <ComposableMap
              projectionConfig={{ scale: vistaPais.scale, center: vistaPais.center }}
              projection="geoMercator"
              width={ANCHO_MAPA}
              height={ALTO_MAPA}
              className="w-full h-full"
            >
              <Geographies geography={geoPais}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onClick={() => handleClicPais(geo)}
                      fill="#a2d5c6"
                      stroke="#ffffff"
                      strokeWidth={1}
                      style={{
                        default: { outline: "none" },
                        hover: { fill: "#ff7f50", outline: "none", cursor: "pointer" },
                        pressed: { outline: "none" },
                      }}
                    />
                  ))
                }
              </Geographies>
            </ComposableMap>
          )}
        </div>
      )}

      {nivel === "provincia" && (
        <div className="w-full max-w-5xl mt-4 animate-fade-in-down">
          {!creandoNuevo ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div
                onClick={() => setCreandoNuevo(true)}
                className="w-full h-80 border-4 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-white hover:border-[#ff6347] hover:text-[#ff6347] transition-all shadow-sm text-gray-400 bg-gray-50/50"
              >
                <span className="text-6xl mb-2">➕</span>
                <span className="font-bold text-lg">Nuevo recuerdo</span>
              </div>

              {viajesDeEstaProvincia.map((viaje, index) => (
                <div
                  key={viaje.id}
                  className="recuerdo-entrada"
                  style={{ animationDelay: `${index * 0.08}s` }}
                >
                  <MemoriaCard recuerdo={viaje} onAbrir={() => setAlbumAbierto(viaje)} />
                </div>
              ))}
            </div>
          ) : (
            <FormularioRecuerdo
              provincia={provinciaActual}
              onGuardar={guardarViaje}
              onCancelar={() => setCreandoNuevo(false)}
            />
          )}
        </div>
      )}

      {albumAbierto && (
        <AlbumModal recuerdo={albumAbierto} onCerrar={() => setAlbumAbierto(null)} />
      )}
    </main>
  );
}