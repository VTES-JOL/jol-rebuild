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

    @Column(name = "registration_start")
    public OffsetDateTime registrationStart;

    @Column(name = "registration_end")
    public OffsetDateTime registrationEnd;

    @Column(name = "playing_start")
    public OffsetDateTime playingStart;

    @Column(name = "playing_end")
    public OffsetDateTime playingEnd;

    @Enumerated(EnumType.STRING)
    public TournamentFormat format = TournamentFormat.SINGLE_DECK;

    @Enumerated(EnumType.STRING)
    @Column(name = "game_format")
    public GameFormat gameFormat = GameFormat.STANDARD;

    @Column(name = "number_of_rounds")
    public int numberOfRounds = 2; // min: 2, max: 3

    @Column(name = "final_round")
    public boolean finalRound = false;

    @Column(name = "requires_id")
    public boolean requiresId = false;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    public List<Rule> rules = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    public List<Condition> conditions = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    public TournamentStatus status = TournamentStatus.SETUP;

    public static class Rule {
        public String text;
        public String conditionId; // Points to a Condition
    }

    public static class Condition {
        public String id;
        public String text;
    }

    public static List<Tournament> findByStatus(TournamentStatus status) {
        return find("status", status).list();
    }
}
