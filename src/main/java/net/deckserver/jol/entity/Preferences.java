package net.deckserver.jol.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;

import java.time.ZoneId;

@Entity
@Table
public class Preferences extends PanacheEntity {

    @OneToOne(mappedBy = "preferences")
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    public User user;

    @Column(name = "country_code")
    public String countryCode;

    @Column(name = "zone_id")
    public ZoneId zoneId = ZoneId.systemDefault();

    @Column(name = "enable_images")
    public boolean enableImages = true;

    public Preferences(User user) {
        this.user = user;
    }

    public Preferences() {
    }
}