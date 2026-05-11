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

export function CardStack({cards, onCardClick}: Props) {
    if (cards.length === 0) return null;
    const n = cards.length;
    return (
        <div
            className="relative"
            style={{
                paddingTop: `${(n - 1) * OFFSET_Y}px`,
                paddingRight: `${(n - 1) * OFFSET_X}px`,
            }}
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
                return (
                    <div
                        key={i}
                        className="absolute cursor-pointer"
                        style={{
                            top: `${(n - 1 - i) * OFFSET_Y}px`,
                            left: `${i * OFFSET_X}px`,
                            right: `${(n - 1 - i) * OFFSET_X}px`,
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
