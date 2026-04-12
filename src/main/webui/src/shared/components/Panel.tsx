import type {ReactNode} from "react";

type PanelSize = 'default' | 'compact';

type Props = {
    title:      ReactNode;
    children:   ReactNode;
    right?:     ReactNode;
    footer?:    ReactNode;
    size?:      PanelSize;
    className?: string;
};

export default function Panel({title, children, right, footer, size = 'default', className}: Props) {
    const headerPy = size === 'compact' ? 'py-1.5' : 'py-2';
    return (
        <div className={`relative z-0 flex flex-col h-full min-h-0 overflow-hidden rounded-lg border border-line/75 bg-surface/70 backdrop-blur-md shadow-lg ${className ?? ''}`}>
            {/* Header */}
            <div className={`flex justify-between items-center px-4 ${headerPy} border-b border-line/75 bg-panel/45 shrink-0`}>
                <h2 className="tracking-wide text-ink">{title}</h2>
                {right && <div>{right}</div>}
            </div>

            {/* Content */}
            <div className="relative flex-1 min-h-0 flex flex-col">{children}</div>

            {/* Footer */}
            {footer && (
                <div className="shrink-0 border-t border-line/75 bg-panel/20">
                    {footer}
                </div>
            )}
        </div>
    );
}