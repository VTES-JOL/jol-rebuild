import React, { useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '@/shared/services/useWebSocket';
import Panel from './Panel';

const dateFormat = new Intl.DateTimeFormat('UTC', { dateStyle: 'medium', timeStyle: 'short' });
const timeOnlyFormat = new Intl.DateTimeFormat('UTC', { timeStyle: 'short' });

type Status = 'connecting' | 'connected' | 'disconnected' | 'error';

interface ChatPanelProps {
    title: string;
    messages: ChatMessage[];
    status: Status;
    currentUser: string;
    onSend: (content: string) => void;
    placeholder?: string;
}

const STATUS_LABELS: Record<Status, { label: string; color: string }> = {
    connecting:   { label: 'Connecting…',     color: '#d97706' },
    connected:    { label: 'Connected',        color: '#16a34a' },
    disconnected: { label: 'Reconnecting…',    color: '#dc2626' },
    error:        { label: 'Connection error', color: '#dc2626' },
};

// ─── helpers ────────────────────────────────────────────────────────────────

function initials(name: string): string {
    return name
        .split(/\s+/)
        .slice(0, 2)
        .map(w => w[0]?.toUpperCase() ?? '')
        .join('');
}

// Stable hue from a string — gives each player a distinct avatar colour.
// Must stay as inline styles: Tailwind cannot generate arbitrary hsl() values at runtime.
function hueFromName(name: string): number {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return Math.abs(hash) % 360;
}

function avatarStyle(name: string): React.CSSProperties {
    const hue = hueFromName(name);
    return { background: `hsla(${hue},60%,60%,0.18)`, color: `hsl(${hue},70%,72%)` };
}

function nameColorStyle(name: string): React.CSSProperties {
    const hue = hueFromName(name);
    return { color: `hsl(${hue},70%,72%)` };
}

// ─── message grouping ────────────────────────────────────────────────────────

interface MessageGroup {
    sender: string;
    /** Formatted full timestamp shown as a divider when the date/time block changes */
    dividerTimestamp: string | null;
    /** Short time shown in the group header */
    shortTime: string;
    lines: string[];
    isSelf: boolean;
}

function groupMessages(messages: ChatMessage[], currentUser: string): MessageGroup[] {
    const groups: MessageGroup[] = [];
    let lastSender = '';
    let lastFormattedFull = '';

    for (const msg of messages) {
        const sender = msg.sender ?? '';
        const isSelf = sender === currentUser;
        const fullTs = msg.timestamp ? dateFormat.format(new Date(msg.timestamp)) : '';
        const shortTs = msg.timestamp ? timeOnlyFormat.format(new Date(msg.timestamp)) : '';

        const timestampChanged = fullTs !== lastFormattedFull;
        const senderChanged = sender !== lastSender;

        if (senderChanged || timestampChanged) {
            groups.push({
                sender,
                dividerTimestamp: timestampChanged ? fullTs : null,
                shortTime: shortTs,
                lines: [msg.content ?? ''],
                isSelf,
            });
        } else {
            groups[groups.length - 1].lines.push(msg.content ?? '');
        }

        lastSender = sender;
        lastFormattedFull = fullTs;
    }

    return groups;
}

// ─── sub-components ──────────────────────────────────────────────────────────

function TimestampDivider({ label }: { label: string }) {
    return (
        <div className="flex items-center gap-2 my-2">
            <div className="flex-1 h-px bg-slate-200/10" />
            <span className="text-sm text-slate-300 whitespace-nowrap">{label}</span>
            <div className="flex-1 h-px bg-slate-200/10" />
        </div>
    );
}

function Avatar({ name, showLine }: { name: string; isSelf: boolean; showLine: boolean }) {
    return (
        <div className="flex flex-col items-center w-7 shrink-0 cursor-default">
            <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium shrink-0"
                style={avatarStyle(name)}
            >
                {initials(name)}
            </div>
            {showLine && <div className="w-px flex-1 bg-white/5 mt-1" />}
        </div>
    );
}

function MessageGroup({ group, showLine }: { group: MessageGroup; showLine: boolean }) {
    return (
        <div className="flex gap-2.5 mb-2.5">
            <Avatar name={group.sender} isSelf={group.isSelf} showLine={showLine} />
            <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="text-sm font-medium" style={nameColorStyle(group.sender)}>
                        {group.sender}
                    </span>
                    {group.shortTime && (
                        <span className="text-[10px] text-slate-300 cursor-default">{group.shortTime}</span>
                    )}
                </div>
                {group.lines.map((line, i) => (
                    <div
                        key={i}
                        className={`text-sm text-gray-300 leading-relaxed${i > 0 ? ' mt-0.5' : ''}`}
                    >
                        {line}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── main component ──────────────────────────────────────────────────────────

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

    const statusInfo = STATUS_LABELS[status];
    const groups = groupMessages(messages, currentUser);

    return (
        <Panel
            title={title}
            className="h-full min-h-0"
            right={
                <div className="flex gap-2 items-center">
                    <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: statusInfo.color }}
                        title={statusInfo.label}
                    />
                    <span className="text-gray-200">{statusInfo.label}</span>
                </div>
            }
        >
            <div className="flex flex-col flex-1 min-h-0">
                {/* Messages */}
                <div className="flex-1 min-h-0 overflow-y-auto py-2 px-3">
                    {messages.length === 0 && (
                        <div className="text-center text-gray-200 mt-4 text-lg">
                            No messages yet. Say hello!
                        </div>
                    )}

                    {groups.map((group, i) => (
                        <React.Fragment key={i}>
                            {group.dividerTimestamp && (
                                <TimestampDivider label={group.dividerTimestamp} />
                            )}
                            <MessageGroup
                                group={group}
                                showLine={i < groups.length - 1 && !groups[i + 1].dividerTimestamp}
                            />
                        </React.Fragment>
                    ))}

                    <div ref={bottomRef} />
                </div>

                {/* Input row */}
                <div className="flex gap-2 border-t border-white/10">
                    <input
                        className="flex-1 bg-transparent border border-white/10 rounded-lg px-2 py-1 outline-none text-gray-200 placeholder:text-gray-500 disabled:opacity-50 text-sm"
                        value={draft}
                        onChange={e => setDraft(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        disabled={status !== 'connected'}
                        maxLength={1000}
                    />
                    <button
                        className="py-1.5 px-3 rounded-lg bg-slate-500/50 hover:bg-slate-700/50 text-white cursor-pointer transition-opacity duration-75 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        onClick={handleSend}
                        disabled={status !== 'connected' || !draft.trim()}
                    >
                        Send
                    </button>
                </div>
            </div>
        </Panel>
    );
}