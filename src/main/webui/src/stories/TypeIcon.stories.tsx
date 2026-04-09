import type { Meta, StoryObj } from '@storybook/react-vite';
import { TypeIcon } from '../shared/components/TypeIcon.tsx';

const meta = {
  title: 'Shared/TypeIcon',
  component: TypeIcon,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    type: { control: 'text' },
    size: { control: 'number' },
  },
} satisfies Meta<typeof TypeIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    type: 'Action',
    size: 32,
  },
};

export const WithSpaces: Story = {
  args: {
    type: 'Action Modifier',
    size: 32,
  },
};

const allTypes = [
  'Action', 'Action Modifier', 'Ally', 'Combat', 'Conviction', 
  'Equipment', 'Event', 'Master', 'Political Action', 'Power', 
  'Reaction', 'Retainer'
];

export const AllTypes: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
      {allTypes.map((t) => (
        <div key={t} style={{ textAlign: 'center', border: '1px solid #ccc', padding: '10px' }}>
          <TypeIcon {...args} type={t} />
          <div style={{ fontSize: '10px', marginTop: '5px' }}>{t}</div>
        </div>
      ))}
    </div>
  ),
  args: {
    size: 32,
    type: ''
  },
};
