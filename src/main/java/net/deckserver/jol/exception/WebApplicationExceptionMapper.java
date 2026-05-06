package net.deckserver.jol.exception;

import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

@Provider
public class WebApplicationExceptionMapper implements ExceptionMapper<WebApplicationException> {
    @Override
    public Response toResponse(WebApplicationException e) {
        int status = e.getResponse().getStatus();
        Object entity = e.getResponse().getEntity();
        String message = entity != null ? entity.toString() : e.getMessage();
        Response.Status known = Response.Status.fromStatusCode(status);
        String code = known != null ? known.name() : String.valueOf(status);
        return Response.status(status)
            .type(MediaType.APPLICATION_JSON_TYPE)
            .entity(new ErrorResponse(code, message))
            .build();
    }
}
