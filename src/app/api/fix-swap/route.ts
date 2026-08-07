import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function POST() {
  await prisma.$executeRawUnsafe('UPDATE "Question" SET "ar" = "en", "en" = "ar"');
  const count = await prisma.question.count();
  return NextResponse.json({ message: `Swapped ar/en for ${count} questions`, swapped: true });
}
