package net.deckserver.jol.model.krcg;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.quarkus.runtime.annotations.RegisterForReflection;

/**
 * Optional deck metadata embedded at the top level of a KRCG JSON document.
 * All fields are nullable — only populated fields are serialised.
 */
@RegisterForReflection
@JsonInclude(JsonInclude.Include.NON_NULL)
public record KrcgMeta(String name, String author, String description) {}
