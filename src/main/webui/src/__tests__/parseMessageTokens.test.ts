import {describe, expect, it} from 'vitest';
import {encodedToDisplay, mapEncodedToDisplayIndex, parseMessageTokens,} from '@/shared/utils/parseMessageTokens';

describe('parseMessageTokens', () => {
    it('returns a single text segment for plain text', () => {
        expect(parseMessageTokens('hello world')).toEqual([
            { type: 'text', content: 'hello world' },
        ]);
    });

    it('returns empty array for empty string', () => {
        expect(parseMessageTokens('')).toEqual([]);
    });

    it('parses a standalone card token', () => {
        expect(parseMessageTokens('[card:123:Govern the Unaligned]')).toEqual([
            { type: 'card', id: '123', label: 'Govern the Unaligned' },
        ]);
    });

    it('parses a standalone game token', () => {
        expect(parseMessageTokens('[game:42:My Game]')).toEqual([
            { type: 'game', id: '42', label: 'My Game' },
        ]);
    });

    it('handles a card token at the start with trailing text', () => {
        const result = parseMessageTokens('[card:1:Lunge] is powerful');
        expect(result).toEqual([
            { type: 'card', id: '1', label: 'Lunge' },
            { type: 'text', content: ' is powerful' },
        ]);
    });

    it('handles a card token at the end with leading text', () => {
        const result = parseMessageTokens('Use [card:1:Lunge]');
        expect(result).toEqual([
            { type: 'text', content: 'Use ' },
            { type: 'card', id: '1', label: 'Lunge' },
        ]);
    });

    it('handles a token in the middle of text', () => {
        const result = parseMessageTokens('Play [card:99:Pentex] tonight');
        expect(result).toEqual([
            { type: 'text', content: 'Play ' },
            { type: 'card', id: '99', label: 'Pentex' },
            { type: 'text', content: ' tonight' },
        ]);
    });

    it('handles multiple tokens', () => {
        const result = parseMessageTokens('[card:1:A] and [card:2:B]');
        expect(result).toEqual([
            { type: 'card', id: '1', label: 'A' },
            { type: 'text', content: ' and ' },
            { type: 'card', id: '2', label: 'B' },
        ]);
    });

    it('handles mixed card and game tokens', () => {
        const result = parseMessageTokens('[card:5:Anarch] in [game:10:Room]');
        expect(result).toEqual([
            { type: 'card', id: '5', label: 'Anarch' },
            { type: 'text', content: ' in ' },
            { type: 'game', id: '10', label: 'Room' },
        ]);
    });
});

describe('encodedToDisplay', () => {
    it('replaces card tokens with bracketed labels', () => {
        expect(encodedToDisplay('[card:123:Govern]')).toBe('[Govern]');
    });

    it('leaves plain text unchanged', () => {
        expect(encodedToDisplay('hello')).toBe('hello');
    });

    it('replaces multiple card tokens', () => {
        expect(encodedToDisplay('[card:1:A] and [card:2:B]')).toBe('[A] and [B]');
    });

    it('does not replace game tokens', () => {
        expect(encodedToDisplay('[game:10:My Game]')).toBe('[game:10:My Game]');
    });
});

describe('mapEncodedToDisplayIndex', () => {
    it('returns same index for plain text', () => {
        expect(mapEncodedToDisplayIndex('hello world', 5)).toBe(5);
    });

    it('maps index after a card token to the collapsed position', () => {
        const encoded = '[card:123:Govern] text';
        // encoded index 18 is the space after ']', display is '[Govern] text'
        // '[Govern]' is 8 chars, so index 18 in encoded → index 8 in display
        const displayIndex = mapEncodedToDisplayIndex(encoded, 18);
        expect(displayIndex).toBe(encodedToDisplay(encoded.slice(0, 18)).length);
    });

    it('maps index 0 to 0', () => {
        expect(mapEncodedToDisplayIndex('[card:1:X] text', 0)).toBe(0);
    });
});
