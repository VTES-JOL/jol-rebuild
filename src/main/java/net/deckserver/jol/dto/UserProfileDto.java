package net.deckserver.jol.dto;

import io.quarkus.hibernate.orm.panache.common.ProjectedFieldName;
import io.quarkus.runtime.annotations.RegisterForReflection;

import java.time.ZoneId;
import java.util.Set;

@RegisterForReflection
public class UserProfileDto {
    public String id;
    public String username;
    public String email;
    public String tournamentId;
    public String discordId;
    public String countryCode;
    public ZoneId zoneId;
    public boolean enableImages;
    public Set<String> roles;

    public UserProfileDto(String id, String username, String email, String tournamentId, String discordId,
                          @ProjectedFieldName("preferences.countryCode") String countryCode,
                          @ProjectedFieldName("preferences.zoneId") ZoneId zoneId,
                          @ProjectedFieldName("preferences.enableImages") boolean enableImages) {
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
