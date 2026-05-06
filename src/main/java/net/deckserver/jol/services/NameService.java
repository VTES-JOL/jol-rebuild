package net.deckserver.jol.services;

import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import org.apache.commons.io.IOUtils;
import org.jboss.logging.Logger;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.ThreadLocalRandom;

@ApplicationScoped
public class NameService {

    private static final Logger LOG = Logger.getLogger(NameService.class);

    private List<String> adjectives;
    private List<String> verbs;
    private List<String> nouns;

    @PostConstruct
    public void init() {
        adjectives = IOUtils.readLines(Objects.requireNonNull(NameService.class.getResourceAsStream("names_adjectives.txt")), StandardCharsets.UTF_8);
        LOG.infof("Loaded %d adjectives", adjectives.size());
        verbs = IOUtils.readLines(Objects.requireNonNull(NameService.class.getResourceAsStream("names_verbs.txt")), StandardCharsets.UTF_8);
        LOG.infof("Loaded %d verbs", verbs.size());
        nouns = IOUtils.readLines(Objects.requireNonNull(NameService.class.getResourceAsStream("names_nouns.txt")), StandardCharsets.UTF_8);
        LOG.infof("Loaded %d nouns", nouns.size());
    }

    public String generateName() {
        return getAdjective() + " " + getVerb() + " " + getNoun();
    }

    public String getAdjective() {
        return adjectives.get(ThreadLocalRandom.current().nextInt(adjectives.size()));
    }

    public String getVerb() {
        return verbs.get(ThreadLocalRandom.current().nextInt(verbs.size()));
    }

    public String getNoun() {
        return nouns.get(ThreadLocalRandom.current().nextInt(nouns.size()));
    }
}
