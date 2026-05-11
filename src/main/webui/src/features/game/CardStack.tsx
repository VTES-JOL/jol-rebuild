import {Fragment} from 'react';
import type {CSSProperties, ReactNode} from 'react';
import {FieldCard} from './FieldCard.tsx';

export type CardData = {
    id: string;
    crypt: boolean;
    faceDown?: boolean;
    locked?: boolean;
};

export const CARD_WIDTH = 96;
export const OFFSET_X = Math.round(CARD_WIDTH * 0.09);
export const OFFSET_Y = Math.round(CARD_WIDTH * 0.17);
export const MAX_VISIBLE = 3;

type Props = {
    cards: CardData[];
    onCardClick?: (index: number) => void;
    renderCard?: (card: CardData, index: number, style: CSSProperties) => ReactNode;
};

export function CardStack({cards, onCardClick, renderCard}: Props) {
    if (cards.length === 0) return null;
    const n = cards.length;
    const depth = Math.min(n - 1, MAX_VISIBLE);

    function itemStyle(i: number): CSSProperties {
        if (i === 0) return {position: 'relative', zIndex: n};
        const vi = Math.min(i, MAX_VISIBLE);
        return {
            position: 'absolute',
            top: `${(depth - vi) * OFFSET_Y}px`,
            left: `${vi * OFFSET_X}px`,
            right: `${-(vi * OFFSET_X)}px`,
            zIndex: n - i,
        };
    }

    function renderItem(card: CardData, i: number): ReactNode {
        const style = itemStyle(i);
        if (renderCard) return renderCard(card, i, style);
        return (
            <div className="cursor-pointer" style={style} onClick={() => onCardClick?.(i)}>
                <FieldCard {...card} />
            </div>
        );
    }

    return (
        <div className="relative" style={{paddingTop: `${depth * OFFSET_Y}px`}}>
            {renderItem(cards[0], 0)}
            {cards.slice(1).map((card, sliceIndex) => {
                const i = sliceIndex + 1;
                return <Fragment key={i}>{renderItem(card, i)}</Fragment>;
            })}
        </div>
    );
}
