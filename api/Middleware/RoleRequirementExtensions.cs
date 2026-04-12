namespace TiendaApi.Middleware;

public static class RoleRequirementExtensions
{
    public static IServiceCollection AddRolePolicies(this IServiceCollection services)
    {
        services.AddAuthorization(options =>
        {
            options.AddPolicy("RequireAdmin", policy => policy.RequireRole("ADMIN"));
        });
        return services;
    }
}
