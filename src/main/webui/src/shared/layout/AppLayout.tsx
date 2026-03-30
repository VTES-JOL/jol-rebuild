import type {ReactNode} from "react";
import NavBar from "../components/NavBar.tsx";

export default function AppLayout({ children, background }: { children: ReactNode, background?: string }) {
    return (
        <div className="min-h-screen text-gray-200 bg-cover bg-no-repeat" style={{backgroundImage: `url('${background}`}}>
            <NavBar/>
            {/* Content */}
            <div className="relative p-8 mx-auto">
                {children}
            </div>
        </div>
    );
}