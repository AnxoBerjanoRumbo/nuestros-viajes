"use client";

import { useState } from "react";

export default function FormularioRecuerdo({ provincia, recuerdoExistente, onGuardar, onCancelar }) {
  const [titulo, setTitulo] = useState(recuerdoExistente?.titulo || "");
  const [ubicacion, setUbicacion] = useState(recuerdoExistente?.ubicacion || provincia || "");
  const [fecha, setFecha] = useState(recuerdoExistente?.fecha || new Date().toISOString().split("T")[0]);
  
  // Lista de fotos subidas
  const [fotos, setFotos] = useState(recuerdoExistente?.fotos || []);
  const [portadaId, setPortadaId] = useState(recuerdoExistente?.portadaId || (recuerdoExistente?.fotos?.[0]?.id || null));

  // Lista de frases para el fondo
  const [frases, setFrases] = useState(
    recuerdoExistente?.frases?.length 
      ? recuerdoExistente.frases 
      : recuerdoExistente?.frase 
        ? [recuerdoExistente.frase] 
        : [""]
  );

  // Manejador para subida de fotos a Cloudinary
  const handleSubirFotos = async (e) => {
    const archivos = Array.from(e.target.files || []);
    if (!archivos.length) return;

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    for (const file of archivos) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);

      try {
        const respuesta = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          {
            method: "POST",
            body: formData,
          }
        );
        const data = await respuesta.json();

        if (data.secure_url) {
          const nuevaFoto = {
            id: Date.now() + Math.random(),
            src: data.secure_url,
            notaDorso: "",
          };

          setFotos((prev) => {
            const listaActualizada = [...prev, nuevaFoto];
            if (!portadaId) {
              setPortadaId(nuevaFoto.id);
            }
            return listaActualizada;
          });
        }
      } catch (error) {
        console.error("Error al subir la foto a Cloudinary:", error);
      }
    }
  };

  const eliminarFoto = (id) => {
    const nuevasFotos = fotos.filter((f) => f.id !== id);
    setFotos(nuevasFotos);
    if (portadaId === id) {
      setPortadaId(nuevasFotos[0]?.id || null);
    }
  };

  // Manejadores de frases
  const handleCambiarFrase = (index, valor) => {
    const nuevas = [...frases];
    nuevas[index] = valor;
    setFrases(nuevas);
  };

  const agregarFrase = () => {
    setFrases([...frases, ""]);
  };

  const eliminarFrase = (index) => {
    if (frases.length === 1) {
      setFrases([""]);
      return;
    }
    setFrases(frases.filter((_, i) => i !== index));
  };

  // ENVÍO DE DATOS A LA BASE DE DATOS
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!titulo.trim()) {
      alert("Por favor, introduce un título para el recuerdo.");
      return;
    }

    const frasesFiltradas = frases.map((f) => f.trim()).filter((f) => f.length > 0);

    // Colocar la foto de la portada en la primera posición de la lista
    const fotosOrdenadas = [...fotos].sort((a, b) => {
      if (a.id === portadaId) return -1;
      if (b.id === portadaId) return 1;
      return 0;
    });

    const datosParaGuardar = {
      titulo: titulo.trim(),
      ubicacion: ubicacion.trim(),
      provincia: provincia || "Sin provincia",
      pais: "España",
      fecha,
      fotos: fotosOrdenadas,
      frases: frasesFiltradas,
    };

    try {
      // 1. Guardar en PostgreSQL
      const respuesta = await fetch("/api/recuerdos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosParaGuardar),
      });

      if (!respuesta.ok) {
        throw new Error("Error al guardar en la base de datos");
      }

      const datosGuardados = await respuesta.json();
      alert("¡Viaje guardado correctamente en la base de datos!");

      // 2. Notificar al componente padre
      if (onGuardar) {
        onGuardar(datosGuardados);
      }
    } catch (error) {
      console.error("Error al guardar el recuerdo:", error);
      alert("Hubo un error al guardar el viaje en la base de datos.");
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 sm:p-7 shadow-xl border border-[color:var(--color-line)] max-w-xl mx-auto my-2 animate-fade-in-down">
      <h2 className="font-display text-2xl font-bold text-center text-[color:var(--color-ink)] mb-6">
        {recuerdoExistente ? "Editar Recuerdo" : `Nuevo Recuerdo en ${provincia}`}
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* DATOS BÁSICOS */}
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-ink-soft)] block mb-1">
              Título del recuerdo
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Escapada de fin de semana"
              className="campo-sutil w-full text-base font-semibold"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-ink-soft)] block mb-1">
                Lugar
              </label>
              <input
                type="text"
                value={ubicacion}
                onChange={(e) => setUbicacion(e.target.value)}
                placeholder="Ej: A Coruña"
                className="campo-sutil w-full text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-ink-soft)] block mb-1">
                Fecha
              </label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="campo-sutil w-full text-sm"
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN DE FOTOS */}
        <div className="flex flex-col gap-3 pt-2 border-t border-[color:var(--color-line)]">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-ink-soft)]">
              Fotografías ({fotos.length})
            </label>
          </div>

          <label className="w-full py-3.5 border-2 border-dashed rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all hover:bg-gray-50 active:scale-98 border-[color:var(--color-line)]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span className="text-sm font-semibold text-[color:var(--color-ink)]">Añadir fotografías</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleSubirFotos}
              className="hidden"
            />
          </label>

          {fotos.length > 0 && (
            <div className="flex flex-col gap-2 mt-1">
              <span className="text-xs text-[color:var(--color-ink-soft)] font-caveat text-sm">
                Toca la ⭐ para marcar la foto de portada del álbum.
              </span>
              
              <div className="flex flex-wrap gap-3 max-h-48 overflow-y-auto p-1">
                {fotos.map((foto) => {
                  const esPortada = foto.id === portadaId;
                  return (
                    <div
                      key={foto.id}
                      className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shadow-sm ${
                        esPortada ? "border-[color:var(--color-rose)] ring-2 ring-rose-200 scale-105" : "border-white"
                      }`}
                    >
                      <img src={foto.src} alt="" className="w-full h-full object-cover" />

                      <button
                        type="button"
                        onClick={() => setPortadaId(foto.id)}
                        className="absolute top-1 left-1 w-6 h-6 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-xs text-white"
                        title={esPortada ? "Es la portada" : "Marcar como portada"}
                      >
                        {esPortada ? "⭐" : "☆"}
                      </button>

                      <button
                        type="button"
                        onClick={() => eliminarFoto(foto.id)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white"
                        title="Eliminar foto"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* SECCIÓN DE FRASES */}
        <div className="flex flex-col gap-3 pt-2 border-t border-[color:var(--color-line)]">
          <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-ink-soft)]">
            Frases para el fondo del álbum
          </label>

          <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
            {frases.map((frase, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={frase}
                  onChange={(e) => handleCambiarFrase(idx, e.target.value)}
                  placeholder={`Frase ${idx + 1}...`}
                  className="campo-sutil flex-1 text-sm font-caveat text-lg"
                  maxLength={50}
                />
                <button
                  type="button"
                  onClick={() => eliminarFrase(idx)}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 rounded-full active:scale-90"
                  title="Eliminar frase"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={agregarFrase}
            className="text-xs font-semibold text-[color:var(--color-plum)] self-start hover:underline flex items-center gap-1 mt-1"
          >
            <span>+</span> <span>Añadir otra frase</span>
          </button>
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div className="flex justify-end gap-3 pt-4 border-t border-[color:var(--color-line)]">
          <button
            type="button"
            onClick={onCancelar}
            className="btn-fantasma px-5 py-2.5 text-sm font-semibold"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-primario px-6 py-2.5 text-sm font-semibold shadow-md"
          >
            Guardar Viaje
          </button>
        </div>
      </form>
    </div>
  );
}