import type {CSSProperties} from 'react';
import {useCallback, useState} from 'react';
import {useAuthContext} from '@/contexts/AuthContext.tsx';
import {useParams} from 'react-router-dom';
import {useGameChannel} from '@/hooks/useGameChannel.ts';
import {PlayerBoard} from './PlayerBoard.tsx';
import {CircularBoard} from './CircularBoard.tsx';
import {TextBoard} from './TextBoard.tsx';
import {ChatPanel} from '@/features/chat/ChatPanel.tsx';
import type {PlayerState, RegionType} from './types.ts';
import {attachCard, moveCard} from './gameCommands.ts';
import type {GameCommand} from './gameCommands.ts';
import GameLayout from "@/shared/layout/GameLayout.tsx";

export default function GamePage() {
    const {user, loading} = useAuthContext();
    const {gameId} = useParams();
    if (!gameId) throw new Error('Missing Game ID');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = !loading && user
        ? `${protocol}//${window.location.host}/ws/game/${encodeURIComponent(gameId)}`
        : null;

    const {messages, gameState, status, send, react, sendCommand} = useGameChannel({
        url: wsUrl,
        username: user?.username ?? '',
    });

    const orderedPlayers: PlayerState[] = gameState
        ? (gameState.playerOrder
            .map(name => gameState.players.find(p => p.name === name))
            .filter(Boolean) as PlayerState[])
        : [];

    const handleCardMove = useCallback((playerName: string, cardId: string, _from: RegionType, toRegionType: RegionType) => {
        if (!gameState) return;
        const player = gameState.players.find(p => p.name === playerName);
        const toRegion = player?.regions[toRegionType];
        if (!toRegion) return;
        sendCommand(moveCard(gameId, cardId, toRegion.id));
    }, [gameId, gameState, sendCommand]);

    const handleCardReorder = useCallback((playerName: string, regionType: RegionType, cardId: string, toIndex: number) => {
        if (!gameState) return;
        const player = gameState.players.find(p => p.name === playerName);
        const region = player?.regions[regionType];
        if (!region) return;
        sendCommand(moveCard(gameId, cardId, region.id, toIndex));
    }, [gameId, gameState, sendCommand]);

    const handleCardAttach = useCallback((_playerName: string, cardId: string, targetCardId: string) => {
        sendCommand(attachCard(gameId, cardId, targetCardId));
    }, [gameId, sendCommand]);

    const handleCommand = useCallback((cmd: GameCommand) => {
        sendCommand(cmd);
    }, [sendCommand]);

    const [boardLayout, setBoardLayout] = useState<'linear' | 'circular' | 'text'>('linear');

    const NEXT_LAYOUT = {linear: 'circular', circular: 'text', text: 'linear'} as const;
    const NEXT_LABEL  = {linear: 'Table view', circular: 'Text view', text: 'Strip view'};

    return (
        <GameLayout>
            <div className="flex flex-col lg:flex-row gap-4 h-full min-h-0 px-4 pb-4">
                {/* Board — full width on ≤md, left 3/4 on lg+ */}
                <div className="flex-1 lg:flex-3 min-w-0 min-h-0 flex flex-col">
                    <div className="flex justify-end pb-2 shrink-0">
                        <button
                            className="text-xs text-ink-muted hover:text-ink border border-line/50 rounded px-2 py-1 transition-colors"
                            onClick={() => setBoardLayout(l => NEXT_LAYOUT[l])}
                        >
                            {NEXT_LABEL[boardLayout]}
                        </button>
                    </div>
                    {boardLayout === 'circular' && gameState ? (
                        <div className="flex-1 min-h-0 overflow-hidden">
                            <CircularBoard
                                orderedPlayers={orderedPlayers}
                                cards={gameState.cards}
                                currentUser={user?.username ?? ''}
                                gameState={gameState}
                                gameId={gameId}
                                onCommand={handleCommand}
                            />
                        </div>
                    ) : boardLayout === 'text' && gameState ? (
                        <div className="flex-1 min-h-0 overflow-hidden">
                            <TextBoard
                                orderedPlayers={orderedPlayers}
                                cards={gameState.cards}
                                currentUser={user?.username ?? ''}
                                onCardMove={handleCardMove}
                                onCardReorder={handleCardReorder}
                                onCardAttach={handleCardAttach}
                            />
                        </div>
                    ) : (
                        <div className="flex-1 min-h-0 overflow-y-auto">
                            {gameState ? (
                                <div
                                    className="flex flex-col gap-1.5"
                                    style={{'--card-w': 'clamp(60px, 5.5vw, 72px)'} as CSSProperties}
                                >
                                    {orderedPlayers.map(player => (
                                        <PlayerBoard
                                            key={player.name}
                                            player={player}
                                            cards={gameState.cards}
                                            isCurrentPlayer={player.name === user?.username}
                                            gameId={gameId}
                                            onCommand={handleCommand}
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
                            placeholder="Chat with your opponents…"
                        />
                    </div>
                )}
            </div>
        </GameLayout>
    );
}
