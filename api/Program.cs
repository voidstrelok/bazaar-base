var builder = WebApplication.CreateBuilder(args);

// ── Services ────────────────────────────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// TODO Fase 1 — Registrar servicios de autenticación JWT y roles
// builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
//     .AddJwtBearer(options => { ... });
// builder.Services.AddAuthorization();

// TODO Fase 2 — Registrar DbContext con EF Core + SQL Server
// builder.Services.AddDbContext<TiendaDbContext>(options =>
//     options.UseSqlServer(builder.Configuration.GetConnectionString("Default")));

// TODO Fase 2 — Registrar servicio de Storage (Cloudinary / Local)
// builder.Services.AddScoped<IStorageService, CloudinaryStorageService>();

// TODO Fase 4 — Registrar pasarela de pagos (Transbank / MercadoPago)
// builder.Services.AddScoped<IPaymentGateway, TransbankGateway>();

// ── Build ────────────────────────────────────────────────────────────────────
var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// TODO Fase 1 — Habilitar middleware de autenticación y autorización
// app.UseAuthentication();
// app.UseAuthorization();

app.MapControllers();

app.Run();
