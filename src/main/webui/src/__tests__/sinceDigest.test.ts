import {describe, expect, it} from 'vitest';
import {compileDigest, digestLines, SINCE_LIMIT} from '../features/game/sinceDigest.ts';
import type {ChatMsg, CommandLogMsg} from '@/hooks/useWebSocket.ts';
import type {CommandLogData} from '../features/game/commandLog.ts';

const talk = (id: string, sender: string): ChatMsg =>
    ({type: 'CHAT', id, sender, content: `msg ${id}`, timestamp: '2026-07-19T12:00:00Z', reactions: []});

const log = (id: string, command: CommandLogData): CommandLogMsg => ({
    type: 'COMMAND_LOG', id, sender: command.actor, content: '', timestamp: '2026-07-19T12:00:00Z', reactions: [],
    commandLog: {turn: '3.1', phase: 'MINION', currentPlayer: command.actor, command},
});

describe('compileDigest', () => {
    it('collects ousts, viewer pool changes, turns, and talk', () => {
        const digest = compileDigest([
            log('1', {commandType: 'OUST_PLAYER', actor: 'Ana', oustedPlayer: 'Ben'}),
            log('2', {commandType: 'NEXT_TURN', actor: 'Cat', turn: '4.1', playerName: 'Cat'}),
            log('3', {commandType: 'SET_POOL', actor: 'Cat', targetPlayer: 'Dev', amount: 4}),
            log('4', {commandType: 'SET_POOL', actor: 'Cat', targetPlayer: 'Ana', amount: 9}),
            talk('5', 'Cat'),
            talk('6', 'Dev'),
        ], 'Dev');

        expect(digest).toEqual({
            ousts: ['Ben'],
            poolChanges: 1,       // only the SET_POOL aimed at Dev
            turnsAdvanced: 1,
            talkCount: 1,         // Dev's own message doesn't count
            truncated: false,
        });
    });

    it('ignores commands that are not digest-worthy', () => {
        const digest = compileDigest([
            log('1', {commandType: 'DRAW_CARD', actor: 'Ana', count: 1}),
            log('2', {commandType: 'SHUFFLE_LIBRARY', actor: 'Ana'}),
        ], 'Dev');

        expect(digest).toBeNull();
    });

    it('returns null for an empty slice', () => {
        expect(compileDigest([], 'Dev')).toBeNull();
    });

    it('flags truncation at the server cap', () => {
        const slice = Array.from({length: SINCE_LIMIT}, (_, i) => talk(String(i), 'Ana'));
        expect(compileDigest(slice, 'Dev')?.truncated).toBe(true);
    });
});

describe('digestLines', () => {
    it('renders fragments most important first, with plurals', () => {
        expect(digestLines({ousts: ['Ben', 'Cat'], poolChanges: 2, turnsAdvanced: 1, talkCount: 1, truncated: true}))
            .toEqual([
                'ousted: Ben, Cat',
                '1 turn passed',
                'your pool changed 2 times',
                '1 chat message',
                'and more…',
            ]);
    });
});
