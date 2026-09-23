/** Favoritos de prácticas NOM — por usuario, localStorage. */
function afNomFavKey(){
  var uid=(typeof AF_AUTH!=='undefined'&&AF_AUTH.getUserId)?(AF_AUTH.getUserId()||''):'';
  return 'af_nom_favs_'+(uid||'anon');
}
function afNomFavsGet(){
  try{
    var raw=localStorage.getItem(afNomFavKey());
    if(raw){var arr=JSON.parse(raw);if(Array.isArray(arr))return arr;}
  }catch(e){}
  return [];
}
function afNomFavsSave(list){
  try{localStorage.setItem(afNomFavKey(),JSON.stringify(list));}catch(e){}
}
function afNomFavToggle(cod,ev){
  if(ev){try{ev.preventDefault();ev.stopPropagation();}catch(e){}}
  if(!cod)return;
  var favs=afNomFavsGet();
  var i=favs.indexOf(cod);
  if(i>=0)favs.splice(i,1);else favs.unshift(cod);
  afNomFavsSave(favs);
  var qEl=document.getElementById('nom-q');
  if(qEl)buscarNom(qEl.value||'');
}
function afNomNorm(s){
  return (s||'').toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .toLowerCase();
}
/** ¿Alguna palabra de la descripción empieza con ql (ya normalizado)? */
function afNomWordPrefix(desc,ql){
  if(!ql)return false;
  var d=afNomNorm(desc);
  if(d.indexOf(ql)===0)return true;
  var parts=d.split(/[^a-z0-9]+/);
  for(var i=0;i<parts.length;i++){
    if(parts[i]&&parts[i].indexOf(ql)===0)return true;
  }
  return false;
}
/**
 * Ranking: 0 = prefijo de palabra en desc, 1 = substring en desc, 2 = código exacto.
 * No usa sección. -1 = no matchea.
 */
function afNomRank(n,ql){
  var desc=afNomNorm(n.desc);
  if(afNomWordPrefix(n.desc,ql))return 0;
  if(desc.indexOf(ql)>=0)return 1;
  if((n.cod||'').toLowerCase()===ql)return 2;
  return -1;
}
function buscarNom(q){
  var r=document.getElementById('nom-res');
  if(!r)return;
  if(!q||q.length<2){r.innerHTML='<p style="font-size:12px;color:var(--text3);text-align:center;padding:20px">Escribí para buscar</p>';return;}
  var ql=afNomNorm(q);
  var favs=afNomFavsGet();
  var scored=[];
  for(var i=0;i<(NOM||[]).length;i++){
    var n=NOM[i];
    var rank=afNomRank(n,ql);
    if(rank<0)continue;
    scored.push({n:n,rank:rank,fav:favs.indexOf(n.cod)>=0?0:1,idx:i});
  }
  scored.sort(function(a,b){
    if(a.fav!==b.fav)return a.fav-b.fav;
    if(a.rank!==b.rank)return a.rank-b.rank;
    return a.idx-b.idx;
  });
  var hits=scored.slice(0,15);
  if(!hits.length){r.innerHTML='<p style="font-size:12px;color:var(--text3);text-align:center;padding:20px">Sin resultados</p>';return;}
  r.innerHTML=hits.map(function(h){
    var n=h.n;
    var isFav=h.fav===0;
    return '<div class="nom-r" data-cod="'+n.cod+'" style="display:flex;align-items:flex-start;gap:8px;cursor:pointer">'
      +'<span class="ac-star" style="cursor:pointer;font-size:15px;line-height:1.2;color:'+(isFav?'#f5b942':'var(--text3)')+'" title="'+(isFav?'Quitar de favoritas':'Marcar como favorita')+'">'+(isFav?'★':'☆')+'</span>'
      +'<div style="flex:1;min-width:0">'
      +'<div style="font-size:12px;font-family:monospace;color:var(--green)">'+n.cod+'</div>'
      +'<div style="font-size:14px;margin-top:2px">'+n.desc+'</div>'
      +'<div style="font-size:11px;color:var(--text3);margin-top:2px">Complejidad '+n.comp+' · '+n.sec+'</div>'
      +'</div></div>';
  }).join('');
  r.onclick=function(e){
    var t=e.target;
    while(t&&t!==r){
      if(t.className&&String(t.className).indexOf('ac-star')>=0){
        var row=t;
        while(row&&row!==r){
          if(row.className&&String(row.className).indexOf('nom-r')>=0)break;
          row=row.parentNode;
        }
        if(row)afNomFavToggle(row.getAttribute('data-cod'),e);
        return;
      }
      t=t.parentNode;
    }
    t=e.target;
    while(t&&t!==r){
      if(t.className&&String(t.className).indexOf('nom-r')>=0)break;
      t=t.parentNode;
    }
    if(!t||t===r)return;
    var cod=t.getAttribute('data-cod');
    var found=null;
    for(var j=0;j<(NOM||[]).length;j++){if(NOM[j].cod===cod){found=NOM[j];break;}}
    if(found)agregarPrac(found.cod,found.desc,found.comp);
  };
}
function agregarPrac(cod,desc,comp){
  if(!S.cur){toast('Abrí una intervención primero');return;}
  if(S.cur.pracs.some(function(p){return p.cod===cod;})){toast('Ya está agregada');return;}
  S.cur.pracs.push({cod:cod,desc:desc,comp:comp});toast('Agregada: '+desc);go('facturacion');renderPracs();
}
