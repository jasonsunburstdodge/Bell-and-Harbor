import {chromium} from 'playwright';
import fs from 'node:fs';
fs.mkdirSync('qa-screenshots',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
const address='https://jasonsunburstdodge.github.io/Bell-and-Harbor/';
let good=false;
for(let i=0;i<12;i++){
 try{
  await page.goto(address+'?smallcaps='+Date.now(),{waitUntil:'load',timeout:25000});
  await page.evaluate(async()=>await document.fonts.ready);
  good=await page.evaluate(()=>{
   const x=document.querySelector('.feature h2'),h=document.querySelector('.site-header'),b=document.querySelector('.brand-pic'),s=getComputedStyle(x);
   return h.getBoundingClientRect().height===96 && b.getBoundingClientRect().width===64 &&
       s.fontWeight==='400' && s.textTransform==='none' && s.fontVariantCaps==='small-caps' &&
       Math.abs(parseFloat(s.fontSize)-20)<.5;
  });
  if(good)break;
 }catch(e){console.log('Retry:',String(e))}
 await new Promise(r=>setTimeout(r,10000));
}
if(!good)throw new Error('Updated mobile CSS did not deploy before screenshot capture');
await page.screenshot({path:'qa-screenshots/deployed-mobile-smallcaps.png',fullPage:false});
await browser.close();
console.log('Mobile Title Case small-caps screenshot captured after live deployment');
