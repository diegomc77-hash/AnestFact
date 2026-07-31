// seguridad.js — AnesFact v8
// © 2026 AnesFact — Diego MC / Dra. Huerta
// Control de dominio autorizado (login individual vía Supabase Auth en js/28-auth.js)

(function() {
  var DOMINIOS_AUTORIZADOS = [
    'diegomc77-hash.github.io',
    'localhost',
    '127.0.0.1',
    ''
  ];
  var hostActual = window.location.hostname;
  if (DOMINIOS_AUTORIZADOS.indexOf(hostActual) >= 0) return;
  document.body.innerHTML = '<div style="position:fixed;inset:0;background:#0f172a;color:#ef4444;display:flex;flex-direction:column;justify-content:center;align-items:center;z-index:9999;font-family:sans-serif;text-align:center;padding:20px;">'
    + '<div style="font-size:50px;margin-bottom:20px;">&#9888;</div>'
    + '<strong style="font-size:18px;">ACCESO NO AUTORIZADO</strong><br>'
    + '<span style="color:#cbd5e1;font-size:14px;margin-top:10px;">Esta aplicación no está autorizada para este dominio.<br>&copy; 2026 AnesFact — Diego MC / Dra. Huerta</span></div>';
})();
