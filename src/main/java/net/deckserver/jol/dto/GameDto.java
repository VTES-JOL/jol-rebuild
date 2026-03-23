package net.deckserver.jol.dto;

import io.quarkus.hibernate.orm.panache.common.ProjectedFieldName;
import io.quarkus.runtime.annotations.RegisterForReflection;
import net.deckserver.jol.enums.Status;

@RegisterForReflection
public class GameDto {
    public String id;
    public String name;
    public Status status;
    public String owner;

    public GameDto(String id, String name, Status status, @ProjectedFieldName("owner.id") String owner) {
        this.id = id;
        this.name = name;
        this.status = status;
        this.owner = owner;
    }
}
