import {Files, FileText, type LucideIcon, Shield} from "lucide-react"

export interface NavItem {
    label: string
    to: string
    icon: LucideIcon
    roles?: string[]
}

export const NAV_ITEMS: NavItem[] = [
    {label: "Decks", to: "/decks", icon: Files},

    {label: "Admin", to: "/admin", roles: ["admin"], icon: Shield},
    {label: "Logs", to: "/logs", roles: ["admin"], icon: FileText},
]