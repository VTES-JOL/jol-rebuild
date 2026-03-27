type Props = {
    left: string;
    right: string;
    highlight?: boolean;
};

export default function GameRow({ left, right, highlight }: Props) {
    return (
        <div
            className={`
        flex justify-between py-1 px-4 text-sm
        ${highlight ? "text-blood" : "text-gray-300"}
      `}
        >
            <span>{left}</span>
            <span>{right}</span>
        </div>
    );
}