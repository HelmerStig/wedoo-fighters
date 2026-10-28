param([string]$WorkspaceRoot='C:\wedoo-fighters')
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$root=$WorkspaceRoot
$agentDir=Join-Path $root 'autosprite-agent'
$batchDir=Join-Path $agentDir 'output/jump-custom-20261028'
$state=Get-Content -LiteralPath (Join-Path $batchDir 'batch.json') -Raw | ConvertFrom-Json
$checker=[scriptblock]::Create((Get-Content -LiteralPath (Join-Path $agentDir 'output/scale-audit/check-animation.ps1') -Raw))
$items=@($state.items | Where-Object status -eq 'completed')
$results=foreach($item in $items){
 $directory=Join-Path $root $item.output
 $checkPath=Join-Path $directory 'scale-check.json'
 if(-not(Test-Path -LiteralPath $checkPath)){$null=& $checker -OutputDirectory $directory}
 $qa=Get-Content -LiteralPath $checkPath -Raw | ConvertFrom-Json
 $clipped=@($qa.Frames | Where-Object {$_.X -le 0 -or $_.Y -le 0 -or ($_.X+$_.Width) -ge 512 -or ($_.Y+$_.Height) -ge 512}).Count
 [pscustomobject]@{Character=$item.character;SheetId=$qa.SheetId;FirstHeightRatio=$qa.FirstFrame.HeightRatio;LastHeightRatio=$qa.LastFrame.HeightRatio;FootOffset=$qa.FirstFrame.Bottom-$qa.Reference.Bottom;ClippedFrames=$clipped;NeedsScaleReview=([Math]::Abs($qa.FirstFrame.HeightRatio-1) -gt .03 -or [Math]::Abs($qa.LastFrame.HeightRatio-1) -gt .03 -or [Math]::Abs($qa.FirstFrame.Bottom-$qa.Reference.Bottom) -gt 3 -or $clipped -gt 0)}
}
$results | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $batchDir 'scale-report.json') -Encoding UTF8
$font=[System.Drawing.Font]::new('Arial',10)
for($start=0;$start -lt $items.Count;$start+=6){
 $group=@($items | Select-Object -Skip $start -First 6)
 $page=[System.Drawing.Bitmap]::new(1280,($group.Count*194+24))
 $graphics=[System.Drawing.Graphics]::FromImage($page);$graphics.Clear([System.Drawing.Color]::White)
 $graphics.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
 $headers=@('Posa originale','Frame 0','Frame 8','Frame 16','Frame 24','Frame 32','Frame 40','Frame 48')
 for($c=0;$c -lt 8;$c++){$graphics.DrawString($headers[$c],$font,[System.Drawing.Brushes]::Black,[single]($c*160+3),[single]3)}
 for($row=0;$row -lt $group.Count;$row++){
  $item=$group[$row];$directory=Join-Path $root $item.output
  $metadata=Get-Content -LiteralPath (Join-Path $directory ($item.sheetId+'-metadata.json')) -Raw | ConvertFrom-Json
  $pose=[System.Drawing.Bitmap]::new((Join-Path $directory 'reference-pose.png'))
  $sheet=[System.Drawing.Bitmap]::new((Join-Path $directory ($item.sheetId+'.png')))
  $y=24+$row*194
  $graphics.DrawString($item.character,$font,[System.Drawing.Brushes]::Black,[single]3,[single]$y)
  $graphics.DrawImage($pose,[System.Drawing.Rectangle]::new(0,($y+20),160,160))
  $indices=@(0,8,16,24,32,40,48)
  for($k=0;$k -lt $indices.Count;$k++){
   $f=[Math]::Min($indices[$k],$metadata.frameCount-1)
   $src=[System.Drawing.Rectangle]::new(($f%$metadata.columns*$metadata.frameWidth),([int][Math]::Floor($f/$metadata.columns)*$metadata.frameHeight),$metadata.frameWidth,$metadata.frameHeight)
   $dest=[System.Drawing.Rectangle]::new((($k+1)*160),($y+20),160,160)
   $graphics.DrawImage($sheet,$dest,$src,[System.Drawing.GraphicsUnit]::Pixel)
  }
  $pose.Dispose();$sheet.Dispose()
 }
 $page.Save((Join-Path $batchDir ('review-'+('{0:D2}' -f ([int][Math]::Floor($start/6)+1))+'.png')),[System.Drawing.Imaging.ImageFormat]::Png)
 $graphics.Dispose();$page.Dispose()
}
$font.Dispose()
[pscustomobject]@{Checked=$results.Count;ScaleFlags=@($results | Where-Object NeedsScaleReview);ReviewPages=[Math]::Ceiling($items.Count/6)} | ConvertTo-Json -Depth 5

