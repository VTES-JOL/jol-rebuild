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
    return {
        background: `light-dark(hsla(${hue},65%,55%,0.18), hsla(${hue},60%,35%,0.40))`,
        color:      `light-dark(hsl(${hue},68%,38%),        hsl(${hue},80%,72%))`,
        boxShadow:  `0 0 0 1.5px light-dark(hsla(${hue},65%,45%,0.35), hsla(${hue},75%,65%,0.55)), 0 0 7px light-dark(transparent, hsla(${hue},80%,60%,0.22))`,
    };
}

export function nameColorStyle(name: string): React.CSSProperties {
    const hue = hueFromName(name);
    return { color: `light-dark(hsl(${hue},68%,38%), hsl(${hue},80%,72%))` };
}
