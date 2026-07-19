import type {ButtonHTMLAttributes, HTMLAttributes, ReactNode} from 'react';
import {forwardRef, Fragment, useEffect, useRef, useState} from 'react';
import {CounterBadge} from '@/shared/components/CounterBadge.tsx';
import {cardImage, describeCard, isCryptCard} from './cardDisplay.ts';
import {FieldCard} from './FieldCard.tsx';
import type {CardData} from './types.ts';

/** Visible band per tucked card at rest. */
export const STRIP_HEIGHT = 22;
/** Visible band per tucked card when fanned (touch) — meets the ≥32px touch-target rule with overlap. */
export const FAN_STRIP_HEIGHT = 36;
/** Extra height tucked out of sight behind the layer in front. */
const STRIP_OVERLAP = 8;

// ── TuckStrip ─────────────────────────────────────────────────────────────────
// The visible name band of one tucked card. A real button: clickable, focusable,
// and a valid target for drag listeners spread via ...rest (see FieldRegion).

export type TuckStripProps = {
    card: CardData;
    top: number;
    height: number;
    zIndex: number;
    /** Identity for the card-travel FLIP layer (rendered as data-flip-id). */
    flipId?: string;
    dimmed?: boolean;
    dragCursor?: boolean;
    suppressTransition?: boolean;
    /** Whether the owning stack is fanned out (touch mode). */
    fanned?: boolean;
    /** Requests the owning stack to fan out; the first touch tap lands here instead of selecting. */
    onRequestFan?: () => void;
    onClick?: () => void;
    onContextMenu?: (x: number, y: number) => void;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'onContextMenu' | 'className' | 'style'>;

export const TuckStrip = forwardRef<HTMLButtonElement, TuckStripProps>(function TuckStrip(
    {card, top, height, zIndex, flipId, dimmed = false, dragCursor = false, suppressTransition = false, fanned = false, onRequestFan, onClick, onContextMenu, onPointerDown, ...rest},
    ref,
) {
    const isCrypt = isCryptCard(card);
    const lastPointerType = useRef('mouse');
    return (
        <button
            ref={ref}
            type="button"
            data-flip-id={flipId}
            aria-label={`Attached: ${describeCard(card)}`}
            title={card.name}
            className={[
                'absolute left-0 w-full overflow-hidden rounded-t-md border border-black/40 text-left',
                'shadow-[0_-1px_3px_rgba(0,0,0,0.4)]',
                dragCursor ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
                !suppressTransition && 'transition-[top,transform,height] duration-150 motion-reduce:transition-none',
                'hover:-translate-y-1.5 focus-visible:-translate-y-1.5',
                'focus-visible:outline-2 focus-visible:outline-arcane focus-visible:z-30',
                dimmed && 'opacity-30',
            ].filter(Boolean).join(' ')}
            style={{
                top: `${top}px`,
                height: `${height}px`,
                zIndex,
                backgroundImage: `url(${cardImage(card)})`,
                backgroundSize: '100% auto',
                backgroundPosition: 'top center',
            }}
            onPointerDown={e => { lastPointerType.current = e.pointerType; onPointerDown?.(e); }}
            onClick={() => {
                if (onRequestFan && !fanned && lastPointerType.current === 'touch') {
                    onRequestFan();
                    return;
                }
                onClick?.();
            }}
            onContextMenu={onContextMenu ? e => {
                e.preventDefault();
                onContextMenu(e.clientX, e.clientY);
            } : undefined}
            {...rest}
        >
            <span className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-transparent" aria-hidden="true" />
            <span className="relative flex items-center gap-1 px-1.5 pt-0.5">
                <span className="min-w-0 flex-1 truncate text-[10px] font-semibold leading-4 text-white drop-shadow">
                    {card.faceDown ? '·····' : (card.name ?? `Card ${card.cardId ?? card.id}`)}
                </span>
                {card.counters != null && card.counters > 0 && (
                    <CounterBadge type={isCrypt ? 'blood' : 'generic'} amount={card.counters} size={14} />
                )}
            </span>
        </button>
    );
});

// ── TuckParentFrame ───────────────────────────────────────────────────────────
// Positions the parent card in front of its strips and closes the rotation gap
// when the parent is locked. Drag listeners spread via ...rest.

export type TuckParentFrameProps = {
    card: CardData;
    zIndex: number;
    /** A locked card rotates about its center, leaving (7/5 − 1)/2 = 0.2 × card-width
     *  of empty box above its visual edge; close that gap so strips stay tucked. */
    closeLockedGap: boolean;
    /** Identity for the card-travel FLIP layer (rendered as data-flip-id). */
    flipId?: string;
    dimmed?: boolean;
    dragCursor?: boolean;
    suppressTransition?: boolean;
    onClick?: () => void;
    onContextMenu?: (x: number, y: number) => void;
} & Omit<HTMLAttributes<HTMLDivElement>, 'onClick' | 'onContextMenu' | 'className' | 'style'>;

export const TuckParentFrame = forwardRef<HTMLDivElement, TuckParentFrameProps>(function TuckParentFrame(
    {card, zIndex, closeLockedGap, flipId, dimmed = false, dragCursor = false, suppressTransition = false, onClick, onContextMenu, ...rest},
    ref,
) {
    return (
        <div
            ref={ref}
            data-flip-id={flipId}
            className={[
                'relative',
                dragCursor ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
                !suppressTransition && 'transition-[margin] duration-200 motion-reduce:transition-none',
                dimmed && 'opacity-30',
            ].filter(Boolean).join(' ')}
            style={{
                zIndex,
                marginTop: closeLockedGap ? 'calc(var(--card-w, 96px) * -0.2)' : undefined,
            }}
            onClick={onClick}
            onContextMenu={onContextMenu ? e => {
                e.preventDefault();
                onContextMenu(e.clientX, e.clientY);
            } : undefined}
            {...rest}
        >
            <FieldCard {...card} suppressTransition={suppressTransition} />
        </div>
    );
});

// ── TuckStack ─────────────────────────────────────────────────────────────────

type Props = {
    /** Parent card at index 0; attached (tucked) cards at 1+. */
    cards: CardData[];
    onCardClick?: (index: number) => void;
    onCardContextMenu?: (index: number, x: number, y: number) => void;
    suppressTransition?: boolean;
    /** Custom strip element — lets FieldRegion make each strip a drag source. */
    renderStrip?: (card: CardData, cardIndex: number, props: TuckStripProps) => ReactNode;
    /** Custom parent element — lets FieldRegion make the parent a drag source. */
    renderParent?: (card: CardData, props: TuckParentFrameProps) => ReactNode;
};

/**
 * A card stack rendered the way players tuck cards at a real table: the parent
 * card in front, attachments behind it with only their name strips showing.
 *
 * Interaction model (see docs/implementation/board-design.md — Card anatomy):
 * - Every strip is a real button: click selects, right-click opens the context
 *   menu, Tab/Enter work, hover or focus lifts the strip.
 * - Touch: the first tap fans the strips out to full touch-target height; the
 *   second tap selects. Tapping elsewhere or Escape collapses the fan.
 */
export function TuckStack({cards, onCardClick, onCardContextMenu, suppressTransition = false, renderStrip, renderParent}: Props) {
    const [fanned, setFanned] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);

    const tucks = cards.slice(1);
    const tuckCount = tucks.length;

    useEffect(() => {
        if (!fanned) return;
        const onPointerDown = (e: PointerEvent) => {
            if (!rootRef.current?.contains(e.target as Node)) setFanned(false);
        };
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setFanned(false);
        };
        document.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('pointerdown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [fanned]);

    if (cards.length === 0) return null;

    const stripH = fanned ? FAN_STRIP_HEIGHT : STRIP_HEIGHT;

    function handleParentClick() {
        setFanned(false);
        onCardClick?.(0);
    }

    const parentProps: TuckParentFrameProps = {
        card: cards[0],
        zIndex: tuckCount + 1,
        closeLockedGap: cards[0].locked === true && tuckCount > 0,
        flipId: cards[0].id,
        suppressTransition,
        onClick: handleParentClick,
        onContextMenu: onCardContextMenu ? (x, y) => onCardContextMenu(0, x, y) : undefined,
    };

    return (
        <div
            ref={rootRef}
            className={[
                'relative',
                !suppressTransition && 'transition-[padding] duration-150 motion-reduce:transition-none',
            ].filter(Boolean).join(' ')}
            style={{paddingTop: `${tuckCount * stripH}px`}}
        >
            {tucks.map((card, ti) => {
                const cardIndex = ti + 1;
                const stripProps: TuckStripProps = {
                    card,
                    top: (tuckCount - 1 - ti) * stripH,
                    height: stripH + STRIP_OVERLAP,
                    zIndex: tuckCount - ti,
                    flipId: card.id,
                    suppressTransition,
                    fanned,
                    onRequestFan: () => setFanned(true),
                    onClick: () => onCardClick?.(cardIndex),
                    onContextMenu: onCardContextMenu ? (x, y) => onCardContextMenu(cardIndex, x, y) : undefined,
                };
                return (
                    <Fragment key={card.id}>
                        {renderStrip ? renderStrip(card, cardIndex, stripProps) : <TuckStrip {...stripProps} />}
                    </Fragment>
                );
            })}
            {renderParent ? renderParent(cards[0], parentProps) : <TuckParentFrame {...parentProps} />}
        </div>
    );
}
