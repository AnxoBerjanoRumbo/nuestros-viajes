"use client";

export default function MemoriaCard({ recuerdo, onAbrir }) {
  return (
    <div
      onClick={onAbrir}
      className="w-full h-80 bg-white p-3 pb-10 shadow-xl border border-gray-200 cursor-pointer hover:scale-105 hover:shadow-2xl transition-all duration-300 flex flex-col"
    >
      <div className="w-full flex-1 bg-gray-200 overflow-hidden">
        {recuerdo.fotoPortada ? (
          <img src={recuerdo.fotoPortada} alt={recuerdo.titulo} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-400">📷</div>
        )}
      </div>
      <div className="pt-2 text-center">
        <p className="font-bold font-serif text-gray-800 truncate">{recuerdo.titulo}</p>
        <p className="text-xs text-gray-500">{recuerdo.fecha}</p>
      </div>
    </div>
  );
}