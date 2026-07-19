import type {RefObject} from 'react';
import {useLayoutEffect, useRef} from 'react';

/** Ignore sub-threshold jitter (hover lifts translate strips by 6px). */
const MOVE_THRESHOLD_PX = 8;
/** More simultaneous movers than this means a layout/scroll shift, not card travel — snap. */
const MASS_MOVE_BAIL = 16;
const FLIGHT_MS = 320;
const TRAVEL_ANIMATION_ID = 'card-travel';

/**
 * Makes card movement read as physical motion: any element carrying
 * `data-flip-id` that changes position between commits flies from its old
 * spot to its new one (FLIP). State changes stay instant — this only paints
 * the transition — and `prefers-reduced-motion` snaps instead.
 *
 * Positions are measured relative to the root element, so window scrolling
 * doesn't register as movement. The travel transform composites over the
 * element's own transforms (a locked card stays rotated mid-flight).
 */
export function useCardTravel(rootRef: RefObject<HTMLElement | null>) {
    const prevPositions = useRef(new Map<string, {x: number; y: number}>());

    // No dependency array: measure after every commit so the "first" position
    // is always the most recent paint.
    useLayoutEffect(() => {
        const root = rootRef.current;
        if (!root) return;
        const rootRect = root.getBoundingClientRect();

        const els = new Map<string, HTMLElement>();
        root.querySelectorAll<HTMLElement>('[data-flip-id]').forEach(el => {
            const id = el.dataset.flipId;
            if (id) els.set(id, el);
        });

        const next = new Map<string, {x: number; y: number}>();
        const moved: {el: HTMLElement; dx: number; dy: number}[] = [];
        els.forEach((el, id) => {
            const rect = el.getBoundingClientRect();
            const pos = {x: rect.left - rootRect.left, y: rect.top - rootRect.top};
            next.set(id, pos);
            const prev = prevPositions.current.get(id);
            if (!prev) return;
            const dx = prev.x - pos.x;
            const dy = prev.y - pos.y;
            if (Math.abs(dx) > MOVE_THRESHOLD_PX || Math.abs(dy) > MOVE_THRESHOLD_PX) {
                moved.push({el, dx, dy});
            }
        });
        prevPositions.current = next;

        if (moved.length === 0 || moved.length > MASS_MOVE_BAIL) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        for (const {el, dx, dy} of moved) {
            // A re-move mid-flight: the measurement above already included the
            // in-flight offset, so cancelling and starting fresh is seamless.
            el.getAnimations().forEach(a => {
                if (a.id === TRAVEL_ANIMATION_ID) a.cancel();
            });
            const animation = el.animate(
                [
                    {transform: `translate(${dx}px, ${dy}px)`, zIndex: '40'},
                    {transform: 'translate(0px, 0px)', zIndex: '40'},
                ],
                {duration: FLIGHT_MS, easing: 'cubic-bezier(0.22, 0.9, 0.35, 1)', composite: 'add'},
            );
            animation.id = TRAVEL_ANIMATION_ID;
        }
    });
}
