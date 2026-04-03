import React, {useEffect, useRef, useState} from 'react';
import type {ChatMessage} from '@/shared/services/useWebSocket';
import Panel from './Panel';

const dateFormat = new Intl.DateTimeFormat('UTC', {dateStyle: 'medium', timeStyle: 'short'})
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
    connecting: {label: 'Connecting…', color: '#d97706'},
    connected: {label: 'Connected', color: '#16a34a'},
    disconnected: {label: 'Reconnecting…', color: '#dc2626'},
    error: {label: 'Connection error', color: '#dc2626'},
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
        bottomRef.current?.scrollIntoView({behavior: 'smooth'});
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
        return dateFormat.format(new Date(ts));
    };

    const statusInfo = STATUS_LABELS[status];

    let lastUser: string = "";
    let lastTimestamp: string = "";

    return (
        <Panel
            title={title}
            className="h-full min-h-0"
            right={
                <div className={"flex gap-2 items-center"}>
                    <span
                        className={"h-2 w-2 rounded-full"}
                        style={{background: statusInfo.color}}
                        title={statusInfo.label}
                    />
                    <span className={"text-gray-200"}>{statusInfo.label}</span>
                </div>
            }
        >
            <div className="flex flex-col flex-1 min-h-0">
                {/* Messages */}
                <div
                    className={"flex-1 min-h-0 overflow-y-auto py-2 px-3 grid grid-cols-[10rem_10rem_auto] gap-1 auto-rows-min"}
                >
                    {messages.length === 0 && (
                        <div className={"text-center text-gray-200 mt-4 text-lg"}>No messages yet. Say hello!</div>
                    )}
                    {messages.map((msg, i) => {
                        const formattedTime = formatTime(msg.timestamp);
                        let renderTimestamp = lastTimestamp !== formattedTime;
                        const renderUser = lastUser !== msg.sender || renderTimestamp;
                        const selfStyle = currentUser === msg.sender ? "text-blue-500" : "";
                        lastUser = msg.sender || "";
                        lastTimestamp = formattedTime;
                        return (
                            <div key={i} className={"col-span-full grid grid-cols-subgrid items-start"}>
                                {renderTimestamp && (
                                    <div className={"text-gray-400"}>{formatTime(msg.timestamp)}</div>
                                )}
                                {renderUser && <div className={"font-bold truncate " + selfStyle}>{msg.sender}</div>}
                                <div className={"ps-4 col-start-3 "}>{msg.content}</div>
                            </div>
                        );
                    })}
                    <div ref={bottomRef}/>
                </div>

                {/* Input row */}
                <div className={"flex g-2 p-2 border-t border-white/10"}>
                    <input
                        className={"flex-1 border-white/10 rounded-lg p-1 outline-none text-gray-200"}
                        value={draft}
                        onChange={e => setDraft(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        disabled={status !== 'connected'}
                        maxLength={1000}
                    />
                    <button
                        className={"py-1.5 px-3 rounded-lg bg-slate-500/50 hover:bg-slate-700/50 text-white cursor-pointer transition-opacity duration-75"}
                        style={{opacity: status !== 'connected' ? 0.5 : 1}}
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