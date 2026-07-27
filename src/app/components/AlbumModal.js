"use client";

import { useState, useEffect, useMemo } from "react";
import FotoAmpliada from "./FotoAmpliada";

// Generador de números pseudo-aleatorios basados en semilla para que no cambien al re-renderizar
function semilla(texto) {
  let hash = 0;
  for (let i = 0; i < texto.length; i++) {
    hash = (hash << 5) - hash + texto.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function aleatorio(str, min, max) {
  const s = semilla(str);
  const r = Math.abs(Math.sin(s) * 10000) % 1;
  return min + r * (max - min);
}

export default function AlbumModal({ recuerdo, onCerrar, onActualizarFoto, onEditar, onEliminar }) {
  const [fotoIndice, setFotoIndice] = useState(null);
  const [paginaActual, setPaginaActual] = useState(0);
  const [direccionAnim, setDireccionAnim] = useState("");
  const [animandoPagina, setAnimandoPagina] = useState(false);

  const fotos = recuerdo.fotos || [];
  const frases = recuerdo.frases?.length ? recuerdo.frases : recuerdo.frase ? [recuerdo.frase] : [];

  const FOTOS_POR_PAGINA = 6;
  const totalPaginas = Math.max(1, Math.ceil(fotos.length / FOTOS_POR_PAGINA));
  const fotosPagina = fotos.slice(paginaActual * FOTOS_POR_PAGINA, (paginaActual + 1) * FOTOS_POR_PAGINA);

  // ============================================================
  // GENERACIÓN DE FRASES DE FONDO CON POSICIONAMIENTO INTELIGENTE
  // 1. Evita la zona del título.
  // 2. Cubre todo el área de forma equilibrada mediante una retícula lógica.
  // 3. Posiciona aleatoriamente *dentro* de la celda y con rotación aleatoria para evitar superposiciones y amontonamientos.
  // ============================================================
  const frasesFondoDistribuidas = useMemo(() => {
    if (!frases.length) return [];
    
    const lista = [];
    
    // DEFINIR ZONAS DE EXCLUSIÓN Y USO (en %)
    const AREA_UTIL = {
      top: 25,    // Empezar después del título
      bottom: 95, // Margen inferior
      left: 5,    // Margen izquierdo
      right: 90   // Margen derecho
    };
    
    // Configuración de la retícula lógica para distribución equilibrada
    // Usamos celdas generosas para que las frases cortas como "222222" no se amontonen.
    const numColumnas = 4;
    const numFilas = 7;
    const anchoCelda = (AREA_UTIL.right - AREA_UTIL.left) / numColumnas;
    const altoCelda = (AREA_UTIL.bottom - AREA_UTIL.top) / numFilas;
    
    // Parámetro de "caos" dentro de la celda (% del tamaño de la celda)
    const caosX = anchoCelda * 0.35; // +/- % del ancho de la celda para el centro
    const caosY = altoCelda * 0.35;  // +/- % del alto de la celda para el centro
    
    // Iterar por la retícula y colocar una frase en cada celda
    for (let fila = 0; fila < numFilas; fila++) {
      for (let col = 0; col < numColumnas; col++) {
        const txtIdx = (fila * numColumnas + col) % frases.length;
        const txt = frases[txtIdx];
        const keyBase = `frase-${fila}-${col}-${txt}`;
        
        // Calcular centro teórico de la celda
        const centroXTeorico = AREA_UTIL.left + (col + 0.5) * anchoCelda;
        const centroYTeorico = AREA_UTIL.top + (fila + 0.5) * altoCelda;
        
        // Añadir ruido aleatorio al centro para que no se vea lineal
        const rTop = centroYTeorico + aleatorio(keyBase + "top", -caosY, caosY);
        const rLeft = centroXTeorico + aleatorio(keyBase + "left", -caosX, caosX);
        
        // Rotación, tamaño y opacidad aleatorios
        const rRot = aleatorio(keyBase + "rot", -25, 25); // Inclinación suave y natural
        const rSize = aleatorio(keyBase + "size", 1.1, 1.5);
        const rOpacity = aleatorio(keyBase + "op", 0.15, 0.35); // Opacidad baja para que sean de fondo
        
        lista.push({
          id: keyBase,
          texto: txt,
          top: rTop,
          left: rLeft,
          rot: rRot,
          size: rSize,
          opacity: rOpacity,
        });
      }
    }
    return lista;
  }, [frases]);

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina < 0 || nuevaPagina >= totalPaginas || animandoPagina) return;
    
    setDireccionAnim(nuevaPagina > paginaActual ? "deslizando-izq" : "deslizando-der");
    setAnimandoPagina(true);

    setTimeout(() => {
      setPaginaActual(nuevaPagina);
      setDireccionAnim("");
      setAnimandoPagina(false);
    }, 300);
  };

  useEffect(() => {
    const handleTeclas = (e) => {
      if (e.key === "Escape" && fotoIndice === null) onCerrar();
    };
    window.addEventListener("keydown", handleTeclas);
    return () => window.removeEventListener("keydown", handleTeclas);
  }, [fotoIndice, onCerrar]);

  return (
    <div className="fixed inset-0 z-40 fondo-album overflow-hidden flex flex-col justify-between animate-modal-in" onClick={onCerrar}>
      
      {/* FRASES DE FONDO CON POSICIONAMIENTO INTELIGENTE Y ALEATORIO */}
      {frasesFondoDistribuidas.length > 0 && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-1">
          {frasesFondoDistribuidas.map((f) => (
            <span
              key={f.id}
              className="absolute font-caveat whitespace-nowrap user-select-none"
              style={{
                top: `${f.top}%`,
                left: `${f.left}%`,
                transform: `translate(-50%, -50%) rotate(${f.rot}deg)`, // Centrar el texto en el punto calculado
                fontSize: `${f.size}rem`,
                color: "var(--color-plum)",
                opacity: f.opacity,
              }}
            >
              {f.texto}
            </span>
          ))}
        </div>
      )}

      {/* BOTÓN CERRAR SUPERIOR */}
      <button
        type="button"
        onClick={onCerrar}
        className="album-cabecera-btn fixed top-4 right-4 z-30"
        title="Cerrar"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* BOTONES EDITAR Y ELIMINAR */}
      <div className="fixed top-4 left-4 z-30 flex gap-2" onClick={(e) => e.stopPropagation()}>
        {onEditar && (
          <button type="button" onClick={() => onEditar(recuerdo)} className="album-cabecera-btn" title="Editar">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          </button>
        )}
        {onEliminar && (
          <button 
            type="button" 
            onClick={() => onEliminar(recuerdo.id)} 
            className="album-cabecera-btn" 
            title="Eliminar"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        )}
      </div>

      {/* HOJA DEL ÁLBUM */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-between px-4 pt-12 pb-4 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        
        {/* ENCABEZADO */}
        <div className="text-center mb-2 shrink-0">
          <h3 className="font-display text-3xl sm:text-4xl font-bold text-[color:var(--color-ink)]">
            {recuerdo.titulo}
          </h3>
          <p className="text-sm text-[color:var(--color-ink-soft)] mt-0.5">{recuerdo.ubicacion}</p>
          {recuerdo.fecha && (
            <span className="inline-block mt-0.5 text-lg text-[color:var(--color-plum)] font-caveat">
              {recuerdo.fecha}
            </span>
          )}
        </div>

        {/* RETÍCULA DE 6 POLAROIDS */}
        {fotos.length === 0 ? (
          <p className="text-center text-gray-500 py-10 font-caveat text-xl">Aún no hay fotos en este recuerdo.</p>
        ) : (
          <div className={`hoja-album-animada flex-1 flex items-center w-full my-auto ${direccionAnim}`}>
            <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:gap-6 max-w-xs sm:max-w-sm mx-auto w-full py-2">
              {fotosPagina.map((foto, idx) => {
                const indiceReal = paginaActual * FOTOS_POR_PAGINA + idx;
                const rotaciones = [-3, 2.5, -2, 3.5, -1.5, 2];
                const rot = rotaciones[idx % 6];

                return (
                    <div key={foto.id} className="relative flex justify-center">
                    {/* Tape Wasahi decorativo */}
                    <div className="polaroid-cinta" />
                    
                    {/* Foto Polaroid en el álbum */}
                    <button
                      type="button"
                      onClick={() => setFotoIndice(indiceReal)}
                      className="polaroid-album-card"
                      style={{ transform: `rotate(${rot}deg)` }}
                    >
                      <div className="w-full aspect-square overflow-hidden bg-[#f3ece6]">
                        <img src={foto.src} alt="" className="w-full h-full object-cover" />
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PAGINACIÓN INFERIOR */}
        {totalPaginas > 1 && (
          <div className="relative z-20 pt-2 pb-2 flex items-center justify-center gap-5 shrink-0">
            <button
              type="button"
              onClick={() => cambiarPagina(paginaActual - 1)}
              disabled={paginaActual === 0 || animandoPagina}
              className="btn-flecha-album"
              title="Página anterior"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            
            <span className="font-caveat text-lg font-bold text-[color:var(--color-ink-soft)]">
              Página {paginaActual + 1} de {totalPaginas}
            </span>

            <button
              type="button"
              onClick={() => cambiarPagina(paginaActual + 1)}
              disabled={paginaActual === totalPaginas - 1 || animandoPagina}
              className="btn-flecha-album"
              title="Página siguiente"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* VISOR DE FOTO AMPLIADA CON ANIMACIÓN 3D */}
      {fotoIndice !== null && (
        <FotoAmpliada
          fotos={fotos}
          indiceInicial={fotoIndice}
          onCerrar={() => setFotoIndice(null)}
          onGuardarNota={(fotoId, texto) => onActualizarFoto?.(recuerdo.id, fotoId, texto)}
        />
      )}
    </div>
  );
}