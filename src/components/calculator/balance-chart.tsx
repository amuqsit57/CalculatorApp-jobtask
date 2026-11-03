"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { duration, money } from "@/lib/format";
import type { ScheduleRow } from "@/lib/loan";

export type ChartSeries = {
  name: string;
  color: string;
  dashed?: boolean;
  rows: ScheduleRow[];
};

const HEIGHT = 280;
const MARGIN = { top: 16, right: 16, bottom: 32, left: 60 };

const TOOLTIP_WIDTH = 216;

/** Round axis steps ($5k, not $6.25k), with at most five of them above zero. */
function axisTicks(peak: number) {
  const magnitude = 10 ** Math.floor(Math.log10(peak));
  const size = [0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 5, 10].find(
    (s) => Math.ceil(peak / (s * magnitude)) <= 5,
  )!;
  const step = size * magnitude;
  const count = Math.ceil(peak / step);
  return Array.from({ length: count + 1 }, (_, index) => index * step);
}

function compactMoney(cents: number) {
  const dollars = cents / 100;
  if (dollars >= 1_000_000) return `$${+(dollars / 1_000_000).toFixed(2)}M`;
  if (dollars >= 1_000) return `$${+(dollars / 1_000).toFixed(1)}k`;
  return `$${+dollars.toFixed(0)}`;
}

/** Balance at a month, counting month 0 as the start. Null once the series has ended. */
function balanceAt(series: ChartSeries, month: number, principal: number) {
  if (month === 0) return principal;
  return series.rows[month - 1]?.balance ?? null;
}

export function BalanceChart({
  principal,
  series,
  caption,
}: {
  principal: number;
  series: ChartSeries[];
  caption: string;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [hoverMonth, setHoverMonth] = useState<number | null>(null);

  useEffect(() => {
    if (!frame.current) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(frame.current);
    return () => observer.disconnect();
  }, []);

  const lastMonth = Math.max(...series.map((s) => s.rows.length));
  const peak = Math.max(principal, ...series.flatMap((s) => s.rows.map((r) => r.balance)));
  const ticks = axisTicks(peak);
  const yMax = ticks[ticks.length - 1];
  const plotWidth = Math.max(width - MARGIN.left - MARGIN.right, 40);
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

  const x = (month: number) => MARGIN.left + (month / lastMonth) * plotWidth;
  const y = (balance: number) => MARGIN.top + plotHeight - (balance / yMax) * plotHeight;

  const totalYears = lastMonth / 12;
  const yearStep = totalYears <= 8 ? 1 : totalYears <= 16 ? 2 : 5;
  const yearTicks: number[] = [];
  for (let year = 0; year * 12 <= lastMonth; year += yearStep) yearTicks.push(year);

  function handlePointer(event: PointerEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - bounds.left - MARGIN.left) / plotWidth;
    setHoverMonth(Math.min(lastMonth, Math.max(0, Math.round(ratio * lastMonth))));
  }

  // Keep the tooltip beside the crosshair, but always inside the chart.
  const tooltipLeft =
    hoverMonth === null
      ? 0
      : Math.max(
          0,
          x(hoverMonth) + 10 + TOOLTIP_WIDTH > width
            ? x(hoverMonth) - 10 - TOOLTIP_WIDTH
            : x(hoverMonth) + 10,
        );

  // Name each line partway along, on its outer side: the higher line is labelled
  // above and to the right, the lower line below and to the left. Both spots are
  // clear of the lines whichever way they slope.
  const labelMonth = Math.round(0.6 * Math.min(...series.map((s) => s.rows.length)));
  const labelBalances = series.map((s) => balanceAt(s, labelMonth, principal) ?? 0);
  const highestLabel = Math.max(...labelBalances);

  return (
    <figure className="m-0">
      {series.length > 1 && (
        <div className="mb-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
          {series.map((s) => (
            <span key={s.name} className="flex items-center gap-2">
              <svg width="26" height="8" aria-hidden="true">
                <line
                  x1="1"
                  y1="4"
                  x2="25"
                  y2="4"
                  stroke={s.color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray={s.dashed ? "5 5" : undefined}
                />
              </svg>
              {s.name}
            </span>
          ))}
        </div>
      )}

      <div ref={frame} className="relative overflow-hidden">
        <svg
          width={width}
          height={HEIGHT}
          role="img"
          aria-label={caption}
          className="block touch-pan-y"
          onPointerMove={handlePointer}
          onPointerDown={handlePointer}
          onPointerLeave={() => setHoverMonth(null)}
        >
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={MARGIN.left}
                x2={width - MARGIN.right}
                y1={y(tick)}
                y2={y(tick)}
                stroke="var(--border)"
                strokeWidth="1"
              />
              <text
                x={MARGIN.left - 8}
                y={y(tick) + 4}
                textAnchor="end"
                fontSize="12"
                fill="var(--muted-foreground)"
              >
                {compactMoney(tick)}
              </text>
            </g>
          ))}

          {yearTicks.map((year) => (
            <text
              key={year}
              x={x(year * 12)}
              y={HEIGHT - 10}
              textAnchor="middle"
              fontSize="12"
              fill="var(--muted-foreground)"
            >
              {year === 0 ? "Start" : `Yr ${year}`}
            </text>
          ))}

          {series.map((s) => {
            const points = [`${x(0)},${y(principal)}`].concat(
              s.rows.map((row) => `${x(row.month)},${y(row.balance)}`),
            );
            return (
              <polyline
                key={s.name}
                points={points.join(" ")}
                fill="none"
                stroke={s.color}
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeDasharray={s.dashed ? "6 5" : undefined}
              />
            );
          })}

          {series.length > 1 &&
            series.map((s, index) => {
              const isHighest = labelBalances[index] === highestLabel;
              return (
                <text
                  key={s.name}
                  x={x(labelMonth) + (isHighest ? 10 : -10)}
                  y={y(labelBalances[index]) + (isHighest ? -12 : 20)}
                  textAnchor={isHighest ? "start" : "end"}
                  fontSize="12"
                  fontWeight="600"
                  fill="var(--foreground)"
                  pointerEvents="none"
                >
                  {s.name}
                </text>
              );
            })}

          {hoverMonth !== null && (
            <g pointerEvents="none">
              <line
                x1={x(hoverMonth)}
                x2={x(hoverMonth)}
                y1={MARGIN.top}
                y2={MARGIN.top + plotHeight}
                stroke="var(--muted-foreground)"
                strokeWidth="1"
              />
              {series.map((s) => {
                const balance = balanceAt(s, hoverMonth, principal);
                if (balance === null) return null;
                return (
                  <circle
                    key={s.name}
                    cx={x(hoverMonth)}
                    cy={y(balance)}
                    r="4.5"
                    fill={s.color}
                    stroke="var(--card)"
                    strokeWidth="2"
                  />
                );
              })}
            </g>
          )}
        </svg>

        {hoverMonth !== null && (
          <div
            className="pointer-events-none absolute top-3 z-10 border border-foreground bg-card px-3 py-2 text-sm shadow-[3px_3px_0_var(--border)]"
            style={{ left: tooltipLeft, width: TOOLTIP_WIDTH }}
          >
            <p className="mb-1 font-semibold">
              {hoverMonth === 0 ? "At the start" : `After ${duration(hoverMonth)}`}
            </p>
            {series.map((s) => {
              const balance = balanceAt(s, hoverMonth, principal);
              return (
                <p key={s.name} className="flex justify-between gap-4">
                  <span className="text-muted-foreground">{s.name}</span>
                  <span className="figure">{money(balance ?? 0)}</span>
                </p>
              );
            })}
          </div>
        )}
      </div>
    </figure>
  );
}
