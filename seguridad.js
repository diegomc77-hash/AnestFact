// seguridad.js — AnesFact v6
// Control de acceso: dominio autorizado + contraseña

(function() {

  // 🛑 CONTROL 1: Dominio autorizado
  const DOMINIOS_AUTORIZADOS = [
    "diegomc77-hash.github.io",
    "localhost",
    "127.0.0.1",
    "" // archivo local desde PC
  ];

  const hostActual = window.location.hostname;

  if (!DOMINIOS_AUTORIZADOS.includes(hostActual)) {
    document.body.innerHTML = `
      <div style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:#0f172a;color:#ef4444;display:flex;flex-direction:column;justify-content:center;align-items:center;z-index:9999;font-family:sans-serif;text-align:center;padding:20px;">
        <div style="font-size:50px;margin-bottom:20px;">⚠️</div>
        <strong style="font-size:18px;">ACCESO NO AUTORIZADO</strong><br>
        <span style="color:#cbd5e1;font-size:14px;margin-top:10px;">Esta aplicación no está autorizada para este dominio.<br>Propietario: Dra. Huerta · M.P. 32393</span>
      </div>
    `;
    return;
  }

  // 🔐 CONTROL 2: Contraseña de acceso
  const CLAVE = "AnesFact2026!";
  const STORAGE_KEY = "anesfact_sesion_ok";

  // Si ya está validado, dejar pasar
  if (localStorage.getItem(STORAGE_KEY) === 'true') return;

  // Bloquear la app hasta validar
  document.addEventListener("DOMContentLoaded", function() {

    // Ocultar contenido principal
    var app = document.getElementById('app');
    if (app) app.style.display = 'none';

    // Crear pantalla de login
    var login = document.createElement('div');
    login.id = 'anesfact_login';
    login.style = "position:fixed;top:0;left:0;width:100vw;height:100vh;background:#0f172a;display:flex;justify-content:center;align-items:center;z-index:9999;font-family:sans-serif;";

    login.innerHTML = `
      <div style="background:#1e293b;padding:32px;border-radius:12px;border:1px solid #334155;color:#fff;text-align:center;max-width:380px;width:90%;">
        <div style="font-size:44px;margin-bottom:8px;">💉</div>
        <h2 style="margin:0 0 4px 0;font-size:18px;">AnesFact</h2>
        <p style="font-size:12px;color:#94a3b8;margin:0 0 24px 0;">Ingresá la clave de acceso</p>
        <input type="password" id="af_clave_input" placeholder="Clave de acceso"
          style="width:80%;padding:10px;text-align:center;margin-bottom:14px;background:#0f172a;color:#fff;border:1px solid #475569;border-radius:6px;font-size:14px;">
        <br>
        <button id="af_clave_btn"
          style="background:#0284c7;color:#fff;border:none;padding:12px 20px;border-radius:6px;font-weight:600;cursor:pointer;width:85%;font-size:14px;">
          Ingresar
        </button>
        <p id="af_clave_error" style="color:#ef4444;font-size:12px;margin-top:12px;display:none;">
          Clave incorrecta. Intentá nuevamente.
        </p>
      </div>
    `;

    document.body.appendChild(login);

    // Validar con botón
    document.getElementById('af_clave_btn').addEventListener('click', function() {
      var val = document.getElementById('af_clave_input').value;
      if (val === CLAVE) {
        localStorage.setItem(STORAGE_KEY, 'true');
        login.remove();
        if (app) app.style.display = 'block';
      } else {
        document.getElementById('af_clave_error').style.display = 'block';
        document.getElementById('af_clave_input').value = '';
        document.getElementById('af_clave_input').focus();
      }
    });

    // Validar con Enter
    document.getElementById('af_clave_input').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') document.getElementById('af_clave_btn').click();
    });

  });

})();
