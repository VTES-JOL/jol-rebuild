import type {Meta, StoryObj} from '@storybook/react-vite';
import {fn} from 'storybook/test';
import {useState} from 'react';
import {FieldRegion} from '../features/game/FieldRegion.tsx';
import type {CardData} from '../features/game/CardStack.tsx';

const meta = {
    title: 'Game/FieldRegion',
    component: FieldRegion,
    parameters: {layout: 'centered'},
    tags: ['autodocs'],
    args: {
        onCardClick: fn(),
        onReorder: fn(),
        onCardMove: fn(),
    },
} satisfies Meta<typeof FieldRegion>;

export default meta;
type Story = StoryObj<typeof meta>;

const wrap = (Story: React.ComponentType) => (
    <div className="w-96">
        <Story/>
    </div>
);

const crypt1: CardData = {id: '200349', crypt: true};
const lib1: CardData = {id: '100266', crypt: false};
const lib2: CardData = {id: '100001', crypt: false};
const lib3: CardData = {id: '100001', crypt: false};

const stack1 = [crypt1, lib1];
const stack2 = [lib2, lib3, lib1];
const stack3 = [{...lib2, faceDown: true}];
const stack4 = [{...crypt1, locked: true}, lib3];
const stack5 = [lib1, lib2];

export const Empty: Story = {
    args: {name: 'Influence Pool', stacks: [], columns: 3},
    decorators: [wrap],
};

export const SingleStack: Story = {
    args: {name: 'Torpor', stacks: [stack1, stack2, stack3], columns: 3},
    decorators: [wrap],
};

export const Grid3Columns: Story = {
    args: {
        name: 'Uncontrolled Region',
        stacks: [stack1, stack2, stack3, stack4, stack5],
        columns: 3,
    },
    decorators: [wrap],
};

export const CompactGrid: Story = {
    args: {
        name: 'Library',
        stacks: [stack1, stack2, stack3, stack4],
        columns: 4,
        compact: true,
    },
    decorators: [wrap],
};

export const WithDragDrop: Story = {
    render: (args) => {
        const [stacks, setStacks] = useState([stack1, stack2, stack3, stack4, stack5]);

        function handleReorder(from: number, to: number) {
            setStacks(prev => {
                const next = [...prev];
                const [moved] = next.splice(from, 1);
                next.splice(to, 0, moved);
                return next;
            });
        }

        function handleCardMove(fromStack: number, fromCard: number, toStack: number) {
            setStacks(prev => {
                const next = prev.map(s => [...s]);
                const [card] = next[fromStack].splice(fromCard, 1);
                next[toStack].push(card);
                return next.filter(s => s.length > 0);
            });
        }

        return (
            <FieldRegion {...args} stacks={stacks} onReorder={handleReorder} onCardMove={handleCardMove}/>
        );
    },
    args: {name: 'Ready', columns: 3},
    decorators: [wrap]
};
