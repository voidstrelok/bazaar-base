using Microsoft.AspNetCore.Http;
using System.Security.Cryptography;
using System.Text;
using TiendaApi.Helpers;
using Xunit;

namespace TiendaApi.Tests;

public class HelpersTests
{
    [Theory]
    [InlineData("12.345.678-5")]
    [InlineData("12345678-5")]
    public void RutValido(string rut)
    {
        Assert.True(RutHelper.Validar(rut));
    }

    [Theory]
    [InlineData("12.345.678-6")]
    [InlineData("123")]
    [InlineData("")]
    public void RutInvalido(string rut)
    {
        Assert.False(RutHelper.Validar(rut));
    }

    [Fact]
    public void SlugEliminaAcentosYCaracteresPeligrosos()
    {
        Assert.Equal("camara-accion-4k", SlugHelper.Generate("Cámara / Acción 4K"));
    }

    [Fact]
    public async Task ImagenFalsaEsRechazada()
    {
        await using var stream = new MemoryStream("not-an-image"u8.ToArray());
        var file = new FormFile(stream, 0, stream.Length, "imagen", "imagen.png")
        {
            Headers = new HeaderDictionary(),
            ContentType = "image/png"
        };

        await Assert.ThrowsAsync<InvalidOperationException>(() => ImageValidation.ValidateAsync(file));
    }

    [Fact]
    public void WebhookValidaFirmaMercadoPago()
    {
        const string secret = "test-secret";
        const string dataId = "123456";
        const string requestId = "request-1";
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
        var manifest = $"id:{dataId};request-id:{requestId};ts:{timestamp};";
        var hash = Convert.ToHexString(HMACSHA256.HashData(
            Encoding.UTF8.GetBytes(secret), Encoding.UTF8.GetBytes(manifest))).ToLowerInvariant();

        Assert.True(WebhookSignatureValidator.Validate(
            $"ts={timestamp},v1={hash}", requestId, dataId, secret));
        Assert.False(WebhookSignatureValidator.Validate(
            $"ts={timestamp},v1=invalid", requestId, dataId, secret));
    }
}
