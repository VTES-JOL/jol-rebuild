package net.deckserver.jol.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
public class Deck extends PanacheEntity {

    @ManyToOne(optional = false)
    public User user;

    public String name;
    @JdbcTypeCode(SqlTypes.JSON)

    public String contents;
    public String summary;

    public static Deck create(User user, String name, String contents, String summary) {
        Deck deck = new Deck();
        deck.user = user;
        deck.name = name;
        deck.contents = contents;
        deck.summary = summary;
        deck.persist();
        return deck;
    }
}
