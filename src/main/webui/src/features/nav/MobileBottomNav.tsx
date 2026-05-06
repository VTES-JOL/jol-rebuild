import {Link} from 'react-router-dom';
import {useAuthContext} from "@/contexts/AuthContext.tsx";
import {useActiveRoute} from '@/hooks/useActiveRoute.ts';
import {getVisibleNavItems} from './nav-config';

export default function MobileBottomNav() {
    const {user} = useAuthContext();
    const {isActive} = useActiveRoute();

    const visibleItems = getVisibleNavItems(user?.roles);

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden h-14 bg-panel/90 backdrop-blur-md border-t border-line/60 flex items-stretch pb-safe">
            {visibleItems.map(item => {
                const active = isActive(item.to);
                const Icon = item.icon;
                return (
                    <Link
                        key={item.to}
                        to={item.to}
                        className={[
                            'flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] transition-colors relative',
                            active ? 'text-accent' : 'text-ink-muted hover:text-ink',
                        ].join(' ')}
                    >
                        {active && (
                            <span className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-accent rounded-full" />
                        )}
                        <Icon size={18} />
                        <span>{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
