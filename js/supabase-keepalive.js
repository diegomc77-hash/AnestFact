// AnesFact — mantiene Supabase activo (plan free pausa ~7 días sin uso)
(function(){
  var SUPABASE_URL='https://xntvibfsuubedplptvzs.supabase.co';
  var SUPABASE_ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhudHZpYmZzdXViZWRwbHB0dnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNDk2MjgsImV4cCI6MjA5NTkyNTYyOH0.9SaZdO7knkzSREyaUfoOX8nanid9AQwlNbY5VudWcws';
  var INTERVAL_MS=6*60*60*1000; // cada 6 h con la app abierta

  window.AF_SUPABASE={url:SUPABASE_URL,anon:SUPABASE_ANON};

  function ping(){
    try{
      var x=new XMLHttpRequest();
      x.open('GET',SUPABASE_URL+'/rest/v1/anesfact_datos?select=clave&limit=1',true);
      x.setRequestHeader('apikey',SUPABASE_ANON);
      x.setRequestHeader('Authorization','Bearer '+SUPABASE_ANON);
      x.send();
    }catch(e){}
  }

  ping();
  setInterval(ping,INTERVAL_MS);
  document.addEventListener('visibilitychange',function(){
    if(!document.hidden)ping();
  });
})();
