import { useActiveRoute } from "./useActiveRoute"
import { NAV_ITEMS } from "./nav-config"
import { useAuth } from "@/features/auth/AuthContext"
import { Link } from "react-router-dom"
import {useState} from "react";

export default function MobileMenu() {
    const [open, setOpen] = useState(false)
    const { user } = useAuth()
    const { isActive } = useActiveRoute()

    return (
        <div className="md:hidden">
            <button onClick={() => setOpen(!open)} className="mr-2">☰</button>

            {open && (
                <div className="absolute left-0 top-14 w-full  border-t border-slate-800 p-4 space-y-1">
                    {NAV_ITEMS.map(item => {
                        if (item.roles && !item.roles.some(r => user?.roles.includes(r))) {
                            return null
                        }

                        const Icon = item.icon
                        const active = isActive(item.to)

                        return (
                            <Link
                                key={item.to}
                                to={item.to}
                                className={`flex items-center gap-3 p-3 rounded 
                ${active ? " text-white" : "text-slate-400"}`}
                            >
                                <Icon size={18} />
                                {item.label}
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    )
}