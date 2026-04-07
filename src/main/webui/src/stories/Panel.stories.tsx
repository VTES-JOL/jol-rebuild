import type { Meta, StoryObj } from '@storybook/react-vite';

import Panel from '../shared/components/Panel.tsx';

const meta = {
  title: 'Shared/Panel',
  component: Panel,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Panel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Panel Title',
    children: <div className="p-4">Panel content goes here.</div>,
  },
};

export const WithRightSlot: Story = {
  args: {
    title: 'Inbox',
    right: <button className="text-xs text-indigo-300">New</button>,
    children: <div className="p-4">Some panel content with an action on the right.</div>,
  },
};

export const TallContent: Story = {
  args: {
    title: 'Scrollable Area',
    children: (
        <div className="p-4 space-y-3">
          <p>Item 1</p>
          <p>Item 2</p>
          <p>Item 3</p>
          <p>Item 4</p>
        </div>
    ),
  },
};