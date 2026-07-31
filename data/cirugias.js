var CIRUGIAS=[
// CABEZA Y CUELLO - Tiroides/Paratiroides
'Tiroidectomía total','Tiroidectomía total con vaciamiento central','Tiroidectomía parcial / Lobectomía tiroidea unilateral','Istmectomía tiroidea','Paratiroidectomía unilateral','Paratiroidectomía bilateral','Paratiroidectomía por autotrasplante','Reintervención de celda tiroidea',
// CABEZA Y CUELLO - Glándulas salivales
'Parotidectomía superficial con preservación del VII par','Parotidectomía total con preservación del VII par','Parotidectomía radical con sacrificio del VII par','Parotidectomía radical con injerto nervioso','Submaxilectomía unilateral','Resección de glándula sublingual','Marsupialización de ránula',
// CABEZA Y CUELLO - Vaciamientos cervicales
'Vaciamiento cervical radical clásico','Vaciamiento radical modificado Tipo I','Vaciamiento radical modificado Tipo II','Vaciamiento radical modificado Tipo III','Vaciamiento selectivo supraomohioideo (Niveles I-III)','Vaciamiento selectivo anterolateral (Niveles II-IV)','Vaciamiento funcional central unilateral (Nivel VI)','Vaciamiento funcional central bilateral (Nivel VI)','Vaciamiento posterolateral (Niveles II-V)',
// CABEZA Y CUELLO - Cavidad oral
'Glosectomía parcial','Hemiglosectomía','Glosectomía total','Glosectomía subtotal','Resección de lesión de piso de boca con cierre primario','Resección de piso de boca con colgajo','Resección de trígono retromolar','Maxilectomía parcial / infraestructura','Maxilectomía total','Maxilectomía total con exenteración orbitaria','Mandibulectomía segmentaria','Mandibulectomía marginal','Mandibulectomía con desarticulación','Operación de Comando (Primario + Mandibulectomía + Vaciamiento)',
// CABEZA Y CUELLO - Laringe
'Laringectomía total','Laringectomía parcial horizontal','Laringectomía parcial vertical','Laringectomía supracricoidea con cricohioideopexia (CHP)','Laringectomía supracricoidea con cricohioidoepiglotopexia (CHEP)','Faringolaringectomía total','Exéresis de divertículo de Zenker por vía abierta','Diverticulotomía endoscópica de Zenker',
// CABEZA Y CUELLO - Fosas nasales/congénitos
'Resección de tumores de senos por abordaje de Weber-Ferguson','Resección por rinotomía lateral','Resección craneofacial anterior integrada','Operación de Sistrunk para quiste tirogloso','Exéresis de quiste branquial','Exéresis de linfangioma cervical',
// CABEZA Y CUELLO - Urgencias
'Traqueostomía reglada','Cricotiroidotomía de urgencia','Exploración cervical por trauma','Exploración cervical por hemorragia posoperatoria',
// CIRUGÍA GENERAL - Pared abdominal
'Hernioplastia inguinal unilateral técnica Lichtenstein','Hernioplastia inguinal bilateral técnica Lichtenstein','Hernioplastia inguinal laparoscópica TAPP','Hernioplastia inguinal laparoscópica TEP','Hernioplastia inguinal técnica Shouldice','Eventroplastia con separación de componentes anterior','Eventroplastia con separación de componentes posterior (TAR)','Hernia crural / femoral','Hernioplastia umbilical',
// CIRUGÍA GENERAL - Esófago-gástrico
'Funduplicatura Nissen laparoscópica','Gastrectomía total con reconstrucción en Y de Roux','Gastrectomía subtotal','Manga gástrica laparoscópica','Bypass gástrico en Y de Roux laparoscópico',
// CIRUGÍA GENERAL - Hepato-Pancreato-Biliar
'Colecistectomía laparoscópica','Colecistectomía abierta','Colangiografía intraoperatoria','Exploración de vía biliar principal','Derivación biliodigestiva','Hepatectomía derecha','Hepatectomía izquierda','Segmentectomía hepática','Duodenopancreatectomía cefálica (Whipple)',
// CIRUGÍA GENERAL - Coloproctología
'Colectomía derecha laparoscópica','Colectomía derecha abierta','Colectomía izquierda laparoscópica','Colectomía izquierda abierta','Colectomía total laparoscópica','Colectomía total abierta','Resección anterior baja de recto','Amputación abdominoperineal de Miles laparoscópica','Amputación abdominoperineal de Miles abierta','Esfinteroplastia anal','Fistulectomía anal simple','Fistulectomía anal compleja con setón',
// ORTOPEDIA - Hombro
'Osteosíntesis de húmero proximal con placa y tornillos','Osteosíntesis de clavícula con placa','Reparación artroscópica de manguito rotador','Reparación abierta de manguito rotador','Reemplazo total de hombro primario','Reemplazo parcial de hombro (hemiartroplastia)','Reemplazo total de hombro reverso','Artroscopía de hombro diagnóstica',
// ORTOPEDIA - Codo/Antebrazo/Muñeca
'Osteosíntesis de codo con placa y tornillos','Osteosíntesis de radio distal con placa volar','Osteosíntesis de cúbito con placa','Osteosíntesis de ambos huesos del antebrazo','Artroscopía de muñeca',
// ORTOPEDIA - Mano
'Síntesis de metacarpianos con agujas','Síntesis de falanges con agujas','Polidactilia','Sindactilia','Liberación del túnel carpiano','Tenodermodesis de Dupuytren',
// ORTOPEDIA - Cadera
'Reemplazo total de cadera primario','Reemplazo total de cadera de revisión','Reemplazo parcial de cadera (hemiartroplastia)','Osteosíntesis de cadera con tornillos canulados','Osteosíntesis de cadera con clavo cefalomedular','Osteosíntesis de fémur proximal con clavo endomedular bloqueado',
// ORTOPEDIA - Fémur/Rodilla
'Osteosíntesis de fémur diafisario con clavo endomedular bloqueado','Osteosíntesis de fémur distal con placa','Reemplazo total de rodilla primario','Reemplazo total de rodilla de revisión','Artroscopía de rodilla con menisectomía parcial','Artroscopía de rodilla con sutura meniscal','Reconstrucción de ligamento cruzado anterior (LCA)','Reconstrucción de ligamento cruzado posterior (LCP)','Osteosíntesis de rótula con cerclaje',
// ORTOPEDIA - Pierna/Tobillo/Pie
'Osteosíntesis de tibia con clavo endomedular bloqueado','Osteosíntesis de peroné con placa','Osteosíntesis de tobillo bimaleolar con placa y tornillos','Artrodesis de tobillo','Artroscopía de tobillo','Hallux valgus / Bunionectomía','Osteosíntesis de calcáneo con placa',
// ORTOPEDIA - Columna
'Discectomía microquirúrgica lumbar','Discectomía microquirúrgica cervical','Laminectomía lumbar descompresiva','Artrodesis posterior instrumentada lumbar (1-2 niveles)','Artrodesis posterior instrumentada lumbar (3 o más niveles)','Artrodesis posterior instrumentada cervical','Artrodesis anterior cervical con placa (ACDF)','Cifoplastia / Vertebroplastia','Cirugía compleja de columna con abordaje doble',
// GINECOLOGÍA - Obstetricia
'Asistencia de parto vaginal','Parto con fórceps','Cesárea programada','Cesárea de urgencia','Legrado uterino evacuador','Cerclaje cervical','Conducción del trabajo de parto','Trabajo de parto que termina en cesárea','Cesárea por placenta ácreta con histerectomía',
// GINECOLOGÍA - Benigna
'Histerectomía total abdominal','Histerectomía total vaginal','Histerectomía total laparoscópica','Histerectomía total laparoscópica asistida','Miomectomía única laparoscópica','Miomectomía múltiple laparoscópica','Miomectomía abierta','Quistectomía ovárica unilateral laparoscópica','Quistectomía ovárica bilateral laparoscópica','Salpingooforectomía unilateral','Salpingooforectomía bilateral','Cirugía de prolapso genital anterior con malla','Cirugía de prolapso genital posterior con malla','Cirugía de prolapso genital sin malla','Histeroscopía diagnóstica','Histeroscopía quirúrgica','Laparoscopía diagnóstica','Embarazo ectópico laparoscópico','Ligadura tubaria bilateral',
// GINECOLOGÍA - Oncología
'Mastectomía radical modificada','Mastectomía parcial / Cuadrantectomía','Biopsia de ganglio centinela','Vaciamiento axilar','Linfadenectomía pelviana','Linfadenectomía ilíaca','Cirugía citorreductora para cáncer de ovario','Operación de Wertheim-Meigs','Operación de Wertheim-Meigs laparoscópica','Conización cervical (LEEP / CKC)',
// UROLOGÍA - Endourología
'Resección transuretral de próstata (RTUP) monopolar','Resección transuretral de próstata (RTUP) bipolar','Resección transuretral de próstata con láser','Resección transuretral de vejiga (RTUV)','Ureterorrenoscopía rígida con litotricia láser','Ureterorrenoscopía flexible con litotricia láser','Nefrolitotricia percutánea (NLP)','Litotripsia extracorpórea por ondas de choque (LEOC)',
// UROLOGÍA - Cirugía mayor
'Prostatectomía radical abierta','Prostatectomía radical laparoscópica','Nefrectomía total laparoscópica','Nefrectomía total abierta','Nefrectomía parcial laparoscópica','Nefrectomía parcial abierta','Cistectomía radical con conducto ileal (Bricker)','Cistectomía radical con neovejiga ortotópica','Pieloplastia laparoscópica','Nefrostomía percutánea',
// UROLOGÍA - Genitales
'Orquidectomía radical unilateral','Orquidectomía simple unilateral','Orquidectomía bilateral','Orquidopexia unilateral','Orquidopexia bilateral','Varicocelectomía microscópica','Varicocelectomía laparoscópica','Hidrocelectomía','Vasectomía bilateral','Circuncisión','Resección transuretral de vejiga (TUR-V)','Plástica de uretra / Uretroplastia',
// ORL - Otología
'Timpanoplastia Tipo I','Timpanoplastia Tipo II','Timpanoplastia Tipo III','Timpanoplastia Tipo IV','Timpanoplastia Tipo V','Mastoidectomía simple','Mastoidectomía radical','Implante coclear unilateral','Implante coclear bilateral','Estapedectomía',
// ORL - Rinología
'Septoplastia','Rinoplastia funcional','Cirugía endoscópica sinusal (CESS) unilateral maxilo-etmoidal','Cirugía endoscópica sinusal (CESS) bilateral maxilo-etmoidal','Cirugía endoscópica sinusal frontal','Turbinoplastia / Turbinectomía',
// ORL - Faringolaringología
'Adenoidectomía','Amigdalectomía','Adenoamigdalectomía','Microlaringoscopía suspendida con resección de pólipos','Microlaringoscopía suspendida con resección de nódulos','Traqueostomía pediátrica','Traqueostomía en adulto','Septumplastia / Sinusotomía maxilar','Parotidectomía total / Glosectomía subtotal',
// OFTALMOLOGÍA - Segmento anterior
'Facoemulsificación con implante de lente intraocular monofocal','Facoemulsificación con implante de lente intraocular multifocal','Extracción extracapsular de catarata','Trabeculectomía','Iridectomía periférica','Trasplante de córnea penetrante (queratoplastia penetrante)','Trasplante de córnea lamelar (DSAEK/DMEK)',
// OFTALMOLOGÍA - Segmento posterior
'Vitrectomía posterior 23G','Vitrectomía posterior 25G','Vitrectomía posterior 27G','Cerclaje escleral','Retinopexia neumática','Endofotocoagulación láser',
// OFTALMOLOGÍA - Oculoplastia
'Cirugía de estrabismo 1 músculo','Cirugía de estrabismo 2 músculos','Cirugía de estrabismo 3 músculos','Cirugía de estrabismo 4 músculos','Blefaroplastia superior funcional','Blefaroplastia inferior funcional','Corrección de ptosis palpebral','Dacriocistorrinostomía externa','Dacriocistorrinostomía endoscópica','Orbitotomía con escisión de lesión',
// CIRUGÍA VASCULAR - Arterial abierto
'Bypass femoropoplíteo sobre rodilla con vena autóloga','Bypass femoropoplíteo bajo rodilla con vena autóloga','Bypass femoropoplíteo con prótesis','Bypass aortobifemoral','Endarterectomía carotídea sin parche','Endarterectomía carotídea con parche','Embolectomía arterial de urgencia','Resección de aneurisma de aorta abdominal con reemplazo protésico',
// CIRUGÍA VASCULAR - Endovascular
'Angioplastia transluminal percutánea (ATP) de miembros inferiores sin stent','Angioplastia transluminal percutánea (ATP) de miembros inferiores con stent','Colocación de endoprótesis aórtica (EVAR)','Colocación de endoprótesis aórtica torácica (TEVAR)',
// CIRUGÍA VASCULAR - Venoso
'Safenectomía interna convencional','Safenectomía externa convencional','Ablación de vena safena por láser','Ablación de vena safena por radiofrecuencia','Flebectomías por microincisiones','Fístula arteriovenosa para hemodiálisis',
// CIRUGÍA PLÁSTICA - Reparadora
'Reconstrucción mamaria inmediata con expansor tisular','Reconstrucción mamaria diferida con prótesis','Reconstrucción mamaria con colgajo DIEP','Reconstrucción mamaria con colgajo dorsal ancho','Cierre de defecto con colgajo local','Cierre de defecto con colgajo regional','Cierre de defecto con colgajo libre microvascular','Escarectomía tangencial en gran quemado','Injerto de piel parcial en gran quemado','Injerto de piel total','Reconstrucción de fisura labial unilateral','Reconstrucción de fisura labial bilateral','Reconstrucción de fisura palatina',
// CIRUGÍA PLÁSTICA - Estética
'Mamoplastia de aumento','Mastopexia con prótesis','Mastopexia sin prótesis','Mamoplastia de reducción','Dermolipectomía abdominal (abdominoplastia)','Liposucción / Lipoescultura','Rinoplastia estética abierta','Rinoplastia estética cerrada','Ritidectomía / Facelift','Blefaroplastia superior estética','Blefaroplastia inferior estética','Otoplastia',
// CIRUGÍA PEDIÁTRICA - Neonatal
'Corrección de atresia esofágica con fístula traqueoesofágica','Corrección de atresia esofágica sin fístula','Cierre de hernia diafragmática congénita','Corrección de onfalocele','Corrección de gastrosquisis','Resección de malformación adenomatoidea quística pulmonar',
// CIRUGÍA PEDIÁTRICA - Infantil
'Orquidopexia unilateral por criptorquidia','Orquidopexia bilateral por criptorquidia','Hernioplastia inguinal infantil','Hernioplastia umbilical infantil','Piloromiotomía de Fredet-Ramstedt','Exéresis de quiste de conducto tirogloso infantil','Cirugía de Hirschsprung - Descenso endorrectal',
// PROCEDIMIENTOS GENERALES ADICIONALES
'Biopsia de ganglio linfático','Biopsia de tejidos blandos','Extracción de cuerpo extraño','Desbridamiento de herida','Drenaje de hematoma','Drenaje de absceso','Curación quirúrgica de úlcera','Amputación de miembro inferior supracondílea','Amputación de miembro inferior infracondílea','Amputación de miembro superior','Amputación digital','Simpatectomía torácica videotoracoscópica',
// HEMODINAMIA / INTERVENCIONISMO
'Arteriografía / Flebografía diagnóstica','Angioplastia coronaria percutánea (PTCA) con stent','Implante de marcapasos definitivo unicameral','Implante de marcapasos definitivo bicameral','Implante de cardiodesfibrilador (CDI)','Ablación de arritmias por radiofrecuencia','Cateterismo cardíaco diagnóstico','Valvuloplastia percutánea','Cierre de comunicación interauricular (CIA) percutáneo','Angioplastia de un vaso periférico','Colocación de endoprótesis de aorta','Embolización de tumor cerebral','Tratamiento de aneurisma cerebral con coils','Shunt porto-sistémico transyugular (TIPS)',
// ENDOSCOPÍA DIGESTIVA
'Video-esofago-gastro-duodenoscopía (VEDA)','Colonovideoscopía diagnóstica','Colonovideoscopía con polipectomía','Papilotomía endoscópica / ERCP','Cápsula endoscópica','Gastrostomía endoscópica percutánea (PEG)','Ligadura endoscópica de várices esofágicas','Ecoendoscopía diagnóstica',
// TRASPLANTES
'Trasplante hepático','Trasplante renal','Trasplante cardíaco','Trasplante pulmonar','Trasplante de páncreas','Trasplante reno-pancreático','Trasplante de médula ósea',
// CIRUGÍA MAXILOFACIAL
'Osteosíntesis de mandíbula con placa','Osteosíntesis de malar con placa','Reducción de fractura de órbita','Cirugía ortognática de maxilar superior (Le Fort I)','Cirugía ortognática de mandíbula (osteotomía sagital)','Cirugía de articulación temporomandibular (ATM)','Exéresis de tumor de partes blandas de cara','Reconstrucción de defecto mandibular con colgajo microvascular',
// NEUROCIRUGÍA ADICIONAL
'Craneotomía para evacuación de hematoma extradural','Craneotomía para evacuación de hematoma subdural crónico','Craneotomía para resección de tumor cerebral','Craneotomía para cirugía de aneurisma cerebral','Resección de tumor de fosa posterior','Derivación ventrículo-peritoneal (DVP)','Derivación ventrículo-atrial','Cirugía de Parkinson (estimulación cerebral profunda)','Microdiscectomía lumbar','Microdiscectomía cervical','Laminoplastia cervical','Fijación occipito-cervical','By-pass temporo-silviano','Mielomeningocele - cierre neonatal'
];

