interface Tab {
    key:   string;
    label: string;
}

interface TabStripProps {
    tabs:      Tab[];
    active:    string;
    onChange:  (key: string) => void;
    size?:     'xs' | 'sm';
    className?: string;
}

export function TabStrip({tabs, active, onChange, size = 'xs', className}: TabStripProps) {
    const base = size === 'sm'
        ? 'text-xs px-3 py-1 rounded transition-colors cursor-pointer'
        : 'text-[10px] px-2 py-0.5 rounded transition-colors cursor-pointer';

    return (
        <div className={`flex gap-1 ${className ?? ''}`}>
            {tabs.map(tab => (
                <button
                    key={tab.key}
                    onClick={() => onChange(tab.key)}
                    className={[
                        base,
                        tab.key === active
                            ? 'bg-accent/20 text-accent-soft'
                            : 'text-ink-muted hover:text-ink',
                    ].join(' ')}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
