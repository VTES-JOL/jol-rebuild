package net.deckserver.jol.enums;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public enum Discipline {
    ABOMBWE("abo"),
    ANIMALISM("ani"),
    AUSPEX("aus"),
    BLOOD_SORCERY("tha"),
    THAUMATURGY("tha"),
    CELERITY("cel"),
    CHIMERSTRY("chi"),
    DAIMOINON("dai"),
    DEMENTATION("dem"),
    DOMINATE("dom"),
    FORTITUDE("for"),
    MELPOMINEE("mel"),
    MYTHERCERIA("myt"),
    NECROMANCY("nec"),
    OBEAH("obe"),
    OBFUSCATE("obf"),
    OBTENEBRATION("obt"),
    OBLIVION("obl"),
    POTENCE("pot"),
    PRESENCE("pre"),
    PROTEAN("pro"),
    QUIETUS("qui"),
    SANGUINUS("san"),
    SERPENTIS("ser"),
    SPIRITUS("spi"),
    TEMPORIS("tem"),
    THANATOSIS("thn"),
    VALEREN("val"),
    VICISSITUDE("vic"),
    VISCERATIKA("vis"),

    // Imbued
    VENGEANCE("ven"),
    DEFENSE("def"),
    INNOCENCE("inn"),
    JUSTICE("jud"),
    MARTYRDOM("mar"),
    REDEMPTION("red"),
    VISION("viz"),

    // Other
    FLIGHT("flight"),
    STRIGA("str"),
    MALEFICIA("mal");

    public final String code;

    Discipline(String code) {
        this.code = code;
    }
}
