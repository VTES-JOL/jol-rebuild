import {Link} from "react-router-dom";
import {useAuthContext} from "@/hooks/useAuthContext.ts";
import UserMenu from "./UserMenu";
import {NAV_ITEMS} from "./nav-config.ts";
import MobileMenu from "./MobileMenu";
import NavItem from "./NavItem"

export default function AppNavbar() {
    const {user} = useAuthContext()

    return (
        <div className="relative z-50 border-b border-line/60 text-ink bg-panel/70 backdrop-blur-sm">
            <div className="h-12 px-6 flex items-center gap-8">

                {/* mobile hamburger */}
                <MobileMenu />

                {/* logo */}
                <div>
                    <Link to="/" className="font-semibold text-lg">V:TES Online</Link>
                </div>

                <nav className="hidden md:flex gap-8 text-sm flex-1">
                    {NAV_ITEMS.map(item => {
                        if (item.roles && !item.roles.some(r => user?.roles.includes(r))) {
                            return null
                        }

                        return <NavItem key={item.to} item={item} />
                    })}
                </nav>

                {/* right side */}
                <div className="ml-auto flex items-center gap-4">
                    <UserMenu/>
                </div>
            </div>
        </div>
    )
}