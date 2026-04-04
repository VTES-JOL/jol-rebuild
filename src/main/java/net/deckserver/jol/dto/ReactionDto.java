// ReactionDto.java
package net.deckserver.jol.dto;

import java.util.List;

public class ReactionDto {
    public String emoji;
    public List<String> senders;

    public static ReactionDto of(String emoji, List<String> senders) {
        ReactionDto dto = new ReactionDto();
        dto.emoji = emoji;
        dto.senders = senders;
        return dto;
    }
}