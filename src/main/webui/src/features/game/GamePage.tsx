import type {CSSProperties} from 'react';
import {useCallback, useEffect, useRef, useState} from 'react';
import {useAuthContext} from '@/contexts/AuthContext.tsx';
import {useParams} from 'react-router-dom';
import {useGameChannel} from '@/hooks/useGameChannel.ts';
import {PlayerBoard} from './PlayerBoard.tsx';
import {CircularBoard} from './CircularBoard.tsx';
import {TextBoard} from './TextBoard.tsx';
import {ChatPanel} from '@/features/chat/ChatPanel.tsx';
import {CardContextMenu} from './CardContextMenu.tsx';
import {HandTray} from './HandTray.tsx';
import type {CardData, PlayerState} from './types.ts';
import type {CardRef, GameCommand} from './gameCommands.ts';
import {regionToStacks} from './gameUtils.tsx';
import GameLayout from "@/shared/layout/GameLayout.tsx";


type BoardLayout = 'linear' | 'circular' | 'text';

const LAYOUT_LABELS: Record<BoardLayout, string> = {
    linear: 'Strip',
    circular: 'Table',
    text: 'Text',
};

export default function GamePage() {
    const {user, loading} = useAuthContext();
    const {gameId} = useParams();
    if (!gameId) throw new Error('Missing Game ID');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = !loading && user
        ? `${protocol}//${window.location.host}/ws/game/${encodeURIComponent(gameId)}`
        : null;

    const {messages, gameState, status, send, react, sendCommand, commandError, clearCommandError} = useGameChannel({
        url: wsUrl,
        username: user?.username ?? '',
    });

    const orderedPlayers: PlayerState[] = gameState
        ? (gameState.playerOrder
            .map(name => gameState.players.find(p => p.name === name))
            .filter(Boolean) as PlayerState[])
        : [];

    const prevCardIdsRef = useRef<Set<string>>(new Set());
    useEffect(() => {
        if (!gameState) return;
        const prev = prevCardIdsRef.current;
        const next = new Set<string>();
        for (const card of Object.values(gameState.cards)) {
            if (card.cardId) {
                next.add(card.cardId);
                if (!prev.has(card.cardId)) {
                    const img = new Image();
                    img.src = `https://static.deckserver.net/images/${card.cardId}`;
                }
            }
        }
        prevCardIdsRef.current = next;
    }, [gameState?.cards]);

    const handleCommand = useCallback((cmd: GameCommand) => {
        clearCommandError();
        sendCommand(cmd);
    }, [sendCommand, clearCommandError]);

    const [contextMenu, setContextMenu] = useState<{ref: CardRef; x: number; y: number} | null>(null);

    const handleCardContextMenu = useCallback((_card: CardData, ref: CardRef, x: number, y: number) => {
        setContextMenu({ref, x, y});
    }, []);

    const [boardLayout, setBoardLayout] = useState<BoardLayout>('linear');
    const layoutInitialized = useRef(false);
    useEffect(() => {
        if (!layoutInitialized.current && user) {
            layoutInitialized.current = true;
            const pref = user.defaultBoard;
            if (pref === 'linear' || pref === 'circular' || pref === 'text') {
                setBoardLayout(pref);
            }
        }
    }, [user]);

    const isConnected = status === 'connected';

    return (
        <GameLayout>
            {contextMenu && gameState && (() => {
                const {ref} = contextMenu;
                const player = gameState.players.find(p => p.name === ref.playerName);
                if (!player) return null;
                const region = player.regions[ref.regionType];
                if (!region) return null;
                const stacks = regionToStacks(region, gameState.cards);
                const stack = stacks[ref.position];
                if (!stack) return null;
                const liveCard = ref.childIndex === -1 ? stack[0] : stack[ref.childIndex + 1];
                if (!liveCard) return null;
                return (
                    <CardContextMenu
                        card={liveCard}
                        cardRef={ref}
                        gameId={gameId}
                        currentUser={user?.username ?? ''}
                        playerPool={player.pool}
                        position={{x: contextMenu.x, y: contextMenu.y}}
                        onCommand={handleCommand}
                        onClose={() => setContextMenu(null)}
                    />
                );
            })()}
            <div className="flex flex-col lg:flex-row gap-4 h-full min-h-0 px-4 pb-4">
                {/* Board — full width on ≤md, left 3/4 on lg+ */}
                <div className="flex-1 lg:flex-3 min-w-0 min-h-0 flex flex-col">

                    {/* Top bar: turn/phase info + layout selector */}
                    <div className="flex items-center justify-between pb-2 shrink-0 gap-2 min-w-0">
                        <div className="flex items-center gap-2 text-xs min-w-0 overflow-hidden">
                            {gameState && (
                                <>
                                    <span className="text-ink-muted">Turn {gameState.turn}</span>
                                    <span className="text-ink-muted/40">·</span>
                                    <span className="text-ink-muted">{gameState.phase}</span>
                                    {gameState.currentPlayer && (
                                        <>
                                            <span className="text-ink-muted/40">·</span>
                                            <span className="text-ink font-medium truncate">▶ {gameState.currentPlayer}</span>
                                        </>
                                    )}
                                    {gameState.edgeHolder && (
                                        <>
                                            <span className="text-ink-muted/40">·</span>
                                            <span className="text-ink-muted truncate">Edge: {gameState.edgeHolder}</span>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                        <div className="flex items-center gap-0.5 rounded border border-line/50 p-0.5 shrink-0">
                            {(['linear', 'circular', 'text'] as const).map(l => (
                                <button
                                    key={l}
                                    className={[
                                        'text-xs px-2 py-0.5 rounded transition-colors',
                                        boardLayout === l
                                            ? 'bg-arcane/20 text-ink'
                                            : 'text-ink-muted hover:text-ink',
                                    ].join(' ')}
                                    onClick={() => setBoardLayout(l)}
                                >
                                    {LAYOUT_LABELS[l]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Connection status banner */}
                    {!isConnected && (
                        <div className="shrink-0 mb-1.5 flex items-center gap-2 rounded border border-gold/30 bg-gold/5 px-3 py-1.5 text-xs text-gold">
                            <span className="animate-pulse">●</span>
                            <span>{status === 'connecting' ? 'Connecting…' : 'Connection lost — reconnecting…'}</span>
                        </div>
                    )}

                    {/* Command error banner */}
                    {commandError && (
                        <div className="shrink-0 mb-1.5 flex items-center gap-2 rounded border border-blood/30 bg-blood/5 px-3 py-1.5 text-xs text-blood">
                            <span className="flex-1">{commandError}</span>
                            <button
                                className="text-blood/60 hover:text-blood transition-colors leading-none"
                                onClick={clearCommandError}
                                aria-label="Dismiss"
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    {boardLayout === 'circular' && gameState ? (
                        <div className="flex-1 min-h-0 overflow-hidden">
                            <CircularBoard
                                orderedPlayers={orderedPlayers}
                                cards={gameState.cards}
                                currentUser={user?.username ?? ''}
                                gameState={gameState}
                                gameId={gameId}
                                onCommand={handleCommand}
                                onCardContextMenu={handleCardContextMenu}
                            />
                        </div>
                    ) : boardLayout === 'text' && gameState ? (
                        <div className="flex-1 min-h-0 overflow-hidden">
                            <TextBoard
                                orderedPlayers={orderedPlayers}
                                cards={gameState.cards}
                                currentUser={user?.username ?? ''}
                                gameId={gameId}
                                onCommand={handleCommand}
                                onCardContextMenu={handleCardContextMenu}
                            />
                        </div>
                    ) : (
                        <div className="flex-1 min-h-0 overflow-y-auto">
                            {gameState ? (
                                <div
                                    className="flex flex-col gap-1.5"
                                    style={{'--card-w': 'clamp(90px, 8.25vw, 108px)'} as CSSProperties}
                                >
                                    {orderedPlayers.map(player => (
                                        <PlayerBoard
                                            key={player.name}
                                            player={player}
                                            cards={gameState.cards}
                                            isCurrentPlayer={player.name === user?.username}
                                            gameId={gameId}
                                            onCommand={handleCommand}
                                            onCardContextMenu={handleCardContextMenu}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-32 text-ink-muted text-sm">
                                    {loading ? 'Loading…' : 'Waiting for game state…'}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Hand tray — below board on lg+, above chat on mobile (text layout uses TextHandPanel instead) */}
                    {boardLayout !== 'text' && user && gameState && (() => {
                        const hand = gameState.players.find(p => p.name === user.username)?.regions['HAND'];
                        if (!hand) return null;
                        return (
                            <HandTray
                                playerName={user.username}
                                hand={hand}
                                cards={gameState.cards}
                                gameId={gameId}
                                onCommand={handleCommand}
                                onCardContextMenu={handleCardContextMenu}
                            />
                        );
                    })()}
                </div>

                {/* Chat — fixed height at bottom on ≤md, right 1/4 on lg+ */}
                {user && (
                    <div className="h-60 shrink-0 lg:h-auto lg:flex-1 min-w-0 min-h-0">
                        <ChatPanel
                            title="Game chat"
                            messages={messages}
                            status={status}
                            currentUser={user.username}
                            onSend={send}
                            onReact={react}
                            enableReactions={false}
                            enableReply={false}
                            enableAvatars={false}
                            enableDivider={false}
                            placeholder="Chat with your opponents…"
                        />
                    </div>
                )}
            </div>
        </GameLayout>
    );
}
