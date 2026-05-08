package net.deckserver.jol.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import net.deckserver.jol.enums.GameFormat;
import net.deckserver.jol.enums.TournamentFormat;
import net.deckserver.jol.enums.TournamentStatus;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
public class Tournament extends PanacheEntityBase {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    public String id;

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

    @Column(name = "original_number_of_rounds")
    public int originalNumberOfRounds = 0;

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

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    public Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    public Instant updatedAt;

    @OneToMany(mappedBy = "tournament", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<TournamentTable> tables = new ArrayList<>();

    @OneToMany(mappedBy = "tournament", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<TournamentRegistration> registrations = new ArrayList<>();

    public boolean canPublish() {
        return status == TournamentStatus.SETUP;
    }

    public boolean canBeginSeating() {
        return status == TournamentStatus.REGISTRATION;
    }

    public boolean canActivate() {
        return status == TournamentStatus.SEATING;
    }

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
