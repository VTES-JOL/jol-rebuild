package net.deckserver.jol.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import net.deckserver.jol.dto.CardDetailDto;
import net.deckserver.jol.dto.ImportPreviewDto;
import net.deckserver.jol.model.Card;
import net.deckserver.jol.model.krcg.*;
import org.apache.commons.lang3.StringUtils;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Deck import parsing (KRCG JSON and JOL text formats) and KRCG content building.
 * Depends on {@link CardRegistry} for raw card lookups and {@link CardSearchService}
 * for DTO projection.
 */
@ApplicationScoped
public class DeckImportService {

    private static final Pattern JOL_LINE = Pattern.compile("^(?:(\\d+)\\s*[xX]?\\s*)?(.+)$");

    @Inject
    CardRegistry registry;

    @Inject
    CardSearchService cardSearchService;

    @Inject
    ObjectMapper mapper;

    /**
     * Auto-detects format (KRCG JSON vs JOL text) and returns a preview of what
     * would be imported, including any parse/resolution errors.
     */
    public ImportPreviewDto preview(String text) {
        String trimmed = text == null ? "" : text.strip();
        return trimmed.startsWith("{") ? previewKrcg(trimmed) : previewJol(trimmed);
    }

    /**
     * Builds a typed {@link KrcgDeck} from an ordered card-id → count mapping.
     * Crypt cards are placed in a flat list; library cards are grouped by type key.
     */
    public KrcgDeck buildKrcgContents(Map<String, Integer> cardCounts) {
        Map<String, CardDetailDto> detailMap = cardSearchService
                .findDetailsByIds(new ArrayList<>(cardCounts.keySet()))
                .stream().collect(Collectors.toMap(CardDetailDto::id, d -> d));

        List<KrcgCard> cryptCards = new ArrayList<>();
        Map<String, List<KrcgCard>> libGroups = new LinkedHashMap<>();

        for (Map.Entry<String, Integer> entry : cardCounts.entrySet()) {
            CardDetailDto detail = detailMap.get(entry.getKey());
            if (detail == null) continue;
            KrcgCard card = new KrcgCard(entry.getKey(), entry.getValue(), detail.name());
            if (detail.crypt()) {
                cryptCards.add(card);
            } else {
                String typeKey = detail.types().stream().sorted().collect(Collectors.joining("/"));
                libGroups.computeIfAbsent(typeKey, k -> new ArrayList<>()).add(card);
            }
        }

        List<KrcgLibraryGroup> libraryGroups = libGroups.entrySet().stream()
                .map(e -> {
                    int count = e.getValue().stream().mapToInt(KrcgCard::count).sum();
                    return new KrcgLibraryGroup(e.getKey(), count, e.getValue());
                })
                .toList();

        int cryptCount = cryptCards.stream().mapToInt(KrcgCard::count).sum();
        int libCount   = libraryGroups.stream().mapToInt(KrcgLibraryGroup::count).sum();

        return new KrcgDeck(null, null, new KrcgCrypt(cryptCount, cryptCards), new KrcgLibrary(libCount, libraryGroups));
    }

    // ── Format-specific parsers ───────────────────────────────────────────────

    private ImportPreviewDto previewKrcg(String text) {
        List<ImportPreviewDto.ResolvedEntry> resolved = new ArrayList<>();
        List<ImportPreviewDto.ParseError>   errors   = new ArrayList<>();
        String deckName        = null;
        String deckDescription = null;

        try {
            JsonNode root = mapper.readTree(text);

            // KRCG tournament exports: top-level "name" and "comments" fields.
            // Internal meta object (our own format): "meta.name" / "meta.description".
            deckName = root.path("name").asText(null);
            if (deckName == null) deckName = root.path("meta").path("name").asText(null);

            String rawComments = root.path("comments").asText(null);
            if (rawComments == null) rawComments = root.path("meta").path("description").asText(null);
            if (rawComments != null) {
                deckDescription = rawComments.strip();
            }

            for (JsonNode card : root.path("crypt").path("cards")) {
                resolveKrcgCard(card, resolved, errors);
            }
            for (JsonNode group : root.path("library").path("cards")) {
                for (JsonNode card : group.path("cards")) {
                    resolveKrcgCard(card, resolved, errors);
                }
            }
        } catch (JsonProcessingException e) {
            errors.add(new ImportPreviewDto.ParseError(
                    text.length() > 60 ? text.substring(0, 60) + "…" : text,
                    "Invalid JSON: " + e.getMessage()));
        }

        return new ImportPreviewDto("krcg", deckName, deckDescription, resolved, errors);
    }

    private void resolveKrcgCard(JsonNode card, List<ImportPreviewDto.ResolvedEntry> resolved,
                                  List<ImportPreviewDto.ParseError> errors) {
        String id    = card.path("id").asText(null);
        int    count = card.path("count").asInt(1);
        if (id == null) {
            errors.add(new ImportPreviewDto.ParseError(card.toString(), "Missing card id"));
            return;
        }
        Card found = registry.findById(id);
        if (found == null) {
            errors.add(new ImportPreviewDto.ParseError(id, "Unknown card id: " + id));
            return;
        }
        resolved.add(new ImportPreviewDto.ResolvedEntry(count, cardSearchService.toDetailDto(found)));
    }

    private ImportPreviewDto previewJol(String text) {
        List<ImportPreviewDto.ResolvedEntry> resolved = new ArrayList<>();
        List<ImportPreviewDto.ParseError>   errors   = new ArrayList<>();

        for (String rawLine : text.split("\n")) {
            String line = rawLine.strip();
            if (line.isEmpty() || line.startsWith("//") || line.startsWith("#")) continue;

            Matcher m = JOL_LINE.matcher(line);
            if (!m.matches()) continue;
            int    count = m.group(1) != null ? Integer.parseInt(m.group(1)) : 1;
            String name  = m.group(2).strip();
            Card   found = registry.findByNormalizedName(StringUtils.stripAccents(name).toLowerCase());

            if (found == null) {
                errors.add(new ImportPreviewDto.ParseError(rawLine, "Card not found: " + name));
            } else {
                resolved.add(new ImportPreviewDto.ResolvedEntry(count, cardSearchService.toDetailDto(found)));
            }
        }

        return new ImportPreviewDto("jol", null, null, resolved, errors);
    }
}
