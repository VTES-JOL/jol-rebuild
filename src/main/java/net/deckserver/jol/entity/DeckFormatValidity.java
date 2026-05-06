package net.deckserver.jol.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import net.deckserver.jol.enums.GameFormat;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Entity
@Table(
    name = "deck_format_validity",
    uniqueConstraints = @UniqueConstraint(columnNames = {"deck_id", "format"})
)
public class DeckFormatValidity extends PanacheEntityBase {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    public String id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.CASCADE)
    public Deck deck;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    public GameFormat format;

    @Column(nullable = false)
    public boolean valid;

    @JdbcTypeCode(SqlTypes.JSON)
    public List<String> errors;

    @Column(nullable = false, name = "computed_at")
    public Instant computedAt;

    public static List<DeckFormatValidity> findByDeck(String deckId) {
        return find("deck.id", deckId).list();
    }

    public static Optional<DeckFormatValidity> findByDeckAndFormat(String deckId, GameFormat format) {
        return find("deck.id = ?1 and format = ?2", deckId, format).firstResultOptional();
    }
}
