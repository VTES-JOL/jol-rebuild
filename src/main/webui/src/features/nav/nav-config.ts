import {FileText, Folder, type LucideIcon, Shield, Users} from "lucide-react"

export interface NavItem {
    label: string
    to: string
    icon: LucideIcon
    roles?: string[]
}

export const NAV_ITEMS: NavItem[] = [
    {label: "Decks", to: "/decks", icon: Folder},
    {label: "Lobby", to: "/lobby", icon: Users},

    {label: "Admin", to: "/admin", roles: ["admin"], icon: Shield},
    {label: "Logs", to: "/logs", roles: ["admin"], icon: FileText},
]