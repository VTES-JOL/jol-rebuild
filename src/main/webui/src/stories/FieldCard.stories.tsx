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
    args: {id: '100001', crypt: false, faceDown: false},
};

export const CryptCard: Story = {
    args: {id: '200349', crypt: true, faceDown: false},
};

export const Sized: Story = {
    args: {id: '100266', crypt: false, faceDown: false},
    decorators: [
        (Story) => (
            <div className="w-48">
                <Story/>
            </div>
        ),
    ],
};

export const FaceDownCrypt: Story = {
    args: {id: '200349', crypt: true, faceDown: true},
};

export const FaceDownLibrary: Story = {
    args: {id: '100266', crypt: false, faceDown: true},
};
