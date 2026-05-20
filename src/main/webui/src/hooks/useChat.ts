import {useCallback, useState} from 'react';
import {type ChatMessage, type ChatMsg, useWebSocket} from './useWebSocket.ts';
import {applyOptimisticReaction} from '@/shared/utils/reactionUtils.ts';

interface UseChatOptions {
    url: string;
    username: string;
    onSystemError?: (error: string) => void;
}

export function useChat({ url, username, onSystemError }: UseChatOptions) {
    const [messages, setMessages] = useState<ChatMsg[]>([]);

    const handleMessage = useCallback((msg: ChatMessage) => {
        switch (msg.type) {
            case 'HISTORY':
                setMessages(msg.history.filter((m): m is ChatMsg => m.type === 'CHAT'));
                break;
            case 'CHAT':
                setMessages(prev => [...prev, msg]);
                break;
            case 'REACTION':
                setMessages(prev => prev.map(m =>
                    m.id === msg.id ? { ...m, reactions: msg.reactions } : m
                ));
                break;
            case 'ERROR':
                console.warn('[Chat] Server error:', msg.error);
                if (onSystemError) onSystemError(msg.error);
                break;
        }
    }, [onSystemError]);

    const { status, send } = useWebSocket({ url, onMessage: handleMessage });

    const handleSend = useCallback((content: string, replyToId?: string) => {
        send({ type: 'CHAT', content, replyToId });
    }, [send]);

    const handleReact = useCallback((messageId: string, emoji: string) => {
        setMessages(prev => applyOptimisticReaction(prev, messageId, emoji, username));
        send({ type: 'REACTION', id: messageId, emoji });
    }, [send, username]);

    return {
        messages,
        status,
        send: handleSend,
        react: handleReact,
    };
}
