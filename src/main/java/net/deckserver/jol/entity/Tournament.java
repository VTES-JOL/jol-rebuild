package net.deckserver.jol.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import net.deckserver.jol.enums.GameFormat;
import net.deckserver.jol.enums.TournamentFormat;
import net.deckserver.jol.enums.TournamentStatus;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
public class Tournament extends PanacheEntity {

    public String name;

    public OffsetDateTime registrationStart;
    public OffsetDateTime registrationEnd;

    public OffsetDateTime playingStart;
    public OffsetDateTime playingEnd;

    @Enumerated(EnumType.STRING)
    public TournamentFormat format = TournamentFormat.SINGLE_DECK;

    @Enumerated(EnumType.STRING)
    public GameFormat gameFormat = GameFormat.STANDARD;

    public int numberOfRounds = 2; // min: 2, max: 3

    public boolean finalRound = false;

    public boolean requiresId = false;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    public List<Rule> rules = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    public TournamentStatus status = TournamentStatus.Starting;

    public static class Rule {
        public String text;
        public String condition;
    }

    public static List<Tournament> findByStatus(TournamentStatus status) {
        return find("status", status).list();
    }
}
