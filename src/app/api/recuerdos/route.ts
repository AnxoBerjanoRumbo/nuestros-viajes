import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Obtener todos los recuerdos y marcadores
export async function GET() {
  try {
    const recuerdos = await prisma.recuerdoViaje.findMany({
      orderBy: { createdAt: "desc" },
    });

    const marcadores = await prisma.marcadorMapa.findMany();

    return NextResponse.json({ recuerdos, marcadores });
  } catch (error) {
    console.error("Error al obtener recuerdos:", error);
    return NextResponse.json(
      { error: "Error al obtener recuerdos de la base de datos" },
      { status: 500 }
    );
  }
}

// POST: Crear un nuevo recuerdo o un nuevo marcador
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Si recibimos un marcador
    if (body.marcador) {
      const { coordinates, color, size, etiqueta, nivelOrigen, pais } = body.marcador;
      const nuevoMarcador = await prisma.marcadorMapa.create({
        data: {
          coordinates: coordinates || [0, 0],
          color: color || "#c2416b",
          size: size || 6,
          etiqueta: etiqueta || "",
          nivelOrigen: nivelOrigen || "mundo",
          pais: pais || "Mundo",
        },
      });
      return NextResponse.json(nuevoMarcador);
    }

    // Si recibimos un recuerdo
    const { titulo, ubicacion, provincia, pais, fecha, fotos, frases } = body;

    const nuevoRecuerdo = await prisma.recuerdoViaje.create({
      data: {
        titulo: titulo || "Sin título",
        ubicacion: ubicacion || "",
        provincia: provincia || "Sin provincia",
        pais: pais || "España",
        fecha: fecha || new Date().toISOString().split("T")[0],
        fotos: fotos || [],
        frases: frases || [],
      },
    });

    return NextResponse.json(nuevoRecuerdo);
  } catch (error) {
    console.error("Error al guardar el recuerdo:", error);
    return NextResponse.json(
      { error: "Error al guardar en la base de datos" },
      { status: 500 }
    );
  }
}