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
   return {head:r('.site-header')?.height,emblem:r('.brand-pic')?.x,brand:r('.brand')?.x,nav:r('.site-nav')?.x,reserve:r('.header-actions .reserve')?.x,buttonGap:(r('.header-actions .order')?.x??0)-(r('.header-actions .reserve')?.right??0),cssFont:getComputedStyle(document.querySelector('.brand-name')).fontFamily}
  });
  if(Math.abs(val.head-92)<1 && (width>=1440 ? (Math.abs(val.emblem-64)<2 && Math.abs(val.nav-457)<2 && Math.abs(val.reserve-945)<2) : val.buttonGap>=6)){ready=true;break}
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
  for(const [name,selector] of [['wordmarkInk','.brand-name'],['subtitleInk','.brand-sub']]){
   const el=document.querySelector(selector);
   const range=document.createRange();range.selectNodeContents(el);const r=range.getBoundingClientRect();
   boxes[name]={left:+r.left.toFixed(2),right:+r.right.toFixed(2),top:+r.top.toFixed(2),bottom:+r.bottom.toFixed(2),width:+r.width.toFixed(2),height:+r.height.toFixed(2),visible:true};
  }
  return {boxes,documentWidth:document.documentElement.scrollWidth,viewport:innerWidth,headerHeight:document.querySelector('.site-header').getBoundingClientRect().height,headerTop:document.querySelector('.site-header').getBoundingClientRect().top};
 });
 const {boxes}=layout;
 const v=n=>boxes[n]?.visible;
 const gap=(a,b)=> +(boxes[b].left-boxes[a].right).toFixed(2);
 const edges=[['wordmark','nav-0'],['nav-5','reserve'],['reserve','order'],['order','directions']];
 const measured={brandToHome:v('nav-0')?gap('wordmarkInk','nav-0'):null,contactToReserve:v('nav-5')?gap('nav-5','reserve'):null,emblemToWordmark:gap('emblem','wordmark'),buttonGaps:[gap('reserve','order'),gap('order','directions')]};
 const issues=[];
 const itemNames=['brand','wordmark','wordmarkInk','subtitleInk',...Array.from({length:6},(_,i)=>'nav-'+i),'reserve','order','directions','hamburger'];
 for(const n of itemNames){if(v(n)){const b=boxes[n];if(b.left < -0.25 || b.right > width+0.25)issues.push(n+' extends outside '+width+'px viewport')}}
 if(layout.documentWidth>width+1)issues.push('horizontal document overflow: '+layout.documentWidth);
 if(width>=1050){
   if(v('hamburger'))issues.push('unexpected hamburger at full desktop width');
   for(let i=0;i<6;i++)if(!v('nav-'+i))issues.push('nav-'+i+' is hidden');
   const sequence=['wordmarkInk',...Array.from({length:6},(_,i)=>'nav-'+i),'reserve','order','directions'];
   for(let i=0;i<sequence.length-1;i++)if(v(sequence[i])&&v(sequence[i+1])){
      const g=gap(sequence[i],sequence[i+1]);
      if(g<minGap)issues.push(sequence[i]+' overlaps/touches '+sequence[i+1]+'; gap='+g+'px (minimum '+minGap+')');
   }
 }else {
   if(!v('hamburger'))issues.push('hamburger not visible at '+width);
   if(v('nav-0'))issues.push('desktop nav should be collapsed');
   for(const n of ['reserve','order','directions'])if(!v(n))issues.push(n+' missing from header');
   const sequence=['wordmarkInk','reserve','order','directions','hamburger'];
   for(let i=0;i<sequence.length-1;i++)if(v(sequence[i])&&v(sequence[i+1])){
    const g=gap(sequence[i],sequence[i+1]);
    if(g<minGap)issues.push(sequence[i]+' overlaps/touches '+sequence[i+1]+'; gap='+g+'px');
   }
 }
 const rectOverlap=(a,b)=>a.visible&&b.visible&&Math.min(a.right,b.right)-Math.max(a.left,b.left)>0.5&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>0.5;
 const relevant=['wordmarkInk','subtitleInk',...Array.from({length:6},(_,i)=>'nav-'+i),'reserve','order','directions','hamburger'];
 for(let i=0;i<relevant.length;i++)for(let j=i+1;j<relevant.length;j++){
  const a=boxes[relevant[i]],b=boxes[relevant[j]];
  if((relevant[i]==='wordmarkInk'&&relevant[j]==='subtitleInk')||(relevant[i]==='subtitleInk'&&relevant[j]==='wordmarkInk'))continue;
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

/* Mobile title and wordmark bounding-box regression tests */
report.mobileViewports=[];
for(const [width,height] of [[390,844],[375,667],[360,780]]){
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
 let ready=false;
 for(let attempt=0;attempt<12;attempt++){
  try{
   await page.goto(url+'?mobile-row-qa='+Date.now(),{waitUntil:'load',timeout:25000});
   await page.evaluate(async()=>await document.fonts.ready);
   const state=await page.evaluate(()=>{
    const row=document.querySelector('.feature');
    const title=row?.querySelector('h2');
    return {
     header:document.querySelector('.site-header')?.getBoundingClientRect().height,
     emblem:document.querySelector('.brand-pic')?.getBoundingClientRect().width,
     row:row?.getBoundingClientRect().height,
     fontSize:title?parseFloat(getComputedStyle(title).fontSize):0,
     transform:title?getComputedStyle(title).textTransform:null,
     caps:title?getComputedStyle(title).fontVariantCaps:null,
     fontWeight:title?getComputedStyle(title).fontWeight:null
    };
   });
   if(Math.abs(state.header-96)<1 && Math.abs(state.emblem-64)<1 &&
      Math.abs(state.row-96)<1 && Math.abs(state.fontSize-(width<=375?19:20))<0.5 &&
      state.transform==='none' && state.caps==='small-caps' && state.fontWeight==='400'){
     ready=true;break;
   }
  }catch(e){console.log('mobile loading retry',width,String(e).slice(0,180))}
  await new Promise(resolve=>setTimeout(resolve,10000));
 }
 if(!ready){
  report.issues.push(width+'×'+height+': new mobile title stylesheet was not deployed');
  await page.close();
  continue;
 }
 const measurements=await page.evaluate(()=>{
  const box=r=>({left:+r.left.toFixed(2),right:+r.right.toFixed(2),
    top:+r.top.toFixed(2),bottom:+r.bottom.toFixed(2),width:+r.width.toFixed(2),height:+r.height.toFixed(2)});
  const textBox=element=>{const range=document.createRange();
    range.selectNodeContents(element);return box(range.getBoundingClientRect());};
  const header=document.querySelector('.site-header');
  const emblem=document.querySelector('.brand-pic');
  const wordmark=document.querySelector('.brand-name');
  const subtitle=document.querySelector('.brand-sub');
  const toggle=document.querySelector('#nav-toggle');
  const brandBox=textBox(wordmark),subtitleBox=textBox(subtitle),toggleBox=box(toggle.getBoundingClientRect());
  const rows=[...document.querySelectorAll('.features .feature')].map(row=>{
   const h2=row.querySelector('h2'),arrow=row.querySelector('.pill'),image=row.querySelector('img');
   const rr=box(row.getBoundingClientRect()),tr=textBox(h2),ar=box(arrow.getBoundingClientRect()),im=box(image.getBoundingClientRect());
   const css=getComputedStyle(h2);
   return {title:h2.textContent.trim(),row:rr,text:tr,arrow:ar,image:im,
    fontSize:+parseFloat(css.fontSize).toFixed(2),fontWeight:css.fontWeight,
    textTransform:css.textTransform,fontVariantCaps:css.fontVariantCaps,
    letterSpacing:css.letterSpacing,
    fitsHorizontally:tr.left>=rr.left-1&&tr.right<=ar.left-5,
    fitsVertically:tr.top>=rr.top-1&&tr.bottom<=rr.bottom+1,
    imageFits:im.left>=rr.left-1&&im.right<tr.left,
    rowHeight:rr.height};
  });
  return {headerHeight:header.getBoundingClientRect().height,
   emblemDiameter:emblem.getBoundingClientRect().width,
   brandName:brandBox,subtitle:subtitleBox,hamburger:toggleBox,
   wordmarkToHamburgerGap:+(toggleBox.left-Math.max(brandBox.right,subtitleBox.right)).toFixed(2),
   horizontalOverflow:document.documentElement.scrollWidth>innerWidth,
   rows};
 });
 const problems=[];
 const expectedTitles=['Weekend Brunch','Our Menus','Craft Cocktails','Events Calendar'];
 if(measurements.rows.length!==4)problems.push('Expected 4 mobile feature rows, found '+measurements.rows.length);
 for(let i=0;i<measurements.rows.length;i++){
  const row=measurements.rows[i];
  if(row.title!==expectedTitles[i])problems.push('Incorrect Title Case for row '+(i+1)+': '+row.title);
  if(!row.fitsHorizontally)problems.push(row.title+' text intersects chevron or extends beyond row; textRight='+row.text.right+' arrowLeft='+row.arrow.left);
  if(!row.fitsVertically)problems.push(row.title+' title clipped vertically by row');
  if(!row.imageFits)problems.push(row.title+' text overlaps thumbnail');
  if(row.textTransform!=='none')problems.push(row.title+' text-transform is '+row.textTransform);
  if(row.fontVariantCaps!=='small-caps')problems.push(row.title+' font-variant-caps is '+row.fontVariantCaps);
  if(Number(row.fontWeight)>500)problems.push(row.title+' font weight too heavy: '+row.fontWeight);
  if(Math.abs(row.fontSize-(width<=375?19:20))>.6)problems.push(row.title+' font size '+row.fontSize+' differs from target');
  if(parseFloat(row.letterSpacing)>.25||parseFloat(row.letterSpacing)<-.1)problems.push(row.title+' letter spacing '+row.letterSpacing+' is too tight or too wide');
 }
 if(measurements.wordmarkToHamburgerGap<12)problems.push('Wordmark to hamburger gap '+measurements.wordmarkToHamburgerGap+'px, below 12px requirement');
 if(Math.abs(measurements.emblemDiameter-64)>1)problems.push('Emblem is not 64px');
 if(measurements.horizontalOverflow)problems.push('Horizontal scrolling detected');
 if(width===390){
  const bottom=measurements.rows[3]?.row.bottom??Infinity;
  if(bottom>height+1)problems.push('Fourth row extends below '+height+'px first viewport (bottom='+bottom+')');
 }
 const screenshot='qa-screenshots/mobile-rows-'+width+'.png';
 await page.screenshot({path:screenshot,fullPage:true});
 report.mobileViewports.push({width,height,...measurements,issues:problems,screenshot});
 report.issues.push(...problems.map(issue=>width+'×'+height+': '+issue));
 console.log('MOBILE_ROWS_QA',width,JSON.stringify({issues:problems,wordmarkClearance:measurements.wordmarkToHamburgerGap,rows:measurements.rows.map(r=>({title:r.title,fitsHorizontally:r.fitsHorizontally,fitsVertically:r.fitsVertically,text:r.text}))}));
 await page.close();
}

await browser.close();
fs.writeFileSync('qa-screenshots/header-layout.json',JSON.stringify(report,null,2));
console.log('QA_HEADER_RESULT',JSON.stringify({issues:report.issues,measured:report.viewports.map(v=>({width:v.width,...v.measured}))}));
if(report.issues.length)process.exitCode=1;
