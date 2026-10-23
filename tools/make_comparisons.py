from PIL import Image
from pathlib import Path
root=Path('.')
master=Image.open('assets/concept.png').convert('RGB')
screens=root/'qa-screenshots'
desktop=screens/'deployed-desktop.png'
mobile=screens/'deployed-mobile.png'
if desktop.exists():
 actual=Image.open(desktop).convert('RGB')
 ref=Image.new('RGB',(1536,1024),'white')
 ref.paste(master.crop((0,0,1536,92)),(0,0))
 body=master.crop((0,92,1214,1024))
 body=body.resize((1536,round(body.height*1536/1214)),Image.Resampling.LANCZOS)
 ref.paste(body,(0,92))
 pair=Image.new('RGB',(3092,1024),'#dddddd')
 pair.paste(ref,(0,0));pair.paste(actual,(1556,0))
 pair.save(screens/'comparison-desktop.jpg',quality=85)
if mobile.exists():
 actual=Image.open(mobile).convert('RGB')
 ref=master.crop((1236,131,1516,990))
 ref=ref.resize((390,round(ref.height*390/280)),Image.Resampling.LANCZOS)
 pair=Image.new('RGB',(800,844),'#dddddd')
 pair.paste(ref.crop((0,0,390,844)),(0,0));pair.paste(actual,(410,0))
 pair.save(screens/'comparison-mobile.jpg',quality=85)
