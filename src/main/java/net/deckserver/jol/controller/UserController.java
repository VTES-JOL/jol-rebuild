package net.deckserver.jol.controller;

import io.quarkus.security.Authenticated;
import io.quarkus.security.identity.SecurityIdentity;
import io.quarkus.vertx.http.runtime.security.FormAuthenticationMechanism;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.core.Response;
import net.deckserver.jol.dto.UserDto;
import net.deckserver.jol.entity.User;

import java.net.URI;
import java.time.ZoneId;

@Path("/user")
public class UserController {

    @Inject
    SecurityIdentity identity;

    @POST
    @Path("/register")
    @Transactional
    public Response register(@Valid Register register) {
        try {
            User user = User.add(register.username, register.password, register.email, "USER");
            return Response.created(URI.create("/users/" + user.id)).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.CONFLICT).build();
        }
    }

    @POST
    @Path("/change-password")
    @Transactional
    @Authenticated
    public Response changePassword(@NotBlank @Size(min = 8, max = 50) String newPassword) {
        String id = identity.getAttribute("id");
        User user = User.findById(id);
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
    @Authenticated
    public UserDto me() {
        String userName = identity.getPrincipal().getName();
        return User.find("username = ?1", userName).project(UserDto.class).firstResult();
    }

    @PUT
    @Path("/profile/discord")
    @Authenticated
    @Transactional
    public Response updateDiscordId(@Pattern(regexp = "^\\d{17,20}$") String discordId) {
        String id = identity.getAttribute("id");
        User user = User.findById(id);
        user.discordId = discordId;
        return Response.noContent().build();
    }

    @PUT
    @Path("/profile/tournament")
    @Authenticated
    @Transactional
    public Response updateTournamentId(String tournamentId) {
        String id = identity.getAttribute("id");
        User user = User.findById(id);
        user.tournamentId = tournamentId;
        return Response.noContent().build();
    }

    @PUT
    @Path("/profile/country")
    @Authenticated
    @Transactional
    public Response updateCountry(@Pattern(regexp = "^[A-Z]{2}$", message = "{jol.validation.constraints.countryCode}") String countryCode) {
        String id = identity.getAttribute("id");
        User user = User.findById(id);
        user.countryCode = countryCode;
        return Response.noContent().build();
    }

    @PUT
    @Path("/profile/timeZone")
    @Authenticated
    @Transactional
    public Response updateTimeZone(@Pattern(regexp = "^[A-Za-z]+/[A-Za-z0-9_/.-]+$", message = "{jol.validation.constraints.timeZone}") String zone) {
        String id = identity.getAttribute("id");
        User user = User.findById(id);
        user.zoneId = ZoneId.of(zone);
        return Response.noContent().build();
    }

    public record Register(@NotBlank String username, @NotBlank @Size(min = 8) String password, @Email String email) {
    }
}
