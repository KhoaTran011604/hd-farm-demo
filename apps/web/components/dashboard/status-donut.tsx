import { useTranslations } from 'next-intl';

export interface DonutSegment {
  key: string;
  label: string;
  count: number;
  color: string;
}

interface StatusDonutProps {
  segments: DonutSegment[];
  total: number;
}

const RADIUS = 44;
const CIRC = 2 * Math.PI * RADIUS;

export function StatusDonut({ segments, total }: StatusDonutProps): React.JSX.Element {
  const t = useTranslations('dashboard.statusDist');

  const sumCount = segments.reduce((acc, s) => acc + s.count, 0) || 1;
  let offset = 0;

  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(0,0,0,.06)]">
      <div className="border-b border-[#F3F4F6] px-5 py-4">
        <div className="text-sm font-bold text-[#1A2E0A]">{t('title')}</div>
      </div>
      <div className="flex items-center justify-center gap-5 px-5 py-5">
        <svg viewBox="0 0 120 120" className="h-[120px] w-[120px] shrink-0">
          <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="#F3F4F6" strokeWidth="20" />
          {segments.map((seg) => {
            const len = (seg.count / sumCount) * CIRC;
            const dash = `${len} ${CIRC - len}`;
            const dashOffset = -offset;
            offset += len;
            return (
              <circle
                key={seg.key}
                cx="60"
                cy="60"
                r={RADIUS}
                fill="none"
                stroke={seg.color}
                strokeWidth="20"
                strokeDasharray={dash}
                strokeDashoffset={dashOffset}
                transform="rotate(-90 60 60)"
              />
            );
          })}
          <text
            x="60"
            y="57"
            textAnchor="middle"
            fontSize="20"
            fontWeight="800"
            fill="#1A2E0A"
          >
            {total.toLocaleString()}
          </text>
          <text x="60" y="72" textAnchor="middle" fontSize="9" fill="#9CA3AF">
            {t('unit')}
          </text>
        </svg>
        <ul className="flex flex-col gap-2">
          {segments.map((seg) => {
            const pct = Math.round((seg.count / sumCount) * 100);
            return (
              <li key={seg.key} className="flex items-center gap-2 text-xs">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: seg.color }}
                />
                <span className="flex-1 text-[#4B5563]">{seg.label}</span>
                <span className="font-bold text-[#1A2E0A]">{seg.count}</span>
                <span className="text-[#9CA3AF]">&nbsp;{pct}%</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
