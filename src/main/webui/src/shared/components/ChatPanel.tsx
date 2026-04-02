import React, { useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '@/shared/services/useWebSocket';

type Status = 'connecting' | 'connected' | 'disconnected' | 'error';

interface ChatPanelProps {
    /** Display title shown in the header */
    title: string;
    messages: ChatMessage[];
    status: Status;
    currentUser: string;
    onSend: (content: string) => void;
    /** Placeholder text for the input */
    placeholder?: string;
}

const STATUS_LABELS: Record<Status, { label: string; color: string }> = {
    connecting:   { label: 'Connecting…', color: '#d97706' },
    connected:    { label: 'Connected',   color: '#16a34a' },
    disconnected: { label: 'Reconnecting…', color: '#dc2626' },
    error:        { label: 'Connection error', color: '#dc2626' },
};

export function ChatPanel({
                              title,
                              messages,
                              status,
                              currentUser,
                              onSend,
                              placeholder = 'Type a message…',
                          }: ChatPanelProps) {
    const [draft, setDraft] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        const trimmed = draft.trim();
        if (!trimmed || status !== 'connected') return;
        onSend(trimmed);
        setDraft('');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatTime = (ts?: string) => {
        if (!ts) return '';
        return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const statusInfo = STATUS_LABELS[status];

    return (
        <div className={"flex flex-col h-full min-h-0 rounded-lg border border-white/10 bg-slate-900 opacity-80 text-gray-200 overflow-hidden"}>
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-2 border-b border-white/10">
                <h2 className="tracking-wide">{title}</h2>
                <div className={"flex gap-2 items-center"}>
                    <span className={"h-2 w-2 rounded-full"} style={{ background: statusInfo.color }} title={statusInfo.label} />
                    <span className={"text-gray-400"}>{statusInfo.label}</span>
                </div>
            </div>

            {/* Messages */}
            <div className={"flex-1 overflow-y-auto py-2 px-3 flex flex-col gap-1"}>
                {messages.length === 0 && (
                    <div className={"text-center text-gray-200 mt-4 text-lg"}>No messages yet. Say hello!</div>
                )}
                {messages.map((msg, i) => {
                    const isOwn = msg.sender === currentUser;
                    return (
                        <div key={i} style={{ ...styles.messageBubbleWrap, justifyContent: isOwn ? 'flex-end' : 'flex-start' }}>
                            <div style={{ maxWidth: '70%' }}>
                                {!isOwn && (
                                    <div style={styles.senderName}>{msg.sender}</div>
                                )}
                                <div style={{ ...styles.bubble, ...(isOwn ? styles.bubbleOwn : styles.bubbleOther) }}>
                                    {msg.content}
                                </div>
                                <div style={{ ...styles.timestamp, textAlign: isOwn ? 'right' : 'left' }}>
                                    {formatTime(msg.timestamp)}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {/* Input row */}
            <div className={"flex g-2 p-2 border-t border-white/10"}>
                <input className={"flex-1 border-white/10 rounded-lg p-1 outline-none bg-slate-900 opacity-80"}
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={status !== 'connected'}
                    maxLength={1000}
                />
                <button
                    style={{ ...styles.sendBtn, opacity: status !== 'connected' ? 0.5 : 1 }}
                    onClick={handleSend}
                    disabled={status !== 'connected' || !draft.trim()}
                >
                    Send
                </button>
            </div>
        </div>
    );
}

// ── Inline styles (no external CSS dependency) ──────────────────────────────

const styles: Record<string, React.CSSProperties> = {
    messageBubbleWrap: {
        display: 'flex',
        alignItems: 'flex-end',
        gap: 8,
    },
    avatar: {
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: '#e5e7eb',
        color: '#374151',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        fontWeight: 600,
        flexShrink: 0,
    },
    senderName: {
        fontSize: 11,
        color: '#6b7280',
        marginBottom: 2,
        paddingLeft: 4,
    },
    bubble: {
        padding: '8px 12px',
        borderRadius: 12,
        wordBreak: 'break-word',
        lineHeight: 1.45,
    },
    bubbleOwn: {
        background: '#2563eb',
        color: '#fff',
        borderBottomRightRadius: 4,
    },
    bubbleOther: {
        background: '#f3f4f6',
        color: '#111827',
        borderBottomLeftRadius: 4,
    },
    timestamp: {
        fontSize: 10,
        color: '#9ca3af',
        marginTop: 2,
        paddingLeft: 4,
        paddingRight: 4,
    },
    sendBtn: {
        padding: '8px 16px',
        borderRadius: 8,
        border: 'none',
        background: '#2563eb',
        color: '#fff',
        fontWeight: 600,
        cursor: 'pointer',
        fontSize: 14,
        transition: 'opacity 0.15s',
    },
};