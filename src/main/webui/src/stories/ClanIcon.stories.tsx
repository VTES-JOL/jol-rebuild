import type { Meta, StoryObj } from '@storybook/react-vite';
import { ClanIcon } from '../shared/components/ClanIcon.tsx';

const meta = {
  title: 'Shared/ClanIcon',
  component: ClanIcon,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    clan: { control: 'text' },
    size: { control: 'number' },
  },
} satisfies Meta<typeof ClanIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    clan: 'Brujah',
    size: 32,
  },
};

export const WithSpaces: Story = {
  args: {
    clan: 'Follower of Set',
    size: 32,
  },
};

const allClans = [
  'Abomination', 'Ahrimane', 'Akunanse', 'Assamite', 'Avenger', 'Baali', 'Banu Haqim',
  'Blood Brother', 'Brujah', 'Brujah antitribu', 'Caitiff', 'Daughter of Cacophony',
  'Defender', 'Follower of Set', 'Gangrel', 'Gangrel antitribu', 'Gargoyle', 'Giovanni',
  'Guruhi', 'Harbinger of Skulls', 'Hecata', 'Innocent', 'Ishtarri', 'Judge', 'Kiasyd',
  'Lasombra', 'Malkavian', 'Malkavian antitribu', 'Martyr', 'Ministry', 'Nagaraja',
  'Nosferatu', 'Nosferatu antitribu', 'Osebo', 'Pander', 'Ravnos', 'Redeemer', 'Salubri',
  'Salubri antitribu', 'Samedi', 'Toreador', 'Toreador antitribu', 'Tremere',
  'Tremere antitribu', 'True Brujah', 'Tzimisce', 'Ventrue', 'Ventrue antitribu', 'Visionary'
];

export const AllClans: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px' }}>
      {allClans.map((c) => (
        <div key={c} style={{ textAlign: 'center', border: '1px solid #ccc', padding: '10px' }}>
          <ClanIcon {...args} clan={c} />
          <div style={{ fontSize: '10px', marginTop: '5px' }}>{c}</div>
        </div>
      ))}
    </div>
  ),
  args: {
    size: 32,
    clan: ''
  },
};
