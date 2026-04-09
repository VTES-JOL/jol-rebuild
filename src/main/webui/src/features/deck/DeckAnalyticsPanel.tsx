import Panel from '@/shared/components/Panel';
import type { DeckEntry } from './types';

interface Props {
    entries: DeckEntry[];
}

// ── Maths ─────────────────────────────────────────────────────────────────────

/** Binomial coefficient C(n, k), returns 0 when k > n. */
function comb(n: number, k: number): number {
    if (k < 0 || k > n) return 0;
    if (k === 0 || k === n) return 1;
    const r = Math.min(k, n - k);
    let result = 1;
    for (let i = 0; i < r; i++) {
        result = result * (n - i) / (i + 1);
    }
    return Math.round(result);
}

/**
 * Hypergeometric P(X ≥ 1): probability of drawing at least one copy of a card
 * with K copies in a crypt of N cards when drawing n cards.
 *
 * P(X=0) = C(N−K, n) / C(N, n)   →   P(X≥1) = 1 − P(X=0)
 *
 * Edge case: if N ≤ n you draw the whole crypt, so probability is 1.
 */
function openingHandProb(N: number, K: number, n = 4): number {
    if (K <= 0) return 0;
    if (N <= n) return 1;
    return 1 - comb(N - K, n) / comb(N, n);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function probColor(pct: number): { text: string; bar: string } {
    if (pct >= 70) return { text: 'text-online',     bar: 'bg-online' };
    if (pct >= 40) return { text: 'text-away',       bar: 'bg-away' };
    return             { text: 'text-blood-soft',    bar: 'bg-blood-soft' };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DeckAnalyticsPanel({ entries }: Props) {
    const cryptEntries = entries.filter(e => e.isCrypt);
    const cryptTotal   = cryptEntries.reduce((s, e) => s + e.count, 0);

    return (
        <Panel title="Analytics">
            {cryptEntries.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-6 text-xs text-ink-muted text-center leading-relaxed">
                    {entries.length === 0
                        ? 'Select a deck to see analytics.'
                        : 'No crypt cards in this deck.'}
                </div>
            ) : (
                <>
                    {/* Section header */}
                    <div className="px-3 py-2 border-b border-line/50">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">Opening Hand</p>
                        <p className="text-[10px] text-ink-muted mt-0.5">
                            P(≥1 copy drawn) · {cryptTotal} crypt · 4 cards
                        </p>
                    </div>

                    {/* Probability rows */}
                    <div className="overflow-y-auto flex-1 min-h-0">
                        {cryptEntries
                            .map(e => ({ ...e, prob: openingHandProb(cryptTotal, e.count) }))
                            .sort((a, b) => b.prob - a.prob)
                            .map(row => {
                                const pct    = Math.round(row.prob * 100);
                                const colors = probColor(pct);
                                return (
                                    <div key={row.cardId} className="px-3 py-2 border-b border-line/40">
                                        <div className="flex items-baseline justify-between gap-1 mb-1.5">
                                            <span className="text-xs text-ink-secondary truncate min-w-0 leading-none">
                                                {row.name}
                                            </span>
                                            <div className="flex items-baseline gap-1.5 shrink-0">
                                                <span className="text-[10px] text-ink-muted tabular-nums">×{row.count}</span>
                                                <span className={`text-xs font-semibold tabular-nums ${colors.text}`}>
                                                    {pct}%
                                                </span>
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
                    </div>

                    {/* Footer */}
                    <div className="px-3 py-1.5 border-t border-line/50">
                        <p className="text-[10px] text-ink-muted tabular-nums">
                            {cryptEntries.length} unique vampire{cryptEntries.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </>
            )}
        </Panel>
    );
}
