"use client";

import { useState } from "react";
import { comprimirImagen } from "../utils/imagenUtils";

export default function FormularioRecuerdo({ provincia, onGuardar, onCancelar }) {
  const [titulo, setTitulo] = useState("");
  const [fecha, setFecha] = useState("");
  const [frase, setFrase] = useState("");
  const [fotos, setFotos] = useState([]); // [{ id, src }]
  const [portadaId, setPortadaId] = useState(null);
  const [procesando, setProcesando] = useState(false);

  const handleFotos = async (e) => {
    const archivos = Array.from(e.target.files || []);
    if (archivos.length === 0) return;

    setProcesando(true);
    const nuevas = [];
    for (const archivo of archivos) {
      try {
        const src = await comprimirImagen(archivo);
        nuevas.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, src });
      } catch (err) {
        console.error("No se pudo procesar una imagen:", err);
      }
    }

    setFotos((prev) => {
      const combinado = [...prev, ...nuevas];
      if (!portadaId && combinado.length > 0) setPortadaId(combinado[0].id);
      return combinado;
    });
    setProcesando(false);
    e.target.value = "";
  };

  const quitarFoto = (id) => {
    setFotos((prev) => {
      const restante = prev.filter((f) => f.id !== id);
      if (portadaId === id) setPortadaId(restante[0]?.id ?? null);
      return restante;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!titulo.trim()) return alert("Ponle un título al viaje");
    if (fotos.length === 0) return alert("Añade al menos una foto del día");

    const fotoPortada = fotos.find((f) => f.id === portadaId)?.src || fotos[0].src;

    onGuardar({
      titulo: titulo.trim(),
      ubicacion: provincia,
      fecha,
      frase: frase.trim(),
      fotoPortada,
      fotos,
    });
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-xl border-2 border-gray-100 mb-10 animate-fade-in-down">
      <h3 className="text-2xl font-serif text-gray-800 mb-6">
        Nuevo recuerdo en <span className="text-[#ff6347]">{provincia}</span>
      </h3>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-gray-600">Título</label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#ff6347]"
            placeholder="Ej: Escapada de fin de semana"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-semibold text-gray-600">Ubicación</label>
          <input
            type="text"
            value={provincia}
            disabled
            className="p-3 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-semibold text-gray-600">Fecha</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="p-3 border border-gray-300 rounded-lg"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-semibold text-gray-600">Frase corta</label>
          <input
            type="text"
            value={frase}
            onChange={(e) => setFrase(e.target.value)}
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#ff6347]"
            placeholder="Un recuerdo, una sensación..."
          />
        </div>

        <div className="md:col-span-2 flex flex-col gap-2">
          <label className="font-semibold text-gray-600">
            Fotos del día {procesando && <span className="text-xs text-gray-400">(procesando...)</span>}
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFotos}
            className="p-2 border border-gray-300 rounded-lg bg-white file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-[#ff6347] file:text-white file:font-semibold file:cursor-pointer"
          />
          <p className="text-xs text-gray-400">
            Haz clic en la ⭐ de una foto para marcarla como portada del álbum.
          </p>

          {fotos.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mt-2">
              {fotos.map((foto) => (
                <div key={foto.id} className="relative group">
                  <img
                    src={foto.src}
                    alt=""
                    className={`w-full h-20 object-cover rounded-lg border-2 ${
                      portadaId === foto.id ? "border-[#ff6347]" : "border-gray-200"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setPortadaId(foto.id)}
                    className={`absolute top-1 left-1 text-lg leading-none ${
                      portadaId === foto.id ? "text-[#ff6347]" : "text-white drop-shadow"
                    }`}
                    title="Marcar como portada"
                  >
                    {portadaId === foto.id ? "★" : "☆"}
                  </button>
                  <button
                    type="button"
                    onClick={() => quitarFoto(foto.id)}
                    className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center bg-black/50 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Quitar foto"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="md:col-span-2 mt-4 flex justify-end gap-4">
          <button type="button" onClick={onCancelar} className="px-6 py-3 text-gray-500 font-bold hover:text-gray-800">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={procesando}
            className="px-8 py-3 bg-[#4caf50] text-white font-bold rounded-lg shadow hover:bg-[#43a047] disabled:opacity-50"
          >
            Guardar Viaje
          </button>
        </div>
      </form>
    </div>
  );
}