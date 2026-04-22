package net.deckserver.jol.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tournament_table")
public class TournamentTable extends PanacheEntityBase {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    public String id;

    @ManyToOne
    public Tournament tournament;

    @OneToMany(mappedBy = "table", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<TournamentSeat> seats = new ArrayList<>();

    @OneToMany(mappedBy = "table", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<TournamentTableGame> games = new ArrayList<>();

    public static List<TournamentTable> findByTournament(Tournament tournament) {
        return find("tournament.id = ?1 order by id", tournament.id).list();
    }
}