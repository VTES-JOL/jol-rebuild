import type {Meta, StoryObj} from '@storybook/react-vite';
import {FieldCard} from '../features/game/FieldCard.tsx';

const meta = {
    title: 'Game/FieldCard',
    component: FieldCard,
    parameters: {layout: 'centered'},
    tags: ['autodocs'],
} satisfies Meta<typeof FieldCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {id: '100001'},
};

export const CryptCard: Story = {
    args: {id: '200349'},
};

export const Sized: Story = {
    args: {id: '100266'},
    decorators: [
        (Story) => (
            <div className="w-48">
                <Story/>
            </div>
        ),
    ],
};
