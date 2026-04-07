type Props = {
    status: 'connecting' | 'connected' | 'disconnected' | 'error';
};

export function ChatStatusBadge({ status }: Props) {
    const color =
        status === 'connected'
            ? 'text-emerald-400'
            : status === 'connecting'
                ? 'text-amber-400'
                : status === 'error'
                    ? 'text-red-400'
                    : 'text-slate-400';

    return <span className={`text-xs ${color}`}>{status}</span>;
}