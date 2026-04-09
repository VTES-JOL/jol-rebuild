package net.deckserver.jol.services;

import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import net.deckserver.jol.config.Config;
import net.deckserver.jol.dto.CardIconDto;
import net.deckserver.jol.dto.CardSuggestionDto;
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

@ApplicationScoped
public class CardService {

    private static final Logger LOG = Logger.getLogger(CardService.class);

    /** Maps lowercased full discipline name (e.g. "blood sorcery") → code (e.g. "tha"). */
    private static final Map<String, String> DISC_NAME_TO_CODE;
    static {
        DISC_NAME_TO_CODE = new HashMap<>();
        for (Discipline d : Discipline.values()) {
            // enum name "BLOOD_SORCERY" → lookup key "blood sorcery"
            DISC_NAME_TO_CODE.put(d.name().toLowerCase().replace('_', ' '), d.code);
        }
    }
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
    /**
     * Fast lookup by card ID (one entry per card).
     */
    private final Map<String, Card> idMap = new HashMap<>();
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

    public List<CardIconDto> findIconsByIds(List<String> ids) {
        return ids.stream()
                .map(idMap::get)
                .filter(Objects::nonNull)
                .map(this::toIconDto)
                .toList();
    }

    public CardIconDto findIconById(String id) {
        Card card = idMap.get(id);
        return card != null ? toIconDto(card) : null;
    }

    private CardIconDto toIconDto(Card card) {
        if (card instanceof CryptCard c) {
            return new CardIconDto(
                    c.id(), true,
                    c.clan(), c.path(), c.capacity(), c.disciplines(),
                    List.of(), List.of(), List.of(), null, null, null
            );
        }
        LibraryCard l = (LibraryCard) card;
        return new CardIconDto(
                l.id(), false,
                null, null, null, List.of(),
                l.andDisciplines(), l.orDisciplines(),
                l.requirementClans(), l.requirementPath(),
                l.poolCost(), l.bloodCost()
        );
    }

    public List<CardSuggestionDto> autocomplete(String q) {
        String normalizedQuery = StringUtils.stripAccents(q).toLowerCase();

        record Match(String displayName, Card card, int score) {}
        Map<String, Match> best = new HashMap<>();

        for (Map.Entry<String, Card> entry : lookupMap.entrySet()) {
            String normalizedKey = StringUtils.stripAccents(entry.getKey()).toLowerCase();
            int score = matchScore(normalizedQuery, normalizedKey);
            if (score < 0) continue;

            String displayName = canonicalName(entry.getValue());
            Match existing = best.get(displayName);
            if (existing == null || score < existing.score()) {
                best.put(displayName, new Match(displayName, entry.getValue(), score));
            }
        }

        return best.values().stream()
                .sorted(Comparator.comparingInt(Match::score)
                        .thenComparingInt(m -> m.displayName().length())
                        .thenComparing(Match::displayName, String.CASE_INSENSITIVE_ORDER))
                .limit(5)
                .map(m -> toSuggestion(m.displayName(), m.card()))
                .toList();
    }

    /**
     * Score a query against a normalized key. Lower is better.
     * 0 = exact, 1 = word-prefix, 2 = key-prefix, 3 = contains, 4 = fuzzy-prefix, -1 = no match.
     */
    private int matchScore(String normalizedQuery, String normalizedKey) {
        if (normalizedKey.equals(normalizedQuery)) return 0;
        // Word-level prefix: any space/paren-delimited token in the key starts with the query
        for (String token : normalizedKey.split("[\\s(]")) {
            if (!token.isEmpty() && token.startsWith(normalizedQuery)) return 1;
        }
        if (normalizedKey.startsWith(normalizedQuery)) return 2;
        if (normalizedKey.contains(normalizedQuery)) return 3;
        // Fuzzy prefix: shared prefix of length max(query.length - 2, 4) covers accent
        // transliterations like "sebastian" → "sebastien"
        int fuzzyLen = Math.max(normalizedQuery.length() - 2, 4);
        if (normalizedQuery.length() >= fuzzyLen) {
            String queryPrefix = normalizedQuery.substring(0, fuzzyLen);
            for (String token : normalizedKey.split("[\\s(]")) {
                if (token.length() >= fuzzyLen && token.startsWith(queryPrefix)) return 4;
            }
        }
        return -1;
    }

    private String canonicalName(Card card) {
        if (card instanceof CryptCard c) {
            return c.name() + cryptSuffix(c);
        }
        return card.name();
    }

    private String cryptSuffix(CryptCard c) {
        return "ANY".equals(c.group())
                ? (c.advanced() ? " (ADV)" : "")
                : " (G" + c.group() + (c.advanced() ? " ADV" : "") + ")";
    }

    private CardSuggestionDto toSuggestion(String displayName, Card card) {
        if (card instanceof CryptCard c) {
            return new CardSuggestionDto(
                    c.id(), displayName, true,
                    c.group(),
                    c.type().name().charAt(0) + c.type().name().substring(1).toLowerCase(),
                    List.of(),
                    c.banned()
            );
        }
        LibraryCard l = (LibraryCard) card;
        return new CardSuggestionDto(
                l.id(), displayName, false,
                null, null,
                l.types(),
                l.banned()
        );
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
                    orDisciplines = List.of();
                } else if (!rawDisc.isEmpty()) {
                    andDisciplines = List.of();
                    orDisciplines = splitOn(rawDisc, "/").stream().map(this::disciplineToCode).toList();
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
                : " (" + "G" + group + (advanced ? " ADV" : "") + ")";

        Stream.concat(
                Stream.of(card.name(), StringUtils.stripAccents(card.name())),
                card.aka().stream().flatMap(a -> Stream.of(a, StringUtils.stripAccents(a)))
        ).map(String::trim).filter(StringUtils::isNotBlank).distinct().forEach(nameVariant -> {
            lookupMap.put(nameVariant + suffix, card);
            lookupMap.put(replaceArticle(nameVariant) + suffix, card);
        });
    }

    private void indexLibraryCard(LibraryCard card) {
        Stream.concat(
                Stream.of(card.name(), StringUtils.stripAccents(card.name())),
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

    /** Converts a full discipline name from the CSV to its short code. Falls back to lowercase original if unknown. */
    private String disciplineToCode(String name) {
        return DISC_NAME_TO_CODE.getOrDefault(name.trim().toLowerCase(), name.trim().toLowerCase());
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