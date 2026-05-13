import type {Meta, StoryObj} from '@storybook/react-vite';
import {fn} from 'storybook/test';
import {useState} from 'react';
import {arrayMove} from '@dnd-kit/sortable';
import {TextBoard} from '../features/game/TextBoard.tsx';
import type {CardData, GameState, RegionType} from '../features/game/types.ts';
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

        function handleCardReorder(playerName: string, regionType: RegionType, cardId: string, toIndex: number) {
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
                const fromIndex = topLevel.indexOf(cardId);
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
                // Remove card (and its children if top-level) from source region
                const card = args.cards[cardId];
                const childrenToMove = (card?.childCardIds ?? []).filter(cid => fromRegion.cardIds.includes(cid));
                const removeIds = new Set([cardId, ...childrenToMove]);
                const newFromIds = fromRegion.cardIds.filter(id => !removeIds.has(id));
                // Attach as top-level (strip parentId) in destination region
                const newToIds = fromRegionType === toRegionType
                    ? [...fromRegion.cardIds.filter(id => !removeIds.has(id)), cardId]
                    : [...toRegion.cardIds, cardId];
                return {
                    ...p,
                    regions: {
                        ...p.regions,
                        [fromRegionType]: {...fromRegion, cardIds: newFromIds, count: newFromIds.length},
                        ...(fromRegionType !== toRegionType && {
                            [toRegionType]: {...toRegion, cardIds: newToIds, count: newToIds.length},
                        }),
                    },
                };
            }));
        }

        function handleCardAttach(playerName: string, cardId: string, targetCardId: string) {
            setPlayers(prev => prev.map(p => {
                if (p.name !== playerName) return p;
                // Find which region has the card being attached
                let sourceRegionType: RegionType | undefined;
                for (const [type, region] of Object.entries(p.regions) as [RegionType, typeof p.regions[RegionType]][]) {
                    if (region?.cardIds.includes(cardId)) { sourceRegionType = type; break; }
                }
                // Find which region has the target card
                let targetRegionType: RegionType | undefined;
                for (const [type, region] of Object.entries(p.regions) as [RegionType, typeof p.regions[RegionType]][]) {
                    if (region?.cardIds.includes(targetCardId)) { targetRegionType = type; break; }
                }
                if (!sourceRegionType || !targetRegionType) return p;

                const sourceRegion = p.regions[sourceRegionType]!;
                const targetRegion = p.regions[targetRegionType]!;

                // Remove cardId from source (and from any existing parent's children)
                const newSourceIds = sourceRegion.cardIds.filter(id => id !== cardId);
                // Insert cardId after targetCardId in target region
                const targetIdx = targetRegion.cardIds.indexOf(targetCardId);
                const baseIds = sourceRegionType === targetRegionType
                    ? newSourceIds
                    : targetRegion.cardIds;
                const insertAfter = baseIds.indexOf(targetCardId);
                const newTargetIds = [
                    ...baseIds.slice(0, insertAfter + 1),
                    cardId,
                    ...baseIds.slice(insertAfter + 1),
                ];

                // Update the cards map to reflect parentId
                const updatedCards: Record<string, CardData> = {
                    ...args.cards,
                    [cardId]: {...args.cards[cardId], parentId: targetCardId},
                    [targetCardId]: {
                        ...args.cards[targetCardId],
                        childCardIds: [...(args.cards[targetCardId]?.childCardIds ?? []).filter(id => id !== cardId), cardId],
                    },
                };
                // Note: story can't update args.cards (it's read-only from meta), so the attach
                // is reflected only in region.cardIds ordering; the cards map itself is static.
                void updatedCards; // acknowledge we can't use this in story state
                void targetIdx;

                if (sourceRegionType === targetRegionType) {
                    return {
                        ...p,
                        regions: {
                            ...p.regions,
                            [targetRegionType]: {...targetRegion, cardIds: newTargetIds, count: newTargetIds.length},
                        },
                    };
                }
                return {
                    ...p,
                    regions: {
                        ...p.regions,
                        [sourceRegionType]: {...sourceRegion, cardIds: newSourceIds, count: newSourceIds.length},
                        [targetRegionType]: {...targetRegion, cardIds: newTargetIds, count: newTargetIds.length},
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
