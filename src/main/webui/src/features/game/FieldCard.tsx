type Props = {
    id: string;
};

export function FieldCard({ id }: Props) {
    return (
        <div className="aspect-[5/7] overflow-hidden rounded-lg shadow-md">
            <img
                src={`https://static.deckserver.net/images/${id}`}
                alt={`Card ${id}`}
                className="w-full h-full object-cover"
            />
        </div>
    );
}
