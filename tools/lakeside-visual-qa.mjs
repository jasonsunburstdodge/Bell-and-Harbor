import {chromium} from 'playwright';
import fs from 'node:fs';
const base='https://jasonsunburstdodge.github.io/Bell-and-Harbor/';
fs.mkdirSync('qa-screenshots',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const report={capturedAt:new Date().toISOString(),url:base,issues:[],screenshots:{}};
for(const [name,width,height] of [['concept-desktop',1024,1536],['desktop-wide',1440,950],['mobile',390,844]]){
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
 let loaded=false;
 for(let attempt=0;attempt<16;attempt++){
  await page.goto(base+'?redesign-qa='+Date.now(),{waitUntil:'load',timeout:25000});
  loaded=await page.evaluate(async()=>{
   const h=document.querySelector('.lake-hero-photo');
   if(!h||!document.querySelector('.lakeside-redesign'))return false;
   await h.decode().catch(()=>{});
   return h.naturalWidth===569 && !!document.querySelector('.lake-menu-stripe') && !!document.querySelector('.lake-footer') && !!document.querySelector('.lake-hero-brandline') && !!document.querySelector('.lake-intro-second');
  });
  if(loaded)break;
  await new Promise(r=>setTimeout(r,7500));
 }
 if(!loaded){report.issues.push(name+' did not load redesigned homepage');await page.close();continue;}
 await page.evaluate(async()=>document.fonts.ready);
 const metrics=await page.evaluate(()=>{
 const rect=(sel)=>{const el=document.querySelector(sel);if(!el)return null;const r=el.getBoundingClientRect();return {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}};
 return {header:rect('.lake-header'),logo:rect('.lake-logo'),hero:rect('.lake-hero'),heroCopy:rect('.lake-hero-copy'),heroImage:rect('.lake-hero-photo'),ribbon:rect('.lake-ribbon'),intro:rect('.lake-intro'),menu:rect('.lake-menu-stripe'),events:rect('.lake-events'),footer:rect('.lake-footer'),body:rect('body'),imageStatus:[...document.images].map(x=>({src:x.src.split('/').pop(),loaded:x.complete&&x.naturalWidth>0})),overflow:document.documentElement.scrollWidth>innerWidth, brandline:rect('.lake-hero-brandline'), introSecond:rect('.lake-intro-second')}
 });
 const file='qa-screenshots/lakeside-redesign-'+name+'.png';
 await page.screenshot({path:file,fullPage:true});
 if(metrics.overflow)report.issues.push(name+' horizontal overflow');
 if(name==='concept-desktop'&&metrics.brandline?.x+metrics.brandline?.w > metrics.heroImage.x-5)report.issues.push('Hero wordmark extends into photograph at reference viewport');
 if(name==='concept-desktop'&&metrics.introSecond?.x+metrics.introSecond?.w > metrics.intro.x+metrics.intro.w*.377+5)report.issues.push('Intro title extends into dining room photograph');
 for(const img of metrics.imageStatus)if(!img.loaded)report.issues.push(name+' missing image '+img.src);
 report.screenshots[name]={...metrics,width,height,file};
 await page.close();
}
await browser.close();
fs.writeFileSync('qa-screenshots/lakeside-redesign-report.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
