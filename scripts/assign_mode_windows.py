#!/usr/bin/env python3
"""
Assign gameplay timing windows to split VTES card modes.

Input:
  - csv/modes/vteslib_modes.csv

Output:
  - csv/modes/vteslib_modes_window_audit.csv

This is an audit generator, not a rules oracle. It uses explicit card-text
phrases and DeclaredType to assign one or more implementation timing windows,
then marks each row high/medium/low confidence so unclear cases can drive
rules and implementation clarification.
"""

import csv
import re
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).parent.parent
INPUT_CSV = ROOT / "csv" / "modes" / "vteslib_modes.csv"
OUTPUT_CSV = ROOT / "csv" / "modes" / "vteslib_modes_window_audit.csv"

AUDIT_FIELDNAMES = [
    "AssignedWindows",
    "AssignmentConfidence",
    "AssignmentReason",
    "ReviewNotes",
]


def has(text: str, *patterns: str) -> bool:
    return any(re.search(pattern, text, re.IGNORECASE | re.DOTALL) for pattern in patterns)


def confidence_rank(confidence: str) -> int:
    return {"low": 0, "medium": 1, "high": 2}[confidence]


def lower_confidence(current: str, candidate: str) -> str:
    return candidate if confidence_rank(candidate) < confidence_rank(current) else current


def raise_confidence(current: str, candidate: str) -> str:
    return candidate if confidence_rank(candidate) > confidence_rank(current) else current


def assign_windows(row: dict) -> tuple[list[str], str, str, str]:
    text = (row["CardText"] or "").strip()
    declared_type = row["DeclaredType"]
    windows: list[str] = []
    reasons: list[str] = []
    notes: list[str] = []
    confidence = "medium"

    def add(window: str, reason: str) -> None:
        if window not in windows:
            windows.append(window)
        if reason not in reasons:
            reasons.append(reason)

    # Initial play / declaration window from mode type.
    if declared_type == "Master":
        if has(
            text,
            r"out-of-turn",
            r"as (?:it|a card|the card) is played",
            r"cancel .* as .*played",
        ):
            add("CARD_AS_PLAYED", "master out-of-turn/as-played text")
            notes.append("CARD_AS_PLAYED is nested inside the enclosing workflow window.")
        else:
            add("MASTER_PHASE", "master card initial play")
        confidence = "high"
    elif declared_type == "Event":
        add("DISCARD_PHASE_EVENT", "event initial play")
        confidence = "high"
    elif declared_type in {"Equipment", "Ally", "Retainer"}:
        add("MINION_PHASE_DECLARE_ACTION", f"{declared_type} initial action")
        confidence = "high"
    elif declared_type in {"Action", "Political Action"}:
        add("MINION_PHASE_DECLARE_ACTION", f"{declared_type} initial action")
        confidence = "high"
        if declared_type == "Political Action":
            add("REFERENDUM_CHOOSE_TERMS", "successful political action opens referendum")
    elif declared_type in {"Conviction", "Power"}:
        add(
            "READY_UNLOCK_PHASE_OR_CARD_TEXT",
            f"{declared_type} timing not fully covered by current taxonomy",
        )
        confidence = "low"

    # Generic as-played cancellers, regardless of type.
    if has(text, r"cancel .* as (?:it|they|the card) is played|as it is played"):
        add("CARD_AS_PLAYED", "explicit as-played canceller")
        notes.append("CARD_AS_PLAYED is nested inside the enclosing workflow window.")
        if confidence != "low":
            confidence = "medium"

    # Action timing.
    if has(
        text,
        r"as (?:the|this|an|a) action is announced",
        r"only usable as the action is announced",
        r"when .* announces? (?:an|a|the) action",
        r"cancel .*action .* announced",
    ):
        add("ACTION_AS_ANNOUNCED", "explicit action-announcement timing")
        confidence = raise_confidence(confidence, "high")

    if declared_type == "Action Modifier" or has(
        text,
        r"only usable (?:during|on) (?:a|an|the) "
        r"(?:bleed|hunt|political|undirected|directed|equip|employ|recruit|action)",
    ):
        add("ACTION_DURING_ACTION", "action modifier/action-in-progress timing")
        if has(text, r"\bbleed\b|\bstealth\b|political action"):
            confidence = raise_confidence(confidence, "high")

    if has(text, r"stealth|intercept") and declared_type in {"Action Modifier", "Reaction", "Reflex"}:
        add("ACTION_STEALTH_INTERCEPT", "stealth/intercept modification")
        if has(
            text,
            r"\+\d+ stealth",
            r"\+\d+ intercept",
            r"gets? \+\d+ stealth",
            r"gets? \+\d+ intercept",
        ):
            confidence = raise_confidence(confidence, "high")

    if declared_type == "Reaction":
        if has(
            text,
            r"attempt(?:ing)? to block",
            r"attempts? to block",
            r"block attempt",
            r"may block",
            r"can block",
            r"eligible to block",
        ):
            add("ACTION_BLOCK_ATTEMPT", "block attempt/eligibility reaction")
            confidence = raise_confidence(confidence, "high")
        elif has(text, r"after blocks? (?:are|have been) declined", r"declines? to block", r"no blocks?"):
            add("ACTION_BLOCKS_DECLINED", "after blocks declined")
            confidence = raise_confidence(confidence, "high")
        elif has(text, r"redirect", r"choose another Methuselah", r"change the target of the bleed"):
            add("ACTION_BLOCKS_DECLINED", "bleed redirect/change target")
            confidence = raise_confidence(confidence, "high")
        elif has(
            text,
            r"reduce (?:a|the)? ?bleed",
            r"bleed against you",
            r"successfully bleeds you",
            r"bleed resolved",
        ):
            add("ACTION_DURING_ACTION", "bleed reduction/result reaction")
            notes.append(
                "Bleed reduction/result reactions need a narrower bleed-resolution window or explicit mapping guideline."
            )
            confidence = lower_confidence(confidence, "low")
        else:
            add("ACTION_DURING_ACTION", "reaction default action/blocking context")
            confidence = lower_confidence(confidence, "low")

    if has(
        text,
        r"after (?:this|the) action (?:is )?(?:resolves?|resolved|ends?|successful|succeeds)",
        r"after a successful action",
        r"after successful resolution",
        r"if this action is successful.*unlock",
        r"unlock .* after action",
    ):
        add("ACTION_AFTER_RESOLUTION", "explicit after-action timing")
        confidence = raise_confidence(confidence, "high")

    if has(
        text,
        r"when .* is blocked",
        r"after .* is blocked",
        r"if .* is blocked",
        r"before combat(?: begins)?",
        r"before block resolution",
        r"after block resolution",
        r"has blocked",
    ):
        add("ACTION_BLOCK_RESOLUTION_PRE_COMBAT", "blocked/block-resolution hook")
        notes.append("Before/after block resolution may need separate subwindows if card text differences matter.")
        if confidence != "low":
            confidence = "medium"

    # Referendum and blood hunt.
    if has(
        text,
        r"during (?:a|the) referendum",
        r"before votes? (?:and ballots )?(?:are )?cast",
        r"before .* votes? .*cast",
    ):
        add("REFERENDUM_BEFORE_VOTES", "referendum before-votes/general referendum timing")
        confidence = raise_confidence(confidence, "high")

    if has(
        text,
        r"during (?:the )?polling",
        r"gain[s]? \+?\d+ votes?",
        r"gets? \+?\d+ votes?",
        r"worth \+?\d+ votes?",
    ) and declared_type in {"Action Modifier", "Reaction", "Political Action", "Master", "Equipment"}:
        add("REFERENDUM_POLLING", "polling/vote modifier")
        confidence = raise_confidence(confidence, "high")

    if has(text, r"after .*referendum (?:passes|fails|is successful|resolves)", r"if .* referendum passes"):
        add("REFERENDUM_AFTER_RESOLUTION", "after referendum result")
        confidence = raise_confidence(confidence, "high")

    if has(text, r"blood hunt"):
        if has(text, r"votes?", r"ballots?", r"referendum"):
            add("BLOOD_HUNT_POLLING", "blood hunt voting text")
        if has(text, r"would be burned", r"not burned", r"avoid .*burned", r"burn .*diablerist"):
            add("BLOOD_HUNT_WOULD_BURN_DIABLERIST", "blood hunt burn replacement")
        if confidence == "low":
            confidence = "medium"

    # Combat.
    combat_matched = False

    def combat(window: str, reason: str, high: bool = True) -> None:
        nonlocal combat_matched, confidence
        add(window, reason)
        combat_matched = True
        if high:
            confidence = raise_confidence(confidence, "high")

    if has(text, r"before range is determined", r"before range"):
        combat("COMBAT_BEFORE_RANGE", "explicit before range")
    if has(text, r"\bmaneuver\b", r"\bmaneuvers\b", r"set the range", r"determine range"):
        combat("COMBAT_DETERMINE_RANGE", "maneuver/range")
    if has(text, r"before strikes? (?:are|is) (?:chosen|declared)", r"grapple"):
        combat("COMBAT_BEFORE_STRIKES", "before strikes/grapple")
    if has(
        text,
        r"\bstrike:",
        r"as (?:a|an) strike",
        r"ranged strike",
        r"hand strike",
        r"first strike",
        r"steal .*blood",
        r"strike damage",
    ):
        combat("COMBAT_STRIKE_DECLARATION", "strike declaration")
    if has(text, r"before strike resolution", r"before resolution of .*strike", r"before .*strike .*resolves"):
        combat("COMBAT_BEFORE_STRIKE_RESOLUTION", "before strike resolution")
    if has(text, r"prevent \d+ damage", r"prevent .*damage", r"damage prevention", r"armor"):
        combat("COMBAT_DAMAGE_PREVENTION", "damage prevention")
    if has(text, r"damage (?:is|are) resolved", r"take[s]? .*damage", r"inflict[s]? .*damage") and declared_type == "Combat":
        combat("COMBAT_DAMAGE_RESOLUTION", "damage resolution/result", high=False)
    if has(
        text,
        r"would (?:go to|be sent to) torpor",
        r"going (?:into|to) torpor",
        r"instead of (?:going|sending .*?) to torpor",
        r"should go to torpor",
        r"send .* to torpor",
    ):
        combat("COMBAT_WOULD_GO_TO_TORPOR", "torpor replacement/result")
    if has(text, r"would be burned", r"about to be burned", r"instead of being burned", r"burned in combat", r"being burned"):
        combat("COMBAT_WOULD_BE_BURNED", "burn replacement/result")
    if has(text, r"additional strike", r"additional strikes"):
        combat("COMBAT_ADDITIONAL_STRIKE", "additional strikes")
    if has(text, r"\bpress\b", r"press,", r"press to (?:continue|end)", r"continue combat", r"end combat"):
        combat("COMBAT_PRESS_STEP", "press/end combat")
    if has(text, r"end of (?:the )?round", r"at the end of (?:a|the) round"):
        combat("COMBAT_END_OF_ROUND", "end of round")
    if has(text, r"combat ends", r"after combat ends", r"ends combat", r"after combat"):
        if has(text, r"after combat"):
            combat("COMBAT_AFTER_ENDS", "after combat")
        else:
            combat("COMBAT_WOULD_END", "combat ends")

    if declared_type == "Combat" and not combat_matched:
        add("COMBAT_GENERAL", "combat card but no specific current window matched")
        notes.append(
            "Combat text needs a narrower rule: e.g. damage-type modifiers, as-played cancellation, "
            "or standing effects for remainder of combat."
        )
        confidence = "low"

    # Diablerie.
    if has(text, r"diableri[sz]"):
        if has(text, r"being diableri[sz]ed", r"would be diableri[sz]ed", r"cancel .*diableri"):
            add("DIABLERIE_CANCEL_OR_REPLACE", "diablerie cancel/replacement")
        elif has(text, r"after .*diableri", r"successful diableri"):
            add("DIABLERIE_AFTER_SUCCESS", "after diablerie")
        else:
            add("DIABLERIE_CANCEL_OR_REPLACE", "diablerie attempt/cancel-replacement timing")
        if confidence == "low":
            confidence = "medium"

    # Permanent-granted or ongoing windows.
    if declared_type in {"Equipment", "Retainer", "Ally", "Action", "Master", "Event"}:
        if has(text, r"\bstrike:"):
            add("COMBAT_STRIKE_DECLARATION", "permanent grants strike")
        if has(text, r"with .*maneuver", r"optional maneuver", r"maneuver each combat"):
            add("COMBAT_DETERMINE_RANGE", "permanent grants maneuver")
        if has(text, r"with .*press", r"optional press", r"press each combat"):
            add("COMBAT_PRESS_STEP", "permanent grants press")
        if has(text, r"during your unlock phase", r"unlock phase"):
            add("UNLOCK_PHASE", "unlock phase ongoing effect")
        if has(text, r"during your master phase", r"master phase"):
            add("MASTER_PHASE", "master phase ongoing effect")
        if has(text, r"during your discard phase", r"discard phase"):
            add("DISCARD_PHASE", "discard phase ongoing effect")
        if has(text, r"during your minion phase", r"during .* minion phase"):
            add("MINION_PHASE", "minion phase ongoing effect")

    if not windows:
        add("UNASSIGNED", "no timing phrase matched")
        notes.append("No current heuristic matched; needs manual review.")
        confidence = "low"

    if len(windows) > 3 and confidence == "high":
        confidence = "medium"
        notes.append("Multiple windows assigned; verify whether initial and generated abilities should be split further.")

    if any(window in windows for window in {"COMBAT_GENERAL", "UNASSIGNED", "READY_UNLOCK_PHASE_OR_CARD_TEXT"}):
        confidence = "low"

    return (
        windows,
        confidence,
        "; ".join(reasons),
        "; ".join(dict.fromkeys(notes)),
    )


def main() -> int:
    with INPUT_CSV.open(newline="", encoding="utf-8") as input_file:
        rows = list(csv.DictReader(input_file))

    if not rows:
        raise SystemExit(f"No rows found in {INPUT_CSV}")

    output_rows = []
    for row in rows:
        windows, confidence, reason, notes = assign_windows(row)
        output_rows.append({
            **row,
            "AssignedWindows": "|".join(windows),
            "AssignmentConfidence": confidence,
            "AssignmentReason": reason,
            "ReviewNotes": notes,
        })

    with OUTPUT_CSV.open("w", newline="", encoding="utf-8") as output_file:
        writer = csv.DictWriter(output_file, fieldnames=list(rows[0].keys()) + AUDIT_FIELDNAMES)
        writer.writeheader()
        writer.writerows(output_rows)

    confidence_counts = Counter(row["AssignmentConfidence"] for row in output_rows)
    print(f"Wrote {OUTPUT_CSV.relative_to(ROOT)}")
    print(f"Rows: {len(output_rows)}")
    print(
        "Confidence: "
        f"high={confidence_counts['high']}, "
        f"medium={confidence_counts['medium']}, "
        f"low={confidence_counts['low']}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
