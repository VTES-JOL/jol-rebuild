type Props = {
    status: 'connecting' | 'connected' | 'disconnected' | 'error';
};

export function ChatStatusBadge({ status }: Props) {
    const color =
        status === 'connected'
            ? 'text-online'
            : status === 'connecting'
                ? 'text-away'
                : status === 'error'
                    ? 'text-blood-soft'
                    : 'text-offline';

    return <span className={`text-xs ${color}`}>{status}</span>;
}