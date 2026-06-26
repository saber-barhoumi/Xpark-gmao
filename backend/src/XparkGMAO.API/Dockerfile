FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["XparkGMAO.API/XparkGMAO.API.csproj", "XparkGMAO.API/"]
COPY ["XparkGMAO.Application/XparkGMAO.Application.csproj", "XparkGMAO.Application/"]
COPY ["XparkGMAO.Infrastructure/XparkGMAO.Infrastructure.csproj", "XparkGMAO.Infrastructure/"]
COPY ["XparkGMAO.Core/XparkGMAO.Core.csproj", "XparkGMAO.Core/"]
RUN dotnet restore "XparkGMAO.API/XparkGMAO.API.csproj"
COPY . .
RUN dotnet publish "XparkGMAO.API/XparkGMAO.API.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 80
ENTRYPOINT ["dotnet", "XparkGMAO.API.dll"]
