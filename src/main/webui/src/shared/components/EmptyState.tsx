import type {ComponentType, ReactNode} from 'react';

interface EmptyStateProps {
    icon?:        ComponentType<{ size?: number; className?: string }>;
    title:        string;
    description?: string;
    action?:      ReactNode;
    className?:   string;
}

export default function EmptyState({icon: Icon, title, description, action, className}: EmptyStateProps) {
    return (
        <div className={`flex flex-col items-center justify-center gap-3 p-8 text-center flex-1 ${className ?? ''}`}>
            {Icon && <Icon size={32} className="text-ink-muted/40" />}
            <div className="space-y-1">
                <p className="text-sm text-ink-muted">{title}</p>
                {description && <p className="text-xs text-ink-muted/70">{description}</p>}
            </div>
            {action}
        </div>
    );
}
