package net.deckserver.jol.game;

import io.quarkus.runtime.annotations.RegisterForReflection;
import net.deckserver.jol.enums.StrikeType;
import net.deckserver.jol.game.command.CardRef;

@RegisterForReflection
public class Strike {
    private StrikeType strikeType;
    private CardRef weaponRef; // nullable
    private int damage = 1;

    public Strike() {}

    public Strike(StrikeType strikeType, CardRef weaponRef, int damage) {
        this.strikeType = strikeType;
        this.weaponRef = weaponRef;
        this.damage = damage;
    }

    public Strike(Strike src) {
        this.strikeType = src.strikeType;
        this.weaponRef = src.weaponRef;
        this.damage = src.damage;
    }

    public StrikeType getStrikeType() { return strikeType; }
    public void setStrikeType(StrikeType strikeType) { this.strikeType = strikeType; }

    public CardRef getWeaponRef() { return weaponRef; }
    public void setWeaponRef(CardRef weaponRef) { this.weaponRef = weaponRef; }

    public int getDamage() { return damage; }
    public void setDamage(int damage) { this.damage = damage; }
}
