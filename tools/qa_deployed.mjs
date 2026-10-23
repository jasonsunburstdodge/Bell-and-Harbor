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
   await page.goto(base,{waitUntil:'load',timeout:20000});
   await page.locator('.hero-desktop').evaluate(img=>img.decode().catch(()=>{}));
   if(await page.locator('link[href*="site-style.css"]').count() && await page.locator('.features').count() && await page.evaluate(() => {
    const header=document.querySelector('.site-header');
    const hero=document.querySelector('.hero-desktop');
    const family=getComputedStyle(document.querySelector('.brand-name')).fontFamily;
    const cropped=(hero.naturalWidth===1214 && hero.naturalHeight===397);
    if(window.innerWidth===390){const title=getComputedStyle(document.querySelector('.feature h2'));const emblem=document.querySelector('.brand-pic').getBoundingClientRect();return cropped && Math.abs(header.getBoundingClientRect().height-96)<2 && Math.abs(emblem.width-64)<2 && family.includes('Playfair Display SC') && Math.abs(parseFloat(title.fontSize)-20)<.5 && title.textTransform==='none' && title.fontVariantCaps==='small-caps' && title.fontWeight==='400';}
    return cropped && Math.abs(header.getBoundingClientRect().height-92)<2 && family.includes('Playfair Display SC');
   })){
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
 const heroNative=await page.locator('.hero-desktop').evaluate(x=>({width:x.naturalWidth,height:x.naturalHeight}));
 const fontFamily=await page.locator('.brand-name').evaluate(x=>getComputedStyle(x).fontFamily);
 const brandWidth=await page.locator('.brand').evaluate(x=>x.getBoundingClientRect().width);
 const headerHeight=await page.locator('.site-header').evaluate(x=>x.getBoundingClientRect().height);
 const featureImageHeight=await page.locator('.feature img').first().evaluate(x=>x.getBoundingClientRect().height);
 const pillHeight=await page.locator('.feature .pill').first().evaluate(x=>x.getBoundingClientRect().height);
 const wordmarkFontSize=await page.locator('.brand-name').evaluate(x=>parseFloat(getComputedStyle(x).fontSize));
 const mobileFeatureText= name==='mobile' ? await page.locator('.feature h2').first().evaluate(x=>({fontSize:getComputedStyle(x).fontSize,fontWeight:getComputedStyle(x).fontWeight,textTransform:getComputedStyle(x).textTransform,fontVariantCaps:getComputedStyle(x).fontVariantCaps,letterSpacing:getComputedStyle(x).letterSpacing})) : null;
 report.screenshots[name]={filename,width,height,broken,horizontalScroll,h1,heroNative,fontFamily,brandWidth,headerHeight,featureImageHeight,pillHeight,wordmarkFontSize,mobileFeatureText,errors};
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
