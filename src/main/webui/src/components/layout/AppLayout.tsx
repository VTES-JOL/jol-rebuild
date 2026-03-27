import type {ReactNode} from "react";

export default function AppLayout({ children, background }: { children: ReactNode, background?: string }) {
    return (
        <div className="min-h-screen text-gray-200" style={{backgroundImage: `url('${background}`}}>
            {/* Content */}
            <div className="relative z-10 p-8 max-w-6xl mx-auto">
                {children}
            </div>
        </div>
    );
}