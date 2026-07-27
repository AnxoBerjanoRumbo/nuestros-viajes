"use client";

export default function MemoriaCard({ recuerdo, onAbrir, onEditar, onEliminar }) {
  // Buscar la foto que coincida con el portadaId o coger la primera
  const fotoPortada =
    recuerdo.fotos?.find((f) => f.id === recuerdo.portadaId)?.src ||
    recuerdo.fotos?.[0]?.src ||
    recuerdo.portada ||
    recuerdo.imagen;

  return (
    <div
      onClick={onAbrir}
      className="group relative bg-[color:var(--color-paper)] rounded-3xl p-3 shadow-md border border-[color:var(--color-line)] cursor-pointer transition-all hover:shadow-xl active:scale-98 flex flex-col justify-between"
    >
      {/* Botones de acción flotantes (Editar y Eliminar con tu color neutro) */}
      <div
        className="absolute top-4 right-4 z-10 flex gap-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        {onEditar && (
          <button
            type="button"
            onClick={onEditar}
            className="w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center text-[color:var(--color-ink-soft)] active:scale-90"
            title="Editar"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          </button>
        )}
        {onEliminar && (
          <button
            type="button"
            onClick={onEliminar}
            className="w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center text-[color:var(--color-ink-soft)] active:scale-90"
            title="Eliminar"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        )}
      </div>

      {/* Área de la imagen de portada */}
      <div className="w-full h-44 sm:h-48 rounded-2xl overflow-hidden bg-[#ede4dc] flex items-center justify-center relative">
        {fotoPortada ? (
          <img
            src={fotoPortada}
            alt={recuerdo.titulo}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        )}
      </div>

      {/* Pie con Título y Fecha */}
      <div className="text-center pt-3 pb-1">
        <h4 className="font-display font-bold text-base text-[color:var(--color-ink)] truncate px-2">
          {recuerdo.titulo}
        </h4>
        {recuerdo.fecha && (
          <p className="text-xs text-[color:var(--color-ink-soft)] font-caveat text-sm mt-0.5">
            {recuerdo.fecha}
          </p>
        )}
      </div>
    </div>
  );
}