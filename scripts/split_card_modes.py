#!/usr/bin/env python3
"""
Split vteslib.csv library cards by declaration mode.

Each VTES library card may have multiple ways to play it (declaration modes),
determined by discipline costs and type qualifiers in the card text. This script
produces:
  - csv/modes/vteslib_modes.csv  : one row per mode per card
  - csv/modes/vteslib_index.csv  : one row per original card with mode summary
"""

import csv
import re
import sys
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

ROOT = Path(__file__).parent.parent
INPUT_CSV = ROOT / "csv" / "vteslib.csv"
OUTPUT_DIR = ROOT / "csv" / "modes"
MODES_CSV = OUTPUT_DIR / "vteslib_modes.csv"
INDEX_CSV = OUTPUT_DIR / "vteslib_index.csv"

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# Bracket contents that identify a card-type qualifier rather than a discipline
TYPE_QUALIFIERS = frozenset({
    "ACTION MODIFIER", "REACTION", "COMBAT", "ACTION", "REFLEX"
})

# Discipline code: 2–6 alpha characters
# Covers real disc codes (abo, ani, aus … 3-4 chars) and FLIGHT (6 chars).
DISC_CODE_RE = re.compile(r"^[a-zA-Z]{2,6}$")

# "As above", "As [xxx] above", or "As [xxx][yyy] above"
AS_ABOVE_RE = re.compile(
    r"As (?:\[([a-zA-Z]{2,6})\](?:\[([a-zA-Z]{2,6})\])? )?above",
    re.IGNORECASE,
)

MODES_FIELDNAMES = [
    "CardId", "ModeId", "Name", "DeclaredType",
    "DisciplineRequirement", "CardText",
]

INDEX_FIELDNAMES = [
    "CardId", "Name", "OriginalType", "ModeCount", "ModeIds",
]

TYPE_QUALIFIER_MAP = {
    "ACTION MODIFIER": "Action Modifier",
    "REACTION": "Reaction",
    "COMBAT": "Combat",
    "ACTION": "Action",
    "REFLEX": "Reflex",
}

# Maps DeclaredType label → CardType enum name (object name, not label)
LABEL_TO_ENUM = {
    "Action": "ACTION",
    "Action Modifier": "MODIFIER",
    "Reaction": "REACTION",
    "Combat": "COMBAT",
    "Ally": "ALLY",
    "Retainer": "RETAINER",
    "Political Action": "POLITICAL",
    "Equipment": "EQUIPMENT",
    "Event": "EVENT",
    "Location": "LOCATION",
    "Master": "MASTER",
    "Conviction": "CONVICTION",
    "Power": "POWER",
    "Vampire": "VAMPIRE",
    "Imbued": "IMBUED",
    "Reflex": "REFLEX",
}


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

@dataclass
class RawMode:
    disc_codes: list
    type_codes: list
    effect_text: str          # raw (before "as above" expansion)
    resolved_effect: str = ""
    auto: bool = True
    preamble: list = field(default_factory=list)
    postamble: list = field(default_factory=list)


@dataclass
class ModeRecord:
    CardId: str
    ModeId: str
    Name: str
    OriginalType: str
    DeclaredType: str
    DisciplineRequirement: str
    Level: str
    CardText: str
    Auto: str


# ---------------------------------------------------------------------------
# Bracket header parsing
# ---------------------------------------------------------------------------

def parse_mode_line_header(line: str):
    """
    Parse leading bracket tokens from a card text line.

    Returns (disc_codes, type_codes, effect_text) if the line starts with
    one or more recognised bracket tokens, or None if it is not a mode line.

    Classification rules for bracket content `code`:
      - code in TYPE_QUALIFIERS              → type_code
      - code matches DISC_CODE_RE            → disc_code (inferior=lower, superior=upper)
      - code contains digit/space or is long → STOP; rest of line is effect text
    """
    if not line.startswith("["):
        return None

    disc_codes = []
    type_codes = []
    pos = 0
    n = len(line)

    while pos < n and line[pos] == "[":
        end = line.find("]", pos + 1)
        if end == -1:
            break
        code = line[pos + 1 : end]

        if code in TYPE_QUALIFIERS:
            type_codes.append(code)
        elif DISC_CODE_RE.match(code):
            if type_codes:
                # A disc bracket appearing after a type bracket is part of effect text
                break
            disc_codes.append(code)
        else:
            # Unknown bracket (digit, space, long text like "POLITICAL ACTION") → stop
            break

        pos = end + 1
        # Skip a single space between adjacent brackets (e.g., "[aus] [REACTION]")
        if pos < n and line[pos] == " " and pos + 1 < n and line[pos + 1] == "[":
            pos += 1

    if not disc_codes and not type_codes:
        return None

    effect_text = line[pos:].lstrip()
    return disc_codes, type_codes, effect_text


def parse_mode_line_headers(line: str):
    """
    Parse one or more declaration headers from a mode line.

    Some cards use alternate discipline syntax:
      [pot] or [pre] Effect text.

    That means the same effect can be declared with either discipline, so the
    line should produce one mode per alternative rather than treating the
    second bracket as ordinary effect text.
    """
    first_header = parse_mode_line_header(line)
    if first_header is None:
        return None

    disc_codes, type_codes, effect_text = first_header
    headers = [(disc_codes, type_codes, effect_text)]

    while effect_text.startswith("or ["):
        alt_header = parse_mode_line_header(effect_text[3:])
        if alt_header is None:
            break

        alt_disc_codes, alt_type_codes, alt_effect_text = alt_header
        headers.append((alt_disc_codes, alt_type_codes, alt_effect_text))
        effect_text = alt_effect_text

    if len(headers) == 1:
        return headers

    shared_effect_text = headers[-1][2]
    return [
        (alt_disc_codes, alt_type_codes, shared_effect_text)
        for alt_disc_codes, alt_type_codes, _ in headers
    ]


def compute_level(disc_codes: list) -> str:
    """Determine inferior/superior/mixed/none from the discipline codes."""
    if not disc_codes:
        return "none"
    lowers = [c.islower() for c in disc_codes]
    if all(lowers):
        return "inferior"
    if not any(lowers):
        return "superior"
    return "mixed"


def make_disc_key(disc_codes: list, type_codes: list) -> str:
    """Build the unique string key for a mode (used in ModeId and resolved_store)."""
    if disc_codes:
        return "+".join(disc_codes)
    if type_codes:
        return "+".join(type_codes)
    return "none"


def make_inferior_disc_key(disc_codes: list) -> str:
    """Build the discipline key for the matching inferior level."""
    return "+".join(c.lower() for c in disc_codes)


def compute_declared_type(type_codes: list, original_type: str) -> str:
    """
    Return the DeclaredType for a mode.
    For multi-type cards with explicit type qualifiers, derive from those qualifiers.
    Otherwise use OriginalType (single-type cards are always unambiguous).
    """
    if not type_codes:
        return original_type
    return "/".join(TYPE_QUALIFIER_MAP.get(t, t) for t in type_codes)


def is_auto(type_codes: list, original_type: str) -> bool:
    """
    A mode is automatically parseable if:
      - the card has a single OriginalType (never ambiguous), OR
      - the mode line carries explicit type qualifier brackets.
    """
    if "/" not in original_type:
        return True
    return bool(type_codes)


def declared_type_to_enum(declared_type: str) -> str:
    """
    Convert a DeclaredType label to CardType enum name(s) for use in ModeId.
    Compound types (e.g., "Action Modifier/Reaction") join with "+".
      "Action Modifier"          → "MODIFIER"
      "Combat/Reaction"          → "COMBAT+REACTION"
      "Action Modifier/Reaction" → "MODIFIER+REACTION"
    """
    parts = [t.strip() for t in declared_type.split("/")]
    return "+".join(LABEL_TO_ENUM.get(p, p.upper().replace(" ", "_")) for p in parts)


# ---------------------------------------------------------------------------
# Card parsing
# ---------------------------------------------------------------------------

def parse_card(row: dict) -> list:
    """
    Parse a vteslib CSV row into a list of RawMode objects.
    Handles preamble (lines before the first mode line) and postamble
    (lines after the last mode line).
    """
    text = row["Card Text"].strip()
    original_type = row["Type"].strip()

    if not text:
        return [RawMode(disc_codes=[], type_codes=[], effect_text="")]

    lines = [ln.strip() for ln in text.split("\n") if ln.strip()]

    # Identify which lines are mode lines and parse their headers
    mode_line_indices = []
    parsed_headers = {}
    for i, line in enumerate(lines):
        headers = parse_mode_line_headers(line)
        if headers is not None:
            mode_line_indices.append(i)
            parsed_headers[i] = headers

    # No mode lines → single mode carrying the full text
    if not mode_line_indices:
        return [RawMode(
            disc_codes=[], type_codes=[], effect_text="\n".join(lines),
            preamble=[], postamble=[],
        )]

    first_idx = mode_line_indices[0]
    last_idx = mode_line_indices[-1]
    preamble = lines[:first_idx]
    postamble = lines[last_idx + 1:]

    modes = []
    for i in mode_line_indices:
        for disc_codes, type_codes, effect_text in parsed_headers[i]:
            modes.append(RawMode(
                disc_codes=disc_codes,
                type_codes=type_codes,
                effect_text=effect_text,
                preamble=preamble,
                postamble=postamble,
                auto=is_auto(type_codes, original_type),
            ))

    return modes


# ---------------------------------------------------------------------------
# "As above" resolution
# ---------------------------------------------------------------------------

def resolve_as_above(raw_modes: list) -> list:
    """
    Expand "As above" and "As [xxx] above" references in mode effect texts.
    Processes modes in order, maintaining a resolved_store so chains work
    (e.g., [tha] → [vis] → [VIS]).
    Sets resolved_effect on each mode in-place.
    """
    resolved_store: dict = {}  # disc_key → fully resolved effect text

    for mode in raw_modes:
        disc_key = make_disc_key(mode.disc_codes, mode.type_codes)
        effect = mode.effect_text

        match = AS_ABOVE_RE.search(effect)
        if match:
            ref1 = match.group(1)  # e.g. 'tha', or None for plain "As above"
            ref2 = match.group(2)  # e.g. 'qui', or None

            if ref1 is None:
                # Plain "As above" normally means the matching inferior mode.
                # Fall back to the immediately preceding mode for older syntax
                # where the relationship is not discipline-keyed.
                inferior_key = make_inferior_disc_key(mode.disc_codes)
                if mode.disc_codes and inferior_key in resolved_store:
                    ref_key = inferior_key
                elif resolved_store:
                    ref_key = next(reversed(resolved_store))
                else:
                    print(
                        f"  WARNING: 'As above' found but resolved_store is empty "
                        f"(key={disc_key})",
                        file=sys.stderr,
                    )
                    mode.auto = False
                    mode.resolved_effect = effect
                    resolved_store[disc_key] = effect
                    continue
            elif ref2:
                ref_key = f"{ref1}+{ref2}"
            else:
                ref_key = ref1

            if ref_key in resolved_store:
                # Strip trailing period from the base text, then append suffix
                base = resolved_store[ref_key].rstrip(".")
                suffix = effect[match.end():]
                resolved_effect = base + suffix
            else:
                print(
                    f"  WARNING: 'As above' references '{ref_key}' not in store "
                    f"(key={disc_key})",
                    file=sys.stderr,
                )
                resolved_effect = effect
                mode.auto = False
        else:
            resolved_effect = effect

        mode.resolved_effect = resolved_effect
        resolved_store[disc_key] = resolved_effect

    return raw_modes


# ---------------------------------------------------------------------------
# Text cleanup
# ---------------------------------------------------------------------------

def strip_curly_braces(text: str) -> str:
    """Strip {…} errata markers, keeping inner text."""
    return re.sub(r"\{([^}]*)\}", r"\1", text)


# ---------------------------------------------------------------------------
# Build ModeRecord list
# ---------------------------------------------------------------------------

def build_mode_records(row: dict, resolved_modes: list) -> list:
    """
    Convert resolved RawMode list into ModeRecord list.

    ModeId format: {CardId}:{TYPE_ENUM}  or  {CardId}:{TYPE_ENUM}:{disc_cost}
    TYPE_ENUM is the CardType enum object name (e.g. MODIFIER, not "Action Modifier").

    For multi-type cards whose mode lines carry no type qualifier, duplicate
    the mode once per component type and mark all copies Auto='no'.

    Collisions (same type+disc on one card) are disambiguated with :1 :2 suffixes.
    """
    card_id = row["Id"]
    name = row["Name"]
    original_type = row["Type"].strip()

    # Step 1: expand modes (including multi-type duplicates) into flat tuples
    # Each tuple: (declared_type_label, disc_cost, level, card_text, auto_flag)
    expanded = []
    for mode in resolved_modes:
        disc_req = "+".join(mode.disc_codes) if mode.disc_codes else ""
        level = compute_level(mode.disc_codes)
        declared_type = compute_declared_type(mode.type_codes, original_type)
        auto_flag = "yes" if mode.auto else "no"

        parts = []
        if mode.preamble:
            parts.append("\n".join(mode.preamble))
        effect = mode.resolved_effect if mode.resolved_effect else mode.effect_text
        if effect:
            parts.append(effect)
        if mode.postamble:
            parts.append("\n".join(mode.postamble))
        card_text = strip_curly_braces("\n".join(parts))

        if len(mode.type_codes) > 1:
            # Compound type qualifier on mode line: one row per individual type
            for tc in mode.type_codes:
                single_dt = TYPE_QUALIFIER_MAP.get(tc, tc)
                expanded.append((single_dt, disc_req, level, card_text, auto_flag))
        elif "/" in original_type and not mode.type_codes:
            # Ambiguous multi-type card, no qualifier present: duplicate per component, Auto=no
            for ct in [t.strip() for t in original_type.split("/")]:
                expanded.append((ct, disc_req, level, card_text, "no"))
        else:
            expanded.append((declared_type, disc_req, level, card_text, auto_flag))

    # Step 2: compute base keys and detect collisions across all expanded rows
    # Base key = "{TYPE_ENUM}:{disc_cost}" or just "{TYPE_ENUM}" when no disc
    def base_key(dt: str, dr: str) -> str:
        enum_name = declared_type_to_enum(dt)
        return f"{enum_name}:{dr}" if dr else enum_name

    base_keys = [base_key(dt, dr) for dt, dr, _, _, _ in expanded]
    key_counts = Counter(base_keys)
    key_seen: dict = {}

    # Step 3: build ModeRecords with unique ModeIds
    records = []
    for (dt, dr, level, card_text, auto), bk in zip(expanded, base_keys):
        if key_counts[bk] > 1:
            key_seen[bk] = key_seen.get(bk, 0) + 1
            mode_id = f"{card_id}:{bk}:{key_seen[bk]}"
        else:
            mode_id = f"{card_id}:{bk}"

        records.append(ModeRecord(
            CardId=card_id,
            ModeId=mode_id,
            Name=name,
            OriginalType=original_type,
            DeclaredType=dt,
            DisciplineRequirement=dr,
            Level=level,
            CardText=card_text,
            Auto=auto,
        ))

    return records


# ---------------------------------------------------------------------------
# I/O
# ---------------------------------------------------------------------------

def load_csv(path: Path) -> list:
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def write_modes_csv(records: list, path: Path) -> None:
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=MODES_FIELDNAMES, lineterminator="\r\n")
        writer.writeheader()
        for r in records:
            writer.writerow({
                "CardId": r.CardId,
                "ModeId": r.ModeId,
                "Name": r.Name,
                "DeclaredType": r.DeclaredType,
                "DisciplineRequirement": r.DisciplineRequirement,
                "CardText": r.CardText.replace("\n", "\r\n"),
            })


def write_index_csv(records_by_card: dict, path: Path) -> None:
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=INDEX_FIELDNAMES, lineterminator="\r\n")
        writer.writeheader()
        for card_id, recs in records_by_card.items():
            writer.writerow({
                "CardId": card_id,
                "Name": recs[0].Name,
                "OriginalType": recs[0].OriginalType,
                "ModeCount": len(recs),
                "ModeIds": "|".join(r.ModeId for r in recs),
            })


# ---------------------------------------------------------------------------
# Verification
# ---------------------------------------------------------------------------

def verify(all_records: list, records_by_card: dict) -> None:
    """Quick sanity checks on the output."""
    errors = 0

    # ModeId uniqueness
    all_ids = [r.ModeId for r in all_records]
    if len(set(all_ids)) != len(all_ids):
        dupes = [k for k, v in Counter(all_ids).items() if v > 1]
        print(f"  ERROR: {len(dupes)} duplicate ModeIds: {dupes[:5]}", file=sys.stderr)
        errors += 1

    # All index ModeIds exist in modes CSV
    modes_id_set = set(all_ids)
    for card_id, recs in records_by_card.items():
        for r in recs:
            if r.ModeId not in modes_id_set:
                print(f"  ERROR: index ModeId not in modes: {r.ModeId}", file=sys.stderr)
                errors += 1

    if errors == 0:
        print("  Verification passed.")
    else:
        print(f"  Verification found {errors} error(s).", file=sys.stderr)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Loading {INPUT_CSV} …")
    rows = load_csv(INPUT_CSV)
    print(f"  {len(rows)} cards loaded")

    all_records: list = []
    auto_no_cards: list = []

    for row in rows:
        raw_modes = parse_card(row)
        resolved_modes = resolve_as_above(raw_modes)
        records = build_mode_records(row, resolved_modes)
        all_records.extend(records)

        card_has_auto_no = any(r.Auto == "no" for r in records)
        if card_has_auto_no:
            auto_no_cards.append(f"  {row['Id']:>6}  {row['Name']} ({row['Type']})")

    write_modes_csv(all_records, MODES_CSV)
    print(f"Wrote {len(all_records)} mode rows to {MODES_CSV}")

    records_by_card: dict = {}
    for r in all_records:
        records_by_card.setdefault(r.CardId, []).append(r)

    write_index_csv(records_by_card, INDEX_CSV)
    print(f"Wrote {len(records_by_card)} index rows to {INDEX_CSV}")

    auto_no_count = len(auto_no_cards)
    print(f"\nSummary: {len(all_records)} modes total | Needs review: {auto_no_count} cards")

    print("\nRunning verification …")
    verify(all_records, records_by_card)

    if auto_no_cards:
        print(f"\nCards needing review ({auto_no_count} cards):")
        for line in auto_no_cards:
            print(line)


if __name__ == "__main__":
    main()
