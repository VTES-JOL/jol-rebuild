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
import type {CardData, GameState, PlayerState} from './types.ts';
import type {CardRef, GameCommand} from './gameCommands.ts';
import {regionToStacks} from './gameUtils.tsx';
import GameLayout from "@/shared/layout/GameLayout.tsx";
import type {BoardLayout} from './GameStatusBar.tsx';
import {CommandErrorBanner, ConnectionBanner, GameStatusBar} from './GameStatusBar.tsx';


type GameContextMenuOverlayProps = {
    contextMenu: {ref: CardRef; x: number; y: number} | null;
    gameState: GameState | null;
    gameId: string;
    currentUser: string;
    onCommand: (cmd: GameCommand) => void;
    onClose: () => void;
};

function GameContextMenuOverlay({contextMenu, gameState, gameId, currentUser, onCommand, onClose}: GameContextMenuOverlayProps) {
    if (!contextMenu || !gameState) return null;
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
            currentUser={currentUser}
            playerPool={player.pool}
            position={{x: contextMenu.x, y: contextMenu.y}}
            onCommand={onCommand}
            onClose={onClose}
        />
    );
}


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
    const [layoutReady, setLayoutReady] = useState(false);
    const layoutInitialized = useRef(false);
    useEffect(() => {
        if (layoutInitialized.current || loading) return;
        layoutInitialized.current = true;
        if (user) {
            const pref = user.defaultBoard;
            if (pref === 'linear' || pref === 'circular' || pref === 'text') {
                setBoardLayout(pref);
            }
        }
        setLayoutReady(true);
    }, [user, loading]);

    const isConnected = status === 'connected';
    const currentUserHand = user && gameState
        ? gameState.players.find(p => p.name === user.username)?.regions['HAND'] ?? null
        : null;

    return (
        <GameLayout>
            <GameContextMenuOverlay
                contextMenu={contextMenu}
                gameState={gameState}
                gameId={gameId}
                currentUser={user?.username ?? ''}
                onCommand={handleCommand}
                onClose={() => setContextMenu(null)}
            />
            <div className="flex flex-col lg:flex-row gap-4 h-full min-h-0 px-4 pb-4">
                {/* Board — full width on ≤md, left 3/4 on lg+ */}
                <div className="flex-1 lg:flex-3 min-w-0 min-h-0 flex flex-col">

                    <GameStatusBar
                        gameState={gameState}
                        boardLayout={boardLayout}
                        onLayoutChange={setBoardLayout}
                    />

                    {!isConnected && <ConnectionBanner status={status} />}

                    {commandError && (
                        <CommandErrorBanner error={commandError} onDismiss={clearCommandError} />
                    )}

                    {!layoutReady ? (
                        <div className="flex items-center justify-center h-32 text-ink-muted text-sm">
                            Loading…
                        </div>
                    ) : boardLayout === 'circular' && gameState ? (
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
                    {boardLayout !== 'text' && currentUserHand && gameState && user && (
                        <HandTray
                            playerName={user.username}
                            hand={currentUserHand}
                            cards={gameState.cards}
                            gameId={gameId}
                            onCommand={handleCommand}
                            onCardContextMenu={handleCardContextMenu}
                        />
                    )}
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
                            enableCommandLogFilter={true}
                            placeholder="Chat with your opponents…"
                        />
                    </div>
                )}
            </div>
        </GameLayout>
    );
}
