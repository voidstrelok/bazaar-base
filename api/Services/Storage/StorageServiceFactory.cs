namespace TiendaApi.Services.Storage;

public static class StorageServiceFactory
{
    public static void AddStorageService(this IServiceCollection services, IConfiguration config)
    {
        var provider = (config["Storage:Provider"] ?? "local").Trim().ToLowerInvariant();
        if (provider == "cloudinary")
            services.AddScoped<IStorageService, CloudinaryStorageService>();
        else
            services.AddScoped<IStorageService, LocalStorageService>();
    }
}
