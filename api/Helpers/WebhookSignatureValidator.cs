using System.Security.Cryptography;
using System.Text;

namespace TiendaApi.Helpers;

public static class WebhookSignatureValidator
{
    public static bool Validate(string? signature, string? requestId, string? dataId, string? secret)
    {
        if (string.IsNullOrWhiteSpace(secret) || string.IsNullOrWhiteSpace(signature) || string.IsNullOrWhiteSpace(dataId))
            return false;

        string? timestamp = null;
        string? receivedHash = null;
        foreach (var part in signature.Split(','))
        {
            var pair = part.Split('=', 2);
            if (pair.Length != 2) continue;
            if (pair[0].Trim() == "ts") timestamp = pair[1].Trim();
            if (pair[0].Trim() == "v1") receivedHash = pair[1].Trim();
        }

        if (string.IsNullOrWhiteSpace(timestamp) || string.IsNullOrWhiteSpace(receivedHash) ||
            !long.TryParse(timestamp, out var timestampValue))
            return false;

        var age = Math.Abs(DateTimeOffset.UtcNow.ToUnixTimeSeconds() - timestampValue);
        if (age > TimeSpan.FromMinutes(10).TotalSeconds)
            return false;

        var manifest = $"id:{dataId};";
        if (!string.IsNullOrWhiteSpace(requestId)) manifest += $"request-id:{requestId};";
        manifest += $"ts:{timestamp};";

        var expected = Convert.ToHexString(HMACSHA256.HashData(
            Encoding.UTF8.GetBytes(secret), Encoding.UTF8.GetBytes(manifest))).ToLowerInvariant();
        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(expected), Encoding.UTF8.GetBytes(receivedHash.ToLowerInvariant()));
    }
}
