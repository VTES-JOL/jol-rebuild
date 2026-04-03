import {Link} from "react-router-dom";
import {useAuth} from "@/features/auth/AuthContext";
import type {User} from "@/features/auth/types.ts";
import UserMenu from "./UserMenu";
import {NAV_ITEMS} from "./nav-config.ts";
import MobileMenu from "./MobileMenu";
import NavItem from "./NavItem"

export const hasRole = (user: User | null, role: string) => user?.roles.includes(role) ?? false

export default function AppNavbar() {
    const {user} = useAuth()

    return (
        <div className="border-b border-slate-800 text-slate-200 bg-slate-800/30">
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