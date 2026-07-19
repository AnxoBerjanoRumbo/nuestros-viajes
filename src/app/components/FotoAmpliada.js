"use client";

import { useState } from "react";

export default function FotoAmpliada({ foto, frase, onCerrar }) {
  const [volteada, setVolteada] = useState(false);
  const [zoom, setZoom] = useState(1);

  const cambiarZoom = (delta) => (e) => {
    e.stopPropagation();
    setZoom((z) => Math.min(2.5, Math.max(0.6, +(z + delta).toFixed(1))));
  };

  return (
    <div
      className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-6 animate-modal-in"
      onClick={(e) => {
        e.stopPropagation(); // no cierra también el álbum de detrás
        onCerrar();
      }}
    >
      <div
        className="foto-ampliada-wrap"
        style={{ transform: `scale(${zoom})` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`foto-ampliada-inner ${volteada ? "volteada" : ""}`} onClick={() => setVolteada((v) => !v)}>
          <div className="polaroid-cara polaroid-frente">
            <div className="polaroid-foto-wrap">
              <img src={foto.src} alt="" className="polaroid-foto" />
            </div>
          </div>
          <div className="polaroid-cara polaroid-dorso">
            <p className="font-serif italic text-gray-700 text-xl leading-snug">
              {frase ? `"${frase}"` : "Sin frase añadida"}
            </p>
          </div>
        </div>
      </div>

      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white/90 rounded-full px-4 py-2 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={cambiarZoom(-0.2)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 font-bold">−</button>
        <span className="text-sm text-gray-600 w-12 text-center">{Math.round(zoom * 100)}%</span>
        <button onClick={cambiarZoom(0.2)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 font-bold">+</button>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onCerrar(); }}
        className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center bg-white/90 rounded-full shadow text-gray-700 text-xl"
      >
        ×
      </button>
    </div>
  );
}