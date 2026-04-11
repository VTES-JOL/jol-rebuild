package net.deckserver.jol.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import net.deckserver.jol.enums.GameFormat;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
public class Deck extends PanacheEntity {

    @ManyToOne(optional = false)
    public User user;

    public String name;

    @JdbcTypeCode(SqlTypes.JSON)
    public String contents;

    public String summary;

    @Column(columnDefinition = "TEXT")
    public String comments;

    @Column(nullable = false)
    public Instant timestamp;

    @OneToMany(mappedBy = "deck", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    public List<DeckFormatValidity> formatValidity = new ArrayList<>();

    public static Deck create(User user, String name, String contents, String summary) {
        Deck deck = new Deck();
        deck.user = user;
        deck.name = name;
        deck.contents = contents;
        deck.summary = summary;
        deck.timestamp = Instant.now();
        deck.persist();
        return deck;
    }

    public static List<Deck> findByUsername(String username) {
        return find("user.username = ?1 order by timestamp desc", username).list();
    }

    /** Filter by format validity — joins formatValidity collection. */
    public static List<Deck> findByUsernameAndFormat(String username, GameFormat format) {
        return find(
            "select d from Deck d join d.formatValidity v " +
            "where d.user.username = ?1 and v.format = ?2 and v.valid = true " +
            "order by d.timestamp desc",
            username, format
        ).list();
    }

    /** Filter by card — casts JSON column to text for LIKE search (PostgreSQL). */
    @SuppressWarnings("unchecked")
    public static List<Deck> findByUsernameContainingCard(String username, String cardId) {
        String pattern = "%\"" + cardId + "\"%";
        return getEntityManager().createNativeQuery(
            "SELECT d.* FROM deck d " +
            "JOIN users u ON d.user_id = u.id " +
            "WHERE u.username = :username AND d.contents::text LIKE :pattern " +
            "ORDER BY d.timestamp DESC",
            Deck.class
        ).setParameter("username", username).setParameter("pattern", pattern).getResultList();
    }

    /** Filter by both format validity and card presence. */
    @SuppressWarnings("unchecked")
    public static List<Deck> findByUsernameWithFormatAndCard(String username, GameFormat format, String cardId) {
        String pattern = "%\"" + cardId + "\"%";
        return getEntityManager().createNativeQuery(
            "SELECT d.* FROM deck d " +
            "JOIN users u ON d.user_id = u.id " +
            "JOIN deck_format_validity v ON v.deck_id = d.id " +
            "WHERE u.username = :username AND v.format = :format AND v.valid = true " +
            "AND d.contents::text LIKE :pattern " +
            "ORDER BY d.timestamp DESC",
            Deck.class
        ).setParameter("username", username).setParameter("format", format.name())
         .setParameter("pattern", pattern).getResultList();
    }
}
