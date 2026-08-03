FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["Alerts/Alerts.API/Alerts.API.csproj", "Alerts/Alerts.API/"]
COPY ["Alerts/Alerts.Application/Alerts.Application.csproj", "Alerts/Alerts.Application/"]
COPY ["Alerts/Alerts.Domain/Alerts.Domain.csproj", "Alerts/Alerts.Domain/"]
COPY ["Alerts/Alerts.Infrastructure/Alerts.Infrastructure.csproj", "Alerts/Alerts.Infrastructure/"]
COPY ["XparkGMAO.Shared/XparkGMAO.Shared.csproj", "XparkGMAO.Shared/"]
RUN dotnet restore "Alerts/Alerts.API/Alerts.API.csproj"

COPY . .
WORKDIR "/src/Alerts/Alerts.API"
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
# curl : requis par le HEALTHCHECK docker-compose (absent de l'image aspnet)
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "Alerts.API.dll"]
