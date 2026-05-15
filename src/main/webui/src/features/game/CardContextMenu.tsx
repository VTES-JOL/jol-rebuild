import {useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import type {CardData} from './types.ts';
import type {CardRef, GameCommand} from './gameCommands.ts';
import {
    addCounter, burnMinion, contestCard, discardCard, lockCard,
    moveToTorpor, removeCounter, rescueFromTorpor,
    setCardNotes, setTitle, uncontestCard, unlockCard,
} from './gameCommands.ts';
import Input from '@/shared/components/Input.tsx';

type Props = {
    card: CardData;
    cardRef: CardRef;
    gameId: string;
    position: {x: number; y: number};
    onCommand: (cmd: GameCommand) => void;
    onClose: () => void;
};

type InlineForm = 'title' | 'notes' | null;

const ITEM = 'flex items-center gap-2 w-full px-3 py-1.5 text-sm text-ink hover:bg-hover text-left transition-colors rounded-sm';
const DANGER = 'flex items-center gap-2 w-full px-3 py-1.5 text-sm text-blood hover:bg-blood/10 text-left transition-colors rounded-sm';
const SEP = <hr className="border-line/40 my-1" />;

const MENU_MAX_W = 280;
const MENU_MAX_H = 440;

export function CardContextMenu({card, cardRef, gameId, position, onCommand, onClose}: Props) {
    const menuRef = useRef<HTMLDivElement>(null);
    const [inlineForm, setInlineForm] = useState<InlineForm>(null);
    const [titleInput, setTitleInput] = useState(card.title ?? '');
    const [notesInput, setNotesInput] = useState(card.notes ?? '');

    const rawLeft = position.x + 4;
    const rawTop  = position.y + 4;
    const left = Math.max(4, rawLeft + MENU_MAX_W  > window.innerWidth  - 4 ? position.x - MENU_MAX_W  - 4 : rawLeft);
    const top  = Math.max(4, rawTop  + MENU_MAX_H  > window.innerHeight - 4 ? position.y - MENU_MAX_H  - 4 : rawTop);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        const onDown = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
        };
        document.addEventListener('keydown', onKey);
        document.addEventListener('mousedown', onDown);
        return () => {
            document.removeEventListener('keydown', onKey);
            document.removeEventListener('mousedown', onDown);
        };
    }, [onClose]);

    const fire = (cmd: GameCommand) => { onCommand(cmd); onClose(); };

    const region = cardRef.regionType;
    const inPlay = region === 'READY' || region === 'TORPOR';
    const isCryptCard = card.type === 'VAMPIRE' || card.type === 'IMBUED' || card.crypt === true;
    const isMinion = card.minion === true || isCryptCard;
    const showLockUnlock = inPlay;
    const showCounters = inPlay;
    const showMoveToTorpor = region === 'READY' && isMinion;
    const showRescue = region === 'TORPOR';
    const showDiscard = region === 'HAND';
    const showBurn = isMinion && inPlay;
    const showContest = card.unique === true && inPlay;
    const showTitle = isCryptCard && region === 'READY';
    const showNotes = inPlay;
    const hasZoneSection = showMoveToTorpor || showRescue || showDiscard || showBurn;

    const cardLabel = card.faceDown && !card.name ? '(hidden)' : (card.name ?? card.cardId ?? '—');
    const typeName = card.type
        ? card.type.charAt(0) + card.type.slice(1).toLowerCase().replace('_', ' ')
        : null;

    return createPortal(
        <div
            ref={menuRef}
            style={{position: 'fixed', zIndex: 9999, top, left}}
            className="min-w-[210px] max-w-[280px] rounded-lg border border-line/60 bg-surface/95 backdrop-blur-sm shadow-xl py-1"
            onContextMenu={e => e.preventDefault()}
        >
            {/* Header */}
            <div className="px-3 py-1.5 flex items-center gap-2 border-b border-line/40 mb-1">
                <span className="text-sm font-medium text-ink truncate flex-1">{cardLabel}</span>
                {typeName && (
                    <span className="text-[10px] bg-arcane/15 text-arcane rounded px-1.5 py-0.5 shrink-0">{typeName}</span>
                )}
            </div>

            {/* Lock / Unlock */}
            {showLockUnlock && (card.locked ? (
                <button className={ITEM} onClick={() => fire(unlockCard(gameId, cardRef))}>Unlock</button>
            ) : (
                <button className={ITEM} onClick={() => fire(lockCard(gameId, cardRef))}>Lock</button>
            ))}

            {/* Counters */}
            {showCounters && (
                <>
                    {SEP}
                    <div className="flex items-center gap-2 px-3 py-1">
                        <span className="text-sm text-ink-muted flex-1">Blood</span>
                        <button
                            className="w-6 h-6 flex items-center justify-center rounded text-sm text-ink hover:bg-hover transition-colors disabled:opacity-30"
                            disabled={(card.counters ?? 0) === 0}
                            onClick={() => onCommand(removeCounter(gameId, cardRef))}
                        >−</button>
                        <span className="text-sm font-mono text-ink w-5 text-center tabular-nums">{card.counters ?? 0}</span>
                        <button
                            className="w-6 h-6 flex items-center justify-center rounded text-sm text-ink hover:bg-hover transition-colors"
                            onClick={() => onCommand(addCounter(gameId, cardRef))}
                        >+</button>
                    </div>
                </>
            )}

            {/* Zone moves */}
            {hasZoneSection && (
                <>
                    {SEP}
                    {showDiscard && (
                        <button className={ITEM} onClick={() => fire(discardCard(gameId, cardRef))}>Discard</button>
                    )}
                    {showMoveToTorpor && (
                        <button className={ITEM} onClick={() => fire(moveToTorpor(gameId, cardRef))}>Move to Torpor</button>
                    )}
                    {showRescue && (
                        <button className={ITEM} onClick={() => fire(rescueFromTorpor(gameId, cardRef))}>Rescue from Torpor</button>
                    )}
                    {showBurn && (
                        <button className={DANGER} onClick={() => fire(burnMinion(gameId, cardRef))}>Burn Minion</button>
                    )}
                </>
            )}

            {/* Contest */}
            {showContest && (
                <>
                    {SEP}
                    {card.contested ? (
                        <button className={ITEM} onClick={() => fire(uncontestCard(gameId, cardRef))}>Uncontest</button>
                    ) : (
                        <button className={ITEM} onClick={() => fire(contestCard(gameId, cardRef))}>Contest</button>
                    )}
                </>
            )}

            {/* Properties */}
            {(showTitle || showNotes) && SEP}
            {showTitle && (
                inlineForm === 'title' ? (
                    <div className="px-3 py-2 flex flex-col gap-2">
                        <Input
                            size="sm"
                            value={titleInput}
                            onChange={e => setTitleInput(e.target.value)}
                            placeholder="Title…"
                            autoFocus
                            onKeyDown={e => {
                                if (e.key === 'Enter') fire(setTitle(gameId, cardRef, titleInput));
                                if (e.key === 'Escape') { e.stopPropagation(); setInlineForm(null); }
                            }}
                        />
                        <div className="flex gap-1 justify-end">
                            <button className="text-xs text-ink-muted hover:text-ink px-2 py-1 transition-colors" onClick={() => setInlineForm(null)}>Cancel</button>
                            <button
                                className="text-xs bg-arcane/20 text-ink rounded px-2 py-1 hover:bg-arcane/30 transition-colors"
                                onClick={() => fire(setTitle(gameId, cardRef, titleInput))}
                            >Save</button>
                        </div>
                    </div>
                ) : (
                    <button className={ITEM} onClick={() => setInlineForm('title')}>
                        <span className="flex-1">Set Title…</span>
                        {card.title && <span className="text-ink-muted text-xs truncate max-w-[80px]">{card.title}</span>}
                    </button>
                )
            )}
            {showNotes && inlineForm === 'notes' ? (
                <div className="px-3 py-2 flex flex-col gap-2">
                    <textarea
                        className="w-full px-3 py-1.5 text-xs rounded border border-line/60 bg-panel/30 text-ink placeholder:text-ink-muted outline-none focus:border-accent/60 resize-none"
                        rows={3}
                        value={notesInput}
                        onChange={e => setNotesInput(e.target.value)}
                        placeholder="Notes…"
                        autoFocus
                        onKeyDown={e => {
                            if (e.key === 'Escape') { e.stopPropagation(); setInlineForm(null); }
                        }}
                    />
                    <div className="flex gap-1 justify-end">
                        <button className="text-xs text-ink-muted hover:text-ink px-2 py-1 transition-colors" onClick={() => setInlineForm(null)}>Cancel</button>
                        <button
                            className="text-xs bg-arcane/20 text-ink rounded px-2 py-1 hover:bg-arcane/30 transition-colors"
                            onClick={() => fire(setCardNotes(gameId, cardRef, notesInput))}
                        >Save</button>
                    </div>
                </div>
            ) : showNotes ? (
                <button className={ITEM} onClick={() => setInlineForm('notes')}>
                    <span className="flex-1">Set Notes…</span>
                    {card.notes && <span className="text-ink-muted text-xs truncate max-w-[80px]">{card.notes}</span>}
                </button>
            ) : null}
        </div>,
        document.body
    );
}
