import {forwardRef, useEffect, useImperativeHandle, useState} from 'react';
import {Check, Crown} from 'lucide-react';
import Panel from '@/shared/components/Panel';
import gameApi, {type GameDto} from '@/features/game/api';
import GameRegistrationModal from './GameRegistrationModal';

const FORMAT_LABELS: Record<string, string> = {STANDARD: 'Standard', DUEL: 'Duel', V5: 'V5'};

interface Props {
    currentUsername: string;
    onChanged?: () => void;
}

export interface MyLobbyPanelHandle {
    refresh: () => void;
}

const MyLobbyPanel = forwardRef<MyLobbyPanelHandle, Props>(function MyLobbyPanel(
    {currentUsername, onChanged}, ref
) {
    const [owned,      setOwned]      = useState<GameDto[]>([]);
    const [registered, setRegistered] = useState<GameDto[]>([]);
    const [invited,    setInvited]    = useState<GameDto[]>([]);
    const [selectedGameId, setSelectedGameId] = useState<number | null>(null);

    const refresh = () => {
        gameApi.listMyOwned().then(setOwned).catch(() => {});
        gameApi.listMyRegistered().then(setRegistered).catch(() => {});
        gameApi.listMyInvited().then(setInvited).catch(() => {});
    };

    useEffect(() => { refresh(); }, []);

    useImperativeHandle(ref, () => ({refresh}));

    // Owned games that aren't also in registered (owner may self-register)
    const registeredIds = new Set(registered.map(g => g.id));
    const ownedOnly = owned.filter(g => !registeredIds.has(g.id));

    const total = ownedOnly.length + registered.length + invited.length;

    return (
        <>
            <Panel
                title={
                    <span className="text-sm font-medium">
                        My Games
                        {total > 0 && (
                            <span className="ml-1.5 text-[10px] text-ink-muted">({total})</span>
                        )}
                    </span>
                }
            >
                <div className="flex-1 overflow-y-auto min-h-0">
                    {total === 0 && (
                        <p className="text-xs text-ink-muted text-center p-4">No pending games.</p>
                    )}

                    {ownedOnly.length > 0 && (
                        <>
                            <SectionHeader>Hosting</SectionHeader>
                            {ownedOnly.map(g => (
                                <GameRow key={g.id} game={g} indicator="crown" onSelect={() => setSelectedGameId(g.id)} />
                            ))}
                        </>
                    )}

                    {registered.length > 0 && (
                        <>
                            <SectionHeader>Registered</SectionHeader>
                            {registered.map(g => (
                                <GameRow key={g.id} game={g} indicator="check" onSelect={() => setSelectedGameId(g.id)} />
                            ))}
                        </>
                    )}

                    {invited.length > 0 && (
                        <>
                            <SectionHeader>Invited</SectionHeader>
                            {invited.map(g => (
                                <GameRow key={g.id} game={g} indicator="none" onSelect={() => setSelectedGameId(g.id)} />
                            ))}
                        </>
                    )}
                </div>
            </Panel>

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
});

export default MyLobbyPanel;

function SectionHeader({children}: {children: React.ReactNode}) {
    return (
        <div className="px-3 py-1 bg-panel border-y border-line/50 text-[10px] font-semibold text-ink uppercase tracking-wider">
            {children}
        </div>
    );
}

function GameRow({game, indicator, onSelect}: {
    game: GameDto;
    indicator: 'check' | 'crown' | 'none';
    onSelect: () => void;
}) {
    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onSelect}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onSelect(); }}
            className="flex items-center justify-between px-4 py-2.5 border-b border-line/40 hover:bg-hover/50 cursor-pointer transition-colors"
        >
            <div className="min-w-0">
                <div className="text-sm text-ink truncate">{game.name}</div>
                <div className="text-[10px] text-ink-muted tabular-nums">
                    {game.registrationCount}/{game.maxPlayers} · {FORMAT_LABELS[game.format]}
                </div>
            </div>
            <div className="shrink-0 ml-2">
                {indicator === 'check' && <Check className="w-3 h-3 text-online" />}
                {indicator === 'crown' && <Crown className="w-3 h-3 text-gold" />}
            </div>
        </div>
    );
}
