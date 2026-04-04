package net.deckserver.jol.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "lobby_message_reactions",
        uniqueConstraints = @UniqueConstraint(columnNames = {"message_id", "sender", "emoji"}))
public class LobbyMessageReaction extends PanacheEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "message_id", nullable = false)
    public LobbyMessage message;

    @Column(nullable = false, length = 64)
    public String sender;

    @Column(nullable = false, length = 32)
    public String emoji;

    public static List<LobbyMessageReaction> findByMessage(Long messageId) {
        return find("message.id", messageId).list();
    }

    public static boolean toggle(LobbyMessage message, String sender, String emoji) {
        // Returns true if reaction was added, false if removed
        LobbyMessageReaction existing = find("message = ?1 and sender = ?2 and emoji = ?3",
                message, sender, emoji).firstResult();
        if (existing != null) {
            existing.delete();
            return false;
        }
        LobbyMessageReaction r = new LobbyMessageReaction();
        r.message = message;
        r.sender = sender;
        r.emoji = emoji;
        r.persist();
        return true;
    }
}