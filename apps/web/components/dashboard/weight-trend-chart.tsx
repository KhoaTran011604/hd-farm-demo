'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

type Range = '7' | '30' | '90';

interface WeightPoint {
  date: string;
  weight: number;
}

interface WeightTrendChartProps {
  points: WeightPoint[];
}

function buildPath(points: WeightPoint[], width: number, height: number): { line: string; area: string } {
  if (points.length === 0) return { line: '', area: '' };
  const min = Math.min(...points.map((p) => p.weight));
  const max = Math.max(...points.map((p) => p.weight));
  const span = max - min || 1;
  const padX = 60;
  const padTop = 20;
  const padBottom = 30;
  const innerW = width - padX - 20;
  const innerH = height - padTop - padBottom;

  const coords = points.map((p, i) => {
    const x = padX + (i / (points.length - 1)) * innerW;
    const y = padTop + innerH - ((p.weight - min) / span) * innerH;
    return { x, y };
  });

  const line = coords
    .map((c, i) => (i === 0 ? `M${c.x},${c.y}` : `L${c.x},${c.y}`))
    .join(' ');

  const area = `${line} L${coords[coords.length - 1].x},${padTop + innerH} L${coords[0].x},${padTop + innerH} Z`;

  return { line, area };
}

export function WeightTrendChart({ points }: WeightTrendChartProps): React.JSX.Element {
  const t = useTranslations('dashboard.weightTrend');
  const [range, setRange] = React.useState<Range>('30');

  const { line, area } = buildPath(points, 900, 200);

  const ranges: { key: Range; label: string }[] = [
    { key: '7', label: t('range7') },
    { key: '30', label: t('range30') },
    { key: '90', label: t('range90') },
  ];

  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(0,0,0,.06)]">
      <div className="flex items-center justify-between border-b border-[#F3F4F6] px-5 py-4">
        <div className="text-sm font-bold text-[#1A2E0A]">{t('title')}</div>
        <div className="flex gap-2">
          {ranges.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRange(r.key)}
              className={cn(
                'rounded-md border px-2.5 py-1 text-[11px] font-medium',
                range === r.key
                  ? 'border-primary bg-primary text-white'
                  : 'border-[#E5E7EB] bg-background text-[#4B5563]',
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <div className="px-5 pb-5">
        <svg
          viewBox="0 0 900 200"
          preserveAspectRatio="none"
          className="h-[200px] w-full"
        >
          <line x1="60" y1="20" x2="60" y2="170" stroke="#F3F4F6" strokeWidth="1" />
          <line x1="60" y1="20" x2="880" y2="20" stroke="#F3F4F6" strokeWidth="1" />
          <line x1="60" y1="70" x2="880" y2="70" stroke="#F3F4F6" strokeWidth="1" />
          <line x1="60" y1="120" x2="880" y2="120" stroke="#F3F4F6" strokeWidth="1" />
          <line x1="60" y1="170" x2="880" y2="170" stroke="#E5E7EB" strokeWidth="1" />
          <path d={area} fill="#DCFCE7" opacity="0.6" />
          <path d={line} fill="none" stroke="#2D5016" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}
