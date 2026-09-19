# Script to scan component i18n calls and detect missing keys or hardcoded strings
Add-Type -AssemblyName System.Web.Extensions

$trPath = "c:\Users\BERKE\.gemini\antigravity\scratch\NexusHub\src\renderer\src\locales\tr.json"
$js = New-Object System.Web.Script.Serialization.JavaScriptSerializer
$js.MaxJsonLength = [int]::MaxValue

$trRaw = [System.IO.File]::ReadAllText($trPath, [System.Text.Encoding]::UTF8)
$trDict = $js.DeserializeObject($trRaw)

$flatKeys = New-Object 'System.Collections.Generic.HashSet[string]'

function Flatten-Keys ($prefix, $dict) {
    foreach ($entry in $dict) {
        $k = $entry.Key
        $fullKey = if ($prefix) { "$prefix.$k" } else { $k }
        if ($entry.Value -is [System.Collections.IDictionary]) {
            Flatten-Keys $fullKey $entry.Value
        } else {
            [void]$flatKeys.Add($fullKey)
        }
    }
}
Flatten-Keys "" $trDict

$srcDir = "c:\Users\BERKE\.gemini\antigravity\scratch\NexusHub\src\renderer\src"
$files = Get-ChildItem -Path $srcDir -Recurse -Include *.tsx, *.ts | Where-Object { $_.FullName -notmatch '\\(locales|assets)\\' }

$tRegex = [regex]'t\(\s*[\''"`]([a-zA-Z0-9_.]+)[\''"`]'
$missingKeysInDict = @()
$allUsedKeys = New-Object 'System.Collections.Generic.HashSet[string]'

foreach ($f in $files) {
    $content = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
    $matches = $tRegex.Matches($content)
    foreach ($m in $matches) {
        $key = $m.Groups[1].Value
        [void]$allUsedKeys.Add($key)
        if (-not $flatKeys.Contains($key)) {
            $missingKeysInDict += [PSCustomObject]@{
                File = $f.FullName.Replace("c:\Users\BERKE\.gemini\antigravity\scratch\NexusHub\", "")
                Key = $key
                Match = $m.Value
            }
        }
    }
}

# Unused keys in tr.json / en.json
$unusedKeysInCode = @()
foreach ($k in $flatKeys) {
    if (-not $allUsedKeys.Contains($k)) {
        $unusedKeysInCode += $k
    }
}

$outObj = [PSCustomObject]@{
    TotalUsedKeys = $allUsedKeys.Count
    MissingKeysInDictCount = $missingKeysInDict.Count
    MissingKeysInDict = $missingKeysInDict
    UnusedKeysInCodeCount = $unusedKeysInCode.Count
    UnusedKeysInCode = $unusedKeysInCode
}

$outObj | ConvertTo-Json -Depth 5 | Out-File -Encoding UTF8 "c:\Users\BERKE\.gemini\antigravity\scratch\NexusHub\.agents\explorer_frontend\component_i18n_scan.json"

Write-Host "Total Unique Keys Used in Code: $($allUsedKeys.Count)"
Write-Host "Keys Used in Code but Missing in tr/en.json: $($missingKeysInDict.Count)"
Write-Host "Keys in tr/en.json not directly matched: $($unusedKeysInCode.Count)"
