import { Link } from "react-router-dom"
import { useActiveRoute } from "./useActiveRoute"
import type { NavItem as NavItemType } from "./nav-config"

export default function NavItem({ item }: { item: NavItemType }) {
    const { isActive } = useActiveRoute()
    const active = isActive(item.to)
    const Icon = item.icon

    return (
        <Link
            to={item.to}
            className={`
        relative flex items-center gap-2 px-1 py-1 text-sm transition-colors
        ${active ? "text-white" : "text-slate-400 hover:text-white"}
      `}
        >
            <Icon size={16} />

            {item.label}

            {/* animated active bar */}
            {active && (
                <div className="absolute -bottom-[13px] left-0 right-0 h-[2px] bg-sky-500 rounded-full" />
            )}
        </Link>
    )
}