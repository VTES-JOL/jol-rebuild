import {memo} from 'react';
import type {CardData} from './types.ts';

type FieldCardProps = CardData & {suppressTransition?: boolean};

const CRYPT_BACK = 'https://static.deckserver.net/images/crypt.jpg';
const LIBRARY_BACK = 'https://static.deckserver.net/images/library.jpg';

export const FieldCard = memo(function FieldCard({id, cardId, crypt, type, faceDown = false, locked = false, suppressTransition = false}: FieldCardProps) {
    const isCrypt = type === 'VAMPIRE' || type === 'IMBUED' || crypt === true;
    const src = faceDown
        ? (isCrypt ? CRYPT_BACK : LIBRARY_BACK)
        : `https://static.deckserver.net/images/${cardId ?? id}`;
    const alt = faceDown ? `${isCrypt ? 'Crypt' : 'Library'} card back` : `Card ${cardId ?? id}`;

    return (
        <div className={[
            'aspect-5/7 overflow-hidden rounded shadow-md',
            !suppressTransition && 'transition-transform duration-200',
            locked && 'rotate-90',
        ].filter(Boolean).join(' ')}>
            <img src={src} alt={alt} loading="lazy" className="w-full h-full object-cover" />
        </div>
    );
});
