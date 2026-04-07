import { useLocation } from "react-router-dom"

export function useActiveRoute() {
    const { pathname } = useLocation()

    const isActive = (path: string) => {
        if (path === "/") return pathname === "/"
        return pathname.startsWith(path)
    }

    return { isActive }
}