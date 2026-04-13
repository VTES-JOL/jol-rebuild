import {useState} from 'react';
import {Search, Trophy} from 'lucide-react';
import Panel from '@/shared/components/Panel';
import Button from '@/shared/components/Button';
import EmptyState from '@/shared/components/EmptyState';
import {TabStrip} from '@/shared/components/Tabs';
import type {Tournament, TournamentStatus} from './types';

export type TournamentFilterTab = 'All' | TournamentStatus;
const TABS: TournamentFilterTab[] = ['All', 'Starting', 'Active', 'Seeding', 'Finals', 'Completed'];

interface Props {
    tournaments: Tournament[];
    selectedId?: number | null;
    onSelect?: (tournament: Tournament) => void;
    onCreate?: () => void;
    loading?: boolean;
    isTournamentAdmin?: boolean;
}

export default function TournamentListPanel({
    tournaments, selectedId = null, onSelect, onCreate, loading, isTournamentAdmin
}: Props) {
    const [nameFilter, setNameFilter] = useState('');
    const [tab, setTab] = useState<TournamentFilterTab>('All');
    
    const filtered = tournaments.filter(t => {
        if (tab !== 'All' && t.status !== tab) return false;
        if (nameFilter.trim() && !t.name.toLowerCase().includes(nameFilter.toLowerCase())) return false;
        return true;
    });

    return (
        <Panel
            title="Tournaments"
            right={
                isTournamentAdmin && (
                    <Button variant="accent-ghost" size="sm" onClick={onCreate}>+ Create</Button>
                )
            }
        >
            <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-line/50">
                <Search className="w-3 h-3 shrink-0 text-ink-muted" />
                <input
                    type="text"
                    placeholder="Filter by name…"
                    value={nameFilter}
                    onChange={e => setNameFilter(e.target.value)}
                    className="w-full bg-transparent text-xs text-ink placeholder:text-ink-muted outline-none"
                />
            </div>

            <div className="px-3 py-2 border-b border-line/50 shrink-0 overflow-x-auto no-scrollbar">
                <TabStrip
                    tabs={TABS.map(t => ({key: t, label: t}))}
                    active={tab}
                    onChange={key => setTab(key as TournamentFilterTab)}
                />
            </div>

            {tournaments.length === 0 && !loading ? (
                <EmptyState
                    icon={Trophy}
                    title="No tournaments found."
                    action={
                        isTournamentAdmin && (
                            <Button variant="accent-ghost" size="sm" onClick={onCreate}>
                                Create a tournament →
                            </Button>
                        )
                    }
                />
            ) : filtered.length === 0 && !loading ? (
                <EmptyState title="No tournaments match the current criteria." />
            ) : (
                <div className="overflow-y-auto flex-1 min-h-0">
                    {filtered.map(t => (
                        <button
                            key={t.id}
                            onClick={() => onSelect?.(t)}
                            className={`w-full text-left px-4 py-3 border-b border-line/30 transition-colors hover:bg-hover ${
                                selectedId === t.id ? 'bg-accent/10 border-l-2 border-l-accent' : ''
                            }`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-sm font-semibold ${selectedId === t.id ? 'text-accent-soft' : 'text-ink'}`}>
                                    {t.name}
                                </span>
                                <span className="text-[10px] uppercase tracking-wider text-ink-muted">
                                    {t.status}
                                </span>
                            </div>
                            <div className="text-[10px] text-ink-muted flex gap-2">
                                <span>{t.gameFormat}</span>
                                <span>•</span>
                                <span>{t.format === 'SINGLE_DECK' ? 'Single' : 'Multi'} Deck</span>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </Panel>
    );
}
