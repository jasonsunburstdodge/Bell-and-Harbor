(()=>{
 const video=document.querySelector('#lake-hero-video'),still=document.querySelector('.lake-video-still');
 if(!video||!still)return;
 const finish=()=>{video.pause();video.hidden=true;still.hidden=false};
 video.muted=true;video.defaultMuted=true;video.loop=false;
 video.addEventListener('ended',finish,{once:true});
 video.addEventListener('error',finish,{once:true});
 if(matchMedia('(prefers-reduced-motion:reduce)').matches){video.removeAttribute('autoplay');finish();return}
 video.play().catch(finish);
})();
