import {useState} from 'react';

/**
 * User-controlled stage card size, independent of browser zoom
 * (docs/implementation/board-design.md — Responsive Density Map).
 * The scale multiplies the density map's per-slot-count card width.
 */

const STORAGE_KEY = 'jol.stage.cardScale';
export const CARD_SCALE_MIN = 0.7;
export const CARD_SCALE_MAX = 1.5;
export const CARD_SCALE_STEP = 0.05;

export function clampCardScale(value: number): number {
    if (!Number.isFinite(value)) return 1;
    return Math.min(CARD_SCALE_MAX, Math.max(CARD_SCALE_MIN, value));
}

export function readStoredCardScale(storage: Pick<Storage, 'getItem'> = localStorage): number {
    const raw = storage.getItem(STORAGE_KEY);
    return raw == null ? 1 : clampCardScale(parseFloat(raw));
}

export function useCardScale(): [number, (value: number) => void] {
    const [scale, setScale] = useState(readStoredCardScale);
    const update = (value: number) => {
        const clamped = clampCardScale(value);
        setScale(clamped);
        localStorage.setItem(STORAGE_KEY, String(clamped));
    };
    return [scale, update];
}
