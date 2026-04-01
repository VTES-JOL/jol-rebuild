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
        <div style={styles.panel}>
            {/* Header */}
            <div style={styles.header}>
                <span style={styles.title}>{title}</span>
                <span style={{ ...styles.statusDot, background: statusInfo.color }} title={statusInfo.label} />
                <span style={styles.statusLabel}>{statusInfo.label}</span>
            </div>

            {/* Messages */}
            <div style={styles.messageList}>
                {messages.length === 0 && (
                    <div style={styles.empty}>No messages yet. Say hello!</div>
                )}
                {messages.map((msg, i) => {
                    const isOwn = msg.sender === currentUser;
                    return (
                        <div key={i} style={{ ...styles.messageBubbleWrap, justifyContent: isOwn ? 'flex-end' : 'flex-start' }}>
                            {!isOwn && (
                                <div style={styles.avatar}>{(msg.sender ?? '?')[0].toUpperCase()}</div>
                            )}
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
            <div style={styles.inputRow}>
                <input
                    style={styles.input}
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
    panel: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid rgba(0,0,0,0.1)',
        background: '#fff',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 14,
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '12px 16px',
        borderBottom: '1px solid rgba(0,0,0,0.08)',
        background: '#f8f8f7',
    },
    title: {
        fontWeight: 600,
        fontSize: 15,
        flex: 1,
        color: '#1a1a1a',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: '50%',
        flexShrink: 0,
    },
    statusLabel: {
        fontSize: 12,
        color: '#6b7280',
    },
    messageList: {
        flex: 1,
        overflowY: 'auto',
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
    },
    empty: {
        textAlign: 'center',
        color: '#9ca3af',
        marginTop: 32,
        fontSize: 13,
    },
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
    inputRow: {
        display: 'flex',
        gap: 8,
        padding: '10px 12px',
        borderTop: '1px solid rgba(0,0,0,0.08)',
        background: '#f8f8f7',
    },
    input: {
        flex: 1,
        border: '1px solid #d1d5db',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 14,
        outline: 'none',
        background: '#fff',
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