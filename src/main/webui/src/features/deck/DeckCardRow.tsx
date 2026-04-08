import { Minus, Plus, TriangleAlert } from 'lucide-react';
import type { DeckEntry } from './types';

interface Props {
    entry: DeckEntry;
    onIncrement: () => void;
    onDecrement: () => void;
}

export default function DeckCardRow({ entry, onIncrement, onDecrement }: Props) {
    const willRemove = entry.count === 1;

    return (
        <div className="flex items-center justify-between px-4 py-1.5 hover:bg-hover/50 transition-colors">
            <div className="flex items-center gap-1.5 min-w-0">
                <span className={`text-xs truncate ${entry.banned ? 'text-blood-soft' : 'text-ink-secondary'}`}>
                    {entry.name}
                </span>
                {entry.banned && (
                    <TriangleAlert className="w-3 h-3 text-blood-soft shrink-0" />
                )}
            </div>

            <div className="flex items-center gap-0.5 shrink-0 ml-2">
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
        </div>
    );
}
