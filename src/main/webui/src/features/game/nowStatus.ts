import type {GameState} from './types.ts';

export const PHASES = ['UNLOCK', 'MASTER', 'MINION', 'INFLUENCE', 'DISCARD'] as const;
export type GamePhase = typeof PHASES[number];

export const PHASE_LABELS: Record<GamePhase, string> = {
    UNLOCK: 'Unlock',
    MASTER: 'Master',
    MINION: 'Minion',
    INFLUENCE: 'Influence',
    DISCARD: 'Discard',
};

export const ACTION_LABELS: Record<string, string> = {
    BLEED: 'bleeds',
    HUNT: 'hunts',
    EQUIP: 'equips',
    EMPLOY_RETAINER: 'employs a retainer',
    RECRUIT_ALLY: 'recruits an ally',
    POLITICAL: 'calls a referendum',
    LEAVE_TORPOR: 'leaves torpor',
    RESCUE: 'rescues from torpor',
    DIABLERISE: 'attempts diablerie',
    CUSTOM: 'takes an action',
};

export const IMPULSE_CONTEXT_LABELS: Record<string, string> = {
    UNDIRECTED: 'undirected action',
    DIRECTED_SINGLE: 'directed action',
    DIRECTED_MULTI: 'multi-target action',
    COMBAT: 'combat',
};

export const SEQUENCING_LABELS: Record<string, string> = {
    AS_ANNOUNCED: 'as announced',
    AFTER_RESOLUTION: 'after resolution',
};

/**
 * The Now panel's answer to "what is happening, and whose move is it?".
 * Derived client-side from the open timing surfaces, most specific first:
 * impulse window > sequencing window > pending action > turn phase.
 */
export type NowStatus = {
    kind: 'impulse' | 'sequencing' | 'action' | 'phase';
    /** One viewer-relative sentence describing the current situation. */
    headline: string;
    /** The player the game is waiting on, when a single one is identifiable. */
    awaited: string | null;
    /** Whether the viewer is the awaited player. */
    yourMove: boolean;
};

/** Viewer-relative name: the viewer reads "you", everyone else reads a name. */
function who(name: string | null | undefined, viewer: string): string {
    return name === viewer ? 'you' : (name ?? '?');
}

function describeAction(state: GameState, viewer: string): string | null {
    const pending = state.pendingAction;
    if (!pending) return null;
    const actor = who(pending.actorRef.playerName, viewer);
    const verb = ACTION_LABELS[pending.actionType] ?? 'takes an action';
    const target = pending.targetPlayerName ? ` → ${who(pending.targetPlayerName, viewer)}` : '';
    const summary = `${actor} ${actor === 'you' ? verb.replace(/s\b/, '') : verb}${target}`;
    if (pending.status === 'BLOCKED') {
        return `${summary} — blocked${pending.blockerRef ? ` by ${who(pending.blockerRef.playerName, viewer)}` : ''}`;
    }
    if (pending.status === 'AFTER_RESOLUTION') return `${summary} — resolving`;
    return `${summary} — block window open`;
}

export function nowStatus(state: GameState, viewer: string): NowStatus {
    const action = describeAction(state, viewer);

    const impulse = state.impulseWindow;
    if (impulse?.active) {
        const context = IMPULSE_CONTEXT_LABELS[impulse.context] ?? impulse.context.toLowerCase();
        const holder = impulse.currentImpulseHolder;
        const yourMove = holder === viewer;
        const situation = action ?? `${who(impulse.actingPlayer, viewer)} acting (${context})`;
        return {
            kind: 'impulse',
            headline: yourMove
                ? `Your impulse — ${situation}`
                : `${situation} — waiting on ${who(holder, viewer)}`,
            awaited: holder,
            yourMove,
        };
    }

    const seq = state.sequencingWindow;
    if (seq?.active) {
        const label = SEQUENCING_LABELS[seq.windowType] ?? seq.windowType.toLowerCase();
        const yourMove = seq.currentHolder === viewer;
        return {
            kind: 'sequencing',
            headline: yourMove
                ? `Your sequencing priority (${label})`
                : `Sequencing (${label}) — waiting on ${who(seq.currentHolder, viewer)}`,
            awaited: seq.currentHolder,
            yourMove,
        };
    }

    if (action) {
        const pending = state.pendingAction!;
        // During the action the target decides whether to block; otherwise the actor drives.
        const awaited = pending.status === 'DURING_ACTION' && pending.targetPlayerName
            ? pending.targetPlayerName
            : pending.actorRef.playerName;
        return {kind: 'action', headline: action, awaited, yourMove: awaited === viewer};
    }

    const phase = PHASE_LABELS[state.phase as GamePhase] ?? state.phase;
    const yourMove = state.currentPlayer === viewer;
    return {
        kind: 'phase',
        headline: yourMove
            ? `Your ${phase} phase`
            : `${state.currentPlayer}'s ${phase} phase`,
        awaited: state.currentPlayer,
        yourMove,
    };
}
