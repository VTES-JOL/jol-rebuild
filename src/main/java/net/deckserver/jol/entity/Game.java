package net.deckserver.jol.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
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
    public GameFormat format = GameFormat.STANDARD;

    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<Registration> registrations = new ArrayList<>();

    public static Game create(String name, Visibility visibility, GameFormat format) {
        Game game = new Game();
        game.name = name;
        game.visibility = visibility;
        game.format = format;
        game.status = Status.OPEN;
        game.persist();
        return game;
    }

    public static List<Game> findOpenGames() {
        return find("visibility = ?1 and status = ?2", Visibility.PUBLIC, Status.OPEN).list();
    }

    public static List<Game> findOpenGames(GameFormat format) {
        return find("visibility = ?1 and status = ?2 and format = ?3", Visibility.PUBLIC, Status.OPEN, format).list();
    }

    public static List<Game> findActiveGames() {
        return find("visibility = ?1 and status = ?2", Visibility.PUBLIC, Status.ACTIVE).list();
    }

}
