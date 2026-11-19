(() => {
  'use strict';
  const destination = encodeURIComponent('6601 Mediterranean Drive, McKinney, TX 75072');
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  // HTTPS map links open the installed app where supported, or the web map.
  const url = isIOS
    ? `https://maps.apple.com/?daddr=${destination}&dirflg=d`
    : `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
  document.querySelectorAll('[data-map-directions]').forEach(link => {
    link.href = url;
  });
})();
