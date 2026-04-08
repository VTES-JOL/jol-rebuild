package net.deckserver.jol.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import net.deckserver.jol.enums.GameFormat;
import net.deckserver.jol.enums.Status;
import net.deckserver.jol.enums.Visibility;

import java.util.ArrayList;
import java.util.List;

@Entity
public class Game extends PanacheEntity {
    public String name;
    public Visibility visibility = Visibility.PUBLIC;
    public Status status = Status.OPEN;
    @Column(name = "format")
    public GameFormat gameFormat = GameFormat.STANDARD;

    @ManyToOne
    public User owner;

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

    public static Game create(User owner, String name, Visibility visibility, GameFormat format) {
        Game game = new Game();
        game.owner = owner;
        game.name = name;
        game.visibility = visibility;
        game.gameFormat = format;
        game.status = Status.OPEN;
        game.persist();
        return game;
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

}
