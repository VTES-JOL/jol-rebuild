import type {ReactNode} from "react";

export default function HeroLayout({children, background}: { children: ReactNode, background?: string }) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-base bg-cover bg-center bg-no-repeat"
             style={{backgroundImage: background ? `url(${background})` : undefined}}>
            {children}
        </div>
    )
}