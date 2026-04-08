export default function GameToken({ id, label }: { id: number; label: string }) {
    console.log(id, label)
    return (
        <span className="relative inline-block bg-gold/20 border border-gold/30 rounded-md px-1 mx-0.5 text-xs text-gold">
            <span className={"inline-flex items-center gap-1 mx-0.5 rounded"}>{label}</span>
        </span>
    )
}