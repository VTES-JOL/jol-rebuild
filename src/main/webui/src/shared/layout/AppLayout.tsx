import type {ReactNode} from "react";
import NavBar from "@/features/nav/NavBar.tsx";

export default function AppLayout({ children, background }: { children: ReactNode, background?: string }) {
    return (
        <div className="min-h-screen text-ink bg-base bg-cover bg-center bg-no-repeat" style={{backgroundImage: background ? `url('${background}')` : undefined}}>
            <NavBar/>
            <div className="relative p-8 mx-auto">
                {children}
            </div>
        </div>
    );
}