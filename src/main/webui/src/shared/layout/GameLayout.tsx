import NavBar from "@/features/nav/NavBar";
import type {ReactNode} from "react";

export default function GameLayout({children} : {children: ReactNode}) {
    return (
        <div className="flex flex-col h-screen overflow-hidden text-ink bg-base bg-cover bg-center bg-no-repeat">
            <NavBar/>
            <div className="flex flex-col gap-4 h-full min-h-0">
                {children}
            </div>
        </div>
    )
}