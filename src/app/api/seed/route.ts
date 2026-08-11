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
  { feature_ar: 'Spontaneous smile', feature_en: 'Spontaneous smile', severity_ar: '40% decrease', severity_en: '40% decrease', impact: 'high', score: 60 },
  { feature_ar: 'Eye contact', feature_en: 'Eye contact', severity_ar: '35% decrease', severity_en: '35% decrease', impact: 'high', score: 65 },
  { feature_ar: 'Repetitive behaviors', feature_en: 'Repetitive behaviors', severity_ar: 'Recurrent', severity_en: 'Recurrent', impact: 'high', score: 72 },
  { feature_ar: 'Cognitive flexibility', feature_en: 'Cognitive flexibility', severity_ar: 'Difficulty switching', severity_en: 'Difficulty switching', impact: 'medium', score: 48 },
  { feature_ar: 'Response time', feature_en: 'Response time', severity_ar: '25% slower', severity_en: '25% slower', impact: 'high', score: 55 },
  { feature_ar: 'Vocal tone', feature_en: 'Vocal tone', severity_ar: 'Limited variation', severity_en: 'Limited variation', impact: 'medium', score: 40 },
  { feature_ar: 'Eye movement', feature_en: 'Eye movement', severity_ar: 'Atypical patterns', severity_en: 'Atypical patterns', impact: 'medium', score: 45 },
];

const DEFAULT_USERS = [
  { name: 'System Admin', email: 'admin@asd.com', password: 'password123', role: 'admin' },
  { name: 'Dr. Sarah Ahmed', email: 'doctor@asd.com', password: 'password123', role: 'doctor' },
  { name: 'Mona Researcher', email: 'monitor@asd.com', password: 'password123', role: 'monitor' },
  { name: 'Khaled Waleed', email: 'parent@asd.com', password: 'password123', role: 'patient' },
];

const DEFAULT_QUESTIONS = {
  mchat: [
    { ar: 'Does your child seem interested in other children?', en: 'Does your child seem interested in other children?' },
    { ar: 'Does your child point to show you things they like?', en: 'Does your child point to show you things they like?' },
    { ar: 'Does your child bring things to you to show you?', en: 'Does your child bring things to you to show you?' },
    { ar: 'Does your child imitate what you or others do?', en: 'Does your child imitate what you or others do?' },
    { ar: 'Does your child respond when you call their name?', en: 'Does your child respond when you call their name?' },
    { ar: 'Does your child wave goodbye?', en: 'Does your child wave goodbye?' },
    { ar: 'Does your child show interest in age-appropriate toys?', en: 'Does your child show interest in age-appropriate toys?' },
    { ar: 'Does your child move objects back and forth repeatedly?', en: 'Does your child move objects back and forth repeatedly?' },
    { ar: 'Does your child look directly into your eyes when talking?', en: 'Does your child look directly into your eyes when talking?' },
    { ar: 'Does your child smile back when you smile at them?', en: 'Does your child smile back when you smile at them?' },
    { ar: 'Does your child display repetitive or unusual behaviors?', en: 'Does your child display repetitive or unusual behaviors?' },
  ],
  srs: [
    { ar: 'My child shows age-appropriate social skills', en: 'My child shows age-appropriate social skills' },
    { ar: 'My child makes eye contact during conversation', en: 'My child makes eye contact during conversation' },
    { ar: 'My child seems comfortable in new social situations', en: 'My child seems comfortable in new social situations' },
    { ar: 'My child interacts naturally with peers', en: 'My child interacts naturally with peers' },
    { ar: 'My child can express their feelings clearly', en: 'My child can express their feelings clearly' },
    { ar: 'My child shows flexibility when routines change', en: 'My child shows flexibility when routines change' },
    { ar: 'My child shows empathy for others feelings', en: 'My child shows empathy for others feelings' },
    { ar: 'My child can distinguish different facial expressions accurately', en: 'My child can distinguish different facial expressions accurately' },
  ],
  rbsr: [
    { ar: 'My child repeats words or phrases repeatedly', en: 'My child repeats words or phrases repeatedly' },
    { ar: 'My child makes repetitive hand movements', en: 'My child makes repetitive hand movements' },
    { ar: 'My child rocks or sways body repeatedly', en: 'My child rocks or sways body repeatedly' },
    { ar: 'My child insists on arranging objects in a specific order', en: 'My child insists on arranging objects in a specific order' },
    { ar: 'My child shows intense interest in specific parts of objects', en: 'My child shows intense interest in specific parts of objects' },
    { ar: 'My child shows high sensitivity to sounds or lights', en: 'My child shows high sensitivity to sounds or lights' },
    { ar: 'My child frequently walks on tiptoes', en: 'My child frequently walks on tiptoes' },
    { ar: 'My child shows severe distress when changing daily routine', en: 'My child shows severe distress when changing daily routine' },
  ],
};

export async function POST() {
  try {
    // Always create missing default users (check by email)
    const createdUsers: string[] = [];
    for (const u of DEFAULT_USERS) {
      const exists = await db.user.findUnique({ where: { email: u.email } });
      if (!exists) {
        await db.user.create({
          data: { name: u.name, email: u.email, password: hashPw(u.password), role: u.role },
        });
        createdUsers.push(u.email);
      }
    }

    // Seed questions if none exist
    const questionCount = await db.question.count();
    if (questionCount === 0) {
      const allQ: { part: string; index: number; ar: string; en: string }[] = [];
      for (const [part, questions] of Object.entries(DEFAULT_QUESTIONS)) {
        for (let i = 0; i < questions.length; i++) {
          allQ.push({ part, index: i, ar: questions[i].ar, en: questions[i].en });
        }
      }
      await db.question.createMany({ data: allQ });
    }

    const doctorUser = await db.user.findFirst({ where: { role: 'doctor' } });
    const parentUser = await db.user.findFirst({ where: { role: 'patient' } });
    const doctorId = doctorUser?.id;
    const parentId = parentUser?.id;

    const patientCount = await db.patient.count();
    if (patientCount > 0) {
      return NextResponse.json({ message: 'Data exists', usersCreated: createdUsers });
    }

    const patients = await Promise.all([
      db.patient.create({ data: { name: 'Ahmed Khaled', age: 4, gender: 'male', notes: 'Pediatric referral', createdById: doctorId, parentId: parentId } }),
      db.patient.create({ data: { name: 'Fatima Said', age: 6, gender: 'female', notes: 'Speech delay', createdById: doctorId, parentId: parentId } }),
      db.patient.create({ data: { name: 'Omar Youssef', age: 3, gender: 'male', notes: 'Repetitive behaviors', createdById: doctorId } }),
      db.patient.create({ data: { name: 'Noura Hussein', age: 5, gender: 'female', notes: 'Routine follow-up', createdById: doctorId } }),
    ]);

    const risks: Array<'low' | 'moderate' | 'high' | 'critical'> = ['low', 'moderate', 'high', 'critical'];
    const subtypes = ['withdrawn', 'active-odd', 'shy', 'motor'];

    for (let i = 0; i < 3; i++) {
      const patient = patients[i];
      const risk = risks[i];
      const radar = RADAR_SCORES[risk];
      const xai = XAI_ITEMS.slice(0, 3 + i).map((item, j) => ({ ...item, score: Math.max(0, 100 - (j + 1) * 12 - i * 8) }));
      const session = await db.session.create({ data: { patientId: patient.id, status: 'completed', consentedAt: new Date(), completedAt: new Date() } });
      await db.assessment.createMany({
        data: [
          { sessionId: session.id, type: 'facial', rawData: '{}', score: 60 + i * 15, maxScore: 100, completed: true },
          { sessionId: session.id, type: 'motor', rawData: '{}', score: 55 + i * 12, maxScore: 100, completed: true },
          { sessionId: session.id, type: 'cognitive', rawData: '{}', score: 65 + i * 10, maxScore: 100, completed: true },
          { sessionId: session.id, type: 'questionnaire', rawData: '{}', score: risk === 'low' ? 2 : risk === 'moderate' ? 5 : risk === 'high' ? 8 : 12, maxScore: 20, completed: true },
        ],
      });
      await db.result.create({
        data: {
          sessionId: session.id, riskLevel: risk,
          riskScore: risk === 'low' ? 25 : risk === 'moderate' ? 52 : risk === 'high' ? 78 : 93,
          adosScore: risk === 'low' ? 2 : risk === 'moderate' ? 5 : risk === 'high' ? 8 : 10,
          adosConfidence: 0.85 + i * 0.03, subtype: subtypes[i],
          radarScores: JSON.stringify(radar), xaiReport: JSON.stringify(xai),
        },
      });
    }

    return NextResponse.json({ message: 'Seeded successfully', usersCreated: createdUsers, patients: patients.length });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 });
  }
}