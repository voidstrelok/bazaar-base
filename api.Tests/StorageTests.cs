using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using TiendaApi.Services.Storage;
using Xunit;

namespace TiendaApi.Tests;

public class StorageTests
{
    [Fact]
    public async Task LocalStoragePuedeSubirYEliminarLaImagenGenerada()
    {
        var root = Path.Combine(Path.GetTempPath(), "bazaar-storage-tests", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(root);

        try
        {
            var configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["Storage:LocalPath"] = root
                })
                .Build();
            var storage = new LocalStorageService(configuration, new TestWebHostEnvironment(root));
            await using var stream = new MemoryStream(
                [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
            var file = new FormFile(stream, 0, stream.Length, "imagen", "imagen.png")
            {
                Headers = new HeaderDictionary(),
                ContentType = "image/png"
            };

            var url = await storage.UploadAsync(file, "productos");
            var storedFile = Directory.GetFiles(Path.Combine(root, "productos")).Single();

            Assert.StartsWith("/uploads/productos/", url);
            Assert.True(File.Exists(storedFile));

            await storage.DeleteAsync(url);

            Assert.False(File.Exists(storedFile));
        }
        finally
        {
            if (Directory.Exists(root))
                Directory.Delete(root, recursive: true);
        }
    }

    private sealed class TestWebHostEnvironment(string root) : IWebHostEnvironment
    {
        public string ApplicationName { get; set; } = "TiendaApi.Tests";
        public string EnvironmentName { get; set; } = "Test";
        public string WebRootPath { get; set; } = root;
        public IFileProvider WebRootFileProvider { get; set; } = new NullFileProvider();
        public string ContentRootPath { get; set; } = root;
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
