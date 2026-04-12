import {Crown, Lock} from 'lucide-react';
import Badge from '@/shared/components/Badge';
import type {GameDto} from '@/features/game/api';
import {useAuthContext} from "@/hooks/useAuthContext.ts";

const FORMAT_LABELS: Record<string, string> = {STANDARD: 'Standard', DUEL: 'Duel', V5: 'V5'};

interface Props {
    game: GameDto;
    selected?: boolean;
    onClick?: () => void;
}

export default function GameListItem({game, selected = false, onClick}: Props) {
    const {user} = useAuthContext();
    const isOwner = game.owner === user?.username;
    const isFull = game.registrationCount >= game.maxPlayers;

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onClick?.(); }}
            className={[
                'w-full text-left px-4 py-3 border-b border-line/50 transition-colors cursor-pointer',
                selected
                    ? 'bg-accent/10 border-l-2 border-l-accent'
                    : 'hover:bg-hover border-l-2 border-l-transparent',
            ].join(' ')}
        >
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 min-w-0">
                    {game.visibility === 'PRIVATE' && (
                        <Lock className="w-2.5 h-2.5 text-ink-muted shrink-0" />
                    )}
                    <span className={`text-sm font-semibold truncate ${selected ? 'text-accent-soft' : 'text-ink'}`}>
                        {game.name}
                    </span>
                    {isOwner && (
                        <Crown className="w-2.5 h-2.5 text-gold shrink-0" />
                    )}
                </div>
                <span className="text-[10px] text-ink-muted shrink-0 uppercase tracking-wider font-medium">
                    {game.status}
                </span>
            </div>
            
            <div className="flex items-center justify-between mt-1.5">
                <div className="flex items-center gap-2">
                    <Badge variant="format">{FORMAT_LABELS[game.format]}</Badge>
                    <span className={`text-[10px] tabular-nums ${isFull ? 'text-ink-muted' : 'text-ink-soft'}`}>
                        {game.registrationCount}/{game.maxPlayers} players
                    </span>
                </div>
                <div className="text-[10px] text-ink-muted">
                    {game.owner}
                </div>
            </div>
        </div>
    );
}
