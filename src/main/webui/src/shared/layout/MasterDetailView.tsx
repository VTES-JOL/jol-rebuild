import {useState, type ReactNode} from 'react';
import {ChevronDown} from 'lucide-react';

interface PanelConfig {
    key:     string;
    label:   string;
    content: ReactNode;
}

interface MasterDetailViewProps {
    panels:   [PanelConfig, PanelConfig, ...PanelConfig[]]; // At least two panels
    columns?: string; // e.g. "300px 1fr" or "280px 1fr 280px"
    breakpoint?: 'md' | 'lg' | 'xl';
}

/**
 * A flexible master-detail layout component.
 * On desktop: Shows all panels in a grid.
 * On mobile: Shows a dropdown selector to switch between panels.
 */
export default function MasterDetailView({
    panels,
    columns = '1fr 3fr',
    breakpoint = 'md'
}: MasterDetailViewProps) {
    const [selectedKey, setSelectedKey] = useState(panels[0].key);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    const selectedPanel = panels.find(p => p.key === selectedKey) || panels[0];

    const handleSelect = (key: string) => {
        setSelectedKey(key);
        setMobileNavOpen(false);
    };

    const breakpointClass = {
        md: 'md',
        lg: 'lg',
        xl: 'xl'
    }[breakpoint];

    const gridColsClass = {
        md: 'md:grid',
        lg: 'lg:grid',
        xl: 'xl:grid'
    }[breakpoint];

    return (
        <div className="flex flex-col flex-1 min-h-0">
            {/* Mobile Dropdown Selector */}
            <div className={`${breakpointClass}:hidden mb-4 shrink-0 relative z-20`}>
                <button
                    onClick={() => setMobileNavOpen(!mobileNavOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-panel border border-line rounded-lg text-sm font-semibold text-ink shadow-sm"
                >
                    <span className="truncate">
                        {selectedPanel.label}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${mobileNavOpen ? 'rotate-180' : ''}`} />
                </button>

                {mobileNavOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-panel border border-line rounded-lg shadow-xl overflow-hidden z-30">
                        {panels.map(p => (
                            <button
                                key={p.key}
                                onClick={() => handleSelect(p.key)}
                                className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-hover ${
                                    p.key === selectedKey ? 'text-accent-soft font-bold' : 'text-ink'
                                }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div
                className={`flex-1 min-h-0 ${gridColsClass} gap-6`}
                style={{gridTemplateColumns: columns}}
            >
                {panels.map(p => (
                    <div
                        key={p.key}
                        className={
                            p.key === selectedKey
                                ? 'flex flex-col h-full min-h-0'
                                : `hidden ${breakpointClass}:flex ${breakpointClass}:flex-col ${breakpointClass}:h-full ${breakpointClass}:min-h-0`
                        }
                    >
                        {p.content}
                    </div>
                ))}
            </div>
        </div>
    );
}
