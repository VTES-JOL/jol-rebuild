import type {Meta, StoryObj} from '@storybook/react-vite';
import {fn} from 'storybook/test';
import {ImpulsePanel} from '../features/game/ImpulsePanel.tsx';
import type {ImpulseState} from '../features/game/types.ts';

const meta = {
    title: 'Game/ImpulsePanel',
    component: ImpulsePanel,
    parameters: {layout: 'padded'},
    tags: ['autodocs'],
    args: {
        gameId: 'test-game',
        currentUser: 'Alice',
        onCommand: fn(),
    },
} satisfies Meta<typeof ImpulsePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

const base: ImpulseState = {
    active: true,
    context: 'UNDIRECTED',
    actingPlayer: 'Alice',
    currentImpulseHolder: 'Alice',
    passOrder: ['Alice', 'Bob', 'Dave', 'Carol'],
    consecutivePasses: 0,
};

export const ActingPlayerHoldsImpulse: Story = {
    args: {
        impulse: base,
        currentUser: 'Alice',
    },
};

export const OtherPlayerHoldsImpulse: Story = {
    args: {
        impulse: {...base, currentImpulseHolder: 'Bob', consecutivePasses: 1},
        currentUser: 'Carol',
    },
};

export const NearlyClosing: Story = {
    args: {
        impulse: {...base, currentImpulseHolder: 'Carol', consecutivePasses: 3},
        currentUser: 'Carol',
    },
};

export const AfterClaim: Story = {
    name: 'After Claim — Impulse Reset to Acting',
    args: {
        impulse: {
            ...base,
            actingPlayer: 'Alice',
            currentImpulseHolder: 'Alice',
            consecutivePasses: 0,
            context: 'DIRECTED_SINGLE',
        },
        currentUser: 'Alice',
    },
};

export const CombatContext: Story = {
    args: {
        impulse: {
            ...base,
            context: 'COMBAT',
            actingPlayer: 'Alice',
            currentImpulseHolder: 'Dave',
            passOrder: ['Alice', 'Dave', 'Bob', 'Carol'],
            consecutivePasses: 1,
        },
        currentUser: 'Dave',
    },
};
