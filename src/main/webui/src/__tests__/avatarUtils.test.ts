import { describe, it, expect } from 'vitest';
import { initials, hueFromName } from '@/shared/utils/avatarUtils';

describe('initials', () => {
    it('returns the first letter of a single word', () => {
        expect(initials('Alice')).toBe('A');
    });

    it('returns first letters of the first two words', () => {
        expect(initials('Alice Wonderland')).toBe('AW');
    });

    it('uses only the first two words for names with three or more parts', () => {
        expect(initials('Alice Beth Carr')).toBe('AB');
    });

    it('uppercases each initial', () => {
        expect(initials('alice wonderland')).toBe('AW');
    });

    it('handles extra whitespace between words', () => {
        expect(initials('alice  bob')).toBe('AB');
    });

    it('returns empty string for empty input', () => {
        expect(initials('')).toBe('');
    });
});

describe('hueFromName', () => {
    it('returns a number in [0, 360)', () => {
        const hue = hueFromName('alice');
        expect(hue).toBeGreaterThanOrEqual(0);
        expect(hue).toBeLessThan(360);
    });

    it('returns the same value for the same name', () => {
        expect(hueFromName('alice')).toBe(hueFromName('alice'));
    });

    it('returns different values for different names', () => {
        expect(hueFromName('alice')).not.toBe(hueFromName('bob'));
    });

    it('handles empty string without throwing', () => {
        expect(() => hueFromName('')).not.toThrow();
    });
});
