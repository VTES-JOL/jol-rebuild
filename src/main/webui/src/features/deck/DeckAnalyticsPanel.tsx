import Panel from '@/shared/components/Panel';
import { OpeningHandSection }     from './analytics/OpeningHandSection';
import { LibraryTypeSection }     from './analytics/LibraryTypeSection';
import { LibraryCostSection }     from './analytics/LibraryCostSection';
import { CryptCapacityCurve }     from './analytics/CryptCapacityCurve';
import { ClanDistributionSection } from './analytics/ClanDistributionSection';
import { DisciplineCoverageSection } from './analytics/DisciplineCoverageSection';
import type { CardIconData, DeckEntry } from './types';

interface Props {
    entries: DeckEntry[];
    iconMap: Map<string, CardIconData>;
}

/**
 * Right-hand analytics panel. Each section is an independent component.
 * Breakpoint visibility rules (applied here, not inside each section):
 *   lg  (240px): Opening Hand + Library Types
 *   xl  (280px): + Library Costs + Capacity Curve
 *   2xl (300px): + Clan Distribution + Discipline Coverage
 */
export default function DeckAnalyticsPanel({ entries, iconMap }: Props) {
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
                        <LibraryCostSection  entries={entries} iconMap={iconMap} />
                        <CryptCapacityCurve  entries={entries} iconMap={iconMap} />
                    </div>

                    {/* ── 2xl+ ────────────────────────────────────────────── */}
                    <div className="hidden 2xl:block">
                        <ClanDistributionSection   entries={entries} iconMap={iconMap} />
                        <DisciplineCoverageSection entries={entries} iconMap={iconMap} />
                    </div>

                </div>
            )}
        </Panel>
    );
}
