import {Fragment} from 'react';
import {nowStatus} from './nowStatus.ts';
import type {CardData, GameState, PlayerState} from './types.ts';

/**
 * The awareness layer of the board: every player's vitals as a chip, in seat
 * order with the viewer centered. Linearizes the predator–prey circle — play
 * proceeds along the arrows and wraps from the last chip back to the first.
 * See docs/implementation/board-design.md — Ring strip.
 *
 * Density tiers: the base chip is always shown; ready-minion strips appear
 * from lg upward. The mini-tableau tier arrives with the Stage.
 */

/** Rotate seat order so the viewer sits at the visual center. */
function ringOrder(playerOrder: string[], viewer: string): string[] {
    const idx = playerOrder.indexOf(viewer);
    if (idx === -1) return playerOrder;
    const n = playerOrder.length;
    const center = Math.floor((n - 1) / 2);
    const shift = (idx - center + n) % n;
    return playerOrder.map((_, i) => playerOrder[(i + shift) % n]);
}

const MAX_MINION_STRIPS = 4;

function MinionStrips({player, cards}: {player: PlayerState; cards: Record<string, CardData>}) {
    const readyIds = player.regions.READY?.cardIds ?? [];
    if (readyIds.length === 0) return null;
    const shown = readyIds.slice(0, MAX_MINION_STRIPS);
    const overflow = readyIds.length - shown.length;
    return (
        <div className="hidden lg:flex items-center gap-0.5 mt-0.5 min-w-0">
            {shown.map(id => {
                const card = cards[id];
                const locked = card?.locked === true;
                return (
                    <span
                        key={id}
                        title={card?.name ? `${card.name}${locked ? ' (locked)' : ''}` : undefined}
                        className={[
                            'text-[9px] leading-none px-1 py-0.5 rounded-sm border max-w-16 truncate',
                            locked
                                ? 'border-line/30 text-ink-muted/40'
                                : 'border-line/50 text-ink-muted',
                        ].join(' ')}
                    >
                        {locked && <span aria-hidden="true">⟳ </span>}
                        {card?.name ?? '·····'}
                    </span>
                );
            })}
            {overflow > 0 && (
                <span className="text-[9px] leading-none text-ink-muted/60">+{overflow}</span>
            )}
        </div>
    );
}

function PlayerChip({player, cards, isViewer, isTurn, hasEdge, isAwaited, onClick}: {
    player: PlayerState;
    cards: Record<string, CardData>;
    isViewer: boolean;
    isTurn: boolean;
    hasEdge: boolean;
    isAwaited: boolean;
    onClick?: () => void;
}) {
    const handCount = player.regions.HAND?.count ?? 0;
    const label = [
        isViewer ? `${player.name} (you)` : player.name,
        player.ousted ? 'ousted' : `${player.pool} pool`,
        player.victoryPoints > 0 && `${player.victoryPoints} VP`,
        !player.ousted && `${handCount} cards in hand`,
        hasEdge && 'holds the Edge',
        isTurn && 'current turn',
        isAwaited && 'awaiting their action',
    ].filter(Boolean).join(', ');

    return (
        <button
            type="button"
            aria-label={label}
            aria-current={isTurn ? 'true' : undefined}
            onClick={onClick}
            className={[
                'shrink-0 rounded-lg border px-2 py-1 text-left transition-colors cursor-pointer min-w-0',
                isTurn
                    ? 'border-arcane/60 bg-arcane/10 hover:bg-arcane/15'
                    : isViewer
                        ? 'border-line/60 bg-panel/70 hover:bg-hover'
                        : 'border-line/40 bg-panel/40 hover:bg-hover',
                player.ousted && 'opacity-45',
            ].filter(Boolean).join(' ')}
        >
            <span className="flex items-center gap-1.5 min-w-0">
                {isAwaited && (
                    <span
                        className="w-1.5 h-1.5 rounded-full bg-blood shrink-0 animate-pulse motion-reduce:animate-none"
                        aria-hidden="true"
                    />
                )}
                <span className={[
                    'text-xs leading-tight truncate',
                    isViewer ? 'font-semibold text-ink' : 'font-medium text-ink-secondary',
                    player.ousted && 'line-through',
                ].filter(Boolean).join(' ')}>
                    {player.name}
                </span>
                {hasEdge && (
                    <span className="text-[8px] font-bold tracking-wider leading-none px-1 py-0.5 rounded-sm bg-gold/20 text-gold border border-gold/40 shrink-0">
                        EDGE
                    </span>
                )}
            </span>
            <span className="flex items-center gap-2 mt-0.5 text-[10px] leading-none text-ink-muted whitespace-nowrap" aria-hidden="true">
                <span className={player.pool <= 5 && !player.ousted ? 'text-blood font-semibold' : 'text-blood/70'}>
                    {player.pool} pool
                </span>
                {player.victoryPoints > 0 && <span className="text-gold/80">{player.victoryPoints} VP</span>}
                {!player.ousted && <span>🂠 {handCount}</span>}
            </span>
            <MinionStrips player={player} cards={cards} />
        </button>
    );
}

export function RingStrip({gameState, currentUser, onFocusPlayer}: {
    gameState: GameState;
    currentUser: string;
    onFocusPlayer?: (name: string) => void;
}) {
    const byName = new Map(gameState.players.map(p => [p.name, p]));
    const ring = ringOrder(gameState.playerOrder, currentUser)
        .map(name => byName.get(name))
        .filter((p): p is PlayerState => !!p);
    if (ring.length === 0) return null;

    // Pulse only for interrupts (impulse/sequencing/action windows) — the turn
    // highlight already marks the current player during their own phases.
    const status = nowStatus(gameState, currentUser);
    const awaited = status.kind === 'phase' ? null : status.awaited;
    // Play travels toward prey (seat order); reversal flips the arrows.
    const arrow = gameState.orderReversed ? '◂' : '▸';
    const arrowTitle = gameState.orderReversed ? 'play direction (reversed)' : 'play direction';

    return (
        <div
            className="flex items-center gap-1 pb-1.5 shrink-0 overflow-x-auto min-w-0"
            role="group"
            aria-label="Players in seating order"
        >
            <span className="text-ink-muted/30 text-[10px] shrink-0" aria-hidden="true" title={`wraps around · ${arrowTitle}`}>{arrow}</span>
            {ring.map((player, i) => (
                <Fragment key={player.name}>
                    {i > 0 && (
                        <span className="text-ink-muted/40 text-[10px] shrink-0" aria-hidden="true" title={arrowTitle}>{arrow}</span>
                    )}
                    <PlayerChip
                        player={player}
                        cards={gameState.cards}
                        isViewer={player.name === currentUser}
                        isTurn={player.name === gameState.currentPlayer}
                        hasEdge={gameState.edgeHolder === player.name}
                        isAwaited={awaited === player.name && !player.ousted}
                        onClick={onFocusPlayer ? () => onFocusPlayer(player.name) : undefined}
                    />
                </Fragment>
            ))}
            <span className="text-ink-muted/30 text-[10px] shrink-0" aria-hidden="true" title={`wraps around · ${arrowTitle}`}>{arrow}</span>
        </div>
    );
}
