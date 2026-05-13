import {useCallback, useState} from 'react';
import type {ChatMessage, ChatMsg} from '@/hooks/useWebSocket.ts';
import {useWebSocket} from '@/hooks/useWebSocket.ts';
import {applyOptimisticReaction} from '@/shared/utils/reactionUtils.ts';
import type {GameState} from '@/features/game/types.ts';
import type {GameCommand} from '@/features/game/gameCommands.ts';

interface UseGameChannelOptions {
    url: string | null;
    username: string;
}

export function useGameChannel({url, username}: UseGameChannelOptions) {
    const [messages, setMessages] = useState<ChatMsg[]>([]);
    const [gameState, setGameState] = useState<GameState | null>(null);

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
            case 'GAME_STATE':
            case 'GAME_SNAPSHOT':
                setGameState(msg.state);
                break;
        }
    }, []);

    const {status, send: wsSend} = useWebSocket({url, onMessage: handleMessage});

    const send = useCallback((content: string, replyToId?: string) => {
        wsSend({type: 'CHAT', content, replyToId});
    }, [wsSend]);

    const react = useCallback((messageId: string, emoji: string) => {
        setMessages(prev => applyOptimisticReaction(prev, messageId, emoji, username));
        wsSend({type: 'REACTION', id: messageId, emoji});
    }, [wsSend, username]);

    const sendCommand = useCallback((cmd: GameCommand) => {
        wsSend({type: 'GAME_COMMAND', command: cmd});
    }, [wsSend]);

    return {messages, gameState, status, send, react, sendCommand};
}
