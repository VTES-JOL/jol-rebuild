export default function GameToken({ id, label }: { id: number; label: string }) {
    console.log(id, label)
    return (
        <span className="relative inline-block bg-amber-500/20 border border-amber-400/30 rounded-md px-1 mx-0.5 text-xs">
            <span className={"inline-flex items-center gap-1 mx-0.5 rounded"}>{label}</span>
        </span>
    )
}