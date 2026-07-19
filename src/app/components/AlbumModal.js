"use client";

import { useEffect, useState } from "react";
import FotoAmpliada from "./FotoAmpliada";

export default function AlbumModal({ recuerdo, onCerrar }) {
  const [fotoIndice, setFotoIndice] = useState(null);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        if (fotoIndice !== null) setFotoIndice(null);
        else onCerrar();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [fotoIndice, onCerrar]);

  return (
    <div className="fixed inset-0 bg-black/70 z-40 flex items-center justify-center p-4 md:p-10 animate-modal-in" onClick={onCerrar}>
      <div
        className="bg-[#fdf6ec] w-full max-w-4xl max-h-[85vh] rounded-lg shadow-2xl overflow-y-auto p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onCerrar}
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center bg-white rounded-full shadow hover:bg-gray-100 text-gray-600 text-xl"
        >
          ×
        </button>

        <div className="text-center mb-8 border-b border-gray-300 pb-4">
          <h3 className="text-3xl font-serif font-bold text-gray-800">{recuerdo.titulo}</h3>
          <p className="text-gray-500">{recuerdo.ubicacion} · {recuerdo.fecha}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8">
          {recuerdo.fotos?.map((foto, index) => (
            <div
              key={foto.id}
              onClick={() => setFotoIndice(index)}
              className="bg-white p-2 pb-6 shadow-md border border-gray-200 cursor-pointer hover:-translate-y-1 hover:shadow-xl transition-all"
              style={{ transform: `rotate(${(index % 2 === 0 ? -1 : 1) * (1 + (index % 3))}deg)` }}
            >
              <img src={foto.src} alt="" className="w-full h-32 object-cover" />
            </div>
          ))}
        </div>
      </div>

      {fotoIndice !== null && (
        <FotoAmpliada
          foto={recuerdo.fotos[fotoIndice]}
          frase={recuerdo.frase}
          onCerrar={() => setFotoIndice(null)}
        />
      )}
    </div>
  );
}