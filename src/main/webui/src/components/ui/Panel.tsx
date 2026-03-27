import type {ReactNode} from "react";

type Props = {
    title: string;
    children: ReactNode;
    right?: ReactNode;
    className?: string;
};

export default function Panel({title, children, right, className}: Props) {
    return (
        <div className={` relative rounded-lg border border-white/10 ${className} `}>

            {/* Header */}
            <div className="flex justify-between items-center px-4 py-2 border-b border-white/10 font-gothic">
                <h2 className="tracking-wide text-gray-200">{title}</h2>
                {right}
            </div>

            {/* Content */}
            <div className="relative z-10">{children}</div>
        </div>
    );
}