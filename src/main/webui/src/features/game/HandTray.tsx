import type {CSSProperties} from 'react';
import {useEffect, useRef, useState} from 'react';
import type {CardData, RegionState} from './types.ts';
import type {CardRef, GameCommand} from './gameCommands.ts';
import {HandStrip} from './HandStrip.tsx';

// At max width, cards are ~200% taller than a normal 72px-wide card (72 * 7/5 ≈ 100px → 200px → 143px wide).
const MAX_CARD_W = 143;
const CARD_GAP = 8;

type HandTrayProps = {
    playerName: string;
    hand: RegionState;
    cards: Record<string, CardData>;
    gameId?: string;
    onCommand?: (cmd: GameCommand) => void;
    onCardContextMenu?: (card: CardData, ref: CardRef, x: number, y: number) => void;
};

export function HandTray({playerName, hand, cards, gameId, onCommand, onCardContextMenu}: HandTrayProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [cardW, setCardW] = useState(MAX_CARD_W);
    const count = hand.cardIds.length;

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const recompute = () => {
            if (count === 0) { setCardW(MAX_CARD_W); return; }
            const available = el.clientWidth - (count - 1) * CARD_GAP;
            setCardW(Math.min(MAX_CARD_W, Math.max(44, available / count)));
        };
        recompute();
        const obs = new ResizeObserver(recompute);
        obs.observe(el);
        return () => obs.disconnect();
    }, [count]);

    return (
        <div
            ref={containerRef}
            className="w-full shrink-0 border-t border-line/30 pt-2"
            style={{'--card-w': `${cardW}px`} as CSSProperties}
        >
            <HandStrip
                playerName={playerName}
                hand={hand}
                cards={cards}
                gameId={gameId}
                onCommand={onCommand}
                onCardContextMenu={onCardContextMenu}
            />
        </div>
    );
}
