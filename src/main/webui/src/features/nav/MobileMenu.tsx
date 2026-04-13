import {useEffect, useRef, useState} from "react"
import {createPortal} from "react-dom"
import {useActiveRoute} from "@/hooks/useActiveRoute.ts"
import {NAV_ITEMS} from "./nav-config"
import {useAuthContext} from "@/contexts/AuthContext.tsx";
import {Link} from "react-router-dom"

export default function MobileMenu() {
    const [open, setOpen] = useState(false)
    const [menuTop, setMenuTop] = useState(0)
    const { user } = useAuthContext()
    const { isActive } = useActiveRoute()
    const buttonRef = useRef<HTMLButtonElement>(null)
    const menuRef = useRef<HTMLDivElement>(null)

    const handleToggle = () => {
        if (!open && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect()
            setMenuTop(rect.bottom)
        }
        setOpen(v => !v)
    }

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (
                buttonRef.current?.contains(e.target as Node) ||
                menuRef.current?.contains(e.target as Node)
            ) return
            setOpen(false)
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    useEffect(() => {
        function onEsc(e: KeyboardEvent) {
            if (e.key === "Escape") setOpen(false)
        }
        document.addEventListener("keydown", onEsc)
        return () => document.removeEventListener("keydown", onEsc)
    }, [])

    const menu = open && createPortal(
        <div
            ref={menuRef}
            style={{ position: "fixed", top: menuTop, left: 0, right: 0 }}
            className="z-[9999] border-t border-line/60 bg-panel/90 backdrop-blur-sm p-4 space-y-1"
        >
            {NAV_ITEMS.map(item => {
                if (item.roles && !item.roles.some(r => user?.roles.includes(r))) return null

                const Icon = item.icon
                const active = isActive(item.to)

                return (
                    <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-3 p-3 rounded ${active ? "text-ink" : "text-ink-muted"}`}
                    >
                        <Icon size={18} />
                        {item.label}
                    </Link>
                )
            })}
        </div>,
        document.body
    )

    return (
        <div className="md:hidden">
            <button ref={buttonRef} onClick={handleToggle} className="mr-2">☰</button>
            {menu}
        </div>
    )
}