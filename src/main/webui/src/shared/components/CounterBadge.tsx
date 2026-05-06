export type CounterType = 'blood' | 'life' | 'corruption' | 'generic';

interface CounterBadgeProps {
    type: CounterType;
    amount: number;
    size?: number;
    className?: string;
}

const BG: Record<CounterType, string> = {
    blood:      'bg-blood-bright',
    life:       'bg-online',
    corruption: 'bg-arcane',
    generic:    'bg-offline',
};

const LABEL: Record<CounterType, string> = {
    blood:      'blood',
    life:       'life',
    corruption: 'corruption',
    generic:    'counter',
};

export function CounterBadge({ type, amount, size = 20, className = '' }: CounterBadgeProps) {
    // Scale font so 2-digit numbers fit without overflow.
    // Single-digit values get a slightly larger font for readability.
    const fontSize = Math.round(size * (amount >= 10 ? 0.46 : 0.56));

    return (
        <span
            role="img"
            aria-label={`${amount} ${LABEL[type]}`}
            title={`${amount} ${LABEL[type]}`}
            className={`inline-flex items-center justify-center rounded-full text-white font-bold tabular-nums shrink-0 ring-1 ring-inset ring-white/20 ${BG[type]} ${className}`}
            style={{ width: size, height: size, fontSize, lineHeight: 1, verticalAlign: 'middle' }}
        >
            <span style={{ transform: 'translateY(-0.05em)', display: 'block' }}>{amount}</span>
        </span>
    );
}
