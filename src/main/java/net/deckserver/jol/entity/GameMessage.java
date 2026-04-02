package net.deckserver.jol.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.List;


@Entity
@Table(name = "game_messages")
public class GameMessage extends PanacheEntity {

    @Column(nullable = false, length = 64)
    public String gameId;

    @Column(nullable = false, length = 64)
    public String sender;

    @Column(nullable = false, columnDefinition = "TEXT")
    public String content;

    @Column(nullable = false)
    public Instant timestamp;

    public static GameMessage create(String gameId, String sender, String content) {
        GameMessage msg = new GameMessage();
        msg.gameId = gameId;
        msg.sender = sender;
        msg.content = content;
        msg.timestamp = Instant.now();
        return msg;
    }

    // Returns the N most recent messages for a game room, oldest first
    public static List<GameMessage> findRecentForGame(String gameId, int limit) {
        List<GameMessage> messages = find("gameId = ?1 ORDER BY timestamp DESC", gameId)
                .page(0, limit)
                .list();
        return messages.reversed();
    }
}
