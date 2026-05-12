import React from 'react';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {fn} from 'storybook/test';
import {BleedConnector, PlayerBoard} from '../features/game/PlayerBoard.tsx';
import type {GameState} from '../features/game/types.ts';
import playerViewData from './fixtures/game-player-view.json';
import spectatorViewData from './fixtures/game-spectator-view.json';

const playerGame  = playerViewData  as unknown as GameState;
const spectatorGame = spectatorViewData as unknown as GameState;

const meta = {
    title: 'Game/PlayerBoard',
    component: PlayerBoard,
    parameters: {layout: 'padded'},
    tags: ['autodocs'],
    args: {
        onCardClick: fn(),
    },
} satisfies Meta<typeof PlayerBoard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Player5 is the viewer — own HAND and UNCONTROLLED are visible
const ownPlayer   = playerGame.players.find(p => p.name === 'Player5')!;
// Player1 is seen from Player5's view — HAND and UNCONTROLLED are hidden
const otherPlayer = playerGame.players.find(p => p.name === 'Player1')!;
// Any player from the spectator projection — all private regions hidden
const spectatorPlayer = spectatorGame.players[0];

const Wrapper = ({children}: {children: React.ReactNode}) => (
    <div className="min-h-screen bg-base p-4">{children}</div>
);

export const OwnPlayer: Story = {
    decorators: [(Story) => <Wrapper><Story /></Wrapper>],
    args: {
        player: ownPlayer,
        cards: playerGame.cards,
        isCurrentPlayer: playerGame.currentPlayer === ownPlayer.name,
    },
};

export const OtherPlayer: Story = {
    decorators: [(Story) => <Wrapper><Story /></Wrapper>],
    args: {
        player: otherPlayer,
        cards: playerGame.cards,
        isCurrentPlayer: playerGame.currentPlayer === otherPlayer.name,
    },
};

export const SpectatorView: Story = {
    decorators: [(Story) => <Wrapper><Story /></Wrapper>],
    args: {
        player: spectatorPlayer,
        cards: spectatorGame.cards,
        isCurrentPlayer: false,
    },
};

export const AllPlayers: Story = {
    render: (args) => (
        <Wrapper>
            <div className="flex flex-col">
                {playerGame.playerOrder.map((name, i) => {
                    const player = playerGame.players.find(p => p.name === name)!;
                    return (
                        <React.Fragment key={name}>
                            {i > 0 && <BleedConnector />}
                            <PlayerBoard
                                {...args}
                                player={player}
                                cards={playerGame.cards}
                                isCurrentPlayer={playerGame.currentPlayer === name}
                            />
                        </React.Fragment>
                    );
                })}
            </div>
        </Wrapper>
    ),
    args: {
        player: ownPlayer,
        cards: playerGame.cards,
    },
};
