package net.deckserver.jol.entity;

import io.quarkus.runtime.annotations.RegisterForReflection;

import java.time.ZoneId;

@RegisterForReflection
public class Preferences {

    public String countryCode;
    public String zoneId = ZoneId.systemDefault().getId();
    public boolean enableImages = true;
    public String defaultBoard;

    public Preferences() {
    }
}
