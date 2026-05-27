import {useMemo, useState} from 'react';
import type {CardData, PlayerState, RegionType} from './types.ts';
import type {FieldRegionConfig} from './FieldRegion.tsx';
import {FieldRegionDndGroup} from './FieldRegion.tsx';
import {buildActiveRegionConfigs, CompactRegionRow, createCompactRegionConfigs} from './gameUtils.tsx';
import type {CardRef, GameCommand} from './gameCommands.ts';
import {setChoice, setPool} from './gameCommands.ts';
import {usePlayerRegions} from './usePlayerRegions.ts';

type PlayerBoardProps = {
    player: PlayerState;
    cards: Record<string, CardData>;
    isCurrentPlayer?: boolean;
    gameId?: string;
    onCommand?: (cmd: GameCommand) => void;
    onCardClick?: (regionType: RegionType, stackIndex: number, cardIndex: number) => void;
    onCardContextMenu?: (card: CardData, ref: CardRef, x: number, y: number) => void;
};

export function BleedConnector() {
    return (
        <div className="flex items-center gap-1.5 pl-[3.25rem] py-0.5 select-none" aria-hidden>
            <div className="flex flex-col items-center gap-0.5 text-blood/30">
                <div className="w-px h-1.5 bg-current" />
                <span className="text-[9px] leading-none">▼</span>
            </div>
            <span className="text-[9px] text-ink-muted/30 leading-none tracking-wide">bleeds</span>
        </div>
    );
}

export function PlayerBoard({player, cards, isCurrentPlayer, gameId, onCommand, onCardClick, onCardContextMenu}: PlayerBoardProps) {
    const [choiceEditing, setChoiceEditing] = useState(false);
    const [choiceInput, setChoiceInput] = useState('');

    const saveChoice = () => {
        if (gameId && onCommand) onCommand(setChoice(gameId, player.name, choiceInput));
        setChoiceEditing(false);
    };

    const {
        ready, torpor, research, uncontrolled, hand, library, crypt, ashHeap, rfg,
        readyStacks, torporStacks, researchStacks, uncontrolledStacks,
        handStacks, libraryStacks, cryptStacks, ashHeapStacks,
        handleCrossRegionMove, handleCrossCardMove,
    } = usePlayerRegions(player, cards, gameId, onCommand);

    // All regions share ONE DndContext so compact→active cross-region drags work.
    const allRegions = useMemo<FieldRegionConfig[]>(() => buildActiveRegionConfigs({
        player, gameId, onCommand, onCardContextMenu, onCardClick,
        ready, torpor, research, uncontrolled,
        readyStacks, torporStacks, researchStacks, uncontrolledStacks,
    }), [ready, torpor, research, uncontrolled,
        readyStacks, torporStacks, researchStacks, uncontrolledStacks,
        gameId, onCommand, onCardClick, onCardContextMenu, player]);

    const allCompactRegions = useMemo(() => createCompactRegionConfigs({
        playerName: player.name,
        hand: isCurrentPlayer ? undefined : hand,
        library, crypt, ashHeap,
        handStacks, libraryStacks, cryptStacks, ashHeapStacks,
        onCardContextMenu, onCardClick,
    }), [hand, isCurrentPlayer, library, crypt, ashHeap, handStacks, libraryStacks, cryptStacks, ashHeapStacks,
        onCardClick, onCardContextMenu, player.name]);

    return (
        <div
            className={[
                'flex flex-wrap items-start gap-x-3 gap-y-1 rounded-lg border px-3 py-2',
                isCurrentPlayer
                    ? 'bg-arcane/5 border-arcane/40'
                    : 'bg-panel/50 border-line/75',
            ].join(' ')}
        >
            {/* Player info — fixed left column */}
            <div className="flex flex-col gap-0.5 w-20 shrink-0 pt-1">
                {player.predator && (
                    <span className="text-[10px] text-ink-muted/50 leading-none truncate" title={`Predator: ${player.predator}`}>
                        ▲ {player.predator}
                    </span>
                )}
                <span className={`text-sm leading-tight truncate ${isCurrentPlayer ? 'font-semibold text-ink' : 'font-medium text-ink-secondary'}`}>
                    {player.name}
                </span>
                {gameId && onCommand ? (
                    <div className="flex items-center gap-0.5">
                        <button
                            className="w-3.5 h-3.5 flex items-center justify-center text-[10px] text-blood/50 hover:text-blood rounded transition-colors leading-none"
                            onClick={() => onCommand(setPool(gameId, player.name, player.pool - 1))}
                            title="Remove 1 pool"
                        >−</button>
                        <span className="text-xs text-blood font-medium tabular-nums">{player.pool}</span>
                        <button
                            className="w-3.5 h-3.5 flex items-center justify-center text-[10px] text-blood/50 hover:text-blood rounded transition-colors leading-none"
                            onClick={() => onCommand(setPool(gameId, player.name, player.pool + 1))}
                            title="Add 1 pool"
                        >+</button>
                        <span className="text-[10px] text-blood/60">pool</span>
                    </div>
                ) : (
                    <span className="text-xs text-blood font-medium">{player.pool} pool</span>
                )}
                {player.victoryPoints > 0 && (
                    <span className="text-xs text-gold font-medium">{player.victoryPoints} VP</span>
                )}
                {isCurrentPlayer && gameId && onCommand ? (
                    choiceEditing ? (
                        <div className="flex items-center gap-0.5">
                            <input
                                className="text-[10px] w-full px-1 py-0.5 rounded border border-line/50 bg-panel/30 text-ink outline-none focus:border-arcane/40"
                                value={choiceInput}
                                onChange={e => setChoiceInput(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') saveChoice();
                                    if (e.key === 'Escape') { e.stopPropagation(); setChoiceEditing(false); }
                                }}
                                placeholder="Choice…"
                                autoFocus
                            />
                            <button className="text-[10px] text-ink-muted hover:text-ink transition-colors leading-none shrink-0" onClick={saveChoice}>✓</button>
                            <button className="text-[10px] text-ink-muted hover:text-ink transition-colors leading-none shrink-0" onClick={() => setChoiceEditing(false)}>✕</button>
                        </div>
                    ) : (
                        <button
                            className="text-[10px] text-ink-muted/60 hover:text-ink-muted transition-colors leading-none text-left truncate"
                            onClick={() => { setChoiceInput(player.choice ?? ''); setChoiceEditing(true); }}
                            title="Set your choice"
                        >
                            {player.choice ? `[${player.choice}]` : 'Choice…'}
                        </button>
                    )
                ) : player.choice ? (
                    <span className="text-[10px] text-ink-muted/60 leading-none truncate">[{player.choice}]</span>
                ) : null}
                {player.prey && (
                    <span className="text-[10px] text-ink-muted/50 leading-none truncate" title={`Prey: ${player.prey}`}>
                        ▼ {player.prey}
                    </span>
                )}
            </div>

            {/* All regions share ONE DndContext so compact→active cross-region DnD works */}
            <FieldRegionDndGroup
                regions={allRegions}
                compactRegions={allCompactRegions}
                onCrossRegionMove={handleCrossRegionMove}
                onCrossCardMove={handleCrossCardMove}
            >
                {renderRegion => (
                    <>
                        {/* Active field regions */}
                        <div className="flex gap-3 items-start flex-wrap flex-1 min-w-0">
                            {ready && renderRegion('READY')}
                            {torpor && torpor.count > 0 && renderRegion('TORPOR')}
                            {research && research.count > 0 && renderRegion('RESEARCH')}
                            {uncontrolled && renderRegion('UNCONTROLLED')}
                        </div>

                        {/* Right column — compact region stacks */}
                        <div className="flex flex-col gap-1 pt-1 w-full lg:w-auto lg:shrink-0">
                            <CompactRegionRow
                                hand={hand}
                                isCurrentUser={!!isCurrentPlayer}
                                library={library}
                                crypt={crypt}
                                ashHeap={ashHeap}
                                rfg={rfg}
                                renderRegion={renderRegion}
                                className="justify-end lg:justify-start"
                            />
                        </div>
                    </>
                )}
            </FieldRegionDndGroup>
        </div>
    );
}
