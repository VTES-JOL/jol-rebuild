package net.deckserver.jol.controller;

import io.quarkus.security.Authenticated;
import io.quarkus.security.identity.SecurityIdentity;
import io.quarkus.vertx.http.runtime.security.FormAuthenticationMechanism;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;
import net.deckserver.jol.dto.UserProfileDTO;
import net.deckserver.jol.entity.User;
import net.deckserver.jol.enums.Role;

import java.net.URI;
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
            return Response.ok().entity("null").build();
        }
        String userName = identity.getPrincipal().getName();
        Set<String> roles = identity.getRoles();
        UserProfileDTO dto = User.find("username", userName).project(UserProfileDTO.class).firstResultOptional()
                .orElseThrow(() -> new WebApplicationException("Not Authenticated", Response.Status.UNAUTHORIZED));
        dto.roles = roles;
        return Response.ok(dto).build();
    }

    public record Register(@NotBlank(message = "{jol.validation.constraints.blank}") String username, @Size(min = 8, message = "{jol.validation.constrains.passwordSize}") String password, @Email String email) {
    }
}
