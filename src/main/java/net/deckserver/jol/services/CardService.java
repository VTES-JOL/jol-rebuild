package net.deckserver.jol.services;

import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import net.deckserver.jol.config.Config;
import net.deckserver.jol.dto.CardSuggestionDto;
import net.deckserver.jol.model.Card;
import net.deckserver.jol.model.CryptCard;
import net.deckserver.jol.model.CryptType;
import net.deckserver.jol.model.LibraryCard;
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
import java.util.stream.Stream;

@ApplicationScoped
public class CardService {

    private static final Logger LOG = Logger.getLogger(CardService.class);
    /**
     * All cards, one entry per CSV row (no duplicates).
     */
    private final List<Card> allCards = new ArrayList<>();
    /**
     * Lookup index keyed by every searchable name variant.
     * A single card appears under multiple keys (printed name, aliases, accent-stripped forms).
     * For crypt cards the key includes the "(G# ADV)" qualifier.
     */
    private final Map<String, Card> lookupMap = new HashMap<>();
    @Inject
    Config config;

    @PostConstruct
    public void init() {
        Path cryptPath = Path.of(config.cardDir(), "vtescrypt.csv");
        Path libraryPath = Path.of(config.cardDir(), "vteslib.csv");

        if (!Files.exists(cryptPath)) LOG.errorf("Unable to find crypt card file at %s", cryptPath);
        if (!Files.exists(libraryPath)) LOG.errorf("Unable to find library card file at %s", libraryPath);

        LOG.infof("Located data files at %s", config.cardDir());

        CSVFormat cryptFormat = CSVFormat.DEFAULT.builder()
                .setHeader("Id", "Name", "Aka", "Type", "Clan", "Path", "Adv", "Group",
                        "Capacity", "Disciplines", "Card Text", "Set", "Title", "Banned", "Artist")
                .setSkipHeaderRecord(true)
                .get();
        CSVFormat libraryFormat = CSVFormat.DEFAULT.builder()
                .setHeader("Id", "Name", "Aka", "Type", "Clan", "Path", "Discipline",
                        "Pool Cost", "Blood Cost", "Conviction Cost", "Burn Option",
                        "Card Text", "Flavor Text", "Set", "Banned", "Artist", "Capacity")
                .setSkipHeaderRecord(true)
                .get();

        loadCrypt(cryptPath, cryptFormat);
        loadLibrary(libraryPath, libraryFormat);

        LOG.infof("Loaded %d cards (%d lookup keys)", allCards.size(), lookupMap.size());
    }

    // ── Public API ────────────────────────────────────────────────────────────

    public List<Card> findAll() {
        return allCards.stream()
                .sorted(Comparator.comparing(Card::name, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    public Optional<Card> findByName(String name) {
        return Optional.ofNullable(lookupMap.get(name));
    }

    public List<CardSuggestionDto> autocomplete(String q) {
        String lower = q.toLowerCase();
        return lookupMap.keySet().stream()
                .filter(key -> key.toLowerCase().contains(lower))
                .sorted(String.CASE_INSENSITIVE_ORDER)
                .limit(5)
                .map(key -> {
                    Card card = lookupMap.get(key);
                    return new CardSuggestionDto(card.id(), key, card instanceof CryptCard);
                })
                .toList();
    }

    // ── Parsing ───────────────────────────────────────────────────────────────

    private void loadCrypt(Path path, CSVFormat format) {
        try (Reader in = new FileReader(path.toFile())) {
            for (CSVRecord r : format.parse(in)) {
                boolean advanced = "Advanced".equals(r.get("Adv"));
                String group = r.get("Group");

                CryptCard card = new CryptCard(
                        r.get("Id"),
                        r.get("Name"),
                        splitSemicolon(r.get("Aka")),
                        r.get("Card Text"),
                        r.get("Artist"),
                        nullIfBlank(r.get("Banned")),
                        "Imbued".equals(r.get("Type")) ? CryptType.IMBUED : CryptType.VAMPIRE,
                        nullIfBlank(r.get("Clan")),
                        nullIfBlank(r.get("Path")),
                        group,
                        advanced,
                        Integer.parseInt(r.get("Capacity")),
                        parseCryptDisciplines(r.get("Disciplines")),
                        nullIfBlank(r.get("Title"))
                );

                allCards.add(card);
                indexCryptCard(card, group, advanced);
            }
        } catch (IOException e) {
            LOG.errorf("Unable to read file %s", path);
        }
    }

    private void loadLibrary(Path path, CSVFormat format) {
        try (Reader in = new FileReader(path.toFile())) {
            for (CSVRecord r : format.parse(in)) {
                String rawDisc = r.get("Discipline").trim();
                List<String> andDisciplines;
                List<String> orDisciplines;

                if (rawDisc.contains(" & ")) {
                    andDisciplines = splitOn(rawDisc, " & ");
                    orDisciplines = List.of();
                } else if (!rawDisc.isEmpty()) {
                    andDisciplines = List.of();
                    orDisciplines = splitOn(rawDisc, "/");
                } else {
                    andDisciplines = List.of();
                    orDisciplines = List.of();
                }

                LibraryCard card = new LibraryCard(
                        r.get("Id"),
                        r.get("Name"),
                        splitSemicolon(r.get("Aka")),
                        r.get("Card Text"),
                        r.get("Artist"),
                        nullIfBlank(r.get("Banned")),
                        nullIfBlank(r.get("Flavor Text")),
                        splitOn(r.get("Type"), "/"),
                        splitOn(r.get("Clan"), "/").stream().filter(StringUtils::isNotBlank).toList(),
                        nullIfBlank(r.get("Path")),
                        andDisciplines,
                        orDisciplines,
                        parseCost(r.get("Pool Cost")),
                        parseCost(r.get("Blood Cost")),
                        parseCost(r.get("Conviction Cost")),
                        parseBurnOption(r.get("Burn Option"))
                );

                allCards.add(card);
                indexLibraryCard(card);
            }
        } catch (IOException e) {
            LOG.errorf("Unable to read file %s", path);
        }
    }

    // ── Indexing ──────────────────────────────────────────────────────────────

    private void indexCryptCard(CryptCard card, String group, boolean advanced) {
        final String suffix = "ANY".equals(group)
                ? (advanced ? " (ADV)" : "")
                : " (" + "G" + group + (advanced ? " ADV" : "") + ")";

        Stream.concat(
                Stream.of(card.name()),
                card.aka().stream().flatMap(a -> Stream.of(a, StringUtils.stripAccents(a)))
        ).map(String::trim).filter(StringUtils::isNotBlank).distinct().forEach(nameVariant -> {
            lookupMap.put(nameVariant + suffix, card);
            lookupMap.put(replaceArticle(nameVariant) + suffix, card);
        });
    }

    private void indexLibraryCard(LibraryCard card) {
        Stream.concat(
                Stream.of(card.name()),
                card.aka().stream().flatMap(a -> Stream.of(a, StringUtils.stripAccents(a)))
        ).map(String::trim).filter(StringUtils::isNotBlank).distinct().forEach(nameVariant -> {
            lookupMap.put(nameVariant, card);
            lookupMap.put(replaceArticle(nameVariant), card);
        });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private List<String> parseCryptDisciplines(String raw) {
        if (StringUtils.isBlank(raw) || "-none-".equals(raw)) return List.of();
        return Arrays.stream(raw.split(" "))
                .map(String::trim)
                .filter(StringUtils::isNotBlank)
                .toList();
    }

    private List<String> splitSemicolon(String raw) {
        if (StringUtils.isBlank(raw)) return List.of();
        return Arrays.stream(raw.split(";"))
                .map(String::trim)
                .filter(StringUtils::isNotBlank)
                .toList();
    }

    private List<String> splitOn(String raw, String delimiter) {
        if (StringUtils.isBlank(raw)) return List.of();
        return Arrays.stream(raw.split(java.util.regex.Pattern.quote(delimiter)))
                .map(String::trim)
                .filter(StringUtils::isNotBlank)
                .toList();
    }

    /**
     * Null when blank, -1 when variable (X), otherwise the integer value.
     */
    private Integer parseCost(String raw) {
        if (StringUtils.isBlank(raw)) return null;
        if ("X".equalsIgnoreCase(raw.trim())) return -1;
        return Integer.parseInt(raw.trim());
    }

    private boolean parseBurnOption(String raw) {
        return "Y".equalsIgnoreCase(raw) || "Yes".equalsIgnoreCase(raw);
    }

    private String nullIfBlank(String value) {
        return StringUtils.isBlank(value) ? null : value.trim();
    }

    /**
     * "The Foo" ↔ "Foo, The" article swap for alternate lookup keys.
     */
    private String replaceArticle(String text) {
        if (text.endsWith(", The")) return "The " + text.substring(0, text.length() - 5);
        if (text.startsWith("The ")) return text.substring(4) + ", The";
        return text;
    }
}