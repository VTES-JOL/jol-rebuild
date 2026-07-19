import {describe, expect, it} from 'vitest';
import {CARD_SCALE_MAX, CARD_SCALE_MIN, clampCardScale, readStoredCardScale} from '../features/game/useCardScale.ts';

describe('clampCardScale', () => {
    it('passes through values inside the range', () => {
        expect(clampCardScale(1)).toBe(1);
        expect(clampCardScale(1.25)).toBe(1.25);
    });

    it('clamps to the range bounds', () => {
        expect(clampCardScale(0.1)).toBe(CARD_SCALE_MIN);
        expect(clampCardScale(9)).toBe(CARD_SCALE_MAX);
    });

    it('falls back to 1 for non-finite input', () => {
        expect(clampCardScale(NaN)).toBe(1);
        expect(clampCardScale(Infinity)).toBe(1);
    });
});

describe('readStoredCardScale', () => {
    const storageOf = (value: string | null) => ({getItem: () => value});

    it('defaults to 1 with nothing stored', () => {
        expect(readStoredCardScale(storageOf(null))).toBe(1);
    });

    it('parses and clamps a stored value', () => {
        expect(readStoredCardScale(storageOf('1.2'))).toBe(1.2);
        expect(readStoredCardScale(storageOf('42'))).toBe(CARD_SCALE_MAX);
    });

    it('recovers from garbage', () => {
        expect(readStoredCardScale(storageOf('not-a-number'))).toBe(1);
    });
});
