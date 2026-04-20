package net.deckserver.jol.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;

import java.util.List;

@Entity
@Table(name = "tournament_seat")
public class TournamentSeat extends PanacheEntity {

    @ManyToOne
    @JoinColumn(name = "table_id")
    public TournamentTable table;

    @ManyToOne
    public TournamentRegistration registration;

    /** Seat position 1–5 for real seats; 0 for bye seats */
    @Column(name = "seat_position")
    public int seatPosition;

    /** True when the player is skipping this round */
    public boolean bye;

    /** Round this seat (or bye) applies to */
    @Column(name = "round_number")
    public int roundNumber;

    public static TournamentSeat findByRoundAndRegistration(Tournament tournament, int roundNumber, TournamentRegistration reg) {
        return find(
            "roundNumber = ?1 and registration.tournament.id = ?2 and registration.id = ?3",
            roundNumber, tournament.id, reg.id
        ).firstResult();
    }

    public static List<TournamentSeat> findByesByTournamentAndRound(Tournament tournament, int roundNumber) {
        return find(
            "bye = true and roundNumber = ?1 and registration.tournament.id = ?2",
            roundNumber, tournament.id
        ).list();
    }

    public static List<TournamentSeat> findAllByTournament(Tournament tournament) {
        return find("registration.tournament.id = ?1", tournament.id).list();
    }
}