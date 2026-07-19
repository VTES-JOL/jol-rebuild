package net.deckserver.jol.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

import java.time.Instant;

/**
 * Per-player chat read position for one game — the server-side last-read
 * marker from the board blueprint's Gaps table. Backs the unread divider and
 * the reconnect digest across devices.
 */
@Entity
@Table(name = "chat_read_markers", uniqueConstraints = @UniqueConstraint(columnNames = {"gameId", "username"}))
public class ChatReadMarker extends PanacheEntityBase {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    public String id;

    @Column(nullable = false, length = 64)
    public String gameId;

    @Column(nullable = false, length = 64)
    public String username;

    @Column(nullable = false)
    public String lastReadMessageId;

    @Column(nullable = false)
    public Instant updatedAt;

    public static ChatReadMarker findByGameAndUser(String gameId, String username) {
        return find("gameId = ?1 AND username = ?2", gameId, username).firstResult();
    }
}
