import { chromium } from 'playwright';
import fs from 'node:fs';
const base='https://jasonsunburstdodge.github.io/Bell-and-Harbor/';
fs.mkdirSync('qa-screenshots',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const report={source:base,capturedAt:new Date().toISOString(),screenshots:{},pages:[],issues:[]};
for(const [name,width,height] of [['desktop',1536,1024],['mobile',390,844]]){
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 let loaded=false;
 for(let attempt=0;attempt<12;attempt++){
  try{
   await page.goto(base,{waitUntil:'domcontentloaded',timeout:20000});
   if(await page.locator('link[href*="site-style.css"]').count() && await page.locator('.features').count() && await page.evaluate(() => (window.innerWidth===390 ? Math.abs(document.querySelector('.site-header').getBoundingClientRect().height-135)<2 && parseFloat(getComputedStyle(document.querySelector('.brand-name')).fontSize)>=30 : document.querySelector('.feature img').getBoundingClientRect().height >= 128 && document.querySelector('.feature .pill').getBoundingClientRect().height >= 48))){
    loaded=true;break;
   }
  }catch(e){errors.push(String(e).slice(0,140))}
  await new Promise(r=>setTimeout(r,10000));
 }
 if(!loaded){report.issues.push(name+': public deployed page did not serve rebuilt source');continue}
 await page.evaluate(async()=>{await document.fonts.ready});
 await page.waitForTimeout(1500);
 const filename='qa-screenshots/deployed-'+name+'.png';
 await page.screenshot({path:filename,fullPage:false});
 const broken=await page.locator('img').evaluateAll(els=>els.filter(x=>!x.complete||x.naturalWidth===0).map(x=>x.currentSrc));
 const horizontalScroll=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
 const h1=await page.locator('h1').allTextContents();
 const headerHeight=await page.locator('.site-header').evaluate(x=>x.getBoundingClientRect().height);
 const featureImageHeight=await page.locator('.feature img').first().evaluate(x=>x.getBoundingClientRect().height);
 const pillHeight=await page.locator('.feature .pill').first().evaluate(x=>x.getBoundingClientRect().height);
 const wordmarkFontSize=await page.locator('.brand-name').evaluate(x=>parseFloat(getComputedStyle(x).fontSize));
 report.screenshots[name]={filename,width,height,broken,horizontalScroll,h1,headerHeight,featureImageHeight,pillHeight,wordmarkFontSize,errors};
 if(broken.length)report.issues.push(name+': broken images '+broken.join(', '));
 if(horizontalScroll)report.issues.push(name+': horizontal overflow');
 if(errors.length)report.issues.push(name+': JavaScript errors '+errors.join(';'));
 if(name==='mobile'){
   await page.locator('#nav-toggle').click();
   if(!await page.locator('#site-nav').isVisible())report.issues.push('mobile menu does not open');
 }
 await page.close();
}
for(const route of ['menus/','menus/main/','menus/brunch/','menus/drinks/','menus/kids/','reservations/','private-events/','events/','contact/','order/']){
 const page=await browser.newPage();
 try{
  const response=await page.goto(base+route,{waitUntil:'domcontentloaded',timeout:20000});
  const h1=await page.locator('h1').allTextContents();
  const status=response?.status()??0;
  report.pages.push({route,status,h1});
  if(status!==200||h1.length!==1)report.issues.push('route '+route+' invalid: '+status+' H1 count '+h1.length);
 }catch(e){report.issues.push('route '+route+': '+String(e).slice(0,130))}
 await page.close();
}
await browser.close();
fs.writeFileSync('qa-screenshots/report.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
