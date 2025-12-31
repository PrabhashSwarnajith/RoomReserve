using HotelBookingAPI.Models;
using HotelBookingAPI.Services;

var builder = WebApplication.CreateBuilder(args);

// CORS Configuration
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policyBuilder =>
    {
        policyBuilder.AllowAnyOrigin()
                     .AllowAnyMethod()
                     .AllowAnyHeader();
    });
});

// Services Registration
builder.Services.AddHttpClient<IServiceAccountDelegationService, ServiceAccountDelegationService>();
builder.Services.AddScoped<IBookingService, BookingService>();

// API Configuration
builder.Services.AddControllers();
builder.Services.AddSwaggerGen();
builder.Services.AddLogging();

var app = builder.Build();

// Middleware Configuration
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");
app.MapControllers();

app.Run();

