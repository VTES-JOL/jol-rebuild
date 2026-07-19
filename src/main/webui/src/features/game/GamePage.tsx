import {useCallback, useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {useAuthContext} from '@/contexts/AuthContext.tsx';
import {useParams} from 'react-router-dom';
import {useGameChannel} from '@/hooks/useGameChannel.ts';
import {TextBoard} from './TextBoard.tsx';
import {CardContextMenu} from './CardContextMenu.tsx';
import {Dock} from './Dock.tsx';
import gameApi from './api.ts';
import {unreadTalkCount} from './chatUnread.ts';
import type {SinceDigest} from './sinceDigest.ts';
import {compileDigest} from './sinceDigest.ts';
import {useLastRead} from './useLastRead.ts';
import type {CardData, GameState, PlayerState} from './types.ts';
import type {CardRef, GameCommand} from './gameCommands.ts';
import {oustPlayer} from './gameCommands.ts';
import {regionToStacks} from './gameUtils.tsx';
import GameLayout from "@/shared/layout/GameLayout.tsx";
import type {BoardLayout} from './GameStatusBar.tsx';
import {CommandErrorBanner, ConnectionBanner, GameStatusBar} from './GameStatusBar.tsx';
import {NowPanel} from './NowPanel.tsx';
import {RingStrip} from './RingStrip.tsx';
import {GameChatRail} from './GameChatRail.tsx';
import {StageBoard} from './StageBoard.tsx';
import {useCardScale} from './useCardScale.ts';
import {useCardTravel} from './useCardTravel.ts';


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

    const {gameState, status, sendCommand, commandError, clearCommandError, messages, send, react} = useGameChannel({
        url: wsUrl,
        username: user?.username ?? '',
    });

    const orderedPlayers: PlayerState[] = gameState
        ? (gameState.playerOrder
            .map(name => gameState.players.find(p => p.name === name))
            .filter((p): p is PlayerState => !!p && !p.ousted))
        : [];

    // Card travel: FLIP-animate any card that changes position between state
    // broadcasts, across every layout that renders inside the board wrapper.
    const boardRootRef = useRef<HTMLDivElement>(null);
    useCardTravel(boardRootRef);

    // Ring strip chip tap: focus the player on the circular board, or scroll
    // their section into view on the linear/text boards.
    const [circularFocus, setCircularFocus] = useState<{name: string; seq: number} | null>(null);
    const handleFocusPlayer = useCallback((name: string) => {
        setCircularFocus(prev => ({name, seq: (prev?.seq ?? 0) + 1}));
        const section = document.querySelector(`[data-player-section="${CSS.escape(name)}"]`);
        section?.scrollIntoView({
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
            block: 'start',
            inline: 'nearest',
        });
    }, []);

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

    const [boardLayout, setBoardLayout] = useState<BoardLayout>('stage');
    const [cardScale, setCardScale] = useCardScale();
    const [chatOpen, setChatOpen] = useState(false);

    // "Since you left": one effect-log slice fetch per visit, anchored on the
    // last-read marker frozen at mount, compiled client-side into the digest.
    const {initialLastRead, readLastRead} = useLastRead(gameId);
    const [digest, setDigest] = useState<SinceDigest | null>(null);
    const digestFetched = useRef(false);
    useEffect(() => {
        if (digestFetched.current || !initialLastRead || !user) return;
        digestFetched.current = true;
        gameApi.getMessagesSince(gameId, initialLastRead)
            .then(slice => setDigest(compileDigest(slice, user.username)))
            .catch(() => setDigest(null)); // the digest is a nicety — never block the board on it
    }, [gameId, initialLastRead, user]);
    const [layoutReady, setLayoutReady] = useState(false);
    const layoutInitialized = useRef(false);
    useEffect(() => {
        if (layoutInitialized.current || loading) return;
        layoutInitialized.current = true;
        if (user) {
            const pref = user.defaultBoard;
            // Retired Strip/Table preferences fold into the Stage.
            if (pref === 'text') {
                setBoardLayout('text');
            } else if (pref != null) {
                setBoardLayout('stage');
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
            <div className="flex h-full min-h-0 gap-3 px-4 pb-4">
                <div ref={boardRootRef} className="flex-1 min-w-0 min-h-0 flex flex-col">

                    <GameStatusBar
                        gameState={gameState}
                        gameId={gameId}
                        currentUser={currentUser}
                        boardLayout={boardLayout}
                        onLayoutChange={setBoardLayout}
                        onCommand={handleCommand}
                        isSpectator={isSpectator}
                        cardScale={cardScale}
                        onCardScaleChange={setCardScale}
                    />

                    {gameState && (
                        <RingStrip
                            gameState={gameState}
                            currentUser={currentUser}
                            onFocusPlayer={handleFocusPlayer}
                        />
                    )}

                    {gameState && (
                        <NowPanel
                            gameState={gameState}
                            gameId={gameId}
                            currentUser={currentUser}
                            onCommand={handleCommand}
                            isSpectator={isSpectator}
                            digest={digest}
                        />
                    )}

                    {!isConnected && <ConnectionBanner status={status} />}

                    {commandError && (
                        <CommandErrorBanner error={commandError} onDismiss={clearCommandError} />
                    )}

                    {!layoutReady ? (
                        <div className="flex items-center justify-center h-32 text-ink-muted text-sm">
                            Loading…
                        </div>
                    ) : boardLayout === 'stage' && gameState ? (
                        <div className="flex-1 min-h-0 overflow-hidden">
                            <StageBoard
                                orderedPlayers={orderedPlayers}
                                cards={gameState.cards}
                                currentUser={currentUser}
                                gameState={gameState}
                                gameId={gameId}
                                onCommand={handleCommand}
                                onCardContextMenu={handleCardContextMenu}
                                focusRequest={circularFocus}
                                cardScale={cardScale}
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
                        <div className="flex items-center justify-center h-32 text-ink-muted text-sm">
                            {loading ? 'Loading…' : 'Waiting for game state…'}
                        </div>
                    )}

                    {/* Dock — hand + mobile tab bar below the board (text layout uses TextHandPanel instead) */}
                    {boardLayout !== 'text' && gameState && user && (
                        <Dock
                            playerName={user.username}
                            hand={currentUserHand}
                            cards={gameState.cards}
                            gameState={gameState}
                            gameId={gameId}
                            currentUser={currentUser}
                            onCommand={handleCommand}
                            onCardContextMenu={handleCardContextMenu}
                            onOpenChat={() => setChatOpen(true)}
                            chatUnread={unreadTalkCount(messages, readLastRead(), user.username)}
                        />
                    )}
                </div>

                {user && (
                    <GameChatRail
                        gameId={gameId}
                        messages={messages}
                        status={status}
                        currentUser={user.username}
                        onSend={send}
                        onReact={react}
                        drawerOpen={chatOpen}
                        onDrawerOpenChange={setChatOpen}
                    />
                )}
            </div>
        </GameLayout>
    );
}
