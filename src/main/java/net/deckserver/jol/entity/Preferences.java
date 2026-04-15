package net.deckserver.jol.entity;

import io.quarkus.runtime.annotations.RegisterForReflection;

import java.time.ZoneId;

@RegisterForReflection
public class Preferences {

    public String countryCode;
    public ZoneId zoneId = ZoneId.systemDefault();
    public boolean enableImages = true;

    public Preferences() {
    }
}
