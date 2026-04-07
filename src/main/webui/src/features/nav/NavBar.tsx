import {Link} from "react-router-dom";
import {useAuthContext} from "@/hooks/useAuthContext.ts";
import UserMenu from "./UserMenu";
import {NAV_ITEMS} from "./nav-config.ts";
import MobileMenu from "./MobileMenu";
import NavItem from "./NavItem"
export default function AppNavbar() {
    const {user} = useAuthContext()

    return (
        <div className="border-b border-slate-900 text-slate-200 bg-slate-900/30">
            <div className="h-14 px-6 flex items-center gap-8">

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