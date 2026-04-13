import React, {useEffect, useRef, useState} from "react"
import {createPortal} from "react-dom"
import {Link} from "react-router-dom"
import {useAuthContext} from "@/features/auth/AuthContext.tsx";
import {useDarkMode} from "@/hooks/useDarkMode.ts"

export default function UserMenu() {
    const { user, logout } = useAuthContext()
    const { dark, toggle } = useDarkMode()
    const [open, setOpen] = useState(false)
    const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 })
    const buttonRef = useRef<HTMLButtonElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const handleToggle = () => {
        if (!open && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect()
            setDropdownPos({
                top: rect.bottom + 8,
                right: window.innerWidth - rect.right,
            })
        }
        setOpen(v => !v)
    }

    // close on outside click
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (
                buttonRef.current?.contains(e.target as Node) ||
                dropdownRef.current?.contains(e.target as Node)
            ) return
            setOpen(false)
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    // close on ESC
    useEffect(() => {
        function onEsc(e: KeyboardEvent) {
            if (e.key === "Escape") setOpen(false)
        }
        document.addEventListener("keydown", onEsc)
        return () => document.removeEventListener("keydown", onEsc)
    }, [])

    if (!user) return null

    const dropdown = open && createPortal(
        <div
            ref={dropdownRef}
            style={{ position: "fixed", top: dropdownPos.top, right: dropdownPos.right }}
            className="w-64 z-[9999] bg-surface/95 backdrop-blur-sm border border-line/60 text-ink rounded-xl shadow-lg overflow-hidden"
        >
            {/* header */}
            <div className="px-4 py-3 border-b border-line/60">
                <div className="font-semibold text-ink">{user.username}</div>
                <div className="text-sm text-ink-muted">{user.email}</div>
            </div>

            {/* dark mode toggle */}
            <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-ink-muted">Dark mode</span>
                <button
                    onClick={toggle}
                    aria-label="Toggle dark mode"
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${dark ? "bg-accent" : "bg-hover"}`}
                >
                    <span className={`inline-block h-5 w-5 rounded-full bg-surface shadow transform transition-transform duration-200 ${dark ? "translate-x-5" : "translate-x-0"}`} />
                </button>
            </div>

            <div className="border-t border-line/60" />

            {/* links */}
            <MenuLink to="/profile" onNavigate={() => setOpen(false)}>Profile</MenuLink>
            <MenuLink to="/settings" onNavigate={() => setOpen(false)}>Settings</MenuLink>

            {user.roles.includes("admin") && (
                <MenuLink to="/admin" onNavigate={() => setOpen(false)}>Admin Panel</MenuLink>
            )}

            <div className="border-t border-line/60" />

            <button onClick={logout} className="w-full text-left px-4 py-3 text-sm text-blood hover:bg-hover transition-colors cursor-pointer">Logout</button>
        </div>,
        document.body
    )

    return (
        <div className="relative">
            <button
                ref={buttonRef}
                onClick={handleToggle}
                className="flex items-center gap-3 px-3 py-2 rounded"
            >
                <Avatar username={user.username} />
                <span className="hidden sm:block">{user.username}</span>
            </button>

            {dropdown}
        </div>
    )
}

function MenuLink({ to, children, onNavigate }: { to: string, children: React.ReactNode, onNavigate: () => void }) {
    return (
        <Link to={to} onClick={onNavigate} className="block px-4 py-3 text-ink hover:bg-hover transition-colors">
            {children}
        </Link>
    )
}

function Avatar({ username }: { username: string }) {
    return (
        <div className="h-8 w-8 rounded-full bg-accent text-surface flex items-center justify-center font-bold">
            {username[0].toUpperCase()}
        </div>
    )
}