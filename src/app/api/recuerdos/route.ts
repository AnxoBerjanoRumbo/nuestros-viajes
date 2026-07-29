import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { PrismaClient } from "@prisma/client";

// Reutilizar la instancia de Prisma para evitar agotar el límite de conexiones en Vercel
const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

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
export async function POST(req) {
  try {
    const body = await req.json();

    // 1. Si recibimos un marcador
    if (body.marcador) {
      const { coordinates, color, size, etiqueta, nivelOrigen, pais, albumId } = body.marcador;
      const nuevoMarcador = await prisma.marcadorMapa.create({
        data: {
          coordinates: coordinates || [0, 0],
          color: color || "#c2416b",
          size: size || 6,
          etiqueta: etiqueta || "",
          nivelOrigen: nivelOrigen || "mundo",
          pais: pais || "Mundo",
          albumId: albumId || null,
        },
      });

      revalidatePath("/");
      return NextResponse.json(nuevoMarcador, { status: 201 });
    }

    // 2. Si recibimos un recuerdo de viaje
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

    revalidatePath("/");
    return NextResponse.json(nuevoRecuerdo, { status: 201 });
  } catch (error) {
    console.error("Error al guardar en la base de datos:", error);
    return NextResponse.json(
      { error: "Error al guardar en la base de datos" },
      { status: 500 }
    );
  }
}

// PUT: Actualizar un recuerdo o marcador existente
export async function PUT(req) {
  try {
    const body = await req.json();

    // Actualizar marcador
    if (body.marcador && body.marcador.id) {
      const { id, color, size, etiqueta, albumId } = body.marcador;
      const marcadorActualizado = await prisma.marcadorMapa.update({
        where: { id },
        data: {
          color,
          size,
          etiqueta: etiqueta || "",
          albumId: albumId || null,
        },
      });
      revalidatePath("/");
      return NextResponse.json(marcadorActualizado);
    }

    // Actualizar recuerdo
    if (body.id) {
      const { id, titulo, ubicacion, provincia, pais, fecha, fotos, frases } = body;
      const recuerdoActualizado = await prisma.recuerdoViaje.update({
        where: { id },
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
      revalidatePath("/");
      return NextResponse.json(recuerdoActualizado);
    }

    return NextResponse.json({ error: "ID requerido para actualización" }, { status: 400 });
  } catch (error) {
    console.error("Error al actualizar en la base de datos:", error);
    return NextResponse.json(
      { error: "Error al actualizar en la base de datos" },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar un recuerdo o marcador por ID
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const tipo = searchParams.get("tipo");

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    if (tipo === "marcador") {
      await prisma.marcadorMapa.delete({ where: { id } });
    } else {
      await prisma.recuerdoViaje.delete({ where: { id } });
    }

    revalidatePath("/");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar de la base de datos:", error);
    return NextResponse.json(
      { error: "Error al eliminar de la base de datos" },
      { status: 500 }
    );
  }
}