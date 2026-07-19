import {MessageSquare, X} from 'lucide-react';
import {useEffect, useState} from 'react';
import {createPortal} from 'react-dom';
import {ChatPanel} from '@/features/chat/ChatPanel.tsx';
import type {ChatMsg, CommandLogMsg} from '@/hooks/useWebSocket.ts';

type Status = 'connecting' | 'connected' | 'disconnected' | 'error';

const lastReadKey = (gameId: string) => `jol.game.${gameId}.lastRead`;

export type GameChatRailProps = {
    gameId: string;
    messages: (ChatMsg | CommandLogMsg)[];
    status: Status;
    currentUser: string;
    onSend: (content: string, replyToId?: string) => void;
    onReact: (messageId: string, emoji: string) => void;
};

/**
 * Table talk and the game log as one stream (log lines render quieter; the
 * Full/Brief/Off chips filter them). Presence follows the blueprint's density
 * map: a permanent rail from lg up, a badged toggle opening a slide-over
 * below. The unread divider marks where the viewer left off — the last-read
 * position persists per game in localStorage until the server-side marker
 * from the blueprint's Gaps table exists.
 */
export function GameChatRail({gameId, messages, status, currentUser, onSend, onReact}: GameChatRailProps) {
    // Frozen at mount so the divider doesn't chase the reader down the stream.
    const [unreadAfterId] = useState<string | null>(() => localStorage.getItem(lastReadKey(gameId)));
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [railVisible, setRailVisible] = useState(() => window.matchMedia('(min-width: 1024px)').matches);

    useEffect(() => {
        const mq = window.matchMedia('(min-width: 1024px)');
        const onChange = (e: MediaQueryListEvent) => setRailVisible(e.matches);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    // Mark read only while the stream is actually on screen.
    const latestId = messages.length > 0 ? messages[messages.length - 1].id : null;
    useEffect(() => {
        if (latestId && (railVisible || drawerOpen)) {
            localStorage.setItem(lastReadKey(gameId), latestId);
        }
    }, [latestId, railVisible, drawerOpen, gameId]);

    // Unread badge (collapsed state only): talk messages after the persisted
    // last-read. Reading localStorage at render time is deliberate — it only
    // advances while the stream is visible, when the badge is hidden anyway.
    const storedLastRead = localStorage.getItem(lastReadKey(gameId));
    const storedIdx = storedLastRead ? messages.findIndex(m => m.id === storedLastRead) : -1;
    const unreadTalk = messages.slice(storedIdx + 1)
        .filter(m => m.type === 'CHAT' && m.sender !== currentUser).length;

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

            <button
                type="button"
                className="lg:hidden fixed bottom-4 right-4 z-40 flex items-center justify-center w-11 h-11 rounded-full border border-line/60 bg-panel shadow-lg text-ink-muted hover:text-ink transition-colors"
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
