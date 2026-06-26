# Intégration Services IA

Les services IA sont développés séparément avec Flask/FastAPI Python.

## Endpoints Flask/FastAPI à appeler :

- POST http://localhost:5001/api/prix/calculate
- POST http://localhost:5001/api/predictions/panne
- POST http://localhost:5001/api/optimisation/flotte

## Configuration :

Dans appsettings.json :
```json
{
  "AISettings": {
    "ServiceUrl": "http://localhost:5001",
    "ApiKey": "your-api-key",
    "Timeout": 30
  }
}
```

## Appel depuis le backend .NET :

```csharp
public class AIIntegrationService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _config;
    
    public AIIntegrationService(HttpClient httpClient, IConfiguration config)
    {
        _httpClient = httpClient;
        _config = config;
        _httpClient.BaseAddress = new Uri(_config["AISettings:ServiceUrl"]);
    }
    
    public async Task<double> CalculerPrixTrajetAsync(TrajetRequest request)
    {
        var response = await _httpClient.PostAsJsonAsync("/api/prix/calculate", request);
        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<TrajetResponse>();
        return result.PrixEstime;
    }
}
```
