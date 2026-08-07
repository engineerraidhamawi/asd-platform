'use client';
import { useMemo } from 'react';

interface RadarChartProps { scores: number[]; labels: string[]; lang: 'ar' | 'en'; }

export function RadarChart({ scores, labels, lang }: RadarChartProps) {
  const size = 400; const center = size / 2; const maxRadius = size * 0.35;
  const levels = [20, 40, 60, 80, 100]; const numAxes = 6;
  const getPolygonPoints = (radius: number) => Array.from({ length: numAxes }, (_, i) => { const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2; return { x: center + Math.cos(angle) * radius, y: center + Math.sin(angle) * radius }; });
  const dataPoints = useMemo(() => scores.map((score, i) => { const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2; const r = Math.min(Math.max(score, 0), 100) / 100 * maxRadius; return { x: center + Math.cos(angle) * r, y: center + Math.sin(angle) * r, score }; }), [scores]);
  const labelPositions = useMemo(() => labels.map((label, i) => { const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2; const lx = center + Math.cos(angle) * (maxRadius + 35); const ly = center + Math.sin(angle) * (maxRadius + 35); let textAnchor: string = 'middle'; if (Math.abs(Math.cos(angle)) > 0.3) { textAnchor = Math.cos(angle) > 0 ? 'start' : 'end'; } return { x: lx, y: ly, label, textAnchor }; }), [labels]);
  const gridPolygon = (radius: number) => getPolygonPoints(radius).map(p => `${p.x},${p.y}`).join(' ');
  const dataPolygonStr = dataPoints.map(p => `${p.x},${p.y}`).join(' ');
  return (
    <div className='w-full flex justify-center' dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <svg viewBox={`0 0 ${size} ${size}`} className='w-full max-w-[360px] h-auto' role='img' aria-label='Radar chart'>
        <polygon points={dataPolygonStr} fill='rgba(16, 185, 129, 0.15)' stroke='none' />
        {levels.map(level => <polygon key={level} points={gridPolygon((level / 100) * maxRadius)} fill='none' stroke={level === 100 ? '#D1D5DB' : '#F3F4F6'} strokeWidth={level === 100 ? 1.5 : 1} />)}
        {[0,1,2,3,4].map(i => { const r = ((i + 1) * 20 / 100) * maxRadius; return <text key={`l-${i}`} x={center + 4} y={center - r + 3} fill='#9CA3AF' fontSize='8' fontFamily='system-ui'>{(i+1)*20}</text>; })}
        {getPolygonPoints(maxRadius).map((point, i) => <line key={`ax-${i}`} x1={center} y1={center} x2={point.x} y2={point.y} stroke='#E5E7EB' />)}
        <polygon points={dataPolygonStr} fill='none' stroke='#10B981' strokeWidth={2.5} strokeLinejoin='round' />
        {dataPoints.map((point, i) => <g key={`p-${i}`}><circle cx={point.x} cy={point.y} r={5} fill='#10B981' stroke='#FFF' strokeWidth={2.5} /><text x={point.x} y={point.y + 1} fill='white' fontSize='7' fontWeight='bold' textAnchor='middle' dominantBaseline='central'>{point.score}</text></g>)}
        {labelPositions.map((lp, i) => <text key={`lb-${i}`} x={lp.x} y={lp.y} fill='#374151' fontSize={11} fontWeight='600' textAnchor={lp.textAnchor as any} dominantBaseline='central'>{lp.label}</text>)}
      </svg>
    </div>
  );
}