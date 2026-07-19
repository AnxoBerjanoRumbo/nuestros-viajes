export function comprimirImagen(file, maxAncho = 1280, calidad = 0.75) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const escala = Math.min(1, maxAncho / img.width);
        const ancho = img.width * escala;
        const alto = img.height * escala;

        const canvas = document.createElement("canvas");
        canvas.width = ancho;
        canvas.height = alto;
        canvas.getContext("2d").drawImage(img, 0, 0, ancho, alto);

        resolve(canvas.toDataURL("image/jpeg", calidad));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    lector.onerror = reject;
    lector.readAsDataURL(file);
  });
}