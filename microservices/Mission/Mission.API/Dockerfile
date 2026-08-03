FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["Mission/Mission.API/Mission.API.csproj", "Mission/Mission.API/"]
COPY ["Mission/Mission.Application/Mission.Application.csproj", "Mission/Mission.Application/"]
COPY ["Mission/Mission.Domain/Mission.Domain.csproj", "Mission/Mission.Domain/"]
COPY ["Mission/Mission.Infrastructure/Mission.Infrastructure.csproj", "Mission/Mission.Infrastructure/"]
COPY ["XparkGMAO.Shared/XparkGMAO.Shared.csproj", "XparkGMAO.Shared/"]
COPY ["XparkGMAO.Shared.AiTelemetry/XparkGMAO.Shared.AiTelemetry.csproj", "XparkGMAO.Shared.AiTelemetry/"]
RUN dotnet restore "Mission/Mission.API/Mission.API.csproj"

COPY . .
WORKDIR "/src/Mission/Mission.API"
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
# curl : requis par le HEALTHCHECK docker-compose (absent de l'image aspnet)
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "Mission.API.dll"]
