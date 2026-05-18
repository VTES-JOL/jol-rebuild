import {memo} from 'react';
import type {CardData} from './types.ts';

type FieldCardProps = CardData & {suppressTransition?: boolean};

const CRYPT_BACK = 'https://static.deckserver.net/images/crypt.jpg';
const LIBRARY_BACK = 'https://static.deckserver.net/images/library.jpg';

export const FieldCard = memo(function FieldCard({id, cardId, crypt, type, faceDown = false, locked = false, suppressTransition = false, capacity, counters}: FieldCardProps) {
    const isCrypt = type === 'Vampire' || type === 'Imbued' || crypt === true;
    const src = (faceDown || !cardId)
        ? (isCrypt ? CRYPT_BACK : LIBRARY_BACK)
        : `https://static.deckserver.net/images/${cardId}`;
    const alt = faceDown ? `${isCrypt ? 'Crypt' : 'Library'} card back` : `Card ${cardId ?? id}`;

    return (
        <div className={[
            'relative aspect-5/7 rounded shadow-md',
            !suppressTransition && 'transition-transform duration-200',
            locked && 'rotate-90',
        ].filter(Boolean).join(' ')}>
            <div className="absolute inset-0 overflow-hidden rounded">
                <img src={src} alt={alt} className="w-full h-full object-cover" />
            </div>

            {!faceDown && capacity != null && isCrypt && (
                <div className="absolute bottom-1 right-1 min-w-5 h-5 rounded-full bg-red-500 flex items-center justify-center shadow-lg border border-white/40 px-1 pointer-events-none">
                    <span className="text-white font-bold text-[11px] leading-none drop-shadow">{capacity}</span>
                </div>
            )}

            {counters != null && counters > 0 && (
                <div className="absolute top-[20%] left-[5%] right-[5%] flex flex-wrap gap-[3%] pointer-events-none">
                    {counters <= 5
                        ? Array.from({length: counters}, (_, i) => (
                            <div key={i} className="rounded-full border border-white/70"
                                 style={{
                                     width: 'clamp(9px, calc(var(--card-w, 96px) * 0.14), 20px)',
                                     height: 'clamp(9px, calc(var(--card-w, 96px) * 0.14), 20px)',
                                     background: 'radial-gradient(circle at 35% 35%, #fca5a5, #b91c1c)',
                                     boxShadow: '0 1px 4px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,0,0,0.3)',
                                 }} />
                        ))
                        : (
                            <div className="flex items-center bg-red-600/90 rounded-full border border-white/30 shadow-md"
                                 style={{padding: 'clamp(1px, calc(var(--card-w, 96px) * 0.02), 3px) clamp(3px, calc(var(--card-w, 96px) * 0.05), 6px)'}}>
                                <span className="text-white font-bold leading-none drop-shadow"
                                      style={{fontSize: 'clamp(8px, calc(var(--card-w, 96px) * 0.11), 12px)'}}>{counters}</span>
                            </div>
                        )
                    }
                </div>
            )}
        </div>
    );
});
