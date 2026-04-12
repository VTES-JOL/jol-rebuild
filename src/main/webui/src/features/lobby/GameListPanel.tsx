import {useState} from 'react';
import {Filter, Gamepad2, Search, X} from 'lucide-react';
import Panel from '@/shared/components/Panel';
import Button from '@/shared/components/Button';
import EmptyState from '@/shared/components/EmptyState';
import {TabStrip} from '@/shared/components/Tabs';
import type {GameDto} from '@/features/game/api';
import GameListItem from './GameListItem';

export type GameFilterTab = 'All' | 'Invited' | 'Registered' | 'Active' | 'Open' | 'My Games';
const TABS: GameFilterTab[] = ['All', 'Invited', 'Registered', 'Active', 'Open', 'My Games'];

interface Props {
    games: GameDto[];
    selectedId?: number | null;
    currentUsername?: string;
    onSelect?: (game: GameDto) => void;
    onCreate?: () => void;
    loading?: boolean;
    loadError?: string;
}

export default function GameListPanel({
    games, selectedId = null, currentUsername, onSelect, onCreate, loading, loadError,
}: Props) {
    const [nameFilter, setNameFilter] = useState('');
    const [tab, setTab] = useState<GameFilterTab>('All');
    
    const filterGames = (gs: GameDto[]) => {
        let filtered = gs;
        
        // Tab filtering
        if (tab === 'Invited') {
            filtered = filtered.filter(g => g.status === 'OPEN' && games.some(original => original.id === g.id && original.owner !== currentUsername)); 
            // In a real scenario, we'd need a way to know if invited. 
            // Since we merged all, we might want to check if the user is in the invites list from GameDetail, 
            // but we only have GameDto here.
        } else if (tab === 'Active') {
            filtered = filtered.filter(g => g.status === 'ACTIVE');
        } else if (tab === 'Open') {
            filtered = filtered.filter(g => g.status === 'OPEN');
        } else if (tab === 'My Games') {
            filtered = filtered.filter(g => g.owner === currentUsername);
        } else if (tab === 'Registered') {
            // Simplified: if open and not owner, it might be one we registered for.
            // Ideally we'd pass this state from LobbyPage.
            filtered = filtered.filter(g => g.status === 'OPEN' && g.owner !== currentUsername);
        }

        if (nameFilter.trim()) {
            filtered = filtered.filter(g => g.name.toLowerCase().includes(nameFilter.toLowerCase()));
        }
        
        return filtered;
    };

    const visible = filterGames(games);

    return (
        <Panel
            title="Games"
            right={
                <Button variant="accent-ghost" size="sm" onClick={onCreate}>+ Create</Button>
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
                    onChange={key => setTab(key as GameFilterTab)}
                />
            </div>

            {loadError ? (
                <EmptyState
                    title="Failed to load games."
                    className="text-blood-soft"
                />
            ) : games.length === 0 && !loading ? (
                <EmptyState
                    icon={Gamepad2}
                    title="No games found."
                    action={
                        <Button variant="accent-ghost" size="sm" onClick={onCreate}>
                            Create a game →
                        </Button>
                    }
                />
            ) : visible.length === 0 && !loading ? (
                <EmptyState title="No games match the current criteria." />
            ) : (
                <div className="overflow-y-auto flex-1 min-h-0">
                    {visible.map(game => (
                        <GameListItem
                            key={game.id}
                            game={game}
                            selected={selectedId === game.id}
                            onClick={() => onSelect?.(game)}
                        />
                    ))}
                </div>
            )}
        </Panel>
    );
}
