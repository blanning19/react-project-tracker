# dump_for_review.ps1
# Run from: C:\_code\react-project-tracker

$extensions = @("*.ts", "*.tsx", "*.py", "*.json", "*.md", "*.env.example", "*.cfg", "*.toml", "*.txt")

$excludeDirs = @(
    "node_modules", "__pycache__", ".git", "dist", "docs",
    "venv", ".venv", "env", "migrations", "coverage", ".pytest_cache"
)

$excludeFiles = @(
    "package-lock.json", "*.min.js", "*.module.css",
    "*.lock", "db.sqlite3"
)

function Should-Exclude($path) {
    foreach ($dir in $excludeDirs) {
        if ($path -match [regex]::Escape($dir)) { return $true }
    }
    foreach ($file in $excludeFiles) {
        if ($path -like "*$file") { return $true }
    }
    return $false
}

$output = ""
foreach ($ext in $extensions) {
    Get-ChildItem -Recurse -Filter $ext -ErrorAction SilentlyContinue | ForEach-Object {
        if (-not (Should-Exclude $_.FullName)) {
            $rel = $_.FullName.Replace((Get-Location).Path + "\", "")
            $output += "===== $rel =====`r`n"
            $output += (Get-Content $_.FullName -Raw -Encoding UTF8 -ErrorAction SilentlyContinue)
            $output += "`r`n`r`n"
        }
    }
}

$output | Out-File -FilePath "dump_for_review.txt" -Encoding UTF8
Write-Host "Done. Size: $([math]::Round((Get-Item dump_for_review.txt).Length / 1MB, 2)) MB"