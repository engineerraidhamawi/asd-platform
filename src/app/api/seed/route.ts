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
  { part: MCHAT_PART, index: 1, ar: "Does your child look at you when you call his/her name?", en: "هل ينظر طفلك إليك عندما تناديه باسمه؟" },
  { part: MCHAT_PART, index: 2, ar: "Does your child point with his/her index finger to show you something interesting?", en: "هل يشير طفلك بإصبعه السبابة لإظهار شيء مثير للاهتمام؟" },
  { part: MCHAT_PART, index: 3, ar: "Does your child play pretend or make-believe?", en: "هل يلعب طفلك أدوارًا تخيلية أو يتظاهر؟" },
  { part: MCHAT_PART, index: 4, ar: "Does your child follow your gaze when you look at something across the room?", en: "هل يتبع طفلك نظرك عندما تنظر إلى شيء عبر الغرفة؟" },
  { part: MCHAT_PART, index: 5, ar: "Does your child respond when you smile at him/her?", en: "هل يستجيب طفلك عندما تبتسم له؟" },
  { part: MCHAT_PART, index: 6, ar: "Does your child try to get your attention to show you something?", en: "هل يحاول طفلك لفت انتباهك لإظهارك شيئًا؟" },
  { part: MCHAT_PART, index: 7, ar: "Does your child understand what you say?", en: "هل يفهم طفلك ما تقوله؟" },
  { part: MCHAT_PART, index: 8, ar: "Does your child sometimes stare at nothing or wander with no purpose?", en: "هل أحيانًا يحدق طفلك في الفراغ أو يتجول بدون هدف؟" },
  { part: MCHAT_PART, index: 9, ar: "Does your child look at your face to check your reaction?", en: "هل ينظر طفلك إلى وجهك للتحقق من ردة فعلك؟" },
  { part: MCHAT_PART, index: 10, ar: "Does your child enjoy playing peek-a-boo or hide-and-seek?", en: "هل يستمتع طفلك بلعبة الغميضة أو الاختباء؟" },
  { part: MCHAT_PART, index: 11, ar: "Does your child respond to his/her name when called?", en: "هل يستجيب طفلك لاسمه عند مناداته؟" },
  { part: MCHAT_PART, index: 12, ar: "Does your child point to ask for something or get help?", en: "هل يشير طفلك لطلب شيء أو طلب المساعدة؟" },
  { part: MCHAT_PART, index: 13, ar: "Does your child imitate your actions (e.g., clap, wave)?", en: "هل يقلد طفلك حركاتك (مثل التصفيق أو التلويح)؟" },
  { part: MCHAT_PART, index: 14, ar: "Does your child walk alone?", en: "هل يمشي طفلك بمفرده؟" },
  { part: MCHAT_PART, index: 15, ar: "Does your child look at things you are looking at?", en: "هل ينظر طفلك إلى الأشياء التي تنظر إليها؟" },
  { part: MCHAT_PART, index: 16, ar: "Does your child make unusual finger movements near his/her face?", en: "هل يقوم طفلك بحركات أصابع غير عادية قرب وجهه؟" },
  { part: MCHAT_PART, index: 17, ar: "Does your child try to attract your attention to his/her own activity?", en: "هل يحاول طفلك لفت انتباهك إلى نشاطه الخاص؟" },
  { part: MCHAT_PART, index: 18, ar: "Does your child get upset by everyday noises?", en: "هل يزعج طفلك الضوضاء اليومية العادية؟" },
  { part: MCHAT_PART, index: 19, ar: "Does your child show objects to you?", en: "هل يريك طفلك الأشياء؟" },
  { part: MCHAT_PART, index: 20, ar: "Does your child enjoy being swung or bounced on your knee?", en: "هل يستمتع طفلك بالتأرجح أو القفز على ركبتك؟" },
  { part: SRS2_PART, index: 1, ar: "I am interested in a narrow range of topics.", en: "أهتم بنطاق ضيق من المواضيع." },
  { part: SRS2_PART, index: 2, ar: "I can tell when someone is not interested in what I am saying.", en: "أستطيع أن أتعرف عندما لا يكون شخص ما مهتمًا بما أقوله." },
  { part: SRS2_PART, index: 3, ar: "I have trouble understanding when people are joking.", en: "أواجه صعوبة في فهم عندما يمزح الناس." },
  { part: SRS2_PART, index: 4, ar: "I find it easy to make friends.", en: "أجد من السهل تكوين أصدقاء." },
  { part: SRS2_PART, index: 5, ar: "I find it difficult to work out what people are thinking or feeling.", en: "أجد صعوبة في معرفة ما يفكر أو يشعر به الآخرون." },
  { part: SRS2_PART, index: 6, ar: "I find it hard to know what to say in social situations.", en: "أجد صعوبة في معرفة ما أقوله في المواقف الاجتماعية." },
  { part: SRS2_PART, index: 7, ar: "I feel comfortable in social situations.", en: "أشعر بالراحة في المواقف الاجتماعية." },
  { part: SRS2_PART, index: 8, ar: "I have difficulty understanding people's facial expressions.", en: "أواجه صعوبة في فهم تعبيرات وجوه الناس." },
  { part: SRS2_PART, index: 9, ar: "I can keep up with a conversation easily.", en: "أستطيع مواكبة المحادثة بسهولة." },
  { part: SRS2_PART, index: 10, ar: "I notice small sounds that others do not notice.", en: "ألاحظ أصواتًا صغيرة لا يلاحظها الآخرون." },
  { part: RBSR_PART, index: 1, ar: "Rocks body or whole body movements.", en: "يتأرجح الجسم أو حركات الجسم كاملة." },
  { part: RBSR_PART, index: 2, ar: "Spins objects or self.", en: "يدور الأشياء أو يدور حول نفسه." },
  { part: RBSR_PART, index: 3, ar: "Flaps hands or fingers.", en: "يحرك اليدين أو الأصابع." },
  { part: RBSR_PART, index: 4, ar: "Paces back and forth.", en: "يمشي ذهابًا وإيابًا." },
  { part: RBSR_PART, index: 5, ar: "Repeats words or phrases over and over.", en: "يكرر الكلمات أو العبارات مرارًا وتكرارًا." },
  { part: RBSR_PART, index: 6, ar: "Insists on sameness in routines.", en: "يصر على التشابه في الروتين." },
  { part: RBSR_PART, index: 7, ar: "Gets upset by small changes in routine.", en: "يضطرب بسبب تغييرات صغيرة في الروتين." },
  { part: RBSR_PART, index: 8, ar: "Lines up toys or objects.", en: "يصطف الألعاب أو الأشياء في خط." },
  { part: RBSR_PART, index: 9, ar: "Fascinated with spinning objects or wheels.", en: "منبهر بالأشياء الدوارة أو العجلات." },
  { part: RBSR_PART, index: 10, ar: "Has unusual sensory interests (smells, textures, sounds).", en: "لديه اهتمامات حسية غير عادية (روائح، ملمس، أصوات)." },
] as const;

export async function POST(request: NextRequest) {
  const allQ = DEFAULT_QUESTIONS;

  const questionCount = await prisma.question.count();

  if (questionCount === 0) {
    await prisma.question.createMany({ data: allQ as any });
  }

  const questions = await prisma.question.findMany({
    orderBy: [{ part: "asc" }, { index: "asc" }],
  });

  return NextResponse.json({
    message: questionCount === 0 ? "Seeded successfully" : "Data already exists",
    seeded: questionCount === 0,
    questions,
  });
}
