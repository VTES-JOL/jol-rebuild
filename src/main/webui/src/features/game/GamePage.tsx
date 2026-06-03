import type {CSSProperties} from 'react';
import {createPortal} from 'react-dom';
import {useCallback, useEffect, useRef, useState} from 'react';
import {useAuthContext} from '@/contexts/AuthContext.tsx';
import {useParams} from 'react-router-dom';
import {useGameChannel} from '@/hooks/useGameChannel.ts';
import {PlayerBoard} from './PlayerBoard.tsx';
import {CircularBoard} from './CircularBoard.tsx';
import {TextBoard} from './TextBoard.tsx';
import {CardContextMenu} from './CardContextMenu.tsx';
import {HandTray} from './HandTray.tsx';
import type {CardData, GameState, PlayerState} from './types.ts';
import type {CardRef, GameCommand} from './gameCommands.ts';
import {oustPlayer} from './gameCommands.ts';
import {regionToStacks} from './gameUtils.tsx';
import GameLayout from "@/shared/layout/GameLayout.tsx";
import type {BoardLayout} from './GameStatusBar.tsx';
import {CommandErrorBanner, ConnectionBanner, GameStatusBar} from './GameStatusBar.tsx';


function ZeroPoolOustModal({
    playerName,
    gameId,
    onConfirm,
    onDismiss,
}: {
    playerName: string;
    gameId: string;
    onConfirm: (cmd: GameCommand) => void;
    onDismiss: () => void;
}) {
    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={onDismiss}
        >
            <div
                className="bg-surface border border-line/60 rounded-xl shadow-2xl w-full max-w-xs mx-4 overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-4 py-3 border-b border-line/40">
                    <span className="text-sm font-semibold text-ink">Oust {playerName}?</span>
                    <button
                        className="text-ink-muted hover:text-ink transition-colors leading-none"
                        onClick={onDismiss}
                        aria-label="Close"
                    >✕</button>
                </div>
                <div className="px-4 py-4 space-y-4">
                    <p className="text-xs text-ink-muted">
                        <span className="font-semibold text-blood">{playerName}</span>'s pool has reached 0.
                        Their predator gains <span className="text-online font-semibold">+6 pool</span> and{' '}
                        <span className="text-gold font-semibold">+1 VP</span>.
                    </p>
                    <div className="flex gap-2 justify-end">
                        <button
                            className="text-xs px-3 py-1.5 rounded border border-line/40 text-ink-muted hover:text-ink transition-colors"
                            onClick={onDismiss}
                        >
                            Dismiss
                        </button>
                        <button
                            className="text-xs px-3 py-1.5 rounded bg-blood/20 border border-blood/40 text-blood hover:bg-blood/30 transition-colors font-medium"
                            onClick={() => { onConfirm(oustPlayer(gameId, playerName)); onDismiss(); }}
                        >
                            Confirm Oust
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

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
            transfersRemaining={gameState.transfersRemaining}
            phase={gameState.phase}
            isCurrentPlayer={gameState.currentPlayer === currentUser}
            impulseHolder={gameState.impulseWindow?.active ? gameState.impulseWindow.currentImpulseHolder : null}
            rulesEnforced={gameState.rulesEnforced ?? false}
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

    const {gameState, status, sendCommand, commandError, clearCommandError} = useGameChannel({
        url: wsUrl,
        username: user?.username ?? '',
    });

    const orderedPlayers: PlayerState[] = gameState
        ? (gameState.playerOrder
            .map(name => gameState.players.find(p => p.name === name))
            .filter((p): p is PlayerState => !!p && !p.ousted))
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

    // Track previous pool values to detect transitions to 0.
    // Players whose pool hits 0 via SetPool/TransferBlood (not OustPlayer) get queued for oust confirmation.
    const prevPoolsRef = useRef<Map<string, number>>(new Map());
    // Track OustPlayer commands that were explicitly sent so we don't double-trigger.
    const pendingOustRef = useRef<Set<string>>(new Set());
    const [zeroPoolQueue, setZeroPoolQueue] = useState<string[]>([]);
    const currentUser = user?.username ?? '';
    const isSpectator = gameState ? !gameState.players.some(p => p.name === currentUser) : true;

    useEffect(() => {
        if (!gameState) return;
        const prev = prevPoolsRef.current;
        const newOusts: string[] = [];
        for (const player of gameState.players) {
            const prevPool = prev.get(player.name);
            if (prevPool !== undefined && prevPool > 0 && player.pool <= 0) {
                if (!pendingOustRef.current.has(player.name)) {
                    newOusts.push(player.name);
                }
                pendingOustRef.current.delete(player.name);
            }
            prev.set(player.name, player.pool);
        }
        if (newOusts.length > 0) {
            setZeroPoolQueue(q => [...q, ...newOusts]);
        }
    }, [gameState]);

    const handleCommand = useCallback((cmd: GameCommand) => {
        if (isSpectator) return;
        clearCommandError();
        if (cmd.type === 'OUST_PLAYER') {
            pendingOustRef.current.add(cmd.playerName);
        }
        sendCommand(cmd);
    }, [isSpectator, sendCommand, clearCommandError]);

    const [contextMenu, setContextMenu] = useState<{ref: CardRef; x: number; y: number} | null>(null);

    const handleCardContextMenu = useCallback((_card: CardData, ref: CardRef, x: number, y: number) => {
        if (isSpectator) return;
        setContextMenu({ref, x, y});
    }, [isSpectator]);

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

    const dismissZeroPool = useCallback(() => {
        setZeroPoolQueue(q => q.slice(1));
    }, []);

    return (
        <GameLayout>
            <GameContextMenuOverlay
                contextMenu={contextMenu}
                gameState={gameState}
                gameId={gameId}
                currentUser={currentUser}
                onCommand={handleCommand}
                onClose={() => setContextMenu(null)}
            />
            {zeroPoolQueue.length > 0 && (
                <ZeroPoolOustModal
                    playerName={zeroPoolQueue[0]}
                    gameId={gameId}
                    onConfirm={handleCommand}
                    onDismiss={dismissZeroPool}
                />
            )}
            <div className="flex flex-col h-full min-h-0 px-4 pb-4">
                <div className="flex-1 min-w-0 min-h-0 flex flex-col">

                    <GameStatusBar
                        gameState={gameState}
                        gameId={gameId}
                        currentUser={currentUser}
                        boardLayout={boardLayout}
                        onLayoutChange={setBoardLayout}
                        onCommand={handleCommand}
                        isSpectator={isSpectator}
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
                                currentUser={currentUser}
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
                                currentUser={currentUser}
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
                                            isCurrentPlayer={player.name === currentUser}
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

                    {/* Hand tray — below board (text layout uses TextHandPanel instead) */}
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
            </div>
        </GameLayout>
    );
}
