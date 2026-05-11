import type {Meta, StoryObj} from '@storybook/react-vite';
import {fn} from 'storybook/test';
import {CardStack} from '../features/game/CardStack.tsx';
import type {CardData} from '../features/game/CardStack.tsx';

const meta = {
    title: 'Game/CardStack',
    component: CardStack,
    parameters: {layout: 'centered'},
    tags: ['autodocs'],
    args: {
        onCardClick: fn(),
    },
} satisfies Meta<typeof CardStack>;

export default meta;
type Story = StoryObj<typeof meta>;

const wrap = (Story: React.ComponentType) => (
    <div className="w-48">
        <Story/>
    </div>
);

const lib2: CardData = {id: '100001', crypt: false};
const lib3: CardData = {id: '100038', crypt: false};
const crypt1: CardData = {id: '200349', crypt: true};

export const DefaultTwo: Story = {
    args: {cards: [crypt1, lib2]},
    decorators: [wrap],
};

export const DefaultThree: Story = {
    args: {cards: [crypt1, lib2, lib3]},
    decorators: [wrap],
};

export const DefaultMixed: Story = {
    args: {
        cards: [
            crypt1,
            {...lib2, faceDown: false},
            {...lib3, locked: true},
        ],
    },
    decorators: [wrap],
};
