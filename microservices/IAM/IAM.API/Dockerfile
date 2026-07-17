FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Restore par couche (cache Docker optimal : les csproj changent rarement)
COPY ["IAM/IAM.API/IAM.API.csproj", "IAM/IAM.API/"]
COPY ["IAM/IAM.Application/IAM.Application.csproj", "IAM/IAM.Application/"]
COPY ["IAM/IAM.Domain/IAM.Domain.csproj", "IAM/IAM.Domain/"]
COPY ["IAM/IAM.Infrastructure/IAM.Infrastructure.csproj", "IAM/IAM.Infrastructure/"]
COPY ["XparkGMAO.Shared/XparkGMAO.Shared.csproj", "XparkGMAO.Shared/"]
RUN dotnet restore "IAM/IAM.API/IAM.API.csproj"

COPY . .
WORKDIR "/src/IAM/IAM.API"
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "IAM.API.dll"]
