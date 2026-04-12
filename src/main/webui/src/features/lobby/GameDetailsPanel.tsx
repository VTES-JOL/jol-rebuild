import {useEffect, useRef, useState} from 'react';
import {Users, Shield, Info, ExternalLink, Pencil, Lock, Globe} from 'lucide-react';
import Panel from '@/shared/components/Panel';
import Button from '@/shared/components/Button';
import Badge from '@/shared/components/Badge';
import gameApi, {type GameDetail, type GameDto} from '@/features/game/api';
import deckApi from '@/features/deck/api';
import type {Deck} from '@/features/deck/types';

interface Props {
    game: GameDto;
    currentUsername: string;
    onChanged?: () => void;
}

const FORMAT_LABELS: Record<string, string> = {STANDARD: 'Standard', DUEL: 'Duel', V5: 'V5'};

export default function GameDetailsPanel({game, currentUsername, onChanged}: Props) {
    const [detail, setDetail] = useState<GameDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [myDecks, setMyDecks] = useState<Deck[]>([]);
    const [selectedDeckId, setSelectedDeckId] = useState<number | string>('');
    const [editingName, setEditingName] = useState(false);
    const [nameValue, setNameValue] = useState(game.name);
    const nameInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setLoading(true);
        gameApi.getGameDetail(game.id)
            .then(setDetail)
            .catch(console.error)
            .finally(() => setLoading(false));
            
        deckApi.list().then(setMyDecks).catch(console.error);
        setNameValue(game.name);
        setEditingName(false);
    }, [game.id, game.name]);

    useEffect(() => {
        if (editingName) {
            nameInputRef.current?.focus();
            nameInputRef.current?.select();
        }
    }, [editingName]);

    const isOwner = game.owner === currentUsername;
    const myRegistration = detail?.registrations.find(r => r.username === currentUsername);
    const isRegistered = !!myRegistration;
    const isInvited = detail?.invites.some(i => i.username === currentUsername);
    const isFull = game.registrationCount >= game.maxPlayers;

    const handleRegister = async () => {
        if (!selectedDeckId) return;
        try {
            await gameApi.registerForGame(game.id, Number(selectedDeckId));
            onChanged?.();
            const updated = await gameApi.getGameDetail(game.id);
            setDetail(updated);
        } catch (e) {
            console.error('Failed to register', e);
        }
    };

    const handleLeave = async () => {
        try {
            await gameApi.leaveGame(game.id);
            onChanged?.();
            const updated = await gameApi.getGameDetail(game.id);
            setDetail(updated);
        } catch (e) {
            console.error('Failed to leave', e);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this game?')) return;
        try {
            await gameApi.deleteGame(game.id);
            onChanged?.();
        } catch (e) {
            console.error('Failed to delete game', e);
        }
    };

    const commitName = async () => {
        const trimmed = nameValue.trim() || game.name;
        setNameValue(trimmed);
        setEditingName(false);
        if (trimmed !== game.name) {
            try {
                await gameApi.updateGame(game.id, { name: trimmed });
                onChanged?.();
            } catch (e) {
                console.error('Failed to rename game', e);
            }
        }
    };

    const handleNameKey = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter')  { e.preventDefault(); commitName(); }
        if (e.key === 'Escape') { setNameValue(game.name); setEditingName(false); }
    };

    const titleSlot = editingName ? (
        <input
            ref={nameInputRef}
            value={nameValue}
            onChange={e => setNameValue(e.target.value)}
            onBlur={commitName}
            onKeyDown={handleNameKey}
            className="bg-transparent text-ink tracking-wide outline-none border-b border-line-accent w-full max-w-[300px]"
        />
    ) : (
        <span
            onClick={() => isOwner && game.status === 'OPEN' && setEditingName(true)}
            className={`tracking-wide text-ink flex items-center gap-2 ${isOwner && game.status === 'OPEN' ? 'cursor-pointer group' : ''}`}
        >
            {game.visibility === 'PRIVATE' && <Lock className="w-3.5 h-3.5 text-ink-muted" />}
            {game.name}
            {isOwner && game.status === 'OPEN' && <Pencil className="w-3 h-3 text-ink-muted opacity-0 group-hover:opacity-100 transition-opacity" />}
        </span>
    );

    const toggleVisibility = async () => {
        const visibility = game.visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC';
        try {
            await gameApi.updateGame(game.id, { visibility });
            onChanged?.();
        } catch (e) {
            console.error('Failed to change visibility', e);
        }
    };

    const handleInvite = () => {
        const username = prompt('Enter username to invite:');
        if (!username) return;
        gameApi.invitePlayer(game.id, username)
            .then(() => {
                alert(`Invited ${username}`);
                onChanged?.();
            })
            .catch(e => {
                console.error('Failed to invite player', e);
                alert(`Failed to invite player: ${e.message}`);
            });
    };

    return (
        <Panel
            title={titleSlot}
            right={
                <div className="flex items-center gap-2">
                    {isOwner && game.status === 'OPEN' && (
                        <div className="flex items-center gap-1 mr-2">
                            <Button variant="ghost" size="sm" onClick={handleInvite} title="Invite Player">
                                Invite
                            </Button>
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
                {/* Status & Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-panel-darker/30 rounded-lg p-4 border border-line/30">
                        <div className="text-[10px] text-ink-muted uppercase tracking-wider font-semibold mb-1">Status</div>
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${game.status === 'OPEN' ? 'bg-online' : 'bg-accent'}`} />
                            <span className="text-sm font-medium text-ink">{game.status}</span>
                        </div>
                    </div>
                    <div className="bg-panel-darker/30 rounded-lg p-4 border border-line/30">
                        <div className="text-[10px] text-ink-muted uppercase tracking-wider font-semibold mb-1">Format</div>
                        {isOwner && game.status === 'OPEN' ? (
                            <select
                                className="bg-transparent text-sm font-medium text-ink outline-none cursor-pointer hover:text-accent-soft"
                                value={game.format}
                                onChange={e => {
                                    gameApi.updateGame(game.id, { format: e.target.value as any })
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
                    <div className="bg-panel-darker/30 rounded-lg p-4 border border-line/30">
                        <div className="text-[10px] text-ink-muted uppercase tracking-wider font-semibold mb-1">Players</div>
                        <div className="text-sm font-medium text-ink">
                            {game.registrationCount} / {game.maxPlayers}
                        </div>
                    </div>
                </div>

                {/* Registration / Actions */}
                {game.status === 'OPEN' && (
                    <div className="bg-accent/5 border border-accent/20 rounded-lg p-6">
                        <h3 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-accent-soft" />
                            {isRegistered ? 'Your Registration' : 'Join Game'}
                        </h3>
                        
                        {isRegistered ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-xs text-ink-muted">Registered deck:</div>
                                        <div className="text-sm font-medium text-accent-soft">{myRegistration.deckName || 'No deck selected'}</div>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={handleLeave}>Leave Game</Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-xs text-ink-soft leading-relaxed">
                                    {isInvited 
                                        ? "You've been invited to this game. Select a deck to join."
                                        : "This is an open game. You can join by selecting one of your decks."}
                                </p>
                                <div className="flex gap-2">
                                    <select
                                        className="flex-1 bg-panel border border-line rounded px-3 py-1.5 text-sm text-ink outline-none focus:border-accent"
                                        value={selectedDeckId}
                                        onChange={e => setSelectedDeckId(e.target.value)}
                                    >
                                        <option value="">Select a deck…</option>
                                        {myDecks.map(d => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </select>
                                    <Button
                                        variant="secondary"
                                        disabled={!selectedDeckId || isFull}
                                        onClick={handleRegister}
                                    >
                                        Join
                                    </Button>
                                </div>
                                {isFull && !isRegistered && (
                                    <p className="text-[10px] text-blood-soft font-medium">This game is currently full.</p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Players List */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-ink flex items-center gap-2 px-1">
                        <Users className="w-4 h-4 text-ink-muted" />
                        Registered Players
                    </h3>
                    <div className="border border-line/40 rounded-lg divide-y divide-line/40">
                        {loading ? (
                           <div className="p-4 text-center text-xs text-ink-muted italic">Loading players…</div>
                        ) : detail?.registrations.length === 0 ? (
                            <div className="p-4 text-center text-xs text-ink-muted italic">No players registered yet.</div>
                        ) : (
                            detail?.registrations.map(r => (
                                <div key={r.username} className="flex items-center justify-between p-3">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-sm ${r.username === currentUsername ? 'font-bold text-accent-soft' : 'text-ink'}`}>
                                            {r.username}
                                            {r.username === game.owner && <span className="ml-1.5 text-[10px] text-gold font-normal">(host)</span>}
                                        </span>
                                    </div>
                                    <span className="text-xs text-ink-muted italic">{r.deckName || '---'}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                
                {/* Active Game Preview placeholder */}
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
