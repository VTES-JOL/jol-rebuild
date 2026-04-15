package net.deckserver.jol.entity;

import io.quarkus.elytron.security.common.BcryptUtil;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import io.quarkus.security.jpa.Password;
import io.quarkus.security.jpa.Roles;
import io.quarkus.security.jpa.UserDefinition;
import io.quarkus.security.jpa.Username;
import jakarta.persistence.*;
import net.deckserver.jol.enums.Role;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.*;

@Entity
@Table(name = "users", uniqueConstraints = @UniqueConstraint(columnNames = {"username"}))
@UserDefinition
public class User extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    public String id;

    @Username
    @Column(nullable = false)
    public String username;

    @Password
    @Column(nullable = false)
    public String password;

    @Column(nullable = false)
    public String email;

    @Column(name = "tournament_id")
    public String tournamentId;

    @Column(name = "discord_id")
    public String discordId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "preferences", columnDefinition = "jsonb")
    public Preferences preferences = new Preferences();

    @Roles
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "role")
    public Set<String> roles = new HashSet<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<Registration> registrations = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<Deck> decks = new ArrayList<>();

    public static User create(String username, String password, String email, Role... roles) {
        if (findByUsername(username) != null) {
            throw new IllegalArgumentException("Player with that username already exists");
        }
        User user = new User();
        user.username = username;
        user.password = BcryptUtil.bcryptHash(password);
        user.email = email;
        user.roles = new HashSet<>(Arrays.stream(roles).map(Role::toString).toList());
        user.preferences = new Preferences();
        user.persist();
        return user;
    }

    public static User findByUsername(String username) {
        return find("username", username).firstResult();
    }

    public static List<Registration> getRegistrations(String username) {
        return find("select r from Registration r JOIN r.user u where u.username = ?1 and r.deck is not null", username).list();
    }

    public static List<Registration> getInvites(String username) {
        return find("select r from Registration r JOIN r.user u where u.username = ?1 and r.deck is null", username).list();
    }

    @Override
    public void delete() {
        // clean up player decks
        for (Deck deck : decks) {
            deck.delete();
        }
        super.delete();
    }

    public void updatePassword(String newPassword) {
        this.password = BcryptUtil.bcryptHash(newPassword);
    }

}
