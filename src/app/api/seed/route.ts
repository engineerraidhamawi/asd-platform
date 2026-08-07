import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { db } from '@/lib/db';

function hashPw(pw: string): string {
  return createHash('sha256').update(pw + 'asd-salt-2024').digest('hex');
}

const RADAR_SCORES = {
  low:       { social: 82, nonverbal: 78, repetitive: 15, sensory: 20, motor: 75, executive: 80 },
  moderate:  { social: 55, nonverbal: 50, repetitive: 45, sensory: 50, motor: 58, executive: 52 },
  high:      { social: 30, nonverbal: 28, repetitive: 72, sensory: 68, motor: 35, executive: 32 },
  critical:  { social: 15, nonverbal: 12, repetitive: 88, sensory: 85, motor: 18, executive: 15 },
};

const XAI_ITEMS = [
  { feature: "الابتسامة التلقائية", severity: "نقص بنسبة 40%", impact: "عالي", detail: "تم رصد انخفاض واضح في الابتسامة التلقائية أثناء التفاعل" },
  { feature: "التواصل البصري", severity: "انخفاض بنسبة 35%", impact: "عالي", detail: "مدة التثبيت البصري أقل من المتوقع بـ 35%" },
  { feature: "حركة العين", severity: "أنماط غير نمطية", impact: "متوسط", detail: "نمط المسح البصري يختلف عن المعدل المرجعي" },
  { feature: "نبرة الصوت", severity: "تنوع محدود", impact: "متوسط", detail: "التباين في النبرة والطبقة الصوتية أقل من المعتاد" },
  { feature: "زمن رد الفعل", severity: "بطء بنسبة 25%", impact: "عالي", detail: "متوسط زمن الاستجابة أطول بـ 250 مللي ثانية" },
  { feature: "السلوكيات النمطية", severity: "متكررة", impact: "عالي", detail: "رصد حركات يد متكررة وتفضيل الروتين" },
  { feature: "المرونة المعرفية", severity: "صعوبة في التبديل", impact: "متوسط", detail: "أوقات تبديل المهام أطول بـ 40% من المتوسط" },
];

const DEFAULT_USERS = [
  { name: "مدير النظام", email: "admin@asd.com", password: "password123", role: "admin" },
  { name: "د. سارة أحمد", email: "doctor@asd.com", password: "password123", role: "doctor" },
  { name: "منى الباحثة", email: "monitor@asd.com", password: "password123", role: "monitor" },
  { name: "خالد وليد", email: "parent@asd.com", password: "password123", role: "patient" },
] as const;

export async function POST() {
  try {
    const userCount = await db.user.count();
    let doctorId: string | undefined;
    let parentId: string | undefined;

    if (userCount === 0) {
      const hashedPasswords = DEFAULT_USERS.map(u => hashPw(u.password));
      const users = await Promise.all(
        DEFAULT_USERS.map((u, i) =>
          db.user.create({
            data: { name: u.name, email: u.email, password: hashedPasswords[i], role: u.role },
          })
        )
      );
      const doctorUser = users.find(u => u.role === "doctor");
      const parentUser = users.find(u => u.role === "patient");
      if (doctorUser) doctorId = doctorUser.id;
      if (parentUser) parentId = parentUser.id;
    } else {
      const doctorUser = await db.user.findFirst({ where: { role: "doctor" } });
      const parentUser = await db.user.findFirst({ where: { role: "patient" } });
      if (doctorUser) doctorId = doctorUser.id;
      if (parentUser) parentId = parentUser.id;
    }

    const patientCount = await db.patient.count();
    if (patientCount > 0) {
      return NextResponse.json({ message: "Data exists", seeded: true });
    }

    const patients = await Promise.all([
      db.patient.create({
        data: { name: "أحمد خالد", age: 4, gender: "male", notes: "إحالة من طبيب الأطفال", createdById: doctorId, parentId: parentId },
      }),
      db.patient.create({
        data: { name: "فاطمة سعيد", age: 6, gender: "female", notes: "تأخر في النطق", createdById: doctorId, parentId: parentId },
      }),
      db.patient.create({
        data: { name: "عمر يوسف", age: 3, gender: "male", notes: "سلوكيات نمطية", createdById: doctorId },
      }),
      db.patient.create({
        data: { name: "نورة حسين", age: 5, gender: "female", notes: "متابعة روتينية", createdById: doctorId },
      }),
    ]);

    const risks: Array<"low" | "moderate" | "high" | "critical"> = ["low", "moderate", "high", "critical"];
    const subtypes = ["withdrawn", "active-odd", "shy", "motor"];

    for (let i = 0; i < 3; i++) {
      const patient = patients[i];
      const risk = risks[i];
      const radar = RADAR_SCORES[risk];
      const xai = XAI_ITEMS.slice(0, 3 + i).map((item, j) => ({
        ...item,
        score: Math.max(0, 100 - (j + 1) * 12 - i * 8),
      }));

      const session = await db.session.create({
        data: { patientId: patient.id, status: "completed", consentedAt: new Date(), completedAt: new Date() },
      });

      await db.assessment.createMany({
        data: [
          { sessionId: session.id, type: "facial", rawData: "{}", score: 60 + i * 15, maxScore: 100, completed: true },
          { sessionId: session.id, type: "motor", rawData: "{}", score: 55 + i * 12, maxScore: 100, completed: true },
          { sessionId: session.id, type: "cognitive", rawData: "{}", score: 65 + i * 10, maxScore: 100, completed: true },
          { sessionId: session.id, type: "questionnaire", rawData: "{}", score: risk === "low" ? 2 : risk === "moderate" ? 5 : risk === "high" ? 8 : 12, maxScore: 20, completed: true },
        ],
      });

      await db.result.create({
        data: {
          sessionId: session.id,
          riskLevel: risk,
          riskScore: risk === "low" ? 25 : risk === "moderate" ? 52 : risk === "high" ? 78 : 93,
          adosScore: risk === "low" ? 2 : risk === "moderate" ? 5 : risk === "high" ? 8 : 10,
          adosConfidence: 0.85 + i * 0.03,
          subtype: subtypes[i],
          radarScores: JSON.stringify(radar),
          xaiReport: JSON.stringify(xai),
        },
      });
    }

    return NextResponse.json({
      message: "Seeded successfully",
      seeded: true,
      users: DEFAULT_USERS.length,
      patients: patients.length,
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}