package net.deckserver.jol.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.List;

@Entity
public class Deck extends PanacheEntity {

    @ManyToOne(optional = false)
    public User user;

    public String name;
    @JdbcTypeCode(SqlTypes.JSON)

    public String contents;
    public String summary;
    public String comments;

    @Column(nullable = false)
    public Instant timestamp;

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
        return find("user.username = ?1", username).list();
    }
}
