FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["Chat/Chat.API/Chat.API.csproj", "Chat/Chat.API/"]
COPY ["Chat/Chat.Application/Chat.Application.csproj", "Chat/Chat.Application/"]
COPY ["Chat/Chat.Domain/Chat.Domain.csproj", "Chat/Chat.Domain/"]
COPY ["Chat/Chat.Infrastructure/Chat.Infrastructure.csproj", "Chat/Chat.Infrastructure/"]
COPY ["XparkGMAO.Shared/XparkGMAO.Shared.csproj", "XparkGMAO.Shared/"]
RUN dotnet restore "Chat/Chat.API/Chat.API.csproj"

COPY . .
WORKDIR "/src/Chat/Chat.API"
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "Chat.API.dll"]
