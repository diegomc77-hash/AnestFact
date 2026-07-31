function sugerirPosicion(){
  var diag=(document.getElementById('f-diag')?document.getElementById('f-diag').value:'').toLowerCase();
  var ciru=(document.getElementById('f-ciru')?document.getElementById('f-ciru').value:'').toLowerCase();
  var txt=diag+' '+ciru;
  var pos='';
  // Decúbito ventral — columna, posterior
  if(/columna|laminect|fusion.*lumbar|hernia.*disco|quiste.*pilonidal|pilonidal|aquiles|poplite|dorsal|posterior|proct|fistula.*anal|hemorroid|fistulect|perianal|coccig|sacrococ/i.test(txt))
    pos='DECUBITO VENTRAL';
  // Litotomía / Ginecológica
  else if(/histerect|legrado|conizac|colposcop|vaginal|vulvect|cistoscop|tur-p|prostat.*transuretral|hemorroid|fistula.*anal|perineorrafia|colpoperineorrafia/i.test(txt))
    pos='GINECOLOGÍA';
  // Lateral derecho — riñón izquierdo, suprarrenal izq, pulmón izquierdo
  else if(/nefr.*izq|renal.*izq|suprarenal.*izq|lobectom.*izq|toracotom.*izq|pulmon.*izq/i.test(txt))
    pos='DERECHO LATERAL';
  // Lateral izquierdo — riñón derecho, pulmón derecho, cadera derecha
  else if(/nefr.*der|renal.*der|suprarenal.*der|lobectom.*der|toracotom.*der|pulmon.*der|cadera.*der|artroplast.*der/i.test(txt))
    pos='IZQUIERDO LATERAL';
  // Lateral genérico — toracotomía, nefrectomía sin lado especificado
  else if(/toracotom|lobectom|nefr|suprarenal|cadera.*reemplaz|artroplast.*cadera/i.test(txt))
    pos='IZQUIERDO LATERAL';
  // Dorsal — todo lo demás (default)
  else if(txt.trim().length>3)
    pos='DECUBITO DORSAL';

  var sel=document.getElementById('f-mayo-posicion');
  var sug=document.getElementById('posicion-sugerida');
  if(!sel||!sug)return;
  if(pos){
    sug.style.display='block';
    sug.innerHTML='💡 Sugerida: <strong>'+pos+'</strong> &nbsp;<button class="btn btn-s" style="padding:2px 8px;font-size:11px" onclick="confirmarPosicion(\'' +pos+ '\')">Confirmar</button>';
  } else {
    sug.style.display='none';
  }
}
function confirmarPosicion(pos){
  var sel=document.getElementById('f-mayo-posicion');
  if(sel)sel.value=pos;
  var sug=document.getElementById('posicion-sugerida');
  if(sug)sug.style.display='none';
}

