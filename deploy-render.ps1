# Script de déploiement Render.com pour Divorce Platform
# Usage: .\deploy-render.ps1

$apiKey = "rnd_1ZYZvILGTAVanCuP521vCuVLARya"
$repoUrl = "https://github.com/SO2304/legaltech"
$branch = "main"

$headers = @{
    "Authorization" = "Bearer $apiKey"
    "Content-Type" = "application/json"
}

Write-Host "🚀 Déploiement Divorce Platform sur Render.com" -ForegroundColor Green
Write-Host "Clé API : $($apiKey.Substring(0,10))..."
Write-Host "Repo : $repoUrl"
Write-Host "Branch : $branch`n"

# Créer le service via l'API Render
$serviceData = @{
    name = "divorce-platform"
    type = "web"
    runtime = "node"
    plan = "starter"
    region = "frankfurt"
    buildCommand = "npm install && npx prisma generate && npm run build"
    startCommand = "npm start"
    healthCheckPath = "/api/health"
    repo = $repoUrl
    branch = $branch
    envVars = @(
        @{ key = "NODE_ENV"; value = "production" }
        @{ key = "DATABASE_URL"; value = "" }
        @{ key = "DIRECT_DATABASE_URL"; value = "" }
        @{ key = "ANTHROPIC_API_KEY"; value = "" }
        @{ key = "STRIPE_SECRET_KEY"; value = "" }
        @{ key = "STRIPE_WEBHOOK_SECRET"; value = "" }
        @{ key = "SUPABASE_URL"; value = "" }
        @{ key = "SUPABASE_SERVICE_KEY"; value = "" }
        @{ key = "SUPABASE_ANON_KEY"; value = "" }
        @{ key = "CRON_SECRET"; value = "" }
        @{ key = "NEXT_PUBLIC_APP_URL"; value = "https://divorce-platform.onrender.com" }
        @{ key = "RESEND_API_KEY"; value = "" }
    )
} | ConvertTo-Json -Depth 10

Write-Host "📝 Configuration du service :"
Write-Host $serviceData | ConvertFrom-Json | Format-Table | Out-String

Write-Host "`n⚠️  INSTRUCTIONS DE DÉPLOIEMENT :" -ForegroundColor Yellow
Write-Host "`n1️⃣  Allez sur https://dashboard.render.com"
Write-Host "`n2️⃣  Connectez votre compte GitHub"
Write-Host "`n3️⃣  Cliquez sur 'New +' → 'Web Service'"
Write-Host "`n4️⃣  Sélectionnez le repo : SO2304/legaltech"
Write-Host "`n5️⃣  Configurez comme suit :"
Write-Host "    - Name: divorce-platform"
Write-Host "    - Runtime: Node"
Write-Host "    - Build Command: npm install && npx prisma generate && npm run build"
Write-Host "    - Start Command: npm start"
Write-Host "    - Plan: Starter"
Write-Host "    - Region: Frankfurt"
Write-Host "`n6️⃣  Ajoutez les variables d'environnement (voir .env.example)"
Write-Host "`n7️⃣  Cliquez sur 'Create Web Service'"
Write-Host "`n8️⃣  Render détectera render.yaml et créera aussi le cron job RGPD"

Write-Host "`n✅ Une fois créé, le service se redéploiera automatiquement à chaque push sur main"
