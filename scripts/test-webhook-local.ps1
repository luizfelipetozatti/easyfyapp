# ============================================================
# Easyfy - Simular resposta WhatsApp localmente
# Envia um webhook falso para testar o fluxo de confirmação
# sem precisar da Evolution API.
#
# USO:
#   .\scripts\test-webhook-local.ps1
#   .\scripts\test-webhook-local.ps1 -Phone "5516996133004" -Text "cancelar"
# ============================================================

param(
    # Número do client no formato 5511999999999 (deve ter um booking PENDENTE no banco)
    [string]$Phone = "5516996133004",

    # Texto da resposta simulada ("sim", "cancelar", etc.)
    [string]$Text = "Sim",

    # URL local do Next.js
    [string]$AppUrl = "http://localhost:3000",

    # API Key configurada em EVOLUTION_API_KEY (deixe vazio se não usa)
    [string]$ApiKey = $env:EVOLUTION_API_KEY,

    # Nome da instância (deve bater com evolutionInstance da org no banco)
    [string]$Instance = "org-3de1e601"
)

$webhookUrl = "$AppUrl/api/webhook/whatsapp"

$body = @{
    event    = "messages.upsert"
    instance = $Instance
    data     = @{
        key     = @{
            remoteJid = "${Phone}@s.whatsapp.net"
            fromMe    = $false
            id        = "test-$(Get-Random)"
        }
        message = @{
            conversation = $Text
        }
    }
} | ConvertTo-Json -Depth 6

$headers = @{
    "Content-Type" = "application/json"
}

if ($ApiKey) {
    $headers["apikey"] = $ApiKey
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Easyfy - Teste de Webhook WhatsApp" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  URL:      $webhookUrl"
Write-Host "  Phone:    $Phone"
Write-Host "  Texto:    $Text"
Write-Host "  Instance: $Instance"
Write-Host "  ApiKey:   $(if ($ApiKey) { $ApiKey.Substring(0, [Math]::Min(6, $ApiKey.Length)) + '...' } else { '(não definida)' })"
Write-Host ""

try {
    $response = Invoke-RestMethod `
        -Uri $webhookUrl `
        -Method POST `
        -Headers $headers `
        -Body $body `
        -ErrorAction Stop

    Write-Host "✅ Resposta do servidor:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 4
    Write-Host ""
    Write-Host "Verifique os logs do Next.js para ver as linhas [Webhook]." -ForegroundColor Yellow
} catch {
    Write-Host "❌ Erro na requisição:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        Write-Host $reader.ReadToEnd()
    }
}
