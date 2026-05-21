import type {ReplySnapshot} from '@/hooks/useWebSocket.ts';
import {nameColorStyle} from '@/shared/utils/avatarUtils';
import {MessageContent} from "@/features/chat/MessageContent.tsx";

interface ReplyBannerProps {
    replyTo: ReplySnapshot;
    onCancel: () => void;
}

export function ReplyBanner({ replyTo, onCancel }: ReplyBannerProps) {
    return (
        <div className="flex items-center gap-2 px-3 py-1.5 border-t border-line/60 bg-hover/30 text-xs text-ink-secondary">
            <div className="w-0.5 self-stretch rounded-full bg-accent-soft/60 shrink-0" />
            <div className="flex-1 min-w-0">
                <span className="font-medium" style={nameColorStyle(replyTo.sender)}>
                    {replyTo.sender}{' '}
                </span>
                <MessageContent className={"text-ink-muted truncate"} content={replyTo.content} />
            </div>
            <button
                onClick={onCancel}
                className="shrink-0 text-ink-muted hover:text-ink transition-colors cursor-pointer bg-transparent border-none text-sm leading-none"
                title="Cancel reply"
                aria-label="Cancel reply"
            >
                ✕
            </button>
        </div>
    );
}

export function TimestampDivider({ label }: { label: string }) {
    return (
        <div className="flex items-center gap-2 my-2">
            <div className="flex-1 h-px bg-line/50" />
            <span className="text-xs text-ink-muted whitespace-nowrap">{label}</span>
            <div className="flex-1 h-px bg-line/50" />
        </div>
    );
}
