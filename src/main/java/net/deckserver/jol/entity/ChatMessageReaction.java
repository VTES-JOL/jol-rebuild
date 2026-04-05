package net.deckserver.jol.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "chat_message_reactions",
        uniqueConstraints = @UniqueConstraint(columnNames = {"message_id", "sender", "emoji"}))
public class ChatMessageReaction extends PanacheEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "message_id", nullable = false)
    public ChatMessage message;

    @Column(nullable = false, length = 64)
    public String sender;

    @Column(nullable = false, length = 32)
    public String emoji;

    public static List<ChatMessageReaction> findByMessage(Long messageId) {
        return find("message.id", messageId).list();
    }

    public static boolean toggle(ChatMessage message, String sender, String emoji) {
        // Returns true if reaction was added, false if removed
        ChatMessageReaction existing = find("message = ?1 and sender = ?2 and emoji = ?3",
                message, sender, emoji).firstResult();
        if (existing != null) {
            existing.delete();
            return false;
        }
        ChatMessageReaction r = new ChatMessageReaction();
        r.message = message;
        r.sender = sender;
        r.emoji = emoji;
        r.persist();
        return true;
    }
}
