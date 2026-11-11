<#
.SYNOPSIS
  Resets the deployed Azure SQL database: drops every table, then recreates the
  schema from the EF Core migrations. ALL DATA IS DELETED and cannot be recovered.

.DESCRIPTION
  1. Adds a temporary firewall rule for this PC's public IP.
  2. Reads the connection string from the API web app (never printed).
  3. Runs `dotnet ef database update 0` (reverts all migrations = drops tables),
     then `dotnet ef database update` (recreates the empty schema).
  4. Removes the firewall rule, even if a step fails.

  The database itself is NOT dropped, so its free-offer settings are kept.
  Locations are re-added automatically at the next login; bill numbers restart at 1.

  Needs: Azure CLI signed in (`az login`), the .NET SDK, and the dotnet-ef global tool
  (`dotnet tool install --global dotnet-ef`). Run it from anywhere.

.EXAMPLE
  ./scripts/reset-azure-db.ps1          # asks you to type RESET first
  ./scripts/reset-azure-db.ps1 -Yes     # no prompt
#>
[CmdletBinding()]
param(
    [string]$ResourceGroup = 'rg-purchase-bill',
    [string]$SqlServer = 'purchasebill-sql-7p16h',
    [string]$WebApp = 'purchasebill-api-7p16h',
    [switch]$Yes
)

$ErrorActionPreference = 'Stop'
$apiProject = Join-Path $PSScriptRoot '..\backend\src\PurchaseBill.Api' | Resolve-Path
$ruleName = 'ResetDbTmp'

if (-not $Yes) {
    Write-Host "This deletes ALL data in the database on '$SqlServer' and recreates the empty schema." -ForegroundColor Yellow
    if ((Read-Host "Type RESET to continue") -cne 'RESET') { Write-Host 'Cancelled.'; exit 1 }
}

foreach ($tool in 'az', 'dotnet') {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) { throw "'$tool' is not on PATH." }
}
$env:PATH += [IO.Path]::PathSeparator + (Join-Path $HOME '.dotnet/tools')

$ip = (Invoke-RestMethod 'https://api.ipify.org').Trim()
Write-Host "Adding temporary firewall rule for $ip ..."
az sql server firewall-rule create -g $ResourceGroup -s $SqlServer -n $ruleName `
    --start-ip-address $ip --end-ip-address $ip -o none
if ($LASTEXITCODE) { throw 'Could not add the firewall rule (are you signed in with az login?).' }

$savedCs = $env:ConnectionStrings__Default
$savedEnv = $env:ASPNETCORE_ENVIRONMENT
try {
    $cs = az webapp config connection-string list -n $WebApp -g $ResourceGroup `
        --query "[?name=='Default'].value | [0]" -o tsv
    if (-not $cs) { throw "No 'Default' connection string on web app '$WebApp'." }

    # Development loads the Jwt:Key from user-secrets so the host can start;
    # the connection string from the environment overrides the local one.
    $env:ConnectionStrings__Default = $cs
    $env:ASPNETCORE_ENVIRONMENT = 'Development'

    Push-Location $apiProject
    try {
        Write-Host 'Dropping all tables (reverting migrations) ...'
        dotnet ef database update 0
        if ($LASTEXITCODE) { throw 'Reverting migrations failed. If the database was paused, wait a minute and run again.' }

        Write-Host 'Recreating the schema ...'
        dotnet ef database update
        if ($LASTEXITCODE) { throw 'Re-applying migrations failed. Run the script again to finish.' }
    }
    finally { Pop-Location }

    Write-Host 'Done: the database is empty with the current schema.' -ForegroundColor Green
}
finally {
    $env:ConnectionStrings__Default = $savedCs
    $env:ASPNETCORE_ENVIRONMENT = $savedEnv
    Write-Host 'Removing the temporary firewall rule ...'
    az sql server firewall-rule delete -g $ResourceGroup -s $SqlServer -n $ruleName -o none
}
