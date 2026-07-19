import type {Meta, StoryObj} from '@storybook/react-vite';
import {expect, userEvent, waitFor, within} from 'storybook/test';
import type {CSSProperties} from 'react';
import {useRef, useState} from 'react';
import {TuckStack} from '../features/game/TuckStack.tsx';
import type {CardData} from '../features/game/types.ts';
import {useCardTravel} from '../features/game/useCardTravel.ts';

const vampire: CardData = {id: 'v1', cardId: '200183', name: 'Theo Bell', type: 'Vampire', crypt: true, counters: 5, capacity: 7};

/**
 * Demo harness for the card-travel FLIP layer: one card, two zones, a button
 * that moves it — the same mechanism GamePage applies across whole boards.
 */
function TravelDemo() {
    const rootRef = useRef<HTMLDivElement>(null);
    useCardTravel(rootRef);
    const [zone, setZone] = useState<'ready' | 'torpor'>('ready');

    return (
        <div ref={rootRef} style={{'--card-w': '96px'} as CSSProperties} className="flex flex-col gap-4 w-[560px]">
            <button
                type="button"
                className="self-start text-xs px-2 py-1 rounded border border-line/50 text-ink-muted hover:text-ink"
                onClick={() => setZone(z => (z === 'ready' ? 'torpor' : 'ready'))}
            >
                Move to {zone === 'ready' ? 'torpor' : 'ready'}
            </button>
            <div className="flex gap-8">
                {(['ready', 'torpor'] as const).map(z => (
                    <div key={z} className="flex-1 rounded-lg border border-dashed border-line/40 p-3 min-h-44">
                        <div className="text-[10px] uppercase tracking-wide text-ink-muted mb-2">{z}</div>
                        {zone === z && <div className="w-24"><TuckStack cards={[vampire]} /></div>}
                    </div>
                ))}
            </div>
        </div>
    );
}

const meta = {
    title: 'Game/CardTravel',
    component: TravelDemo,
    parameters: {layout: 'padded'},
} satisfies Meta<typeof TravelDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MoveBetweenZones: Story = {
    play: async ({canvasElement}) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('img', {name: /Theo Bell/})).toBeInTheDocument();

        await userEvent.click(canvas.getByRole('button', {name: 'Move to torpor'}));

        // The card lands in torpor instantly (state is never delayed by the
        // animation) and a card-travel flight is painting the transition.
        const doc = canvasElement.ownerDocument;
        await waitFor(() =>
            expect(doc.getAnimations().some(a => a.id === 'card-travel')).toBe(true),
        );
        await expect(canvas.getByRole('img', {name: /Theo Bell/})).toBeInTheDocument();
    },
};
