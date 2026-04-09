import type { Meta, StoryObj } from '@storybook/react-vite';
import { CostIcon } from '../shared/components/CostIcon.tsx';

const meta = {
  title: 'Shared/CostIcon',
  component: CostIcon,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    type: { control: 'select', options: ['blood', 'pool'] },
    amount: { control: 'text' },
    size: { control: 'number' },
  },
} satisfies Meta<typeof CostIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Blood: Story = {
  args: {
    type: 'blood',
    amount: '4',
    size: 32,
  },
};

export const Pool: Story = {
  args: {
    type: 'pool',
    amount: '3',
    size: 32,
  },
};

export const BloodX: Story = {
  args: {
    type: 'blood',
    amount: 'X',
    size: 32,
  },
};

export const PoolX: Story = {
  args: {
    type: 'pool',
    amount: 'X',
    size: 32,
  },
};

export const BloodFallback: Story = {
  args: {
    type: 'blood',
    amount: '99', // Missing amount, should fallback to bloodcost.svg
    size: 32,
  },
};

export const AllCosts: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h4>Blood Costs</h4>
        <div style={{ display: 'flex', gap: '10px' }}>
          {['', '1', '2', '3', '4', 'X', '99'].map((a) => (
            <div key={`blood-${a}`} style={{ textAlign: 'center' }}>
              <CostIcon {...args} type="blood" amount={a} size={32} />
              <div style={{ fontSize: '10px' }}>{a || 'none'}</div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h4>Pool Costs</h4>
        <div style={{ display: 'flex', gap: '10px' }}>
          {['', '1', '2', '3', '4', '5', '6', 'X', '99'].map((a) => (
            <div key={`pool-${a}`} style={{ textAlign: 'center' }}>
              <CostIcon {...args} type="pool" amount={a} size={32} />
              <div style={{ fontSize: '10px' }}>{a || 'none'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
  args: {
    type: 'blood',
    amount: '5'
  }
};
