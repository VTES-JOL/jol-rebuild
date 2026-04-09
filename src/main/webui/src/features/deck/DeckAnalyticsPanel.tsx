import Panel from '@/shared/components/Panel';
import { OpeningHandSection }     from './analytics/OpeningHandSection';
import { LibraryTypeSection }     from './analytics/LibraryTypeSection';
import { LibraryCostSection }     from './analytics/LibraryCostSection';
import { CryptCapacityCurve }     from './analytics/CryptCapacityCurve';
import { ClanDistributionSection } from './analytics/ClanDistributionSection';
import { DisciplineCoverageSection } from './analytics/DisciplineCoverageSection';
import type { CardDetailData, DeckEntry } from './types';

interface Props {
    entries: DeckEntry[];
    detailMap: Map<string, CardDetailData>;
}

/**
 * Right-hand analytics panel. Each section is an independent component.
 * Breakpoint visibility rules (applied here, not inside each section):
 *   lg  (240px): Opening Hand + Library Types
 *   xl  (280px): + Library Costs + Capacity Curve
 *   2xl (300px): + Clan Distribution + Discipline Coverage
 */
export default function DeckAnalyticsPanel({ entries, detailMap }: Props) {
    const isEmpty = entries.length === 0;

    return (
        <Panel title="Analytics">
            {isEmpty ? (
                <div className="flex-1 flex items-center justify-center p-6 text-xs text-ink-muted text-center leading-relaxed">
                    Select a deck to see analytics.
                </div>
            ) : (
                <div className="overflow-y-auto flex-1 min-h-0">

                    {/* ── Always visible ──────────────────────────────────── */}
                    <OpeningHandSection entries={entries} />
                    <LibraryTypeSection entries={entries} />

                    {/* ── xl+ ─────────────────────────────────────────────── */}
                    <div className="hidden xl:block">
                        <LibraryCostSection  entries={entries} detailMap={detailMap} />
                        <CryptCapacityCurve  entries={entries} detailMap={detailMap} />
                    </div>

                    {/* ── 2xl+ ────────────────────────────────────────────── */}
                    <div className="hidden 2xl:block">
                        <ClanDistributionSection   entries={entries} detailMap={detailMap} />
                        <DisciplineCoverageSection entries={entries} detailMap={detailMap} />
                    </div>

                </div>
            )}
        </Panel>
    );
}
