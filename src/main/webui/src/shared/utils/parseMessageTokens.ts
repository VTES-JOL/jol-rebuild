export type TextSegment   = { type: 'text';  content: string };
export type CardSegment   = { type: 'card';  id: number; label: string };
export type GameSegment   = { type: 'game';  id: number; label: string }; // ready for later

export type MessageSegment = TextSegment | CardSegment | GameSegment;

const TOKEN_RE = /\[(card|game):(\d+):([^\]]+)]/g;

export function parseMessageTokens(content: string): MessageSegment[] {
    const segments: MessageSegment[] = [];
    let last = 0;

    for (const match of content.matchAll(TOKEN_RE)) {
        if (match.index! > last) {
            segments.push({ type: 'text', content: content.slice(last, match.index) });
        }
        const [, kind, id, label] = match;
        segments.push({ type: kind as 'card' | 'game', id: Number(id), label });
        last = match.index! + match[0].length;
    }

    if (last < content.length) {
        segments.push({ type: 'text', content: content.slice(last) });
    }

    return segments;
}
export function encodedToDisplay(encoded: string): string {
    return encoded.replace(/\[card:\d+:([^\]]+)]/g, '[$1]');
}

export function mapEncodedToDisplayIndex(encoded: string, encodedIndex: number): number {
    return encodedToDisplay(encoded.slice(0, encodedIndex)).length;
}
