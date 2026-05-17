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
        onCardAttach: fn(),
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

                const regionCardSet = new Set(region.cardIds);
                const childIds = new Set(
                    region.cardIds.filter(id => {
                        const parentId = args.cards[id]?.parentId;
                        return parentId != null && regionCardSet.has(parentId);
                    })
                );
                const topLevel = region.cardIds.filter(id => !childIds.has(id));
                const reorderedTopLevel = arrayMove(topLevel, fromIndex, toIndex);

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

        function handleCardMove(playerName: string, fromRegion: RegionType, fromIndex: number, toRegion: RegionType, childIdx?: number) {
            setPlayers(prev => prev.map(p => {
                if (p.name !== playerName) return p;
                const fromRegionData = p.regions[fromRegion];
                const toRegionData = p.regions[toRegion];
                if (!fromRegionData || !toRegionData) return p;

                const regionCardSet = new Set(fromRegionData.cardIds);
                const childIdsSet = new Set(
                    fromRegionData.cardIds.filter(id => {
                        const parentId = args.cards[id]?.parentId;
                        return parentId != null && regionCardSet.has(parentId);
                    })
                );
                const topLevel = fromRegionData.cardIds.filter(id => !childIdsSet.has(id));
                const parentCardId = topLevel[fromIndex];
                if (!parentCardId) return p;

                const cardToMove = childIdx != null
                    ? (args.cards[parentCardId]?.childCardIds ?? [])[childIdx]
                    : parentCardId;
                if (!cardToMove) return p;

                const childrenToMove = childIdx == null
                    ? (args.cards[cardToMove]?.childCardIds ?? []).filter(cid => fromRegionData.cardIds.includes(cid))
                    : [];
                const removeIds = new Set([cardToMove, ...childrenToMove]);
                const newFromIds = fromRegionData.cardIds.filter(id => !removeIds.has(id));
                const newToIds = fromRegion === toRegion
                    ? [...newFromIds, cardToMove]
                    : [...toRegionData.cardIds, cardToMove];

                return {
                    ...p,
                    regions: {
                        ...p.regions,
                        [fromRegion]: {...fromRegionData, cardIds: newFromIds, count: newFromIds.length},
                        ...(fromRegion !== toRegion && {
                            [toRegion]: {...toRegionData, cardIds: newToIds, count: newToIds.length},
                        }),
                    },
                };
            }));
        }

        function handleCardAttach(playerName: string, fromRegion: RegionType, fromTopIdx: number, fromChildIdx: number | null, toRegion: RegionType, toTopIdx: number) {
            setPlayers(prev => prev.map(p => {
                if (p.name !== playerName) return p;
                const fromRegionData = p.regions[fromRegion];
                const toRegionData = p.regions[toRegion];
                if (!fromRegionData || !toRegionData) return p;

                const getTopLevel = (regionData: typeof fromRegionData) => {
                    const cardSet = new Set(regionData.cardIds);
                    const childSet = new Set(
                        regionData.cardIds.filter(id => {
                            const parentId = args.cards[id]?.parentId;
                            return parentId != null && cardSet.has(parentId);
                        })
                    );
                    return regionData.cardIds.filter(id => !childSet.has(id));
                };

                const fromTopLevel = getTopLevel(fromRegionData);
                const parentCardId = fromTopLevel[fromTopIdx];
                if (!parentCardId) return p;

                const cardToAttach = fromChildIdx != null
                    ? (args.cards[parentCardId]?.childCardIds ?? [])[fromChildIdx]
                    : parentCardId;
                if (!cardToAttach) return p;

                const toTopLevel = getTopLevel(toRegionData);
                const targetCardId = toTopLevel[toTopIdx];
                if (!targetCardId) return p;

                const newSourceIds = fromRegionData.cardIds.filter(id => id !== cardToAttach);
                const baseIds = fromRegion === toRegion ? newSourceIds : toRegionData.cardIds;
                const insertAfter = baseIds.indexOf(targetCardId);
                const newTargetIds = [
                    ...baseIds.slice(0, insertAfter + 1),
                    cardToAttach,
                    ...baseIds.slice(insertAfter + 1),
                ];

                if (fromRegion === toRegion) {
                    return {
                        ...p,
                        regions: {
                            ...p.regions,
                            [toRegion]: {...toRegionData, cardIds: newTargetIds, count: newTargetIds.length},
                        },
                    };
                }
                return {
                    ...p,
                    regions: {
                        ...p.regions,
                        [fromRegion]: {...fromRegionData, cardIds: newSourceIds, count: newSourceIds.length},
                        [toRegion]: {...toRegionData, cardIds: newTargetIds, count: newTargetIds.length},
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
                onCardAttach={handleCardAttach}
            />
        );
    },
    args: {
        orderedPlayers: allPlayers,
        cards: playerGame.cards,
        currentUser: 'Player5',
    },
};
