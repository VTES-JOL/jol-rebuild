package net.deckserver.jol.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "chat_messages")
public class ChatMessage extends PanacheEntityBase {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    public String id;

    @Column(length = 64)
    public String gameId; // null for lobby chat

    @Column(nullable = false, length = 64)
    public String sender;

    @Column(nullable = false, columnDefinition = "TEXT")
    public String content;

    @Column(length = 16, nullable = false)
    public String messageType = "CHAT";

    @Column(columnDefinition = "TEXT")
    public String commandData;

    @Column(length = 16)
    public String turn;

    @Column(nullable = false)
    public Instant timestamp;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reply_to_id")
    public ChatMessage replyTo;

    @OneToMany(mappedBy = "message", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    public List<ChatMessageReaction> reactions = new ArrayList<>();

    public static ChatMessage create(String gameId, String sender, String content, ChatMessage replyTo) {
        ChatMessage msg = new ChatMessage();
        msg.gameId = gameId;
        msg.sender = sender;
        msg.content = content;
        msg.timestamp = Instant.now();
        msg.replyTo = replyTo;
        msg.persist();
        return msg;
    }

    public static ChatMessage createCommandLog(String gameId, String sender, String legacyContent, String commandDataJson, String turn) {
        ChatMessage msg = new ChatMessage();
        msg.gameId = gameId;
        msg.sender = sender;
        msg.content = legacyContent;
        msg.commandData = commandDataJson;
        msg.messageType = "COMMAND_LOG";
        msg.turn = turn;
        msg.timestamp = Instant.now();
        msg.persist();
        return msg;
    }

    public static List<ChatMessage> findPaginated(String gameId, int page, int limit) {
        String query = gameId == null ? "gameId IS NULL" : "gameId = ?1";
        Object[] params = gameId == null ? new Object[]{} : new Object[]{gameId};

        List<ChatMessage> paged = find(query + " ORDER BY timestamp DESC", params)
                .page(page, limit)
                .list();

        List<String> ids = paged.stream().map(m -> m.id).toList();
        if (ids.isEmpty()) return List.of();

        return find(
                "SELECT DISTINCT m FROM ChatMessage m " +
                        "LEFT JOIN FETCH m.reactions " +
                        "LEFT JOIN FETCH m.replyTo " +
                        "WHERE m.id IN ?1 " +
                        "ORDER BY m.timestamp ASC", ids)
                .list();
    }

    public static List<ChatMessage> findByTurn(String gameId, String turn) {
        return find("gameId = ?1 AND turn = ?2 AND messageType = 'COMMAND_LOG'", gameId, turn).list();
    }

    public static List<ChatMessage> findRecent(String gameId, int limit) {
        String query = gameId == null ? "gameId IS NULL" : "gameId = ?1";
        Object[] params = gameId == null ? new Object[]{} : new Object[]{gameId};

        List<ChatMessage> recents = find(query + " ORDER BY timestamp DESC", params)
                .page(0, limit)
                .list();

        List<String> ids = recents.stream().map(m -> m.id).toList();
        if (ids.isEmpty()) return List.of();

        return find(
                "SELECT DISTINCT m FROM ChatMessage m " +
                        "LEFT JOIN FETCH m.reactions " +
                        "LEFT JOIN FETCH m.replyTo " +
                        "WHERE m.id IN ?1 " +
                        "ORDER BY m.timestamp ASC", ids)
                .list();
    }
}
