import type {CSSProperties, ReactNode} from 'react';
import {Fragment} from 'react';
import {FieldCard} from './FieldCard.tsx';

import type {CardData} from './types.ts';

export type {CardData};

export const CARD_WIDTH = 96;
export const MAX_VISIBLE = 3;

const OFFSET_X_RATIO = 0.09;
const OFFSET_Y_RATIO = 0.17;
// Falls back to CARD_WIDTH so the stack renders correctly before --card-w is set.
const CARD_VAR = `var(--card-w, ${CARD_WIDTH}px)`;

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
        const xPct = (vi * OFFSET_X_RATIO * 100).toFixed(1);
        const yMult = ((depth - vi) * OFFSET_Y_RATIO).toFixed(3);
        return {
            position: 'absolute',
            top: `calc(${CARD_VAR} * ${yMult})`,
            left: `${xPct}%`,
            right: `-${xPct}%`,
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
        <div className="relative" style={{paddingTop: `calc(${CARD_VAR} * ${(depth * OFFSET_Y_RATIO).toFixed(3)})`}}>
            {renderItem(cards[0], 0)}
            {cards.slice(1).map((card, sliceIndex) => {
                const i = sliceIndex + 1;
                return <Fragment key={i}>{renderItem(card, i)}</Fragment>;
            })}
        </div>
    );
}
