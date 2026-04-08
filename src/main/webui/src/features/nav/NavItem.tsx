import {Link} from "react-router-dom"
import {useActiveRoute} from "@/hooks/useActiveRoute.ts"
import type {NavItem as NavItemType} from "./nav-config"

export default function NavItem({ item }: { item: NavItemType }) {
    const { isActive } = useActiveRoute()
    const active = isActive(item.to)
    const Icon = item.icon

    return (
        <Link
            to={item.to}
            className={`
        relative flex items-center gap-2 px-1 py-1 text-sm transition-colors
        ${active ? "text-ink" : "text-ink-muted hover:text-ink"}
      `}
        >
            <Icon size={16} />

            {item.label}

            {/* animated active bar */}
            {active && (
                <div className="absolute -bottom-[13px] left-0 right-0 h-[2px] bg-accent rounded-full" />
            )}
        </Link>
    )
}