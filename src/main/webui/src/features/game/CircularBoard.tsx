import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import type {CSSProperties} from 'react';
import type {CardData, GameState, PlayerState} from './types.ts';
import {PlayerColumn} from './PlayerColumn.tsx';
import type {CardRef, GameCommand} from './gameCommands.ts';

const GAP = 12; // gap-3 = 12px between slots

function baseTranslate(colW: number) { return -(colW + GAP); }
function setStripX(strip: HTMLDivElement | null, px: number) {
    if (strip) strip.style.transform = `translateX(${px}px)`;
}

function EmptySlot({label}: {label?: string}) {
    return (
        <div className="h-full rounded-lg border border-dashed border-line/30 flex items-center justify-center text-xs text-ink-muted/40">
            {label}
        </div>
    );
}

export type CircularBoardProps = {
    orderedPlayers: PlayerState[];
    cards: Record<string, CardData>;
    currentUser: string;
    gameState: GameState;
    gameId?: string;
    onCommand?: (cmd: GameCommand) => void;
    onCardContextMenu?: (card: CardData, ref: CardRef, x: number, y: number) => void;
};

export function CircularBoard({orderedPlayers, cards, currentUser, gameState, gameId, onCommand, onCardContextMenu}: CircularBoardProps) {
    const initialFocus =
        orderedPlayers.find(p => p.name === currentUser)?.name ??
        gameState.currentPlayer ??
        orderedPlayers[0]?.name;

    const [focusedName, setFocusedName] = useState(initialFocus);
    const [colWidth, setColWidth] = useState(0);

    // If the focused player has been ousted and removed from the list, shift focus to the first remaining player.
    useEffect(() => {
        if (!orderedPlayers.find(p => p.name === focusedName) && orderedPlayers.length > 0) {
            setFocusedName(orderedPlayers[0].name);
        }
    }, [orderedPlayers, focusedName]);

    const clipRef     = useRef<HTMLDivElement>(null);
    const stripRef    = useRef<HTMLDivElement>(null);
    const colWidthRef = useRef(0);
    const animating   = useRef(false);
    const dragState   = useRef<{
        startX: number; startY: number;
        pointerId: number; isDragging: boolean;
    } | null>(null);

    // Measure column width; skip re-render if dragging (update ref only)
    useLayoutEffect(() => {
        const el = clipRef.current;
        if (!el) return;
        const measure = () => {
            const w = Math.floor((el.clientWidth - 2 * GAP) / 3);
            colWidthRef.current = w;
            if (!dragState.current?.isDragging) setColWidth(w);
        };
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => {
            ro.disconnect();
            animating.current = false;
            if (stripRef.current) stripRef.current.style.transition = 'none';
        };
    }, []);

    // Keep strip at rest position when colWidth changes (initial placement + resize)
    useLayoutEffect(() => {
        if (colWidth > 0) setStripX(stripRef.current, baseTranslate(colWidth));
    }, [colWidth]);

    // After focusedName change commits new slot content to DOM, reset strip position
    // in the same frame (useLayoutEffect runs before paint) to eliminate flicker.
    useLayoutEffect(() => {
        const colW = colWidthRef.current;
        if (colW > 0) {
            setStripX(stripRef.current, baseTranslate(colW));
            animating.current = false;
        }
    }, [focusedName]);

    function snapTo(targetX: number, newName: string) {
        animating.current = true;
        const strip = stripRef.current;
        if (!strip) return;

        const commit = () => {
            strip.style.transition = 'none';
            strip.style.willChange = 'auto';
            setFocusedName(newName);
        };

        // If the strip is already at the target (user dragged to the clamp boundary),
        // transitionend would never fire — commit directly to avoid permanent lock.
        const match = /translateX\((-?[\d.]+)px\)/.exec(strip.style.transform);
        const currentX = match ? parseFloat(match[1]) : 0;
        if (Math.abs(currentX - targetX) < 1) {
            commit();
            return;
        }

        strip.style.willChange = 'transform';
        strip.style.transition = 'transform 280ms cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        setStripX(strip, targetX);
        strip.addEventListener('transitionend', commit, {once: true});
    }

    function snapBack() {
        animating.current = true;
        const strip = stripRef.current;
        if (!strip) return;
        strip.style.willChange = 'transform';
        strip.style.transition = 'transform 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        setStripX(strip, baseTranslate(colWidthRef.current));
        strip.addEventListener('transitionend', () => {
            strip.style.transition = 'none';
            strip.style.willChange = 'auto';
            animating.current = false;
        }, {once: true});
    }

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (animating.current) return;
        if ((e.target as HTMLElement).closest('button,a,input,[role="button"]')) return;
        dragState.current = {startX: e.clientX, startY: e.clientY, pointerId: e.pointerId, isDragging: false};
    };

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const state = dragState.current;
        if (!state || animating.current) return;
        const dx = e.clientX - state.startX;
        const dy = e.clientY - state.startY;
        if (!state.isDragging) {
            if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
            // Yield vertical motion to DnD-kit card drags
            if (Math.abs(dy) > Math.abs(dx)) { dragState.current = null; return; }
            state.isDragging = true;
            e.currentTarget.setPointerCapture(state.pointerId);
        }
        e.preventDefault();
        const colW = colWidthRef.current;
        const clamped = Math.max(-(colW + GAP), Math.min(colW + GAP, dx));
        setStripX(stripRef.current, baseTranslate(colW) + clamped);
    };

    const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        const state = dragState.current;
        dragState.current = null;
        if (!state) return;
        if (state.isDragging) e.currentTarget.releasePointerCapture(state.pointerId);
        if (!state.isDragging) return;
        const dx = e.clientX - state.startX;
        const colW = colWidthRef.current;
        const threshold = Math.max(60, colW * 0.25);
        if (dx < -threshold && predator)      snapTo(-(2 * (colW + GAP)), predator.name);
        else if (dx > threshold && prey)      snapTo(0, prey.name);
        else                                  snapBack();
    };

    const onPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
        const state = dragState.current;
        dragState.current = null;
        if (state?.isDragging) {
            e.currentTarget.releasePointerCapture(state.pointerId);
            snapBack();
        }
    };

    // With ≤2 active players the predator/prey strip produces duplicates — use a simple layout instead.
    if (orderedPlayers.length <= 2) {
        return (
            <div
                className="h-full flex gap-3 overflow-hidden"
                style={{'--card-w': 'clamp(66px, 5.25vw, 84px)'} as CSSProperties}
            >
                {orderedPlayers.map(p => (
                    <div key={p.name} className="flex-1 min-w-0 h-full">
                        <PlayerColumn
                            player={p}
                            cards={cards}
                            role={p.name === currentUser ? 'focused' : 'prey'}
                            isFocused={p.name === gameState.currentPlayer}
                            isCurrentUser={p.name === currentUser}
                            gameId={gameId}
                            onCommand={onCommand}
                            onCardContextMenu={onCardContextMenu}
                        />
                    </div>
                ))}
            </div>
        );
    }

    const focused  = orderedPlayers.find(p => p.name === focusedName);
    const prey     = focused?.prey      ? orderedPlayers.find(p => p.name === focused.prey)            : undefined;
    const predator = focused?.predator  ? orderedPlayers.find(p => p.name === focused.predator)        : undefined;
    const prevPrev = prey?.prey         ? orderedPlayers.find(p => p.name === prey.prey)               : undefined;
    const nextNext = predator?.predator ? orderedPlayers.find(p => p.name === predator.predator)       : undefined;

    const isActive = (player: PlayerState | undefined) => player?.name === gameState.currentPlayer;

    const slot: CSSProperties = {width: colWidth, flexShrink: 0};

    return (
        <div
            ref={clipRef}
            className="relative overflow-x-hidden h-full select-none"
            style={{'--card-w': 'clamp(66px, 5.25vw, 84px)'} as CSSProperties}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
        >
            {colWidth > 0 && (
                <div
                    ref={stripRef}
                    className="flex h-full"
                    style={{width: `${5 * colWidth + 4 * GAP}px`, gap: `${GAP}px`}}
                >
                    {/* Slot 0 — prevPrev (ghost, clipped) */}
                    <div style={slot} className="h-full">
                        {prevPrev
                            ? <PlayerColumn key={prevPrev.name} player={prevPrev} cards={cards} role="prey"
                                            isFocused={isActive(prevPrev)}
                                            isCurrentUser={prevPrev.name === currentUser}
                                            gameId={gameId} onCommand={onCommand} onCardContextMenu={onCardContextMenu} />
                            : <EmptySlot />}
                    </div>

                    {/* Slot 1 — prey */}
                    <div style={slot} className="h-full">
                        {prey
                            ? <PlayerColumn key={prey.name} player={prey} cards={cards} role="prey"
                                            isFocused={isActive(prey)}
                                            isCurrentUser={prey.name === currentUser}
                                            gameId={gameId} onCommand={onCommand} onCardContextMenu={onCardContextMenu} />
                            : <EmptySlot label="no prey" />}
                    </div>

                    {/* Slot 2 — focused */}
                    <div style={slot} className="h-full">
                        {focused && (
                            <PlayerColumn key={focused.name} player={focused} cards={cards} role="focused"
                                          isFocused={isActive(focused)}
                                          isCurrentUser={focused.name === currentUser}
                                          gameId={gameId} onCommand={onCommand} onCardContextMenu={onCardContextMenu} />
                        )}
                    </div>

                    {/* Slot 3 — predator */}
                    <div style={slot} className="h-full">
                        {predator
                            ? <PlayerColumn key={predator.name} player={predator} cards={cards} role="predator"
                                            isFocused={isActive(predator)}
                                            isCurrentUser={predator.name === currentUser}
                                            gameId={gameId} onCommand={onCommand} onCardContextMenu={onCardContextMenu} />
                            : <EmptySlot label="no predator" />}
                    </div>

                    {/* Slot 4 — nextNext (ghost, clipped) */}
                    <div style={slot} className="h-full">
                        {nextNext
                            ? <PlayerColumn key={nextNext.name} player={nextNext} cards={cards} role="predator"
                                            isFocused={isActive(nextNext)}
                                            isCurrentUser={nextNext.name === currentUser}
                                            gameId={gameId} onCommand={onCommand} onCardContextMenu={onCardContextMenu} />
                            : <EmptySlot />}
                    </div>
                </div>
            )}
        </div>
    );
}
