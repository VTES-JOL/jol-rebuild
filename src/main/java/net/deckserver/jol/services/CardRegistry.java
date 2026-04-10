package net.deckserver.jol.services;

import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import net.deckserver.jol.config.Config;
import net.deckserver.jol.enums.Discipline;
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

/**
 * Loads all card data from CSV on startup and maintains the lookup indices used
 * by search and import. All other services treat this as their read-only card
 * data source.
 */
@ApplicationScoped
public class CardRegistry {

    private static final Logger LOG = Logger.getLogger(CardRegistry.class);

    /** Maps lowercased full discipline name (e.g. "blood sorcery") → code (e.g. "tha"). */
    private static final Map<String, String> DISC_NAME_TO_CODE;
    static {
        DISC_NAME_TO_CODE = new HashMap<>();
        for (Discipline d : Discipline.values()) {
            DISC_NAME_TO_CODE.put(d.name().toLowerCase().replace('_', ' '), d.code);
        }
    }

    private final List<Card> allCards = new ArrayList<>();

    /**
     * Lookup index keyed by every searchable name variant.
     * A single card appears under multiple keys (printed name, aliases, accent-stripped forms).
     * For crypt cards the key includes the "(G# ADV)" qualifier.
     */
    private final Map<String, Card> lookupMap = new HashMap<>();

    /** Fast lookup by card ID (one entry per card). */
    private final Map<String, Card> idMap = new HashMap<>();

    /**
     * Case-insensitive, accent-stripped lookup for import name resolution.
     * Key = lowercase accent-stripped lookup key; value = same card as lookupMap.
     */
    private final Map<String, Card> lowerLookupMap = new HashMap<>();

    @Inject
    Config config;

    @PostConstruct
    public void init() {
        Path cryptPath   = Path.of(config.cardDir(), "vtescrypt.csv");
        Path libraryPath = Path.of(config.cardDir(), "vteslib.csv");

        if (!Files.exists(cryptPath))   LOG.errorf("Unable to find crypt card file at %s",   cryptPath);
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

        lookupMap.forEach((k, v) -> lowerLookupMap.put(StringUtils.stripAccents(k).toLowerCase(), v));

        // For crypt cards whose base name is unique, also index by bare name so JOL
        // imports don't need group qualifiers for unambiguous vampires.
        Map<String, Set<Card>> bareNameToCards = new LinkedHashMap<>();
        for (Card card : allCards) {
            if (!(card instanceof CryptCard)) continue;
            for (String variant : nameVariants(card)) {
                bareNameToCards.computeIfAbsent(variant, k -> new LinkedHashSet<>()).add(card);
            }
        }
        int bareAdded = 0;
        for (Map.Entry<String, Set<Card>> entry : bareNameToCards.entrySet()) {
            if (entry.getValue().size() == 1) {
                lowerLookupMap.putIfAbsent(entry.getKey(), entry.getValue().iterator().next());
                bareAdded++;
            }
        }
        LOG.infof("Loaded %d cards (%d lookup keys, %d unambiguous crypt bare names)",
                allCards.size(), lookupMap.size(), bareAdded);
    }

    // ── Public accessors ──────────────────────────────────────────────────────

    public List<Card> allCards() {
        return Collections.unmodifiableList(allCards);
    }

    /** All lookup-map entries — used by autocomplete to iterate name variants. */
    public Map<String, Card> lookupEntries() {
        return Collections.unmodifiableMap(lookupMap);
    }

    public Card findById(String id) {
        return idMap.get(id);
    }

    /** Looks up a card by accent-stripped, lowercased name as used in JOL import. */
    public Card findByNormalizedName(String normalizedName) {
        return lowerLookupMap.get(normalizedName);
    }

    // ── CSV loading ───────────────────────────────────────────────────────────

    private void loadCrypt(Path path, CSVFormat format) {
        try (Reader in = new FileReader(path.toFile())) {
            for (CSVRecord r : format.parse(in)) {
                boolean advanced = "Advanced".equals(r.get("Adv"));
                String  group    = r.get("Group");

                CryptCard card = new CryptCard(
                        r.get("Id"),
                        r.get("Name"),
                        splitSemicolon(r.get("Aka")),
                        r.get("Card Text"),
                        r.get("Artist"),
                        StringUtils.isNotBlank(r.get("Banned")),
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
                idMap.put(card.id(), card);
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
                    andDisciplines = splitOn(rawDisc, " & ").stream().map(this::disciplineToCode).toList();
                    orDisciplines  = List.of();
                } else if (!rawDisc.isEmpty()) {
                    andDisciplines = List.of();
                    orDisciplines  = splitOn(rawDisc, "/").stream().map(this::disciplineToCode).toList();
                } else {
                    andDisciplines = List.of();
                    orDisciplines  = List.of();
                }

                LibraryCard card = new LibraryCard(
                        r.get("Id"),
                        r.get("Name"),
                        splitSemicolon(r.get("Aka")),
                        r.get("Card Text"),
                        r.get("Artist"),
                        StringUtils.isNotBlank(r.get("Banned")),
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
                idMap.put(card.id(), card);
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
                : " (G" + group + (advanced ? " ADV" : "") + ")";

        Stream.concat(
                Stream.of(card.name(), StringUtils.stripAccents(card.name())),
                card.aka().stream().flatMap(a -> Stream.of(a, StringUtils.stripAccents(a)))
        ).map(String::trim).filter(StringUtils::isNotBlank).distinct().forEach(variant -> {
            lookupMap.put(variant + suffix, card);
            lookupMap.put(replaceArticle(variant) + suffix, card);
        });
    }

    private void indexLibraryCard(LibraryCard card) {
        Stream.concat(
                Stream.of(card.name(), StringUtils.stripAccents(card.name())),
                card.aka().stream().flatMap(a -> Stream.of(a, StringUtils.stripAccents(a)))
        ).map(String::trim).filter(StringUtils::isNotBlank).distinct().forEach(variant -> {
            lookupMap.put(variant, card);
            lookupMap.put(replaceArticle(variant), card);
        });
    }

    // ── Parsing helpers ───────────────────────────────────────────────────────

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

    /** Null when blank, -1 when variable (X), otherwise the integer value. */
    private Integer parseCost(String raw) {
        if (StringUtils.isBlank(raw)) return null;
        if ("X".equalsIgnoreCase(raw.trim())) return -1;
        return Integer.parseInt(raw.trim());
    }

    private boolean parseBurnOption(String raw) {
        return "Y".equalsIgnoreCase(raw) || "Yes".equalsIgnoreCase(raw);
    }

    /** Converts a full discipline name from the CSV to its short code. */
    private String disciplineToCode(String name) {
        return DISC_NAME_TO_CODE.getOrDefault(name.trim().toLowerCase(), name.trim().toLowerCase());
    }

    private String nullIfBlank(String value) {
        return StringUtils.isBlank(value) ? null : value.trim();
    }

    /**
     * Returns the stripped-lowercase bare name variants for a card (name + AKAs),
     * used to build the unambiguous crypt bare-name index.
     */
    private Set<String> nameVariants(Card card) {
        return Stream.concat(
                Stream.of(card.name()),
                card.aka().stream()
        ).flatMap(n -> Stream.of(n, replaceArticle(n)))
         .map(n -> StringUtils.stripAccents(n).toLowerCase().strip())
         .filter(StringUtils::isNotBlank)
         .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));
    }

    /** "The Foo" ↔ "Foo, The" article swap for alternate lookup keys. */
    private String replaceArticle(String text) {
        if (text.endsWith(", The")) return "The " + text.substring(0, text.length() - 5);
        if (text.startsWith("The ")) return text.substring(4) + ", The";
        return text;
    }
}
