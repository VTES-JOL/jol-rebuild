package net.deckserver.jol.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import java.util.EnumSet;

/**
 * Created by shannon on 26/07/2016.
 */
public enum CardType {

    VAMPIRE("Vampire"),
    IMBUED("Imbued"),
    MASTER("Master"),
    ACTION("Action"),
    MODIFIER("Action Modifier"),
    REACTION("Reaction"),
    COMBAT("Combat"),
    ALLY("Ally"),
    RETAINER("Retainer"),
    POLITICAL("Political Action"),
    EQUIPMENT("Equipment"),
    EVENT("Event"),
    LOCATION("Location"),
    CONVICTION("Conviction"),
    POWER("Power"),
    NONE("");

    private final String label;

    CardType(String label) {
        this.label = label;
    }

    @JsonValue
    public String getLabel() {
        return label;
    }

    @JsonCreator
    public static CardType of(String value) {
        for (CardType type : EnumSet.allOf(CardType.class)) {
            if (type.label.equalsIgnoreCase(value) || type.name().equalsIgnoreCase(value)) {
                return type;
            }
        }
        return NONE;
    }

    public static EnumSet<CardType> lifeTypes() {
        return EnumSet.of(ALLY, RETAINER, IMBUED);
    }

    public static EnumSet<CardType> permanentTypes() {
        return EnumSet.of(VAMPIRE, IMBUED, ALLY, RETAINER, EQUIPMENT, EVENT, MASTER);
    }

    public static EnumSet<CardType> clanTypes() {
        return EnumSet.of(VAMPIRE, IMBUED);
    }

}
