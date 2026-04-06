package net.deckserver.jol.config;

import io.quarkus.runtime.annotations.StaticInitSafe;
import io.smallrye.config.ConfigMapping;

@StaticInitSafe
@ConfigMapping(prefix = "jol")
public interface Config {
    String cardDir();
}
