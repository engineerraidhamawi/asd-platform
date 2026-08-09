import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 });

    const assessments = await db.assessment.findMany({
      where: { sessionId },
    });

    const quest = assessments.find(a => a.type === 'questionnaire');
    if (!quest) return NextResponse.json({ sections: [] });

    let rawData: Record<string, number> = {};
    try { rawData = JSON.parse(quest.rawData); } catch {}

    const MCHAT: { ar: string; en: string }[] = [
      { ar: '\u0647\u0644 \u064a\u0628\u062f\u0648 \u0637\u0641\u0644\u0643 \u0645\u0647\u062a\u0645\u0627\u064b \u0628\u0627\u0644\u0623\u0637\u0641\u0627\u0644 \u0627\u0644\u0622\u062e\u0631\u064a\u0646\u061f', en: 'Does your child seem interested in other children?' },
      { ar: '\u0647\u0644 \u064a\u0634\u064a\u0631 \u0637\u0641\u0644\u0643 \u0644\u0625\u0638\u0647\u0627\u0631 \u0627\u0644\u0623\u0634\u064a\u0627\u0621 \u0627\u0644\u062a\u064a \u062a\u0639\u062c\u0628\u0647\u061f', en: 'Does your child point to show you things they like?' },
      { ar: '\u0647\u0644 \u064a\u062c\u0644\u0628 \u0637\u0641\u0644\u0643 \u0627\u0644\u0623\u0634\u064a\u0627\u0621 \u0625\u0644\u064a\u0643 \u0644\u064a\u064f\u0631\u064a\u0643\u0647\u0627\u061f', en: 'Does your child bring things to you to show you?' },
      { ar: '\u0647\u0644 \u064a\u064f\u0642\u0644\u0651\u062f \u0637\u0641\u0644\u0643 \u0645\u0627 \u062a\u0641\u0639\u0644\u0647 \u0623\u0646\u062a \u0623\u0648 \u0622\u062e\u0631\u0648\u0646\u061f', en: 'Does your child imitate what you or others do?' },
      { ar: '\u0647\u0644 \u064a\u0633\u062a\u062c\u064a\u0628 \u0637\u0641\u0644\u0643 \u0639\u0646\u062f\u0645\u0627 \u062a\u0646\u0627\u062f\u064a\u0647 \u0628\u0627\u0633\u0645\u0647\u061f', en: 'Does your child respond when you call their name?' },
      { ar: '\u0647\u0644 \u064a\u064f\u0634\u064a\u0631 \u0637\u0641\u0644\u0643 \u0628\u064a\u062f\u0643 \u0644\u0637\u0644\u0628 \u0627\u0644\u0645\u0633\u0627\u0639\u062f\u0629\u061f', en: 'Does your child take your hand to get help?' },
      { ar: '\u0647\u0644 \u064a\u0644\u0648\u0651\u062d \u0637\u0641\u0644\u0643 \u0628\u0627\u0644\u0648\u062f\u0627\u0639\u061f', en: 'Does your child wave goodbye?' },
      { ar: '\u0647\u0644 \u064a\u064f\u0638\u0647\u0631 \u0637\u0641\u0644\u0643 \u0627\u0647\u062a\u0645\u0627\u0645\u0627\u064b \u0628\u0627\u0644\u0623\u0644\u0639\u0627\u0628 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629 \u0644\u0639\u0645\u0631\u0647\u061f', en: 'Does your child show interest in age-appropriate toys?' },
      { ar: '\u0647\u0644 \u064a\u062d\u0631\u0643 \u0637\u0641\u0644\u0643 \u0627\u0644\u0623\u0634\u064a\u0627\u0621 \u0630\u0647\u0627\u0628\u0627\u064b \u0648\u0625\u064a\u0627\u0628\u0627\u064b \u0628\u0634\u0643\u0644 \u0645\u062a\u0643\u0631\u0631\u061f', en: 'Does your child move objects back and forth repeatedly?' },
      { ar: '\u0647\u0644 \u064a\u0633\u062a\u062c\u064a\u0628 \u0637\u0641\u0644\u0643 \u0644\u0644\u0623\u0635\u0648\u0627\u062a \u0627\u0644\u0639\u0627\u0644\u064a\u0629 \u0623\u0648 \u0627\u0644\u0645\u0641\u0627\u062c\u0626\u0629\u061f', en: 'Does your child respond to loud or sudden sounds?' },
      { ar: '\u0647\u0644 \u064a\u0646\u0638\u0631 \u0637\u0641\u0644\u0643 \u0645\u0628\u0627\u0634\u0631\u0629\u064b \u0625\u0644\u0649 \u0639\u064a\u0646\u064a\u0643 \u0639\u0646\u062f \u0627\u0644\u062d\u062f\u064a\u062b \u0645\u0639\u0647\u061f', en: 'Does your child look directly into your eyes when talking?' },
      { ar: '\u0647\u0644 \u064a\u0628\u062a\u0633\u0645 \u0637\u0641\u0644\u0643 \u0639\u0646\u062f\u0645\u0627 \u062a\u0628\u062a\u0633\u0645 \u0644\u0647\u061f', en: 'Does your child smile back when you smile at them?' },
      { ar: '\u0647\u0644 \u064a\u0628\u0627\u062f\u0631 \u0637\u0641\u0644\u0643 \u0628\u0627\u0644\u0644\u0639\u0628 \u0645\u0639\u0643 \u0623\u0648 \u0627\u0644\u0644\u0639\u0628 \u0628\u0647\u061f', en: 'Does your child initiate play with you or want you to play?' },
      { ar: '\u0647\u0644 \u064a\u064f\u0638\u0647\u0631 \u0637\u0641\u0644\u0643 \u0627\u0647\u062a\u0645\u0627\u0645\u0627\u064b \u0628\u0623\u0634\u064a\u0627\u0621 \u063a\u064a\u0631 \u0639\u0627\u062f\u064a\u0629 \u0645\u0642\u0627\u0631\u0646\u0629 \u0628\u0623\u0644\u0639\u0627\u0628 \u0627\u0644\u0623\u0637\u0641\u0627\u0644\u061f', en: 'Does your child show interest in unusual items vs. typical toys?' },
      { ar: '\u0647\u0644 \u064a\u0633\u062a\u062c\u064a\u0628 \u0637\u0641\u0644\u0643 \u0644\u0627\u0633\u0645\u0647 \u0639\u0646\u062f\u0645\u0627 \u0644\u0627 \u064a\u0631\u0627\u0643\u061f', en: 'Does your child respond to their name when they cannot see you?' },
      { ar: '\u0647\u0644 \u064a\u0633\u062a\u062e\u062f\u0645 \u0637\u0641\u0644\u0643 \u0623\u0635\u0627\u0628\u0639\u0647 \u0644\u0644\u0625\u0634\u0627\u0631\u0629 \u0625\u0644\u0649 \u0627\u0644\u0623\u0634\u064a\u0627\u0621\u061f', en: 'Does your child use fingers to point at things?' },
      { ar: '\u0647\u0644 \u064a\u062d\u0627\u0648\u0644 \u0637\u0641\u0644\u0643 \u062c\u0630\u0628 \u0627\u0646\u062a\u0628\u0627\u0647\u0643 \u0644\u0633\u0644\u0648\u0643 \u0645\u0639\u064a\u0646\u061f', en: 'Does your child try to get your attention to a specific behavior?' },
      { ar: '\u0647\u0644 \u064a\u062a\u062c\u0646\u0628 \u0637\u0641\u0644\u0643 \u0627\u0644\u062a\u0648\u0627\u0635\u0644 \u0627\u0644\u0628\u0635\u0631\u064a \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u061f', en: 'Does your child avoid direct eye contact?' },
      { ar: '\u0647\u0644 \u064a\u0633\u062a\u0637\u064a\u0639 \u0637\u0641\u0644\u0643 \u062a\u0631\u062a\u064a\u0628 \u0645\u0643\u0639\u0628\u0627\u062a \u0623\u0648 \u0623\u0644\u0639\u0627\u0628 \u0628\u0634\u0643\u0644 \u0645\u0646\u0627\u0633\u0628\u061f', en: 'Can your child stack blocks or toys appropriately?' },
      { ar: '\u0647\u0644 \u064a\u064f\u0638\u0647\u0631 \u0637\u0641\u0644\u0643 \u0633\u0644\u0648\u0643\u064a\u0627\u062a \u0645\u062a\u0643\u0631\u0631\u0629 \u0623\u0648 \u063a\u064a\u0631 \u0639\u0627\u062f\u064a\u0629\u061f', en: 'Does your child display repetitive or unusual behaviors?' },
    ];
    const SRS: { ar: string; en: string }[] = [
      { ar: '\u064a\u064f\u0638\u0647\u0631 \u0637\u0641\u0644\u0643 \u0645\u0647\u0627\u0631\u0627\u062a \u0627\u062c\u062a\u0645\u0627\u0639\u064a\u0629 \u0645\u0646\u0627\u0633\u0628\u0629 \u0644\u0639\u0645\u0631\u0647', en: 'My child shows age-appropriate social skills' },
      { ar: '\u064a\u0644\u062a\u0642\u064a \u0637\u0641\u0644\u0643 \u0628\u0646\u0638\u0631\u0629 \u0627\u0644\u0622\u062e\u0631\u064a\u0646 \u0623\u062b\u0646\u0627\u0621 \u0627\u0644\u062d\u062f\u064a\u062b', en: 'My child makes eye contact during conversation' },
      { ar: '\u064a\u0641\u0647\u0645 \u0637\u0641\u0644\u0643 \u0646\u0643\u0627\u062a \u0627\u0644\u0622\u062e\u0631\u064a\u0646 \u0623\u0648 \u0646\u0648\u0627\u064a\u0627\u0647\u0645 \u0627\u0644\u0643\u0627\u0645\u0646\u0629', en: 'My child understands jokes or hidden intentions of others' },
      { ar: '\u064a\u0628\u062f\u0648 \u0637\u0641\u0644\u0643 \u0645\u0631\u062a\u0627\u062d\u0627\u064b \u0641\u064a \u0627\u0644\u0645\u0648\u0627\u0642\u0641 \u0627\u0644\u0627\u062c\u062a\u0645\u0627\u0639\u064a\u0629 \u0627\u0644\u062c\u062f\u064a\u062f\u0629', en: 'My child seems comfortable in new social situations' },
      { ar: '\u064a\u062a\u0641\u0627\u0639\u0644 \u0637\u0641\u0644\u0643 \u0628\u0634\u0643\u0644 \u0637\u0628\u064a\u0639\u064a \u0645\u0639 \u0623\u0642\u0631\u0627\u0646\u0647', en: 'My child interacts naturally with peers' },
      { ar: '\u064a\u0633\u062a\u0637\u064a\u0639 \u0637\u0641\u0644\u0643 \u0627\u0644\u062a\u0639\u0628\u064a\u0631 \u0639\u0646 \u0645\u0634\u0627\u0639\u0631\u0647 \u0628\u0634\u0643\u0644 \u0648\u0627\u0636\u062d', en: 'My child can express their feelings clearly' },
      { ar: '\u064a\u064f\u0638\u0647\u0631 \u0637\u0641\u0644\u0643 \u0645\u0631\u0648\u0646\u0629 \u0639\u0646\u062f \u062a\u063a\u064a\u064a\u0631 \u0627\u0644\u0631\u0648\u062a\u064a\u0646', en: 'My child shows flexibility when routines change' },
      { ar: '\u064a\u064f\u062d\u0628 \u0637\u0641\u0644\u0643 \u0627\u0644\u0623\u0646\u0634\u0637\u0629 \u0627\u0644\u062c\u0645\u0627\u0639\u064a\u0629 \u0623\u0648 \u0627\u0644\u0644\u0639\u0628 \u0645\u0639 \u0627\u0644\u0622\u062e\u0631\u064a\u0646', en: 'My child enjoys group activities or playing with others' },
      { ar: '\u064a\u064f\u0638\u0647\u0631 \u0637\u0641\u0644\u0643 \u062a\u0639\u0627\u0637\u0641\u0627\u064b \u0645\u0639 \u0645\u0634\u0627\u0639\u0631 \u0627\u0644\u0622\u062e\u0631\u064a\u0646', en: "My child shows empathy for others' feelings" },
      { ar: '\u064a\u064f\u0645\u064a\u0651\u0632 \u0637\u0641\u0644\u0643 \u0627\u0644\u062a\u0639\u0628\u064a\u0631\u0627\u062a \u0627\u0644\u0648\u062c\u0647\u064a\u0629 \u0627\u0644\u0645\u062e\u062a\u0644\u0641\u0629 \u0628\u062f\u0642\u0629', en: 'My child can distinguish different facial expressions accurately' },
    ];
    const RBSR: { ar: string; en: string }[] = [
      { ar: '\u064a\u062a\u0643\u0631\u0631 \u062a\u0631\u062f\u064a\u062f \u0637\u0641\u0644\u0643 \u0644\u0644\u0643\u0644\u0645\u0627\u062a \u0623\u0648 \u0627\u0644\u0639\u0628\u0627\u0631\u0627\u062a', en: 'My child repeats words or phrases repeatedly' },
      { ar: '\u064a\u0642\u0648\u0645 \u0637\u0641\u0644\u0643 \u0628\u062d\u0631\u0643\u0627\u062a \u064a\u062f\u064a\u0629 \u0645\u062a\u0643\u0631\u0631\u0629 (\u0645\u062b\u0644 \u0627\u0644\u062a\u0644\u0648\u064a\u062a \u0623\u0648 \u0627\u0644\u0637\u0628\u0637\u0628\u0629)', en: 'My child makes repetitive hand movements (flapping, tapping)' },
      { ar: '\u064a\u0644\u062a\u0641\u062a \u0637\u0641\u0644\u0643 \u0623\u0648 \u064a\u0647\u0632 \u062c\u0633\u0645\u0647 \u0628\u0634\u0643\u0644 \u0645\u062a\u0643\u0631\u0631', en: 'My child rocks or sways body repeatedly' },
      { ar: '\u064a\u064f\u0635\u0631 \u0637\u0641\u0644\u0643 \u0639\u0644\u0649 \u062a\u0631\u062a\u064a\u0628 \u0627\u0644\u0623\u0634\u064a\u0627\u0621 \u0628\u0637\u0631\u064a\u0642\u0629 \u0645\u0639\u064a\u0646\u0629', en: 'My child insists on arranging objects in a specific order' },
      { ar: '\u064a\u064f\u0638\u0647\u0631 \u0637\u0641\u0644\u0643 \u0627\u0647\u062a\u0645\u0627\u0645\u0627\u064b \u0634\u062f\u064a\u062f\u0627\u064b \u0628\u0623\u062c\u0632\u0627\u0621 \u0645\u0639\u064a\u0646\u0629 \u0645\u0646 \u0627\u0644\u0623\u0634\u064a\u0627\u0621', en: 'My child shows intense interest in specific parts of objects' },
      { ar: '\u064a\u062a\u0646\u0641\u0633 \u0637\u0641\u0644\u0643 \u0623\u0648 \u064a\u0634\u0645 \u0627\u0644\u0623\u0634\u064a\u0627\u0621 \u0628\u0634\u0643\u0644 \u0645\u062a\u0643\u0631\u0631', en: 'My child sniffs or smells objects frequently' },
      { ar: '\u064a\u064f\u0638\u0647\u0631 \u0637\u0641\u0644\u0643 \u062d\u0633\u0627\u0633\u064a\u0629 \u0639\u0627\u0644\u064a\u0629 \u0644\u0644\u0623\u0635\u0648\u0627\u062a \u0623\u0648 \u0627\u0644\u0623\u0636\u0648\u0627\u0621', en: 'My child shows high sensitivity to sounds or lights' },
      { ar: '\u064a\u0645\u0634\u064a \u0637\u0641\u0644\u0643 \u0639\u0644\u0649 \u0623\u0637\u0631\u0627\u0641 \u0623\u0635\u0627\u0628\u0639\u0647 \u0628\u0634\u0643\u0644 \u0645\u062a\u0643\u0631\u0631', en: 'My child frequently walks on tiptoes' },
      { ar: '\u064a\u064f\u0643\u0631\u0631 \u0637\u0641\u0644\u0643 \u0645\u0634\u0627\u0647\u062f\u0629 \u0646\u0641\u0633 \u0627\u0644\u0641\u064a\u062f\u064a\u0648 \u0623\u0648 \u0627\u0644\u0635\u0648\u0631\u0629', en: 'My child repeatedly watches the same video or image' },
      { ar: '\u064a\u064f\u0638\u0647\u0631 \u0637\u0641\u0644\u0643 \u0627\u0646\u0632\u0639\u0627\u062c\u0627\u064b \u0634\u062f\u064a\u062f\u0627\u064b \u0639\u0646\u062f \u062a\u063a\u064a\u064a\u0631 \u0627\u0644\u0631\u0648\u062a\u064a\u0646 \u0627\u0644\u064a\u0648\u0645\u064a', en: 'My child shows severe distress when changing daily routine' },
    ];

    interface QItem { ar: string; en: string; answer: number | undefined; scored: boolean; label: string }

    const mchatLabels = ['No', 'Sometimes', 'Yes'];
    const srsLabels = ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'];
    const rbsrLabels = ['Never', 'Rarely', 'Sometimes', 'Often'];

    const buildSection = (prefix: string, questions: { ar: string; en: string }[], labels: string[], maxVal: number, threshold: number) => {
      const items: QItem[] = questions.map((q, i) => {
        const val = rawData[prefix + '_' + i];
        return {
          ar: q.ar,
          en: q.en,
          answer: val,
          scored: val !== undefined && val >= threshold,
          label: val !== undefined ? labels[val] : '-',
        };
      });
      const scoredCount = items.filter(x => x.scored).length;
      const totalMax = items.length * maxVal;
      const rawTotal = items.reduce((s, x) => s + (x.answer || 0), 0);
      return { items, scoredCount, total: items.length, totalMax, rawTotal };
    };

    const sections = [
      { key: 'mchat', title_ar: 'M-CHAT-R/F', title_en: 'M-CHAT-R/F', ...buildSection('mchat', MCHAT, mchatLabels, 2, 1) },
      { key: 'srs', title_ar: 'SRS-2', title_en: 'SRS-2', ...buildSection('srs', SRS, srsLabels, 5, 3) },
      { key: 'rbsr', title_ar: 'RBS-R', title_en: 'RBS-R', ...buildSection('rbsr', RBSR, rbsrLabels, 3, 2) },
    ];

    return NextResponse.json({ sections });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}