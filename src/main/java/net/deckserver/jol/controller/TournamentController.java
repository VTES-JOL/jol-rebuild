package net.deckserver.jol.controller;

import io.quarkus.security.identity.SecurityIdentity;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import net.deckserver.jol.entity.Tournament;
import net.deckserver.jol.enums.TournamentStatus;

import java.util.List;

@Path("/api/tournaments")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class TournamentController {

    @Inject
    SecurityIdentity identity;

    @GET
    public List<Tournament> list(@QueryParam("status") TournamentStatus status) {
        if (status != null) {
            return Tournament.findByStatus(status);
        }
        return Tournament.listAll();
    }

    @GET
    @Path("/{id}")
    public Tournament get(@PathParam("id") Long id) {
        Tournament tournament = Tournament.findById(id);
        if (tournament == null) {
            throw new NotFoundException();
        }
        return tournament;
    }

    @POST
    @Transactional
    @RolesAllowed("TOURNAMENT_ADMIN")
    public Tournament create(Tournament tournament) {
        tournament.id = null;
        if (tournament.status == null) {
            tournament.status = TournamentStatus.Starting;
        }
        tournament.persist();
        return tournament;
    }

    @PUT
    @Path("/{id}")
    @Transactional
    public Tournament update(@PathParam("id") Long id, Tournament updated) {
        Tournament entity = Tournament.findById(id);
        if (entity == null) {
            throw new NotFoundException();
        }

        boolean isTournamentAdmin = identity.hasRole("TOURNAMENT_ADMIN");
        
        if (entity.status == TournamentStatus.Starting) {
            if (!isTournamentAdmin) {
                throw new ForbiddenException("Only TOURNAMENT_ADMIN can edit tournaments in Starting status");
            }
        } else {
            // If it's not in Starting status, can we edit it? 
            // The requirement says: "A user with the role 'TOURNAMENT_ADMIN' will be able to edit tournament details in the 'Starting' status."
            // It doesn't explicitly forbid editing in other statuses, but usually, once Active/Completed, editing is restricted.
            // For now, I'll follow the explicit permission.
            if (!isTournamentAdmin) {
                 throw new ForbiddenException("Only TOURNAMENT_ADMIN can edit tournament details");
            }
        }

        entity.name = updated.name;
        entity.registrationStart = updated.registrationStart;
        entity.registrationEnd = updated.registrationEnd;
        entity.playingStart = updated.playingStart;
        entity.playingEnd = updated.playingEnd;
        entity.format = updated.format;
        entity.gameFormat = updated.gameFormat;
        entity.numberOfRounds = updated.numberOfRounds;
        entity.finalRound = updated.finalRound;
        entity.requiresId = updated.requiresId;
        entity.rules = updated.rules;
        entity.conditions = updated.conditions;
        entity.status = updated.status;

        return entity;
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    @RolesAllowed("TOURNAMENT_ADMIN")
    public void delete(@PathParam("id") Long id) {
        Tournament entity = Tournament.findById(id);
        if (entity == null) {
            throw new NotFoundException();
        }
        entity.delete();
    }
}
