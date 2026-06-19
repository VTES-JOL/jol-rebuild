#!/usr/bin/env python3
"""
Extract unique mechanic text blocks from resolved VTES library card modes.

Input:
  - csv/modes/vteslib_modes.csv

Output:
  - csv/modes/vteslib_mechanic_blocks.csv

The mode splitter resolves declaration-mode text first. This script then treats
each non-empty CardText line as a mechanical block, deduplicates exact normalized
blocks, sorts them, and records traceability examples for DSL modelling work.
"""

import csv
import re
from collections import Counter, defaultdict
from pathlib import Path


ROOT = Path(__file__).parent.parent
INPUT_CSV = ROOT / "csv" / "modes" / "vteslib_modes.csv"
OUTPUT_CSV = ROOT / "csv" / "modes" / "vteslib_mechanic_blocks.csv"

FIELDNAMES = [
    "BlockText",
    "OccurrenceCount",
    "ModeCount",
    "CardCount",
    "ExampleModeIds",
    "ExampleCards",
]

MAX_EXAMPLES = 8


def normalize_block(text: str) -> str:
    """Normalize whitespace inside a card-text block without changing wording."""
    return re.sub(r"\s+", " ", text).strip()


def split_blocks(card_text: str) -> list[str]:
    """Split resolved mode CardText into non-empty newline-separated blocks."""
    return [
        block
        for line in (card_text or "").splitlines()
        if (block := normalize_block(line))
    ]


def sorted_unique(values) -> list[str]:
    return sorted(set(values), key=lambda value: value.casefold())


def load_rows(path: Path) -> list[dict]:
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def build_block_rows(mode_rows: list[dict]) -> list[dict]:
    occurrences = Counter()
    mode_ids_by_block = defaultdict(list)
    card_ids_by_block = defaultdict(list)
    names_by_block = defaultdict(list)

    for row in mode_rows:
        for block in split_blocks(row["CardText"]):
            occurrences[block] += 1
            mode_ids_by_block[block].append(row["ModeId"])
            card_ids_by_block[block].append(row["CardId"])
            names_by_block[block].append(row["Name"])

    block_rows = []
    for block in sorted(occurrences, key=lambda value: value.casefold()):
        example_mode_ids = sorted_unique(mode_ids_by_block[block])[:MAX_EXAMPLES]
        example_cards = sorted_unique(names_by_block[block])[:MAX_EXAMPLES]
        block_rows.append({
            "BlockText": block,
            "OccurrenceCount": occurrences[block],
            "ModeCount": len(set(mode_ids_by_block[block])),
            "CardCount": len(set(card_ids_by_block[block])),
            "ExampleModeIds": "|".join(example_mode_ids),
            "ExampleCards": "|".join(example_cards),
        })

    return block_rows


def write_block_rows(rows: list[dict], path: Path) -> None:
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES, lineterminator="\r\n")
        writer.writeheader()
        writer.writerows(rows)


def verify(mode_rows: list[dict], block_rows: list[dict]) -> None:
    mode_blocks = sum(len(split_blocks(row["CardText"])) for row in mode_rows)
    output_occurrences = sum(int(row["OccurrenceCount"]) for row in block_rows)
    if mode_blocks != output_occurrences:
        raise RuntimeError(
            f"Block occurrence mismatch: modes={mode_blocks}, output={output_occurrences}"
        )

    block_texts = [row["BlockText"] for row in block_rows]
    if len(block_texts) != len(set(block_texts)):
        raise RuntimeError("Duplicate BlockText values in output")


def main() -> None:
    print(f"Loading {INPUT_CSV} ...")
    mode_rows = load_rows(INPUT_CSV)
    print(f"  {len(mode_rows)} modes loaded")

    block_rows = build_block_rows(mode_rows)
    verify(mode_rows, block_rows)
    write_block_rows(block_rows, OUTPUT_CSV)

    occurrence_count = sum(int(row["OccurrenceCount"]) for row in block_rows)
    print(f"Wrote {OUTPUT_CSV}")
    print(f"  {len(block_rows)} unique blocks")
    print(f"  {occurrence_count} total block occurrences")


if __name__ == "__main__":
    main()
