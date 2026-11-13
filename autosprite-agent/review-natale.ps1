Add-Type -AssemblyName System.Drawing
$taskRoot = Join-Path $PSScriptRoot 'output'
$reviewRows = @()
foreach ($batch in @('distribution-natale-20261113','distribution-natale-extra-20261113','distribution-natale-new3-20261113')) {
  $assignments = Get-Content (Join-Path $PSScriptRoot "jobs/$batch/assignments.json") -Raw | ConvertFrom-Json
  foreach ($row in $assignments.assignments) {
    $metadata = Get-ChildItem (Join-Path $taskRoot "$batch/$($row.characterId)") -Filter '*-metadata.json' -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($metadata) {$reviewRows += [pscustomobject]@{Row=$row;Meta=$metadata}}
  }
}
for ($page=0; $page -lt [Math]::Ceiling($reviewRows.Count/12); $page++) {
  $bitmap = New-Object System.Drawing.Bitmap 1152,744
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.Clear([System.Drawing.Color]::FromArgb(40,45,55))
  $font = New-Object System.Drawing.Font 'Arial',10
  for ($slot=0; $slot -lt 12; $slot++) {
    $idx=$page*12+$slot;if($idx -ge $reviewRows.Count){break}
    $item=$reviewRows[$idx];$meta=Get-Content $item.Meta.FullName -Raw | ConvertFrom-Json
    $image=[System.Drawing.Image]::FromFile((Join-Path $item.Meta.DirectoryName "$($meta.id).png"))
    $x=($slot%3)*384;$y=[Math]::Floor($slot/3)*186
    $graphics.DrawString($item.Row.character,$font,[System.Drawing.Brushes]::White,$x+4,$y+2)
    $graphics.DrawString($item.Row.animation,$font,[System.Drawing.Brushes]::LightGray,$x+4,$y+20)
    $n=0
    foreach($frame in @(0,24,48)) {
      $source=New-Object System.Drawing.Rectangle (($frame%$meta.columns)*$meta.frameWidth),([Math]::Floor($frame/$meta.columns)*$meta.frameHeight),$meta.frameWidth,$meta.frameHeight
      $dest=New-Object System.Drawing.Rectangle ($x+$n*128),($y+44),128,128
      $graphics.DrawImage($image,$dest,$source,[System.Drawing.GraphicsUnit]::Pixel)
      $n++
    }
    $image.Dispose()
  }
  $target=Join-Path $PSScriptRoot "jobs/distribution-natale-20261113/review-$($page+1).png"
  $bitmap.Save($target,[System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose();$font.Dispose();$bitmap.Dispose()
  Write-Output $target
}
