$path = "server/routers/game.ts"
$content = Get-Content $path
$final = $content[0..($content.Length - 4)] # Remove the extra lines
$final | Out-File $path -Encoding UTF8
