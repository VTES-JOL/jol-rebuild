import type {CSSProperties} from 'react';
import {useAuthContext} from '@/contexts/AuthContext.tsx';
import {useParams} from 'react-router-dom';
import {useGameChannel} from '@/hooks/useGameChannel.ts';
import {PlayerBoard} from './PlayerBoard.tsx';
import {ChatPanel} from '@/features/chat/ChatPanel.tsx';
import type {PlayerState} from './types.ts';
import GameLayout from "@/shared/layout/GameLayout.tsx";

export default function GamePage() {
    const {user, loading} = useAuthContext();
    const {gameId} = useParams();
    if (!gameId) throw new Error('Missing Game ID');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = !loading && user
        ? `${protocol}//${window.location.host}/ws/game/${encodeURIComponent(gameId)}`
        : null;

    const {messages, gameState, status, send, react} = useGameChannel({
        url: wsUrl,
        username: user?.username ?? '',
    });

    const orderedPlayers: PlayerState[] = gameState
        ? (gameState.playerOrder
            .map(name => gameState.players.find(p => p.name === name))
            .filter(Boolean) as PlayerState[])
        : [];

    return (
        <GameLayout>
                {/* Board — scrollable, ~62% of height */}
                <div
                    className="flex-5 min-h-0 overflow-y-auto"
                    style={{'--card-w': 'clamp(60px, 5.5vw, 72px)'} as CSSProperties}
                >
                    {gameState ? (
                        <div className="flex flex-col gap-1.5">
                            {orderedPlayers.map(player => (
                                <PlayerBoard
                                    key={player.name}
                                    player={player}
                                    cards={gameState.cards}
                                    isCurrentPlayer={player.name === user?.username}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-32 text-ink-muted text-sm">
                            {loading ? 'Loading…' : 'Waiting for game state…'}
                        </div>
                    )}
                </div>

                {/* Chat panel — full width, ~38% of height */}
                {user && (
                    <div className="flex-3 min-h-0">
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
        </GameLayout>
    );
}
