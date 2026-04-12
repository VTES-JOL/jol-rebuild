import React, {useEffect, useRef, useState} from 'react';
import type {ChatMessage, ReplySnapshot} from '@/hooks/useWebSocket.ts';
import {useCardAutocomplete} from '@/hooks/useCardAutocomplete.ts';
import {useChatInput} from '@/hooks/useChatInput.ts';
import {groupMessages} from '@/shared/utils/chatUtils.ts';
import Panel from '@/shared/components/Panel';
import Button from '@/shared/components/Button';
import {CardSuggestions} from '@/features/chat/CardSuggestions.tsx';
import {ReplyBanner, TimestampDivider} from './ChatPanelExtras.tsx';
import {MessageGroupView} from './MessageGroupView';

type Status = 'connecting' | 'connected' | 'disconnected' | 'error';

export type ChatPanelViewProps = {
    title: string;
    messages: ChatMessage[];
    status: Status;
    currentUser: string;
    onSend: (content: string, replyToId?: number) => void;
    onReact: (messageId: number, emoji: string) => void;
    onCancelReply?: () => void;
    placeholder?: string;
    enableReactions?: boolean;
    enableReply?: boolean;
};

const STATUS_LABELS: Record<Status, { label: string; color: string }> = {
    connecting: { label: 'Connecting…', color: '#d97706' },
    connected: { label: 'Connected', color: '#16a34a' },
    disconnected: { label: 'Reconnecting…', color: '#dc2626' },
    error: { label: 'Connection error', color: '#dc2626' },
};

export function ChatPanelView({
                                  title,
                                  messages,
                                  status,
                                  currentUser,
                                  onSend,
                                  onReact = () => {},
                                  onCancelReply,
                                  placeholder = 'Type a message…',
                                  enableReactions = true,
                                  enableReply = true,
                              }: ChatPanelViewProps) {
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
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
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
        messageRefs.current.get(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const statusInfo = STATUS_LABELS[status];
    const groups = groupMessages(messages, currentUser);

    return (
        <Panel
            title={title}
            className="h-full min-h-0"
            right={
                <div className="flex items-center gap-2">
                    <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: statusInfo.color }}
                        title={statusInfo.label}
                    />
                    <span className="text-ink-secondary">{statusInfo.label}</span>
                </div>
            }
        >
            <div className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 min-h-0 overflow-y-auto py-2 px-3">
                    {messages.length === 0 && (
                        <div className="mt-4 text-center text-lg text-ink-muted">
                            No messages yet. Say hello!
                        </div>
                    )}

                    {groups.map((group, i) => (
                        <div
                            key={i}
                            ref={el => {
                                for (const line of group.lines) {
                                    if (el) messageRefs.current.set(line.id, el);
                                    else messageRefs.current.delete(line.id);
                                }
                            }}
                        >
                            {group.dividerTimestamp && <TimestampDivider label={group.dividerTimestamp} />}
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
                        </div>
                    ))}

                    <div ref={bottomRef} />
                </div>

                {replyingTo && (
                    <ReplyBanner
                        replyTo={replyingTo}
                        onCancel={() => {
                            setReplyingTo(null);
                            onCancelReply?.();
                        }}
                    />
                )}

                <div className="flex items-center gap-2 border-t border-line/60">
                    <div className="relative min-w-0 flex-1">
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
                            className="w-full rounded-lg border border-line/60 bg-transparent p-2 text-sm text-ink outline-none placeholder:text-ink-muted disabled:opacity-50"
                            value={displayValue}
                            onChange={e => {
                                const val = e.target.value;
                                const selectionStart = e.target.selectionStart ?? 0;
                                const { newEncoded, encodedCursor } = syncFromDisplay(val, selectionStart);
                                void handleInputChange(newEncoded, encodedCursor);
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder={replyingTo ? `Reply to ${replyingTo.sender}…` : placeholder}
                            disabled={!connected}
                            maxLength={1000}
                        />
                    </div>
                    <Button
                        variant="primary"
                        size="md"
                        onClick={handleSend}
                        disabled={!connected || !draft.trim()}
                        className="rounded-lg shrink-0"
                    >
                        Send
                    </Button>
                </div>
            </div>
        </Panel>
    );
}