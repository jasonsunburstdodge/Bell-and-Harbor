from PIL import Image
from pathlib import Path
d=Path('qa-screenshots')
master=Image.open('assets/concept.png').convert('RGB')
actual=Image.open(d/'deployed-mobile-smallcaps.png').convert('RGB')
ref=master.crop((1236,131,1516,990)).resize((390,round(859*390/280)),Image.Resampling.LANCZOS).crop((0,0,390,844))
out=Image.new('RGB',(800,844),'#dddddd')
out.paste(ref,(0,0));out.paste(actual,(410,0))
out.save(d/'comparison-mobile-smallcaps.jpg',quality=90)
print('Saved deployed mobile vs visual master')
