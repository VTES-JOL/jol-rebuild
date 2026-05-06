package net.deckserver.jol.config;

import io.quarkus.runtime.annotations.StaticInitSafe;
import io.smallrye.config.ConfigMapping;
import io.smallrye.config.WithDefault;

@StaticInitSafe
@ConfigMapping(prefix = "jol")
public interface Config {
    String cardDir();

    Tournament tournament();

    Chat chat();

    interface Tournament {
        @WithDefault("5")
        int maxTableSize();

        @WithDefault("3")
        int maxRounds();
    }

    interface Chat {
        @WithDefault("50")
        int historyLimit();

        @WithDefault("4000")
        int maxContentLength();
    }
}
