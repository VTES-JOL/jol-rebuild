package net.deckserver.jol.game;

import com.fasterxml.jackson.annotation.JsonIdentityReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import net.deckserver.jol.enums.Phase;
import net.deckserver.jol.enums.RegionType;
import net.deckserver.jol.game.command.CardRef;

import java.util.*;

@JsonPropertyOrder({"id", "name", "playerOrder", "orderOfPlayReversed", "turn", "phase", "notes", "impulseWindow", "pendingAction", "sequencingWindow", "cards", "players", "currentPlayer", "edge"})
public class GameData {
    private String id;
    private String name;

    private List<String> playerOrder = new ArrayList<>();
    private Map<String, PlayerData> players = new HashMap<>();
    private Map<String, CardData> cards = new HashMap<>();

    @JsonIdentityReference(alwaysAsId = true)
    private PlayerData currentPlayer;

    @JsonIdentityReference(alwaysAsId = true)
    private PlayerData edge;

    private boolean orderOfPlayReversed = false;
    private String turn = "1.1";
    private Phase phase;
    private String notes;

    private String timeoutRequestor;
    private int transfersRemaining = 0;
    private ImpulseState impulseWindow;
    private PendingActionState pendingAction;
    private SequencingWindowState sequencingWindow;
    private boolean completed = false;

    public GameData(String id, String name) {
        this.id = id;
        this.name = name;
    }

    public GameData(String id) {
        this.id = id;
    }

    public GameData() {}

    public void addPlayer(PlayerData playerData) {
        this.players.put(playerData.getName(), playerData);
        this.playerOrder.add(playerData.getName());
    }

    @JsonIgnore
    public PlayerData getPlayer(String playerName) {
        return this.players.get(playerName);
    }

    @JsonIgnore
    public String getCurrentPlayerName() {
        return Optional.ofNullable(this.currentPlayer).map(PlayerData::getName).orElse(null);
    }

    @JsonIgnore
    public String getEdgePlayer() {
        return this.edge != null ? this.edge.getName() : "no one";
    }

    @JsonIgnore
    public CardData getCard(String id) {
        return this.cards.get(id);
    }

    @JsonIgnore
    public CardData getCardByRef(CardRef ref) {
        if (ref == null) return null;
        PlayerData player = getPlayer(ref.playerName());
        if (player == null) return null;
        RegionData region = player.getRegion(ref.regionType());
        if (region == null || ref.position() < 0 || ref.position() >= region.getCards().size()) return null;
        CardData parent = region.getCard(ref.position());
        if (parent == null) return null;
        if (ref.childIndex() < 0) return parent;
        java.util.List<CardData> children = parent.getCards();
        if (ref.childIndex() >= children.size()) return null;
        return children.get(ref.childIndex());
    }

    @JsonIgnore
    public List<String> getPlayerNames() {
        return this.playerOrder;
    }

    @JsonIgnore
    public RegionData getPlayerRegion(String player, RegionType type) {
        return this.players.get(player).getRegion(type);
    }

    @JsonIgnore
    public List<CardData> getUniqueCards(CardData card) {
        List<CardData> cards = new ArrayList<>();
        if (!card.isUnique()) {
            return cards;
        }

        players.values().stream()
                .filter(playerData -> !playerData.isOusted())
                .map(playerData -> playerData.getRegion(RegionType.READY))
                .flatMap(regionData -> regionData.getCards().stream())
                .filter(c -> c.getName().equals(card.getName()))
                .forEach(cards::add);

        return cards;
    }

    public void orderPlayers(List<String> newOrder) {
        if (!new HashSet<>(this.playerOrder).containsAll(newOrder)) {
            return;
        }
        this.playerOrder = newOrder;
    }

    @JsonIgnore
    public List<PlayerData> getCurrentPlayers() {
        return this.playerOrder.stream()
                .map(this.players::get)
                .filter(playerData -> playerData.getPool() > 0)
                .toList();
    }

    public void initRegion(RegionData crypt, List<CardData> cryptCards) {
        cryptCards.forEach(card -> {
            crypt.addCard(card, false);
            cards.put(card.getId(), card);
        });
    }

    public void updatePredatorMapping() {
        List<PlayerData> currentPlayers = getCurrentPlayers();
        PlayerData current;
        PlayerData first = null;
        PlayerData predator = null;
        for (PlayerData player : currentPlayers) {
            current = player;
            if (first == null) {
                first = current;
            }
            if (predator != null) {
                current.setPredator(predator);
                predator.setPrey(current);
            }
            predator = current;
            if (player.equals(currentPlayers.getLast())) {
                current.setPrey(first);
                first.setPredator(current);
            }
        }
    }

    @JsonIgnore
    public String getTurnLabel() {
        return String.format("%s %s", currentPlayer.getName(), turn);
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public String getTurn() { return turn; }
    public Phase getPhase() { return phase; }
    public String getNotes() { return notes; }
    public boolean isOrderOfPlayReversed() { return orderOfPlayReversed; }
    public String getTimeoutRequestor() { return timeoutRequestor; }
    public Map<String, PlayerData> getPlayers() { return players; }
    public Map<String, CardData> getCards() { return cards; }
    public List<String> getPlayerOrder() { return playerOrder; }
    public PlayerData getCurrentPlayer() { return currentPlayer; }
    public PlayerData getEdge() { return edge; }

    public int getTransfersRemaining() { return transfersRemaining; }
    public void setTransfersRemaining(int transfersRemaining) { this.transfersRemaining = transfersRemaining; }

    public ImpulseState getImpulseWindow() { return impulseWindow; }
    public void setImpulseWindow(ImpulseState impulseWindow) { this.impulseWindow = impulseWindow; }

    public PendingActionState getPendingAction() { return pendingAction; }
    public void setPendingAction(PendingActionState pendingAction) { this.pendingAction = pendingAction; }

    public SequencingWindowState getSequencingWindow() { return sequencingWindow; }
    public void setSequencingWindow(SequencingWindowState sequencingWindow) { this.sequencingWindow = sequencingWindow; }

    public void setPhase(Phase phase) { this.phase = phase; }
    public void setCurrentPlayer(PlayerData currentPlayer) { this.currentPlayer = currentPlayer; }
    public void setTurn(String turn) { this.turn = turn; }
    public void setEdge(PlayerData edge) { this.edge = edge; }
    public void setNotes(String notes) { this.notes = notes; }
    public void setOrderOfPlayReversed(boolean orderOfPlayReversed) { this.orderOfPlayReversed = orderOfPlayReversed; }
    public void setTimeoutRequestor(String timeoutRequestor) { this.timeoutRequestor = timeoutRequestor; }
    public boolean isCompleted() { return completed; }
    public void setCompleted(boolean completed) { this.completed = completed; }

    public void replacePlayer(String oldPlayer, String newPlayer) {
        PlayerData playerData = players.get(oldPlayer);
        playerData.setName(newPlayer);
        players.remove(oldPlayer);
        players.put(newPlayer, playerData);
        int index = playerOrder.indexOf(oldPlayer);
        if (index != -1) {
            playerOrder.set(index, newPlayer);
        }
    }

}
