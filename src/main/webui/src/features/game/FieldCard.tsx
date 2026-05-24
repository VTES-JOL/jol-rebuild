import {memo} from 'react';
import type {CardData} from './types.ts';
import {useCardPreview} from '@/hooks/useCardPreview.tsx';

type FieldCardProps = CardData & {suppressTransition?: boolean};

const CRYPT_BACK = 'https://static.deckserver.net/images/crypt.jpg';
const LIBRARY_BACK = 'https://static.deckserver.net/images/library.jpg';

export const FieldCard = memo(function FieldCard({id, cardId, crypt, type, faceDown = false, locked = false, suppressTransition = false, capacity, counters}: FieldCardProps) {
    const isCrypt = type === 'Vampire' || type === 'Imbued' || crypt === true;
    const src = (faceDown || !cardId)
        ? (isCrypt ? CRYPT_BACK : LIBRARY_BACK)
        : `https://static.deckserver.net/images/${cardId}`;
    const alt = faceDown ? `${isCrypt ? 'Crypt' : 'Library'} card back` : `Card ${cardId ?? id}`;

    const showPreview = !faceDown && !!cardId;
    const {anchorRef, onClick, tooltip} = useCardPreview<HTMLDivElement>(cardId ?? '');

    // While the card image loads, show the card back as a background so there's
    // no flash of alt text. The foreground img fades in once it's ready.
    const needsLoadingBack = !faceDown && !!cardId;
    const cardBack = isCrypt ? CRYPT_BACK : LIBRARY_BACK;

    return (
        <>
        <div
            ref={showPreview ? anchorRef : undefined}
            onClick={showPreview ? onClick : undefined}
            className={[
            'relative aspect-5/7 rounded shadow-md',
            !suppressTransition && 'transition-transform duration-200',
            locked && 'rotate-90',
        ].filter(Boolean).join(' ')}>
            <div
                className="absolute inset-0 overflow-hidden rounded"
                style={needsLoadingBack ? {backgroundImage: `url(${cardBack})`, backgroundSize: 'cover'} : undefined}
            >
                <img
                    src={src}
                    alt={alt}
                    className="w-full h-full object-cover"
                    style={needsLoadingBack ? {opacity: 0, transition: 'opacity 150ms'} : undefined}
                    onLoad={needsLoadingBack ? (e => { e.currentTarget.style.opacity = '1'; }) : undefined}
                    onError={needsLoadingBack ? (e => { e.currentTarget.style.display = 'none'; }) : undefined}
                />
            </div>

            {!faceDown && capacity != null && isCrypt && (
                <div className="absolute bottom-1 right-1 min-w-5 h-5 rounded-full bg-red-500 flex items-center justify-center shadow-lg border border-white/40 px-1 pointer-events-none">
                    <span className="text-white font-bold text-[11px] leading-none drop-shadow">{capacity}</span>
                </div>
            )}

            {counters != null && counters > 0 && (
                counters <= 20
                    ? (
                        <div
                            className="absolute pointer-events-none overflow-hidden"
                            style={{
                                top: '15%', left: '20%', right: '10%', bottom: '20%',
                                display: 'grid',
                                gridTemplateColumns: 'repeat(4, 1fr)',
                                gap: '4%',
                                alignContent: 'start',
                            }}
                        >
                            {Array.from({length: counters}, (_, i) => (
                                <div key={i} className="rounded-full border border-white/70"
                                     style={{
                                         aspectRatio: '1',
                                         background: 'radial-gradient(circle at 35% 35%, #fca5a5, #b91c1c)',
                                         boxShadow: '0 1px 4px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,0,0,0.3)',
                                     }} />
                            ))}
                        </div>
                    )
                    : (
                        <div
                            className="absolute pointer-events-none flex items-center justify-center"
                            style={{top: '15%', left: '20%', right: '10%', bottom: '20%'}}
                        >
                            <div
                                className="rounded-full bg-red-600/90 border border-white/30 shadow-lg flex items-center justify-center"
                                style={{
                                    width: 'calc(var(--card-w, 96px) * 0.38)',
                                    height: 'calc(var(--card-w, 96px) * 0.38)',
                                }}
                            >
                                <span className="text-white font-bold leading-none drop-shadow"
                                      style={{fontSize: 'calc(var(--card-w, 96px) * 0.16)'}}>{counters}</span>
                            </div>
                        </div>
                    )
            )}
        </div>
        {tooltip}
        </>
    );
});
