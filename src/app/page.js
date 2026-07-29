"use client";

import { useState, useEffect, useMemo } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup, Marker, Line } from "react-simple-maps";
import { mapasProvincias } from "./diccionarioMapas";
import { useGeografia } from "./hooks/useGeografia";
import { calcularVistaAjustada, limpiarGeoJSON } from "./utils/geoUtils";
import MemoriaCard from "./components/MemoriaCard";
import AlbumModal from "./components/AlbumModal";
import FormularioRecuerdo from "./components/FormularioRecuerdo";

const mapaMundo = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const ANCHO_MAPA = 800;
const ALTO_MAPA = 500;

const COLORES_MARCADOR = [
  { nombre: "Rosa Aurora", hex: "#c2416b" },
  { nombre: "Morado", hex: "#7b4b8e" },
  { nombre: "Azul", hex: "#565a9e" },
  { nombre: "Dorado", hex: "#e5a93c" },
  { nombre: "Verde", hex: "#2e9b72" },
];

const PALETA = {
  mundoDefecto: "#cfc2d0",
  mundoHover: "#c2416b",
  paisDefecto: "#bfaec4",
  paisHover: "#7b4b8e",
  borde: "#ffffff",
};

function esMismoPais(p1, p2) {
  if (!p1 || !p2) return false;
  const a = p1.trim().toLowerCase();
  const b = p2.trim().toLowerCase();
  if (a === b) return true;
  if ((a === "spain" || a === "españa") && (b === "spain" || b === "españa")) return true;
  if ((a === "france" || a === "francia") && (b === "france" || b === "francia")) return true;
  if ((a === "italy" || a === "italia") && (b === "italy" || b === "italia")) return true;
  if ((a === "germany" || a === "alemania") && (b === "germany" || b === "alemania")) return true;
  if ((a === "portugal") && (b === "portugal")) return true;
  if ((a === "united kingdom" || a === "reino unido") && (b === "united kingdom" || b === "reino unido")) return true;
  return false;
}

// Componente Splash de entrada (Intacto)
function SplashEntrada({ visible }) {
  const [completado, setCompletado] = useState(false);
  const [mostrarTexto, setMostrarTexto] = useState(false);

  useEffect(() => {
    if (!visible) return;

    const canvas = document.getElementById("canvas-splash");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const puntos = [
      { x: -120, y: h * 0.95 },
      { x: w * 0.85, y: h * 0.8 },
      { x: w * 0.92, y: h * 0.25 },
      { x: w * 0.12, y: h * 0.15 },
      { x: w * 0.08, y: h * 0.75 },
      { x: w * 0.88, y: h * 0.65 },
      { x: w * 0.35, y: h * 0.08 },
      { x: w + 120, y: -100 }
    ];

    function obtenerPuntoFluido(t) {
      const numSegs = puntos.length - 1;
      const progressSegmento = t * numSegs;
      const i = Math.min(Math.floor(progressSegmento), numSegs - 1);
      const u = progressSegmento - i;

      const p0 = puntos[Math.max(0, i - 1)];
      const p1 = puntos[i];
      const p2 = puntos[Math.min(numSegs, i + 1)];
      const p3 = puntos[Math.min(numSegs, i + 2)];

      const u2 = u * u;
      const u3 = u2 * u;

      return {
        x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * u + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * u2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * u3),
        y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * u + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * u2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * u3)
      };
    }

    let progress = 0;
    const duration = 5400;
    let startTime = null;
    let textoRevelado = false;

    function render(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      progress = Math.min(elapsed / duration, 1);

      const easeProgress = 0.5 - Math.cos(progress * Math.PI) / 2;

      if (progress > 0.3 && !textoRevelado) {
        setMostrarTexto(true);
        textoRevelado = true;
      }

      ctx.clearRect(0, 0, w, h);

      ctx.beginPath();
      const startP = obtenerPuntoFluido(0);
      ctx.moveTo(startP.x, startP.y);

      const pasos = 250;
      const pasoActual = Math.floor(easeProgress * pasos);

      for (let k = 1; k <= pasoActual; k++) {
        const pt = obtenerPuntoFluido(k / pasos);
        ctx.lineTo(pt.x, pt.y);
      }

      ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
      ctx.lineWidth = 3;
      ctx.setLineDash([12, 8]);
      ctx.stroke();

      if (easeProgress > 0 && easeProgress <= 1) {
        const currP = obtenerPuntoFluido(easeProgress);
        const prevP = obtenerPuntoFluido(Math.max(0, easeProgress - 0.005));
        const nextP = obtenerPuntoFluido(Math.min(1, easeProgress + 0.005));
        const angle = Math.atan2(nextP.y - prevP.y, nextP.x - prevP.x);

        ctx.save();
        ctx.translate(currP.x, currP.y);
        ctx.rotate(angle);

        ctx.shadowColor = "rgba(255, 255, 255, 0.9)";
        ctx.shadowBlur = 18;

        ctx.beginPath();
        ctx.moveTo(20, 0);
        ctx.lineTo(-15, 12);
        ctx.lineTo(-9, 0);
        ctx.lineTo(-15, -12);
        ctx.closePath();

        ctx.fillStyle = "#ffffff";
        ctx.fill();

        ctx.restore();
      }

      if (progress < 1) {
        requestAnimationFrame(render);
      } else {
        setCompletado(true);
      }
    }

    requestAnimationFrame(render);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] pointer-events-none flex flex-col items-center justify-center overflow-hidden transition-opacity duration-700"
      style={{
        background: "var(--aurora)",
        opacity: completado ? 0 : 1,
      }}
    >
      <canvas id="canvas-splash" className="absolute inset-0 w-full h-full z-10 pointer-events-none" />

      <div
        className={`relative z-30 text-center px-6 transition-all duration-1000 transform ${
          mostrarTexto
            ? "opacity-100 translate-y-0 blur-0 scale-100"
            : "opacity-0 translate-y-4 blur-md scale-95"
        }`}
      >
        <p className="font-display text-4xl sm:text-6xl font-semibold text-white tracking-wide drop-shadow-[0_4px_14px_rgba(0,0,0,0.35)]">
          Nuestros Viajes
        </p>
        <p className="font-caveat text-2xl sm:text-3xl text-white/95 mt-2 tracking-wider drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
          Coleccionando recuerdos juntos
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  const [introVisible, setIntroVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setIntroVisible(false), 6000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const prevGesture = (e) => e.preventDefault();
    document.addEventListener("gesturestart", prevGesture, { passive: false });
    document.addEventListener("gesturechange", prevGesture, { passive: false });
    return () => {
      document.removeEventListener("gesturestart", prevGesture);
      document.removeEventListener("gesturechange", prevGesture);
    };
  }, []);

  const [nivel, setNivel] = useState("mundo");
  const [paisActual, setPaisActual] = useState("");
  const [provinciaActual, setProvinciaActual] = useState("");
  const [transicion, setTransicion] = useState("estable");
  const [albumAbierto, setAlbumAbierto] = useState(null);

  // Estado para la provincia que está siendo pulsada antes de cambiar de pantalla
  const [provinciaResaltada, setProvinciaResaltada] = useState(null);

  const [viajesGuardados, setViajesGuardados] = useState({});
  const [creandoNuevo, setCreandoNuevo] = useState(false);
  const [viajeEnEdicion, setViajeEnEdicion] = useState(null);

  // MARCADORES
  const [marcadores, setMarcadores] = useState([]);
  const [modoCrearMarcador, setModoCrearMarcador] = useState(false);
  const [marcadorPendiente, setMarcadorPendiente] = useState(null);
  const [marcadorEnEdicion, setMarcadorEnEdicion] = useState(null);
  const [colorSeleccionado, setColorSeleccionado] = useState(COLORES_MARCADOR[0].hex);
  const [tamanoSeleccionado, setTamanoSeleccionado] = useState(6);
  const [etiquetaMarcador, setEtiquetaMarcador] = useState("");
  const [albumIdSeleccionado, setAlbumIdSeleccionado] = useState("");
  const [modalListaMarcadoresAbierto, setModalListaMarcadoresAbierto] = useState(false);
  const [mostrarRutas, setMostrarRutas] = useState(true);

  const todosLosRecuerdos = useMemo(() => {
    const lista = [];
    Object.values(viajesGuardados).forEach((provinciasObj) => {
      Object.values(provinciasObj).forEach((listaViajes) => {
        listaViajes.forEach((v) => lista.push(v));
      });
    });
    return lista;
  }, [viajesGuardados]);

  const paisesVisitados = useMemo(() => {
    const setPaises = new Set();
    todosLosRecuerdos.forEach((r) => {
      if (r.pais) setPaises.add(r.pais.toLowerCase());
    });
    marcadores.forEach((m) => {
      if (m.pais && m.pais !== "Mundo") setPaises.add(m.pais.toLowerCase());
    });
    return setPaises;
  }, [todosLosRecuerdos, marcadores]);

  const recuerdosFiltradosParaMarcador = useMemo(() => {
    if (!paisActual || nivel === "mundo") return todosLosRecuerdos;
    const filtrados = todosLosRecuerdos.filter((r) => esMismoPais(r.pais, paisActual));
    return filtrados.length > 0 ? filtrados : todosLosRecuerdos;
  }, [todosLosRecuerdos, paisActual, nivel]);

  const [mundoListo, setMundoListo] = useState(false);
  const [vistaMundo, setVistaMundo] = useState({ coordinates: [0, 0], zoom: 1 });

  useEffect(() => {
    let cancelado = false;
    fetch(mapaMundo)
      .then(() => { if (!cancelado) setMundoListo(true); })
      .catch(() => { if (!cancelado) setMundoListo(true); });
    return () => { cancelado = true; };
  }, []);

  const { datos: geoPaisCrudo, cargando: cargandoPais, error: errorPais } = useGeografia(
    mapasProvincias[paisActual]
  );

  const geoPais = useMemo(
    () => (geoPaisCrudo ? limpiarGeoJSON(geoPaisCrudo) : null),
    [geoPaisCrudo]
  );

  const [vistaPais, setVistaPais] = useState({ scale: 150, center: [0, 0] });
  const [vistaInteractiva, setVistaInteractiva] = useState({ coordinates: [0, 0], zoom: 1 });

  useEffect(() => {
    if (geoPais) {
      const vista = calcularVistaAjustada(geoPais, ANCHO_MAPA, ALTO_MAPA);
      setVistaPais(vista);
      setVistaInteractiva({ coordinates: vista.center, zoom: 1 });
    }
  }, [geoPais, paisActual]);

  // Cargar datos de la API Route (PostgreSQL) al inicio
  const cargarDatosDesdeBD = async () => {
    try {
      const res = await fetch("/api/recuerdos");
      if (!res.ok) return;
      const data = await res.json();

      const mapaViajes = {};
      (data.recuerdos || []).forEach((r) => {
        const pais = r.pais || "España";
        const prov = r.provincia || "Sin provincia";
        if (!mapaViajes[pais]) mapaViajes[pais] = {};
        if (!mapaViajes[pais][prov]) mapaViajes[pais][prov] = [];
        mapaViajes[pais][prov].push(r);
      });

      setViajesGuardados(mapaViajes);
      setMarcadores(data.marcadores || []);
    } catch (e) {
      console.error("Error al obtener datos de la BD:", e);
    }
  };

  useEffect(() => {
    cargarDatosDesdeBD();
  }, []);

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
    setModoCrearMarcador(false);
    if (creandoNuevo) {
      setCreandoNuevo(false);
      setViajeEnEdicion(null);
    } else if (nivel === "provincia") {
      if (!mapasProvincias[paisActual]) {
        irANivel("mundo", { pais: "", provincia: "" });
      } else {
        setNivel("pais");
        setProvinciaActual("");
      }
    } else if (nivel === "pais") {
      irANivel("mundo", { pais: "" });
    }
  };

  const handleClicMapa = (geo, evt, projection) => {
    if (modoCrearMarcador && projection && evt) {
      evt.stopPropagation();

      const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
      const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;

      const groupEl = evt.currentTarget.closest("g");
      const svgEl = evt.currentTarget.ownerSVGElement || evt.currentTarget;

      let coords = null;

      if (groupEl && groupEl.getScreenCTM) {
        const pt = svgEl.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;

        const cursorG = pt.matrixTransform(groupEl.getScreenCTM().inverse());
        coords = projection.invert([cursorG.x, cursorG.y]);
      } else {
        const rect = svgEl.getBoundingClientRect();
        const x = ((clientX - rect.left) / rect.width) * ANCHO_MAPA;
        const y = ((clientY - rect.top) / rect.height) * ALTO_MAPA;
        coords = projection.invert([x, y]);
      }

      if (coords && !isNaN(coords[0]) && !isNaN(coords[1])) {
        setMarcadorPendiente(coords);
        setColorSeleccionado(COLORES_MARCADOR[0].hex);
        setTamanoSeleccionado(6);
        setEtiquetaMarcador("");
        setAlbumIdSeleccionado("");
      }
      return;
    }

    if (nivel === "mundo") {
      const nombrePais = geo.properties.name;
      if (!mapasProvincias[nombrePais]) {
        irANivel("provincia", { pais: nombrePais, provincia: nombrePais });
        return;
      }
      irANivel("pais", { pais: nombrePais });
    } else if (nivel === "pais") {
      const nombreProv =
        geo.properties.shapeName ||
        geo.properties.name ||
        geo.properties.NAME_2 ||
        geo.properties.NAME_1 ||
        "Provincia";
      
      setProvinciaResaltada(geo.rsmKey);
      setTimeout(() => {
        irANivel("provincia", { provincia: nombreProv });
        setProvinciaResaltada(null);
      }, 50);
    }
  };

  const guardarMarcadorNuevo = async () => {
    if (!marcadorPendiente) return;
    const nuevo = {
      coordinates: marcadorPendiente,
      color: colorSeleccionado,
      size: tamanoSeleccionado,
      etiqueta: etiquetaMarcador.trim(),
      nivelOrigen: nivel,
      pais: paisActual || "Mundo",
      albumId: albumIdSeleccionado || null,
    };

    try {
      await fetch("/api/recuerdos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marcador: nuevo }),
      });
      await cargarDatosDesdeBD();
    } catch (e) {
      console.error("Error al guardar marcador:", e);
    }

    setMarcadorPendiente(null);
    setEtiquetaMarcador("");
    setAlbumIdSeleccionado("");
    setModoCrearMarcador(false);
  };

  const abrirEdicionMarcador = (m, e) => {
    if (e) e.stopPropagation();
    setMarcadorEnEdicion(m);
    setColorSeleccionado(m.color);
    setTamanoSeleccionado(m.size || 6);
    setEtiquetaMarcador(m.etiqueta || "");
    setAlbumIdSeleccionado(m.albumId || "");
  };

  const alPulsarMarcador = (m, e) => {
    if (e) e.stopPropagation();
    // En el mapa mundi los marcadores son puramente visuales y no se abren al tocarlos en la pantalla
    if (nivel === "mundo") {
      return;
    }
    if (m.albumId) {
      const albumEncontrado = todosLosRecuerdos.find((r) => r.id === m.albumId);
      if (albumEncontrado) {
        setAlbumAbierto(albumEncontrado);
        return;
      }
    }
    abrirEdicionMarcador(m, e);
  };

  const guardarMarcadorEditado = async () => {
    if (!marcadorEnEdicion) return;
    try {
      await fetch("/api/recuerdos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marcador: {
            id: marcadorEnEdicion.id,
            color: colorSeleccionado,
            size: tamanoSeleccionado,
            etiqueta: etiquetaMarcador.trim(),
            albumId: albumIdSeleccionado || null,
          },
        }),
      });
      await cargarDatosDesdeBD();
    } catch (e) {
      console.error("Error al guardar marcador editado:", e);
    }
    setMarcadorEnEdicion(null);
    setAlbumIdSeleccionado("");
  };

  const eliminarMarcador = async (id) => {
    try {
      await fetch(`/api/recuerdos?id=${id}&tipo=marcador`, { method: "DELETE" });
      await cargarDatosDesdeBD();
    } catch (e) {
      console.error("Error al eliminar marcador:", e);
    }
    setMarcadorEnEdicion(null);
  };

  const marcadoresMundo = useMemo(
    () => marcadores.filter((m) => m.nivelOrigen === "mundo"),
    [marcadores]
  );

  const marcadoresPaisActual = useMemo(
    () => marcadores.filter((m) => m.nivelOrigen !== "mundo" && esMismoPais(m.pais, paisActual)),
    [marcadores, paisActual]
  );

  const marcadoresVisibles = useMemo(() => {
    if (nivel === "mundo") {
      return marcadoresMundo;
    }
    return marcadoresPaisActual;
  }, [nivel, marcadoresMundo, marcadoresPaisActual]);

  const lineasRutaMundo = useMemo(() => {
    if (marcadoresMundo.length < 2) return [];
    const lineas = [];
    for (let i = 0; i < marcadoresMundo.length - 1; i++) {
      const m1 = marcadoresMundo[i];
      const m2 = marcadoresMundo[i + 1];
      lineas.push({ id: `mundo-${m1.id}-${m2.id}`, from: m1.coordinates, to: m2.coordinates });
    }
    return lineas;
  }, [marcadoresMundo]);

  const lineasRutaPais = useMemo(() => {
    if (marcadoresPaisActual.length < 2) return [];
    const lineas = [];
    for (let i = 0; i < marcadoresPaisActual.length - 1; i++) {
      const m1 = marcadoresPaisActual[i];
      const m2 = marcadoresPaisActual[i + 1];
      lineas.push({ id: `pais-${m1.id}-${m2.id}`, from: m1.coordinates, to: m2.coordinates });
    }
    return lineas;
  }, [marcadoresPaisActual]);

  // Tras guardar un recuerdo desde el formulario, recargamos la BD
  const guardarViaje = async () => {
    await cargarDatosDesdeBD();
    setCreandoNuevo(false);
    setViajeEnEdicion(null);
  };

  const iniciarEdicion = (viaje) => {
    setViajeEnEdicion(viaje);
    setCreandoNuevo(true);
  };

  const eliminarViaje = async (id) => {
    if (!confirm("¿Seguro que quieres eliminar este recuerdo? No se puede deshacer.")) return;
    try {
      await fetch(`/api/recuerdos?id=${id}&tipo=recuerdo`, { method: "DELETE" });
      await cargarDatosDesdeBD();
    } catch (e) {
      console.error("Error al eliminar el recuerdo:", e);
    }
  };

  const actualizarNotaFoto = async (recuerdoId, fotoId, notaDorso) => {
    let recuerdoEncontrado = null;
    Object.values(viajesGuardados).forEach((provinciasObj) => {
      Object.values(provinciasObj).forEach((listaViajes) => {
        const hallado = listaViajes.find((v) => v.id === recuerdoId);
        if (hallado) recuerdoEncontrado = hallado;
      });
    });

    if (!recuerdoEncontrado) return;

    const fotosActualizadas = (recuerdoEncontrado.fotos || []).map((f) =>
      f.id === fotoId ? { ...f, notaDorso } : f
    );

    const recuerdoActualizado = {
      ...recuerdoEncontrado,
      fotos: fotosActualizadas,
    };

    setViajesGuardados((prev) => {
      const paisData = prev[recuerdoEncontrado.pais] || {};
      const provData = (paisData[recuerdoEncontrado.provincia] || []).map((v) =>
        v.id !== recuerdoId ? v : recuerdoActualizado
      );
      return { ...prev, [recuerdoEncontrado.pais]: { ...paisData, [recuerdoEncontrado.provincia]: provData } };
    });

    setAlbumAbierto((prev) => (prev && prev.id === recuerdoId ? recuerdoActualizado : prev));

    try {
      await fetch("/api/recuerdos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recuerdoActualizado),
      });
    } catch (e) {
      console.error("Error al guardar la nota en la base de datos:", e);
    }
  };

  const acercar = () => setVistaInteractiva((v) => ({ ...v, zoom: Math.min(v.zoom * 1.5, 10) }));
  const alejar = () => setVistaInteractiva((v) => ({ ...v, zoom: Math.max(v.zoom / 1.5, 0.4) }));
  const restablecerVista = () => setVistaInteractiva({ coordinates: vistaPais.center, zoom: 1 });

  const acercarMundo = () => setVistaMundo((v) => ({ ...v, zoom: Math.min(v.zoom * 1.5, 8) }));
  const alejarMundo = () => setVistaMundo((v) => ({ ...v, zoom: Math.max(v.zoom / 1.5, 1) }));
  const restablecerMundo = () => setVistaMundo({ coordinates: [0, 0], zoom: 1 });

  const viajesDeEstaProvincia = viajesGuardados[paisActual]?.[provinciaActual] || [];
  const claseTransicion =
    transicion === "saliendo" ? "mapa-saliendo" : transicion === "entrando" ? "mapa-entrando" : "";
  const paisSinSubdividir = provinciaActual === paisActual;

  const botonZoom =
    "w-11 h-11 flex items-center justify-center rounded-full bg-white/95 shadow-md text-[color:var(--color-ink)] text-lg font-semibold active:scale-90 transition-transform";

  return (
    <>
      <SplashEntrada visible={introVisible} />

      <main className="flex h-screen w-full flex-col justify-between bg-[var(--color-paper)] p-3 sm:p-4 overflow-hidden text-[color:var(--color-ink)] relative">

        <header className="w-full flex items-center justify-between py-2 shrink-0 px-1 relative min-h-[52px]">
          <div className="flex items-center min-w-[70px]">
            {nivel !== "mundo" && (
              <button
                onClick={handleVolver}
                className="btn-fantasma px-3 py-1.5 text-xs sm:text-sm font-semibold flex items-center gap-1 shadow-sm active:scale-95 transition-transform"
              >
                <span>←</span> <span>Volver</span>
              </button>
            )}
          </div>

          <div className="flex-1 flex flex-col items-center justify-center text-center px-1">
            <h1 className="font-display text-lg sm:text-2xl font-bold tracking-tight text-[color:var(--color-ink)] whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
              {nivel === "mundo" && "Nuestro Mapa de Viajes"}
              {nivel === "pais" && paisActual}
              {nivel === "provincia" && (paisSinSubdividir ? paisActual : provinciaActual)}
            </h1>
            {nivel === "mundo" && (
              <span className="text-[10px] sm:text-xs font-caveat text-[color:var(--color-ink-soft)] -mt-1 tracking-wider">
                Explora y revive tus recuerdos
              </span>
            )}
          </div>

          <div className="min-w-[70px] flex items-center justify-end gap-2">
            {nivel !== "mundo" && (
              <button
                onClick={() => setModalListaMarcadoresAbierto(true)}
                className="w-10 h-10 rounded-full flex items-center justify-center shadow-md bg-white text-[color:var(--color-ink)] hover:bg-gray-50 active:scale-90 transition-transform relative"
                title="Gestionar todos mis marcadores"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 3v3m0 12v3M3 12h3m12 0h3" />
                </svg>
                <span className="absolute -top-1 -right-1 bg-[var(--color-plum)] text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-sm">
                  {marcadoresVisibles.length}
                </span>
              </button>
            )}

            {nivel !== "provincia" && nivel !== "mundo" && (
              <button
                onClick={() => setModoCrearMarcador((prev) => !prev)}
                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all active:scale-90 ${
                  modoCrearMarcador
                    ? "bg-[var(--color-rose)] text-white ring-4 ring-rose-200"
                    : "bg-white text-[color:var(--color-ink)]"
                }`}
                title={modoCrearMarcador ? "Cancelar" : "Colocar marcador"}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </button>
            )}
          </div>
        </header>

        {modoCrearMarcador && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-white/95 backdrop-blur-md px-4 py-1.5 rounded-full shadow-lg border border-[color:var(--color-rose)] flex items-center gap-2 animate-bounce">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-rose)] animate-ping" />
            <span className="text-xs font-semibold text-[color:var(--color-ink)]">
              Toca la pantalla para marcar el sitio exacto
            </span>
          </div>
        )}

        {/* MAPA MUNDI */}
        {nivel === "mundo" && (
          <div
            className={`relative w-full flex-1 min-h-0 bg-[#ede4dc] rounded-3xl shadow-sm overflow-hidden border border-[color:var(--color-line)] my-2 flex items-center justify-center ${claseTransicion}`}
          >
            {!mundoListo && <div className="spinner-carga" />}

            {mundoListo && (
              <>
                <ComposableMap projectionConfig={{ scale: 175 }} className="w-full h-full">
                  <ZoomableGroup
                    center={vistaMundo.coordinates}
                    zoom={vistaMundo.zoom}
                    onMoveEnd={setVistaMundo}
                    minZoom={1}
                    maxZoom={8}
                  >
                    <Geographies geography={mapaMundo}>
                      {({ geographies, projection }) =>
                        geographies.map((geo) => {
                          const nombreGeo = geo.properties?.name || geo.properties?.name_long || "";
                          const esVisitado =
                            paisesVisitados.has(nombreGeo.toLowerCase()) ||
                            (esMismoPais(nombreGeo, "Spain") &&
                              (paisesVisitados.has("spain") || paisesVisitados.has("españa")));
                          const fillDefecto = esVisitado ? "#e8a5b8" : PALETA.mundoDefecto;
                          const fillHover = esVisitado ? "#d87293" : PALETA.mundoHover;
                          return (
                            <Geography
                              key={geo.rsmKey}
                              geography={geo}
                              onClick={(evt) => handleClicMapa(geo, evt, projection)}
                              fill={fillDefecto}
                              stroke={PALETA.borde}
                              strokeWidth={0.8}
                              style={{
                                default: { outline: "none", transition: "fill 0.2s ease" },
                                hover: { fill: fillHover, outline: "none" },
                                pressed: { fill: fillHover, outline: "none" },
                              }}
                            />
                          );
                        })
                      }
                    </Geographies>


                  </ZoomableGroup>
                </ComposableMap>

                <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
                  <button
                    type="button"
                    onClick={() => setMostrarRutas((prev) => !prev)}
                    className={`${botonZoom} ${mostrarRutas ? "text-[color:var(--color-rose)] ring-2 ring-rose-200" : "text-gray-400"}`}
                    title={mostrarRutas ? "Ocultar Líneas de Ruta" : "Mostrar Líneas de Ruta"}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3.5c-.5-.5-2.5 0-4 1.5L13.5 8.5 5.3 6.7c-.5-.1-1 .1-1.3.5l-.8 1 5.3 3.6-2.5 2.5-2.3-.6-.8.8 2.6 2.6 2.6 2.6.8-.8-.6-2.3 2.5-2.5 3.6 5.3 1-.8c.4-.3.6-.8.5-1.3z" />
                    </svg>
                  </button>
                  <button type="button" onClick={acercarMundo} className={botonZoom} title="Acercar">+</button>
                  <button type="button" onClick={alejarMundo} className={botonZoom} title="Alejar">−</button>
                  <button type="button" onClick={restablecerMundo} className={botonZoom} title="Restablecer">⟲</button>
                </div>
              </>
            )}
          </div>
        )}

        {/* MAPA PAÍS */}
        {nivel === "pais" && (
          <div
            className={`relative w-full flex-1 min-h-0 bg-[#ede4dc] rounded-3xl shadow-sm overflow-hidden border border-[color:var(--color-line)] my-2 flex justify-center items-center ${claseTransicion}`}
          >
            {cargandoPais && <div className="spinner-carga" />}

            {errorPais && (
              <div className="text-center p-8 text-[color:var(--color-ink-soft)] max-w-md">
                <p className="font-bold mb-1 text-[color:var(--color-ink)]">No se pudo cargar el mapa de {paisActual}</p>
                <p className="text-sm">{errorPais}</p>
              </div>
            )}

            {geoPais && !cargandoPais && !errorPais && (
              <>
                <ComposableMap
                  projectionConfig={{ scale: vistaPais.scale }}
                  projection="geoMercator"
                  width={ANCHO_MAPA}
                  height={ALTO_MAPA}
                  className="w-full h-full"
                >
                  <ZoomableGroup
                    center={vistaInteractiva.coordinates}
                    zoom={vistaInteractiva.zoom}
                    onMoveEnd={setVistaInteractiva}
                    minZoom={0.4}
                    maxZoom={10}
                  >
                    <Geographies geography={geoPais}>
                      {({ geographies, projection }) =>
                        geographies.map((geo) => {
                          const estaResaltada = geo.rsmKey === provinciaResaltada;
                          return (
                            <Geography
                              key={geo.rsmKey}
                              geography={geo}
                              onClick={(evt) => handleClicMapa(geo, evt, projection)}
                              fill={estaResaltada ? PALETA.paisHover : PALETA.paisDefecto}
                              stroke={PALETA.borde}
                              strokeWidth={estaResaltada ? 1.8 : 1}
                              style={{
                                default: { outline: "none", transition: "fill 0.2s ease" },
                                hover: { fill: PALETA.paisHover, outline: "none" },
                                pressed: { fill: PALETA.paisHover, outline: "none" },
                              }}
                            />
                          );
                        })
                      }
                    </Geographies>

                    {/* LÍNEAS DE VUELO / RUTA DISCONTINUAS EN PAÍS */}
                    {mostrarRutas &&
                      lineasRutaPais.map((linea) => (
                        <Line
                          key={linea.id}
                          from={linea.from}
                          to={linea.to}
                          stroke="#c2416b"
                          strokeWidth={2}
                          strokeDasharray="6 4"
                          strokeLinecap="round"
                          style={{ default: { outline: "none" } }}
                        />
                      ))}

                    {marcadoresPaisActual.map((m) => {
                      const r = m.size ?? 6;
                      const grosorBorde = r <= 2 ? 0.5 : Math.max(1, +(r * 0.25).toFixed(1));
                      const rHalo = r <= 2 ? r + 1 : r + 3;
                      const rHitArea = r + 2;
                      return (
                        <Marker key={m.id} coordinates={m.coordinates}>
                          <g onClick={(e) => alPulsarMarcador(m, e)} className="cursor-pointer group">
                            <circle r={rHitArea} fill="transparent" />
                            <circle r={rHalo} fill={m.color} opacity={0.35} className="animate-ping" pointerEvents="none" />
                            <circle r={r} fill={m.color} stroke="#ffffff" strokeWidth={grosorBorde} />
                            {m.etiqueta && (
                              <text
                                textAnchor="middle"
                                y={-(r + 5)}
                                style={{
                                  fontFamily: "var(--font-caveat), cursive",
                                  fontSize: "14px",
                                  fontWeight: "bold",
                                  fill: "var(--color-ink)",
                                  stroke: "#ffffff",
                                  strokeWidth: "3px",
                                  paintOrder: "stroke",
                                  pointerEvents: "none",
                                }}
                              >
                                {m.etiqueta}
                              </text>
                            )}
                          </g>
                        </Marker>
                      );
                    })}
                  </ZoomableGroup>
                </ComposableMap>

                <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
                  <button
                    type="button"
                    onClick={() => setMostrarRutas((prev) => !prev)}
                    className={`${botonZoom} ${mostrarRutas ? "text-[color:var(--color-rose)] ring-2 ring-rose-200" : "text-gray-400"}`}
                    title={mostrarRutas ? "Ocultar Líneas de Ruta" : "Mostrar Líneas de Ruta"}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3.5c-.5-.5-2.5 0-4 1.5L13.5 8.5 5.3 6.7c-.5-.1-1 .1-1.3.5l-.8 1 5.3 3.6-2.5 2.5-2.3-.6-.8.8 2.6 2.6 2.6 2.6.8-.8-.6-2.3 2.5-2.5 3.6 5.3 1-.8c.4-.3.6-.8.5-1.3z" />
                    </svg>
                  </button>
                  <button type="button" onClick={acercar} className={botonZoom} title="Acercar">+</button>
                  <button type="button" onClick={alejar} className={botonZoom} title="Alejar">−</button>
                  <button type="button" onClick={restablecerVista} className={botonZoom} title="Restablecer">⟲</button>
                </div>
              </>
            )}
          </div>
        )}

        {/* NIVEL PROVINCIA */}
        {nivel === "provincia" && (
          <div className="w-full flex-1 overflow-y-auto mt-2 animate-fade-in-down">
            {!creandoNuevo ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 pb-6">
                <div
                  onClick={() => {
                    setViajeEnEdicion(null);
                    setCreandoNuevo(true);
                  }}
                  className="w-full h-72 sm:h-80 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all shadow-sm bg-white/40"
                  style={{ borderColor: "var(--color-line)" }}
                >
                  <span
                    className="w-14 h-14 rounded-full flex items-center justify-center text-white"
                    style={{ background: "var(--aurora)" }}
                  >
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </span>
                  <span className="font-display font-semibold text-lg mt-2">Nuevo recuerdo</span>
                </div>

                {viajesDeEstaProvincia.map((viaje, index) => (
                  <div
                    key={viaje.id}
                    className="recuerdo-entrada"
                    style={{ animationDelay: `${index * 0.08}s` }}
                  >
                    <MemoriaCard
                      recuerdo={viaje}
                      onAbrir={() => setAlbumAbierto(viaje)}
                      onEditar={() => iniciarEdicion(viaje)}
                      onEliminar={() => eliminarViaje(viaje.id)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <FormularioRecuerdo
                provincia={provinciaActual}
                pais={paisActual}
                recuerdoExistente={viajeEnEdicion}
                onGuardar={guardarViaje}
                onCancelar={() => {
                  setCreandoNuevo(false);
                  setViajeEnEdicion(null);
                }}
              />
            )}
          </div>
        )}

        {albumAbierto && (
          <AlbumModal
            recuerdo={albumAbierto}
            onCerrar={() => setAlbumAbierto(null)}
            onActualizarFoto={actualizarNotaFoto}
            onEditar={(v) => {
              setAlbumAbierto(null);
              iniciarEdicion(v);
            }}
            onEliminar={(id) => {
              eliminarViaje(id);
              setAlbumAbierto(null);
            }}
          />
        )}

        {/* MODAL CREAR NUEVO MARCADOR */}
        {marcadorPendiente && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-modal-in"
            onClick={() => setMarcadorPendiente(null)}
          >
            <div
              className="bg-white rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col gap-4 border-t sm:border border-[color:var(--color-line)] animate-fade-in-down"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto -mt-2 mb-1" />

              <h3 className="font-display text-xl font-bold text-[color:var(--color-ink)] text-center">
                Nuevo Marcador
              </h3>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-ink-soft)]">
                  Color del punto
                </label>
                <div className="flex justify-center gap-3 py-1">
                  {COLORES_MARCADOR.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setColorSeleccionado(c.hex)}
                      className={`w-10 h-10 rounded-full transition-transform active:scale-90 flex items-center justify-center ${
                        colorSeleccionado === c.hex ? "scale-110 ring-4 ring-offset-2 ring-gray-300" : ""
                      }`}
                      style={{ backgroundColor: c.hex }}
                    >
                      {colorSeleccionado === c.hex && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-[color:var(--color-ink-soft)]">
                  <span>Tamaño del punto</span>
                  <span className="text-xs font-bold text-[color:var(--color-ink)]">{tamanoSeleccionado}px</span>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-400 shrink-0" />
                  <input
                    type="range"
                    min="1"
                    max="14"
                    step="1"
                    value={tamanoSeleccionado}
                    onChange={(e) => setTamanoSeleccionado(Number(e.target.value))}
                    className="w-full accent-[var(--color-plum)] cursor-pointer"
                  />
                  <span className="w-5 h-5 rounded-full bg-gray-400 shrink-0" />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-ink-soft)]">
                  Nombre o Etiqueta
                </label>
                <input
                  type="text"
                  value={etiquetaMarcador}
                  onChange={(e) => setEtiquetaMarcador(e.target.value)}
                  placeholder="Ej: A Coruña, Playa..."
                  className="campo-sutil w-full text-base"
                  maxLength={20}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-ink-soft)]">
                  Enlazar a un Álbum (Opcional)
                </label>
                <select
                  value={albumIdSeleccionado}
                  onChange={(e) => setAlbumIdSeleccionado(e.target.value)}
                  className="campo-sutil w-full text-sm bg-white cursor-pointer"
                >
                  <option value="">-- Sin álbum enlazado --</option>
                  {todosLosRecuerdos.map((r) => (
                    <option key={r.id} value={r.id}>
                      📖 {r.titulo} ({r.provincia || r.pais})
                    </option>
                  ))}
                </select>
                {albumIdSeleccionado && (
                  <p className="text-xs text-[color:var(--color-plum)] font-caveat text-sm mt-0.5">
                    ✨ Al pulsar este punto en el mapa, abrirá este álbum directamente.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-2 pb-2">
                <button
                  type="button"
                  onClick={() => setMarcadorPendiente(null)}
                  className="btn-fantasma px-5 py-2.5 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={guardarMarcadorNuevo}
                  className="btn-primario px-6 py-2.5 text-xs font-semibold"
                >
                  Guardar Punto
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL EDITAR / ELIMINAR MARCADOR */}
        {marcadorEnEdicion && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-modal-in"
            onClick={() => setMarcadorEnEdicion(null)}
          >
            <div
              className="bg-white rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col gap-4 border-t sm:border border-[color:var(--color-line)] animate-fade-in-down"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto -mt-2 mb-1" />

              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-bold text-[color:var(--color-ink)]">
                  Editar Marcador
                </h3>
                <button
                  onClick={() => eliminarMarcador(marcadorEnEdicion.id)}
                  className="text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  Eliminar
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-ink-soft)]">
                  Color del punto
                </label>
                <div className="flex justify-center gap-3 py-1">
                  {COLORES_MARCADOR.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setColorSeleccionado(c.hex)}
                      className={`w-10 h-10 rounded-full transition-transform active:scale-90 flex items-center justify-center ${
                        colorSeleccionado === c.hex ? "scale-110 ring-4 ring-offset-2 ring-gray-300" : ""
                      }`}
                      style={{ backgroundColor: c.hex }}
                    >
                      {colorSeleccionado === c.hex && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-[color:var(--color-ink-soft)]">
                  <span>Tamaño del punto</span>
                  <span className="text-xs font-bold text-[color:var(--color-ink)]">{tamanoSeleccionado}px</span>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-400 shrink-0" />
                  <input
                    type="range"
                    min="1"
                    max="14"
                    step="1"
                    value={tamanoSeleccionado}
                    onChange={(e) => setTamanoSeleccionado(Number(e.target.value))}
                    className="w-full accent-[var(--color-plum)] cursor-pointer"
                  />
                  <span className="w-5 h-5 rounded-full bg-gray-400 shrink-0" />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-ink-soft)]">
                  Nombre o Etiqueta
                </label>
                <input
                  type="text"
                  value={etiquetaMarcador}
                  onChange={(e) => setEtiquetaMarcador(e.target.value)}
                  placeholder="Ej: A Coruña, Playa..."
                  className="campo-sutil w-full text-base"
                  maxLength={20}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-ink-soft)]">
                  Enlazar a un Álbum (Opcional)
                </label>
                <select
                  value={albumIdSeleccionado}
                  onChange={(e) => setAlbumIdSeleccionado(e.target.value)}
                  className="campo-sutil w-full text-sm bg-white cursor-pointer"
                >
                  <option value="">-- Sin álbum enlazado --</option>
                  {recuerdosFiltradosParaMarcador.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.titulo} ({r.provincia || r.pais})
                    </option>
                  ))}
                </select>
                {albumIdSeleccionado && (
                  <p className="text-xs text-[color:var(--color-plum)] font-caveat text-sm mt-0.5">
                    ✨ Al pulsar este punto en el mapa, abrirá este álbum directamente.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-2 pb-2">
                <button
                  type="button"
                  onClick={() => setMarcadorEnEdicion(null)}
                  className="btn-fantasma px-5 py-2.5 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={guardarMarcadorEditado}
                  className="btn-primario px-6 py-2.5 text-xs font-semibold"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL LISTA DE MARCADORES */}
        {modalListaMarcadoresAbierto && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-modal-in"
            onClick={() => setModalListaMarcadoresAbierto(false)}
          >
            <div
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-4 max-h-[85vh] border border-[color:var(--color-line)] animate-fade-in-down"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[var(--color-plum)]" />
                  <h3 className="font-display text-xl font-bold text-[color:var(--color-ink)]">
                    Mis Marcadores ({marcadoresVisibles.length})
                  </h3>
                </div>
                <button
                  onClick={() => setModalListaMarcadoresAbierto(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-col gap-3 overflow-y-auto pr-1 flex-1">
                {marcadoresVisibles.length === 0 ? (
                  <p className="text-center text-gray-500 py-8 font-caveat text-lg">
                    Aún no has colocado marcadores en esta vista.
                  </p>
                ) : (
                  marcadoresVisibles.map((m) => {
                    const albumEnlazado = todosLosRecuerdos.find((r) => r.id === m.albumId);
                    return (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition-all gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center shadow-sm border-2 border-white"
                            style={{ backgroundColor: m.color }}
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-sm text-[color:var(--color-ink)] truncate">
                              {m.etiqueta || "Marcador sin nombre"}
                            </span>
                            <span className="text-xs text-[color:var(--color-ink-soft)] capitalize">
                              {m.pais || "Mundo"} ({m.nivelOrigen})
                            </span>
                            {albumEnlazado && (
                              <span className="text-xs text-[color:var(--color-plum)] font-caveat text-sm font-semibold truncate flex items-center gap-1">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                </svg>
                                {albumEnlazado.titulo}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {albumEnlazado && (
                            <button
                              type="button"
                              onClick={() => {
                                setModalListaMarcadoresAbierto(false);
                                setAlbumAbierto(albumEnlazado);
                              }}
                              className="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-purple-50 text-[var(--color-plum)] hover:bg-purple-100 transition-colors"
                              title="Ver Álbum"
                            >
                              Ver Álbum
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              setModalListaMarcadoresAbierto(false);
                              abrirEdicionMarcador(m, e);
                            }}
                            className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                            title="Editar"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => eliminarMarcador(m.id)}
                            className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors"
                            title="Eliminar"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

      </main>
    </>
  );
}