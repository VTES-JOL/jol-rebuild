package net.deckserver.jol.entity;

import io.quarkus.test.TestTransaction;
import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
public class ChatMessageReactionTest {

    @Test
    @TestTransaction
    public void toggleReaction() {
        ChatMessage msg = ChatMessage.create(null, "user1", "content", null);
        String sender = "user2";
        String emoji = "👍";

        boolean added = ChatMessageReaction.toggle(msg, sender, emoji);
        assertTrue(added);
        assertEquals(1, ChatMessageReaction.count());

        boolean removed = ChatMessageReaction.toggle(msg, sender, emoji);
        assertFalse(removed);
        assertEquals(0, ChatMessageReaction.count());
    }

    @Test
    @TestTransaction
    public void findByMessage() {
        ChatMessage msg = ChatMessage.create(null, "user1", "content", null);
        ChatMessageReaction.toggle(msg, "user2", "👍");
        ChatMessageReaction.toggle(msg, "user3", "❤️");

        List<ChatMessageReaction> reactions = ChatMessageReaction.findByMessage(msg.id);
        assertEquals(2, reactions.size());
    }
}
