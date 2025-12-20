using HotelBookingAPI.Models;
using HotelBookingAPI.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});

// Add services
builder.Services.AddScoped<IGraphAuthService, GraphAuthService>();
builder.Services.AddScoped<IBookingService, BookingService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddControllers();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");
app.MapControllers();
app.Run();
