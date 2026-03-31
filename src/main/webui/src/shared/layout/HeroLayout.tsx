import type {ReactNode} from "react";

export default function HeroLayout({children, background}: { children: ReactNode, background?: string }) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-cover bg-no-repeat bg-slate-800"
             style={{
                 backgroundImage: `url(${background})`
             }}>
            {children}
        </div>
    )
}