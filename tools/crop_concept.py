from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]
source=root/'assets/concept.png'
if not source.exists(): raise SystemExit('Missing assets/concept.png')
rects={
'hero-desktop.jpg':(0,92,1214,527),
'hero-mobile.jpg':(1236,232,1516,462),
'feature-brunch.jpg':(20,535,320,652),
'feature-menus.jpg':(330,535,622,652),
'feature-cocktails.jpg':(633,535,920,652),
'feature-events.jpg':(930,535,1212,652),
'interior-bar.jpg':(0,752,730,1024),
'burger-beer.jpg':(742,752,1214,1024),
'header-emblem.jpg':(62,9,175,120)}
with Image.open(source) as im:
 if im.size!=(1536,1024): raise SystemExit(f'Wrong concept size: {im.size}')
 im=im.convert('RGB')
 for name,box in rects.items():
  im.crop(box).save(root/'assets'/name,'JPEG',quality=85,optimize=True,progressive=True)
  print('Cropped',name,box)
