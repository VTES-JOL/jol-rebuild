package net.deckserver.jol.dto;

import io.quarkus.runtime.annotations.RegisterForReflection;

import java.time.ZoneId;

@RegisterForReflection
public class UserDto {
    public String id;
    public String username;
    public String email;
    public String tournamentId;
    public String discordId;
    public String countryCode;
    public ZoneId zoneId;
    public boolean enableImages = true;

    public UserDto(String id, String username, String email, String tournamentId, String discordId, String countryCode, ZoneId zoneId, boolean enableImages) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.tournamentId = tournamentId;
        this.discordId = discordId;
        this.countryCode = countryCode;
        this.zoneId = zoneId;
        this.enableImages = enableImages;
    }
}
