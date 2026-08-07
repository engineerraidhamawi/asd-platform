import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MCHAT_PART = "mchat";
const SRS2_PART = "srs2";
const RBSR_PART = "rbsr";

const SCALE_INFO = {
  [MCHAT_PART]: { max: 3, labelEN: "M-CHAT-R/F", labelAR: "M-CHAT-R/F" },
  [SRS2_PART]:  { max: 5, labelEN: "SRS-2", labelAR: "SRS-2" },
  [RBSR_PART]:  { max: 4, labelEN: "RBS-R", labelAR: "RBS-R" },
} as const;

const DEFAULT_QUESTIONS = [
  { part: MCHAT_PART, index: 1, ar: "هل ينظر طفلك إليك عندما تناديه باسمه؟", en: "Does your child look at you when you call his/her name?" },
  { part: MCHAT_PART, index: 2, ar: "هل يشير طفلك بإصبعه السبابة لإظهار شيء مثير للاهتمام؟", en: "Does your child point with his/her index finger to show you something interesting?" },
  { part: MCHAT_PART, index: 3, ar: "هل يلعب طفلك أدوارًا تخيلية أو يتظاهر؟", en: "Does your child play pretend or make-believe?" },
  { part: MCHAT_PART, index: 4, ar: "هل يتبع طفلك نظرك عندما تنظر إلى شيء عبر الغرفة؟", en: "Does your child follow your gaze when you look at something across the room?" },
  { part: MCHAT_PART, index: 5, ar: "هل يستجيب طفلك عندما تبتسم له؟", en: "Does your child respond when you smile at him/her?" },
  { part: MCHAT_PART, index: 6, ar: "هل يحاول طفلك لفت انتباهك لإظهارك شيئًا؟", en: "Does your child try to get your attention to show you something?" },
  { part: MCHAT_PART, index: 7, ar: "هل يفهم طفلك ما تقوله؟", en: "Does your child understand what you say?" },
  { part: MCHAT_PART, index: 8, ar: "هل أحيانًا يحدق طفلك في الفراغ أو يتجول بدون هدف؟", en: "Does your child sometimes stare at nothing or wander with no purpose?" },
  { part: MCHAT_PART, index: 9, ar: "هل ينظر طفلك إلى وجهك للتحقق من ردة فعلك؟", en: "Does your child look at your face to check your reaction?" },
  { part: MCHAT_PART, index: 10, ar: "هل يستمتع طفلك بلعبة الغميضة أو الاختباء؟", en: "Does your child enjoy playing peek-a-boo or hide-and-seek?" },
  { part: MCHAT_PART, index: 11, ar: "هل يستجيب طفلك لاسمه عند مناداته؟", en: "Does your child respond to his/her name when called?" },
  { part: MCHAT_PART, index: 12, ar: "هل يشير طفلك لطلب شيء أو طلب المساعدة؟", en: "Does your child point to ask for something or get help?" },
  { part: MCHAT_PART, index: 13, ar: "هل يقلد طفلك حركاتك مثل التصفيق أو التلويح؟", en: "Does your child imitate your actions (e.g., clap, wave)?" },
  { part: MCHAT_PART, index: 14, ar: "هل يمشي طفلك بمفرده؟", en: "Does your child walk alone?" },
  { part: MCHAT_PART, index: 15, ar: "هل ينظر طفلك إلى الأشياء التي تنظر إليها؟", en: "Does your child look at things you are looking at?" },
  { part: MCHAT_PART, index: 16, ar: "هل يقوم طفلك بحركات أصابع غير عادية قرب وجهه؟", en: "Does your child make unusual finger movements near his/her face?" },
  { part: MCHAT_PART, index: 17, ar: "هل يحاول طفلك لفت انتباهك إلى نشاطه الخاص؟", en: "Does your child try to attract your attention to his/her own activity?" },
  { part: MCHAT_PART, index: 18, ar: "هل يزعج طفلك الضوضاء اليومية العادية؟", en: "Does your child get upset by everyday noises?" },
  { part: MCHAT_PART, index: 19, ar: "هل يريك طفلك الأشياء؟", en: "Does your child show objects to you?" },
  { part: MCHAT_PART, index: 20, ar: "هل يستمتع طفلك بالتأرجح أو القفز على ركبتك؟", en: "Does your child enjoy being swung or bounced on your knee?" },
  { part: SRS2_PART, index: 1, ar: "أهتم بنطاق ضيق من المواضيع.", en: "I am interested in a narrow range of topics." },
  { part: SRS2_PART, index: 2, ar: "أستطيع أن أتعرف عندما لا يكون شخص ما مهتمًا بما أقوله.", en: "I can tell when someone is not interested in what I am saying." },
  { part: SRS2_PART, index: 3, ar: "أواجه صعوبة في فهم عندما يمزح الناس.", en: "I have trouble understanding when people are joking." },
  { part: SRS2_PART, index: 4, ar: "أجد من السهل تكوين أصدقاء.", en: "I find it easy to make friends." },
  { part: SRS2_PART, index: 5, ar: "أجد صعوبة في معرفة ما يفكر أو يشعر به الآخرون.", en: "I find it difficult to work out what people are thinking or feeling." },
  { part: SRS2_PART, index: 6, ar: "أجد صعوبة في معرفة ما أقوله في المواقف الاجتماعية.", en: "I find it hard to know what to say in social situations." },
  { part: SRS2_PART, index: 7, ar: "أشعر بالراحة في المواقف الاجتماعية.", en: "I feel comfortable in social situations." },
  { part: SRS2_PART, index: 8, ar: "أواجه صعوبة في فهم تعبيرات وجوه الناس.", en: "I have difficulty understanding people's facial expressions." },
  { part: SRS2_PART, index: 9, ar: "أستطيع مواكبة المحادثة بسهولة.", en: "I can keep up with a conversation easily." },
  { part: SRS2_PART, index: 10, ar: "ألاحظ أصواتًا صغيرة لا يلاحظها الآخرون.", en: "I notice small sounds that others do not notice." },
  { part: RBSR_PART, index: 1, ar: "يتأرجح الجسم أو حركات الجسم كاملة.", en: "Rocks body or whole body movements." },
  { part: RBSR_PART, index: 2, ar: "يدور الأشياء أو يدور حول نفسه.", en: "Spins objects or self." },
  { part: RBSR_PART, index: 3, ar: "يحرك اليدين أو الأصابع.", en: "Flaps hands or fingers." },
  { part: RBSR_PART, index: 4, ar: "يمشي ذهابًا وإيابًا.", en: "Paces back and forth." },
  { part: RBSR_PART, index: 5, ar: "يكرر الكلمات أو العبارات مرارًا وتكرارًا.", en: "Repeats words or phrases over and over." },
  { part: RBSR_PART, index: 6, ar: "يصر على التشابه في الروتين.", en: "Insists on sameness in routines." },
  { part: RBSR_PART, index: 7, ar: "يضطرب بسبب تغييرات صغيرة في الروتين.", en: "Gets upset by small changes in routine." },
  { part: RBSR_PART, index: 8, ar: "يصطف الألعاب أو الأشياء في خط.", en: "Lines up toys or objects." },
  { part: RBSR_PART, index: 9, ar: "منبهر بالأشياء الدوارة أو العجلات.", en: "Fascinated with spinning objects or wheels." },
  { part: RBSR_PART, index: 10, ar: "لديه اهتمامات حسية غير عادية مثل روائح وملمس وأصوات.", en: "Has unusual sensory interests (smells, textures, sounds)." },
] as const;

export async function POST(request: NextRequest) {
  const allQ = DEFAULT_QUESTIONS;

  const url = new URL(request.url);
  const replace = url.searchParams.get("replace") === "true";

  if (replace) {
    await prisma.question.deleteMany();
    await prisma.question.createMany({ data: allQ as any });
  } else {
    const questionCount = awid prisma.question.count();
    if (questionCount === 0) {
      await prisma.question.createMany({ data: almQ as any });
    }
  }

  const questions = await prisma.question.findMany({
    orderBy: [{ part: "asc" }, { index: "asc" }],
  });

  return NextResponse.json({
    message: replace ? "Re-seeded successfully" : (questions.length > 0 ? "Data already exists" : "Seeded successfully"),
    seeded: replace || questions.length > 0,
    questions,
  });
}
