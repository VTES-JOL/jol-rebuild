package net.deckserver.jol.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.time.Instant;
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

    public static LobbyMessage create(String sender, String content) {
        LobbyMessage msg = new LobbyMessage();
        msg.sender = sender;
        msg.content = content;
        msg.timestamp = Instant.now();
        return msg;
    }

    // Returns the N most recent lobby messages, oldest first
    public static List<LobbyMessage> findRecent(int limit) {
        List<LobbyMessage> messages = find("ORDER BY timestamp DESC")
                .page(0, limit)
                .list();
        return messages.reversed();
    }
}