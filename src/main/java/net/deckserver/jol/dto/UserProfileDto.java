package net.deckserver.jol.dto;

import io.quarkus.runtime.annotations.RegisterForReflection;
import net.deckserver.jol.entity.Preferences;

import java.util.Set;

@RegisterForReflection
public class UserProfileDto {
    private final String id;
    private final String username;
    private final String email;
    private final String tournamentId;
    private final String discordId;
    private final String countryCode;
    private final String zoneId;
    private final boolean enableImages;
    private final String defaultBoard;
    private final Set<String> roles;

    public UserProfileDto(String id, String username, String email, String tournamentId, String discordId,
                          Preferences preferences, Set<String> roles) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.tournamentId = tournamentId;
        this.discordId = discordId;
        this.roles = roles != null ? roles : Set.of();
        if (preferences != null) {
            this.countryCode = preferences.countryCode;
            this.zoneId = preferences.zoneId;
            this.enableImages = preferences.enableImages;
            this.defaultBoard = preferences.defaultBoard;
        } else {
            this.countryCode = null;
            this.zoneId = null;
            this.enableImages = false;
            this.defaultBoard = null;
        }
    }

    public String getId() { return id; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public String getTournamentId() { return tournamentId; }
    public String getDiscordId() { return discordId; }
    public String getCountryCode() { return countryCode; }
    public String getZoneId() { return zoneId; }
    public boolean isEnableImages() { return enableImages; }
    public String getDefaultBoard() { return defaultBoard; }
    public Set<String> getRoles() { return roles; }
}
