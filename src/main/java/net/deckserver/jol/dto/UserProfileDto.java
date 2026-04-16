package net.deckserver.jol.dto;

import io.quarkus.runtime.annotations.RegisterForReflection;
import net.deckserver.jol.entity.Preferences;

import java.util.Set;

@RegisterForReflection
public class UserProfileDto {
    public String id;
    public String username;
    public String email;
    public String tournamentId;
    public String discordId;
    public String countryCode;
    public String zoneId;
    public boolean enableImages;
    public Set<String> roles;

    public UserProfileDto(String id, String username, String email, String tournamentId, String discordId,
                          Preferences preferences) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.tournamentId = tournamentId;
        this.discordId = discordId;
        if (preferences != null) {
            this.countryCode = preferences.countryCode;
            this.zoneId = preferences.zoneId;
            this.enableImages = preferences.enableImages;
        }
    }
}
