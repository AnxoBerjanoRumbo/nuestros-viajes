"use client";

import { useState, useEffect } from "react";

export function useGeografia(url) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!url) {
      setDatos(null);
      setError(null);
      return;
    }

    let cancelado = false;
    setCargando(true);
    setError(null);
    setDatos(null);

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`El mapa respondió con estado ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (!cancelado) setDatos(json);
      })
      .catch((err) => {
        if (!cancelado) setError(err.message);
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [url]);

  return { datos, cargando, error };
}