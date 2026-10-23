import { chromium } from 'playwright';
import fs from 'node:fs';
const url='https://jasonsunburstdodge.github.io/Bell-and-Harbor/';
fs.mkdirSync('qa-screenshots',{recursive:true});
const widths=[1536,1440,1280,1024];
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const report={testedAt:new Date().toISOString(),url,viewports:[],issues:[]};
const minGap=6;
for(const width of widths){
 const page=await browser.newPage({viewport:{width,height:730},deviceScaleFactor:1});
 let ready=false;
 for(let attempt=0;attempt<12;attempt++){
  await page.goto(url+'?header-qa='+Date.now(),{waitUntil:'load',timeout:25000});
  await page.evaluate(async()=>document.fonts.ready);
  const val=await page.evaluate(()=>{
   const r=s=>document.querySelector(s)?.getBoundingClientRect();
   return {head:r('.site-header')?.height,emblem:r('.brand-pic')?.x,brand:r('.brand')?.x,nav:r('.site-nav')?.x,reserve:r('.header-actions .reserve')?.x,cssFont:getComputedStyle(document.querySelector('.brand-name')).fontFamily}
  });
  if(Math.abs(val.head-92)<1 && (width<1440 || (Math.abs(val.emblem-64)<2 && Math.abs(val.nav-457)<2 && Math.abs(val.reserve-945)<2))){ready=true;break}
  await new Promise(res=>setTimeout(res,10000));
 }
 if(!ready){report.issues.push(width+': did not observe deployed header geometry revision');await page.close();continue}
 const layout=await page.evaluate(()=>{
  const selectors=[['emblem','.brand-pic'],['brand','.brand'],['wordmark','.brand-copy'],['name','.brand-name'],['subtitle','.brand-sub'],['hamburger','.nav-toggle'],...Array.from({length:6},(_,i)=>['nav-'+i,'.site-nav a:nth-child('+(i+1)+')']),['reserve','.header-actions .reserve'],['order','.header-actions .order'],['directions','.header-actions .pin']];
  const boxes={};
  for(const [name,selector] of selectors){
   const el=document.querySelector(selector);
   if(!el)continue;
   const c=getComputedStyle(el),r=el.getBoundingClientRect();
   boxes[name]={left:+r.left.toFixed(2),right:+r.right.toFixed(2),top:+r.top.toFixed(2),bottom:+r.bottom.toFixed(2),width:+r.width.toFixed(2),height:+r.height.toFixed(2),visible:c.display!=='none'&&c.visibility!=='hidden'&&r.width>0&&r.height>0};
  }
  return {boxes,documentWidth:document.documentElement.scrollWidth,viewport:innerWidth,headerHeight:document.querySelector('.site-header').getBoundingClientRect().height,headerTop:document.querySelector('.site-header').getBoundingClientRect().top};
 });
 const {boxes}=layout;
 const v=n=>boxes[n]?.visible;
 const gap=(a,b)=> +(boxes[b].left-boxes[a].right).toFixed(2);
 const edges=[['wordmark','nav-0'],['nav-5','reserve'],['reserve','order'],['order','directions']];
 const measured={brandToHome:v('nav-0')?gap('wordmark','nav-0'):null,contactToReserve:v('nav-5')?gap('nav-5','reserve'):null,emblemToWordmark:gap('emblem','wordmark'),buttonGaps:[gap('reserve','order'),gap('order','directions')]};
 const issues=[];
 const itemNames=['brand','wordmark',...Array.from({length:6},(_,i)=>'nav-'+i),'reserve','order','directions','hamburger'];
 for(const n of itemNames){if(v(n)){const b=boxes[n];if(b.left < -0.25 || b.right > width+0.25)issues.push(n+' extends outside '+width+'px viewport')}}
 if(layout.documentWidth>width+1)issues.push('horizontal document overflow: '+layout.documentWidth);
 if(width>=1050){
   if(v('hamburger'))issues.push('unexpected hamburger at full desktop width');
   for(let i=0;i<6;i++)if(!v('nav-'+i))issues.push('nav-'+i+' is hidden');
   const sequence=['wordmark',...Array.from({length:6},(_,i)=>'nav-'+i),'reserve','order','directions'];
   for(let i=0;i<sequence.length-1;i++)if(v(sequence[i])&&v(sequence[i+1])){
      const g=gap(sequence[i],sequence[i+1]);
      if(g<minGap)issues.push(sequence[i]+' overlaps/touches '+sequence[i+1]+'; gap='+g+'px (minimum '+minGap+')');
   }
 }else {
   if(!v('hamburger'))issues.push('hamburger not visible at '+width);
   if(v('nav-0'))issues.push('desktop nav should be collapsed');
   for(const n of ['reserve','order','directions'])if(!v(n))issues.push(n+' missing from header');
   const sequence=['wordmark','reserve','order','directions','hamburger'];
   for(let i=0;i<sequence.length-1;i++)if(v(sequence[i])&&v(sequence[i+1])){
    const g=gap(sequence[i],sequence[i+1]);
    if(g<minGap)issues.push(sequence[i]+' overlaps/touches '+sequence[i+1]+'; gap='+g+'px');
   }
 }
 const rectOverlap=(a,b)=>a.visible&&b.visible&&Math.min(a.right,b.right)-Math.max(a.left,b.left)>0.5&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>0.5;
 const relevant=['wordmark',...Array.from({length:6},(_,i)=>'nav-'+i),'reserve','order','directions','hamburger'];
 for(let i=0;i<relevant.length;i++)for(let j=i+1;j<relevant.length;j++){
  const a=boxes[relevant[i]],b=boxes[relevant[j]];
  if(a&&b&&rectOverlap(a,b))issues.push('Bounding-box collision '+relevant[i]+' × '+relevant[j]);
 }
 if(width===1536){
  const expected={emblem:64,wordmark:185,'nav-0':457,reserve:945,order:1130,directions:1284};
  for(const [name,x] of Object.entries(expected)){if(v(name)&&Math.abs(boxes[name].left-x)>4)issues.push(name+' x='+boxes[name].left+' differs from target '+x+' by >4px')}
  if(Math.abs(layout.headerHeight-92)>1)issues.push('header height should be 92px');
 }
 if(width===1024){
  await page.locator('#nav-toggle').click();
  if(!await page.locator('#site-nav').isVisible())issues.push('hamburger menu did not open');
 }
 const file='qa-screenshots/header-'+width+'.png';
 if(width===1024)await page.locator('#nav-toggle').click();
 await page.screenshot({path:file,fullPage:false});
 report.viewports.push({width,height:730,measured,boxes,issues,screenshot:file});
 report.issues.push(...issues.map(s=>width+': '+s));
 console.log(width,JSON.stringify({measured,issues}));
 await page.close();
}
await browser.close();
fs.writeFileSync('qa-screenshots/header-layout.json',JSON.stringify(report,null,2));
console.log('QA_HEADER_RESULT',JSON.stringify({issues:report.issues,measured:report.viewports.map(v=>({width:v.width,...v.measured}))}));
if(report.issues.length)process.exitCode=1;
