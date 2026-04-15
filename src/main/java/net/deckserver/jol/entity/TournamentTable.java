package net.deckserver.jol.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tournament_table")
public class TournamentTable extends PanacheEntity {

    @ManyToOne
    public Tournament tournament;

    public int roundNumber;

    @ManyToOne
    @JoinColumn(name = "game_id")
    public Game game;

    @OneToMany(mappedBy = "table", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<TournamentSeat> seats = new ArrayList<>();

    public static List<TournamentTable> findByTournament(Tournament tournament) {
        return find("tournament.id = ?1 order by roundNumber, id", tournament.id).list();
    }

    public static List<TournamentTable> findByTournamentAndRound(Tournament tournament, int roundNumber) {
        return find("tournament.id = ?1 and roundNumber = ?2 order by id", tournament.id, roundNumber).list();
    }
}
