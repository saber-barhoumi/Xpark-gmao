FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["Finance/Finance.API/Finance.API.csproj", "Finance/Finance.API/"]
COPY ["Finance/Finance.Application/Finance.Application.csproj", "Finance/Finance.Application/"]
COPY ["Finance/Finance.Domain/Finance.Domain.csproj", "Finance/Finance.Domain/"]
COPY ["Finance/Finance.Infrastructure/Finance.Infrastructure.csproj", "Finance/Finance.Infrastructure/"]
COPY ["XparkGMAO.Shared/XparkGMAO.Shared.csproj", "XparkGMAO.Shared/"]
RUN dotnet restore "Finance/Finance.API/Finance.API.csproj"

COPY . .
WORKDIR "/src/Finance/Finance.API"
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "Finance.API.dll"]
