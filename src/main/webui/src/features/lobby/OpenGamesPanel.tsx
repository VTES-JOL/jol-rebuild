import {useEffect, useRef, useState} from 'react';
import {Lock} from 'lucide-react';
import Panel from '@/shared/components/Panel';
import Button from '@/shared/components/Button';
import Badge from '@/shared/components/Badge';
import EmptyState from '@/shared/components/EmptyState';
import {TabStrip} from '@/shared/components/Tabs';
import gameApi, {type GameDto} from '@/features/game/api';
import CreateGameModal from './CreateGameModal';
import GameRegistrationModal from './GameRegistrationModal';

const TABS = ['All', 'STANDARD', 'DUEL', 'V5'] as const;
type Tab = typeof TABS[number];

const FORMAT_LABELS: Record<string, string> = {STANDARD: 'Standard', DUEL: 'Duel', V5: 'V5'};

interface Props {
    currentUsername: string;
    onChanged?: () => void;
    /** Parent passes a ref container so it can trigger refresh externally (e.g. on LOBBY_UPDATE). */
    onRefreshRef?: React.MutableRefObject<(() => void) | null>;
}

export default function OpenGamesPanel({currentUsername, onChanged, onRefreshRef}: Props) {
    const [games, setGames] = useState<GameDto[]>([]);
    const [tab, setTab] = useState<Tab>('All');
    const [showCreate, setShowCreate] = useState(false);
    const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
    const refreshRef = useRef<() => void>(() => {});

    const refresh = () => {
        gameApi.listOpen().then(setGames).catch(() => {});
    };

    // Keep refreshRef and onRefreshRef in sync so the parent can call it
    useEffect(() => { refreshRef.current = refresh; });
    useEffect(() => {
        if (onRefreshRef) onRefreshRef.current = () => refreshRef.current();
        return () => { if (onRefreshRef) onRefreshRef.current = null; };
    }, [onRefreshRef]);

    useEffect(() => { refresh(); }, []);

    const visible = tab === 'All' ? games : games.filter(g => g.format === tab);

    return (
        <>
            <Panel
                title={<span className="text-sm font-medium">Open Games</span>}
                right={
                    <Button variant="accent-ghost" size="sm" onClick={() => setShowCreate(true)}>
                        + Create
                    </Button>
                }
            >
                {/* Tab strip */}
                <div className="px-3 py-2 border-b border-line/50 shrink-0">
                    <TabStrip
                        tabs={TABS.map(t => ({key: t, label: t === 'All' ? 'All' : FORMAT_LABELS[t]}))}
                        active={tab}
                        onChange={key => setTab(key as Tab)}
                    />
                </div>

                {/* Game list */}
                <div className="flex-1 overflow-y-auto min-h-0">
                    {visible.length === 0 ? (
                        <EmptyState title="No open games." />
                    ) : (
                        visible.map(g => (
                            <GameRow
                                key={g.id}
                                game={g}
                                currentUsername={currentUsername}
                                onSelect={() => setSelectedGameId(g.id)}
                            />
                        ))
                    )}
                </div>
            </Panel>

            {showCreate && (
                <CreateGameModal
                    onCreated={() => { setShowCreate(false); refresh(); }}
                    onClose={() => setShowCreate(false)}
                />
            )}
            {selectedGameId !== null && (
                <GameRegistrationModal
                    gameId={selectedGameId}
                    currentUsername={currentUsername}
                    onClose={() => setSelectedGameId(null)}
                    onChanged={() => { refresh(); onChanged?.(); }}
                />
            )}
        </>
    );
}

function GameRow({game, currentUsername, onSelect}: {game: GameDto; currentUsername: string; onSelect: () => void}) {
    const isFull = game.registrationCount >= game.maxPlayers;
    const isOwner = game.owner === currentUsername;

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onSelect}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onSelect(); }}
            className="flex items-center gap-3 px-4 py-2.5 border-b border-line/40 hover:bg-hover/50 cursor-pointer transition-colors"
        >
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                    {game.visibility === 'PRIVATE' && (
                        <Lock className="w-2.5 h-2.5 text-ink-muted shrink-0" />
                    )}
                    <span className="text-sm text-ink truncate">{game.name}</span>
                    {isOwner && (
                        <span className="text-[9px] text-ink-muted shrink-0">(you)</span>
                    )}
                </div>
                <div className="text-[10px] text-ink-muted mt-0.5">
                    {game.owner ?? 'Public'}
                </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                <Badge variant="format">{FORMAT_LABELS[game.format]}</Badge>
                <span className={`text-xs tabular-nums font-medium ${isFull ? 'text-ink-muted' : 'text-ink'}`}>
                    {game.registrationCount}/{game.maxPlayers}
                </span>
            </div>
        </div>
    );
}
