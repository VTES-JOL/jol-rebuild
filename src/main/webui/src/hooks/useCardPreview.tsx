import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ReactPortal, RefObject } from 'react';

interface TooltipPos {
    top?: number;
    bottom?: number;
    left: number;
}

// Card aspect ratio: 358×500 — displayed at full resolution in the portal.
const IMG_W = 358;
const IMG_H = 500;
const MARGIN = 8;

function getTooltipPosition(rect: DOMRect, vw: number, vh: number): TooltipPos {
    const centeredLeft = rect.left + rect.width / 2 - IMG_W / 2;
    const left = Math.max(MARGIN, Math.min(centeredLeft, vw - IMG_W - MARGIN));

    if (rect.top >= IMG_H + MARGIN) {
        return { bottom: vh - rect.top + MARGIN, left };
    }
    if (vh - rect.bottom >= IMG_H + MARGIN) {
        return { top: rect.bottom + MARGIN, left };
    }
    return { top: Math.max(MARGIN, (vh - IMG_H) / 2), left };
}

interface CardPreview {
    anchorRef: RefObject<HTMLElement | null>;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    tooltip: ReactPortal | null;
}

/**
 * Returns hover handlers, an anchor ref, and a portal tooltip for card image previews.
 * Attach `anchorRef` to the element that triggers the preview, spread the mouse handlers,
 * and render `tooltip` anywhere in the component tree.
 */
export function useCardPreview(cardId: string | number): CardPreview {
    const [hovered, setHovered] = useState(false);
    const [pos, setPos]         = useState<TooltipPos | null>(null);
    const anchorRef             = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!hovered || !anchorRef.current) return;

        const update = () => {
            if (!anchorRef.current) return;
            const rect = anchorRef.current.getBoundingClientRect();
            setPos(getTooltipPosition(rect, window.innerWidth, window.innerHeight));
        };

        update();
        window.addEventListener('resize', update);
        window.addEventListener('scroll', update, true);
        return () => {
            window.removeEventListener('resize', update);
            window.removeEventListener('scroll', update, true);
        };
    }, [hovered]);

    const tooltip = (hovered && pos)
        ? createPortal(
            <div
                className="fixed z-9999 pointer-events-none rounded-lg border border-line/60 shadow-2xl overflow-hidden bg-panel/95 backdrop-blur-sm"
                style={{ width: IMG_W, top: pos.top, bottom: pos.bottom, left: pos.left }}
            >
                <img
                    src={`https://static.deckserver.net/images/${cardId}`}
                    alt=""
                    width={IMG_W}
                    height={IMG_H}
                    className="block w-full h-auto"
                    onError={e => (e.currentTarget.style.display = 'none')}
                />
            </div>,
            document.body
        )
        : null;

    return {
        anchorRef,
        onMouseEnter: () => setHovered(true),
        onMouseLeave: () => setHovered(false),
        tooltip,
    };
}
