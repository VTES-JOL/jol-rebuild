package net.deckserver.jol.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;
import net.deckserver.jol.enums.Status;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
public class Registration extends PanacheEntity {
    @ManyToOne
    public User user;

    @ManyToOne
    public Game game;

    public OffsetDateTime lastUpdated;

    @JdbcTypeCode(SqlTypes.JSON)
    public String deck;
    public String deckName;
    public String summary;

    public static Registration invite(Game game, User user) {
        Registration registration = findByGameAndUser(game, user);
        if (registration == null) {
            registration = new Registration();
            registration.game = game;
            registration.user = user;
            if (game.registrations == null) {
                game.registrations = new ArrayList<>();
            }
            game.registrations.add(registration);
        }
        registration.lastUpdated = OffsetDateTime.now();
        registration.persist();
        return registration;
    }

    public static Registration findByGameAndUser(Game game, User user) {
        return find("game.id = ?1 and user.id = ?2", game.id, user.id).firstResult();
    }

    public static List<Registration> getRegistrations(Game game) {
        return find("game.id = ?1 and deck is not null", game.id).list();
    }

    public static List<Registration> getInvites(Game game) {
        return find("game.id = ?1 and deck is null", game.id).list();
    }

    public static void delete(Game game, User user) {
        if (game.status == Status.ACTIVE) {
            throw new IllegalStateException("Game in progress.  Can't delete.");
        }
        Registration registration = findByGameAndUser(game, user);
        if (registration != null && registration.isPersistent()) {
            registration.delete();
        }
    }

    public void register(Deck deck) {
        this.deck = deck.contents;
        this.deckName = deck.name;
        this.summary = deck.summary;
        this.lastUpdated = OffsetDateTime.now();
    }
}
