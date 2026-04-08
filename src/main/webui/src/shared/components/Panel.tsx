import type {ReactNode} from "react";

type Props = {
    title: ReactNode;
    children: ReactNode;
    right?: ReactNode;
    className?: string;
};

export default function Panel({title, children, right, className}: Props) {
    return (
        <div className={`relative z-0 flex flex-col rounded-lg border border-line/75 bg-surface/60 backdrop-blur-md shadow-lg ${className}`}>
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-2 border-b border-line/75 bg-panel/45">
                <h2 className="tracking-wide text-ink">{title}</h2>
                {right}
            </div>

            {/* Content */}
            <div className="relative flex-1 min-h-0 flex flex-col">{children}</div>
        </div>
    );
}