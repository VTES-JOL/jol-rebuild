import type {Meta, StoryObj} from '@storybook/react-vite';
import type {CounterType} from '../shared/components/CounterBadge.tsx';
import {CounterBadge} from '../shared/components/CounterBadge.tsx';

const meta = {
    title: 'Shared/CounterBadge',
    component: CounterBadge,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        type:   { control: 'select', options: ['blood', 'life', 'corruption', 'generic'] },
        amount: { control: 'number', min: 0, max: 30 },
        size:   { control: 'number', min: 12, max: 48 },
    },
} satisfies Meta<typeof CounterBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Blood: Story = {
    args: { type: 'blood', amount: 5, size: 20 },
};

export const Life: Story = {
    args: { type: 'life', amount: 6, size: 20 },
};

export const Corruption: Story = {
    args: { type: 'corruption', amount: 3, size: 20 },
};

export const Generic: Story = {
    args: { type: 'generic', amount: 2, size: 20 },
};

// — All types side-by-side ────────────────────────────────────────────────────

export const AllTypes: Story = {
    render: () => (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {(['blood', 'life', 'corruption', 'generic'] as CounterType[]).map(type => (
                <div key={type} style={{ textAlign: 'center' }}>
                    <CounterBadge type={type} amount={5} size={24} />
                    <div style={{ fontSize: 10, marginTop: 4 }}>{type}</div>
                </div>
            ))}
        </div>
    ),
    args: { type: 'blood', amount: 5 },
};

// — Full numeric range (1–30) ─────────────────────────────────────────────────

const AMOUNTS = Array.from({ length: 30 }, (_, i) => i + 1);

export const BloodRange: Story = {
    render: () => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxWidth: 400 }}>
            {AMOUNTS.map(n => <CounterBadge key={n} type="blood" amount={n} size={20} />)}
        </div>
    ),
    args: { type: 'blood', amount: 1 },
};

export const LifeRange: Story = {
    render: () => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxWidth: 400 }}>
            {AMOUNTS.map(n => <CounterBadge key={n} type="life" amount={n} size={20} />)}
        </div>
    ),
    args: { type: 'life', amount: 1 },
};

// — Sizes ─────────────────────────────────────────────────────────────────────

export const Sizes: Story = {
    render: () => (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {[14, 16, 18, 20, 24, 28, 32].map(size => (
                <div key={size} style={{ textAlign: 'center' }}>
                    <CounterBadge type="blood" amount={12} size={size} />
                    <div style={{ fontSize: 10, marginTop: 4 }}>{size}px</div>
                </div>
            ))}
        </div>
    ),
    args: { type: 'blood', amount: 12 },
};

// — Inline with text ──────────────────────────────────────────────────────────

export const InlineWithText: Story = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontFamily: 'sans-serif' }}>
            <p style={{ fontSize: 14 }}>
                Beckett <CounterBadge type="blood" amount={7} size={18} />
            </p>
            <p style={{ fontSize: 14 }}>
                Mylan Horseed (Goblin) <CounterBadge type="life" amount={4} size={18} />
            </p>
            <p style={{ fontSize: 14 }}>
                Corruption counters: <CounterBadge type="corruption" amount={2} size={18} />
            </p>
            <p style={{ fontSize: 12 }}>
                Smaller text — blood <CounterBadge type="blood" amount={5} size={15} /> life <CounterBadge type="life" amount={3} size={15} />
            </p>
        </div>
    ),
    args: { type: 'blood', amount: 5 },
};
