param(
    [string]$ProjectRoot = ".",
    [string]$OutputFile = "code-review-dump.txt"
)

$ErrorActionPreference = "Stop"

# -----------------------------------------------------------------------------
# Files requested for the schema contract audit.
# Paths are relative to the project root you pass to -ProjectRoot.
# -----------------------------------------------------------------------------
$FilesToDump = @(
    "frontend\src\features\projects\models\project.types.ts",
    "frontend\src\features\projects\models\project.api.ts",
    "frontend\src\features\projects\shared\projectFormConfig.ts",
    "frontend\src\features\projects\shared\useProjectFormController.ts",
    "frontend\src\features\projects\create\Create.tsx",
    "frontend\src\features\projects\edit\Edit.tsx",
    "backend\api\models.py",
    "backend\api\serializers.py",
    "backend\api\views.py",
    "backend\api\urls.py"
)

# Optional helpful files. These are included only if found.
$OptionalPatterns = @(
    "backend\api\migrations\*.py",
    "backend\api\tests*.py",
    "backend\api\tests\*.py",
    "frontend\src\__tests__\projectFormConfig.test.ts",
    "frontend\src\__tests__\Create.test.tsx",
    "frontend\src\__tests__\Edit.test.tsx",
    "frontend\src\__tests__\useCreateController.test.tsx",
    "frontend\src\__tests__\useEditController.test.tsx"
)

function Write-SectionHeader {
    param(
        [System.IO.StreamWriter]$Writer,
        [string]$Title
    )

    $Writer.WriteLine("")
    $Writer.WriteLine(("=" * 100))
    $Writer.WriteLine($Title)
    $Writer.WriteLine(("=" * 100))
    $Writer.WriteLine("")
}

function Write-FileBlock {
    param(
        [System.IO.StreamWriter]$Writer,
        [string]$FullPath,
        [string]$RelativePath
    )

    Write-SectionHeader -Writer $Writer -Title "FILE: $RelativePath"

    if (-not (Test-Path -LiteralPath $FullPath)) {
        $Writer.WriteLine("[MISSING FILE]")
        $Writer.WriteLine($RelativePath)
        return
    }

    try {
        $content = Get-Content -LiteralPath $FullPath -Raw -Encoding UTF8
        $Writer.WriteLine($content)
    } catch {
        $Writer.WriteLine("[ERROR READING FILE]")
        $Writer.WriteLine($_.Exception.Message)
    }
}

# -----------------------------------------------------------------------------
# Resolve root and output.
# -----------------------------------------------------------------------------
$ResolvedRoot = Resolve-Path -LiteralPath $ProjectRoot
$OutputPath = Join-Path $ResolvedRoot $OutputFile

# -----------------------------------------------------------------------------
# Build the final file list.
# -----------------------------------------------------------------------------
$ResolvedFiles = New-Object System.Collections.Generic.List[string]

foreach ($relativePath in $FilesToDump) {
    $fullPath = Join-Path $ResolvedRoot $relativePath
    $ResolvedFiles.Add($fullPath)
}

foreach ($pattern in $OptionalPatterns) {
    $matches = Get-ChildItem -Path (Join-Path $ResolvedRoot $pattern) -File -ErrorAction SilentlyContinue
    foreach ($match in $matches) {
        if (-not $ResolvedFiles.Contains($match.FullName)) {
            $ResolvedFiles.Add($match.FullName)
        }
    }
}

# -----------------------------------------------------------------------------
# Write dump file.
# -----------------------------------------------------------------------------
$writer = New-Object System.IO.StreamWriter($OutputPath, $false, [System.Text.UTF8Encoding]::new($false))

try {
    $writer.WriteLine("Code Review Dump")
    $writer.WriteLine("Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')")
    $writer.WriteLine("Project Root: $ResolvedRoot")
    $writer.WriteLine("")

    Write-SectionHeader -Writer $writer -Title "MANIFEST"

    foreach ($fullPath in $ResolvedFiles) {
        $relativePath = $fullPath.Replace("$ResolvedRoot\", "")
        if (Test-Path -LiteralPath $fullPath) {
            $writer.WriteLine("[FOUND]   $relativePath")
        } else {
            $writer.WriteLine("[MISSING] $relativePath")
        }
    }

    foreach ($fullPath in $ResolvedFiles) {
        $relativePath = $fullPath.Replace("$ResolvedRoot\", "")
        Write-FileBlock -Writer $writer -FullPath $fullPath -RelativePath $relativePath
    }
} finally {
    $writer.Close()
}

Write-Host ""
Write-Host "Dump file created:"
Write-Host "  $OutputPath"
Write-Host ""