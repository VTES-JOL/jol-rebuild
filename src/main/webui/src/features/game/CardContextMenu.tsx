import type {ReactNode} from 'react';
import {useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import type {CardData} from './types.ts';
import type {CardRef, GameCommand} from './gameCommands.ts';
import {
    addCounter, burnMinion, contestCard, discardCard, transferBloodOff, transferBloodOn,
    lockCard, moveToTorpor, playCard, removeCounter, rescueFromTorpor,
    setCardNotes, setTitle,
    clearContestCard, unlockCard,
} from './gameCommands.ts';
import Input from '@/shared/components/Input.tsx';
import {ClanIcon} from '@/shared/components/ClanIcon.tsx';
import {TypeIcon} from '@/shared/components/TypeIcon.tsx';

function CounterBtn({children, onClick, disabled}: {
    children: ReactNode;
    onClick: () => void;
    disabled?: boolean;
}) {
    return (
        <button
            className="w-6 h-6 flex items-center justify-center rounded text-sm text-ink hover:bg-hover transition-colors disabled:opacity-30 select-none"
            disabled={disabled}
            onClick={onClick}
        >{children}</button>
    );
}

type Props = {
    card: CardData;
    cardRef: CardRef;
    gameId: string;
    currentUser: string;
    playerPool: number;
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

export function CardContextMenu({card, cardRef, gameId, currentUser, playerPool, position, onCommand, onClose}: Props) {
    const menuRef = useRef<HTMLDivElement>(null);
    const [inlineForm, setInlineForm] = useState<InlineForm>(null);
    const [titleInput, setTitleInput] = useState(card.title ?? '');
    const [notesInput, setNotesInput] = useState(card.notes ?? '');

    const rawLeft    = position.x + 4;
    const rawTop     = position.y + 4;
    const nearBottom = rawTop  + MENU_MAX_H > window.innerHeight - 4;
    const nearRight  = rawLeft + MENU_MAX_W > window.innerWidth  - 4;
    const menuLeft   = Math.max(4, nearRight ? position.x - MENU_MAX_W - 4 : rawLeft);
    const menuTop    = nearBottom ? undefined : Math.max(4, rawTop);
    const menuBottom = nearBottom ? Math.max(4, window.innerHeight - position.y + 4) : undefined;

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
    const isSelf = cardRef.playerName === currentUser;
    const inPlay = region === 'READY' || region === 'TORPOR';
    const isCryptCard = card.type === 'Vampire' || card.type === 'Imbued' || card.crypt === true;
    const isMinion = card.minion === true || isCryptCard;
    const inPlayOrUncontrolled = inPlay || region === 'UNCONTROLLED';
    const showLockUnlock = inPlay;
    const showPoolTransfer = inPlayOrUncontrolled && isSelf;
    const showCounters = inPlayOrUncontrolled;
    const showMoveToTorpor = region === 'READY' && isMinion;
    const showRescue = region === 'TORPOR';
    const showPlay = region === 'HAND' && isSelf;
    const showDiscard = region === 'HAND' && isSelf;
    const showBurn = isMinion && inPlay;
    const showContest = card.unique === true && inPlay;
    const showTitle = isCryptCard && region === 'READY';
    const showNotes = (inPlay || region === 'HAND') && isSelf;
    const hasZoneSection = showPlay || showMoveToTorpor || showRescue || showDiscard || showBurn;

    const cardLabel = card.faceDown && !card.name ? '(hidden)' : (card.name ?? card.cardId ?? '—');

    return createPortal(
        <div
            ref={menuRef}
            style={{position: 'fixed', zIndex: 9999, left: menuLeft, top: menuTop, bottom: menuBottom}}
            className="min-w-52.5 max-w-70 rounded-lg border border-line/60 bg-surface/95 backdrop-blur-sm shadow-xl py-1"
            onContextMenu={e => e.preventDefault()}
        >
            {/* Header */}
            <div className="px-3 py-1.5 flex items-center gap-2 border-b border-line/40 mb-1">
                <span className="text-sm font-medium text-ink truncate flex-1">{cardLabel}</span>
                {isCryptCard && card.clan && <ClanIcon clan={card.clan} size={18} />}
                {!isCryptCard && (card.types ?? (card.type ? [card.type] : [])).map(t => (
                    <TypeIcon key={t} type={t} size={18} />
                ))}
            </div>

            {/* Lock / Unlock */}
            {showLockUnlock && (card.locked ? (
                <button className={ITEM} onClick={() => fire(unlockCard(gameId, cardRef))}>Unlock</button>
            ) : (
                <button className={ITEM} onClick={() => fire(lockCard(gameId, cardRef))}>Lock</button>
            ))}

            {/* Blood & pool counter controls */}
            {(showCounters || showPoolTransfer) && (
                <>
                    {SEP}
                    <div className="px-3 py-1 flex flex-col gap-0.5">
                        {/* Blood row: direct counter adjustment — [−] current / capacity [+] */}
                        {showCounters && (
                            <div className="flex items-center gap-1">
                                <span className="text-xs text-ink-muted w-8 shrink-0">Blood</span>
                                <div className="flex items-center gap-1 ml-auto">
                                    <CounterBtn
                                        disabled={(card.counters ?? 0) === 0}
                                        onClick={() => onCommand(removeCounter(gameId, cardRef))}
                                    >−</CounterBtn>
                                    <span className="text-sm font-mono text-blood tabular-nums min-w-[1.5ch] text-center">
                                        {card.counters ?? 0}
                                    </span>
                                    {card.capacity != null && (
                                        <>
                                            <span className="text-xs text-ink-muted/60">/</span>
                                            <span className="text-sm font-mono text-ink-muted tabular-nums min-w-[1.5ch]">
                                                {card.capacity}
                                            </span>
                                        </>
                                    )}
                                    <CounterBtn onClick={() => onCommand(addCounter(gameId, cardRef))}>+</CounterBtn>
                                </div>
                            </div>
                        )}
                        {/* Pool↔card transfer: blood [←] label [→] pool */}
                        {showPoolTransfer && (
                            <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-sm font-mono text-blood tabular-nums min-w-[1.5ch] text-center">
                                    {card.counters ?? 0}
                                </span>
                                <CounterBtn
                                    disabled={playerPool === 0}
                                    onClick={() => onCommand(transferBloodOn(gameId, cardRef))}
                                >←</CounterBtn>
                                <span className="text-xs text-ink-muted flex-1 text-center">Transfer</span>
                                <CounterBtn
                                    disabled={(card.counters ?? 0) === 0}
                                    onClick={() => onCommand(transferBloodOff(gameId, cardRef))}
                                >→</CounterBtn>
                                <span className="text-sm font-mono text-gold tabular-nums min-w-[1.5ch] text-center">
                                    {playerPool}
                                </span>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Zone moves */}
            {hasZoneSection && (
                <>
                    {SEP}
                    {showPlay && (
                        <button className={ITEM} onClick={() => fire(playCard(gameId, cardRef, cardRef.playerName))}>Play</button>
                    )}
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
                        <button className={ITEM} onClick={() => fire(clearContestCard(gameId, cardRef))}>Uncontest</button>
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
                        {card.title && <span className="text-ink-muted text-xs truncate max-w-20">{card.title}</span>}
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
                    {card.notes && <span className="text-ink-muted text-xs truncate max-w-20">{card.notes}</span>}
                </button>
            ) : null}
        </div>,
        document.body
    );
}
