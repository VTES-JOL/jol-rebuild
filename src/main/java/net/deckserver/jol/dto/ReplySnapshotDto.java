// ReplySnapshotDto.java
package net.deckserver.jol.dto;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public class ReplySnapshotDto {
    public String id;
    public String sender;
    public String content; // truncated to ~100 chars client-side or here

    public static ReplySnapshotDto of(String id, String sender, String content) {
        ReplySnapshotDto dto = new ReplySnapshotDto();
        dto.id = id;
        dto.sender = sender;
        dto.content = content.length() > 100 ? content.substring(0, 100) + "…" : content;
        return dto;
    }
}