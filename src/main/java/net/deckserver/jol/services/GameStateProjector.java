package net.deckserver.jol.services;

import jakarta.enterprise.context.ApplicationScoped;
import net.deckserver.jol.dto.CardSlotDto;
import net.deckserver.jol.dto.CardStateDto;
import net.deckserver.jol.dto.GameStateDto;
import net.deckserver.jol.dto.PlayerStateDto;
import net.deckserver.jol.dto.RegionStateDto;
import net.deckserver.jol.enums.RegionType;
import net.deckserver.jol.game.CardData;
import net.deckserver.jol.game.GameData;
import net.deckserver.jol.game.PlayerData;
import net.deckserver.jol.game.RegionData;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Transforms a GameData aggregate into a per-player view applying visibility rules
 * from RegionType.isVisible(owner, viewer). Cards in hidden regions are omitted
 * from the cards map; region DTOs still carry a count.
 */
@ApplicationScoped
public class GameStateProjector {

    public GameStateDto project(GameData game, String viewerUsername) {
        GameStateDto dto = new GameStateDto();
        dto.gameId = game.getId();
        dto.gameName = game.getName();
        dto.turn = game.getTurn();
        dto.phase = game.getPhase();
        dto.currentPlayer = game.getCurrentPlayerName();
        dto.edgeHolder = game.getEdgePlayer();
        dto.orderReversed = game.isOrderOfPlayReversed();
        dto.notes = game.getNotes();
        dto.playerOrder = List.copyOf(game.getPlayerOrder());

        dto.players = buildPlayerStates(game, viewerUsername);
        dto.cards = buildCardMap(game, viewerUsername);
        return dto;
    }

    private List<PlayerStateDto> buildPlayerStates(GameData game, String viewer) {
        List<PlayerStateDto> result = new ArrayList<>();
        for (String name : game.getPlayerOrder()) {
            PlayerData player = game.getPlayer(name);
            if (player == null) continue;
            result.add(toPlayerStateDto(player, viewer));
        }
        return result;
    }

    private PlayerStateDto toPlayerStateDto(PlayerData player, String viewer) {
        PlayerStateDto dto = new PlayerStateDto();
        dto.name = player.getName();
        dto.pool = player.getPool();
        dto.victoryPoints = player.getVictoryPoints();
        dto.ousted = player.isOusted();
        dto.prey = player.getPrey() != null ? player.getPrey().getName() : null;
        dto.predator = player.getPredator() != null ? player.getPredator().getName() : null;
        dto.notes = player.getNotes();
        dto.choice = player.getChoice();

        Map<RegionType, RegionStateDto> regions = new LinkedHashMap<>();
        for (RegionType type : RegionType.values()) {
            RegionData region = player.getRegion(type);
            if (region != null) {
                regions.put(type, toRegionStateDto(region, viewer));
            }
        }
        dto.regions = regions;
        return dto;
    }

    private RegionStateDto toRegionStateDto(RegionData region, String viewer) {
        RegionStateDto dto = new RegionStateDto();
        dto.id = region.getId();
        dto.type = region.getType();
        dto.count = region.size();
        boolean visible = region.getType().isVisible(region.getOwner(), viewer);
        dto.visible = visible;

        if (visible) {
            List<String> ids = new ArrayList<>();
            for (CardData card : region.getCards()) {
                ids.add(card.getId());
                for (CardData child : card.getCards()) {
                    ids.add(child.getId());
                }
            }
            dto.cardIds = ids;
        } else {
            // No UUIDs transmitted for hidden regions — identity is never leaked.
            dto.cardIds = List.of();
            // Expose positional slot data for UNCONTROLLED so all players can see
            // blood counter amounts on face-down vampires without learning card identity.
            if (region.getType() == RegionType.UNCONTROLLED) {
                dto.slots = buildSlots(region);
            }
        }
        return dto;
    }

    private List<CardSlotDto> buildSlots(RegionData region) {
        List<CardSlotDto> slots = new ArrayList<>();
        List<CardData> cards = region.getCards();
        for (int i = 0; i < cards.size(); i++) {
            CardData card = cards.get(i);
            CardSlotDto slot = new CardSlotDto();
            slot.index = i;
            slot.counters = card.getCounters();
            slot.locked = card.isLocked();
            slot.childCount = card.getCards().size();
            slots.add(slot);
        }
        return slots;
    }

    private Map<String, CardStateDto> buildCardMap(GameData game, String viewer) {
        Map<String, CardStateDto> result = new LinkedHashMap<>();
        for (CardData card : game.getCards().values()) {
            RegionData region = card.getRegion();
            if (region == null) continue;
            if (region.getType().isVisible(region.getOwner(), viewer)) {
                result.put(card.getId(), toCardStateDto(card));
            }
            // Hidden regions: no UUID entry — position-based CardRef is used for interaction
        }
        return result;
    }

    private CardStateDto toCardStateDto(CardData card) {
        CardStateDto dto = new CardStateDto();
        dto.id = card.getId();
        dto.regionId = card.getRegion() != null ? card.getRegion().getId() : null;
        dto.ownerName = card.getOwnerName();
        dto.parentId = card.getParent() != null ? card.getParent().getId() : null;

        if (!card.getCards().isEmpty()) {
            List<String> childIds = new ArrayList<>();
            for (CardData child : card.getCards()) {
                childIds.add(child.getId());
            }
            dto.childCardIds = childIds;
        }

        dto.cardId = card.getCardId();
        dto.name = card.getName();
        dto.type = card.getType();
        dto.types = card.getTypes().isEmpty() ? null : card.getTypes();
        dto.locked = card.isLocked();
        dto.contested = card.isContested();
        dto.counters = card.getCounters();
        dto.votes = card.getVotes();
        dto.notes = card.getNotes();
        dto.title = card.getTitle();
        dto.advanced = card.isAdvanced();
        dto.capacity = card.getCapacity();
        dto.minion = card.isMinion();
        dto.unique = card.isUnique();
        dto.disciplines = card.getDisciplines().isEmpty() ? null : card.getDisciplines();
        dto.controllerName = card.getController() != null ? card.getController().getName() : null;

        if (card.getClan() != null) dto.clan = card.getClan().getDescription();
        if (card.getSect() != null) dto.sect = card.getSect().getDescription();
        if (card.getPath() != null) dto.path = card.getPath().getDescription();

        return dto;
    }
}
