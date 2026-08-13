using System.Globalization;
using System.Text;
using Microsoft.EntityFrameworkCore;
using TiendaApi.Data;
using TiendaApi.Models;

namespace TiendaApi.Services;

public class OrderReceiptService : IOrderReceiptService
{
    private readonly AppDbContext _db;

    public OrderReceiptService(AppDbContext db) => _db = db;

    public async Task<byte[]> CreateReceiptAsync(int pedidoId, int usuarioId)
    {
        var pedido = await _db.Pedidos
            .Include(p => p.Usuario)
            .Include(p => p.Pago)
            .Include(p => p.Detalles)
            .FirstOrDefaultAsync(p => p.Id == pedidoId && p.UsuarioId == usuarioId)
            ?? throw new KeyNotFoundException("Pedido no encontrado.");

        if (pedido.Estado != EstadoPedido.Pagado || pedido.Pago?.Estado != EstadoPago.Aprobado)
            throw new InvalidOperationException("El comprobante está disponible sólo para pedidos pagados.");

        return SimplePdfDocument.Create(pedido);
    }

    internal static class SimplePdfDocument
    {
        private const float PageWidth = 595;
        private const float PageHeight = 842;
        private const float Left = 48;
        private const float Bottom = 52;
        private static readonly CultureInfo Chile = CultureInfo.GetCultureInfo("es-CL");

        public static byte[] Create(Pedido pedido)
        {
            var pages = new List<Page>();
            var page = NewPage(pages, pedido.Id);

            page.Add(Left, 748, "COMPROBANTE DE COMPRA", true, 20);
            page.Add(Left, 726, "No documento tributario", false, 10);
            page.Add(410, 748, $"Pedido #{pedido.Id}", true, 12);
            page.Add(410, 730, $"Emitido: {pedido.Pago!.FechaPago!.Value.ToLocalTime():dd/MM/yyyy HH:mm}", false, 8);
            page.Y = 688;

            AddSection(ref page, pages, pedido.Id, "Datos de la compra");
            AddLabelValue(ref page, pages, pedido.Id, "Cliente", pedido.Usuario.Nombre);
            AddLabelValue(ref page, pages, pedido.Id, "Correo", pedido.Usuario.Email);
            AddLabelValue(ref page, pages, pedido.Id, "Fecha del pedido", pedido.FechaCreacion.ToLocalTime().ToString("dd/MM/yyyy HH:mm", Chile));
            AddLabelValue(ref page, pages, pedido.Id, "Estado", "Pagado");
            AddLabelValue(ref page, pages, pedido.Id, "Medio de pago", FriendlyGateway(pedido.Gateway));
            AddLabelValue(ref page, pages, pedido.Id, "Referencia", pedido.Pago.ReferenciaPago ?? "No disponible");

            AddSection(ref page, pages, pedido.Id, "Detalle del pedido");
            AddLine(ref page, pages, pedido.Id, "Producto", true, 9);
            foreach (var item in pedido.Detalles)
            {
                foreach (var line in Wrap(item.ProductoNombre, 66))
                    AddLine(ref page, pages, pedido.Id, line, false, 10);
                AddLine(ref page, pages, pedido.Id,
                    $"{item.Cantidad} x {Money(item.PrecioUnitario),14}   Subtotal: {Money(item.PrecioUnitario * item.Cantidad),14}", false, 9);
                page.Y -= 4;
            }

            EnsureSpace(ref page, pages, pedido.Id, 64);
            page.Add(330, page.Y, "TOTAL PAGADO", true, 11);
            page.Add(465, page.Y, Money(pedido.Total), true, 13);
            page.Y -= 36;
            AddLine(ref page, pages, pedido.Id,
                "Conserva este comprobante como respaldo de tu compra.", false, 9);

            return Build(pages);
        }

        private static Page NewPage(List<Page> pages, int pedidoId)
        {
            var page = new Page();
            page.Add(Left, 806, $"Comprobante de compra - Pedido #{pedidoId}", true, 9);
            page.Add(Left, 792, "Bazaar", false, 8);
            page.Add(Left, 782, new string('-', 82), false, 7);
            page.Y = 752;
            pages.Add(page);
            return page;
        }

        private static void AddSection(ref Page page, List<Page> pages, int pedidoId, string title)
        {
            EnsureSpace(ref page, pages, pedidoId, 34);
            page.Add(Left, page.Y, title, true, 12);
            page.Y -= 22;
        }

        private static void AddLabelValue(ref Page page, List<Page> pages, int pedidoId, string label, string value)
        {
            foreach (var line in Wrap(value, 56))
            {
                EnsureSpace(ref page, pages, pedidoId, 16);
                page.Add(Left, page.Y, line == value || value.StartsWith(line, StringComparison.Ordinal) ? $"{label}:" : string.Empty, true, 9);
                page.Add(145, page.Y, line, false, 9);
                page.Y -= 15;
                label = string.Empty;
            }
        }

        private static void AddLine(ref Page page, List<Page> pages, int pedidoId, string text, bool bold, float size)
        {
            EnsureSpace(ref page, pages, pedidoId, 16);
            page.Add(Left, page.Y, text, bold, size);
            page.Y -= 15;
        }

        private static void EnsureSpace(ref Page page, List<Page> pages, int pedidoId, float needed)
        {
            if (page.Y - needed >= Bottom) return;
            page = NewPage(pages, pedidoId);
        }

        private static IEnumerable<string> Wrap(string text, int width)
        {
            var words = (text ?? string.Empty).Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (words.Length == 0) return new[] { "-" };
            var lines = new List<string>();
            var line = string.Empty;
            foreach (var word in words)
            {
                var candidate = string.IsNullOrEmpty(line) ? word : $"{line} {word}";
                if (candidate.Length <= width)
                {
                    line = candidate;
                    continue;
                }
                if (!string.IsNullOrEmpty(line)) lines.Add(line);
                line = word;
            }
            if (!string.IsNullOrEmpty(line)) lines.Add(line);
            return lines;
        }

        private static string Money(decimal value) => $"${value.ToString("N0", Chile)}";
        private static string FriendlyGateway(string gateway) => gateway.Equals("mercadopago", StringComparison.OrdinalIgnoreCase) ? "Mercado Pago" : "Transbank Webpay";

        private static byte[] Build(List<Page> pages)
        {
            var objects = new List<byte[]> { Array.Empty<byte>() };
            objects.Add(Ascii("<< /Type /Catalog /Pages 2 0 R >>"));
            var pageRefs = string.Join(" ", Enumerable.Range(0, pages.Count).Select(i => $"{5 + i * 2} 0 R"));
            objects.Add(Ascii($"<< /Type /Pages /Kids [{pageRefs}] /Count {pages.Count} >>"));
            objects.Add(Ascii("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"));
            objects.Add(Ascii("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"));

            foreach (var page in pages)
            {
                var content = Latin1(page.Content.ToString());
                var pageNumber = objects.Count;
                objects.Add(Ascii($"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {PageWidth} {PageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents {pageNumber + 1} 0 R >>"));
                objects.Add(Concat(Ascii($"<< /Length {content.Length} >>\nstream\n"), content, Ascii("\nendstream")));
            }

            using var stream = new MemoryStream();
            stream.Write(Ascii("%PDF-1.4\n%\u00e2\u00e3\u00cf\u00d3\n"));
            var offsets = new List<long> { 0 };
            for (var i = 1; i < objects.Count; i++)
            {
                offsets.Add(stream.Position);
                stream.Write(Ascii($"{i} 0 obj\n"));
                stream.Write(objects[i]);
                stream.Write(Ascii("\nendobj\n"));
            }
            var xref = stream.Position;
            stream.Write(Ascii($"xref\n0 {objects.Count}\n0000000000 65535 f \n"));
            for (var i = 1; i < offsets.Count; i++)
                stream.Write(Ascii($"{offsets[i]:D10} 00000 n \n"));
            stream.Write(Ascii($"trailer\n<< /Size {objects.Count} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF"));
            return stream.ToArray();
        }

        private sealed class Page
        {
            public StringBuilder Content { get; } = new();
            public float Y { get; set; }
            public void Add(float x, float y, string text, bool bold, float size) =>
                Content.AppendFormat(CultureInfo.InvariantCulture, "BT /F{0} {1:0.##} Tf {2:0.##} {3:0.##} Td ({4}) Tj ET\n", bold ? 2 : 1, size, x, y, Escape(text));
        }

        private static string Escape(string value) => string.Concat((value ?? string.Empty)
            .Select(c => c <= 255 ? c : '?'))
            .Replace("\\", "\\\\", StringComparison.Ordinal)
            .Replace("(", "\\(", StringComparison.Ordinal)
            .Replace(")", "\\)", StringComparison.Ordinal)
            .Replace("\r", " ", StringComparison.Ordinal)
            .Replace("\n", " ", StringComparison.Ordinal);
        private static byte[] Ascii(string value) => Encoding.ASCII.GetBytes(value);
        private static byte[] Latin1(string value) => Encoding.Latin1.GetBytes(value);
        private static byte[] Concat(params byte[][] chunks) => chunks.SelectMany(c => c).ToArray();
    }
}
