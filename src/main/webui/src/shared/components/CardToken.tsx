import type { RefObject } from 'react';
import { useCardPreview } from '@/hooks/useCardPreview.tsx';

export function CardToken({ id, label }: { id: number; label: string }) {
    const { anchorRef, onMouseEnter, onMouseLeave, tooltip } = useCardPreview(id);

    return (
        <span className="relative inline-block">
            <span
                ref={anchorRef as RefObject<HTMLSpanElement>}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5
                           rounded bg-arcane/20 border border-arcane/30
                           text-arcane-soft text-xs font-medium cursor-default
                           hover:bg-arcane/30 hover:border-arcane/50
                           transition-colors"
            >
                {label}
            </span>
            {tooltip}
        </span>
    );
}
