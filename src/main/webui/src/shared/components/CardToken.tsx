import {useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';

interface TooltipPos {
    top?: number;
    bottom?: number;
    left: number;
}

export function CardToken({ id, label }: { id: number; label: string }) {
    const [hovered, setHovered] = useState(false);
    const [pos, setPos] = useState<TooltipPos | null>(null);
    const spanRef = useRef<HTMLSpanElement>(null);

    // Card aspect ratio: 358×500 — display at 179×250 (50%)
    const IMG_W = 358;
    const IMG_H = 500;
    const MARGIN = 8;

    const getTooltipPosition = (
        rect: DOMRect,
        viewportWidth: number,
        viewportHeight: number
    ): TooltipPos => {
        const centeredLeft = rect.left + rect.width / 2 - IMG_W / 2;
        const left = Math.max(
            MARGIN,
            Math.min(centeredLeft, viewportWidth - IMG_W - MARGIN)
        );
        const minTooltipSpace = IMG_H + MARGIN;
        const spaceAbove = rect.top;
        const spaceBelow = viewportHeight - rect.bottom;

        if (spaceAbove >= minTooltipSpace) {
            return { bottom: viewportHeight - rect.top + MARGIN, left };
        }

        if (spaceBelow >= minTooltipSpace) {
            return { top: rect.bottom + MARGIN, left };
        }

        return { top: Math.max(MARGIN, (viewportHeight - IMG_H) / 2), left };
    };

    useEffect(() => {
        if (!hovered || !spanRef.current) return;

        const rect = spanRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const tooltipPosition = getTooltipPosition(rect, viewportWidth, viewportHeight);
        setPos(tooltipPosition);
    }, [hovered]);

    const tooltip = hovered && pos && createPortal(
        <div
            className="fixed z-9999 pointer-events-none
                       rounded-lg border border-white/10 shadow-2xl overflow-hidden bg-slate-900"
            style={{
                width: IMG_W,
                top: pos.top,
                bottom: pos.bottom,
                left: pos.left,
            }}
        >
            <img
                src={`https://static.deckserver.net/images/${id}`}
                alt={label}
                width={IMG_W}
                height={IMG_H}
                className="block w-full h-auto"
                onError={e => (e.currentTarget.style.display = 'none')}
            />
        </div>,
        document.body
    );

    return (
        <span className="relative inline-block">
            <span
                ref={spanRef}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5
                           rounded bg-indigo-500/20 border border-indigo-400/30
                           text-indigo-300 text-xs font-medium cursor-default
                           hover:bg-indigo-500/30 hover:border-indigo-400/50
                           transition-colors"
            >
                {label}
            </span>
            {tooltip}
        </span>
    );
}