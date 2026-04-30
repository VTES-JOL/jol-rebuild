package net.deckserver.jol.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import net.deckserver.jol.enums.Status;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Entity
public class Registration extends PanacheEntityBase {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    public String id;

    @Version
    @Column(nullable = false)
    public Long version = 0L;

    @ManyToOne
    public User user;

    @ManyToOne
    public Game game;

    @Column(name = "last_updated")
    public OffsetDateTime lastUpdated;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    public Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    public Instant updatedAt;

    @JdbcTypeCode(SqlTypes.JSON)
    public String deck;

    @Column(name = "deck_name")
    public String deckName;
    public String summary;

    public static Registration invite(Game game, User user) {
        Game managedGame = Game.findById(game.id);
        User managedUser = User.findById(user.id);
        if (managedUser == null || managedGame == null) {
            throw new IllegalArgumentException("Game and user must exist to invite");
        }
        Registration registration = findByGameAndUser(managedGame, managedUser);
        if (registration == null) {
            registration = new Registration();
            registration.game = managedGame;
            registration.user = managedUser;
            managedGame.registrations.add(registration);
            managedUser.registrations.add(registration);
        }
        registration.lastUpdated = OffsetDateTime.now();
        registration.persist();
        return registration;
    }

    public static Registration register(Game game, User user, Deck deck) {
        Game managedGame = Game.findById(game.id);
        User managedUser = User.findById(user.id);
        if (managedUser == null || managedGame == null) {
            throw new IllegalArgumentException("Game and user must exist to invite");
        }

        Registration registration = findByGameAndUser(managedGame, managedUser);
        if (registration == null) {
            throw new IllegalArgumentException("Must have an invite to register a deck");
        }
        registration.deck = deck.contents;
        registration.deckName = deck.name;
        registration.summary = deck.summary;
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

    public static long countForGame(String gameId) {
        return count("game.id = ?1 and deck is not null", gameId);
    }

    public static Map<String, Long> countsByGameIds(List<String> gameIds) {
        if (gameIds.isEmpty()) return Map.of();
        return find("game.id IN ?1 AND deck IS NOT NULL", gameIds)
            .<Registration>list()
            .stream()
            .collect(Collectors.groupingBy(r -> r.game.id, Collectors.counting()));
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
}
