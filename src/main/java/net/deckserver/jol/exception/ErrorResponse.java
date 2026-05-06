package net.deckserver.jol.exception;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public record ErrorResponse(String code, String message) {}
