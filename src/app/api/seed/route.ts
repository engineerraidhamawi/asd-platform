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
  { feature: 'الابتسامة التلقائية', severity: 'نقص بنسبة 40%', impact: 'عالي', detail: 'تم رصد انخفاض واضح في الابتسامة التلقائية أثناء التفاعل' },
  { feature: 'التواصل البصري', severity: 'انخفاض بنسبة 35%', impact: 'عالي', detail: 'مدة التثبيت البصري أقل من المتوقع بـ 35%' },
  { feature: 'حركة العين', severity: 'أنماط غير نمطية', impact: 'متوسط', detail: 'نمط المسح البصري يختلف عن المعدل المرجعي' },
  { feature: 'نبرة الصوت', severity: 'تنوع محدود', impact: 'متوسط', detail: 'التباين في النبرة والطبقة الصوتية أقل من المعتاد' },
  { feature: 'زمن رد الفعل', severity: 'بطء بنسبة 25%', impact: 'عالي', detail: 'متوسط زمن الاستجابة أطول بـ 250 مللي ثانية' },
  { feature: 'السلوكيات النمطية', severity: 'متكررة', impact: 'عالي', detail: 'رصد حركات يد متكررة وتفضيل الروتين' },
  { feature: 'المرونة المعرفية', severity: 'صعوبة في التبديل', impact: 'متوسط', detail: 'أوقات تبديل المهام أطول بـ 40% من المتوسط' },
];

const DEFAULT_USERS = [
  { name: 'مدير النظام', email: 'admin@asd.com', password: 'password123', role: 'admin' },
  { name: 'د. سارة أحمد', email: 'doctor@asd.com', password: 'password123', role: 'doctor' },
  { name: 'منى الباحثة', email: 'monitor@asd.com', password: 'password123', role: 'monitor' },
  { name: 'خالد وليد', email: 'parent@asd.com', password: 'password123', role: 'patient' },
] as const;

const DEFAULT_QUESTIONS = {
  mchat: [
    { ar: 'هل يبدو طفلك مهتماً بالأطفال الآخرين؟', en: 'Does your child seem interested in other children?' },
    { ar: 'هل يشير طفلك لإظهار الأشياء التي تعجبه؟', en: 'Does your child point to show you things they like?' },
    { ar: 'هل يجلب طفلك الأشياء إليك ليُريكها؟', en: 'Does your child bring things to you to show you?' },
    { ar: 'هل يُقلّد طفلك ما تفعله أنت أو آخرون؟', en: 'Does your child imitate what you or others do?' },
    { ar: 'هل يستجيب طفلك عندما تناديه باسمه؟', en: 'Does your child respond when you call their name?' },
    { ar: 'هل يُشير طفلك بيدك لطلب المساعدة؟', en: 'Does your child take your hand to get help?' },
    { ar: 'هل يلوّح طفلك بالوداع؟', en: 'Does your child wave goodbye?' },
    { ar: 'هل يُظهر طفلك اهتماماً بالألعاب المناسبة لعمره؟', en: 'Does your child show interest in age-appropriate toys?' },
    { ar: 'هل يحرك طفلك الأشياء ذهاباً وإياباً بشكل متكرر؟', en: 'Does your child move objects back and forth repeatedly?' },
    { ar: 'هل يستجيب طفلك للأصوات العالية أو المفاجئة؟', en: 'Does your child respond to loud or sudden sounds?' },
    { ar: 'هل ينظر طفلك مباشرةً إلى عينيك عند الحديث معه؟', en: 'Does your child look directly into your eyes when talking?' },
    { ar: 'هل يبتسم طفلك عندما تبتسم له؟', en: 'Does your child smile back when you smile at them?' },
    { ar: 'هل يبادر طفلك باللعب معك أو اللعب به؟', en: 'Does your child initiate play with you or want you to play?' },
    { ar: 'هل يُظهر طفلك اهتماماً بأشياء غير عادية مقارنة بألعاب الأطفال؟', en: 'Does your child show interest in unusual items vs. typical toys?' },
    { ar: 'هل يستجيب طفلك لاسمه عندما لا يراك؟', en: 'Does your child respond to their name when they cannot see you?' },
    { ar: 'هل يستخدم طفلك أصابعه للإشارة إلى الأشياء؟', en: 'Does your child use fingers to point at things?' },
    { ar: 'هل يحاول طفلك جذب انتباهك لسلوك معين؟', en: 'Does your child try to get your attention to a specific behavior?' },
    { ar: 'هل يتجنب طفلك التواصل البصري المباشر؟', en: 'Does your child avoid direct eye contact?' },
    { ar: 'هل يستطيع طفلك ترتيب مكعبات أو ألعاب بشكل مناسب؟', en: 'Can your child stack blocks or toys appropriately?' },
    { ar: 'هل يُظهر طفلك سلوكيات متكررة أو غير عادية؟', en: 'Does your child display repetitive or unusual behaviors?' },
  ],
  srs: [
    { ar: 'يُظهر طفلك مهارات اجتماعية مناسبة لعمره', en: 'My child shows age-appropriate social skills' },
    { ar: 'يلتقي طفلك بنظرة الآخرين أثناء الحديث', en: 'My child makes eye contact during conversation' },
    { ar: 'يفهم طفلك نكات الآخرين أو نواياهم الكامنة', en: 'My child understands jokes or hidden intentions of others' },
    { ar: 'يبدو طفلك مرتاحاً في المواقف الاجتماعية الجديدة', en: 'My child seems comfortable in new social situations' },
    { ar: 'يتفاعل طفلك بشكل طبيعي مع أقرانه', en: 'My child interacts naturally with peers' },
    { ar: 'يستطيع طفلك التعبير عن مشاعره بشكل واضح', en: 'My child can express their feelings clearly' },
    { ar: 'يُظهر طفلك مرونة عند تغيير الروتين', en: 'My child shows flexibility when routines change' },
    { ar: 'يُحب طفلك الأنشطة الجماعية أو اللعب مع الآخرين', en: 'My child enjoys group activities or playing with others' },
    { ar: 'يُظهر طفلك تعاطفاً مع مشاعر الآخرين', en: "My child shows empathy for others' feelings" },
    { ar: 'يُميّز طفلك التعبيرات الوجهية المختلفة بدقة', en: 'My child can distinguish different facial expressions accurately' },
  ],
  rbsr: [
    { ar: 'يتكرر ترديد طفلك للكلمات أو العبارات', en: 'My child repeats words or phrases repeatedly' },
    { ar: 'يقوم طفلك بحركات يدية متكررة (مثل التلويت أو الطبطبة)', en: 'My child makes repetitive hand movements (flapping, tapping)' },
    { ar: 'يلتفت طفلك أو يهز جسمه بشكل متكرر', en: 'My child rocks or sways body repeatedly' },
    { ar: 'يُصر طفلك على ترتيب الأشياء بطريقة معينة', en: 'My child insists on arranging objects in a specific order' },
    { ar: 'يُظهر طفلك اهتماماً شديداً بأجزاء معينة من الأشياء', en: 'My child shows intense interest in specific parts of objects' },
    { ar: 'يتنفس طفلك أو يشم الأشياء بشكل متكرر', en: 'My child sniffs or smells objects frequently' },
    { ar: 'يُظهر طفلك حساسية عالية للأصوات أو الأضواء', en: 'My child shows high sensitivity to sounds or lights' },
    { ar: 'يمشي طفلك على أطراف أصابعه بشكل متكرر', en: 'My child frequently walks on tiptoes' },
    { ar: 'يُكرر طفلك مشاهدة نفس الفيديو أو الصورة', en: 'My child repeatedly watches the same video or image' },
    { ar: 'يُظهر طفلك انزعاجاً شديداً عند تغيير الروتين اليومي', en: 'My child shows severe distress when changing daily routine' },
  ],
} as const;

export async function POST() {
  try {
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
      const doctorUser = users.find(u => u.role === 'doctor');
      const parentUser = users.find(u => u.role === 'patient');
      if (doctorUser) doctorId = doctorUser.id;
      if (parentUser) parentId = parentUser.id;
    } else {
      const doctorUser = await db.user.findFirst({ where: { role: 'doctor' } });
      const parentUser = await db.user.findFirst({ where: { role: 'patient' } });
      if (doctorUser) doctorId = doctorUser.id;
      if (parentUser) parentId = parentUser.id;
    }

    const patientCount = await db.patient.count();
    if (patientCount > 0) {
      return NextResponse.json({ message: 'Data exists', seeded: true, questions: questionCount > 0 });
    }

    const patients = await Promise.all([
      db.patient.create({ data: { name: 'أحمد خالد', age: 4, gender: 'male', notes: 'إحالة من طبيب الأطفال', createdById: doctorId, parentId: parentId } }),
      db.patient.create({ data: { name: 'فاطمة سعيد', age: 6, gender: 'female', notes: 'تأخر في النطق', createdById: doctorId, parentId: parentId } }),
      db.patient.create({ data: { name: 'عمر يوسف', age: 3, gender: 'male', notes: 'سلوكيات نمطية', createdById: doctorId } }),
      db.patient.create({ data: { name: 'نورة حسين', age: 5, gender: 'female', notes: 'متابعة روتينية', createdById: doctorId } }),
    ]);

    const risks: Array<'low' | 'moderate' | 'high' | 'critical'> = ['low', 'moderate', 'high', 'critical'];
    const subtypes = ['withdrawn', 'active-odd', 'shy', 'motor'];

    for (let i = 0; i < 3; i++) {
      const patient = patients[i];
      const risk = risks[i];
      const radar = RADAR_SCORES[risk];
      const xai = XAI_ITEMS.slice(0, 3 + i).map((item, j) => ({
        ...item,
        score: Math.max(0, 100 - (j + 1) * 12 - i * 8),
      }));

      const session = await db.session.create({
        data: { patientId: patient.id, status: 'completed', consentedAt: new Date(), completedAt: new Date() },
      });

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
          sessionId: session.id,
          riskLevel: risk,
          riskScore: risk === 'low' ? 25 : risk === 'moderate' ? 52 : risk === 'high' ? 78 : 93,
          adosScore: risk === 'low' ? 2 : risk === 'moderate' ? 5 : risk === 'high' ? 8 : 10,
          adosConfidence: 0.85 + i * 0.03,
          subtype: subtypes[i],
          radarScores: JSON.stringify(radar),
          xaiReport: JSON.stringify(xai),
        },
      });
    }

    return NextResponse.json({
      message: 'Seeded successfully',
      seeded: true,
      users: DEFAULT_USERS.length,
      patients: patients.length,
      questions: questionCount === 0 ? allQ.length : questionCount,
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 });
  }
}
