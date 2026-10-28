param(
 [string]$PlanPath='C:\wedoo-fighters\autosprite-agent\output\jump-custom-2-import-20261028\export-plan.json',
 [switch]$MergeManifest
)
Add-Type -AssemblyName System.Drawing
$source = @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
public static class ExactJumpExport {
 static byte[] ReadPixels(Bitmap bitmap) {
  var data=bitmap.LockBits(new Rectangle(0,0,bitmap.Width,bitmap.Height),ImageLockMode.ReadOnly,PixelFormat.Format32bppArgb);
  try {
   var bytes=new byte[bitmap.Width*bitmap.Height*4];
   for(int y=0;y<bitmap.Height;y++)Marshal.Copy(IntPtr.Add(data.Scan0,y*data.Stride),bytes,y*bitmap.Width*4,bitmap.Width*4);
   for(int i=0;i<bytes.Length;i+=4)if(bytes[i+3]==0){bytes[i]=0;bytes[i+1]=0;bytes[i+2]=0;}
   return bytes;
  } finally {bitmap.UnlockBits(data);}
 }
 public static string Export(string source,string destination,int width,int height,int sourceColumns,int first,int last,int columns) {
  int count=last-first+1,rows=(count+columns-1)/columns,outputWidth=columns*width,outputHeight=rows*height;
  byte[] packed=new byte[outputWidth*outputHeight*4];
  using(var image=new Bitmap(source)) {
   var bytes=ReadPixels(image);
   for(int i=0;i<count;i++){
    int f=first+i,sx=f%sourceColumns*width,sy=f/sourceColumns*height,dx=i%columns*width,dy=i/columns*height;
    for(int y=0;y<height;y++)Buffer.BlockCopy(bytes,((sy+y)*image.Width+sx)*4,packed,((dy+y)*outputWidth+dx)*4,width*4);
   }
  }
  using(var output=new Bitmap(outputWidth,outputHeight,PixelFormat.Format32bppArgb)) {
   var data=output.LockBits(new Rectangle(0,0,outputWidth,outputHeight),ImageLockMode.WriteOnly,PixelFormat.Format32bppArgb);
   try {for(int y=0;y<outputHeight;y++)Marshal.Copy(packed,y*outputWidth*4,IntPtr.Add(data.Scan0,y*data.Stride),outputWidth*4);}
   finally {output.UnlockBits(data);}
   output.Save(destination,ImageFormat.Png);
  }
  using(var verify=new Bitmap(destination))using(var sha=SHA256.Create()){
   var expected=Convert.ToBase64String(sha.ComputeHash(packed));var actual=Convert.ToBase64String(sha.ComputeHash(ReadPixels(verify)));
   if(expected!=actual)throw new Exception("PNG esportato diverso dai pixel selezionati");
   return actual;
  }
 }
}
'@
Add-Type -TypeDefinition $source -ReferencedAssemblies System.Drawing
$ErrorActionPreference='Stop'
$root='C:\wedoo-fighters'
$plan=Get-Content -LiteralPath $PlanPath -Raw | ConvertFrom-Json
if($plan.missing.Count -gt 0){throw 'Mancano versioni jump custom 2: verificare il piano prima di esportare'}
$results=foreach($item in $plan.items){
 $outputPng=Join-Path $root $item.png
 $outputAtlas=Join-Path $root $item.atlas
 $null=New-Item -ItemType Directory -Path (Split-Path -Parent $outputPng) -Force
 $columns=if($item.trimmed){[int][Math]::Ceiling([Math]::Sqrt($item.frames))}else{$item.sourceColumns}
 $rows=[int][Math]::Ceiling($item.frames/$columns)
 if($item.trimmed){
  $hash=[ExactJumpExport]::Export($item.rawPng,$outputPng,$item.frameWidth,$item.frameHeight,$item.sourceColumns,$item.sourceStart,$item.sourceEnd,$columns)
  $verification='decoded RGBA SHA256'
 }else{
  Copy-Item -LiteralPath $item.rawPng -Destination $outputPng
  $hash=(Get-FileHash -LiteralPath $outputPng -Algorithm SHA256).Hash
  if($hash -ne (Get-FileHash -LiteralPath $item.rawPng -Algorithm SHA256).Hash){throw 'Copia PNG diversa dal sorgente'}
  $verification='identical source file SHA256'
 }
 $atlas=[ordered]@{frames=[ordered]@{};meta=[ordered]@{image=[IO.Path]::GetFileName($outputPng);size=@{w=$columns*$item.frameWidth;h=$rows*$item.frameHeight};frame_size=@{w=$item.frameWidth;h=$item.frameHeight};frame_count=$item.frames;columns=$columns;rows=$rows;fps=24;trimmed=$item.trimmed;source_sheet_id=$item.sourceSheetId;source_frame_count=$item.sourceFrames;source_frame_start=$item.sourceStart;source_frame_end=$item.sourceEnd;speed_multiplier=$item.speedMultiplier}}
 for($i=0;$i -lt $item.frames;$i++){$atlas.frames[$i.ToString()]=@{x=($i%$columns)*$item.frameWidth;y=[int][Math]::Floor($i/$columns)*$item.frameHeight;w=$item.frameWidth;h=$item.frameHeight;source_frame=$item.sourceStart+$i;duration=1000/24}}
 $atlas | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $outputAtlas -Encoding UTF8
 Write-Host ($item.character+': '+$item.frames+' frame esportati a 24 fps')
 [pscustomobject]@{character=$item.character;characterId=$item.characterId;sourceSheetId=$item.sourceSheetId;sourceAnimationName=$item.sourceAnimationName;createdAt=$item.createdAt;sourceStart=$item.sourceStart;sourceEnd=$item.sourceEnd;sourceFrames=$item.sourceFrames;frames=$item.frames;frameWidth=$item.frameWidth;frameHeight=$item.frameHeight;speedMultiplier=$item.speedMultiplier;trimmed=$item.trimmed;png=$item.png;atlas=$item.atlas;pixelVerification=$verification;pixelHash=$hash;playbackFps=24}
}
$manifest=[ordered]@{animation='jump';sourceAnimation='jump custom 2';playbackFps=24;creditsUsed=0;importedAt=[DateTime]::UtcNow.ToString('o');items=@($results);missing=@($plan.missing)}
if($MergeManifest){
 $previous=Get-Content -LiteralPath (Join-Path $root 'animation/jump-manifest.json') -Raw | ConvertFrom-Json
 foreach($result in $results){
  $indices=@(0..($previous.items.Count-1) | Where-Object {$previous.items[$_].character -eq $result.character})
  if($indices.Count -ne 1){throw ('Voce manifest non univoca: '+$result.character)}
  $previous.items[$indices[0]]=$result
 }
 $previous.importedAt=[DateTime]::UtcNow.ToString('o')
 $manifest=$previous
}
$manifest | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $root 'animation/jump-manifest.json') -Encoding UTF8
Write-Host ('Totale Jump esportati: '+@($results).Count)

