import React, {useEffect, useRef, useState} from "react"
import {Link} from "react-router-dom"
import {useAuthContext} from "@/hooks/useAuthContext.ts"

export default function UserMenu() {
    const { user, logout } = useAuthContext()
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    // close on outside click
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false)
            }
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

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-3 hover: px-3 py-2 rounded"
            >
                <Avatar username={user.username} />
                <span className="hidden sm:block">{user.username}</span>
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-64 z-50 bg-surface/95 backdrop-blur-sm border border-line/60 text-ink rounded-xl shadow-lg overflow-hidden">

                    {/* header */}
                    <div className="px-4 py-3 border-b border-line/60">
                        <div className="font-semibold text-ink">{user.username}</div>
                        <div className="text-sm text-ink-muted">{user.email}</div>
                    </div>

                    {/* links */}
                    <MenuLink to="/profile">Profile</MenuLink>
                    <MenuLink to="/settings">Settings</MenuLink>

                    {user.roles.includes("admin") && (
                        <MenuLink to="/admin">Admin Panel</MenuLink>
                    )}

                    <div className="border-t border-line/60" />

                    <button onClick={logout} className="w-full text-left px-4 py-3 text-blood hover:bg-hover transition-colors">Logout</button>
                </div>
            )}
        </div>
    )
}

function MenuLink({ to, children }: { to:string, children: React.ReactNode }) {
    return (
        <Link to={to} className="block px-4 py-3 text-ink hover:bg-hover transition-colors">
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