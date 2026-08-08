import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function POST() {
  const qs = await prisma.question.findMany();
  for (const q of qs) {
    await prisma.question.update({
      where: { id: q.id },
      data: { ar: q.en, en: q.ar }
    });
  }
  return NextResponse.json({ message: `Swapped ${qs.length} questions`, swapped: true });
}
