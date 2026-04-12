import {useMemo, useState} from 'react';
import type {ReactNode} from 'react';
import {TabStrip} from '@/shared/components/Tabs';

interface PanelConfig {
    key:     string;
    label:   string;
    content: ReactNode;
}

interface SplitViewProps {
    panels:   [PanelConfig, PanelConfig];
    columns?: string;   // CSS grid-template-columns for desktop, default '1fr 3fr'
}

export default function SplitView({panels, columns = '1fr 3fr'}: SplitViewProps) {
    const [activeKey, setActiveKey] = useState(panels[0].key);

    // Stable tab descriptors — only change if panel keys/labels change
    const tabs = useMemo(
        () => panels.map(p => ({key: p.key, label: p.label})),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [panels[0].key, panels[0].label, panels[1].key, panels[1].label]
    );

    return (
        <div className="flex-1 flex flex-col min-h-0">
            {/* Mobile: tab strip */}
            <div className="md:hidden shrink-0 pb-2">
                <TabStrip tabs={tabs} active={activeKey} onChange={setActiveKey} size="sm" />
            </div>

            {/*
              Single grid — each panel exists in the DOM exactly once.
              Mobile: inactive panel is `hidden`; desktop: `md:flex` overrides `hidden`.
              Both panels stay mounted throughout to preserve WebSocket/scroll state.
            */}
            <div
                className="flex-1 min-h-0 md:grid md:gap-6"
                style={{gridTemplateColumns: columns}}
            >
                {panels.map(p => (
                    <div
                        key={p.key}
                        className={
                            p.key === activeKey
                                ? 'flex flex-col h-full min-h-0'
                                : 'hidden md:flex md:flex-col md:h-full md:min-h-0'
                        }
                    >
                        {p.content}
                    </div>
                ))}
            </div>
        </div>
    );
}
