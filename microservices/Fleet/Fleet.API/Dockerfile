FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Restore par couche (cache Docker optimal)
COPY ["Fleet/Fleet.API/Fleet.API.csproj", "Fleet/Fleet.API/"]
COPY ["Fleet/Fleet.Application/Fleet.Application.csproj", "Fleet/Fleet.Application/"]
COPY ["Fleet/Fleet.Domain/Fleet.Domain.csproj", "Fleet/Fleet.Domain/"]
COPY ["Fleet/Fleet.Infrastructure/Fleet.Infrastructure.csproj", "Fleet/Fleet.Infrastructure/"]
COPY ["XparkGMAO.Shared/XparkGMAO.Shared.csproj", "XparkGMAO.Shared/"]
RUN dotnet restore "Fleet/Fleet.API/Fleet.API.csproj"

COPY . .
WORKDIR "/src/Fleet/Fleet.API"
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
# curl : requis par le HEALTHCHECK docker-compose (absent de l'image aspnet)
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "Fleet.API.dll"]
