using Microsoft.AspNetCore.Hosting;

namespace TiendaApi.Services.Storage;

public class LocalStorageService : IStorageService
{
    private readonly string _basePath;
    private readonly string _baseUrl;

    public LocalStorageService(IConfiguration configuration, IWebHostEnvironment env)
    {
        var configuredPath = configuration["Storage:LocalPath"];
        _basePath = string.IsNullOrWhiteSpace(configuredPath)
            ? Path.Combine(env.WebRootPath ?? env.ContentRootPath, "uploads")
            : configuredPath;

        _baseUrl = "/uploads";
    }

    public async Task<string> UploadAsync(IFormFile file, string folder = "productos")
    {
        var folderPath = Path.Combine(_basePath, folder);
        Directory.CreateDirectory(folderPath);

        var extension = Path.GetExtension(file.FileName);
        var filename = $"{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(folderPath, filename);

        using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);

        return $"{_baseUrl}/{folder}/{filename}";
    }

    public Task DeleteAsync(string url)
    {
        if (string.IsNullOrWhiteSpace(url))
            return Task.CompletedTask;

        try
        {
            // Convert relative URL to file path
            // url format: /uploads/{folder}/{filename}
            var relativePath = url.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
            var uploadsDir = "uploads" + Path.DirectorySeparatorChar;
            string filePath;

            if (relativePath.StartsWith(uploadsDir, StringComparison.OrdinalIgnoreCase))
            {
                var subPath = relativePath[uploadsDir.Length..];
                filePath = Path.Combine(_basePath, subPath);
            }
            else
            {
                filePath = Path.Combine(_basePath, relativePath);
            }

            if (File.Exists(filePath))
                File.Delete(filePath);
        }
        catch
        {
            // Ignore file deletion errors
        }

        return Task.CompletedTask;
    }
}
