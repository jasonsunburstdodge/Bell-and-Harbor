(()=>{
 const overlay=document.querySelector('.lake-intro-overlay');
 const video=document.querySelector('#lake-intro-video');
 const welcome=document.querySelector('.lake-hero-centered');
 if(!overlay||!video||!welcome)return;
 const motion=matchMedia('(prefers-reduced-motion:reduce)');
 let frame,watchdog,finished=false;
 const finish=()=>{
  if(finished)return;
  finished=true;cancelAnimationFrame(frame);clearTimeout(watchdog);video.pause();
  overlay.style.opacity='0';overlay.hidden=true;welcome.inert=false;
 };
 const paint=()=>{
  if(finished)return;
  const time=video.currentTime;
  overlay.style.opacity=String(Math.max(0,Math.min(1,3-time)));
  if(time>=3){finish();return}
  frame=requestAnimationFrame(paint);
 };
 if(motion.matches){video.removeAttribute('autoplay');video.pause();return}
 welcome.inert=true;overlay.hidden=false;overlay.style.transition='none';overlay.style.opacity='1';
 video.muted=true;video.defaultMuted=true;video.loop=false;
 video.addEventListener('ended',finish,{once:true});
 video.addEventListener('error',finish,{once:true});
 video.querySelector('source')?.addEventListener('error',finish,{once:true});
 if(video.networkState===HTMLMediaElement.NETWORK_NO_SOURCE){finish();return}
 motion.addEventListener('change',event=>{if(event.matches)finish()});
 watchdog=setTimeout(finish,12000);
 video.play().then(()=>{frame=requestAnimationFrame(paint)}).catch(finish);
})();
