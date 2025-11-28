package net.deckserver.jol.entity;

import io.quarkus.elytron.security.common.BcryptUtil;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import io.quarkus.security.jpa.Password;
import io.quarkus.security.jpa.Roles;
import io.quarkus.security.jpa.UserDefinition;
import io.quarkus.security.jpa.Username;
import jakarta.persistence.*;
import jakarta.validation.constraints.Pattern;

import java.time.ZoneId;
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
    public String tournamentId;
    public String discordId;

    public String countryCode;
    public ZoneId zoneId = ZoneId.systemDefault();
    public boolean enableImages = true;

    @Roles
    @ElementCollection(fetch = FetchType.EAGER)
    public Collection<String> roles = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<Registration> registrations = new ArrayList<>();

    public static User add(String username, String password, String email, String... roles) {
        if (findByUsername(username) != null) {
            throw new IllegalArgumentException("Player with that username already exists");
        }
        User user = new User();
        user.username = username;
        user.password = BcryptUtil.bcryptHash(password);
        user.email = email;
        user.roles = new ArrayList<>(Arrays.asList(roles));
        user.persist();
        return user;
    }

    public static User findByUsername(String username) {
        return find("username = ?1", username).firstResult();
    }

    public void updatePassword(String newPassword) {
        this.password = BcryptUtil.bcryptHash(newPassword);
    }

}
