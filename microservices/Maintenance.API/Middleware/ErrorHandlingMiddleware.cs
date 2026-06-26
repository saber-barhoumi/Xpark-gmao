using System.Net;
using System.Text.Json;

namespace Maintenance.API.Middleware;

public class ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext ctx)
    {
        try { await next(ctx); }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception on {Method} {Path}: {Message}", ctx.Request.Method, ctx.Request.Path, ex.Message);
            await HandleAsync(ctx, ex);
        }
    }

    private static Task HandleAsync(HttpContext ctx, Exception ex)
    {
        var (status, message) = ex switch
        {
            UnauthorizedAccessException => (HttpStatusCode.Unauthorized,   "Accès non autorisé."),
            KeyNotFoundException        => (HttpStatusCode.NotFound,        ex.Message),
            ArgumentException           => (HttpStatusCode.BadRequest,      ex.Message),
            InvalidOperationException   => (HttpStatusCode.Conflict,        ex.Message),
            _                          => (HttpStatusCode.InternalServerError, "Une erreur interne est survenue.")
        };

        // Never expose raw internal details (stack traces, EF model errors) to the client.
        // Only KeyNotFoundException and ArgumentException carry user-meaningful messages.
        var clientMessage = status == HttpStatusCode.InternalServerError || status == HttpStatusCode.Conflict
            ? "Une erreur interne est survenue."
            : message;

        ctx.Response.ContentType = "application/json";
        ctx.Response.StatusCode  = (int)status;
        return ctx.Response.WriteAsync(JsonSerializer.Serialize(
            new { success = false, message = clientMessage, errors = new[] { clientMessage } }));
    }
}
