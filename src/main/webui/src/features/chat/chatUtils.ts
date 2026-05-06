import type {ChatMsg} from '@/hooks/useWebSocket.ts';
import type {MessageLine} from '@/features/chat/MessageLineView.tsx';

export interface MessageGroup {
    sender: string;
    dividerTimestamp: string | null;
    shortTime: string;
    isSelf: boolean;
    lines: MessageLine[];
}

const dateFormat = new Intl.DateTimeFormat('UTC', { dateStyle: 'medium', timeStyle: 'short' });
const timeOnlyFormat = new Intl.DateTimeFormat('UTC', { timeStyle: 'short' });

export function groupMessages(messages: ChatMsg[], currentUser: string): MessageGroup[] {
    const groups: MessageGroup[] = [];
    let lastSender = '';
    let lastFormattedFull = '';

    for (const msg of messages) {
        const sender = msg.sender;
        const isSelf = sender === currentUser;
        const fullTs = dateFormat.format(new Date(msg.timestamp));
        const shortTs = timeOnlyFormat.format(new Date(msg.timestamp));

        const timestampChanged = fullTs !== lastFormattedFull;
        const senderChanged = sender !== lastSender;
        const hasReply = !!msg.replyTo;

        const line: MessageLine = {
            id: msg.id,
            content: msg.content,
            reactions: msg.reactions,
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
