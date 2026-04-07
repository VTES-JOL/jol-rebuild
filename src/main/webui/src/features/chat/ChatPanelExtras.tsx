import type {ReplySnapshot} from '@/hooks/useWebSocket.ts';
import { nameColorStyle } from '@/shared/utils/avatarUtils';

interface ReplyBannerProps {
    replyTo: ReplySnapshot;
    onCancel: () => void;
}

export function ReplyBanner({ replyTo, onCancel }: ReplyBannerProps) {
    return (
        <div className="flex items-center gap-2 px-3 py-1.5 border-t border-white/10 bg-white/5 text-xs text-slate-300">
            <div className="w-0.5 self-stretch rounded-full bg-indigo-400/60 shrink-0" />
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
            <div className="flex-1 h-px bg-slate-200/10" />
            <span className="text-sm text-slate-300 whitespace-nowrap">{label}</span>
            <div className="flex-1 h-px bg-slate-200/10" />
        </div>
    );
}
