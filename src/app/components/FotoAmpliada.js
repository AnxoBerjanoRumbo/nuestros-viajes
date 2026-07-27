"use client";

import { useEffect, useState } from "react";

function BotonZoom({ onClick, title, children, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="w-11 h-11 flex items-center justify-center rounded-full bg-white shadow-md text-gray-700 transition-transform active:scale-90 disabled:opacity-30 disabled:active:scale-100"
    >
      {children}
    </button>
  );
}

export default function FotoAmpliada({ fotos, indiceInicial, onCerrar, onGuardarNota }) {
  const [indice, setIndice] = useState(indiceInicial);
  const [escala, setEscala] = useState(1);
  const [volteada, setVolteada] = useState(false);
  const [modoAjuste, setModoAjuste] = useState(0); // 0: cover center, 1: cover top, 2: contain
  const [notaTexto, setNotaTexto] = useState(fotos[indiceInicial]?.notaDorso || "");
  const [guardado, setGuardado] = useState(false);

  const foto = fotos[indice];

  useEffect(() => {
    setNotaTexto(fotos[indice]?.notaDorso || "");
    setVolteada(false);
    setEscala(1);
    setGuardado(false);
  }, [indice, fotos]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onCerrar();
      if (e.key === "ArrowRight") setIndice((i) => Math.min(i + 1, fotos.length - 1));
      if (e.key === "ArrowLeft") setIndice((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onCerrar, fotos.length]);

  if (!foto) return null;

  const guardarNota = () => {
    onGuardarNota?.(foto.id, notaTexto.trim());
    setGuardado(true);
    setTimeout(() => setGuardado(false), 1200);
  };

  const alternarEncuadre = () => {
    setModoAjuste((prev) => (prev + 1) % 3);
  };

  // Configuración de encuadre según el modo activo
  const estilosAjuste = [
    { fit: "object-cover", pos: "center" },
    { fit: "object-cover", pos: "top" },
    { fit: "object-contain", pos: "center" },
  ][modoAjuste];

  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-between p-4 overflow-hidden animate-fade-in-down"
      onClick={(e) => {
        e.stopPropagation();
        onCerrar();
      }}
    >
      {/* Botón de cerrar */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onCerrar();
        }}
        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-white/95 rounded-full shadow-lg text-gray-700 z-30 active:scale-90"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* ÁREA CENTRAL */}
      <div className="relative flex-1 w-full flex items-center justify-center px-6" onClick={(e) => e.stopPropagation()}>
        
        {/* Flecha Izquierda */}
        {fotos.length > 1 && (
          <button
            type="button"
            onClick={() => setIndice((i) => Math.max(i - 1, 0))}
            disabled={indice === 0}
            className="absolute left-2 z-30 w-10 h-10 rounded-full bg-white/90 text-gray-800 flex items-center justify-center shadow-lg disabled:opacity-20 active:scale-90"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}

        {/* Tarjeta 3D */}
        <div className="flex flex-col items-center justify-center w-full h-full">
          <div className="entrada-3d-wrap">
            <div
              key={indice}
              className="foto-flip animacion-coger-foto"
              style={{
                width: `min(82vw, ${380 * escala}px)`,
                height: `min(62vh, ${480 * escala}px)`,
              }}
            >
              <div className={`foto-flip-inner ${volteada ? "volteada" : ""}`}>
                
                {/* CARA FRONTAL: Con ajuste de posición dinámico sin alterar el diseño */}
                <div className="foto-cara flex items-center justify-center overflow-hidden rounded-lg bg-black/20">
                  <img
                    src={foto.src}
                    alt=""
                    className={`w-full h-full rounded-lg transition-all duration-300 ${estilosAjuste.fit}`}
                    style={{ objectPosition: estilosAjuste.pos }}
                  />
                </div>

                {/* CARA TRASERA: NOTA (INTACTA) */}
                <div className="foto-cara foto-dorso bg-[#f4ecd8] p-6 flex flex-col items-center justify-center rounded-lg shadow-2xl">
                  <textarea
                    value={notaTexto}
                    onChange={(e) => setNotaTexto(e.target.value)}
                    onBlur={guardarNota}
                    placeholder="Escribe algo detrás de la foto..."
                    className="w-full h-40 bg-transparent resize-none outline-none text-xl text-gray-700 leading-snug font-caveat text-center"
                    rows={5}
                  />
                  <button
                    type="button"
                    onClick={guardarNota}
                    title="Guardar nota"
                    className={`btn-guardar-dorso ${guardado ? "guardado" : ""}`}
                  >
                    {guardado ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
                        <polyline points="17 21 17 13 7 13 7 21" />
                        <polyline points="7 3 7 8 15 8" />
                      </svg>
                    )}
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Flecha Derecha */}
        {fotos.length > 1 && (
          <button
            type="button"
            onClick={() => setIndice((i) => Math.min(i + 1, fotos.length - 1))}
            disabled={indice === fotos.length - 1}
            className="absolute right-2 z-30 w-10 h-10 rounded-full bg-white/90 text-gray-800 flex items-center justify-center shadow-lg disabled:opacity-20 active:scale-90"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        )}
      </div>

      {/* CONTROLES INFERIORES: Reducir (-), Mover/Encuadrar (Mismo botón), Voltear (⟲), Ampliar (+) */}
      <div className="flex items-center gap-3 bg-white/25 backdrop-blur-md rounded-full px-4 py-2 z-30 mb-2" onClick={(e) => e.stopPropagation()}>
        <BotonZoom onClick={() => setEscala((s) => Math.max(0.6, +(s - 0.2).toFixed(1)))} title="Reducir">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </BotonZoom>
        
        {/* NUEVO BOTÓN: Ajustar posición / encuadre de la foto */}
        <BotonZoom onClick={alternarEncuadre} title="Ajustar encuadre de la foto">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
        </BotonZoom>

        <BotonZoom onClick={() => setVolteada((v) => !v)} title="Voltear foto">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 2.1l4 4-4 4" />
            <path d="M3 12.2v-2a4 4 0 0 1 4-4h14" />
            <path d="M7 21.9l-4-4 4-4" />
            <path d="M21 11.8v2a4 4 0 0 1-4 4H3" />
          </svg>
        </BotonZoom>

        <BotonZoom onClick={() => setEscala((s) => Math.min(1.8, +(s + 0.2).toFixed(1)))} title="Ampliar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </BotonZoom>
      </div>

      <style jsx>{`
        .foto-flip {
          perspective: 1200px;
          transition: width 0.2s ease, height 0.2s ease;
        }
        .foto-flip-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1);
          transform-style: preserve-3d;
        }
        .foto-flip-inner.volteada {
          transform: rotateY(180deg);
        }
        .foto-cara {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .foto-dorso {
          transform: rotateY(180deg);
        }

        @keyframes cogerFoto3D {
          0% {
            opacity: 0;
            transform: scale(0.4) translateY(60px) rotateX(-25deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0) rotateX(0deg);
          }
        }
        .animacion-coger-foto {
          animation: cogerFoto3D 0.38s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}