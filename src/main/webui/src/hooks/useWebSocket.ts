import {useCallback, useEffect, useRef, useState} from 'react';
import type {GameState} from '@/features/game/types.ts';

export interface ReactionDto   { emoji: string; senders: string[] }
export interface ReplySnapshot { id: string; sender: string; content: string }

// ─── Inbound messages (server → client) ──────────────────────────────────────

export interface ChatMsg {
    type: 'CHAT';
    id: string;
    sender: string;
    content: string;
    timestamp: string;
    replyTo?: ReplySnapshot;
    reactions: ReactionDto[];
}

interface HistoryMsg {
    type: 'HISTORY';
    history: ChatMsg[];
}

interface ReactionUpdateMsg {
    type: 'REACTION';
    id: string;
    reactions: ReactionDto[];
}

interface ErrorMsg {
    type: 'ERROR';
    error: string;
}

interface LobbyUpdateMsg {
    type: 'LOBBY_UPDATE';
    gameId: string;
}

export interface GameStateMsg {
    type: 'GAME_STATE' | 'GAME_SNAPSHOT';
    state: GameState;
}

export type ChatMessage = ChatMsg | HistoryMsg | ReactionUpdateMsg | ErrorMsg | LobbyUpdateMsg | GameStateMsg;

// ─── Outbound messages (client → server) ─────────────────────────────────────

export type OutboundMessage =
    | { type: 'CHAT'; content: string; replyToId?: string }
    | { type: 'REACTION'; id: string; emoji: string };

// ─── Hook ─────────────────────────────────────────────────────────────────────

type Status = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseWebSocketOptions {
    url: string | null;
    onMessage: (msg: ChatMessage) => void;
    /** Initial reconnect delay in ms. Doubles on each attempt up to maxReconnectDelay. Default: 1000 */
    reconnectDelay?: number;
    /** Maximum reconnect delay in ms. Default: 30000 */
    maxReconnectDelay?: number;
}

interface UseWebSocketReturn {
    status: Status;
    send: (msg: object) => void;
}

export function useWebSocket({
                                 url,
                                 onMessage,
                                 reconnectDelay = 1000,
                                 maxReconnectDelay = 30000,
                             }: UseWebSocketOptions): UseWebSocketReturn {
    const [status, setStatus] = useState<Status>('connecting');
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const epochRef = useRef(0);
    const currentDelayRef = useRef(reconnectDelay);
    const onMessageRef = useRef(onMessage);
    useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);

    useEffect(() => {
        const epoch = ++epochRef.current;
        currentDelayRef.current = reconnectDelay;

        const clearReconnect = () => {
            if (reconnectTimer.current) { clearTimeout(reconnectTimer.current); reconnectTimer.current = null; }
        };

        const connect = () => {
            if (epoch !== epochRef.current) return;
            if (!url) { setStatus('disconnected'); return; }

            wsRef.current?.close();
            setStatus('connecting');
            const ws = new WebSocket(url);
            wsRef.current = ws;

            ws.onopen = () => {
                if (epoch !== epochRef.current) { ws.close(); return; }
                currentDelayRef.current = reconnectDelay; // reset backoff on successful connect
                setStatus('connected');
            };

            ws.onmessage = (event) => {
                if (epoch !== epochRef.current) return;
                try {
                    const msg: ChatMessage = JSON.parse(event.data);
                    onMessageRef.current(msg);
                } catch {
                    console.warn('[useWebSocket] Failed to parse message:', event.data);
                }
            };

            ws.onclose = (event) => {
                if (epoch !== epochRef.current) return;
                console.warn('[WS] closed — code:', event.code, 'reason:', event.reason, 'wasClean:', event.wasClean);
                setStatus('disconnected');
                const delay = currentDelayRef.current;
                currentDelayRef.current = Math.min(delay * 2, maxReconnectDelay);
                // Add ±25% jitter to prevent thundering herd on server restart
                const jitteredDelay = delay * (0.75 + Math.random() * 0.5);
                reconnectTimer.current = setTimeout(connect, jitteredDelay);
            };

            ws.onerror = () => {
                if (epoch !== epochRef.current) return;
                setStatus('error');
                ws.close();
            };
        };

        connect();

        return () => {
            const currentEpoch = epochRef.current;
            epochRef.current = currentEpoch + 1;
            clearReconnect();
            wsRef.current?.close();
            wsRef.current = null;
        };
    }, [url, reconnectDelay, maxReconnectDelay]);

    const send = useCallback((msg: object) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(msg));
        } else {
            console.warn('[useWebSocket] Cannot send — socket not open');
        }
    }, []);

    return { status, send };
}
