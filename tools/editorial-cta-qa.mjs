import {chromium} from 'playwright';
import fs from 'node:fs';

const base='https://jasonsunburstdodge.github.io/Bell-and-Harbor/';
const out='qa-screenshots';
const version='20261119-cool-white-blue';
const expectedCocktails=[
 ['Hazelnut Espresso Martini','$13'],['Golden Spritz','$13'],['Harbor 75','$13'],
 ['Harbor Breeze','$12'],['Misty Bay Paloma','$12'],['Purple Pier','$13'],
 ['Harbor City Old Fashioned','$14'],['Cherry Sidecar','$13'],['Sangria Sour','$13']
];
const routes=[
 ['home','', '.lake-cta'],
 ['menus','menus/', '.card-link'],
 ['main-menu','menus/main/', '.button'],
 ['brunch','menus/brunch/', '.button'],
 ['cocktails','menus/drinks/', '.button'],
 ['kids','menus/kids/', '.button'],
 ['private-events','private-events/', '.button'],
 ['events','events/', '.tabs button'],
 ['contact','contact/', '.button'],
 ['order','order/', '.button']
];
const views=routes.flatMap(([name,route,selector])=>[
 [`${name}-desktop`,route,1024,name==='home'?1000:900,selector],
 [`${name}-mobile`,route,390,844,selector]
]);
const menuCounts={'menus/main/':42,'menus/kids/':3,'menus/drinks/':9};
fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({headless:true,args:['--no-sandbox']});
const result={capturedAt:new Date().toISOString(),sourceCommit:process.env.GITHUB_SHA||null,expectedStyleVersion:version,issues:[],views:[]};

for(const [index,[name,route,width,height,selector]] of views.entries()){
 const p=await b.newPage({viewport:{width,height},deviceScaleFactor:1});
 const errors=[];
 p.on('pageerror',e=>errors.push(String(e)));
 let ready=false,metrics=null,lastLoadError=null;
 // Wait for Pages once, then fail individual stale pages promptly.
 const attempts=index===0?14:3;
 for(let attempt=0;attempt<attempts;attempt++){
  try{
   const resp=await p.goto(base+route+'?editorial-cta-qa='+Date.now(),{waitUntil:'load',timeout:25000});
   await p.evaluate(async()=>document.fonts.ready);
   metrics=await p.evaluate(({selector,route,version,needsMenuStyle})=>{
    const el=document.querySelector(selector);
    const nav=document.querySelector('.lake-navigation');
    const navLinks=[...nav.querySelectorAll('a')].map(a=>a.textContent.trim());
    const style=el?getComputedStyle(el):null;
    const nstyle=nav?getComputedStyle(nav):null;
    const bounds=el?.getBoundingClientRect();
    const header=document.querySelector('.lake-header');
    const logo=document.querySelector('.lake-logo');
    const orderBounds=nav?.getBoundingClientRect();
    const styles=[...document.querySelectorAll('link[rel=stylesheet]')].map(x=>{
     const url=new URL(x.href);
     return {name:url.pathname.split('/').pop(),version:url.searchParams.get('v')};
    });
    const required=['site-style.css','lakeside-home.css','lakeside-ctas.css'];
    if(route)required.push('lakeside-inner.css');
    if(needsMenuStyle)required.push('lakeside-menus.css');
    const brandNavy=getComputedStyle(document.documentElement).getPropertyValue('--bh-navy').trim();
    return{
     styles,brandNavy,navLinks,
     hasStyle:required.every(name=>styles.some(s=>s.name===name&&s.version===(route?version:'20261119-compact-visit')))&&styles.every(s=>s.version===(route?version:'20261119-compact-visit'))&&brandNavy==='#002140',
     headerHeight:header?.getBoundingClientRect().height,logoWidth:logo?.getBoundingClientRect().width,logoHeight:logo?.getBoundingClientRect().height,
     orderHeight:orderBounds?.height,orderFontSize:nstyle?.fontSize,orderBeforeContent:nav?getComputedStyle(nav,'::before').content:null,
     ctaFound:!!el,ctaBorderRadius:style?.borderRadius,ctaBoxShadow:style?.boxShadow,ctaLetterSpacing:style?.letterSpacing,
     ctaHeight:bounds?.height,ctaLeft:bounds?.left,ctaRight:bounds?.right,
     navShadow:nstyle?.boxShadow,navRadius:nstyle?.borderRadius,
     overflow:document.documentElement.scrollWidth>innerWidth,
     mainHeader:!!header,h1:document.querySelectorAll('h1').length
    };
   },{selector,route,version,needsMenuStyle:Object.hasOwn(menuCounts,route)});
   ready=resp?.status()===200&&metrics.hasStyle&&metrics.ctaFound&&!!metrics.ctaBoxShadow&&metrics.navLinks.join('|')==='Home|Menus|Events Calendar|Contact'&&Math.abs(metrics.headerHeight-(width<=850?100:133))<1;
   if(ready)break;
  }catch(e){lastLoadError=String(e).slice(0,250);}
  if(attempt+1<attempts)await new Promise(r=>setTimeout(r,6000));
 }
 const issues=[];
 if(!ready)issues.push('Current menu/navy styles or approved header/CTA geometry not confirmed'+(lastLoadError?': '+lastLoadError:''));
 if(metrics){
  if(metrics.overflow)issues.push('Horizontal overflow');
  if(metrics.h1!==1||!metrics.mainHeader)issues.push('Header or H1 missing');
  if(!metrics.ctaFound)issues.push('Primary control missing: '+selector);
  if(metrics.ctaRight>width+1||metrics.ctaLeft< -1)issues.push('Primary control extends beyond viewport');
  if(metrics.ctaBorderRadius!=='0px')issues.push('Primary control retained default rounding');
  if(Math.abs(metrics.headerHeight-(width<=850?100:133))>1)issues.push('Header height changed from approved 133px/100px');
 }
 if(ready){
  await p.evaluate(async()=>{for(const img of document.images){img.loading='eager';await img.decode().catch(()=>{});}});
  const content=await p.evaluate(()=>{
   const isVisible=el=>el.getClientRects().length>0&&getComputedStyle(el).visibility==='visible'&&(typeof el.checkVisibility!=='function'||el.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}));
   const rgba=value=>{
    if(!/^rgba?\(/.test(value))return null;
    const parts=value.match(/[\d.]+/g)?.map(Number);
    return parts?.length>=3?{r:parts[0],g:parts[1],b:parts[2],a:parts[3]??1}:null;
   };
   const luminance=c=>[c.r,c.g,c.b].map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
   const isNavy=c=>!!c&&c.r===0&&c.g===33&&c.b===64&&c.a===1;
   const label=el=>el.tagName.toLowerCase()+(el.id?'#'+el.id:'')+[...el.classList].slice(0,3).map(c=>'.'+c).join('');
   const darkTextViolations=[];
   let darkTextCount=0;
   for(const el of document.querySelectorAll('body *')){
    if(!isVisible(el))continue;
    const hasText=[...el.childNodes].some(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim());
    if(!hasText&&!el.matches('input,textarea,select'))continue;
    const color=getComputedStyle(el).color,c=rgba(color);
    // Test all dark text regardless of background. Light cream/white and gold
    // on heroes, cards, buttons and footers remain permitted.
    if(c&&c.a>0&&luminance(c)<=.35){
     darkTextCount++;
     if(!isNavy(c))darkTextViolations.push({element:label(el),color,text:el.matches('input,textarea,select')?null:el.textContent.trim().slice(0,90)});
    }
   }
   const placeholders=[...document.querySelectorAll('input[placeholder],textarea[placeholder]')].filter(el=>isVisible(el)&&el.getAttribute('placeholder').trim()).map(el=>{
    const c=getComputedStyle(el,'::placeholder');
    return {element:label(el),color:c.color,opacity:c.opacity,valid:isNavy(rgba(c.color))&&Number(c.opacity)===1};
   });
   const html=document.documentElement.outerHTML;
   const visibleText=document.body.innerText;
   const privateContent=[];
   if(/\b(?:staff menu|internal (?:use|notes?|training|only)|for staff(?: only)?|staff (?:reference|instructions|notes?|training))\b/i.test(visibleText))privateContent.push('Internal staff wording');
   if(/(?:https?:)?\/\/(?:docs|drive)\.google\.com\//i.test(html))privateContent.push('Private source Drive URL');
   if(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(html))privateContent.push('Email address');
   const dishes=[...document.querySelectorAll('.menu-dish')].map(el=>({name:el.querySelector('h3')?.textContent.trim(),price:el.querySelector('.menu-price')?.textContent.trim()??null,description:el.querySelector('.menu-description')?.textContent.trim()??null,option:el.querySelector('.menu-option')?.textContent.trim()??null}));
   return {darkTextCount,darkTextViolations,placeholders,privateContent,dishes,menuPriceCount:document.querySelectorAll('.menu-price').length,brokenImages:[...document.images].filter(x=>!x.complete||!x.naturalWidth).map(x=>x.currentSrc||x.src)};
  });
  metrics={...metrics,...content};
  if(content.darkTextViolations.length)issues.push('Dark text is not exact navy: '+content.darkTextViolations.map(x=>`${x.element} ${x.color}`).join('; '));
  const invalidPlaceholders=content.placeholders.filter(x=>!x.valid);
  if(invalidPlaceholders.length)issues.push('Placeholder text must be navy at opacity 1: '+invalidPlaceholders.map(x=>`${x.element} ${x.color} / ${x.opacity}`).join('; '));
  if(content.privateContent.length)issues.push('Private source information published: '+content.privateContent.join(', '));
  if(content.brokenImages.length)issues.push('Broken images: '+content.brokenImages.join(', '));
  if(Object.hasOwn(menuCounts,route)){
   if(content.dishes.length!==menuCounts[route])issues.push(`Expected ${menuCounts[route]} dishes, found ${content.dishes.length}`);
   if(route!=='menus/drinks/'&&content.menuPriceCount!==0)issues.push('Food prices were added without source pricing');
   if(route==='menus/drinks/'){
    if(content.menuPriceCount!==9)issues.push('Expected prices for all nine cocktails');
    for(const [name,price] of expectedCocktails){
     const matches=content.dishes.filter(d=>d.name===name);
     if(matches.length!==1||matches[0].price!==price)issues.push(`Cocktail name/price mismatch: ${name} ${price}`);
    }
    const harbor75=content.dishes.find(d=>d.name==='Harbor 75');
    if(!/champagne/i.test(harbor75?.option||'')||!/(?:\+\s*\$3|\$3\s*(?:upgrade|extra))/i.test(harbor75?.option||''))issues.push('Harbor 75 champagne +$3 upgrade missing');
   }
  }
  await p.screenshot({path:out+'/editorial-cta-'+name+'.png',fullPage:Object.hasOwn(menuCounts,route)});
 }
 if(errors.length)issues.push('JavaScript errors: '+errors.join('; '));
 result.views.push({name,route,width,height,ready,metrics,issues});
 result.issues.push(...issues.map(x=>name+': '+x));
 console.log(name,JSON.stringify({ready,issues,darkTextChecked:metrics?.darkTextCount,dishes:metrics?.dishes?.length}));
 await p.close();
}
await b.close();
fs.writeFileSync(out+'/editorial-cta-report.json',JSON.stringify(result,null,2));
console.log('SUMMARY',JSON.stringify({at:result.capturedAt,views:result.views.length,issues:result.issues}));
if(result.issues.length)process.exitCode=1;
