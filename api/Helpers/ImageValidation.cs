using Microsoft.AspNetCore.Http;

namespace TiendaApi.Helpers;

public static class ImageValidation
{
    public const long MaxBytes = 5 * 1024 * 1024;

    public static async Task<string> ValidateAsync(IFormFile file)
    {
        if (file.Length <= 0 || file.Length > MaxBytes)
            throw new InvalidOperationException("La imagen debe pesar entre 1 byte y 5 MB.");

        var contentType = file.ContentType.ToLowerInvariant();
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        var allowed = new Dictionary<string, string[]>
        {
            ["image/jpeg"] = [".jpg", ".jpeg"],
            ["image/png"] = [".png"],
            ["image/gif"] = [".gif"],
            ["image/webp"] = [".webp"]
        };

        if (!allowed.TryGetValue(contentType, out var allowedExtensions) || !allowedExtensions.Contains(extension))
            throw new InvalidOperationException("Solo se permiten imágenes JPG, PNG, GIF o WebP.");

        await using var stream = file.OpenReadStream();
        var header = new byte[12];
        var read = await stream.ReadAsync(header.AsMemory(0, header.Length));

        var validSignature = contentType switch
        {
            "image/jpeg" => read >= 3 && header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF,
            "image/png" => read >= 8 && header.AsSpan(0, 8).SequenceEqual(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A }),
            "image/gif" => read >= 6 && (header.AsSpan(0, 6).SequenceEqual("GIF87a"u8) || header.AsSpan(0, 6).SequenceEqual("GIF89a"u8)),
            "image/webp" => read >= 12 && header.AsSpan(0, 4).SequenceEqual("RIFF"u8) && header.AsSpan(8, 4).SequenceEqual("WEBP"u8),
            _ => false
        };

        if (!validSignature)
            throw new InvalidOperationException("El contenido de la imagen no es válido.");

        return extension;
    }
}
