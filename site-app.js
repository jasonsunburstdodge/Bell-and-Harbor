(()=>{
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const t=q('#nav-toggle'),n=q('#site-nav');
if(t&&n){t.addEventListener('click',()=>{const open=n.classList.toggle('open');t.setAttribute('aria-expanded',String(open))});n.addEventListener('click',e=>{if(e.target.closest('a')){n.classList.remove('open');t.setAttribute('aria-expanded','false')}})}
const y=q('#year');if(y)y.textContent=String(new Date().getFullYear());
const track=(action)=>{if(Array.isArray(window.dataLayer))window.dataLayer.push({event:'bell_harbor_action',action});};
qa('[data-track]').forEach(a=>a.addEventListener('click',()=>track(a.dataset.track)));
qa('form[data-preview]').forEach(f=>f.addEventListener('submit',e=>{e.preventDefault();if(!f.reportValidity())return;const s=f.querySelector('[role=status]');if(s){s.textContent='Preview only: no request was sent. The restaurant provider must be connected before submissions can be accepted.';s.className='notice'}track(f.dataset.preview)}));
const date=q('#r-date');if(date){const d=new Date();date.min=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
qa('[data-view]').forEach(b=>b.addEventListener('click',()=>{qa('[data-view]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b))});q('#event-list').hidden=b.dataset.view!=='list';q('#event-calendar').hidden=b.dataset.view!=='calendar'}));
qa('[data-filter]').forEach(b=>b.addEventListener('click',()=>{qa('[data-filter]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b))})}));
const cal=q('#cal-grid');if(cal){const d=new Date();d.setDate(1);q('#cal-title').textContent=d.toLocaleDateString('en-US',{month:'long',year:'numeric'});let out=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(x=>'<span class="day">'+x+'</span>').join('');for(let i=0;i<d.getDay();i++)out+='<span></span>';for(let j=1;j<=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();j++)out+='<span>'+j+'</span>';cal.innerHTML=out}
qa('[data-order]').forEach(b=>b.addEventListener('click',()=>{qa('[data-order]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));q('#order-status').textContent=(b.dataset.order==='pickup'?'Pick-up':'Delivery')+' selected. Ordering is not connected, and no order has been placed.';track('order_'+b.dataset.order)}));
})();