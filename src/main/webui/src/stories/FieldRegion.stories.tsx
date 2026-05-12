import type {Meta, StoryObj} from '@storybook/react-vite';
import {fn} from 'storybook/test';
import {useState} from 'react';
import {FieldRegion} from '../features/game/FieldRegion.tsx';
import type {CardData} from '../features/game/CardStack.tsx';

const meta = {
    title: 'Game/FieldRegion',
    component: FieldRegion,
    parameters: {layout: 'padded'},
    tags: ['autodocs'],
    args: {
        onCardClick: fn(),
        onReorder: fn(),
        onCardMove: fn(),
    },
} satisfies Meta<typeof FieldRegion>;

export default meta;
type Story = StoryObj<typeof meta>;

const crypt1: CardData = {id: '200422', crypt: true};
const crypt2: CardData = {id: '200053', crypt: true};
const lib1: CardData = {id: '102113', crypt: false};
const lib2: CardData = {id: '100037', crypt: false};
const lib3: CardData = {id: '100001', crypt: false};
const lib4: CardData = {id: '102165', crypt: false};
const lib5: CardData = {id: '100588', crypt: false};

const stack1 = [crypt1, lib1];
const stack2 = [crypt2, lib1, lib3];
const stack3 = [{...lib2, faceDown: true}];
const stack4 = [{...crypt1, locked: true}, lib3];
const stack5 = [lib4];
const stack6 = [lib5];

export const Empty: Story = {
    args: {name: 'Ash Heap', stacks: [], columns: 1},
};

export const SingleStack: Story = {
    args: {name: 'Torpor', stacks: [stack1, stack2, stack3], columns: 3},
};

export const Grid3Columns: Story = {
    args: {
        name: 'Uncontrolled Region',
        stacks: [stack1, stack2, stack3, stack4, stack5],
        columns: 3,
    },
};

export const Grid5Columns: Story = {
    args: {
        name: 'Ready Region',
        stacks: [stack1, stack2, stack3, stack4, stack5],
        columns: 5,
    },
};

export const CompactGrid: Story = {
    args: {
        name: 'Library',
        stacks: [stack1, stack2, stack3, stack4],
        columns: 4,
        compact: true,
    },
};

export const WithDragDrop: Story = {
    render: (args) => {
        const [stacks, setStacks] = useState([stack1, stack2, stack6, stack5]);

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

        function handleCardClick(stackIndex: number, cardIndex: number) {
            setStacks(prev => prev.map((stack, si) =>
                si !== stackIndex ? stack : stack.map((card, ci) =>
                    ci !== cardIndex ? card : {...card, locked: !card.locked}
                )
            ));
        }

        return (
            <FieldRegion {...args} stacks={stacks} onReorder={handleReorder} onCardMove={handleCardMove} onCardClick={handleCardClick}/>
        );
    },
    args: {name: 'Ready', stacks: [], columns: 5},
};

export const ColumnPicker: Story = {
    render: (args) => {
        const [cols, setCols] = useState(3);
        return (
            <div>
                <div className="mb-2 flex gap-1">
                    {[1, 2, 3, 4, 5].map(n => (
                        <button
                            key={n}
                            className={`rounded px-2 py-0.5 text-xs ${cols === n ? 'bg-arcane text-white' : 'bg-panel border border-line text-ink-muted'}`}
                            onClick={() => setCols(n)}
                        >{n}</button>
                    ))}
                </div>
                <FieldRegion {...args} columns={cols} />
            </div>
        );
    },
    args: {
        name: 'Region',
        stacks: [stack1, stack2, stack3, stack4, stack5, stack6],
        columns: 3,
    },
};

export const DragDropWithColumns: Story = {
    render: (args) => {
        const [stacks, setStacks] = useState([stack1, stack2, stack6, stack5, stack3, stack4]);

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
            <FieldRegion
                {...args}
                stacks={stacks}
                onReorder={handleReorder}
                onCardMove={handleCardMove}
            />
        );
    },
    args: {name: 'Ready', stacks: [], columns: 3},
};
