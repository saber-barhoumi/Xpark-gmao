FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["Maintenance/Maintenance.API/Maintenance.API.csproj", "Maintenance/Maintenance.API/"]
COPY ["Maintenance/Maintenance.Application/Maintenance.Application.csproj", "Maintenance/Maintenance.Application/"]
COPY ["Maintenance/Maintenance.Domain/Maintenance.Domain.csproj", "Maintenance/Maintenance.Domain/"]
COPY ["Maintenance/Maintenance.Infrastructure/Maintenance.Infrastructure.csproj", "Maintenance/Maintenance.Infrastructure/"]
COPY ["XparkGMAO.Shared/XparkGMAO.Shared.csproj", "XparkGMAO.Shared/"]
RUN dotnet restore "Maintenance/Maintenance.API/Maintenance.API.csproj"

COPY . .
WORKDIR "/src/Maintenance/Maintenance.API"
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "Maintenance.API.dll"]
