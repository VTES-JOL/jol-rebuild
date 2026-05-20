import type {CommandLogData, LogCardRef} from '@/features/game/commandLog.ts';
import {CardToken} from '@/shared/components/CardToken.tsx';

function CardRef({ref}: { ref: LogCardRef }) {
    if (ref.hidden || ref.cardId == null || ref.cardName == null) {
        const ownerPart = ref.owner ? `${ref.owner}'s ` : '';
        const pos = ref.childIndex >= 0
            ? `#${ref.position + 1}.${ref.childIndex + 1}`
            : `#${ref.position + 1}`;
        return <span className="text-ink-muted italic">card in {ownerPart}{ref.region.toLowerCase()} region ({pos})</span>;
    }
    return <CardToken id={ref.cardId} label={ref.cardName}/>;
}

function BriefContent({log}: { log: CommandLogData }) {
    const actor = <span className="font-medium">{log.actor}</span>;
    switch (log.commandType) {
        case 'ADVANCE_PHASE':
            return <span>{actor} advanced the phase</span>;
        case 'NEXT_TURN':
            return <span>Turn <span className="font-mono">{log.turn}</span> — <span className="font-medium">{log.playerName}</span> begins their turn</span>;
        case 'DRAW_CARD':
            return <span>{actor} drew <span className="font-medium">{log.count}</span> card(s)</span>;
        case 'SHUFFLE_LIBRARY':
            return <span>{actor} shuffled their library</span>;
        case 'SHUFFLE_CRYPT':
            return <span>{actor} shuffled their crypt</span>;
        case 'PLAY_CARD':
            return <span>{actor} played a card</span>;
        case 'DISCARD_CARD':
            return <span>{actor} discarded a card</span>;
        case 'MOVE_CARD':
            return <span>{actor} moved a card</span>;
        case 'ATTACH_CARD':
            return <span>{actor} attached a card</span>;
        case 'MOVE_TO_CRYPT':
            return <span>{actor} returned a vampire to the Crypt</span>;
        case 'INFLUENCE_CARD':
            return <span>{actor} moved a vampire to the Ready region</span>;
        case 'ADD_COUNTER':
            return <span>{actor} added <span className="font-medium">{log.amount}</span> counter(s)</span>;
        case 'REMOVE_COUNTER':
            return <span>{actor} removed <span className="font-medium">{log.amount}</span> counter(s)</span>;
        case 'MOVE_TO_TORPOR':
            return <span>{actor} sent a vampire to Torpor</span>;
        case 'RESCUE_FROM_TORPOR':
            return <span>{actor} rescued a vampire from Torpor</span>;
        case 'BURN_MINION':
            return <span>{actor} burned a vampire</span>;
        case 'CONTEST_CARD':
            return <span>{actor} contested a card</span>;
        case 'CLEAR_CONTEST_CARD':
            return <span>{actor} uncontested a card</span>;
        case 'SET_TITLE':
            return <span>{actor} set a card's title</span>;
        case 'SET_POOL':
            return <span>{actor} set <span className="font-medium">{log.targetPlayer}</span>'s pool to <span className="font-medium">{log.amount}</span></span>;
        case 'GAIN_EDGE':
            return <span>{actor} gained the Edge</span>;
        case 'TRANSFER_BLOOD':
            return <span>{actor} transferred <span className="font-medium">{Math.abs(log.amount)}</span> blood</span>;
        case 'OUST_PLAYER':
            return <span>{actor} ousted <span className="font-medium">{log.oustedPlayer}</span></span>;
        case 'REVERSE_ORDER':
            return <span>{actor} reversed the order of play</span>;
    }
}

function FullContent({log}: { log: CommandLogData }) {
    const actor = <span className="font-medium">{log.actor}</span>;
    switch (log.commandType) {
        case 'ADVANCE_PHASE':
            return <span>{actor} advanced to <span className="font-medium">{log.nextPhase}</span> phase</span>;
        case 'NEXT_TURN':
            return <span>Turn <span className="font-mono">{log.turn}</span> — <span className="font-medium">{log.playerName}</span> begins their turn</span>;
        case 'DRAW_CARD':
            return <span>{actor} drew <span className="font-medium">{log.count}</span> card(s)</span>;
        case 'SHUFFLE_LIBRARY':
            return <span>{actor} shuffled their library</span>;
        case 'SHUFFLE_CRYPT':
            return <span>{actor} shuffled their crypt</span>;
        case 'PLAY_CARD':
            return <span>{actor} played <CardRef ref={log.card}/></span>;
        case 'DISCARD_CARD':
            return <span>{actor} discarded <CardRef ref={log.card}/></span>;
        case 'MOVE_CARD':
            return <span>{actor} moved <CardRef ref={log.card}/> to <span className="font-medium">{log.targetPlayer}</span>'s {log.targetRegion.toLowerCase().replace(/_/g, ' ')}</span>;
        case 'ATTACH_CARD':
            return <span>{actor} attached <CardRef ref={log.card}/> to <CardRef ref={log.target}/></span>;
        case 'MOVE_TO_CRYPT':
            return <span>{actor} returned <CardRef ref={log.card}/> to the Crypt</span>;
        case 'INFLUENCE_CARD':
            return <span>{actor} moved <CardRef ref={log.card}/> to the Ready region</span>;
        case 'ADD_COUNTER':
            return <span>{actor} added <span className="font-medium">{log.amount}</span> counter(s) to <CardRef ref={log.card}/></span>;
        case 'REMOVE_COUNTER':
            return <span>{actor} removed <span className="font-medium">{log.amount}</span> counter(s) from <CardRef ref={log.card}/></span>;
        case 'MOVE_TO_TORPOR':
            return <span>{actor} sent <CardRef ref={log.card}/> to Torpor</span>;
        case 'RESCUE_FROM_TORPOR':
            return <span>{actor} rescued <CardRef ref={log.card}/> from Torpor</span>;
        case 'BURN_MINION':
            return <span>{actor} burned <CardRef ref={log.card}/></span>;
        case 'CONTEST_CARD':
            return <span>{actor} contested <CardRef ref={log.card}/></span>;
        case 'CLEAR_CONTEST_CARD':
            return <span>{actor} uncontested <CardRef ref={log.card}/></span>;
        case 'SET_TITLE':
            return <span>{actor} set <CardRef ref={log.card}/>'s title to <span className="font-medium">{log.title}</span></span>;
        case 'SET_POOL':
            return <span>{actor} set <span className="font-medium">{log.targetPlayer}</span>'s pool to <span className="font-medium">{log.amount}</span></span>;
        case 'GAIN_EDGE':
            return <span>{actor} gained the Edge</span>;
        case 'TRANSFER_BLOOD':
            return log.amount > 0
                ? <span>{actor} transferred <span className="font-medium">{log.amount}</span> blood onto <CardRef ref={log.card}/></span>
                : <span>{actor} transferred <span className="font-medium">{Math.abs(log.amount)}</span> blood off <CardRef ref={log.card}/></span>;
        case 'OUST_PLAYER':
            return <span>{actor} ousted <span className="font-medium">{log.oustedPlayer}</span></span>;
        case 'REVERSE_ORDER':
            return <span>{actor} reversed the order of play</span>;
    }
}

export function CommandLogContent({log, detail}: { log: CommandLogData; detail: 'full' | 'brief' }) {
    return detail === 'brief' ? <BriefContent log={log}/> : <FullContent log={log}/>;
}
