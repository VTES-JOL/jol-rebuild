import type {Meta, StoryObj} from '@storybook/react-vite';
import {fn} from 'storybook/test';
import {useState} from 'react';
import {arrayMove} from '@dnd-kit/sortable';
import {TextBoard} from '../features/game/TextBoard.tsx';
import type {GameState, RegionType} from '../features/game/types.ts';
import playerViewData from './fixtures/game-player-view.json';

const playerGame = playerViewData as unknown as GameState;

const allPlayers = playerGame.playerOrder
    .map(name => playerGame.players.find(p => p.name === name)!)
    .filter(Boolean);

const meta = {
    title: 'Game/TextBoard',
    component: TextBoard,
    parameters: {layout: 'padded'},
    tags: ['autodocs'],
    args: {
        onCardReorder: fn(),
        onCardMove: fn(),
    },
} satisfies Meta<typeof TextBoard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FivePlayer: Story = {
    args: {
        orderedPlayers: allPlayers,
        cards: playerGame.cards,
        currentUser: 'Player5',
    },
};

export const SinglePlayer: Story = {
    args: {
        orderedPlayers: allPlayers.slice(0, 1),
        cards: playerGame.cards,
        currentUser: allPlayers[0]?.name ?? '',
    },
};

export const TwoPlayer: Story = {
    args: {
        orderedPlayers: allPlayers.slice(0, 2),
        cards: playerGame.cards,
        currentUser: 'Player5',
    },
};

export const WithDragDrop: Story = {
    render: (args) => {
        const [players, setPlayers] = useState(allPlayers);

        function handleCardReorder(playerName: string, regionType: RegionType, fromIndex: number, toIndex: number) {
            setPlayers(prev => prev.map(p => {
                if (p.name !== playerName) return p;
                const region = p.regions[regionType];
                if (!region) return p;

                // Compute top-level IDs (non-children) to apply the index-based reorder
                const regionCardSet = new Set(region.cardIds);
                const childIds = new Set(
                    region.cardIds.filter(id => {
                        const parentId = args.cards[id]?.parentId;
                        return parentId != null && regionCardSet.has(parentId);
                    })
                );
                const topLevel = region.cardIds.filter(id => !childIds.has(id));
                const reorderedTopLevel = arrayMove(topLevel, fromIndex, toIndex);

                // Reconstruct full cardIds with children following their parents
                const newCardIds: string[] = [];
                for (const parentId of reorderedTopLevel) {
                    newCardIds.push(parentId);
                    const parent = args.cards[parentId];
                    for (const childId of parent?.childCardIds ?? []) {
                        if (childIds.has(childId)) newCardIds.push(childId);
                    }
                }

                return {...p, regions: {...p.regions, [regionType]: {...region, cardIds: newCardIds}}};
            }));
        }

        function handleCardMove(playerName: string, cardId: string, fromRegionType: RegionType, toRegionType: RegionType) {
            setPlayers(prev => prev.map(p => {
                if (p.name !== playerName) return p;
                const fromRegion = p.regions[fromRegionType];
                const toRegion = p.regions[toRegionType];
                if (!fromRegion || !toRegion) return p;
                const newFromIds = fromRegion.cardIds.filter(id => id !== cardId);
                const newToIds = [...toRegion.cardIds, cardId];
                return {
                    ...p,
                    regions: {
                        ...p.regions,
                        [fromRegionType]: {...fromRegion, cardIds: newFromIds, count: newFromIds.length},
                        [toRegionType]: {...toRegion, cardIds: newToIds, count: newToIds.length},
                    },
                };
            }));
        }

        return (
            <TextBoard
                {...args}
                orderedPlayers={players}
                onCardReorder={handleCardReorder}
                onCardMove={handleCardMove}
            />
        );
    },
    args: {
        orderedPlayers: allPlayers,
        cards: playerGame.cards,
        currentUser: 'Player5',
    },
};
