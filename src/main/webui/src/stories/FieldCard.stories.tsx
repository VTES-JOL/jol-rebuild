import type {CSSProperties} from 'react';
import type {Meta, StoryObj} from '@storybook/react-vite';
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
};
