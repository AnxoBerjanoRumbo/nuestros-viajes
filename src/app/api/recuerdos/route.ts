import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

// 1. OBTENER RECUERDOS Y MARCADORES (GET)
export async function GET() {
  try {
    const recuerdos = await prisma.recuerdoViaje.findMany({
      orderBy: { createdAt: "desc" },
    });
    const marcadores = await prisma.marcadorMapa.findMany();

    return NextResponse.json({ recuerdos, marcadores }, { status: 200 });
  } catch (error) {
    console.error("Error al obtener datos:", error);
    return NextResponse.json(
      { error: "Error al recuperar los recuerdos de la base de datos" },
      { status: 500 }
    );
  }
}

// 2. GUARDAR NUEVO RECUERDO Y MARCADOR (POST)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pais, provincia, titulo, ubicacion, fecha, fotos, frases, marcador } = body;

    // Guardamos el recuerdo del viaje
    const nuevoRecuerdo = await prisma.recuerdoViaje.create({
      data: {
        pais,
        provincia,
        titulo,
        ubicacion,
        fecha,
        fotos,   // Array de URLs de Cloudinary enviado como JSON
        frases,  // Array de frases enviado como JSON
      },
    });

    // Si además el formulario envió coordenadas para el mapa, guardamos el marcador
    let nuevoMarcador = null;
    if (marcador) {
      nuevoMarcador = await prisma.marcadorMapa.create({
        data: {
          coordinates: marcador.coordinates,
          color: marcador.color || "#FF0000",
          size: marcador.size || 20,
          etiqueta: marcador.etiqueta || titulo,
          nivelOrigen: marcador.nivelOrigen || "provincia",
          pais: pais,
        },
      });
    }

    return NextResponse.json(
      { recuerdo: nuevoRecuerdo, marcador: nuevoMarcador },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al guardar el recuerdo:", error);
    return NextResponse.json(
      { error: "Error al guardar el recuerdo en la base de datos" },
      { status: 500 }
    );
  }
}