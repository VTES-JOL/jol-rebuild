import React, {useEffect, useRef, useState} from 'react';
import {useCardAutocomplete} from '@/shared/services/useCardAutocomplete';
import {useChatInput} from '@/features/chat/useChatInput';
import {groupMessages} from '@/features/chat/chatUtils';
import {ReplyBanner, TimestampDivider} from './ChatPanelExtras';
import type {ChatMessage, ReplySnapshot} from '@/features/chat/useWebSocket';
import Panel from '@/shared/components/Panel';
import {CardSuggestions} from "@/shared/components/CardSuggestions.tsx";
import {MessageGroupView} from "./MessageGroupView";

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

// ─── main component ──────────────────────────────────────────────────────────

export function ChatPanel({
                              title,
                              messages,
                              status,
                              currentUser,
                              onSend,
                              onReact = () => {
                              },
                              placeholder = 'Type a message…',
                              enableReactions = true,
                              enableReply = true,
                          }: ChatPanelProps) {
    const { draft, displayValue, syncFromDisplay, syncFromEncoded, reset } = useChatInput();
    const [replyingTo, setReplyingTo] = useState<ReplySnapshot | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const messageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
    const inputRef = useRef<HTMLInputElement>(null);

    const { suggestions, isOpen, activeIndex, handleInputChange, handleKeyDown: acHandleKeyDown, confirmSelection } =
        useCardAutocomplete({
            onComplete: (newEncoded, newEncodedCursor) => {
                const { newDisplayCursor } = syncFromEncoded(newEncoded, newEncodedCursor);
                requestAnimationFrame(() => {
                    if (inputRef.current) {
                        inputRef.current.focus();
                        inputRef.current.setSelectionRange(newDisplayCursor, newDisplayCursor);
                    }
                });
            },
        });

    const connected = status === 'connected';

    useEffect(() => {
        bottomRef.current?.scrollIntoView({behavior: 'smooth'});
    }, [messages]);

    const handleSend = () => {
        const trimmed = draft.trim();
        if (!trimmed || !connected) return;
        onSend(trimmed, replyingTo?.id);
        reset();
        setReplyingTo(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const selectionStart = inputRef.current?.selectionStart ?? displayValue.length;
        const { encodedCursor } = syncFromDisplay(displayValue, selectionStart);

        const consumed = acHandleKeyDown(e, draft, encodedCursor);
        if (consumed) return;

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

                {replyingTo && (
                    <ReplyBanner replyTo={replyingTo} onCancel={() => setReplyingTo(null)}/>
                )}

                <div className="flex gap-2 items-center border-t border-white/10">
                    <div className="relative flex-1 min-w-0">
                        <CardSuggestions
                            suggestions={isOpen ? suggestions : []}
                            activeIndex={activeIndex}
                            onSelect={card => {
                                const selectionStart = inputRef.current?.selectionStart ?? displayValue.length;
                                const { encodedCursor } = syncFromDisplay(displayValue, selectionStart);
                                confirmSelection(card, draft, encodedCursor);
                            }}
                        />
                        <input
                            ref={inputRef}
                            className="w-full bg-transparent border border-white/10 rounded-lg p-2 outline-none text-gray-200 placeholder:text-gray-500 disabled:opacity-50 text-sm"
                            value={displayValue}
                            onChange={e => {
                                const val = e.target.value;
                                const selectionStart = e.target.selectionStart ?? 0;
                                const { newEncoded, encodedCursor } = syncFromDisplay(val, selectionStart);
                                handleInputChange(newEncoded, encodedCursor);
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder={replyingTo ? `Reply to ${replyingTo.sender}…` : placeholder}
                            disabled={!connected}
                            maxLength={1000}
                        />
                    </div>
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
