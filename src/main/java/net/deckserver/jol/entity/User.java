package net.deckserver.jol.entity;

import io.quarkus.elytron.security.common.BcryptUtil;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import io.quarkus.security.jpa.Password;
import io.quarkus.security.jpa.Roles;
import io.quarkus.security.jpa.UserDefinition;
import io.quarkus.security.jpa.Username;
import jakarta.persistence.*;
import net.deckserver.jol.enums.Role;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "users", uniqueConstraints = @UniqueConstraint(columnNames = {"username"}))
@UserDefinition
public class User extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    public String id;

    @Username
    @Column(unique = true)
    public String username;

    @Password
    public String password;

    public String email;

    @Column(name = "tournament_id")
    public String tournamentId;

    @Column(name = "discord_id")
    public String discordId;

    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    public Preferences preferences;

    @Roles
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "role")
    public Collection<String> roles = new ArrayList<>();

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
        user.roles = new ArrayList<>(Arrays.stream(roles).map(Role::toString).toList());
        user.preferences = new Preferences(user);
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
