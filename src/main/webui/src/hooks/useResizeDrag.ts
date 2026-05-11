import {useCallback, useEffect, useRef, useState} from 'react';
import type React from 'react';

interface Options {
    startCount: number;
    unitPx: number;
    min: number;
    max: number;
    axis: 'x' | 'y';
    onCountChange: (n: number) => void;
    onCommit?: (n: number) => void;
}

export function useResizeDrag({startCount, unitPx, min, max, axis, onCountChange, onCommit}: Options) {
    const [isDragging, setIsDragging] = useState(false);
    const dragState = useRef<{
        startCoord: number;
        startCount: number;
        currentCount: number;
    } | null>(null);

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        e.stopPropagation();
        e.preventDefault();
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        dragState.current = {
            startCoord: axis === 'x' ? e.clientX : e.clientY,
            startCount,
            currentCount: startCount,
        };
        setIsDragging(true);
    }, [axis, startCount]);

    useEffect(() => {
        if (!isDragging) return;

        const onMove = (e: PointerEvent) => {
            e.stopPropagation();
            if (!dragState.current) return;
            const coord = axis === 'x' ? e.clientX : e.clientY;
            const delta = coord - dragState.current.startCoord;
            const raw = dragState.current.startCount + Math.round(delta / unitPx);
            const next = Math.max(min, Math.min(max, raw));
            if (next !== dragState.current.currentCount) {
                dragState.current.currentCount = next;
                onCountChange(next);
            }
        };

        const onUp = (e: PointerEvent) => {
            e.stopPropagation();
            if (dragState.current) {
                onCommit?.(dragState.current.currentCount);
            }
            dragState.current = null;
            setIsDragging(false);
        };

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);
        return () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('pointercancel', onUp);
        };
    }, [isDragging, axis, unitPx, min, max, onCountChange, onCommit]);

    return {isDragging, handlePointerDown};
}
