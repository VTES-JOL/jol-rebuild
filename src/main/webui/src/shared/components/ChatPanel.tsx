import React, {useEffect, useRef, useState} from 'react';
import type {ChatMessage, ReactionDto, ReplySnapshot} from '@/shared/services/useWebSocket';
import Panel from './Panel';

const dateFormat = new Intl.DateTimeFormat('UTC', {dateStyle: 'medium', timeStyle: 'short'});
const timeOnlyFormat = new Intl.DateTimeFormat('UTC', {timeStyle: 'short'});

type Status = 'connecting' | 'connected' | 'disconnected' | 'error';

interface ChatPanelProps {
    title: string;
    messages: ChatMessage[];
    status: Status;
    currentUser: string;
    onSend: (content: string, replyToId?: number) => void;
    onReact: (messageId: number, emoji: string) => void;
    placeholder?: string;
    enableReactions?: boolean;
    enableReply?: boolean;
}

const STATUS_LABELS: Record<Status, { label: string; color: string }> = {
    connecting: {label: 'Connecting…', color: '#d97706'},
    connected: {label: 'Connected', color: '#16a34a'},
    disconnected: {label: 'Reconnecting…', color: '#dc2626'},
    error: {label: 'Connection error', color: '#dc2626'},
};

const EMOJI_PALETTE = ['👍', '❤️', '😂', '😮'];

// ─── helpers ────────────────────────────────────────────────────────────────

function initials(name: string): string {
    return name.split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
}

function hueFromName(name: string): number {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return Math.abs(hash) % 360;
}

function avatarStyle(name: string): React.CSSProperties {
    const hue = hueFromName(name);
    return {background: `hsla(${hue},60%,60%,0.18)`, color: `hsl(${hue},70%,72%)`};
}

function nameColorStyle(name: string): React.CSSProperties {
    const hue = hueFromName(name);
    return {color: `hsl(${hue},70%,72%)`};
}

// ─── message grouping ────────────────────────────────────────────────────────
//
// Each MessageLine retains its own id/reactions/replyTo so they can be
// independently targeted. Messages are only grouped under one avatar header
// when they share the same sender and timestamp bucket AND are not replies.

interface MessageLine {
    id: number;
    content: string;
    reactions: ReactionDto[];
    replyTo: ReplySnapshot | null;
}

interface MessageGroup {
    sender: string;
    dividerTimestamp: string | null;
    shortTime: string;
    isSelf: boolean;
    lines: MessageLine[];
}

function groupMessages(messages: ChatMessage[], currentUser: string): MessageGroup[] {
    const groups: MessageGroup[] = [];
    let lastSender = '';
    let lastFormattedFull = '';

    for (const msg of messages) {
        if (!msg.id) continue;

        const sender = msg.sender ?? '';
        const isSelf = sender === currentUser;
        const fullTs = msg.timestamp ? dateFormat.format(new Date(msg.timestamp)) : '';
        const shortTs = msg.timestamp ? timeOnlyFormat.format(new Date(msg.timestamp)) : '';

        const timestampChanged = fullTs !== lastFormattedFull;
        const senderChanged = sender !== lastSender;
        // Replies always break grouping so the quote block sits under a fresh header
        const hasReply = !!msg.replyTo;

        const line: MessageLine = {
            id: msg.id,
            content: msg.content ?? '',
            reactions: msg.reactions ?? [],
            replyTo: msg.replyTo ?? null,
        };

        if (senderChanged || timestampChanged || hasReply) {
            groups.push({
                sender,
                dividerTimestamp: timestampChanged ? fullTs : null,
                shortTime: shortTs,
                isSelf,
                lines: [line],
            });
        } else {
            groups[groups.length - 1].lines.push(line);
        }

        lastSender = sender;
        lastFormattedFull = fullTs;
    }

    return groups;
}

// ─── sub-components ──────────────────────────────────────────────────────────

function TimestampDivider({label}: { label: string }) {
    return (
        <div className="flex items-center gap-2 my-2">
            <div className="flex-1 h-px bg-slate-200/10"/>
            <span className="text-sm text-slate-300 whitespace-nowrap">{label}</span>
            <div className="flex-1 h-px bg-slate-200/10"/>
        </div>
    );
}

function Avatar({name, showLine}: { name: string; showLine: boolean }) {
    return (
        <div className="flex flex-col items-center w-7 shrink-0 cursor-default">
            <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium shrink-0"
                style={avatarStyle(name)}
            >
                {initials(name)}
            </div>
            {showLine && <div className="w-px flex-1 bg-white/5 mt-1"/>}
        </div>
    );
}

// ── Emoji picker ──────────────────────────────────────────────────────────────

function EmojiPicker({onPick, onClose}: { onPick: (e: string) => void; onClose: () => void }) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function onClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) onClose();
        }

        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, [onClose]);

    return (
        <div
            ref={ref}
            className="absolute bottom-full mb-1 left z-10 flex gap-1 p-1.5 rounded-lg bg-slate-800 border border-white/10"
        >
            {EMOJI_PALETTE.map(e => (
                <button
                    key={e}
                    className="text-base hover:scale-125 transition-transform cursor-pointer bg-transparent border-none p-0.5"
                    onClick={() => {
                        onPick(e);
                        onClose();
                    }}
                >
                    {e}
                </button>
            ))}
        </div>
    );
}

// ── Reaction pills ────────────────────────────────────────────────────────────

function ReactionPills({
                           reactions, currentUser, onReact, disabled,
                       }: {
    reactions: ReactionDto[];
    currentUser: string;
    onReact: (emoji: string) => void;
    disabled: boolean;
}) {
    const [pickerOpen, setPickerOpen] = useState(false);

    if (reactions.length === 0 && disabled) return null;

    return (
        <div className="flex flex-wrap items-center gap-1 mt-1.5">
            {reactions.map(r => {
                const mine = r.senders.includes(currentUser);
                return (
                    <button
                        key={r.emoji}
                        title={r.senders.join(', ')}
                        disabled={disabled}
                        onClick={() => onReact(r.emoji)}
                        className={[
                            'flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border transition-colors cursor-pointer',
                            mine
                                ? 'bg-indigo-500/20 border-indigo-400/40 text-indigo-300'
                                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10',
                            disabled ? 'opacity-50 cursor-not-allowed' : '',
                        ].join(' ')}
                    >
                        <span>{r.emoji}</span>
                        <span>{r.senders.length}</span>
                    </button>
                );
            })}
            {!disabled && (
                <div className="relative">
                    <button
                        onClick={() => setPickerOpen(p => !p)}
                        className="flex items-center justify-center w-5 h-5 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200 transition-colors cursor-pointer text-xs"
                        title="Add reaction"
                    >
                        +
                    </button>
                    {pickerOpen && (
                        <EmojiPicker onPick={onReact} onClose={() => setPickerOpen(false)}/>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Reply quote block ─────────────────────────────────────────────────────────

function ReplyQuote({replyTo, onJumpTo}: { replyTo: ReplySnapshot; onJumpTo: (id: number) => void }) {
    return (
        <button
            onClick={() => onJumpTo(replyTo.id)}
            className="flex items-stretch gap-0 mb-1.5 w-full text-left cursor-pointer group"
        >
            <div
                className="w-0.5 rounded-full bg-indigo-400/40 group-hover:bg-indigo-400/70 transition-colors shrink-0"/>
            <div className="flex-1 min-w-0 pl-2">
                <span className="text-[11px] font-medium" style={nameColorStyle(replyTo.sender)}>
                    {replyTo.sender}
                </span>
                <p className="text-[11px] text-slate-400 truncate leading-tight">{replyTo.content}</p>
            </div>
        </button>
    );
}

// ── Reply banner ──────────────────────────────────────────────────────────────

function ReplyBanner({replyTo, onCancel}: { replyTo: ReplySnapshot; onCancel: () => void }) {
    return (
        <div className="flex items-center gap-2 px-3 py-1.5 border-t border-white/10 bg-white/5 text-xs text-slate-300">
            <div className="w-0.5 self-stretch rounded-full bg-indigo-400/60 shrink-0"/>
            <div className="flex-1 min-w-0">
                <span className="font-medium" style={nameColorStyle(replyTo.sender)}>
                    {replyTo.sender}{' '}
                </span>
                <span className="text-slate-400 truncate">{replyTo.content}</span>
            </div>
            <button
                onClick={onCancel}
                className="shrink-0 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer bg-transparent border-none text-sm leading-none"
                title="Cancel reply"
            >
                ✕
            </button>
        </div>
    );
}

// ── Single message line ───────────────────────────────────────────────────────

function MessageLineView({
                             line, sender, currentUser, onReact, onReply, onJumpTo, disabled, enableReactions, enableReply, isFirst,
                         }: {
    line: MessageLine;
    sender: string;
    currentUser: string;
    onReact: (messageId: number, emoji: string) => void;
    onReply: (snapshot: ReplySnapshot) => void;
    onJumpTo: (id: number) => void;
    disabled: boolean;
    enableReactions: boolean;
    enableReply: boolean;
    isFirst: boolean;
}) {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            className="relative group"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {line.replyTo && (
                <ReplyQuote replyTo={line.replyTo} onJumpTo={onJumpTo}/>
            )}

            <div className={isFirst ? '' : 'mt-0.5'}>
                <span className="text-sm text-gray-300 leading-relaxed">{line.content}</span>
            </div>

            {enableReactions && (
                <ReactionPills
                    reactions={line.reactions}
                    currentUser={currentUser}
                    onReact={emoji => onReact(line.id, emoji)}
                    disabled={disabled}
                />
            )}

            {hovered && !disabled && enableReply && (
                <button
                    onClick={() => onReply({id: line.id, sender, content: line.content})}
                    className="absolute -top-0.5 right-0 flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-700/80 border border-white/10 text-[10px] text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Reply"
                >
                    ↩ Reply
                </button>
            )}
        </div>
    );
}

// ── Message group ─────────────────────────────────────────────────────────────

function MessageGroupView({
                              group, showLine, currentUser, onReact, onReply, onJumpTo, disabled,
                              enableReactions, enableReply,
                          }: {
    group: MessageGroup;
    showLine: boolean;
    currentUser: string;
    onReact: (messageId: number, emoji: string) => void;
    onReply: (snapshot: ReplySnapshot) => void;
    onJumpTo: (id: number) => void;
    disabled: boolean;
    enableReactions: boolean;
    enableReply: boolean;
}) {
    return (
        <div className="flex gap-2.5 mb-2.5">
            <Avatar name={group.sender} showLine={showLine}/>
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
                    <MessageLineView
                        key={line.id}
                        line={line}
                        sender={group.sender}
                        currentUser={currentUser}
                        onReact={onReact}
                        onReply={onReply}
                        onJumpTo={onJumpTo}
                        disabled={disabled}
                        enableReactions={enableReactions}
                        enableReply={enableReply}
                        isFirst={i === 0}
                    />
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
                              onReact = () => {},
                              placeholder = 'Type a message…',
                              enableReactions = true,
                              enableReply = true,
                          }: ChatPanelProps) {
    const [draft, setDraft] = useState('');
    const [replyingTo, setReplyingTo] = useState<ReplySnapshot | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const messageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

    const connected = status === 'connected';

    useEffect(() => {
        bottomRef.current?.scrollIntoView({behavior: 'smooth'});
    }, [messages]);

    const handleSend = () => {
        const trimmed = draft.trim();
        if (!trimmed || !connected) return;
        onSend(trimmed, replyingTo?.id);
        setDraft('');
        setReplyingTo(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
        if (e.key === 'Escape') setReplyingTo(null);
    };

    const handleJumpTo = (id: number) => {
        messageRefs.current.get(id)?.scrollIntoView({behavior: 'smooth', block: 'center'});
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
                        style={{background: statusInfo.color}}
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
                                <TimestampDivider label={group.dividerTimestamp}/>
                            )}
                            {/* Anchor divs for jump-to scroll — one per line id */}
                            {group.lines.map(line => (
                                <div
                                    key={line.id}
                                    ref={el => {
                                        if (el) messageRefs.current.set(line.id, el);
                                        else messageRefs.current.delete(line.id);
                                    }}
                                />
                            ))}
                            <MessageGroupView
                                group={group}
                                showLine={i < groups.length - 1 && !groups[i + 1].dividerTimestamp}
                                currentUser={currentUser}
                                onReact={onReact}
                                onReply={setReplyingTo}
                                onJumpTo={handleJumpTo}
                                disabled={!connected}
                                enableReactions={enableReactions}
                                enableReply={enableReply}
                            />
                        </React.Fragment>
                    ))}

                    <div ref={bottomRef}/>
                </div>

                {/* Reply banner — shown while composing a reply */}
                {replyingTo && (
                    <ReplyBanner replyTo={replyingTo} onCancel={() => setReplyingTo(null)}/>
                )}

                {/* Input row */}
                <div className="flex gap-2 border-t border-white/10">
                    <input
                        className="flex-1 bg-transparent border border-white/10 rounded-lg p-2 outline-none text-gray-200 placeholder:text-gray-500 disabled:opacity-50 text-sm"
                        value={draft}
                        onChange={e => setDraft(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={replyingTo ? `Reply to ${replyingTo.sender}…` : placeholder}
                        disabled={!connected}
                        maxLength={1000}
                    />
                    <button
                        className="py-1.5 px-3 rounded-lg bg-slate-500/50 hover:bg-slate-700/50 text-white cursor-pointer transition-opacity duration-75 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        onClick={handleSend}
                        disabled={!connected || !draft.trim()}
                    >
                        Send
                    </button>
                </div>
            </div>
        </Panel>
    );
}