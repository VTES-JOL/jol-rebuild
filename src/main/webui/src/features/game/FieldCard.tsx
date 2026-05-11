import {memo} from 'react';
import type {CardData} from './CardStack.tsx';

const BACK_SRC = {
    crypt:   'https://static.deckserver.net/images/crypt.jpg',
    library: 'https://static.deckserver.net/images/library.jpg',
};

export const FieldCard = memo(function FieldCard({id, crypt, faceDown = false, locked = false}: CardData) {
    const src = faceDown
        ? (crypt ? BACK_SRC.crypt : BACK_SRC.library)
        : `https://static.deckserver.net/images/${id}`;
    const alt = faceDown ? `${crypt ? 'Crypt' : 'Library'} card back` : `Card ${id}`;

    return (
        <div className={`aspect-5/7 overflow-hidden rounded shadow-md transition-transform duration-200${locked ? ' rotate-90' : ''}`}>
            <img src={src} alt={alt} loading="lazy" className="w-full h-full object-cover" />
        </div>
    );
});
