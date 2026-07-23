import {MessageSquare, X} from 'lucide-react';
import {useEffect, useState} from 'react';
import {createPortal} from 'react-dom';
import {ChatPanel} from '@/features/chat/ChatPanel.tsx';
import {useMediaQuery} from '@/hooks/useMediaQuery.ts';
import type {ChatMsg, CommandLogMsg} from '@/hooks/useWebSocket.ts';
import {unreadTalkCount} from './chatUnread.ts';
import {useLastRead} from './useLastRead.ts';

type Status = 'connecting' | 'connected' | 'disconnected' | 'error';

export type GameChatRailProps = {
    gameId: string;
    messages: (ChatMsg | CommandLogMsg)[];
    status: Status;
    currentUser: string;
    onSend: (content: string, replyToId?: string) => void;
    onReact: (messageId: string, emoji: string) => void;
    /** Controlled drawer state (the Dock's Chat tab); omit for the rail's own toggle. */
    drawerOpen?: boolean;
    onDrawerOpenChange?: (open: boolean) => void;
};

/**
 * Table talk and the game log as one stream (log lines render quieter; the
 * Full/Brief/Off chips filter them). Presence follows the blueprint's density
 * map: a permanent rail from lg up, a badged toggle opening a slide-over on
 * tablet, and below sm the Dock's Chat tab driving the same slide-over via
 * the controlled props. The unread divider marks where the viewer left off —
 * the last-read position persists per game in localStorage until the
 * server-side marker from the blueprint's Gaps table exists.
 */
export function GameChatRail({gameId, messages, status, currentUser, onSend, onReact, drawerOpen: drawerOpenProp, onDrawerOpenChange}: GameChatRailProps) {
    // The divider position is frozen at mount inside the hook.
    const {initialLastRead: unreadAfterId, readLastRead, markRead} = useLastRead(gameId);
    const [drawerOpenState, setDrawerOpenState] = useState(false);
    const drawerOpen = drawerOpenProp ?? drawerOpenState;
    const setDrawerOpen = (open: boolean) => {
        setDrawerOpenState(open);
        onDrawerOpenChange?.(open);
    };
    const railVisible = useMediaQuery('(min-width: 1024px)');

    // Mark read only while the stream is actually on screen.
    const latestId = messages.length > 0 ? messages[messages.length - 1].id : null;
    useEffect(() => {
        if (latestId && (railVisible || drawerOpen)) {
            markRead(latestId);
        }
    }, [latestId, railVisible, drawerOpen, markRead]);

    // Unread badge (collapsed state only): talk messages after the persisted
    // last-read. Reading the store at render time is deliberate — it only
    // advances while the stream is visible, when the badge is hidden anyway.
    const unreadTalk = unreadTalkCount(messages, readLastRead(), currentUser);

    const panel = (
        <ChatPanel
            title="Table Talk"
            messages={messages}
            status={status}
            currentUser={currentUser}
            onSend={onSend}
            onReact={onReact}
            enableAvatars={false}
            enableCommandLogFilter
            unreadAfterId={unreadAfterId}
            placeholder="Say something to the table…"
        />
    );

    return (
        <>
            {/* w-96 waits for 2xl: at xl a 384px rail squeezes the Stage under its 1024px three-tableau threshold */}
            <aside className="hidden lg:flex w-80 2xl:w-96 shrink-0 min-h-0 flex-col" aria-label="Table talk">
                {panel}
            </aside>

            {/* Tablet toggle — below sm the Dock's Chat tab owns this entry point */}
            <button
                type="button"
                className="hidden sm:flex lg:hidden fixed bottom-4 right-4 z-40 items-center justify-center w-11 h-11 rounded-full border border-line/60 bg-panel shadow-lg text-ink-muted hover:text-ink transition-colors"
                onClick={() => setDrawerOpen(true)}
                aria-label={unreadTalk > 0 ? `Open table talk, ${unreadTalk} unread` : 'Open table talk'}
            >
                <MessageSquare size={18} />
                {unreadTalk > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1 rounded-full bg-blood text-white text-[10px] font-bold flex items-center justify-center">
                        {unreadTalk > 99 ? '99+' : unreadTalk}
                    </span>
                )}
            </button>

            {drawerOpen && createPortal(
                <div className="lg:hidden fixed inset-0 z-50 flex justify-end" role="dialog" aria-label="Table talk">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
                    <div className="relative h-full w-80 max-w-[85vw] flex flex-col bg-base border-l border-line/60 shadow-2xl">
                        <button
                            type="button"
                            className="absolute top-2 right-2 z-10 text-ink-muted hover:text-ink transition-colors"
                            onClick={() => setDrawerOpen(false)}
                            aria-label="Close table talk"
                        >
                            <X size={16} />
                        </button>
                        {panel}
                    </div>
                </div>,
                document.body,
            )}
        </>
    );
}
