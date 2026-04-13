import {FileText, Folder, type LucideIcon, Shield, Trophy, Users} from "lucide-react"

export interface NavItem {
    label: string
    to: string
    icon: LucideIcon
    roles?: string[]
}

export const NAV_ITEMS: NavItem[] = [
    {label: "Decks", to: "/decks", icon: Folder},
    {label: "Lobby", to: "/lobby", icon: Users},
    {label: "Tournaments", to: "/tournaments", icon: Trophy},

    {label: "Admin", to: "/admin", roles: ["admin"], icon: Shield},
    {label: "Logs", to: "/logs", roles: ["admin"], icon: FileText},
]

export function getVisibleNavItems(userRoles?: string[]): NavItem[] {
    return NAV_ITEMS.filter(item =>
        !item.roles || item.roles.some(r => userRoles?.includes(r))
    )
}