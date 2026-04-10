import CryptCardRow from './CryptCardRow';
import LibraryCardRow from './LibraryCardRow';
import type {CardDetailData, DeckEntry} from './types';

interface Props {
    entry: DeckEntry;
    iconData?: CardDetailData;
    onIncrement: () => void;
    onDecrement: () => void;
}

export default function DeckCardRow({ entry, iconData, onIncrement, onDecrement }: Props) {
    return entry.isCrypt
        ? <CryptCardRow   entry={entry} iconData={iconData} onIncrement={onIncrement} onDecrement={onDecrement} />
        : <LibraryCardRow entry={entry} iconData={iconData} onIncrement={onIncrement} onDecrement={onDecrement} />;
}
