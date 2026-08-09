import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function ri(label: string, score: number | undefined) {
  const s = score || 0;
  const color = s > 60 ? '#EF4444' : s > 40 ? '#F59E0B' : '#10B981';
  return '<div class="radar-item"><div class="score">' + s + '</div><div class="domain">' + label + '</div><div class="bar-container"><div class="bar" style="width:' + s + '%;background:' + color + '"></div></div></div>';
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const session = await db.session.findUnique({
      where: { id: sessionId },
      include: { patient: true, result: true, assessments: true },
    });

    if (!session || !session.result) {
      return NextResponse.json({ error: 'Session or result not found' }, { status: 404 });
    }

    const patient = session.patient;
    const result = session.result;

    let radarScores: Record<string, number> = {};
    if (typeof result.radarScores === 'string') {
      try { radarScores = JSON.parse(result.radarScores); } catch { radarScores = {}; }
    } else if (result.radarScores) {
      radarScores = result.radarScores as Record<string, number>;
    }

    let xaiReport: any[] = [];
    if (typeof result.xaiReport === 'string') {
      try { xaiReport = JSON.parse(result.xaiReport); } catch { xaiReport = []; }
    } else if (result.xaiReport) {
      xaiReport = result.xaiReport as any[];
    }

    const riskColors: Record<string, string> = {
      low: '#10B981', moderate: '#F59E0B', high: '#F97316', critical: '#EF4444',
    };
    const color = riskColors[result.riskLevel] || '#6B7280';

    const css = 'body{font-family:Arial,Helvetica,sans-serif;padding:40px;color:#1e293b;max-width:800px;margin:0 auto}' +
      '.header{display:flex;align-items:center;gap:16px;margin-bottom:32px;padding-bottom:20px;border-bottom:3px solid ' + color + '}' +
      '.logo{width:56px;height:56px;border-radius:12px;background:linear-gradient(135deg,#0ea5e9,#14b8a6);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:24px}' +
      '.header-text h1{margin:0;font-size:20px;color:#0f172a}' +
      '.header-text p{margin:4px 0 0;font-size:12px;color:#64748b}' +
      '.meta{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:24px}' +
      '.meta-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px}' +
      '.meta-card .label{font-size:10px;text-transform:uppercase;color:#94a3b8;letter-spacing:0.5px}' +
      '.meta-card .value{font-size:18px;font-weight:bold;color:#0f172a;margin-top:4px}' +
      '.risk-badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:bold;color:white;background:' + color + '}' +
      'h2{font-size:16px;color:#0f172a;margin:24px 0 12px;padding-bottom:8px;border-bottom:1px solid #e2e8f0}' +
      'table{width:100%;border-collapse:collapse;margin-bottom:16px}' +
      'th{text-align:left;padding:8px 12px;background:#f1f5f9;font-size:11px;text-transform:uppercase;color:#64748b;border-bottom:2px solid #e2e8f0}' +
      'td{padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:13px}' +
      '.footer{margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;text-align:center;font-size:10px;color:#94a3b8}' +
      '.radar-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:24px}' +
      '.radar-item{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;text-align:center}' +
      '.radar-item .score{font-size:22px;font-weight:bold;color:#0f172a}' +
      '.radar-item .domain{font-size:10px;color:#64748b;margin-top:2px}' +
      '.bar-container{height:8px;background:#e2e8f0;border-radius:4px;overflow:hidden;margin-top:4px}' +
      '.bar{height:100%;border-radius:4px}';

    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    let html = '<!DOCTYPE html><html><head><meta charset="utf-8"><style>' + css + '</style></head><body>';
    html += '<div class="header"><div class="logo">ASD</div><div class="header-text"><h1>ASD Digital Phenotyping Report</h1><p>' + dateStr + ' | Session: ' + sessionId.slice(0, 8) + '</p></div></div>';
    html += '<div class="meta">';
    html += '<div class="meta-card"><div class="label">Patient</div><div class="value">' + patient.name + '</div></div>';
    html += '<div class="meta-card"><div class="label">Age / Gender</div><div class="value">' + patient.age + 'y / ' + patient.gender + '</div></div>';
    html += '<div class="meta-card"><div class="label">Risk Level</div><div class="value"><span class="risk-badge">' + result.riskLevel.toUpperCase() + '</span></div></div></div>';
    html += '<div class="radar-grid">';
    html += ri('Social Comm.', radarScores.social);
    html += ri('Non-Verbal', radarScores.nonverbal);
    html += ri('Repetitive', radarScores.repetitive);
    html += ri('Sensory', radarScores.sensory);
    html += ri('Motor', radarScores.motor);
    html += ri('Executive', radarScores.executive);
    html += '</div>';
    html += '<h2>Assessment Scores</h2><table><tr><th>Assessment</th><th>Score</th><th>Status</th></tr>';
    for (const a of session.assessments) {
      html += '<tr><td>' + a.type + '</td><td>' + (a.score || 0) + '/' + (a.maxScore || '-') + '</td><td>' + (a.completed ? 'Completed' : 'Pending') + '</td></tr>';
    }
    html += '</table>';
    html += '<h2>XAI Feature Analysis</h2><table><tr><th>Feature</th><th>Severity</th><th>Impact</th><th>Score</th></tr>';
    for (const item of xaiReport) {
      const bc = item.impact === 'high' ? '#EF4444' : item.impact === 'medium' ? '#F59E0B' : '#10B981';
      html += '<tr><td>' + (item.feature_en || '') + '</td><td>' + (item.severity_en || '') + '</td><td><span class="risk-badge" style="background:' + bc + ';font-size:10px">' + (item.impact || 'low') + '</span></td><td>' + (item.score || 0) + '%</td></tr>';
    }
    html += '</table>';
    html += '<h2>Summary Metrics</h2><div class="meta">';
    html += '<div class="meta-card"><div class="label">Risk Score</div><div class="value">' + result.riskScore + '%</div></div>';
    html += '<div class="meta-card"><div class="label">ADOS Estimated</div><div class="value">' + (result.adosScore || 0).toFixed(1) + '</div></div>';
    html += '<div class="meta-card"><div class="label">Confidence</div><div class="value">' + Math.round((result.adosConfidence || 0) * 100) + '%</div></div></div>';
    html += '<div class="footer">ASD Digital Phenotyping Platform | Clinical decision support only. Not a diagnosis.<br/>Generated on ' + new Date().toISOString() + '</div>';
    html += '</body></html>';

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': 'inline; filename="assessment-report-' + sessionId.slice(0, 8) + '.html"',
      },
    });
  } catch (error) {
    console.error('PDF export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}