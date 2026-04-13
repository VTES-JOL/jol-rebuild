import {Link} from "react-router-dom";
import {useAuthContext} from "@/contexts/AuthContext.tsx";
import UserMenu from "./UserMenu";
import {getVisibleNavItems} from "./nav-config.ts";
import NavItem from "./NavItem"

export default function AppNavbar() {
    const {user} = useAuthContext()
    const navItems = getVisibleNavItems(user?.roles)

    return (
        <div className="relative z-50 border-b border-line/60 text-ink bg-panel/70 backdrop-blur-sm shrink-0">
            <div className="h-12 px-6 flex items-center gap-8">

                {/* logo */}
                <div>
                    <Link to="/" className="font-bold tracking-wide text-ink text-lg">V:TES Online</Link>
                </div>

                <nav className="hidden md:flex gap-8 text-sm flex-1">
                    {navItems.map(item => <NavItem key={item.to} item={item} />)}
                </nav>

                {/* right side */}
                <div className="ml-auto flex items-center gap-4">
                    <UserMenu/>
                </div>
            </div>
        </div>
    )
}