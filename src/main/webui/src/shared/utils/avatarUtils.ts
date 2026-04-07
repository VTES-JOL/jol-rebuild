import React from 'react';

export function initials(name: string): string {
    return name.split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
}

export function hueFromName(name: string): number {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % 360;
}

export function avatarStyle(name: string): React.CSSProperties {
    const hue = hueFromName(name);
    return { background: `hsla(${hue},60%,60%,0.18)`, color: `hsl(${hue},70%,72%)` };
}

export function nameColorStyle(name: string): React.CSSProperties {
    const hue = hueFromName(name);
    return { color: `hsl(${hue},70%,72%)` };
}
