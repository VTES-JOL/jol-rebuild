package net.deckserver.jol.security;

import io.quarkus.security.identity.AuthenticationRequestContext;
import io.quarkus.security.identity.SecurityIdentity;
import io.quarkus.security.identity.SecurityIdentityAugmentor;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class UserIdAugmentor implements SecurityIdentityAugmentor {

    @Inject
    UserEntityAugmentor userEntityAugmentor;

    @Override
    public Uni<SecurityIdentity> augment(SecurityIdentity identity, AuthenticationRequestContext context) {
        if (identity.isAnonymous()) {
            return Uni.createFrom().item(identity);
        } else {
            return context.runBlocking(() -> userEntityAugmentor.augment(identity));
        }
    }

}
