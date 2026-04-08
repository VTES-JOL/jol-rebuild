interface Props {
    summary: string; // double-space delimited "Label: value  Label: value"
    validate?: boolean;
    className?: string;
}

function isValid(label: string, value: string): boolean {
    if (label === 'Crypt')   return parseInt(value) >= 12;
    if (label === 'Library') { const n = parseInt(value); return n >= 60 && n <= 90; }
    if (label === 'Groups')  {
        const groups = value.split('/').map(Number);
        if (groups.length > 2) return false;
        if (groups.length === 1) return true;
        return groups[1] === groups[0] + 1;
    }
    return true;
}

export default function SummaryStats({ summary, validate = false, className = '' }: Props) {
    const stats = summary.split(/\s{2,}/).map(seg => {
        const colon = seg.indexOf(':');
        return { label: seg.slice(0, colon).trim(), value: seg.slice(colon + 1).trim() };
    });

    const hasError = validate && stats.some(s => !isValid(s.label, s.value));

    return (
        <div className={[
            'inline-flex items-center rounded border overflow-hidden text-[10px] leading-none tabular-nums',
            hasError
                ? 'border-blood/40 bg-hover/60 divide-x divide-blood/20'
                : 'border-line/60 bg-hover/60 divide-x divide-line/60',
            className,
        ].join(' ')}>
            {stats.map((stat, i) => {
                const invalid = validate && !isValid(stat.label, stat.value);
                return (
                    <span key={i} className={`inline-flex items-center gap-1 px-1.5 py-0.5 ${invalid ? 'bg-blood/10' : ''}`}>
                        <span className={invalid ? 'text-blood-soft' : 'text-ink-muted'}>{stat.label}</span>
                        <span className={`font-semibold ${invalid ? 'text-blood-soft' : 'text-ink-secondary'}`}>{stat.value}</span>
                    </span>
                );
            })}
        </div>
    );
}
