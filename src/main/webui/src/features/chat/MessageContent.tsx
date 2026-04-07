import { parseMessageTokens } from '@/features/chat/parseMessageTokens';
import { CardToken } from '@/shared/components/CardToken';

export function MessageContent({ content }: { content: string }) {
    const segments = parseMessageTokens(content);

    return (
        <span className="text-sm text-gray-300 leading-relaxed">
            {segments.map((seg, i) => {
                if (seg.type === 'card') return <CardToken key={i} id={seg.id} label={seg.label} />;
                // seg.type === 'game' will slot in here later
                return <span key={i}>{seg.type !== "game" ? seg?.content : ''}</span>;
            })}
        </span>
    );
}