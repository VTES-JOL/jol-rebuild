import {SectionHeader} from './SectionHeader';
import type {DeckEntry} from '../types';

/** Binomial coefficient C(n, k). */
function comb(n: number, k: number): number {
    if (k < 0 || k > n) return 0;
    if (k === 0 || k === n) return 1;
    const r = Math.min(k, n - k);
    let result = 1;
    for (let i = 0; i < r; i++) result = result * (n - i) / (i + 1);
    return Math.round(result);
}

/** P(drawing ≥1 copy of a card with K copies in a crypt of N), drawing n cards. */
function openingHandProb(N: number, K: number, n = 4): number {
    if (K <= 0) return 0;
    if (N <= n) return 1;
    return 1 - comb(N - K, n) / comb(N, n);
}

function probColor(pct: number) {
    if (pct >= 70) return { text: 'text-online',  bar: 'bg-online' };
    if (pct >= 40) return { text: 'text-away',    bar: 'bg-away' };
    return             { text: 'text-blood-soft', bar: 'bg-blood-soft' };
}

interface Props { entries: DeckEntry[] }

export function OpeningHandSection({ entries }: Props) {
    const cryptEntries = entries.filter(e => e.isCrypt);
    const cryptTotal   = cryptEntries.reduce((s, e) => s + e.count, 0);

    const handEntries = cryptEntries.filter(e => e.count > 1);

    if (handEntries.length === 0) return null;
    if (!cryptEntries.some(e => e.count >= 3)) return null;

    const rows = handEntries
        .map(e => ({ ...e, prob: openingHandProb(cryptTotal, e.count) }))
        .sort((a, b) => b.prob - a.prob);

    return (
        <div className="border-b border-line/50">
            <SectionHeader
                title="Opening Hand"
                subtitle={`P(≥1 copy drawn) · ${cryptTotal} crypt · 4 cards`}
            />
            {rows.map(row => {
                const pct    = Math.round(row.prob * 100);
                const colors = probColor(pct);
                return (
                    <div key={row.cardId} className="px-3 py-2 border-b border-line/40 last:border-0">
                        <div className="flex items-baseline justify-between gap-1 mb-1.5">
                            <span className="text-xs text-ink-secondary truncate min-w-0 leading-none">
                                {row.name}
                            </span>
                            <div className="flex items-baseline gap-1.5 shrink-0">
                                <span className="text-[10px] text-ink-muted tabular-nums">×{row.count}</span>
                                <span className={`text-xs font-semibold tabular-nums ${colors.text}`}>{pct}%</span>
                            </div>
                        </div>
                        <div className="h-1 rounded-full bg-hover overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${colors.bar}`}
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                    </div>
                );
            })}
            <div className="px-3 py-1.5">
                <p className="text-[10px] text-ink-muted tabular-nums">
                    {cryptEntries.length} unique vampire{cryptEntries.length !== 1 ? 's' : ''}
                </p>
            </div>
        </div>
    );
}
