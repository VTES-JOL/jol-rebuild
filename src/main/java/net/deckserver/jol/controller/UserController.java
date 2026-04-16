package net.deckserver.jol.controller;

import io.quarkus.runtime.annotations.RegisterForReflection;
import io.quarkus.security.Authenticated;
import io.quarkus.security.identity.SecurityIdentity;
import io.quarkus.vertx.http.runtime.security.FormAuthenticationMechanism;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import net.deckserver.jol.dto.UserProfileDto;
import net.deckserver.jol.entity.Preferences;
import net.deckserver.jol.entity.User;
import net.deckserver.jol.enums.Role;

import java.net.URI;
import java.util.List;
import java.util.Set;

@Path("/user")
public class UserController {

    @Inject
    SecurityIdentity identity;

    @POST
    @Path("/register")
    @Transactional
    public Response register(@Valid Register register) {
        try {
            User user = User.create(register.username, register.password, register.email, Role.USER);
            return Response.created(URI.create("/users/" + user.id)).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.CONFLICT).build();
        }
    }

    @POST
    @Path("/change-password")
    @Transactional
    public Response changePassword(@NotBlank @Size(min = 8, max = 50) String newPassword) {
        String userName = identity.getPrincipal().getName();
        User user = User.findByUsername(userName);
        if (user == null) {
            throw new WebApplicationException("Authenticated user not found", Response.Status.NOT_FOUND);
        }
        user.updatePassword(newPassword);
        return Response.ok().build();
    }

    @POST
    @Path("/logout")
    @Authenticated
    public Response logout() {
        FormAuthenticationMechanism.logout(identity);
        return Response.noContent().build();
    }

    @GET
    @Path("/profile")
    public Response me() {
        if (identity.isAnonymous()) {
            return Response.noContent().build();
        }
        String userName = identity.getPrincipal().getName();
        Set<String> roles = identity.getRoles();
        User user = User.findByUsername(userName);
        if (user == null) throw new WebApplicationException("Not Authenticated", Response.Status.UNAUTHORIZED);
        UserProfileDto dto = new UserProfileDto(user.id, user.username, user.email, user.tournamentId, user.discordId, user.preferences, roles);
        return Response.ok(dto).build();
    }

    @GET
    @Path("/search")
    @RolesAllowed("USER")
    public List<String> search(@QueryParam("q") String q) {
        if (q == null || q.isBlank() || q.length() < 2) return List.of();
        String caller = identity.getPrincipal().getName();
        return User.<User>find("lower(username) like ?1 and username != ?2",
                "%" + q.toLowerCase() + "%", caller)
            .page(0, 10)
            .stream()
            .map(u -> u.username)
            .toList();
    }

    @PUT
    @Path("/preferences")
    @Authenticated
    @Transactional
    @Consumes(MediaType.APPLICATION_JSON)
    public Response updatePreferences(UpdatePreferences body) {
        String userName = identity.getPrincipal().getName();
        User user = User.findByUsername(userName);
        if (user == null) throw new WebApplicationException("Not found", Response.Status.NOT_FOUND);
        if (user.preferences == null) user.preferences = new Preferences();
        user.preferences.countryCode = body.countryCode();
        if (body.zoneId() != null && !body.zoneId().isBlank()) {
            user.preferences.zoneId = body.zoneId();
        }
        user.preferences.enableImages = body.enableImages();
        return Response.ok().build();
    }

    @RegisterForReflection
    public record Register(@NotBlank(message = "{jol.validation.constraints.username.blank}") String username,
                           @NotBlank(message = "{jol.validation.constrains.password.size}") @Size(min = 8, message = "{jol.validation.constrains.password.size}") String password,
                           @NotBlank(message = "{jol.validation.constraints.email.invalid}") @Email(message = "{jol.validation.constraints.email.invalid}") String email) {
    }

    @RegisterForReflection
    public record UpdatePreferences(String countryCode, String zoneId, boolean enableImages) {
    }
}
