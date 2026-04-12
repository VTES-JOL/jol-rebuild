import {Minus, Plus} from 'lucide-react';
import {useCardPreview} from '@/hooks/useCardPreview.tsx';
import type {DeckEntry} from './types';

interface Props {
    entry: DeckEntry;
    onIncrement: () => void;
    onDecrement: () => void;
    children: React.ReactNode;
}

export default function CardRowShell({ entry, onIncrement, onDecrement, children }: Props) {
    const willRemove = entry.count === 1;
    const { anchorRef, onMouseEnter, onMouseLeave, onClick, tooltip } = useCardPreview<HTMLDivElement>(entry.cardId);

    return (
        <div
            ref={anchorRef}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onClick={onClick}
            className="flex items-center px-4 py-1.5 gap-1 hover:bg-hover/50 transition-colors cursor-pointer"
        >
            {children}

            <div className="flex items-center gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
                <button
                    onClick={onDecrement}
                    title={willRemove ? 'Remove card' : 'Decrease count'}
                    className={[
                        'w-5 h-5 flex items-center justify-center rounded transition-colors',
                        willRemove
                            ? 'text-blood-soft hover:text-blood hover:bg-blood/10'
                            : 'text-ink-muted hover:text-ink hover:bg-hover',
                    ].join(' ')}
                >
                    <Minus className="w-2.5 h-2.5" />
                </button>
                <span className="text-xs text-ink text-center tabular-nums w-5">{entry.count}</span>
                <button
                    onClick={onIncrement}
                    title="Increase count"
                    className="w-5 h-5 flex items-center justify-center rounded text-ink-muted hover:text-ink hover:bg-hover transition-colors"
                >
                    <Plus className="w-2.5 h-2.5" />
                </button>
            </div>

            {tooltip}
        </div>
    );
}
