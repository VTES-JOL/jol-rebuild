import React, {createContext, useCallback, useContext, useRef, useState} from 'react';
import {type ChatMessage, type ChatMsg, useWebSocket} from '@/hooks/useWebSocket';
import {useAuthContext} from "@/contexts/AuthContext.tsx";
import {applyOptimisticReaction} from '@/shared/utils/reactionUtils.ts';

type Status = 'connecting' | 'connected' | 'disconnected' | 'error';

interface LobbySocketContextValue {
    messages: ChatMsg[];
    status: Status;
    send: (content: string, replyToId?: number) => void;
    react: (messageId: number, emoji: string) => void;
    /** Subscribe to LOBBY_UPDATE events for a specific game. Returns unsubscribe fn. */
    subscribeToGame: (gameId: number, callback: () => void) => () => void;
    /** Subscribe to all LOBBY_UPDATE events (any game). Returns unsubscribe fn. */
    subscribeToLobby: (callback: () => void) => () => void;
}

const LobbySocketContext = createContext<LobbySocketContextValue | null>(null);

export function LobbySocketProvider({children}: {children: React.ReactNode}) {
    const {user} = useAuthContext();
    const [messages, setMessages] = useState<ChatMsg[]>([]);
    const gameListenersRef = useRef<Map<number, Set<() => void>>>(new Map());
    const lobbyListenersRef = useRef<Set<() => void>>(new Set());

    const url = user
        ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/lobby`
        : null;

    const handleMessage = useCallback((msg: ChatMessage) => {
        switch (msg.type) {
            case 'HISTORY':
                setMessages(msg.history);
                break;
            case 'CHAT':
                setMessages(prev => [...prev, msg]);
                break;
            case 'REACTION':
                setMessages(prev => prev.map(m =>
                    m.id === msg.id ? {...m, reactions: msg.reactions} : m
                ));
                break;
            case 'LOBBY_UPDATE': {
                if (msg.gameId != null) {
                    gameListenersRef.current.get(msg.gameId)?.forEach(cb => cb());
                }
                lobbyListenersRef.current.forEach(cb => cb());
                break;
            }
        }
    }, []);

    const {status, send: wsSend} = useWebSocket({url, onMessage: handleMessage});

    const send = useCallback((content: string, replyToId?: number) => {
        wsSend({type: 'CHAT', content, replyToId});
    }, [wsSend]);

    const react = useCallback((messageId: number, emoji: string) => {
        if (user) {
            setMessages(prev => applyOptimisticReaction(prev, messageId, emoji, user.username));
        }
        wsSend({type: 'REACTION', id: messageId, emoji});
    }, [wsSend, user]);

    const subscribeToGame = useCallback((gameId: number, callback: () => void) => {
        const map = gameListenersRef.current;
        if (!map.has(gameId)) map.set(gameId, new Set());
        map.get(gameId)!.add(callback);
        return () => { map.get(gameId)?.delete(callback); };
    }, []);

    const subscribeToLobby = useCallback((callback: () => void) => {
        const set = lobbyListenersRef.current;
        set.add(callback);
        return () => { set.delete(callback); };
    }, []);

    return (
        <LobbySocketContext.Provider value={{messages, status, send, react, subscribeToGame, subscribeToLobby}}>
            {children}
        </LobbySocketContext.Provider>
    );
}

export function useLobbySocket() {
    const ctx = useContext(LobbySocketContext);
    if (!ctx) throw new Error('useLobbySocket must be used within LobbySocketProvider');
    return ctx;
}
