package net.deckserver.jol.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

import java.util.List;

@Entity
@Table(name = "tournament_table_game")
public class TournamentTableGame extends PanacheEntityBase {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    public String id;

    @ManyToOne
    @JoinColumn(name = "table_id")
    public TournamentTable table;

    @Column(name = "round_number")
    public int roundNumber;

    @ManyToOne
    @JoinColumn(name = "game_id")
    public Game game;

    public static List<TournamentTableGame> findByTournament(Tournament tournament) {
        return find("table.tournament.id = ?1", tournament.id).list();
    }
}