using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

namespace TiendaApi.Services.Storage;

public class CloudinaryStorageService : IStorageService
{
    private readonly Cloudinary _cloudinary;

    public CloudinaryStorageService(IConfiguration configuration)
    {
        var cloudinaryUrl = configuration["CLOUDINARY_URL"]
            ?? throw new InvalidOperationException("CLOUDINARY_URL is not configured.");
        _cloudinary = new Cloudinary(cloudinaryUrl);
        _cloudinary.Api.Secure = true;
    }

    public async Task<string> UploadAsync(IFormFile file, string folder = "productos")
    {
        using var stream = file.OpenReadStream();
        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(file.FileName, stream),
            Folder = folder,
            UseFilename = false,
            UniqueFilename = true
        };

        var result = await _cloudinary.UploadAsync(uploadParams);

        if (result.Error is not null)
            throw new InvalidOperationException($"Cloudinary upload error: {result.Error.Message}");

        return result.SecureUrl.ToString();
    }

    public async Task DeleteAsync(string url)
    {
        if (string.IsNullOrWhiteSpace(url))
            return;

        var publicId = ExtractPublicId(url);
        if (string.IsNullOrWhiteSpace(publicId))
            return;

        var deleteParams = new DeletionParams(publicId);
        await _cloudinary.DestroyAsync(deleteParams);
    }

    private static string ExtractPublicId(string url)
    {
        // Cloudinary URL format: https://res.cloudinary.com/{cloud}/image/upload/v{version}/{folder}/{name}.{ext}
        try
        {
            var uri = new Uri(url);
            var segments = uri.AbsolutePath.Split('/');
            // Find "upload" segment index
            var uploadIndex = Array.IndexOf(segments, "upload");
            if (uploadIndex < 0 || uploadIndex + 2 >= segments.Length)
                return string.Empty;

            // Skip the version segment (v12345) if present
            var startIndex = uploadIndex + 1;
            if (startIndex < segments.Length &&
                segments[startIndex].Length > 1 &&
                segments[startIndex].StartsWith("v") &&
                int.TryParse(segments[startIndex][1..], out _))
            {
                startIndex++;
            }

            var pathWithExt = string.Join("/", segments[startIndex..]);
            // Remove file extension
            var dotIndex = pathWithExt.LastIndexOf('.');
            return dotIndex >= 0 ? pathWithExt[..dotIndex] : pathWithExt;
        }
        catch
        {
            return string.Empty;
        }
    }
}
