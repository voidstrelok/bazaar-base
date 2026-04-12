using System.Text;
using System.Text.RegularExpressions;

namespace TiendaApi.Helpers;

public static class SlugHelper
{
    public static string Generate(string text)
    {
        // Normalize to decomposed form to separate base characters from diacritics
        var normalized = text.Normalize(NormalizationForm.FormD);

        var sb = new StringBuilder();
        foreach (var c in normalized)
        {
            var category = System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c);
            if (category != System.Globalization.UnicodeCategory.NonSpacingMark)
                sb.Append(c);
        }

        var slug = sb.ToString().Normalize(NormalizationForm.FormC).ToLowerInvariant();

        // Replace spaces (and other whitespace) with hyphens
        slug = Regex.Replace(slug, @"\s+", "-");

        // Remove characters that are not alphanumeric or hyphens
        slug = Regex.Replace(slug, @"[^a-z0-9\-]", "");

        // Collapse multiple consecutive hyphens
        slug = Regex.Replace(slug, @"-{2,}", "-");

        return slug.Trim('-');
    }
}
