from PIL import Image, ImageChops, ImageStat, ImageEnhance
from pathlib import Path
import json
root=Path('qa-screenshots')
ref=Image.open('assets/redesign/reference-concept.jpg').convert('RGB')
actual=Image.open(root/'lakeside-redesign-concept-desktop.png').convert('RGB')
ref=ref.resize((1024,1536));actual=actual.crop((0,0,1024,1536))
diff=ImageChops.difference(ref,actual)
stats=ImageStat.Stat(diff)
mean=[round(x,2) for x in stats.mean]
scale=.65
size=(int(1024*scale),int(1536*scale))
ref=ref.resize(size,Image.Resampling.LANCZOS)
actual=actual.resize(size,Image.Resampling.LANCZOS)
comp=Image.new('RGB',(size[0]*2+16,size[1]),'#d7d7d7')
comp.paste(ref,(0,0));comp.paste(actual,(size[0]+16,0))
comp.save(root/'lakeside-compare-desktop.jpg',quality=75,optimize=True)
actual.save(root/'lakeside-compare-desktop-only.jpg',quality=72,optimize=True)
with open(root/'lakeside-redesign-report.json') as f: report=json.load(f)
report['referenceComparison']={'meanAbsoluteRGBDifference':mean,'reference':'assets/redesign/reference-concept.jpg','comparison':'qa-screenshots/lakeside-compare-desktop.jpg'}
with open(root/'lakeside-redesign-report.json','w') as f:json.dump(report,f,indent=2)
print('Comparison image:',comp.size,'mean pixel color difference:',mean)
