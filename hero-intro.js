(()=>{
 const overlay=document.querySelector('.lake-intro-overlay');
 const video=document.querySelector('#lake-intro-video');
 const still=document.querySelector('.lake-intro-final');
 const welcome=document.querySelector('.lake-hero-centered');
 if(!overlay||!video||!still||!welcome)return;
 const motion=matchMedia('(prefers-reduced-motion:reduce)');
 let timer,watchdog,finished=false;
 const reveal=(immediate=false)=>{
  if(finished)return;
  finished=true;clearTimeout(timer);clearTimeout(watchdog);video.pause();
  const cleanup=()=>{overlay.hidden=true;welcome.inert=false};
  if(immediate){cleanup();return}
  overlay.classList.add('is-revealing');setTimeout(cleanup,800);
 };
 if(motion.matches){video.removeAttribute('autoplay');video.pause();return}
 welcome.inert=true;overlay.hidden=false;video.muted=true;video.defaultMuted=true;video.loop=false;
 video.addEventListener('ended',()=>{
  clearTimeout(watchdog);video.pause();video.hidden=true;still.hidden=false;
  timer=setTimeout(()=>reveal(),1000);
 },{once:true});
 video.addEventListener('error',()=>reveal(true),{once:true});
 video.querySelector('source')?.addEventListener('error',()=>reveal(true),{once:true});
 if(video.networkState===HTMLMediaElement.NETWORK_NO_SOURCE){reveal(true);return}
 motion.addEventListener('change',event=>{if(event.matches)reveal(true)});
 watchdog=setTimeout(()=>reveal(true),12000);
 video.play().catch(()=>reveal(true));
})();
