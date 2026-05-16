$path = "server/routers/game.ts"
$content = Get-Content $path
$keepFirst = $content[0..901]
$keepLast = $content[1099..($content.Length - 1)]
$final = $keepFirst + $keepLast
$final | Out-File $path -Encoding UTF8
