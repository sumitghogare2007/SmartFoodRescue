$ErrorActionPreference = 'Stop'
$inputPath = (Resolve-Path -LiteralPath 'D:\SmartF\output\word\SmartFoodRescue_IEEE_Research_Paper.docx').Path
$outputDir = 'D:\SmartF\tmp\docx_render'
$outputPath = Join-Path $outputDir 'SmartFoodRescue_IEEE_Research_Paper.pdf'
$logPath = Join-Path $outputDir 'word_render.log'
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
Set-Content -LiteralPath $logPath -Value 'Starting Word render'

$word = $null
$doc = $null
try {
    $word = New-Object -ComObject Word.Application
    Add-Content -LiteralPath $logPath -Value 'Word COM created'
    $word.Visible = $false
    $word.DisplayAlerts = 0
    $word.AutomationSecurity = 3
    $doc = $word.Documents.Open($inputPath, $false, $true, $false, '', '', $false, '', '', 0, $false, $false, $false, $false, $true)
    Add-Content -LiteralPath $logPath -Value 'Document opened'
    $word.ActivePrinter = 'Microsoft Print to PDF'
    Add-Content -LiteralPath $logPath -Value 'PDF printer selected'
    $doc.PrintOut($false, $false, 0, $outputPath, '', '', 0, 1, '', 0, $true, $true)
    Add-Content -LiteralPath $logPath -Value 'PDF printed'
}
finally {
    if ($doc -ne $null) { $doc.Close($false) }
    if ($word -ne $null) { $word.Quit() }
    Add-Content -LiteralPath $logPath -Value 'Word closed'
}

Write-Output $outputPath
