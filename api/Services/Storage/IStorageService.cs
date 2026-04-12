namespace TiendaApi.Services.Storage;

public interface IStorageService
{
    Task<string> UploadAsync(IFormFile file, string folder = "productos");
    Task DeleteAsync(string url);
}
