package net.deckserver.jol.controller;

import io.quarkus.security.Authenticated;
import io.quarkus.security.identity.SecurityIdentity;
import io.quarkus.vertx.http.runtime.security.FormAuthenticationMechanism;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.core.Response;
import net.deckserver.jol.entity.User;

import java.net.URI;

@Path("/user")
public class UserController {

    @Inject
    SecurityIdentity identity;

    @POST
    @Path("/register")
    @Transactional
    public Response register(Register register) {
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
    public Response changePassword(String newPassword) {
        String userName = identity.getPrincipal().getName();
        User user = User.findByUsername(userName);
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
    @Path("/me")
    @Authenticated
    public Response me() {
        return Response.ok(identity.getPrincipal().getName()).build();
    }

    public record Register(String username, String password, String email) {
    }

}
