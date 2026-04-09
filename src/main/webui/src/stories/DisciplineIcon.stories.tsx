import type { Meta, StoryObj } from '@storybook/react-vite';
import { DisciplineIcon } from '../shared/components/DisciplineIcon.tsx';

const meta = {
  title: 'Shared/DisciplineIcon',
  component: DisciplineIcon,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    discipline: { control: 'text' },
    size: { control: 'number' },
  },
} satisfies Meta<typeof DisciplineIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Inferior: Story = {
  args: {
    discipline: 'pot',
    size: 32,
  },
};

export const Superior: Story = {
  args: {
    discipline: 'POT',
    size: 32,
  },
};

const allDisciplines = [
  'abo', 'ABO', 'ani', 'ANI', 'aus', 'AUS', 'cel', 'CEL', 'chi', 'CHI',
  'dai', 'DAI', 'def', 'dem', 'DEM', 'dom', 'DOM', 'flight', 'FLIGHT', 'for', 'FOR',
  'inn', 'jud', 'mal', 'MAL', 'mar', 'mel', 'MEL', 'myt', 'MYT',
  'nec', 'NEC', 'obe', 'OBE', 'obf', 'OBF', 'obl', 'OBL', 'obt', 'OBT',
  'pot', 'POT', 'pre', 'PRE', 'pro', 'PRO', 'qui', 'QUI', 'red', 'san', 'SAN',
  'ser', 'SER', 'spi', 'SPI', 'str', 'STR', 'tem', 'TEM', 'tha', 'THA',
  'thn', 'THN', 'val', 'VAL', 'ven', 'vic', 'VIC', 'vin', 'vis', 'VIS'
];

export const AllDisciplines: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '10px' }}>
      {allDisciplines.map((d) => (
        <div key={d} style={{ textAlign: 'center' }}>
          <DisciplineIcon {...args} discipline={d} />
          <div style={{ fontSize: '10px' }}>{d}</div>
        </div>
      ))}
    </div>
  ),
  args: {
    size: 32,
    discipline: ''
  },
};
