$rep = Get-Content -Raw "c:\Users\BERKE\.gemini\antigravity\scratch\NexusHub\.agents\explorer_frontend\hardcoded_strings_report.json" | ConvertFrom-Json
$groups = $rep.issues | Group-Object file | Sort-Object Count -Descending
foreach ($g in $groups) {
    Write-Host "$($g.Name): $($g.Count)"
}
