package net.deckserver.jol.security;

import io.quarkus.security.identity.SecurityIdentity;
import io.quarkus.security.runtime.QuarkusSecurityIdentity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.context.control.ActivateRequestContext;
import net.deckserver.jol.entity.User;

@ApplicationScoped
public class UserEntityAugmentor {

    @ActivateRequestContext
    public SecurityIdentity augment(SecurityIdentity identity) {
        QuarkusSecurityIdentity.Builder builder = QuarkusSecurityIdentity.builder(identity);
        String userName = identity.getPrincipal().getName();
        User user = User.findByUsername(userName);
        builder.addAttribute("id", user.id);
        return builder.build();
    }
}
