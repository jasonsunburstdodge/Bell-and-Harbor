(()=>{
 const video=document.querySelector('#lake-hero-video'),still=document.querySelector('.lake-video-still'),button=document.querySelector('.lake-video-pause');
 if(!video||!still||!button)return;
 const finish=()=>{video.pause();video.hidden=true;still.hidden=false;button.hidden=true};
 video.muted=true;video.defaultMuted=true;video.loop=false;
 video.addEventListener('ended',finish,{once:true});
 video.addEventListener('error',finish,{once:true});
 if(matchMedia('(prefers-reduced-motion:reduce)').matches){video.removeAttribute('autoplay');finish();return}
 button.addEventListener('click',()=>{if(video.paused){video.play().then(()=>button.textContent='Pause video').catch(finish)}else{video.pause();button.textContent='Play video'}});
 video.play().catch(finish);
})();
