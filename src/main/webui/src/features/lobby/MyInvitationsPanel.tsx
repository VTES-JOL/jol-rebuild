import {useEffect, useState} from 'react';
import Panel from '@/shared/components/Panel';
import gameApi, {type GameDto} from '@/features/game/api';
import GameRegistrationModal from './GameRegistrationModal';

const FORMAT_LABELS: Record<string, string> = {STANDARD: 'Standard', DUEL: 'Duel', V5: 'V5'};

interface Props {
    currentUsername: string;
    onChanged?: () => void;
}

export default function MyInvitationsPanel({currentUsername, onChanged}: Props) {
    const [invites, setInvites] = useState<GameDto[]>([]);
    const [selectedGameId, setSelectedGameId] = useState<number | null>(null);

    const refresh = () => {
        gameApi.listMyInvited().then(setInvites).catch(() => {});
    };

    useEffect(() => { refresh(); }, []);

    return (
        <>
            <Panel
                title={
                    <span className="text-sm font-medium">
                        Invitations
                        {invites.length > 0 && (
                            <span className="ml-1.5 text-[10px] text-ink-muted">({invites.length})</span>
                        )}
                    </span>
                }
            >
                <div className="flex-1 overflow-y-auto min-h-0">
                    {invites.length === 0 && (
                        <p className="text-xs text-ink-muted text-center p-4">No pending invitations.</p>
                    )}
                    {invites.map(g => (
                        <div
                            key={g.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedGameId(g.id)}
                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSelectedGameId(g.id); }}
                            className="flex items-center justify-between px-4 py-2.5 border-b border-line/40 hover:bg-hover/50 cursor-pointer transition-colors"
                        >
                            <div className="min-w-0">
                                <div className="text-sm text-ink truncate">{g.name}</div>
                                <div className="text-[10px] text-ink-muted">{g.owner}</div>
                            </div>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-arcane/10 border border-arcane/20 text-arcane-soft uppercase tracking-tight shrink-0 ml-2">
                                {FORMAT_LABELS[g.format]}
                            </span>
                        </div>
                    ))}
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
}
