import SummaryStats from '@/shared/components/SummaryStats';
import type { Deck } from './types';

interface Props {
    deck: Deck;
    selected?: boolean;
    onClick?: () => void;
}

function formatTimestamp(iso: string): string {
    const date = new Date(iso);
    const diffDays = Math.floor((Date.now() - date.getTime()) / 86_400_000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7)  return `${diffDays}d ago`;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}


export default function DeckListItem({ deck, selected = false, onClick }: Props) {
    return (
        <button
            onClick={onClick}
            className={[
                'w-full text-left px-4 py-3 border-b border-line/50 transition-colors',
                selected
                    ? 'bg-accent/10 border-l-2 border-l-accent'
                    : 'hover:bg-hover border-l-2 border-l-transparent',
            ].join(' ')}
        >
            <div className="flex items-baseline justify-between gap-3">
                <span className={`text-sm font-semibold truncate ${selected ? 'text-accent-soft' : 'text-ink'}`}>
                    {deck.name}
                </span>
                <span className="text-[10px] text-ink-muted shrink-0">
                    {formatTimestamp(deck.timestamp)}
                </span>
            </div>
            {deck.summary && <SummaryStats summary={deck.summary} validate className="mt-1.5" />}
            {deck.comments && (
                <p className="text-xs text-ink-muted mt-0.5 line-clamp-1 leading-relaxed">
                    {deck.comments}
                </p>
            )}
        </button>
    );
}
