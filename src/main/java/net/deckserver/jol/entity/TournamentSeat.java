package net.deckserver.jol.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;

import java.util.List;

@Entity
@Table(name = "tournament_seat")
public class TournamentSeat extends PanacheEntity {

    /**
     * The table this seat belongs to. Null for bye seats (bye=true).
     * Round number is derived from table.roundNumber for non-bye seats,
     * or from the byeRound field for bye seats.
     */
    @ManyToOne(optional = true)
    @JoinColumn(name = "table_id")
    public TournamentTable table;

    @ManyToOne
    public TournamentRegistration registration;

    /** Seat position 1–5 for real seats; 0 for bye seats */
    public int seatPosition;

    /** True when the player is skipping this round */
    public boolean bye;

    /**
     * For bye seats (bye=true), stores the round number directly
     * since there is no table reference.
     */
    public int byeRound;

    public static TournamentSeat findByTableAndRegistration(TournamentTable table, TournamentRegistration reg) {
        return find("table.id = ?1 and registration.id = ?2", table.id, reg.id).firstResult();
    }

    public static TournamentSeat findByRoundAndRegistration(Tournament tournament, int roundNumber, TournamentRegistration reg) {
        // Check regular seats (via table) and bye seats (via byeRound)
        TournamentSeat tableSeat = find(
            "table.tournament.id = ?1 and table.roundNumber = ?2 and registration.id = ?3",
            tournament.id, roundNumber, reg.id
        ).firstResult();
        if (tableSeat != null) return tableSeat;
        return find(
            "bye = true and byeRound = ?1 and registration.tournament.id = ?2 and registration.id = ?3",
            roundNumber, tournament.id, reg.id
        ).firstResult();
    }

    public static List<TournamentSeat> findByesByTournamentAndRound(Tournament tournament, int roundNumber) {
        return find(
            "bye = true and byeRound = ?1 and registration.tournament.id = ?2",
            roundNumber, tournament.id
        ).list();
    }
}
