using System.Text.RegularExpressions;

namespace TiendaApi.Helpers;

public static class RutHelper
{
    /// <summary>
    /// Valida un RUT chileno usando el algoritmo módulo 11.
    /// Acepta formatos: "12.345.678-9", "12345678-9", "123456789".
    /// </summary>
    public static bool Validar(string? rut)
    {
        if (string.IsNullOrWhiteSpace(rut))
            return false;

        // Eliminar puntos, recortar y convertir a mayúsculas
        var cleaned = rut.Replace(".", "").Trim().ToUpper();

        // Normalizar sin guión (ej: "123456789" → "12345678-9")
        if (!cleaned.Contains('-') && cleaned.Length >= 2)
            cleaned = cleaned[..^1] + "-" + cleaned[^1];

        var match = Regex.Match(cleaned, @"^(\d{7,8})-([\dK])$");
        if (!match.Success)
            return false;

        var digits = match.Groups[1].Value;
        var dv     = match.Groups[2].Value;

        int sum        = 0;
        int multiplier = 2;
        for (int i = digits.Length - 1; i >= 0; i--)
        {
            sum        += (digits[i] - '0') * multiplier;
            multiplier  = multiplier == 7 ? 2 : multiplier + 1;
        }

        int    remainder = 11 - (sum % 11);
        string expected  = remainder == 11 ? "0" : remainder == 10 ? "K" : remainder.ToString();

        return dv == expected;
    }
}
