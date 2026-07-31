function buscarNom(q){
  var r=document.getElementById('nom-res');
  if(!q||q.length<2){r.innerHTML='<p style="font-size:12px;color:var(--text3);text-align:center;padding:20px">Escribí para buscar</p>';return;}
  var ql=q.toLowerCase();
  var hits=NOM.filter(function(n){return n.cod.indexOf(ql)>=0||n.desc.toLowerCase().indexOf(ql)>=0||n.sec.toLowerCase().indexOf(ql)>=0;}).slice(0,15);
  if(!hits.length){r.innerHTML='<p style="font-size:12px;color:var(--text3);text-align:center;padding:20px">Sin resultados</p>';return;}
  r.innerHTML=hits.map(function(n){
    return '<div class="nom-r" onclick="agregarPrac(\''+n.cod+'\',\''+n.desc.replace(/'/g,"\\'")+'\','+n.comp+')">'
      +'<div style="font-size:12px;font-family:monospace;color:var(--green)">'+n.cod+'</div>'
      +'<div style="font-size:14px;margin-top:2px">'+n.desc+'</div>'
      +'<div style="font-size:11px;color:var(--text3);margin-top:2px">Complejidad '+n.comp+' · '+n.sec+'</div></div>';
  }).join('');
}
function agregarPrac(cod,desc,comp){
  if(!S.cur){toast('Abrí una intervención primero');return;}
  if(S.cur.pracs.some(function(p){return p.cod===cod;})){toast('Ya está agregada');return;}
  S.cur.pracs.push({cod:cod,desc:desc,comp:comp});toast('Agregada: '+desc);go('facturacion');renderPracs();
}

