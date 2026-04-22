import React from 'react';
import type {ReplySnapshot} from '@/hooks/useWebSocket.ts';
import {nameColorStyle} from '@/shared/utils/avatarUtils';
import Avatar from '@/shared/components/Avatar';
import {MessageLineView} from './MessageLineView';
import type {MessageGroup} from './chatUtils.ts';

export type { MessageGroup };

function AvatarWithLine({ name, showLine }: { name: string; showLine: boolean }) {
    return (
        <div className="flex flex-col items-center w-7 shrink-0 cursor-default">
            <Avatar username={name} size="sm" />
            {showLine && <div className="w-px flex-1 bg-line/40 mt-1" />}
        </div>
    );
}

interface MessageGroupViewProps {
    group: MessageGroup;
    showLine: boolean;
    currentUser: string;
    onReact: (messageId: string, emoji: string) => void;
    onReply: (snapshot: ReplySnapshot) => void;
    onJumpTo: (id: string) => void;
    disabled: boolean;
    enableReactions: boolean;
    enableReply: boolean;
}

export const MessageGroupView = React.memo(function MessageGroupView({
    group,
    showLine,
    currentUser,
    onReact,
    onReply,
    onJumpTo,
    disabled,
    enableReactions,
    enableReply,
}: MessageGroupViewProps) {
    return (
        <div className="flex gap-2.5 mb-2.5">
            <AvatarWithLine name={group.sender} showLine={showLine} />
            <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="text-sm font-medium" style={nameColorStyle(group.sender)}>
                        {group.sender}
                    </span>
                    {group.shortTime && (
                        <span className="text-[10px] text-ink-muted cursor-default">{group.shortTime}</span>
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
});
