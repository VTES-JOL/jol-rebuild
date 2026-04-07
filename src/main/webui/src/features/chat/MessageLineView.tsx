import React, { useState } from 'react';
import type {ReplySnapshot, ReactionDto} from '@/hooks/useWebSocket.ts';
import { nameColorStyle } from '@/shared/utils/avatarUtils';
import { MessageContent } from './MessageContent';

const EMOJI_PALETTE = ['👍', '❤️', '😂', '😮'];

export interface MessageLine {
    id: number;
    content: string;
    reactions: ReactionDto[];
    replyTo: ReplySnapshot | null;
}

interface ReactionPillsProps {
    reactions: ReactionDto[];
    currentUser: string;
    onReact: (emoji: string) => void;
    disabled: boolean;
}

function ReactionPills({ reactions, currentUser, onReact, disabled }: ReactionPillsProps) {
    if (reactions.length === 0) return null;

    return (
        <div className="flex flex-wrap items-center gap-1 mt-1">
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
        </div>
    );
}

function ReplyQuote({ replyTo, onJumpTo }: { replyTo: ReplySnapshot; onJumpTo: (id: number) => void }) {
    return (
        <button
            onClick={() => onJumpTo(replyTo.id)}
            className="flex items-stretch gap-0 mb-1.5 w-full text-left cursor-pointer group"
        >
            <div className="w-0.5 rounded-full bg-indigo-400/40 group-hover:bg-indigo-400/70 transition-colors shrink-0" />
            <div className="flex-1 min-w-0 pl-2">
                <span className="text-[11px] font-medium pe-2" style={nameColorStyle(replyTo.sender)}>
                    {replyTo.sender}
                </span>
                <MessageContent className={"text-[11px] text-slate-400 truncate leading-tight"} content={replyTo.content}/>
            </div>
        </button>
    );
}

interface MessageLineViewProps {
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
}

export const MessageLineView = React.memo(function MessageLineView({
    line,
    sender,
    currentUser,
    onReact,
    onReply,
    onJumpTo,
    disabled,
    enableReactions,
    enableReply,
    isFirst,
}: MessageLineViewProps) {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            className="relative group rounded transition-colors duration-100 -mx-1.5 px-1.5"
            style={{ background: hovered ? 'rgba(255,255,255,0.04)' : 'transparent' }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {line.replyTo && (
                <ReplyQuote replyTo={line.replyTo} onJumpTo={onJumpTo} />
            )}

            <div className={isFirst ? 'pr-16' : 'mt-0.5 pr-16'}>
                <MessageContent content={line.content} />
            </div>

            {enableReactions && (
                <ReactionPills
                    reactions={line.reactions}
                    currentUser={currentUser}
                    onReact={emoji => onReact(line.id, emoji)}
                    disabled={disabled}
                />
            )}

            {hovered && !disabled && (
                <div
                    className="absolute -top-3 right-0 flex items-center bg-slate-800 border border-white/10 rounded-md shadow-lg z-20 divide-x divide-white/10">
                    {enableReactions && (
                        <div className="flex items-center gap-0 px-0.5">
                            {EMOJI_PALETTE.map(e => (
                                <button
                                    key={e}
                                    onClick={() => onReact(line.id, e)}
                                    className="flex items-center justify-center w-6 h-6 rounded text-base hover:scale-125 transition-transform cursor-pointer"
                                    title={e}
                                    aria-label={`React with ${e}`}
                                >
                                    {e}
                                </button>
                            ))}
                        </div>
                    )}
                    {enableReply && (
                        <button
                            onClick={() => onReply({ id: line.id, sender, content: line.content })}
                            className="flex items-center justify-center w-6 h-6 rounded text-slate-400 hover:bg-white/10 hover:text-slate-200 transition-colors cursor-pointer text-sm mx-0.5"
                            title="Reply"
                            aria-label="Reply to message"
                        >
                            ↩
                        </button>
                    )}
                </div>
            )}
        </div>
    );
});
