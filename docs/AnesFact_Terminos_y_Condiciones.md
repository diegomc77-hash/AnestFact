# TÉRMINOS Y CONDICIONES DE USO — ANESFACT
## Incluye Deslinde de Responsabilidad Médica y Política de Datos de Salud

**⚠️ DOCUMENTO BORRADOR TÉCNICO-JURÍDICO — PENDIENTE DE REVISIÓN Y FIRMA DE ABOGADO MATRICULADO (v2.1)**

Este documento fue elaborado como base técnica y estructural, fundamentado en el Código Civil y Comercial de la Nación, la Ley 26.529 (Derechos del Paciente), la Ley 25.326 (Protección de Datos Personales), la Ley 25.506 (Firma Digital, a los solos efectos de distinguirla de la firma gráfica de la Aplicación), y la práctica habitual de software de apoyo a la documentación clínica. **No sustituye el asesoramiento de un abogado matriculado.** Antes de publicar este documento o de que un solo usuario lo acepte, debe ser revisado, ajustado y validado por un profesional del derecho matriculado en la Provincia de Córdoba, con conocimiento en derecho sanitario, protección de datos y responsabilidad civil.

**Naturaleza del producto (clave de interpretación de todo el documento):** AnesFact es una aplicación de **ayuda administrativa y de documentación** para confeccionar y trasladar una foja anestésica y datos asociados. **No diagnostica, no indica terapéutica de cumplimiento obligatorio, no ejerce la medicina y no sustituye al profesional matriculado.**

**Checklist de pendientes antes de publicar (por orden de prioridad):**

1. 🔴 Completar corchetes de identidad del Titular (razón social, CUIT, domicilio, correo de contacto AAIP/ARCO).
2. 🔴 Confirmar en el panel de Supabase la **región exacta** del proyecto y completar el apartado 4.6.a.
3. 🔴 Validación prioritaria del abogado de la **sección 4.4** (base legal de datos sensibles) y de la eventual **inscripción AAIP** (4.7).
4. 🟡 Confirmación ANMAT / software como producto médico (3.1.bis).
5. 🟡 Publicar el **aviso breve al Paciente** del QR (texto aparte; borrador en `docs/AnesFact_Aviso_Privacidad_Paciente_QR.md`).
6. 🟡 Definir plazo de gracia de baja (8.3.bis) y canal operativo de exportación/eliminación.

Última actualización: [COMPLETAR FECHA]  
Versión: [COMPLETAR — ej. v1.0-2026-08-08]  
Hash SHA-256 del presente texto: [COMPLETAR AL PUBLICAR — se calcula sobre el archivo definitivo sin este renglón, o se fija al generar el muro de aceptación]

---

## 1. QUIÉNES SOMOS Y QUÉ ES ANESFACT

1.1. AnesFact (en adelante, "la Aplicación", "el Sistema" o "la Plataforma") es una herramienta de software desarrollada por **[NOMBRE COMPLETO / RAZÓN SOCIAL A COMPLETAR]**, CUIT **[COMPLETAR]**, con domicilio en **[COMPLETAR CALLE Y LOCALIDAD]**, Provincia de Córdoba, República Argentina (en adelante, "el Titular" o "el Desarrollador"). Correo de contacto para cuestiones legales y de datos personales: **[COMPLETAR EMAIL]**.

1.2. AnesFact es una **herramienta de asistencia administrativa y de apoyo a la documentación clínica** para profesionales de la anestesiología. Permite, entre otras funciones: registrar y organizar fojas anestésicas; calcular **sugerencias** de dosificación farmacológica a partir de parámetros ingresados por el Usuario; generar **esquemas anestésicos sugeridos** de carácter orientativo; facilitar la carga o traslado de datos hacia sistemas de terceros (incluyendo, sin limitarse a, ADAARC/evweb/GECLISA u otros sistemas de gestión sanatorial), siempre por acción del Usuario; y organizar información de valoración preanestésica.

1.3. **AnesFact NO es un dispositivo médico registrado, NO es un sistema de diagnóstico, NO prescribe, NO ejerce la medicina, y NO reemplaza el criterio clínico del profesional matriculado que la utiliza.** Es una herramienta informática de productividad, organización y apoyo a la confección de documentación, sujeta en todo momento al juicio profesional del Usuario. Ninguna salida de la Aplicación constituye por sí sola una indicación médica ni un acto médico.

1.4. El uso de la Aplicación está destinado exclusivamente a **profesionales de la salud con matrícula habilitante**. Queda prohibido el uso por personas no habilitadas para el acto médico correspondiente.

---

## 2. DEFINICIONES

- **"Usuario" o "Profesional"**: persona física matriculada para el ejercicio de la medicina (especialidad anestesiología u otra habilitante), que utiliza la Aplicación en el marco de su actividad profesional.
- **"Paciente"**: persona cuyos datos de salud son ingresados por el Usuario —o, en el módulo QR, por el propio Paciente o su representante— en el marco de un acto médico.
- **"Institución"**: sanatorio, hospital, clínica u organización de salud que eventualmente contrate el uso de la Aplicación para varios de sus profesionales.
- **"Sugerencia" o "Esquema sugerido"**: toda salida generada por la Aplicación mediante motores de reglas, cálculos matemáticos o cualquier otro mecanismo automatizado, referida a dosificación, técnica anestésica, riesgo ASA, o cualquier otro dato de naturaleza clínica. Tiene carácter **orientativo**.
- **"Datos de Salud"**: información sensible en los términos del art. 2 de la Ley 25.326, referida al estado de salud físico o psíquico de una persona.
- **"Firma gráfica certificada (en la Aplicación)"**: imagen de firma del Usuario asociada de forma inmodificable a su cuenta y matrícula dentro de AnesFact, a efectos de documentación. **No constituye "firma digital" ni "firma electrónica avanzada"** en los términos de la Ley 25.506, salvo que en el futuro se integre un prestador de servicios de certificación habilitado y así se declare expresamente.

---

## 3. NATURALEZA DEL SERVICIO Y DESLINDE DE RESPONSABILIDAD MÉDICA

### 3.1. La Aplicación no ejerce la medicina

AnesFact no realiza diagnósticos, no prescribe tratamientos, no autoriza ni desautoriza conductas médicas, y ninguna de sus funciones —incluidas las calculadoras de dosificación, los esquemas anestésicos sugeridos, las alertas de riesgo o las clasificaciones ASA generadas por motor de reglas— constituye un acto médico ni una indicación de obligatorio cumplimiento. Su finalidad principal es **ayudar a documentar y organizar la foja anestésica y datos asociados**, y a trasladarlos cuando el Usuario así lo disponga.

### 3.1.bis. AnesFact no es un dispositivo médico registrado

AnesFact no se encuentra registrado ante la Administración Nacional de Medicamentos, Alimentos y Tecnología Médica (ANMAT) como producto médico ni como software con función clínica autónoma. El Desarrollador sostiene que la Aplicación no diagnostica ni determina por sí un curso de acción terapéutico de cumplimiento obligatorio, y que toda salida está sujeta a validación profesional previa a su aplicación.

**Esta afirmación debe ser confirmada por el profesional del derecho a cargo de la revisión**, evaluando específicamente si algún módulo —en especial calculadoras de dosificación y esquemas sugeridos— pudiera quedar alcanzado por la normativa de ANMAT sobre software como producto médico (*Software as a Medical Device*), en cuyo caso correspondería adecuar el desarrollo y el presente documento **antes** de su publicación a escala.

### 3.2. Toda sugerencia requiere validación profesional obligatoria

Todo dato, cálculo, dosis, técnica o alerta que la Aplicación genere tiene carácter **exclusivamente informativo y orientativo**. Su uso, adaptación, modificación o rechazo es responsabilidad exclusiva, indelegable y excluyente del profesional matriculado que la utiliza, quien actúa en ejercicio de su libertad de prescripción y de su responsabilidad profesional individual conforme la *lex artis* vigente.

La Aplicación fue diseñada para que ninguna sugerencia se traslade a la foja clínica oficial sin una **acción afirmativa, consciente y expresa** del profesional (por ejemplo, "aceptar y pasar a foja"), quedando excluida toda automatización que prescinda del juicio médico.

### 3.3. Fundamento normativo del deslinde

El presente deslinde se funda, entre otros, en:

- **Código Civil y Comercial de la Nación (arts. 1749 a 1756 y concordantes)**: la responsabilidad civil del profesional de la salud requiere, como regla, un factor de atribución subjetivo (culpa), evaluado según las circunstancias de persona, tiempo y lugar. La obligación del profesional médico es, como regla general, **de medios y no de resultado**. AnesFact es un medio auxiliar a disposición del profesional, sujeto a su evaluación y criterio.
- **Doctrina y jurisprudencia en la materia**: la responsabilidad médica se configura, en lo sustancial, por error de diagnóstico o tratamiento inapropiado imputable a culpa del profesional (negligencia, imprudencia o imperise), no por la mera existencia de una herramienta de apoyo que el profesional decidió utilizar, adaptar o descartar.
- **Ley 26.529**: el profesional interviniente mantiene el deber de información al paciente y el deber de dejar constancia fehaciente de sus decisiones clínicas en la historia clínica, con independencia de las herramientas de apoyo administrativo que utilice.

### 3.4. Exclusión expresa de responsabilidad del Desarrollador

Sin perjuicio de lo establecido en la Ley de Defensa del Consumidor (Ley 24.240) en cuanto resulte aplicable a la relación entre el Usuario y el Desarrollador respecto del **funcionamiento técnico del software**, **el Desarrollador no asume responsabilidad alguna por**:

a) Decisiones clínicas adoptadas por el Usuario, hayan estado o no precedidas por una sugerencia de la Aplicación;  
b) Daños derivados de la adaptación, modificación o falta de verificación de una sugerencia por parte del Usuario;  
c) Errores originados en datos incorrectos, incompletos o desactualizados ingresados por el Usuario o por el Paciente (o su representante) a través de los formularios de valoración preanestésica;  
d) Indisponibilidad temporal del Sistema, fallas de conectividad, o discontinuidad del servicio, sin perjuicio del deber del Desarrollador de actuar con diligencia razonable para restablecer el servicio;  
e) El contenido, disponibilidad, reglas de validación o resultados de **sistemas de terceros** hacia los cuales la Aplicación facilita el traslado de datos (incluyendo ADAARC/evweb/GECLISA u otros), sobre los cuales el Desarrollador no tiene control ni injerencia. El Usuario es quien inicia y controla cada envío;  
f) El uso de la cuenta por terceros a quienes el Usuario hubiere facilitado sus credenciales, en violación del punto 5.3.

Esta exclusión **no alcanza** a los daños que resulten directamente atribuibles a un **defecto de programación comprobado** que haya alterado, sin intervención del Usuario, un dato clínico ya validado y aceptado por este, en cuyo caso resultará aplicable el régimen general de responsabilidad por productos y servicios del ordenamiento vigente.

### 3.5. Módulo de valoración preanestésica por código QR

3.5.1. La Aplicación cuenta con un módulo mediante el cual el Paciente —o su representante—, a través de un código QR generado por el Usuario profesional, puede cargar datos de valoración preanestésica (antecedentes, medicación habitual, estudios complementarios y demás información clínica).

3.5.2. Dicha carga **se realiza en el marco de la relación asistencial ya existente** entre el Paciente y el Usuario profesional que generó el código QR, y **no origina** una relación de consumo autónoma, directa ni independiente entre el Paciente y el Desarrollador en los términos de la Ley 24.240. El Desarrollador actúa exclusivamente como proveedor de la infraestructura técnica que canaliza información hacia el profesional interviniente, sin intervenir, evaluar, interpretar ni validar clínicamente dicha información por cuenta propia.

3.5.3. El procesamiento automatizado de la información cargada por el Paciente (incluyendo, si correspondiera, el cálculo orientativo de riesgo ASA o la generación de alertas) constituye una sugerencia sujeta a la validación del Usuario profesional (puntos 3.1 a 3.4), y no genera una prestación de servicios de salud directa entre el Desarrollador y el Paciente.

3.5.4. El acceso del Paciente a este módulo se realiza mediante un enlace de sesión temporal, de uso limitado y vinculado al profesional interviniente, sin requerir la creación de una cuenta de usuario por parte del Paciente.

3.5.5. El Desarrollador asume, respecto de los datos cargados por el Paciente a través de este módulo, las obligaciones de confidencialidad y seguridad de la Sección 4, en su carácter de **encargado del tratamiento**.

3.5.6. **Aviso de privacidad para el Paciente:** con carácter previo a la carga de datos, la pantalla del formulario QR deberá exhibir un aviso breve, en lenguaje claro, independiente de este documento (dirigido al profesional). Dicho aviso informará como mínimo: (a) quién trata sus datos (el profesional interviniente, a través de la Aplicación); (b) para qué se utilizan (elaborar su valoración preanestésica); (c) que no requiere crear una cuenta; (d) que el enlace es temporal; y (e) la confidencialidad propia del acto médico. **No se remitirá al Paciente a la lectura de estos Términos extensos.**

3.5.7. **Menores o personas sin capacidad para prestar consentimiento:** la carga deberá ser realizada por su representante legal, progenitor, tutor o persona de apoyo, conforme el CCCN (arts. 24 a 32 y concordantes) y la normativa de derechos del paciente. La Aplicación **no verifica por sí** la edad o capacidad de quien completa el formulario; esa verificación recae en el Usuario profesional al generar el QR y al recibir la información.

### 3.6. Aceptación activa obligatoria (doble casillero)

Antes del primer uso de cada versión vigente del documento, y de forma no eludible, la Aplicación exigirá la aceptación expresa y registrada mediante **dos declaraciones separadas** (ambos casilleros obligatorios):

**Casillero 1 — Aceptación general de los Términos:**

> *"He leído y acepto en su totalidad los Términos y Condiciones de Uso de AnesFact, incluyendo el Deslinde de Responsabilidad Médica y la Política de Datos de Salud."*

**Casillero 2 — Declaración profesional específica:**

> *"Declaro ser un profesional matriculado en la especialidad de anestesiología (o especialidad habilitante), y entiendo que AnesFact es una herramienta de apoyo administrativo y de cálculo para documentar y organizar la foja anestésica, que en ningún caso reemplaza mi criterio clínico, mi responsabilidad profesional ni las normas de la lex artis. Toda sugerencia generada por el sistema será evaluada, validada o descartada bajo mi exclusivo juicio profesional antes de ser aplicada a un paciente. Entiendo que AnesFact no ejerce la medicina ni actúa como médico."*

El botón **"Acepto"** solo se habilita con ambos casilleros tildados. El botón **"No acepto"** impide el uso de la Aplicación y solo permite cerrar sesión.

El registro de aceptación será **inmutable** (solo inserción de filas nuevas) e incluirá al menos: identificación del Usuario, marca temporal, versión del documento, **hash SHA-256 del texto exacto mostrado**, y —cuando esté disponible— dirección IP y agente de usuario. Ante una nueva versión con cambios sustanciales, se exigirá nueva aceptación a todos los Usuarios.

---

## 4. DATOS DE SALUD Y PROTECCIÓN DE DATOS PERSONALES

### 4.1. Carácter de dato sensible

Los datos referidos a pacientes constituyen **datos sensibles** (art. 2, Ley 25.326) y su tratamiento está sujeto a las exigencias reforzadas de dicha norma, del Decreto 1558/2001 y al control de la Agencia de Acceso a la Información Pública (AAIP).

### 4.2. Responsable y encargado del tratamiento

El Usuario profesional reviste, respecto de los datos de sus pacientes, el carácter de **responsable del tratamiento** en su relación asistencial directa. El Desarrollador actúa como **encargado del tratamiento** (art. 25, Ley 25.326), en tanto provee la infraestructura técnica de almacenamiento y procesamiento, y se obliga a:

(a) no utilizar los datos para fines distintos a los pactados en estos Términos y en la prestación del servicio;  
(b) aplicar medidas de seguridad técnicas y organizativas adecuadas;  
(c) no ceder los datos a terceros salvo obligación legal, orden de autoridad competente, o instrucción/consentimiento del responsable (incluido el caso en que el propio Usuario inicia un envío a un sistema de terceros);  
(d) asistir al responsable en el ejercicio de los derechos de acceso, rectificación, actualización y supresión conforme la ley;  
(e) documentar, en la medida de lo razonable, las instrucciones del responsable inherentes al uso del servicio SaaS aquí descripto.

### 4.3. Medidas de seguridad implementadas (resumen no explotable)

Sin perjuicio de mejoras continuas, la arquitectura actual de la Aplicación incluye, entre otras:

- autenticación de usuarios y aislamiento de datos por cuenta mediante políticas de acceso en base de datos (un Usuario no accede a fojas de otro, salvo mecanismos expresamente diseñados y autorizados);
- control de sesiones concurrentes (límites por tipo de dispositivo);
- puente de integración con sistemas de terceros mediante **tokens de un solo uso y vigencia limitada**, en lugar de exponer identificadores estables como clave permanente;
- firma gráfica asociada a la cuenta con restricciones de modificación tras su certificación en la Aplicación;
- canal de valoración preanestésica por enlace temporal;
- respaldos y disponibilidad dependientes del proveedor de infraestructura (ver 4.6);
- registro inmutable de aceptaciones de estos Términos.

El detalle técnico profundo no se publica en este documento para no facilitar ataques. El Desarrollador mantendrá este apartado actualizado ante cambios materiales de arquitectura.

### 4.4. Base legal para el tratamiento

**[REQUIERE VALIDACIÓN PRIORITARIA DEL ABOGADO]**

El tratamiento de los datos de salud del Paciente por parte de la Aplicación se funda en la **relación asistencial preexistente** entre el Paciente y el Usuario profesional, en el marco de la cual el profesional se encuentra obligado por la Ley 26.529 a confeccionar y conservar registro fehaciente del acto médico, incluida la valoración preanestésica y la documentación anestésica pertinente.

En consecuencia, el tratamiento se ampara en la ejecución de dicha relación asistencial y en el cumplimiento de las obligaciones legales de registro que pesan sobre el Usuario profesional (Ley 26.529, en particular el régimen de Historia Clínica), y **no** en la excepción del art. 5 de la Ley 25.326 relativa al ejercicio de funciones propias de los poderes del Estado, que **no resulta aplicable** a la relación entre particulares aquí descripta.

Dado el carácter sensible de los datos de salud, deberá confirmarse con el abogado revisor que:

a) el consentimiento informado que el Usuario ya recaba del Paciente conforme la Ley 26.529 incluya mención a que sus datos de valoración preanestésica podrán procesarse mediante herramientas informáticas de apoyo administrativo, incluyendo el eventual uso de un enlace temporal (código QR); y  
b) si, además, corresponde un consentimiento específico adicional conforme la Ley 25.326 y el criterio de la AAIP para datos sensibles en el ámbito de la salud.

### 4.5. Confidencialidad reforzada — Secreto profesional y Código Penal

Se recuerda que el art. 156 del Código Penal sanciona la revelación indebida de un secreto conocido en razón del oficio o profesión. El Usuario es responsable de la confidencialidad de sus credenciales. El Desarrollador se obliga a mantener arquitectura de aislamiento por cuenta que impida el acceso de un Usuario a los datos de pacientes de otro, salvo consentimiento expreso, instrucción del responsable en los términos del servicio, o disposición legal en contrario.

### 4.6. Transferencias internacionales de datos

La Aplicación utiliza proveedores de infraestructura tecnológica cuyos servidores pueden encontrarse fuera de la República Argentina. Actualmente:

a) **Almacenamiento, autenticación y base de datos:** Supabase (infraestructura sobre proveedores cloud, típicamente AWS). Región del proyecto AnesFact: **[COMPLETAR — verificar en el panel del proyecto Supabase; ej. East US (North Virginia) / South America (São Paulo) / otra]**. El uso de este proveedor implica transferencia internacional de datos personales/sensibles hacia la jurisdicción del centro de datos seleccionado.  
b) **Procesamiento eventual mediante inteligencia artificial** (asistencia en extracción de valores de estudios complementarios u otras funciones similares, cuando estén activas): Google Gemini / Google AI (o el proveedor que se indique al activar la función), con tratamiento que puede ocurrir fuera de Argentina. El Usuario/administrador que configure claves o habilite dichas funciones es consciente de dicho envío.  
c) **Sistemas de terceros sanatoriales** (GECLISA/ADAARC/evweb u otros): el traslado lo inicia el Usuario; esos sistemas tienen sus propios responsables y políticas, ajenos al Desarrollador.

Estas transferencias se encuadran en los arts. 12 y 13 de la Ley 25.326 y la normativa AAIP sobre transferencia internacional. El Desarrollador se obliga a: (i) evaluar adecuación del país de destino o instrumentar salvaguardas contractuales equivalentes; (ii) mantener actualizado este listado; (iii) notificar a los Usuarios ante la incorporación de un nuevo proveedor que implique una transferencia internacional no contemplada, requiriendo nueva aceptación si el cambio es sustancial.

### 4.7. Registro de la base de datos ante la AAIP

El Desarrollador evaluará con el abogado revisor si corresponde la inscripción registral ante la AAIP de las bases que contengan datos personales/sensibles tratados por la Aplicación, y procederá en consecuencia antes de operar a escala.

### 4.8. Derechos de los titulares (ARCO) y canal de contacto

Los titulares de datos podrán ejercer, ante el **responsable** (Usuario profesional) y, en lo que corresponda a la infraestructura, con asistencia del Desarrollador como encargado, los derechos de acceso, rectificación, actualización y supresión, conforme la Ley 25.326.

Canal del Desarrollador para requerimientos relativos a la infraestructura y a estos Términos: **[COMPLETAR EMAIL]**. Los pedidos relativos a la historia clínica del Paciente deben dirigirse en primer lugar al profesional interviniente.

### 4.9. Almacenamiento local en el dispositivo del Usuario

La Aplicación puede conservar temporalmente información en el navegador o dispositivo del Usuario (por ejemplo, borradores o preferencias) para su funcionamiento. El Usuario es responsable de la seguridad física y lógica de sus dispositivos y de no utilizar equipos compartidos sin cerrar sesión.

---

## 5. REGISTRO, CUENTA Y CREDENCIALES

5.1. El acceso requiere una cuenta individual, vinculada a la identidad y matrícula profesional del Usuario.

5.2. La **firma gráfica certificada** dentro de la Aplicación, una vez confirmada por el Usuario, queda asociada de forma inmodificable a su matrícula en el sistema, siendo su uso responsabilidad exclusiva del titular de la cuenta. **No se confunde con la firma digital de la Ley 25.506** (ver Definiciones).

5.3. El Usuario se obliga a: (a) mantener la confidencialidad de sus credenciales; (b) **no compartir su cuenta** con terceros ni prestar el acceso a otro profesional; (c) notificar de inmediato al Desarrollador ante sospecha de uso no autorizado.

5.4. El Desarrollador podrá implementar controles técnicos razonables (por ejemplo, límite de sesiones concurrentes: un equipo de escritorio y un dispositivo móvil) sin que ello constituya garantía absoluta frente a usos indebidos originados en el incumplimiento del Usuario.

5.5. Un plan de uso corresponde, como regla, a **un profesional**. La identidad que figura en la foja debe coincidir con el titular de la cuenta.

---

## 6. PROPIEDAD INTELECTUAL

6.1. El código fuente, diseño, marca, logotipos y documentación de AnesFact son propiedad exclusiva de **[NOMBRE/RAZÓN SOCIAL A COMPLETAR]**, protegidos por la Ley 11.723 y normativa concordante.

6.2. Se otorga al Usuario una licencia de uso personal, no exclusiva, no transferible y revocable, limitada al uso profesional conforme estos Términos.

6.3. Queda prohibida la ingeniería inversa, copia, distribución o explotación comercial no autorizada de la Aplicación, salvo autorización escrita del Titular o permisos legales imperativos.

---

## 7. LIMITACIÓN DE RESPONSABILIDAD Y DISPONIBILIDAD DEL SERVICIO

7.1. El Desarrollador realizará sus mejores esfuerzos para mantener la disponibilidad y correcto funcionamiento de la Aplicación, **sin garantizar** disponibilidad ininterrumpida (uptime del 100%), en tanto la infraestructura depende de proveedores de terceros.

7.2. En ningún caso el Desarrollador responderá por daños indirectos, lucro cesante o pérdida de chance derivados del uso o imposibilidad de uso de la Aplicación, salvo dolo o culpa grave debidamente acreditada.

7.3. Nada de lo dispuesto limita o excluye la responsabilidad que, conforme el art. 1743 del CCCN, no pueda ser dispensada o limitada por cláusula contractual.

---

## 8. VIGENCIA, MODIFICACIONES Y RESCISIÓN

8.1. Estos Términos rigen desde su aceptación expresa y permanecen vigentes mientras el Usuario mantenga una cuenta activa.

8.2. El Desarrollador podrá modificar estos Términos, notificando con antelación razonable y exigiendo **nueva aceptación expresa** para cambios sustanciales, en especial deslinde médico y tratamiento de datos de salud.

8.3. El Usuario podrá solicitar la baja de su cuenta, pudiendo pedir exportación y/o supresión conforme la Ley 25.326, **sin perjuicio** de las obligaciones de conservación de historia clínica que pesan sobre el profesional (Ley 26.529; plazo mínimo de conservación de 10 años, o el que resulte vigente).

8.3.bis. **Proceso operativo de baja — conservación de historia clínica**

a) Antes de la baja definitiva, el Usuario deberá exportar la totalidad de sus fojas y registros clínicos mediante la funcionalidad de exportación, quedando dicha exportación bajo su custodia por el plazo legal.  
b) Confirmada la baja, el Desarrollador eliminará de sus servidores los datos clínicos asociados a esa cuenta en un plazo de **[COMPLETAR — ej. 30 días corridos]**, dentro del cual el Usuario podrá arrepentirse sin pérdida de información en servidor.  
c) Transcurrido el plazo, el Desarrollador no conservará copia de esos datos clínicos; la conservación legal remanente recae exclusivamente en el Usuario.  
d) La Aplicación procurará notificar la inminencia de la eliminación definitiva y ofrecer una última oportunidad de exportación.

Esta distribución debe ser validada por el abogado revisor.

---

## 9. LEY APLICABLE Y JURISDICCIÓN

9.1. Para usuarios domiciliados en la República Argentina, estos Términos se rigen por las leyes argentinas. Son competentes los tribunales ordinarios con asiento en la **Ciudad de Córdoba, Provincia de Córdoba**, con renuncia a cualquier otro fuero, **salvo** normas de orden público en materia de defensa del consumidor que fijen un fuero imperativo distinto.

9.2. **No se recomienda** habilitar registros de usuarios domiciliados fuera de la República Argentina hasta contar con asesoramiento específico (RGPD, HIPAA, LGPD u otros, según el caso).

---

## 10. ACEPTACIÓN

**A diferencia de plataformas que consideran aceptados sus términos por el mero uso del servicio, en AnesFact la aceptación requiere siempre un acto expreso, afirmativo e inequívoco del Usuario**, conforme el punto 3.6 (doble casillero + botón "Acepto"), registrado de manera inmutable.

Quien no preste esa aceptación no podrá acceder a funcionalidad alguna distinta de la pantalla de aceptación y la opción de cerrar sesión.

La publicación de una nueva versión con cambios sustanciales exigirá nueva aceptación a todos los Usuarios, incluidas versiones anteriores ya aceptadas.

---

*Documento base sujeto a revisión legal profesional. No constituye asesoramiento jurídico.*  
*Versión de trabajo v2.1 — correcciones de consistencia técnica y de encuadre (herramienta de documentación / no ejerce medicina).*
