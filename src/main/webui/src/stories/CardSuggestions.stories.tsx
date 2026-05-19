import type {Meta, StoryObj} from '@storybook/react-vite';
import {expect, fn, userEvent, within} from 'storybook/test';

import {CardSuggestions} from '../features/chat/CardSuggestions.tsx';

const meta = {
    title: 'Chat/CardSuggestions',
    component: CardSuggestions,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <div className="relative w-80 mt-50 flex items-end p-4 border border-dashed border-line/40 rounded-lg">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof CardSuggestions>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        suggestions: [
            {name: 'Abbot', id: '100006', crypt: false, group: null, advanced: false},
            {name: 'Art Scam', id: '100099', crypt: false, group: null, advanced: false},
            {name: 'Arcanum Chapterhouse, Alexandria', id: '100082', crypt: false, group: null, advanced: false},
        ],
        activeIndex: 0,
        onSelect: fn(),
    },
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        const options = canvas.getAllByRole('option');
        await expect(options).toHaveLength(3);
        await expect(options[0]).toHaveAttribute('aria-selected', 'true');
        await expect(options[1]).toHaveAttribute('aria-selected', 'false');
        await userEvent.click(canvas.getByText('Art Scam'));
        await expect(args.onSelect).toHaveBeenCalledWith(
            expect.objectContaining({ name: 'Art Scam', id: '100099' })
        );
    },
};

export const ActiveMiddle: Story = {
    args: {
        suggestions: [
            {name: 'Abbot', id: '100006', crypt: false, group: null, advanced: false},
            {name: 'Art Scam', id: '100099', crypt: false, group: null, advanced: false},
            {name: 'Arcanum Chapterhouse, Alexandria', id: '100082', crypt: false, group: null, advanced: false},
        ],
        activeIndex: 1,
        onSelect: fn(),
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const options = canvas.getAllByRole('option');
        await expect(options[0]).toHaveAttribute('aria-selected', 'false');
        await expect(options[1]).toHaveAttribute('aria-selected', 'true');
        await expect(options[2]).toHaveAttribute('aria-selected', 'false');
    },
};

export const EmptyState = {
    render: () => <div className="text-sm text-slate-400">No suggestions available.</div>,
};