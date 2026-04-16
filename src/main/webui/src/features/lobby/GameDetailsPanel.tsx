import {useCallback, useEffect, useRef, useState} from 'react';
import {ExternalLink, Globe, Info, Lock, Pencil} from 'lucide-react';
import Panel from '@/shared/components/Panel';
import Button from '@/shared/components/Button';
import Badge from '@/shared/components/Badge';
import gameApi, {type GameDetail, type GameDto} from '@/features/game/api';
import deckApi from '@/features/deck/api';
import {FORMAT_LABELS} from '@/features/game/constants';
import {useAsyncState} from '@/hooks/useAsyncState';
import GamePlayerList from './GamePlayerList';
import GameRegistrationForm from './GameRegistrationForm';
import GameInviteSection from './GameInviteSection';

interface Props {
    game: GameDto;
    currentUsername: string;
    onChanged?: () => void;
}

export default function GameDetailsPanel({game, currentUsername, onChanged}: Props) {
    const [editingName, setEditingName] = useState(false);
    const [nameValue, setNameValue] = useState(game.name);
    const [ownerError, setOwnerError] = useState<string | null>(null);
    const nameInputRef = useRef<HTMLInputElement>(null);

    const fetchDetail = useCallback(() => gameApi.getGameDetail(game.id), [game.id]);
    const {data: detail, loading, refetch: refreshDetail} = useAsyncState<GameDetail>(fetchDetail);

    const fetchDecks = useCallback(() => deckApi.list(), []);
    const {data: myDecks} = useAsyncState(fetchDecks);

    const isOwner = game.owner === currentUsername;
    const myRegistration = detail?.registrations.find(r => r.username === currentUsername);
    const isInvited = detail?.invites.some(i => i.username === currentUsername) ?? false;
    const isFull = game.registrationCount >= game.maxPlayers;

    useEffect(() => {
        setNameValue(game.name);
        setEditingName(false);
    }, [game.id, game.name]);

    useEffect(() => {
        if (editingName) {
            nameInputRef.current?.focus();
            nameInputRef.current?.select();
        }
    }, [editingName]);

    const commitName = async () => {
        const trimmed = nameValue.trim() || game.name;
        setNameValue(trimmed);
        setEditingName(false);
        if (trimmed !== game.name) {
            try {
                await gameApi.updateGame(game.id, {name: trimmed});
                onChanged?.();
            } catch (e) {
                setOwnerError(e instanceof Error ? e.message : 'Failed to rename game');
            }
        }
    };

    const handleNameKey = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter')  { e.preventDefault(); commitName(); }
        if (e.key === 'Escape') { setNameValue(game.name); setEditingName(false); }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this game?')) return;
        try {
            await gameApi.deleteGame(game.id);
            onChanged?.();
        } catch (e) {
            setOwnerError(e instanceof Error ? e.message : 'Failed to delete game');
        }
    };

    const toggleVisibility = async () => {
        const visibility = game.visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC';
        try {
            await gameApi.updateGame(game.id, {visibility});
            onChanged?.();
        } catch (e) {
            setOwnerError(e instanceof Error ? e.message : 'Failed to change visibility');
        }
    };

    const titleSlot = editingName ? (
        <input
            ref={nameInputRef}
            value={nameValue}
            onChange={e => setNameValue(e.target.value)}
            onBlur={commitName}
            onKeyDown={handleNameKey}
            className="bg-transparent text-ink tracking-wide outline-none border-b border-line-accent w-full max-w-75"
        />
    ) : (
        <span
            onClick={() => isOwner && game.status === 'OPEN' && setEditingName(true)}
            className={`tracking-wide text-ink flex items-center gap-2 ${isOwner && game.status === 'OPEN' ? 'cursor-pointer group' : ''}`}
        >
            {game.visibility === 'PRIVATE' && <Lock className="w-3.5 h-3.5 text-ink-muted" />}
            {game.name}
            {isOwner && game.status === 'OPEN' && (
                <Pencil className="w-3 h-3 text-ink-muted opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
        </span>
    );

    return (
        <Panel
            title={titleSlot}
            right={
                <div className="flex items-center gap-2">
                    {isOwner && game.status === 'OPEN' && (
                        <div className="flex items-center gap-1 mr-2">
                            <Button variant="ghost" size="sm" onClick={toggleVisibility} title="Change Visibility">
                                {game.visibility === 'PUBLIC' ? <Lock className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
                            </Button>
                        </div>
                    )}
                    {isOwner && game.status === 'OPEN' && (
                        <Button variant="ghost" size="sm" onClick={handleDelete} className="text-blood-soft hover:text-blood">
                            Delete
                        </Button>
                    )}
                    {game.status === 'ACTIVE' && (
                        <Button variant="primary" size="sm">
                            Enter Game <ExternalLink className="ml-1.5 w-3 h-3" />
                        </Button>
                    )}
                </div>
            }
        >
            <div className="p-6 space-y-8 overflow-y-auto">
                {ownerError && (
                    <p className="text-sm text-blood bg-blood/5 border border-blood/20 rounded px-3 py-2" role="alert">
                        {ownerError}
                    </p>
                )}

                {/* Status & Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-panel-darker/30 rounded-lg p-4 border border-line/30">
                        <div className="text-[10px] text-ink-muted uppercase tracking-wider font-semibold mb-1">Status</div>
                        <div className="flex items-center gap-2 text-sm font-medium text-ink">
                            <div className={`w-2 h-2 rounded-full ${game.status === 'OPEN' ? 'bg-online' : 'bg-accent'}`} />
                            {game.status}
                        </div>
                    </div>
                    <div className="bg-panel-darker/30 rounded-lg p-4 border border-line/30">
                        <div className="text-[10px] text-ink-muted uppercase tracking-wider font-semibold mb-1">Format</div>
                        {isOwner && game.status === 'OPEN' ? (
                            <select
                                className="bg-transparent text-sm font-medium text-ink outline-none cursor-pointer hover:text-accent-soft"
                                value={game.format}
                                onChange={e => {
                                    gameApi.updateGame(game.id, {format: e.target.value as GameDto['format']})
                                        .then(() => onChanged?.())
                                        .catch(console.error);
                                }}
                            >
                                <option value="STANDARD">Standard</option>
                                <option value="DUEL">Duel</option>
                                <option value="V5">V5</option>
                            </select>
                        ) : (
                            <Badge variant="format">{FORMAT_LABELS[game.format]}</Badge>
                        )}
                    </div>
                    <div className="bg-panel-darker/30 rounded-lg p-4 border border-line/30 text-sm font-medium text-ink">
                        <div className="text-[10px] text-ink-muted uppercase tracking-wider font-semibold mb-1">Players</div>
                        {game.registrationCount} / {game.maxPlayers}
                    </div>
                </div>

                {/* Registration */}
                {game.status === 'OPEN' && (
                    <GameRegistrationForm
                        gameId={game.id}
                        myRegistration={myRegistration}
                        isInvited={isInvited}
                        isFull={isFull}
                        myDecks={myDecks ?? []}
                        onChanged={onChanged}
                        onDetailRefresh={refreshDetail}
                    />
                )}

                {/* Players */}
                <GamePlayerList
                    registrations={detail?.registrations ?? []}
                    invites={detail?.invites ?? []}
                    currentUsername={currentUsername}
                    gameOwner={game.owner}
                    loading={loading}
                />

                {/* Owner: Invite */}
                {isOwner && game.status === 'OPEN' && (
                    <GameInviteSection
                        gameId={game.id}
                        onDetailRefresh={refreshDetail}
                        onChanged={onChanged}
                    />
                )}

                {/* Active Game Placeholder */}
                {game.status === 'ACTIVE' && (
                    <div className="bg-panel-darker/50 border border-line/30 rounded-lg p-8 flex flex-col items-center justify-center text-center">
                        <Info className="w-8 h-8 text-ink-muted mb-3" />
                        <h4 className="text-sm font-medium text-ink mb-1">Game in Progress</h4>
                        <p className="text-xs text-ink-muted max-w-xs">
                            This game is currently active. Real-time details like life totals and current turn will be available here soon.
                        </p>
                    </div>
                )}
            </div>
        </Panel>
    );
}
