import { useCallback, useEffect, useRef, useState } from 'react';

export type MessageType = 'CHAT' | 'HISTORY' | 'ERROR' | 'REACTION';

export interface ReactionDto   { emoji: string; senders: string[] }
export interface ReplySnapshot { id: number; sender: string; content: string }

export interface ChatMessage {
    type: MessageType;
    id?: number;           // present on CHAT and REACTION
    sender?: string;
    content?: string;
    timestamp?: string;
    replyTo?: ReplySnapshot;
    reactions?: ReactionDto[];
    history?: ChatMessage[];
    error?: string;
    // outbound-only fields (never in server responses)
    replyToId?: number;
    emoji?: string;
}

type Status = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseWebSocketOptions {
    url: string | null;
    onMessage: (msg: ChatMessage) => void;
    /** Milliseconds between reconnect attempts. Default: 3000 */
    reconnectDelay?: number;
}

interface UseWebSocketReturn {
    status: Status;
    send: (msg: ChatMessage) => void;
}

export function useWebSocket({
                                 url,
                                 onMessage,
                                 reconnectDelay = 3000,
                             }: UseWebSocketOptions): UseWebSocketReturn {
    const [status, setStatus] = useState<Status>('connecting');
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const epochRef = useRef(0);
    const onMessageRef = useRef(onMessage);
    useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);

    useEffect(() => {
        const epoch = ++epochRef.current;

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
                reconnectTimer.current = setTimeout(connect, reconnectDelay);
            };

            ws.onerror = () => {
                if (epoch !== epochRef.current) return;
                setStatus('error');
                ws.close();
            };
        };

        connect();

        return () => {
            epochRef.current++;
            clearReconnect();
            wsRef.current?.close();
            wsRef.current = null;
        };
    }, [url, reconnectDelay]);

    const send = useCallback((msg: ChatMessage) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(msg));
        } else {
            console.warn('[useWebSocket] Cannot send — socket not open');
        }
    }, []);

    return { status, send };
}