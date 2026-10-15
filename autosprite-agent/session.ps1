$secret = Read-Host 'Chiave API AutoSprite (input nascosto)' -AsSecureString
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
try {
    $env:AUTOSPRITE_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
}
Remove-Variable secret, pointer
Write-Host 'Chiave impostata per questa sessione PowerShell. Verifica: node autosprite-agent/cli.mjs account'
