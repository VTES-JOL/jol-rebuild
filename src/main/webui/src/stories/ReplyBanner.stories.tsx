import type {Meta, StoryObj} from '@storybook/react-vite';

import {ReplyBanner, TimestampDivider} from '../features/chat/ChatPanelExtras.tsx';

const meta = {
    title: 'Chat/Extras',
    component: ReplyBanner,
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof ReplyBanner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ReplyPreview: Story = {
    args: {
        replyTo: {
            id: 100294,
            sender: 'Alex',
            content: 'I think [card:100266:Bum\'s Rush] is the right play here.',
        },
        onCancel: () => {
        },
    },
};

export const DividerPreview = {
    render: () => <TimestampDivider label="Today"/>,
};