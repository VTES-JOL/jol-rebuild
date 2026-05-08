package net.deckserver.jol.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.quarkus.runtime.annotations.RegisterForReflection;
import net.deckserver.jol.game.command.GameCommand;

import java.time.Instant;
import java.util.List;

/**
 * Unified WebSocket envelope for the game channel.
 * <p>
 * Client → Server: type = CHAT | REACTION | GAME_COMMAND
 * Server → Client: type = CHAT | HISTORY | REACTION | ERROR | GAME_STATE | GAME_SNAPSHOT
 */
@RegisterForReflection
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GameMessageDto {

    public Type type;

    // ── Chat fields ────────────────────────────────────────────────────────
    public String sender;
    public String content;
    public Instant timestamp;
    public String id;
    public String replyToId;
    public String emoji;
    public ReplySnapshotDto replyTo;
    public List<ReactionDto> reactions;
    public List<GameMessageDto> history;

    // ── Game fields ────────────────────────────────────────────────────────
    public GameCommand command;
    public GameStateDto state;
    public String error;

    public enum Type {
        CHAT, HISTORY, REACTION, ERROR,
        GAME_COMMAND, GAME_STATE, GAME_SNAPSHOT
    }

    public static GameMessageDto stateUpdate(GameStateDto state) {
        GameMessageDto dto = new GameMessageDto();
        dto.type = Type.GAME_STATE;
        dto.state = state;
        return dto;
    }

    public static GameMessageDto snapshot(GameStateDto state) {
        GameMessageDto dto = new GameMessageDto();
        dto.type = Type.GAME_SNAPSHOT;
        dto.state = state;
        return dto;
    }

    public static GameMessageDto error(String detail) {
        GameMessageDto dto = new GameMessageDto();
        dto.type = Type.ERROR;
        dto.error = detail;
        return dto;
    }
}
