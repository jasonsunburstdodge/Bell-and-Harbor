import {chromium} from 'playwright';
import fs from 'node:fs';
const base='https://jasonsunburstdodge.github.io/Bell-and-Harbor/';
const out='qa-screenshots';
fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({headless:true,args:['--no-sandbox']});
const result={capturedAt:new Date().toISOString(),issues:[],views:[]};
const views=[
 ['home-desktop','',1024,1000,'.lake-cta'],
 ['home-mobile','',390,844,'.lake-cta'],
 ['menus-desktop','menus/',1024,900,'.card-link'],
 ['menus-mobile','menus/',390,844,'.card-link'],
 ['reservations-desktop','reservations/',1024,900,'.button'],
 ['reservations-mobile','reservations/',390,844,'.button'],
 ['events-desktop','events/',1024,900,'.tabs button'],
 ['events-mobile','events/',390,844,'.tabs button'],
 ['order-desktop','order/',1024,900,'.button'],
 ['order-mobile','order/',390,844,'.button']
];
for(const [name,route,width,height,selector] of views){
 const p=await b.newPage({viewport:{width,height},deviceScaleFactor:1});
 let ready=false,metrics=null;
 const errors=[];p.on('pageerror',e=>errors.push(String(e)));
 for(let attempt=0;attempt<14;attempt++){
  try{
   const resp=await p.goto(base+route+'?editorial-cta-qa='+Date.now(),{waitUntil:'load',timeout:25000});
   await p.evaluate(async()=>document.fonts.ready);
   metrics=await p.evaluate(selector=>{
    const el=document.querySelector(selector);
    const nav=document.querySelector('.lake-navigation .lake-order');
    const style=el?getComputedStyle(el):null;
    const nstyle=nav?getComputedStyle(nav):null;
    const bounds=el?.getBoundingClientRect();
    return{hasStyle:[...document.querySelectorAll('link[rel=stylesheet]')].some(x=>x.href.includes('lakeside-ctas.css')),
      ctaBorderRadius:style?.borderRadius,ctaBoxShadow:style?.boxShadow,ctaLetterSpacing:style?.letterSpacing,
      ctaHeight:bounds?.height,ctaLeft:bounds?.left,ctaRight:bounds?.right,
      navShadow:nstyle?.boxShadow,navRadius:nstyle?.borderRadius,
      overflow:document.documentElement.scrollWidth>innerWidth,
      brokenImages:[...document.images].filter(x=>x.complete&&!x.naturalWidth).map(x=>x.src),
      mainHeader:!!document.querySelector('.lake-header'),h1:document.querySelectorAll('h1').length};
   },selector);
   ready=resp?.status()===200 && metrics.hasStyle && !!metrics.ctaBoxShadow && metrics.navShadow!=='none';
   if(ready)break;
  }catch(e){errors.push(String(e).slice(0,150))}
  await new Promise(r=>setTimeout(r,6000));
 }
 const issues=[];
 if(!ready)issues.push('Deployed CTA stylesheet not confirmed');
 if(metrics){
  if(metrics.overflow)issues.push('Horizontal overflow');
  if(metrics.h1!==1 || !metrics.mainHeader)issues.push('Header or H1 missing');
  if(metrics.ctaRight>width+1 || metrics.ctaLeft < -1)issues.push('Primary control extends beyond viewport');
  if(metrics.ctaBorderRadius!=='0px')issues.push('Primary control retained default rounding');
  if(metrics.brokenImages.length)issues.push('Broken images: '+metrics.brokenImages.join(','));
  if(metrics.navRadius!=='0px')issues.push('Header action retained default rounding');
 }
 if(errors.length)issues.push('JavaScript errors '+errors.join(';'));
 if(ready){
  await p.evaluate(async()=>{for(const img of document.images){img.loading='eager';await img.decode().catch(()=>{})}});
  await p.screenshot({path:out+'/editorial-cta-'+name+'.png',fullPage:false});
 }
 result.views.push({name,route,width,height,ready,metrics,issues});
 result.issues.push(...issues.map(x=>name+': '+x));
 console.log(name,JSON.stringify({ready,issues,metrics}));
 await p.close();
}
await b.close();
fs.writeFileSync(out+'/editorial-cta-report.json',JSON.stringify(result,null,2));
console.log('SUMMARY',JSON.stringify({at:result.capturedAt,issues:result.issues}));
if(result.issues.length)process.exitCode=1;
