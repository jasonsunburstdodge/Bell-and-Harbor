import {chromium} from 'playwright';
import fs from 'node:fs';
const base='https://jasonsunburstdodge.github.io/Bell-and-Harbor/';
fs.mkdirSync('qa-screenshots',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const report={capturedAt:new Date().toISOString(),issues:[],pages:[]};
for(const [route,name,w,h] of [
 ['menus/','menus',1024,900],['menus/main/','main-menu',1024,900],
 ['reservations/','reservations',1024,900],['private-events/','private-events',1024,900],
 ['events/','events',1024,900],['contact/','contact',1024,900],
 ['order/','order',1024,900],
 ['menus/','menus-mobile',390,844],['reservations/','reservations-mobile',390,844],
 ['events/','events-mobile',390,844]
]){
 const page=await browser.newPage({viewport:{width:w,height:h},deviceScaleFactor:1});
 let ready=false,metrics=null,errors=[];page.on('pageerror',e=>errors.push(String(e)));
 for(let attempt=0;attempt<14;attempt++){
  try{
   const res=await page.goto(base+route+'?blueqa='+Date.now(),{waitUntil:'load',timeout:25000});
   await page.evaluate(async()=>document.fonts.ready);
   metrics=await page.evaluate(()=>{
    const style=s=>{const e=document.querySelector(s);if(!e)return null;const c=getComputedStyle(e);return{background:c.backgroundColor,backgroundImage:c.backgroundImage,color:c.color,border:c.borderColor}};
    const blues=style('main'),hero=style('.page-hero'),card=style('.card'),panel=style('.split>.panel:first-child'),menu=style('.menu-group');
    return{brandNavy:getComputedStyle(document.documentElement).getPropertyValue('--bh-navy').trim(),background:blues,hero,card,panel,menu,header:!!document.querySelector('.lake-header'),
      styleHref:[...document.querySelectorAll('link[rel=stylesheet]')].map(x=>x.getAttribute('href')).find(x=>x.includes('lakeside-inner.css')),
      scrollWidth:document.documentElement.scrollWidth,
      imgBroken:[...document.images].filter(x=>x.loading!=='lazy'&&(!x.complete||!x.naturalWidth)).map(x=>x.currentSrc),
      viewWidth:innerWidth,hasH1:document.querySelectorAll('h1').length===1};
   });
   ready=res?.status()===200&&metrics.styleHref?.includes('lakeside-inner.css')&&metrics.brandNavy==='#002140'&&metrics.hero?.backgroundImage?.includes('linear-gradient')&&metrics.background?.backgroundImage?.includes('linear-gradient');
   if(ready)break;
  }catch(e){errors.push(String(e).slice(0,150))}
  await new Promise(r=>setTimeout(r,6500));
 }
 if(!ready){report.issues.push(name+': deployed blue stylesheet not verified');}
 if(metrics){
  const css=(metrics.card?.background||'');
  if(name.startsWith('menus')&&name==='menus'&&!css.includes('0, 33, 64'))report.issues.push(name+': expected deep navy cards, got '+css);
  if(name==='reservations'&&!metrics.panel?.backgroundImage?.includes('linear-gradient'))report.issues.push(name+': navy reservation information panel missing');
  if(metrics.scrollWidth>metrics.viewWidth+1)report.issues.push(name+': horizontal scrolling');
  if(!metrics.hasH1||!metrics.header)report.issues.push(name+': missing page heading or header');
  if(metrics.imgBroken.length)report.issues.push(name+': image errors '+metrics.imgBroken.join(','));
 }
 if(errors.length)report.issues.push(name+': browser errors '+errors.join('; '));
 if(ready){await page.evaluate(async()=>{for(const img of document.images){img.loading='eager';await img.decode().catch(()=>{})}});await page.screenshot({path:'qa-screenshots/blue-inner-'+name+'.png',fullPage:false});}
 report.pages.push({route,name,width:w,height:h,ready,metrics});
 await page.close();
}
await browser.close();
fs.writeFileSync('qa-screenshots/blue-inner-report.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({at:report.capturedAt,issues:report.issues,pages:report.pages.map(p=>({name:p.name,ready:p.ready,background:p.metrics?.background?.backgroundImage,hero:p.metrics?.hero?.backgroundImage,card:p.metrics?.card?.background}))},null,2));
if(report.issues.length)process.exitCode=1;
