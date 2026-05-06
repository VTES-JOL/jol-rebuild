import type {Meta, StoryObj} from '@storybook/react-vite';
import {PathIcon} from '../shared/components/PathIcon.tsx';

const meta = {
  title: 'Shared/PathIcon',
  component: PathIcon,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    path: { control: 'text' },
    size: { control: 'number' },
  },
} satisfies Meta<typeof PathIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    path: 'Caine',
    size: 32,
  },
};

export const MultiWord: Story = {
  args: {
    path: 'Power and the Inner Voice',
    size: 32,
  },
};

const allPaths = [
  'Caine',
  'Cathari',
  'Death and the Soul',
  'Power and the Inner Voice'
];

export const AllPaths: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
      {allPaths.map((p) => (
        <div key={p} style={{ textAlign: 'center', border: '1px solid #ccc', padding: '10px' }}>
          <PathIcon {...args} path={p} />
          <div style={{ fontSize: '10px', marginTop: '5px' }}>{p}</div>
        </div>
      ))}
    </div>
  ),
  args: {
    size: 32,
    path: ''
  },
};
