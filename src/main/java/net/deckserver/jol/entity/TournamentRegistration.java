package net.deckserver.jol.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tournament_registration", uniqueConstraints = @UniqueConstraint(columnNames = {"tournament_id", "user_id"}))
public class TournamentRegistration extends PanacheEntityBase {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    public String id;

    @ManyToOne
    public Tournament tournament;

    @ManyToOne
    public User user;

    /**
     * Ordered list of registered decks.
     * SINGLE_DECK: exactly 1 entry, used for every round.
     * MULTI_DECK:  one entry per round (index 0 = first round played, skipping byes).
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    public List<DeckEntry> decks = new ArrayList<>();

    public static class DeckEntry {
        public String deck;      // JSON-encoded deck contents
        public String deckName;
        public String summary;
    }

    public static TournamentRegistration findByTournamentAndUser(Tournament tournament, User user) {
        return find("tournament.id = ?1 and user.id = ?2", tournament.id, user.id).firstResult();
    }

    public static List<TournamentRegistration> findByTournament(Tournament tournament) {
        return find("tournament.id = ?1", tournament.id).list();
    }
}
