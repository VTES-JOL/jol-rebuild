import type {ReactNode} from "react";
import NavBar from "@/features/nav/NavBar.tsx";
import MobileBottomNav from "@/features/nav/MobileBottomNav.tsx";

export default function AppLayout({ children, background }: { children: ReactNode, background?: string }) {
    return (
        <div className="flex flex-col h-screen overflow-hidden text-ink bg-base bg-cover bg-center bg-no-repeat" style={{backgroundImage: background ? `url('${background}')` : undefined}}>
            <NavBar/>
            <div className="flex-1 flex flex-col min-h-0 relative px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-6 mx-auto max-w-screen-2xl w-full pb-14">
                {children}
            </div>
            <MobileBottomNav/>
        </div>
    );
}