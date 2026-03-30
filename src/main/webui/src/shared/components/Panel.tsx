import type {ReactNode} from "react";

type Props = {
    title: string;
    children: ReactNode;
    right?: ReactNode;
    className?: string;
};

export default function Panel({title, children, right, className}: Props) {
    return (
        <div className={` relative rounded-lg border border-white/10 ${className} bg-slate-900 opacity-80 text-gray-200`}>

            {/* Header */}
            <div className="flex justify-between items-center px-4 py-2 border-b border-white/10">
                <h2 className="tracking-wide">{title}</h2>
                {right}
            </div>

            {/* Content */}
            <div className="relative z-10">{children}</div>
        </div>
    );
}