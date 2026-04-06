import type {CardSuggestion} from "@/shared/services/useCardAutocomplete.ts";

interface CardSuggestionsProps {
    suggestions: CardSuggestion[];
    activeIndex: number;
    onSelect: (card: CardSuggestion) => void;
}

export function CardSuggestions({ suggestions, activeIndex, onSelect }: CardSuggestionsProps) {
    if (!suggestions.length) return null;

    return (
        <ul
            role="listbox"
            className="absolute bottom-full mb-1 left-0 right-0 z-50
                       bg-slate-800 border border-white/10 rounded-lg
                       shadow-xl overflow-hidden"
        >
            {suggestions.map((card, i) => (
                <li
                    key={card.name}
                    role="option"
                    aria-selected={i === activeIndex}
                    onMouseDown={e => {
                        e.preventDefault(); // prevent input blur before selection
                        onSelect(card);
                    }}
                    className={[
                        'px-3 py-2 text-sm cursor-pointer transition-colors duration-75',
                        i === activeIndex
                            ? 'bg-indigo-500/30 text-indigo-200'
                            : 'text-gray-300 hover:bg-white/5',
                    ].join(' ')}
                >
                    {card.name}
                </li>
            ))}
            <li className="px-3 py-1 text-[10px] text-slate-500 border-t border-white/5">
                ↑↓ navigate · Tab/Enter select · Esc dismiss
            </li>
        </ul>
    );
}