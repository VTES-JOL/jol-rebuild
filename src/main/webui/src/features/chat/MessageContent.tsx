import {parseMessageTokens} from '@/shared/utils/parseMessageTokens.ts';
import {CardToken} from '@/shared/components/CardToken';
import GameToken from "@/shared/components/GameToken.tsx";

export function MessageContent({ content, className }: { content: string, className?: string }) {
    const segments = parseMessageTokens(content);

    return (
        <span className={`text-sm text-gray-300 leading-relaxed ${className ?? ''}`}>
            {segments.map((seg, i) => {
                if (seg.type === 'card') return <CardToken key={i} id={seg.id} label={seg.label} />;
                if (seg.type === 'game') return <GameToken key={i} id={seg.id} label={seg.label} /> ;
                // seg.type === 'game' will slot in here later
                return <span key={i}>{seg?.content}</span>;
            })}
        </span>
    );
}