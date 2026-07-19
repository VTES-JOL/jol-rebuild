import type {Meta, StoryObj} from '@storybook/react-vite';
import {expect, fn, userEvent, within} from 'storybook/test';
import {GameChatRail} from '../features/game/GameChatRail.tsx';
import type {ChatMsg, CommandLogMsg} from '@/hooks/useWebSocket.ts';

const GAME_ID = 'story-game';
const LAST_READ_KEY = `jol.game.${GAME_ID}.lastRead`;

let clock = 0;
function stamp() {
    clock += 60_000;
    return new Date(Date.UTC(2026, 6, 17, 12, 0, 0) + clock).toISOString();
}

function chat(id: string, sender: string, content: string): ChatMsg {
    return {type: 'CHAT', id, sender, content, timestamp: stamp(), reactions: []};
}

function log(id: string, actor: string, content: string): CommandLogMsg {
    return {
        type: 'COMMAND_LOG', id, sender: actor, content, timestamp: stamp(), reactions: [],
        commandLog: {turn: '2.3', phase: 'MINION', currentPlayer: actor, command: {commandType: 'DRAW_CARD', actor, count: 1}},
    };
}

const messages: (ChatMsg | CommandLogMsg)[] = [
    chat('m1', 'Seraphina', 'nothing personal, it is a dedication deck'),
    log('m2', 'Seraphina', 'Seraphina drew 1 card'),
    chat('m3', 'Marcus', 'third turn running 😅'),
    chat('m4', 'Isabel', 'are you blocking or shall I make tea'),
];

const meta = {
    title: 'Game/GameChatRail',
    component: GameChatRail,
    parameters: {layout: 'fullscreen'},
    args: {
        gameId: GAME_ID,
        messages,
        status: 'connected',
        currentUser: 'Alice',
        onSend: fn(),
        onReact: fn(),
    },
    decorators: [
        (Story) => {
            // Deterministic filter state; each story sets its own last-read below.
            localStorage.setItem('commandLogDetail', 'full');
            localStorage.removeItem(LAST_READ_KEY);
            return <div className="flex h-[480px] p-3"><div className="flex-1" /><Story /></div>;
        },
    ],
} satisfies Meta<typeof GameChatRail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InterleavedStream: Story = {
    play: async ({canvasElement}) => {
        const canvas = within(canvasElement);
        // Talk and game log share one stream; the detail chips filter the log.
        await expect(canvas.getByText('third turn running 😅')).toBeInTheDocument();
        await expect(canvas.getByText(/card\(s\)/)).toBeInTheDocument();
        await expect(canvas.getByRole('button', {name: 'Off'})).toBeInTheDocument();
    },
};

export const UnreadDividerAtLastRead: Story = {
    decorators: [
        (Story) => {
            localStorage.setItem(LAST_READ_KEY, 'm2');
            return <Story />;
        },
    ],
    play: async ({canvasElement}) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('new since your last visit')).toBeInTheDocument();
    },
};

export const SendMessage: Story = {
    play: async ({args, canvasElement}) => {
        const canvas = within(canvasElement);
        await userEvent.type(canvas.getByPlaceholderText('Say something to the table…'), 'blocking with Theo');
        await userEvent.click(canvas.getByRole('button', {name: 'Send'}));
        await expect(args.onSend).toHaveBeenCalledWith('blocking with Theo', undefined);
    },
};

export const LogFilteredOut: Story = {
    play: async ({canvasElement}) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText(/card\(s\)/)).toBeInTheDocument();
        await userEvent.click(canvas.getByRole('button', {name: 'Off'}));
        await expect(canvas.queryByText(/card\(s\)/)).not.toBeInTheDocument();
        await expect(canvas.getByText('third turn running 😅')).toBeInTheDocument();
    },
};
