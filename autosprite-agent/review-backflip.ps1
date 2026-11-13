Add-Type -AssemblyName System.Drawing
$batches=@('distribution-natale-backflip-20261113','distribution-natale-backflip-peirolo-20261113')
$bitmap=New-Object System.Drawing.Bitmap 896,960
$graphics=[System.Drawing.Graphics]::FromImage($bitmap)
$graphics.Clear([System.Drawing.Color]::FromArgb(40,45,55))
$font=New-Object System.Drawing.Font 'Arial',11
$rowIndex=0
foreach($batch in $batches){
  $assignments=Get-Content (Join-Path $PSScriptRoot "jobs/$batch/assignments.json") -Raw|ConvertFrom-Json
  foreach($row in $assignments.assignments){
    $folder=Join-Path $PSScriptRoot "output/$batch/$($row.characterId)"
    $manifest=Get-Content (Join-Path $folder 'manifest.json') -Raw|ConvertFrom-Json
    if($manifest.status -ne 'completed'){throw "Non completato: $($row.character)"}
    $sheetId=$manifest.workflows[0].sheets[0].sheetId
    $meta=Get-Content (Join-Path $folder "$sheetId-metadata.json") -Raw|ConvertFrom-Json
    $image=[System.Drawing.Image]::FromFile((Join-Path $folder "$sheetId.png"))
    $y=$rowIndex*160
    $graphics.DrawString($row.character,$font,[System.Drawing.Brushes]::White,4,$y+2)
    $column=0
    foreach($frame in @(0,8,16,24,32,40,48)){
      $source=New-Object System.Drawing.Rectangle (($frame%$meta.columns)*$meta.frameWidth),([Math]::Floor($frame/$meta.columns)*$meta.frameHeight),$meta.frameWidth,$meta.frameHeight
      $dest=New-Object System.Drawing.Rectangle ($column*128),($y+24),128,128
      $graphics.DrawImage($image,$dest,$source,[System.Drawing.GraphicsUnit]::Pixel)
      $column++
    }
    $image.Dispose();$rowIndex++
  }
}
$target=Join-Path $PSScriptRoot 'jobs/distribution-natale-backflip-20261113/review.png'
$bitmap.Save($target,[System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose();$font.Dispose();$bitmap.Dispose()
Write-Output $target
