import type {CSSProperties} from 'react';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {expect, within} from 'storybook/test';
import {FieldCard} from '../features/game/FieldCard.tsx';

const meta = {
    title: 'Game/FieldCard',
    component: FieldCard,
    parameters: {layout: 'centered'},
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <div style={{'--card-w': '120px'} as CSSProperties} className="w-[120px]">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof FieldCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {id: 'l1', cardId: '100845', crypt: false, faceDown: false, locked: false},
};

export const CryptCard: Story = {
    args: {id: 'v1', cardId: '200183', crypt: true, faceDown: false, locked: false, type: 'Vampire'},
};

export const FaceDownCrypt: Story = {
    args: {id: 'v2', cardId: '200584', crypt: true, faceDown: true, locked: false, type: 'Vampire'},
};

export const FaceDownLibrary: Story = {
    args: {id: 'l2', cardId: '100401', crypt: false, faceDown: true, locked: false},
};

export const Locked: Story = {
    args: {id: 'l3', cardId: '100518', crypt: false, faceDown: false, locked: true},
};

export const LockedCrypt: Story = {
    args: {id: 'v3', cardId: '200905', crypt: true, faceDown: false, locked: true, type: 'Vampire'},
};

export const VampireWithCapacity: Story = {
    args: {id: 'v4', cardId: '200183', crypt: true, faceDown: false, locked: false, capacity: 10, type: 'Vampire'},
};

export const VampireWithBlood: Story = {
    args: {id: 'v5', cardId: '200584', crypt: true, faceDown: false, locked: false, capacity: 10, counters: 7, type: 'Vampire'},
};

export const VampireFullBeads: Story = {
    args: {id: 'v6', cardId: '200905', crypt: true, faceDown: false, locked: false, capacity: 20, counters: 20, type: 'Vampire'},
};

export const VampireCountBadge: Story = {
    args: {id: 'v7', cardId: '201362', crypt: true, faceDown: false, locked: false, capacity: 20, counters: 21, type: 'Vampire'},
};

export const LibraryWithCounters: Story = {
    args: {id: 'l4', cardId: '100845', crypt: false, faceDown: false, locked: false, counters: 3},
};

export const FaceDownWithBlood: Story = {
    args: {id: 'v8', cardId: '200183', crypt: true, faceDown: true, locked: false, capacity: 10, counters: 5, type: 'Vampire'},
    play: async ({canvasElement}) => {
        const canvas = within(canvasElement);
        // Hidden identity, visible state: no name, but blood is announced.
        await expect(canvas.getByRole('img', {name: 'Face-down crypt card, 5 blood'})).toBeInTheDocument();
    },
};

export const Contested: Story = {
    args: {id: 'v9', cardId: '200905', crypt: true, faceDown: false, locked: false, contested: true, name: 'Lucinde, Alastor', capacity: 9, counters: 9, type: 'Vampire'},
    play: async ({canvasElement}) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('Contested')).toBeInTheDocument();
        await expect(canvas.getByRole('img', {name: 'Lucinde, Alastor, contested, 9 blood, capacity 9'})).toBeInTheDocument();
    },
};

export const ContestedAndLocked: Story = {
    args: {id: 'v10', cardId: '200905', crypt: true, faceDown: false, locked: true, contested: true, name: 'Lucinde, Alastor', capacity: 9, type: 'Vampire'},
    play: async ({canvasElement}) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('img', {name: 'Lucinde, Alastor, locked, contested, capacity 9'})).toBeInTheDocument();
    },
};

export const NamedWithBlood: Story = {
    args: {id: 'v11', cardId: '200584', crypt: true, faceDown: false, locked: false, name: 'Theo Bell', capacity: 7, counters: 5, type: 'Vampire'},
    play: async ({canvasElement}) => {
        const canvas = within(canvasElement);
        // Beads carry a numeral twin — the count is readable as text, not just countable.
        await expect(canvas.getByText('5')).toBeInTheDocument();
        await expect(canvas.getByRole('img', {name: 'Theo Bell, 5 blood, capacity 7'})).toBeInTheDocument();
    },
};
