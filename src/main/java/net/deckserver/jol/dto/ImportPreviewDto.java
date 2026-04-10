package net.deckserver.jol.dto;

import io.quarkus.runtime.annotations.RegisterForReflection;

import java.util.List;

/**
 * Response from POST /cards/preview.
 * format   — detected input format: "krcg" or "jol".
 * deckName — deck name extracted from KRCG JSON if present, null for JOL.
 * resolved — successfully matched cards with their counts.
 * errors   — lines or IDs that could not be resolved, with a human-readable reason.
 */
@RegisterForReflection
public record ImportPreviewDto(
        String format,
        String deckName,
        List<ResolvedEntry> resolved,
        List<ParseError> errors
) {
    @RegisterForReflection
    public record ResolvedEntry(int count, CardDetailDto card) {}

    @RegisterForReflection
    public record ParseError(String line, String reason) {}
}
