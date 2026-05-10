const BACK_SRC = {
    crypt:   'https://static.deckserver.net/images/crypt.jpg',
    library: 'https://static.deckserver.net/images/library.jpg',
};

type Props = {
    id: string;
    crypt: boolean;
    faceDown?: boolean;
};

export function FieldCard({ id, crypt, faceDown = false }: Props) {
    const src = faceDown
        ? (crypt ? BACK_SRC.crypt : BACK_SRC.library)
        : `https://static.deckserver.net/images/${id}`;
    const alt = faceDown ? `${crypt ? 'Crypt' : 'Library'} card back` : `Card ${id}`;

    return (
        <div className="aspect-[5/7] overflow-hidden rounded-lg shadow-md">
            <img src={src} alt={alt} className="w-full h-full object-cover" />
        </div>
    );
}
