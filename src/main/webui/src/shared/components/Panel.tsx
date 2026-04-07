import type {ReactNode} from "react";

type Props = {
    title: string;
    children: ReactNode;
    right?: ReactNode;
    className?: string;
};

export default function Panel({title, children, right, className}: Props) {
    return (
        <div className={`relative flex flex-col rounded-lg border border-slate-900 ${className} text-gray-200`}>
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-2 border-b border-slate-900 bg-slate-900/30">
                <h2 className="tracking-wide">{title}</h2>
                {right}
            </div>

            {/* Content */}
            <div className="relative z-10 flex-1 min-h-0 flex flex-col bg-slate-800/30">{children}</div>
        </div>
    );
}