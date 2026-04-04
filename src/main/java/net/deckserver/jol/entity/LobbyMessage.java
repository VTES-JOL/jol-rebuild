package net.deckserver.jol.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "lobby_messages")
public class LobbyMessage extends PanacheEntity {

    @Column(nullable = false, length = 64)
    public String sender;

    @Column(nullable = false, columnDefinition = "TEXT")
    public String content;

    @Column(nullable = false)
    public Instant timestamp;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reply_to_id")
    public LobbyMessage replyTo;

    @OneToMany(mappedBy = "message", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    public List<LobbyMessageReaction> reactions = new ArrayList<>();

    public static LobbyMessage create(String sender, String content, LobbyMessage replyTo) {
        LobbyMessage msg = new LobbyMessage();
        msg.sender = sender;
        msg.content = content;
        msg.timestamp = Instant.now();
        msg.replyTo = replyTo;
        return msg;
    }

    // Overload keeps existing callers working
    public static LobbyMessage create(String sender, String content) {
        return create(sender, content, null);
    }

    // Fetch-joins both reactions and replyTo in one query to avoid N+1
    public static List<LobbyMessage> findRecentWithDetails(int limit) {
        // Step 1: get the IDs of the N most recent messages
        List<LobbyMessage> recents = find("ORDER BY timestamp DESC")
                .page(0, limit)
                .list();

        List<Long> ids = recents
                .stream()
                .map(m -> m.id)
                .toList();

        if (ids.isEmpty()) return List.of();

        // Step 2: fetch full graph for those IDs

        return find(
                "SELECT DISTINCT m FROM LobbyMessage m " +
                        "LEFT JOIN FETCH m.reactions " +
                        "LEFT JOIN FETCH m.replyTo " +
                        "WHERE m.id IN ?1 " +
                        "ORDER BY m.timestamp ASC", ids)
                .list();
    }
}