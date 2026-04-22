package net.deckserver.jol.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import net.deckserver.jol.enums.GameFormat;
import net.deckserver.jol.enums.Status;
import net.deckserver.jol.enums.Visibility;

import java.util.ArrayList;
import java.util.List;

@Entity
public class Game extends PanacheEntityBase {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    public String id;
    public String name;
    public Visibility visibility = Visibility.PUBLIC;
    public Status status = Status.OPEN;
    @Column(name = "format")
    public GameFormat gameFormat = GameFormat.STANDARD;

    @ManyToOne
    public User owner;

    @ManyToOne
    @JoinColumn(name = "tournament_id")
    public Tournament tournament;

    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<Registration> registrations = new ArrayList<>();

    @Override
    public void delete() {
        // Remove registrations from players as well when you clean up registrations
        for (Registration registration : registrations) {
            registration.user.registrations.remove(registration);
            registration.delete();
        }
        super.delete();
    }

    public boolean isOwnedBy(String username) {
        return owner != null && owner.username.equals(username);
    }

    public static Game create(User owner, Tournament tournament, String name, Visibility visibility, GameFormat format) {
        Game game = new Game();
        game.owner = owner;
        game.tournament = tournament;
        game.name = name;
        game.visibility = visibility;
        game.gameFormat = format;
        game.status = Status.OPEN;
        game.persist();
        return game;
    }

    public static Game create(User owner, String name, Visibility visibility, GameFormat format) {
        return create(owner, null, name, visibility, format);
    }

    public static List<Game> findOpenGames() {
        return find("visibility = ?1 and status = ?2", Visibility.PUBLIC, Status.OPEN).list();
    }

    public static List<Game> findOpenGames(GameFormat format) {
        return find("visibility = ?1 and status = ?2 and gameFormat = ?3", Visibility.PUBLIC, Status.OPEN, format).list();
    }

    public static List<Game> findActiveGames() {
        return find("visibility = ?1 and status = ?2", Visibility.PUBLIC, Status.ACTIVE).list();
    }

    public static List<Game> findActiveGames(User user) {
        return find("from Game g left join fetch g.registrations r where g.status =?1 and r.user.id = ?2", Status.ACTIVE, user.id).list();
    }

    public static List<Game> findInvitedGames(User user) {
        return find(
            "select g from Game g join g.registrations r " +
            "where g.status = ?1 and r.user.id = ?2 and r.deck is null",
            Status.OPEN, user.id
        ).list();
    }

    public static List<Game> findRegisteredGames(User user) {
        return find(
            "select g from Game g join g.registrations r " +
            "where g.status = ?1 and r.user.id = ?2 and r.deck is not null",
            Status.OPEN, user.id
        ).list();
    }

}
