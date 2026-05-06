import type {ReactPortal, RefObject} from 'react';
import {useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';

interface TooltipPos {
    top?: number;
    bottom?: number;
    left: number;
}

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

interface CardPreview<T extends HTMLElement> {
    anchorRef: RefObject<T | null>;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onClick: (e: React.MouseEvent) => void;
    tooltip: ReactPortal | null;
}

/**
 * Returns hover handlers, a typed anchor ref, and a portal tooltip for card image previews.
 * Generic T lets callers avoid unsafe ref casts:
 *   const { anchorRef } = useCardPreview<HTMLDivElement>(id);
 */
export function useCardPreview<T extends HTMLElement = HTMLElement>(cardId: string | number): CardPreview<T> {
    const [visible, setVisible] = useState(false);
    const [pos, setPos]         = useState<TooltipPos | null>(null);
    const anchorRef             = useRef<T | null>(null);

    useEffect(() => {
        if (!visible || !anchorRef.current) return;

        const update = () => {
            if (!anchorRef.current) return;
            const rect = anchorRef.current.getBoundingClientRect();
            setPos(getTooltipPosition(rect, window.innerWidth, window.innerHeight));
        };

        const handleClickOutside = (e: MouseEvent) => {
            if (anchorRef.current && !anchorRef.current.contains(e.target as Node)) {
                setVisible(false);
            }
        };

        update();
        window.addEventListener('resize', update);
        window.addEventListener('scroll', update, true);
        window.addEventListener('mousedown', handleClickOutside);
        return () => {
            window.removeEventListener('resize', update);
            window.removeEventListener('scroll', update, true);
            window.removeEventListener('mousedown', handleClickOutside);
        };
    }, [visible]);

    const tooltip = (visible && pos)
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
        onMouseEnter: () => setVisible(true),
        onMouseLeave: () => setVisible(false),
        onClick: (e: React.MouseEvent) => {
            e.stopPropagation();
            setVisible(v => !v);
        },
        tooltip,
    };
}
