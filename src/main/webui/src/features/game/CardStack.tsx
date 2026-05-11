import {FieldCard} from './FieldCard.tsx';

export type CardData = {
    id: string;
    crypt: boolean;
    faceDown?: boolean;
    locked?: boolean;
};

type Props = {
    cards: CardData[];
    onCardClick?: (index: number) => void;
};

const OFFSET_X = 12;
const OFFSET_Y = 30;
const MAX_VISIBLE = 3;

export function CardStack({cards, onCardClick}: Props) {
    if (cards.length === 0) return null;
    const n = cards.length;
    const depth = Math.min(n - 1, MAX_VISIBLE);
    return (
        <div
            className="relative"
            style={{paddingTop: `${depth * OFFSET_Y}px`}}
        >
            <div
                className="relative cursor-pointer"
                style={{zIndex: n}}
                onClick={() => onCardClick?.(0)}
            >
                <FieldCard {...cards[0]} />
            </div>
            {cards.slice(1).map((card, sliceIndex) => {
                const i = sliceIndex + 1;
                const vi = Math.min(i, MAX_VISIBLE);
                return (
                    <div
                        key={i}
                        className="absolute cursor-pointer"
                        style={{
                            top: `${(depth - vi) * OFFSET_Y}px`,
                            left: `${vi * OFFSET_X}px`,
                            right: `${-(vi * OFFSET_X)}px`,
                            zIndex: n - i,
                        }}
                        onClick={() => onCardClick?.(i)}
                    >
                        <FieldCard {...card} />
                    </div>
                );
            })}
        </div>
    );
}
