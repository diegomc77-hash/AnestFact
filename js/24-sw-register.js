(function(){
  var banner=document.getElementById('offline-banner');
  function setOffline(on){
    if(!banner)return;
    banner.style.display=on?'block':'none';
  }
  window.addEventListener('online',function(){setOffline(false);});
  window.addEventListener('offline',function(){setOffline(true);});
  if(typeof navigator!=='undefined'&&!navigator.onLine)setOffline(true);
  if('serviceWorker' in navigator){
    window.addEventListener('load',function(){
      navigator.serviceWorker.register('./sw.js?v=12.12').then(function(reg){
        if(reg.waiting)reg.waiting.postMessage({type:'SKIP_WAITING'});
        navigator.serviceWorker.addEventListener('message',function(ev){
          if(ev.data&&ev.data.type==='OFFLINE')setOffline(true);
          if(ev.data&&ev.data.type==='ONLINE')setOffline(false);
        });
      }).catch(function(){});
    });
  }
})();
