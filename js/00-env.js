/** Solo activa modo DEV en localhost — producción (GitHub Pages) no cambia. */
var AF_ENV={
  dev:(function(){
    var h=window.location.hostname;
    return h==='localhost'||h==='127.0.0.1';
  })()
};

/** Supabase — keepalive (index.html) carga primero; acá reutilizamos esa config */
// SUPABASE_ANON_KEY — clave pública por diseño
// Los datos están protegidos por Row Level Security (RLS)
// Ver: https://supabase.com/docs/guides/auth/row-level-security
var AF_SUPABASE_URL=(window.AF_SUPABASE&&window.AF_SUPABASE.url)||'https://xntvibfsuubedplptvzs.supabase.co';
var AF_SUPABASE_KEY=(window.AF_SUPABASE&&window.AF_SUPABASE.anon)||'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhudHZpYmZzdXViZWRwbHB0dnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNDk2MjgsImV4cCI6MjA5NTkyNTYyOH0.9SaZdO7knkzSREyaUfoOX8nanid9AQwlNbY5VudWcws';
var AF_DEFAULT_SYNC_URL=''; // Apps Script compartido desactivado (fuga entre usuarios). Usar solo Supabase.
var AF_OWNER_EMAILS=['diegomc77@gmail.com'];

function afSupabaseHeaders(extra){
  var key=(typeof AF_SUPABASE_KEY==='string'&&AF_SUPABASE_KEY)||(window.AF_SUPABASE&&window.AF_SUPABASE.anon)||'';
  if(!key)throw new Error('Sin clave Supabase (borrá caché del sitio)');
  var bearer=(typeof AF_AUTH!=='undefined'&&AF_AUTH.getAccessToken&&AF_AUTH.getAccessToken())||key;
  var h={'apikey':key,'Authorization':'Bearer '+bearer};
  if(extra){Object.keys(extra).forEach(function(k){h[k]=extra[k];});}
  return h;
}
function afSupabaseUrl(){
  return (typeof AF_SUPABASE_URL==='string'&&AF_SUPABASE_URL)||(window.AF_SUPABASE&&window.AF_SUPABASE.url)||'';
}

function afGeclisaClave(k){
  return AF_ENV.dev?'DEV_'+k:k;
}

document.addEventListener('DOMContentLoaded',function(){
  if(!AF_ENV.dev)return;
  var bar=document.getElementById('topbar-mount');
  if(!bar)return;
  var b=document.createElement('div');
  b.style.cssText='background:rgba(245,158,11,.15);border:1px solid var(--warn);color:var(--warn);text-align:center;font-size:11px;padding:4px 8px;font-weight:600';
  b.textContent='MODO DESARROLLO — GECLISA usa datos DEV (no afecta a producción)';
  bar.insertBefore(b,bar.firstChild);
});
