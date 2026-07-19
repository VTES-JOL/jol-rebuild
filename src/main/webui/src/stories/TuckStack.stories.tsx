import type {CSSProperties} from 'react';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {expect, fireEvent, fn, userEvent, within} from 'storybook/test';
import type {CardData} from '../features/game/types.ts';
import {TuckStack} from '../features/game/TuckStack.tsx';

const meta = {
    title: 'Game/TuckStack',
    component: TuckStack,
    parameters: {layout: 'centered'},
    tags: ['autodocs'],
    args: {
        onCardClick: fn(),
        onCardContextMenu: fn(),
    },
    decorators: [
        (Story) => (
            <div style={{'--card-w': '120px'} as CSSProperties} className="w-[120px] m-8">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof TuckStack>;

export default meta;
type Story = StoryObj<typeof meta>;

const theoBell: CardData = {id: 'v1', cardId: '200183', crypt: true, type: 'Vampire', name: 'Theo Bell', capacity: 7, counters: 5};
const magnum: CardData = {id: 'e1', cardId: '100038', name: '.44 Magnum', type: 'Equipment'};
const sniperRifle: CardData = {id: 'e2', cardId: '100518', name: 'Sniper Rifle', type: 'Equipment'};
const ravenSpy: CardData = {id: 'r1', cardId: '100845', name: 'Raven Spy', type: 'Retainer', counters: 1};
const hiddenCard: CardData = {id: 'h1', faceDown: true};

export const ParentOnly: Story = {
    args: {cards: [theoBell]},
};

export const OneAttachment: Story = {
    args: {cards: [theoBell, magnum]},
    play: async ({canvasElement}) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('button', {name: /Attached: \.44 Magnum/})).toBeInTheDocument();
    },
};

export const ThreeAttachments: Story = {
    args: {cards: [theoBell, magnum, sniperRifle, ravenSpy]},
    play: async ({args, canvasElement}) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('button', {name: /Attached: \.44 Magnum/})).toBeInTheDocument();
        await expect(canvas.getByRole('button', {name: /Attached: Sniper Rifle/})).toBeInTheDocument();
        // Raven Spy carries a life counter — both in the strip badge and the description.
        await expect(canvas.getByRole('button', {name: /Attached: Raven Spy, 1 counter/})).toBeInTheDocument();

        await userEvent.click(canvas.getByRole('button', {name: /Sniper Rifle/}));
        await expect(args.onCardClick).toHaveBeenCalledWith(2);
    },
};

export const ParentContextMenu: Story = {
    args: {cards: [theoBell, magnum]},
    play: async ({args, canvasElement}) => {
        const canvas = within(canvasElement);
        // Left-click on a face-up card opens the zoom preview (useCardPreview);
        // selection commands go through the context menu, as on the boards.
        fireEvent.contextMenu(canvas.getByRole('img', {name: /Theo Bell/}));
        await expect(args.onCardContextMenu).toHaveBeenCalledWith(0, expect.any(Number), expect.any(Number));
    },
};

export const HiddenAttachment: Story = {
    args: {cards: [theoBell, hiddenCard]},
    play: async ({canvasElement}) => {
        const canvas = within(canvasElement);
        // A face-down attachment reveals no identity, only its presence.
        await expect(canvas.getByRole('button', {name: /Attached: Face-down library card/})).toBeInTheDocument();
    },
};

export const LockedParentWithAttachments: Story = {
    args: {cards: [{...theoBell, locked: true}, magnum, sniperRifle]},
    play: async ({canvasElement}) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('img', {name: /Theo Bell, locked/})).toBeInTheDocument();
    },
};

export const ContestedParent: Story = {
    args: {cards: [{...theoBell, contested: true}, magnum]},
    play: async ({canvasElement}) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('img', {name: /Theo Bell, contested/})).toBeInTheDocument();
    },
};

export const KeyboardReachable: Story = {
    args: {cards: [theoBell, magnum, sniperRifle]},
    play: async ({args, canvasElement}) => {
        await userEvent.tab();
        const focused = canvasElement.ownerDocument.activeElement;
        await expect(focused).toHaveAccessibleName(/Attached:/);
        await userEvent.keyboard('{Enter}');
        await expect(args.onCardClick).toHaveBeenCalled();
    },
};
