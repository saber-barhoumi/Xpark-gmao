FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["PredictionPanne/PredictionPanne.API/PredictionPanne.API.csproj", "PredictionPanne/PredictionPanne.API/"]
COPY ["PredictionPanne/PredictionPanne.Application/PredictionPanne.Application.csproj", "PredictionPanne/PredictionPanne.Application/"]
COPY ["PredictionPanne/PredictionPanne.Domain/PredictionPanne.Domain.csproj", "PredictionPanne/PredictionPanne.Domain/"]
COPY ["PredictionPanne/PredictionPanne.Infrastructure/PredictionPanne.Infrastructure.csproj", "PredictionPanne/PredictionPanne.Infrastructure/"]
COPY ["XparkGMAO.Shared/XparkGMAO.Shared.csproj", "XparkGMAO.Shared/"]
RUN dotnet restore "PredictionPanne/PredictionPanne.API/PredictionPanne.API.csproj"

COPY . .
WORKDIR "/src/PredictionPanne/PredictionPanne.API"
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "PredictionPanne.API.dll"]
