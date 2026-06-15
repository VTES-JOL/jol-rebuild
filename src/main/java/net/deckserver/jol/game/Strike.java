package net.deckserver.jol.game;

import io.quarkus.runtime.annotations.RegisterForReflection;
import net.deckserver.jol.enums.StrikeType;
import net.deckserver.jol.game.command.CardRef;

@RegisterForReflection
public class Strike {
    private StrikeType strikeType;
    private CardRef weaponRef; // nullable

    public Strike() {}

    public Strike(StrikeType strikeType, CardRef weaponRef) {
        this.strikeType = strikeType;
        this.weaponRef = weaponRef;
    }

    public Strike(Strike src) {
        this.strikeType = src.strikeType;
        this.weaponRef = src.weaponRef;
    }

    public StrikeType getStrikeType() { return strikeType; }
    public void setStrikeType(StrikeType strikeType) { this.strikeType = strikeType; }

    public CardRef getWeaponRef() { return weaponRef; }
    public void setWeaponRef(CardRef weaponRef) { this.weaponRef = weaponRef; }
}
