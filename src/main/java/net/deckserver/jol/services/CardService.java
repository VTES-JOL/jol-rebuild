package net.deckserver.jol.services;

import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import net.deckserver.jol.config.Config;
import net.deckserver.jol.model.Card;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVRecord;
import org.apache.commons.lang3.StringUtils;
import org.jboss.logging.Logger;

import java.io.FileReader;
import java.io.IOException;
import java.io.Reader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;

@ApplicationScoped
public class CardService {

    private static final Logger LOG = Logger.getLogger(CardService.class);

    @Inject
    Config config;

    Map<String, Card> cardMap = new HashMap<>();

    @PostConstruct
    public void init() {
        Path cryptPath = Path.of(config.cardDir(), "vtescrypt.csv");
        Path libraryPath = Path.of(config.cardDir(), "vteslib.csv");
        if (!Files.exists(cryptPath)) {
            LOG.errorf("Unable to find crypt card file at %s", cryptPath);
        }
        if (!Files.exists(libraryPath)) {
            LOG.errorf("Unable to find library card file at %s", libraryPath);
        }
        LOG.infof("Located data files at %s", config.cardDir());

        CSVFormat cryptFormat = CSVFormat.DEFAULT.builder().setHeader("Id", "Name", "Aka", "Type", "Clan", "Path", "Adv", "Group", "Capacity", "Disciplines", "Card Text", "Set", "Title", "Banned").get();
        CSVFormat libraryFormat = CSVFormat.DEFAULT.builder().setHeader("Id", "Name", "Aka", "Type", "Clan", "Path", "Discipline").get();
        populate(cryptPath, cryptFormat, true);
        populate(libraryPath, libraryFormat, false);
        LOG.infof("Loaded %d cards", cardMap.size());
    }

    public List<Card> findAll() {
        return cardMap.values().stream().sorted(Comparator.comparing(c -> c.name, String.CASE_INSENSITIVE_ORDER)).toList();
    }

    public List<String> autocomplete(String q) {
        return cardMap.keySet().stream()
                .sorted(String.CASE_INSENSITIVE_ORDER)
                .filter(name -> name.toLowerCase().contains(q.toLowerCase()))
                .limit(5)
                .toList();
    }

    private void populate(Path path, CSVFormat format, boolean crypt) {
        try {
            Reader in = new FileReader(path.toFile());
            for (CSVRecord record : format.parse(in)) {
                String defaultName = record.get("Name");
                String id = record.get("Id");
                Card card = new Card();
                card.name = defaultName;
                card.id = id;

                String group = null;
                boolean advanced = false;
                if (crypt) {
                    group = record.get("Group");
                    advanced = record.get("Adv").equals("Advanced");
                }

                Set<String> names = new HashSet<>();
                for (String alias : record.get("Aka").split(";")) {
                    names.add(alias);
                    names.add(StringUtils.stripAccents(alias));
                    names.add(replaceEnding(alias));
                }
                names.add(defaultName);
                for (String name : names) {
                    generateName(card, name, group, advanced);
                }
            }
        } catch (IOException e) {
            LOG.errorf("Unable to read file %s", path);
        }
    }

    private void generateName(Card card, String name, String group, boolean advanced) {
        if (StringUtils.isBlank(name.trim())) {
            return;
        }
        if (group != null) {
            String uniqueName = String.format("%s (%s%s)", name, group.equals("ANY") ? "" : "G" + group, advanced ? " ADV" : "");
            cardMap.put(uniqueName, card);
        } else {
            cardMap.put(name, card);
        }
    }

    private String replaceEnding(String text) {
        return text.replace(", The", "").replaceAll("^", "The ");
    }
}
