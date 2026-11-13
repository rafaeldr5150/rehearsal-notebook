/* Idiomas do Caderno de Ensaio: português (original), inglês e espanhol.
   Traduz os textos da tela quando ela é montada. Trocar de idioma recarrega a página. */
(function(){
'use strict';
var LANGS={pt:'pt-BR',en:'en-US',es:'es-ES'};
var lang='pt';
try{
  lang=localStorage.getItem('ce-lang')||'';
  if(!LANGS[lang]){
    var nl=String(navigator.language||'pt').toLowerCase();
    lang=nl.indexOf('es')===0?'es':nl.indexOf('pt')===0?'pt':nl.indexOf('en')===0?'en':'pt';
  }
}catch(e){lang='pt'}
window.CE_LANG=lang;window.CE_LOCALE=LANGS[lang];
window.CE_SET_LANG=function(l){if(!LANGS[l])return;try{localStorage.setItem('ce-lang',l)}catch(e){}location.reload()};
document.documentElement.lang=LANGS[lang];
if(lang==='pt')return;
var I=lang==='en'?1:2;

/* [português, inglês, espanhol] */
var D=[
['Deixar tudo pronto','Get everything ready','Dejar todo listo'],
['Libere agora o que o app vai usar, para não ser interrompido depois.','Allow now what the app will use, so you are not interrupted later.','Permite ahora lo que usará la app, para que no te interrumpa después.'],
['Microfone','Microphone','Micrófono'],['Para gravar as músicas direto no app.','To record songs right in the app.','Para grabar las canciones directo en la app.'],
['Bloqueado. Libere o microfone nas configurações do navegador.','Blocked. Allow the microphone in your browser settings.','Bloqueado. Permite el micrófono en los ajustes del navegador.'],
['Este navegador não grava áudio.','This browser cannot record audio.','Este navegador no graba audio.'],
['No iPhone, instale o app na tela inicial primeiro (Compartilhar → Adicionar à Tela de Início).','On iPhone, install the app on the home screen first (Share → Add to Home Screen).','En iPhone, instala primero la app en la pantalla de inicio (Compartir → Añadir a pantalla de inicio).'],
['Bloqueado. Libere as notificações nas configurações do navegador.','Blocked. Allow notifications in your browser settings.','Bloqueado. Permite las notificaciones en los ajustes del navegador.'],
['Aviso na véspera e no dia do ensaio.','A notice the evening before and the day of the rehearsal.','Un aviso la víspera y el día del ensayo.'],
['Guarda as gravações da banda no Google Drive.','Stores the band\'s recordings in Google Drive.','Guarda las grabaciones de la banda en Google Drive.'],
['✓ Liberado','✓ Allowed','✓ Permitido'],['Permitir','Allow','Permitir'],['Ativar','Turn on','Activar'],['Conectar','Connect','Conectar'],
['Permitir tudo','Allow all','Permitir todo'],['Agora não','Not now','Ahora no'],['Concluir','Done','Terminar'],
['Agora conecte o Google Drive.','Now connect Google Drive.','Ahora conecta Google Drive.'],
['Permissões e acessos','Permissions and access','Permisos y accesos'],['Microfone, lembretes e Google Drive','Microphone, reminders and Google Drive','Micrófono, recordatorios y Google Drive'],
['Ensaio com lembrete','Rehearsal with reminder','Ensayo con recordatorio'],
['Na tela Geral, marque a data e a hora do próximo ensaio. Em Configurações, ative os lembretes: o celular avisa na véspera e no dia.','On the Overview screen, set the date and time of the next rehearsal. In Settings, turn on reminders: your phone alerts you the evening before and the day of.','En la pantalla General, marca la fecha y la hora del próximo ensayo. En Ajustes, activa los recordatorios: el móvil te avisa la víspera y el día.'],
['Grave e ouça','Record and listen','Graba y escucha'],
['Conecte o Google Drive em Configurações. Em cada música, toque em Gravar: o arquivo vai para a pasta setlist do Drive da banda. Dá para ouvir ali mesmo e apagar se não gostar.','Connect Google Drive in Settings. In each song, tap Record: the file goes to the setlist folder in the band\'s Drive. You can listen right there and delete it if you don\'t like it.','Conecta Google Drive en Ajustes. En cada canción, toca Grabar: el archivo va a la carpeta setlist del Drive de la banda. Puedes escucharlo ahí mismo y borrarlo si no te gusta.'],
['Entendi','Got it','Entendido'],
['Carregando gravações…','Loading recordings…','Cargando grabaciones…'],['Não foi possível carregar a lista agora.','Could not load the list right now.','No se pudo cargar la lista ahora.'],
['▶ Ouvir','▶ Play','▶ Escuchar'],['⏸ Pausar','⏸ Pause','⏸ Pausar'],['Apagar','Delete','Borrar'],['Confirmar: apagar','Confirm: delete','Confirmar: borrar'],['Carregando…','Loading…','Cargando…'],
['Não foi possível tocar. Tente abrir pelo Drive.','Could not play. Try opening it in Drive.','No se pudo reproducir. Prueba abrirlo en Drive.'],
['Gravação apagada. Ela foi para a lixeira do Drive.','Recording deleted. It went to the Drive trash.','Grabación borrada. Fue a la papelera del Drive.'],
['Não foi possível apagar agora.','Could not delete right now.','No se pudo borrar ahora.'],
['Onde as gravações ficam','Where recordings go','Dónde se guardan las grabaciones'],['setlist / música (na raiz do Drive)','setlist / song (in the Drive root)','setlist / canción (en la raíz del Drive)'],
['Escolher pasta do Drive','Choose a Drive folder','Elegir carpeta del Drive'],['Abrindo o Google…','Opening Google…','Abriendo Google…'],
['A pasta da banda vai ficar dentro dela, com a pasta setlist e uma pasta por música','The band folder will be created inside it, with a setlist folder and one folder per song','La carpeta de la banda se creará dentro, con la carpeta setlist y una carpeta por canción'],
['Você não tem permissão para criar pastas nessa pasta.','You don\'t have permission to create folders in that folder.','No tienes permiso para crear carpetas en esa carpeta.'],
['Não foi possível usar essa pasta. Tente outra.','Could not use that folder. Try another.','No se pudo usar esa carpeta. Prueba otra.'],
['Não foi possível abrir a escolha de pasta do Google.','Could not open Google\'s folder picker.','No se pudo abrir el selector de carpetas de Google.'],
['Gravar','Record','Grabar'],['● Gravar','● Record','● Grabar'],['Gravando','Recording','Grabando'],['Parar e salvar','Stop and save','Parar y guardar'],['Descartar','Discard','Descartar'],
['Você está gravando outra música.','You are recording another song.','Estás grabando otra canción.'],
['Conecte o Google Drive da banda para guardar as gravações.','Connect the band\'s Google Drive to store recordings.','Conecta el Google Drive de la banda para guardar las grabaciones.'],
['Conectar o Drive','Connect Drive','Conectar el Drive'],['Enviando…','Sending…','Enviando…'],['Enviar agora','Send now','Enviar ahora'],
['Este navegador não consegue gravar áudio.','This browser cannot record audio.','Este navegador no puede grabar audio.'],
['Não foi possível usar o microfone. Libere a permissão do navegador.','Could not use the microphone. Allow it in your browser.','No se pudo usar el micrófono. Permítelo en el navegador.'],
['Gravação muito curta, descartada.','Recording too short, discarded.','Grabación demasiado corta, descartada.'],
['O Drive não está conectado. A gravação ficou guardada no aparelho.','Drive is not connected. The recording was kept on this device.','El Drive no está conectado. La grabación quedó guardada en el dispositivo.'],
['Sem conexão: a gravação será enviada depois.','Offline: the recording will be sent later.','Sin conexión: la grabación se enviará después.'],
['Não foi possível guardar a gravação.','Could not store the recording.','No se pudo guardar la grabación.'],
['Tudo enviado.','All sent.','Todo enviado.'],
['Google Drive','Google Drive','Google Drive'],['Drive conectado','Drive connected','Drive conectado'],['Sem conexão agora.','Offline right now.','Sin conexión ahora.'],['Indisponível no momento.','Unavailable right now.','No disponible por ahora.'],
['Conectar Google Drive','Connect Google Drive','Conectar Google Drive'],['Grave as músicas e salve direto no Drive da banda','Record songs and save straight to the band\'s Drive','Graba las canciones y guárdalas directo en el Drive de la banda'],
['Abrir a pasta setlist','Open the setlist folder','Abrir la carpeta setlist'],['Só abre para a conta que conectou. Compartilhe a pasta com a banda no Drive.','Only opens for the account that connected it. Share the folder with the band in Drive.','Solo abre con la cuenta que lo conectó. Comparte la carpeta con la banda en Drive.'],
['Trocar a conta do Drive','Switch the Drive account','Cambiar la cuenta del Drive'],['Confirmar: trocar a conta','Confirm: switch account','Confirmar: cambiar la cuenta'],['As próximas gravações vão para a nova conta','Future recordings go to the new account','Las próximas grabaciones irán a la nueva cuenta'],
['Desconectar o Drive','Disconnect Drive','Desconectar el Drive'],['Confirmar: desconectar','Confirm: disconnect','Confirmar: desconectar'],['As gravações já enviadas continuam no Drive','Recordings already sent stay in Drive','Las grabaciones ya enviadas siguen en el Drive'],
['Toque para enviar agora','Tap to send now','Toca para enviar ahora'],
['Toque de novo para confirmar a troca do Drive da banda.','Tap again to confirm switching the band\'s Drive.','Toca de nuevo para confirmar el cambio del Drive de la banda.'],
['Toque de novo para desconectar o Drive da banda.','Tap again to disconnect the band\'s Drive.','Toca de nuevo para desconectar el Drive de la banda.'],
['Drive desconectado.','Drive disconnected.','Drive desconectado.'],['Google Drive conectado!','Google Drive connected!','¡Google Drive conectado!'],['Conexão cancelada.','Connection cancelled.','Conexión cancelada.'],
['Não foi possível conectar o Drive. Tente de novo.','Could not connect Drive. Try again.','No se pudo conectar el Drive. Inténtalo de nuevo.'],['O Drive ainda não está configurado no servidor.','Drive is not set up on the server yet.','El Drive aún no está configurado en el servidor.'],
['Hora','Time','Hora'],['Salvar','Save','Guardar'],['Informe a data e a hora do ensaio.','Enter the rehearsal date and time.','Indica la fecha y la hora del ensayo.'],
['Lembretes','Reminders','Recordatorios'],['Lembretes do ensaio','Rehearsal reminders','Recordatorios del ensayo'],
['No iPhone, instale o app: Compartilhar → Adicionar à Tela de Início. Depois ative aqui.','On iPhone, install the app first: Share → Add to Home Screen. Then turn this on here.','En iPhone, instala la app primero: Compartir → Añadir a pantalla de inicio. Luego actívalo aquí.'],
['Este navegador não suporta avisos.','This browser does not support notifications.','Este navegador no admite avisos.'],
['Bloqueados. Libere as notificações deste site nas configurações do navegador.','Blocked. Allow notifications for this site in your browser settings.','Bloqueados. Permite las notificaciones de este sitio en los ajustes del navegador.'],
['Lembretes ativados','Reminders on','Recordatorios activados'],
['Aviso na véspera (18h) e no dia do ensaio (8h). Toque para desativar.','A notice the evening before (6 pm) and the morning of (8 am). Tap to turn off.','Un aviso la víspera (18 h) y el día del ensayo (8 h). Toca para desactivar.'],
['Enviar aviso de teste','Send a test notice','Enviar aviso de prueba'],['Confira se a notificação chega neste aparelho','Check that the notification reaches this device','Comprueba que la notificación llega a este dispositivo'],
['Ativar lembretes do ensaio','Turn on rehearsal reminders','Activar recordatorios del ensayo'],
['Aviso na véspera (18h) e no dia do ensaio (8h)','A notice the evening before (6 pm) and the morning of (8 am)','Un aviso la víspera (18 h) y el día del ensayo (8 h)'],
['Pedindo permissão…','Asking for permission…','Pidiendo permiso…'],['Lembretes ativados.','Reminders turned on.','Recordatorios activados.'],['Lembretes desativados.','Reminders turned off.','Recordatorios desactivados.'],
['Permissão negada. Libere as notificações nas configurações do navegador.','Permission denied. Allow notifications in your browser settings.','Permiso denegado. Permite las notificaciones en los ajustes del navegador.'],
['Não foi possível ativar agora. Tente de novo.','Could not turn on right now. Try again.','No se pudo activar ahora. Inténtalo de nuevo.'],
['Não foi possível desativar agora.','Could not turn off right now.','No se pudo desactivar ahora.'],
['Aviso enviado. Ele deve chegar em instantes.','Notice sent. It should arrive in a moment.','Aviso enviado. Debería llegar en unos instantes.'],
['Não foi possível enviar o aviso de teste.','Could not send the test notice.','No se pudo enviar el aviso de prueba.'],
['Mudar o status','Change status','Cambiar el estado'],['Como está essa música para você?','How is this song going for you?','¿Cómo va esta canción para ti?'],
['Não toco essa','I don\'t play this','No toco esta'],
['Atividade recente','Recent activity','Actividad reciente'],
['Próximo ensaio','Next rehearsal','Próximo ensayo'],['Marcar o próximo ensaio','Set the next rehearsal','Marcar el próximo ensayo'],
['Data','Date','Fecha'],['Hora (opcional)','Time (optional)','Hora (opcional)'],['Local (opcional)','Place (optional)','Lugar (opcional)'],
['Ex.: Estúdio do Zé','E.g. Joe\'s studio','Ej.: Estudio de José'],['Pronto','Done','Listo'],['Remover','Remove','Quitar'],['Editar','Edit','Editar'],
['O ensaio passou','The rehearsal has passed','El ensayo ya pasó'],['É hoje!','It\'s today!','¡Es hoy!'],
['Marque com ★ as músicas do ensaio para ver o que falta para cada um.','Mark the rehearsal songs with ★ to see what each person still needs to learn.','Marca con ★ las canciones del ensayo para ver qué le falta a cada uno.'],
['Ajuda','Help','Ayuda'],['Ver o tour de novo','See the tour again','Ver el tour otra vez'],['Como o app funciona, em poucos passos','How the app works, in a few steps','Cómo funciona la app, en pocos pasos'],
['Voltar','Back','Atrás'],['Próximo','Next','Siguiente'],['Começar','Start','Empezar'],['Pular tour','Skip tour','Saltar tour'],
['Bem-vindo ao Caderno de Ensaio','Welcome to Rehearsal Notebook','Bienvenido al Cuaderno de Ensayo'],
['Aqui a banda acompanha as músicas que cada um precisa tirar para o ensaio e para o show.','Here the band tracks the songs each person needs to learn for rehearsal and for the show.','Aquí la banda sigue las canciones que cada uno debe sacar para el ensayo y para el show.'],
['Escolha quem você é','Choose who you are','Elige quién eres'],
['Cada integrante tem a sua página, só com as músicas dele. O aparelho lembra de você.','Each member has their own page with only their songs. This device remembers you.','Cada integrante tiene su página, solo con sus canciones. Este dispositivo te recuerda.'],
['Acompanhe o status','Follow the status','Sigue el estado'],
['Cada música está Não iniciada, Em andamento ou Pronta. Toque na etiqueta para mudar. A estrela ★ marca as músicas do próximo ensaio.','Each song is Not started, In progress or Done. Tap the label to change it. The star ★ marks the songs for the next rehearsal.','Cada canción está Sin empezar, En curso o Lista. Toca la etiqueta para cambiarla. La estrella ★ marca las canciones del próximo ensayo.'],
['Estude dentro da música','Study inside each song','Estudia dentro de la canción'],
['Toque numa música para ver a letra, a cifra, o metrônomo e o link do Spotify. Dá para transpor a cifra para o seu tom.','Tap a song to see the lyrics, chords, metronome and the Spotify link. You can transpose the chords to your key.','Toca una canción para ver la letra, los acordes, el metrónomo y el enlace de Spotify. Puedes transponer los acordes a tu tono.'],
['Setlist e modo show','Setlist and show mode','Setlist y modo show'],
['Monte o setlist e use o modo show no palco, com rolagem automática e metrônomo sincronizado entre os celulares.','Build the setlist and use show mode on stage, with auto-scroll and a metronome synced across phones.','Arma el setlist y usa el modo show en el escenario, con desplazamiento automático y metrónomo sincronizado entre los móviles.'],
['Convide a banda','Invite the band','Invita a la banda'],
['Em Configurações você copia o link ou o código de convite, troca o layout e o idioma, e vê este tour de novo. O app funciona sem internet e pode ser instalado na tela inicial.','In Settings you can copy the invite link or code, change the layout and language, and see this tour again. The app works offline and can be installed on the home screen.','En Ajustes puedes copiar el enlace o el código de invitación, cambiar el diseño y el idioma, y ver este tour otra vez. La app funciona sin internet y se puede instalar en la pantalla de inicio.'],
['Configurações','Settings','Ajustes'],['Ajustes','Preferences','Preferencias'],['Aparência','Appearance','Apariencia'],
['Quem sou eu','Who am I','Quién soy'],['Escolha o seu nome','Choose your name','Elige tu nombre'],['Fundo da página','Page background','Fondo de la página'],
['Nome, logo, integrantes e convite','Name, logo, members and invite','Nombre, logo, integrantes e invitación'],
['Para quem prefere colar o código na tela de entrada.','For those who prefer pasting the code on the entry screen.','Para quien prefiere pegar el código en la pantalla de entrada.'],
['Repertório','Repertoire','Repertorio'],['Abrir a playlist da banda','Open the band\'s playlist','Abrir la lista de la banda'],['Conta','Account','Cuenta'],
['parede suave','soft wall','pared suave'],['parede só no topo','wall on top only','pared solo arriba'],
['Progresso das músicas tiradas para o repertório da banda.','Progress on the songs the band is learning.','Progreso de las canciones que la banda está sacando.'],
['Playlist no Spotify ↗','Spotify playlist ↗','Lista en Spotify ↗'],
['Layout','Layout','Diseño'],['Layout e idioma','Layout & language','Diseño e idioma'],
['Escolher o layout do aplicativo','Choose the app layout and language','Elegir el diseño y el idioma de la app'],
['Fundo','Background','Fondo'],['Mudar o fundo da página','Change the page background','Cambiar el fondo de la página'],
['Banda','Band','Banda'],['Importar lista','Import list','Importar lista'],
['+ Música','+ Song','+ Canción'],['+ Pessoa','+ Person','+ Persona'],
['Quem toca na banda?','Who plays in the band?','¿Quién toca en la banda?'],
['Cadastre as pessoas e o instrumento de cada uma. Depois disso, cada música ganha uma linha por pessoa para dividir quem faz o quê e acompanhar quem já tirou a sua parte.','Add each person and their instrument. After that, every song gets one line per person to split who does what and track who has learned their part.','Añade a cada persona y su instrumento. Después, cada canción tendrá una línea por persona para repartir quién hace qué y ver quién ya sacó su parte.'],
['Salvar banda','Save band','Guardar banda'],['Cancelar','Cancel','Cancelar'],
['Nome da banda','Band name','Nombre de la banda'],['Frase ou estilo (opcional)','Tagline or style (optional)','Frase o estilo (opcional)'],
['Logo da banda','Band logo','Logo de la banda'],['Enviar imagem','Upload image','Subir imagen'],['Remover','Remove','Quitar'],
['Ex.: Os Ensaiados','E.g.: The Rehearsers','Ej.: Los Ensayados'],['Ex.: Rock clássico e anos 90','E.g.: Classic rock and 90s','Ej.: Rock clásico y años 90'],
['Ex.: Bar do Zé','E.g.: Joe\'s Bar','Ej.: Bar de José'],
['Copiar link de convite','Copy invite link','Copiar enlace de invitación'],['Quem abrir esse link entra no caderno da banda.','Anyone who opens this link joins the band\'s notebook.','Quien abra este enlace entra al cuaderno de la banda.'],
['Gerenciar banda','Manage band','Gestionar banda'],['Quem sou eu?','Who am I?','¿Quién soy?'],
['Instrumento','Instrument','Instrumento'],['Nome','Name','Nombre'],['Título','Title','Título'],['Artista','Artist','Artista'],
['Preencha o nome e o instrumento de cada pessoa.','Fill in the name and instrument of each person.','Completa el nombre y el instrumento de cada persona.'],
['Cadastre pelo menos uma pessoa.','Add at least one person.','Añade al menos una persona.'],
['Remover pessoa','Remove person','Quitar persona'],
/* geral */
['A banda','The band','La banda'],['toque no seu nome','tap your name','toca tu nombre'],
['Você é','You are','Eres'],['Trocar','Switch','Cambiar'],['Ainda não escolheu quem você é.','You haven\'t chosen who you are yet.','Aún no elegiste quién eres.'],
['Buscar por título ou artista','Search by title or artist','Buscar por título o artista'],['Buscar música','Search song','Buscar canción'],
['Ver como: banda toda','View as: whole band','Ver como: toda la banda'],
['Todas','All','Todas'],['★ Próximo ensaio','★ Next rehearsal','★ Próximo ensayo'],['Próximo ensaio','Next rehearsal','Próximo ensayo'],
['Filtrar por situação','Filter by status','Filtrar por estado'],
['Não iniciadas','Not started','Sin empezar'],['Em andamento','In progress','En curso'],['Prontas','Done','Listas'],
['Não iniciada','Not started','Sin empezar'],['Pronta','Done','Lista'],
['A tirar','To learn','Por sacar'],['Tirando','Learning','Sacando'],['Pronto','Done','Listo'],['Não toca','Not playing','No toca'],
['Nenhuma música.','No songs.','Ninguna canción.'],['Nada por aqui','Nothing here','Nada por aquí'],
['Nenhuma música combina com a busca ou o filtro.','No songs match the search or filter.','Ninguna canción coincide con la búsqueda o el filtro.'],
['Carregando o repertório…','Loading the repertoire…','Cargando el repertorio…'],
['O caderno está vazio','The notebook is empty','El cuaderno está vacío'],
['Use “Importar lista” para colar as músicas da playlist, ou “+ Música” para adicionar uma por vez.','Use “Import list” to paste the songs from the playlist, or “+ Song” to add one at a time.','Usa “Importar lista” para pegar las canciones de la lista, o “+ Canción” para añadir una por una.'],
['sem parte definida','no part assigned','sin parte asignada'],['sem função definida','no role defined','sin rol definido'],
['Sem título','Untitled','Sin título'],
['Nova música','New song','Nueva canción'],['Duração (m:ss)','Duration (m:ss)','Duración (m:ss)'],['Adicionar','Add','Añadir'],
['Informe o título da música.','Enter the song title.','Escribe el título de la canción.'],
['Importar lista de músicas','Import song list','Importar lista de canciones'],['Importar','Import','Importar'],
['Título - Artista','Title - Artist','Título - Artista'],
['. Músicas que já estão no caderno são ignoradas.','. Songs already in the notebook are skipped.','. Las canciones que ya están en el cuaderno se ignoran.'],
['Cole uma música por linha no formato','Paste one song per line in the format','Pega una canción por línea con el formato'],
['Buscar letras que faltam','Find missing lyrics','Buscar las letras que faltan'],
/* cartaz */
['Nome da banda','Band name','Nombre de la banda'],['Dar nome à banda','Name the band','Ponerle nombre a la banda'],
['Definir data e local do show','Set the show date and venue','Definir fecha y lugar del show'],['Definir a data do show','Set the show date','Definir la fecha del show'],
['É hoje!','It\'s today!','¡Es hoy!'],['é o show','it\'s showtime','es el show'],['o show passou','the show is over','el show ya pasó'],
['dia para o show','day to the show','día para el show'],['dias para o show','days to the show','días para el show'],
['Importe as músicas ou monte o setlist.','Import the songs or build the setlist.','Importa las canciones o arma el setlist.'],
['Sem duração','No duration','Sin duración'],['sem duração','no duration','sin duración'],['sem função definida','no role defined','sin rol definido'],
/* menu */
['Caderno de Ensaio','Rehearsal Notebook','Cuaderno de Ensayo'],['Caderno de ensaio','Rehearsal notebook','Cuaderno de ensayo'],
['Geral','Overview','General'],['Setlist','Setlist','Setlist'],['Páginas','Pages','Páginas'],['Navegação','Navigation','Navegación'],
['Voz','Vocals','Voz'],['Guitarra','Guitar','Guitarra'],['Baixo','Bass','Bajo'],['Bateria','Drums','Batería'],['Teclado','Keys','Teclado'],['Violão','Acoustic guitar','Guitarra acústica'],['Percussão','Percussion','Percusión'],['Backing vocal','Backing vocals','Coros'],
/* página pessoal */
['Página pessoal','Personal page','Página personal'],['Esta é a sua página','This is your page','Esta es tu página'],
['Não sou eu / Trocar','Not me / Switch','No soy yo / Cambiar'],['Sou eu','It\'s me','Soy yo'],['Trocar de músico','Switch musician','Cambiar de músico'],
['Pronto, esta é a sua página.','Done, this is your page.','Listo, esta es tu página.'],
['Nenhuma música para você ainda','No songs for you yet','Aún no hay canciones para ti'],
['‹ Voltar','‹ Back','‹ Atrás'],['Avançar ›','Next ›','Avanzar ›'],
['Quem é você?','Who are you?','¿Quién eres?'],['Agora não','Not now','Ahora no'],['Fechar','Close','Cerrar'],
['Escolha o seu nome para ir direto para a sua página. Este aparelho vai lembrar.','Pick your name to go straight to your page. This device will remember.','Elige tu nombre para ir directo a tu página. Este dispositivo lo recordará.'],
['Página de quem?','Whose page?','¿Página de quién?'],['Escolha um músico para ver a página dele.','Pick a musician to see their page.','Elige un músico para ver su página.'],
['Mudar quem sou eu','Change who I am','Cambiar quién soy'],['Você','You','Tú'],['(você)','(you)','(tú)'],['Alguém','Someone','Alguien'],
['Escolha quem é você para avaliar.','Pick who you are to rate.','Elige quién eres para valorar.'],
['Escolha quem é você para comandar o ensaio.','Pick who you are to lead the rehearsal.','Elige quién eres para dirigir el ensayo.'],
['Defina a função de','Set the role of','Define el rol de'],['em cada música na página Geral.','on each song on the Overview page.','en cada canción en la página General.'],
/* detalhe */
['Quem faz o quê','Who does what','Quién hace qué'],['toque no status para avançar','tap the status to move on','toca el estado para avanzar'],
['O que faz aqui (ex.: base, solo, 2ª voz)','What they play here (e.g.: rhythm, solo, 2nd voice)','Qué hace aquí (ej.: base, solo, 2.ª voz)'],
['O que faço aqui (ex.: base, solo, 2ª voz)','What I play here (e.g.: rhythm, solo, 2nd voice)','Qué hago aquí (ej.: base, solo, 2.ª voz)'],
['Minha parte','My part','Mi parte'],['Minha função','My role','Mi rol'],['Minhas anotações','My notes','Mis notas'],
['Minhas anotações (pegada, afinação, trechos difíceis…)','My notes (feel, tuning, hard passages…)','Mis notas (ritmo, afinación, partes difíciles…)'],
['Link da minha faixa de estudo (Moises, Drive…)','Link to my study track (Moises, Drive…)','Enlace a mi pista de estudio (Moises, Drive…)'],
['Link da faixa de estudo','Study track link','Enlace de la pista de estudio'],
['Timbre, preset ou equipamento (ex.: preset 3, drive no 6)','Tone, preset or gear (e.g.: preset 3, drive at 6)','Timbre, preset o equipo (ej.: preset 3, drive en 6)'],
['Abrir minha faixa ↗','Open my track ↗','Abrir mi pista ↗'],['Faixas da música ↗','Song tracks ↗','Pistas de la canción ↗'],
['Abrir referência ↗','Open reference ↗','Abrir referencia ↗'],['Ouvir no Spotify ↗','Listen on Spotify ↗','Escuchar en Spotify ↗'],['▶ Ouvir no Spotify','▶ Listen on Spotify','▶ Escuchar en Spotify'],
['Buscar no Spotify ↗','Search on Spotify ↗','Buscar en Spotify ↗'],['Buscar cifra ↗','Find chords ↗','Buscar acordes ↗'],
['BPM','BPM','BPM'],['BPM da música','Song BPM','BPM de la canción'],['Tom','Key','Tono'],['Afinação','Tuning','Afinación'],['Capotraste','Capo','Cejilla'],
['Link de referência (cifra, vídeo)','Reference link (chords, video)','Enlace de referencia (acordes, vídeo)'],
['Pasta ou link das faixas separadas','Folder or link to separated tracks','Carpeta o enlace de las pistas separadas'],
['Espera antes de rolar (segundos)','Wait before scrolling (seconds)','Espera antes de desplazar (segundos)'],
['Meio tom abaixo','Half step down','Medio tono abajo'],['2ª casa','2nd fret','Traste 2'],
['Observações','Notes','Observaciones'],['Afinação, andamento, pegadas, pontos de atenção…','Tuning, tempo, feel, things to watch…','Afinación, tempo, ritmo, puntos de atención…'],
['Excluir música','Delete song','Eliminar canción'],['Confirmar exclusão','Confirm deletion','Confirmar eliminación'],
['Comentários','Comments','Comentarios'],['Nenhum comentário ainda.','No comments yet.','Aún no hay comentarios.'],
['Deixe um recado para a banda sobre esta música…','Leave a note for the band about this song…','Deja un mensaje a la banda sobre esta canción…'],
['Enviar comentário','Send comment','Enviar comentario'],['Novo comentário','New comment','Nuevo comentario'],['Apagar comentário','Delete comment','Borrar comentario'],
['Como saiu no ensaio?','How did it go at rehearsal?','¿Cómo salió en el ensayo?'],['ninguém avaliou ainda','nobody has rated it yet','nadie la ha valorado aún'],['Limpar','Clear','Borrar'],
['Avaliação do último ensaio','Last rehearsal rating','Valoración del último ensayo'],
['Precisam de mais trabalho','Need more work','Necesitan más trabajo'],['pela avaliação do último ensaio','based on the last rehearsal ratings','según la valoración del último ensayo'],
['Nenhuma música abaixo de 3,5. Bom ensaio.','No songs below 3.5. Great rehearsal.','Ninguna canción por debajo de 3,5. Buen ensayo.'],
['Novo ensaio: zerar avaliações','New rehearsal: reset ratings','Nuevo ensayo: reiniciar valoraciones'],['Confirmar: zerar avaliações de todos','Confirm: reset everyone\'s ratings','Confirmar: reiniciar las valoraciones de todos'],
['Avaliações zeradas.','Ratings reset.','Valoraciones reiniciadas.'],
['BPM e tom preenchidos automaticamente com dados da internet','BPM and key filled in automatically from internet data','BPM y tono rellenados automáticamente con datos de internet'],
['. As fontes divergem para esta música, então confira de ouvido.','. Sources disagree for this song, so check by ear.','. Las fuentes no coinciden para esta canción, así que compruébalo de oído.'],
['Valor da internet, confira de ouvido','Value from the internet, check by ear','Valor de internet, compruébalo de oído'],
['Mais ferramentas','More tools','Más herramientas'],['Mais','More','Más'],
/* letra e cifra */
['Letra','Lyrics','Letra'],['Cifra','Chords','Acordes'],['Modo show','Show mode','Modo show'],['Editar','Edit','Editar'],['Ler','Read','Leer'],
['Buscar letra','Find lyrics','Buscar letra'],['Buscar de novo','Search again','Buscar de nuevo'],['Letras ↗','Lyrics sites ↗','Sitios de letras ↗'],['Genius ↗','Genius ↗','Genius ↗'],
['Colar cifra','Paste chords','Pegar acordes'],['Montar pela letra','Build from lyrics','Armar desde la letra'],['Fechar editor','Close editor','Cerrar editor'],
['Quebrar linhas','Wrap lines','Ajustar líneas'],['Alinhar','Align','Alinear'],['Aplicar à banda','Apply to band','Aplicar a la banda'],['Zerar','Reset','Reiniciar'],
['Confirmar: mudar para toda a banda','Confirm: change for the whole band','Confirmar: cambiar para toda la banda'],
['Cifra e tom atualizados para toda a banda.','Chords and key updated for the whole band.','Acordes y tono actualizados para toda la banda.'],
['Cifra colada e salva.','Chords pasted and saved.','Acordes pegados y guardados.'],
['Não há texto copiado. Copie a cifra e toque de novo.','No copied text. Copy the chords and tap again.','No hay texto copiado. Copia los acordes y toca de nuevo.'],
['Seu navegador não deixou ler o texto copiado. Cole no campo abaixo.','Your browser didn\'t allow reading the copied text. Paste it in the field below.','Tu navegador no permitió leer el texto copiado. Pégalo en el campo de abajo.'],
['Abra a busca, copie a cifra e cole aqui. Ela fica salva para toda a banda.','Open the search, copy the chords and paste them here. They\'re saved for the whole band.','Abre la búsqueda, copia los acordes y pégalos aquí. Se guardan para toda la banda.'],
['Abra a busca, copie a letra e cole aqui. Ela fica salva para toda a banda.','Open the search, copy the lyrics and paste them here. They\'re saved for the whole band.','Abre la búsqueda, copia la letra y pégala aquí. Se guarda para toda la banda.'],
['Toque numa palavra para pôr o acorde em cima dela. Salva na hora, para toda a banda.','Tap a word to put a chord over it. Saved instantly for the whole band.','Toca una palabra para poner el acorde encima. Se guarda al instante para toda la banda.'],
['Acorde em','Chord on','Acorde en'],['Outro acorde (ex.: F#m7)','Another chord (e.g.: F#m7)','Otro acorde (ej.: F#m7)'],['Pôr','Set','Poner'],['Tirar','Remove','Quitar'],
['Não reconheci esse acorde. Exemplos: Am, F#m7, C/G.','I didn\'t recognize that chord. Examples: Am, F#m7, C/G.','No reconocí ese acorde. Ejemplos: Am, F#m7, C/G.'],
['Descer um semitom','Down a semitone','Bajar un semitono'],['Subir um semitom','Up a semitone','Subir un semitono'],
['Diminuir fonte','Smaller text','Texto más pequeño'],['Aumentar fonte','Larger text','Texto más grande'],
['Buscando letras…','Finding lyrics…','Buscando letras…'],
['A busca de letras falhou. Confira a internet e tente de novo.','Lyrics search failed. Check your connection and try again.','La búsqueda de letras falló. Revisa tu conexión e inténtalo de nuevo.'],
/* modo show e metrônomo */
['Sair','Exit','Salir'],['Pausar','Pause','Pausar'],['Rolar','Scroll','Desplazar'],['Fonte','Font','Fuente'],['Rolagem','Scroll','Desplazamiento'],
['Música anterior','Previous song','Canción anterior'],['Próxima música','Next song','Siguiente canción'],
['Tamanho da fonte','Font size','Tamaño de letra'],['Velocidade da rolagem','Scroll speed','Velocidad de desplazamiento'],
['Rolagem mais lenta','Slower scroll','Desplazamiento más lento'],['Rolagem mais rápida','Faster scroll','Desplazamiento más rápido'],
['Espera','Wait','Espera'],['antes de rolar','before scrolling','antes de desplazar'],['Menos espera','Less wait','Menos espera'],['Mais espera','More wait','Más espera'],
['Clique','Click','Clic'],['Iniciar','Start','Iniciar'],['Parar','Stop','Parar'],['Parar clique da banda','Stop band click','Parar clic de la banda'],['Parar clique','Stop click','Parar clic'],
['Banda','Band','Banda'],['Cifra','Chords','Acordes'],
['Largura','Width','Ancho'],['Ajustar à largura: sim','Fit to width: yes','Ajustar al ancho: sí'],['Ajustar à largura: não','Fit to width: no','Ajustar al ancho: no'],
['Quebrar linhas: sim','Wrap lines: yes','Ajustar líneas: sí'],['Quebrar linhas: não','Wrap lines: no','Ajustar líneas: no'],
['Metrônomo','Metronome','Metrónomo'],['Tocar no ritmo','Tap tempo','Marcar el ritmo'],
['Voltar ao original','Back to original','Volver al original'],['BPM da música atualizado.','Song BPM updated.','BPM de la canción actualizado.'],
['Defina o BPM da música primeiro.','Set the song\'s BPM first.','Define primero el BPM de la canción.'],['Defina o BPM ou toque no ritmo.','Set the BPM or tap the tempo.','Define el BPM o marca el ritmo.'],
['Este navegador não toca o metrônomo.','This browser can\'t play the metronome.','Este navegador no reproduce el metrónomo.'],
['Os botões de BPM mudam só o treino de agora; o BPM salvo da música não é alterado, a menos que você toque em “Salvar”. Para descobrir o BPM, toque em “Tocar no ritmo” acompanhando a música (3 toques ou mais).','The BPM buttons only change practice right now; the song\'s saved BPM stays the same unless you tap “Save”. To find the BPM, tap “Tap tempo” along with the song (3 taps or more).','Los botones de BPM solo cambian la práctica de ahora; el BPM guardado de la canción no cambia a menos que toques “Guardar”. Para descubrir el BPM, toca “Marcar el ritmo” siguiendo la canción (3 toques o más).'],
['Compasso','Time signature','Compás'],['tempos','beats','tiempos'],
['Clique da banda','Band click','Clic de la banda'],['Ativar som','Enable sound','Activar sonido'],
['Adiantar o clique','Earlier click','Adelantar el clic'],['Atrasar o clique','Later click','Retrasar el clic'],
['Sincronizando os relógios…','Syncing clocks…','Sincronizando los relojes…'],
['Sem internet para sincronizar. Use o clique normal.','No internet to sync. Use the normal click.','Sin internet para sincronizar. Usa el clic normal.'],
['O clique da banda só funciona no site da banda, com internet.','The band click only works on the band site, online.','El clic de la banda solo funciona en el sitio de la banda, con internet.'],
/* setlist */
['Ordem do show','Show order','Orden del show'],['Pausa entre músicas em segundos','Pause between songs in seconds','Pausa entre canciones en segundos'],
['Pausa entre músicas (s)','Pause between songs (s)','Pausa entre canciones (s)'],['Data do show','Show date','Fecha del show'],['Nome do show','Show name','Nombre del show'],
['O setlist está vazio','The setlist is empty','El setlist está vacío'],['Adicione músicas do repertório abaixo e ajuste a ordem com as setas.','Add songs from the repertoire below and adjust the order with the arrows.','Añade canciones del repertorio abajo y ajusta el orden con las flechas.'],
['Fora do setlist','Not in the setlist','Fuera del setlist'],['Adicionar todas','Add all','Añadir todas'],['Todas as músicas do repertório já estão no setlist.','All songs in the repertoire are already in the setlist.','Todas las canciones del repertorio ya están en el setlist.'],
['Subir','Move up','Subir'],['Descer','Move down','Bajar'],['Tirar do setlist','Remove from setlist','Quitar del setlist'],['Início no show','Start in the show','Inicio en el show'],['de música e pausas','of music and pauses','de música y pausas'],
['Adicione músicas antes de começar.','Add songs before starting.','Añade canciones antes de empezar.'],
['Começar ensaio ao vivo','Start live rehearsal','Empezar ensayo en vivo'],['Ensaio ao vivo','Live rehearsal','Ensayo en vivo'],['Ensaio ao vivo em andamento','Live rehearsal in progress','Ensayo en vivo en curso'],
['A tela de quem tocar em “Acompanhar” troca de música junto com a sua.','The screen of anyone who taps “Follow” changes song together with yours.','La pantalla de quien toque “Seguir” cambia de canción junto con la tuya.'],
['Acompanhar','Follow','Seguir'],['Voltar','Back','Volver'],['Encerrar','End','Terminar'],['Encerrar ensaio','End rehearsal','Terminar ensayo'],['Voltar ao modo show','Back to show mode','Volver al modo show'],
['AO VIVO (você comanda)','LIVE (you lead)','EN VIVO (tú diriges)'],['AO VIVO','LIVE','EN VIVO'],['ao vivo pausado','live paused','en vivo en pausa'],
['do próximo ensaio ou do setlist:','from the next rehearsal or the setlist:','del próximo ensayo o del setlist:'],
['Ensaio','Rehearsal','Ensayo'],
/* layouts */
['Escolha o layout','Choose the layout','Elige el diseño'],['Escolha o layout e o idioma','Choose layout and language','Elige el diseño y el idioma'],
['A escolha vale só para este aparelho. Cada pessoa usa o que preferir.','This choice only applies to this device. Everyone uses what they prefer.','La elección vale solo para este dispositivo. Cada persona usa lo que prefiera.'],
['Cartaz','Poster','Cartel'],['Estúdio','Studio','Estudio'],['Neon','Neon','Neón'],['Em uso','In use','En uso'],['Idioma','Language','Idioma'],
['Papel, fita e parede de tijolos. O visual de cartaz de show.','Paper, tape and a brick wall. The gig-poster look.','Papel, cinta y pared de ladrillos. El look de cartel de concierto.'],
['Claro, limpo e direto. Sem enfeites, fácil de ler.','Light, clean and direct. No frills, easy to read.','Claro, limpio y directo. Sin adornos, fácil de leer.'],
['Escuro, com cor viva, brilho e vidro fosco.','Dark, with vivid color, glow and frosted glass.','Oscuro, con color vivo, brillo y vidrio esmerilado.'],
['parede suave','soft wall','pared suave'],['parede só no topo','wall only on top','pared solo arriba'],['liso','plain','liso'],
/* resumo */
['Pesquisar','Search','Buscar'],['Ver como','View as','Ver como'],
/* status e avisos */
['Sem internet','No internet','Sin internet'],['Enviando alterações…','Sending changes…','Enviando cambios…'],
['alteração guardada','change saved','cambio guardado'],['alterações guardadas','changes saved','cambios guardados'],
['Link de convite copiado.','Invite link copied.','Enlace de invitación copiado.'],
['Abra pelo link de convite da banda','Open through the band\'s invite link','Abre con el enlace de invitación de la banda'],
['Peça o link para alguém da banda. Depois da primeira vez, este aparelho lembra.','Ask someone in the band for the link. After the first time, this device remembers.','Pide el enlace a alguien de la banda. Después de la primera vez, este dispositivo lo recuerda.'],
['Abra esta página no Claude','Open this page in Claude','Abre esta página en Claude'],
['Entre na sua conta para ver o caderno','Sign in to see the notebook','Inicia sesión para ver el cuaderno'],
['Não foi possível carregar','Couldn\'t load','No se pudo cargar'],['Recarregue a página para tentar de novo.','Reload the page to try again.','Recarga la página para intentarlo de nuevo.'],
['Ainda tentando alcançar o banco de dados…','Still trying to reach the database…','Aún intentando alcanzar la base de datos…'],
['O banco de dados não está disponível nesta visualização.','The database isn\'t available in this view.','La base de datos no está disponible en esta vista.'],
['Não foi possível salvar. Você precisa de acesso de colaborador para editar.','Couldn\'t save. You need contributor access to edit.','No se pudo guardar. Necesitas acceso de colaborador para editar.'],
['Não foi possível salvar agora. Tente de novo.','Couldn\'t save right now. Try again.','No se pudo guardar ahora. Inténtalo de nuevo.'],
['Esse arquivo não parece ser uma imagem.','That file doesn\'t look like an image.','Ese archivo no parece una imagen.'],['Não foi possível ler a imagem.','Couldn\'t read the image.','No se pudo leer la imagen.'],
['A imagem é pesada demais. Tente uma versão menor.','The image is too large. Try a smaller version.','La imagen es demasiado pesada. Prueba una versión más pequeña.'],
['Use pelo menos uma pessoa.','Use at least one person.','Usa al menos una persona.'],
['Valor','Value','Valor'],['Carregando…','Loading…','Cargando…'],
['pendentes para o próximo ensaio ou setlist','pending for the next rehearsal or setlist','pendientes para el próximo ensayo o setlist'],
['Marcar para o próximo ensaio','Mark for next rehearsal','Marcar para el próximo ensayo'],
['Cole o código de convite da sua banda para entrar.','Paste your band\'s invite code to join.','Pega el código de invitación de tu banda para entrar.'],
['Código ou link de convite','Invite code or link','Código o enlace de invitación'],
['Entrar na banda','Join the band','Entrar en la banda'],['Verificando…','Checking…','Verificando…'],
['Código não encontrado. Confira e tente de novo.','Code not found. Check it and try again.','Código no encontrado. Revísalo e inténtalo de nuevo.'],
['Sem internet para verificar o código.','No internet to check the code.','Sin internet para verificar el código.'],
['Essa banda não existe mais. Peça um novo código.','That band no longer exists. Ask for a new code.','Esa banda ya no existe. Pide un código nuevo.'],
['Digite o código ou cole o link de convite.','Enter the code or paste the invite link.','Escribe el código o pega el enlace de invitación.'],
['Não tem um código? Peça o link ou o código a alguém da banda.','Don\'t have a code? Ask someone in the band for the link or code.','¿No tienes un código? Pide el enlace o el código a alguien de la banda.'],
['Copiar código','Copy code','Copiar código'],['Código copiado.','Code copied.','Código copiado.'],
['Sair desta banda','Leave this band','Salir de esta banda'],['Confirmar: sair desta banda','Confirm: leave this band','Confirmar: salir de esta banda'],
['Você vai precisar do código para entrar de novo.','You\'ll need the code to join again.','Necesitarás el código para volver a entrar.'],
['Quem abrir esse link, ou colar o código na tela de entrada, entra no caderno da banda.','Anyone who opens this link, or pastes the code on the entry screen, joins the band\'s notebook.','Quien abra este enlace, o pegue el código en la pantalla de entrada, entra al cuaderno de la banda.'],
['Digite','Type','Escribe']
];
var EX={};D.forEach(function(r){EX[r[0]]=r});
function pick(r){return r[I]}
function pl(n,a,b){return +n===1?a:b}
function inst(x){var r=EX[x];return r?r[I]:x}

/* frases com números, datas e nomes */
var P=[
[/^(.+) \/ (.+) \/ setlist \/ música$/,function(m){return m[1]+' / '+m[2]+' / setlist / '+(I===1?'song':'canción')}],
[/^Pasta definida: (.+)$/,function(m){return (I===1?'Folder set: ':'Carpeta definida: ')+m[1]}],
[/^Salva em setlist\/(.+)\/ no Drive da banda\.$/,function(m){return I===1?'Saved to setlist/'+m[1]+'/ in the band\'s Drive.':'Se guarda en setlist/'+m[1]+'/ en el Drive de la banda.'}],
[/^Gravação salva no Drive: (.+)$/,function(m){return (I===1?'Recording saved to Drive: ':'Grabación guardada en Drive: ')+m[1]}],
[/^Última enviada: (.+)$/,function(m){return (I===1?'Last sent: ':'Último enviado: ')+m[1]}],
[/^(\d+) gravações? aguardando envio\.?$/,function(m){return I===1?m[1]+(m[1]==='1'?' recording':' recordings')+' waiting to send':m[1]+(m[1]==='1'?' grabación':' grabaciones')+' esperando envío'}],
[/^Ainda há (\d+) aguardando\. Tente de novo com internet\.$/,function(m){return I===1?m[1]+' still waiting. Try again with internet.':'Aún hay '+m[1]+' en espera. Inténtalo con internet.'}],
[/^(.+) · setlist\/<música>\/$/,function(m){return m[1]+' · setlist/<'+(I===1?'song':'canción')+'>/'}],
[/^(.+) terminou (.+)$/,function(m){return I===1?m[1]+' finished '+m[2]:m[1]+' terminó '+m[2]}],
[/^(.+): (\d+) a tirar$/,function(m){return m[1]+': '+m[2]+(I===1?' to learn':' por sacar')}],
[/^(.+): em dia$/,function(m){return m[1]+(I===1?': all caught up':': al día')}],
[/^(.+) terminou (.+)!$/,function(m){return I===1?m[1]+' finished '+m[2]+'!':m[1]+' terminó '+m[2]+'!'}],
[/^Você é (.+) \((.+)\)$/,function(m){var x=EX[m[2]]?EX[m[2]][I]:m[2];return (I===1?'You are ':'Eres ')+m[1]+' ('+x+')'}],
[/^(\d+)% tirado$/,function(m){return m[1]+(I===1?'% learned':'% sacado')}],
[/^(\d+) música no repertório$/,function(m){return m[1]+(I===1?' song in the repertoire':' canción en el repertorio')}],
[/^(\d+) músicas no repertório$/,function(m){return m[1]+(I===1?' songs in the repertoire':' canciones en el repertorio')}],
[/^nenhuma música ainda$/,function(){return I===1?'no songs yet':'ninguna canción aún'}],
[/^carregando…$/,function(){return I===1?'loading…':'cargando…'}],
[/^(\d+) prontas$/,function(m){return m[1]+(I===1?' done':' listas')}],
[/^(\d+) em andamento$/,function(m){return m[1]+(I===1?' in progress':' en curso')}],
[/^(\d+) não iniciadas$/,function(m){return m[1]+(I===1?' not started':' sin empezar')}],
[/^(\d+) de (\d+) prontas$/,function(m){return I===1?m[1]+' of '+m[2]+' done':m[1]+' de '+m[2]+' listas'}],
[/^(\d+) de (\d+) ainda não prontas$/,function(m){return I===1?m[1]+' of '+m[2]+' not done yet':m[1]+' de '+m[2]+' aún no listas'}],
[/^(\d+) de (\d+) prontas$/,function(m){return m[1]+' / '+m[2]}],
[/^(.+) · (\d+) música pendente$/,null],
[/^(\d+) música pendente$/,function(m){return m[1]+(I===1?' song pending':' canción pendiente')}],
[/^(\d+) músicas pendentes$/,function(m){return m[1]+(I===1?' songs pending':' canciones pendientes')}],
[/^(\d+) dias? para o show$/,function(m){return m[1]+(I===1?pl(m[1],' day to the show',' days to the show'):pl(m[1],' día para el show',' días para el show'))}],
[/^Faltam (\d+) dias?$/,function(m){return I===1?(m[1]==='1'?'1 day left':m[1]+' days left'):(m[1]==='1'?'Falta 1 día':'Faltan '+m[1]+' días')}],
[/^(\d+) pendentes para o próximo ensaio ou setlist$/,function(m){return m[1]+(I===1?' pending for the next rehearsal or setlist':' pendientes para el próximo ensayo o setlist')}],
[/^(\d+) tempos$/,function(m){return m[1]+(I===1?' beats':' tiempos')}],
[/^(\d+) músicas?$/,function(m){return m[1]+(I===1?pl(m[1],' song',' songs'):pl(m[1],' canción',' canciones'))}],
[/^(\d+) sem duração$/,function(m){return m[1]+(I===1?' without duration':' sin duración')}],
[/^(\d+) pendentes$/,function(m){return m[1]+(I===1?' pending':' pendientes')}],
[/^Buscando a letra de (.+)…$/,function(m){return (I===1?'Finding the lyrics of ':'Buscando la letra de ')+m[1]+'…'}],
[/^Letra de (.+) salva\.$/,function(m){return I===1?'Lyrics for '+m[1]+' saved.':'Letra de '+m[1]+' guardada.'}],
[/^Não achei a letra de (.+)\. Use a busca e cole o texto\.$/,function(m){return I===1?'Couldn\'t find the lyrics for '+m[1]+'. Use the search and paste the text.':'No encontré la letra de '+m[1]+'. Usa la búsqueda y pega el texto.'}],
[/^(\d+) letras? salvas?(?:\. Não achei: (.+))?\.?$/,function(m){var t=I===1?m[1]+' lyrics saved':m[1]+' letras guardadas';if(m[2])t+=(I===1?'. Not found: ':'. No encontré: ')+m[2];return t+'.'}],
[/^Buscando letras… (\d+) de (\d+)$/,function(m){return (I===1?'Finding lyrics… ':'Buscando letras… ')+m[1]+(I===1?' of ':' de ')+m[2]}],
[/^Buscar letras que faltam \((\d+)\)$/,function(m){return (I===1?'Find missing lyrics (':'Buscar las letras que faltan (')+m[1]+')'}],
[/^(\d+) músicas? importadas?\.$/,function(m){return I===1?m[1]+pl(m[1],' song imported.',' songs imported.'):m[1]+pl(m[1],' canción importada.',' canciones importadas.')}],
[/^Fundo: (.+)$/,function(m){return (I===1?'Background: ':'Fondo: ')+(EX[m[1]]?EX[m[1]][I]:m[1])}],
[/^Ver como: (.+)$/,function(m){return (I===1?'View as: ':'Ver como: ')+tr(m[1])}],
[/^Função de (.+)$/,function(m){return (I===1?'Role of ':'Rol de ')+m[1]}],
[/^Tom (.+)$/,function(m){return (I===1?'Key ':'Tono ')+m[1]}],
[/^Afinação (.+)$/,function(m){return (I===1?'Tuning ':'Afinación ')+m[1]}],
[/^Capo (.+)$/,function(m){return (I===1?'Capo ':'Cejilla ')+m[1]}],
[/^Ensaio (\d+(?:,\d+)?)★$/,function(m){return (I===1?'Rehearsal ':'Ensayo ')+m[1]+'★'}],
[/^(\d+) comentários?$/,function(m){return m[1]+(I===1?pl(m[1],' comment',' comments'):pl(m[1],' comentario',' comentarios'))}],
[/^média (\d+(?:,\d+)?) de 5$/,function(m){return (I===1?'average ':'media ')+m[1]+(I===1?' out of 5':' de 5')}],
[/^Clique para todos \((.+)\)$/,function(m){return (I===1?'Click for everyone (':'Clic para todos (')+m[1]+')'}],
[/^Salvar (.+) como BPM da música$/,function(m){return (I===1?'Save ':'Guardar ')+m[1]+(I===1?' as the song\'s BPM':' como BPM de la canción')}],
[/^Espera (\d+)s$/,function(m){return (I===1?'Wait ':'Espera ')+m[1]+'s'}],
[/^Não há (letra|cifra) salva para esta música\. Cole o texto na página pessoal\.$/,function(m){return I===1?'No '+(m[1]==='letra'?'lyrics':'chords')+' saved for this song. Paste the text on the personal page.':'No hay '+(m[1]==='letra'?'letra':'acordes')+' guardados para esta canción. Pega el texto en la página personal.'}],
[/^Clique da banda · (.+)$/,function(m){return (I===1?'Band click · ':'Clic de la banda · ')+m[1]}],
[/^Ensaio ao vivo · (.+)$/,function(m){return (I===1?'Live rehearsal · ':'Ensayo en vivo · ')+m[1]}],
[/^com (.+)$/,function(m){return (I===1?'with ':'con ')+m[1]}],
[/^(\d+) músicas? pendentes? (.*)$/,null],
[/^Ensaio ao vivo em andamento com (.+)$/,function(m){return (I===1?'Live rehearsal in progress with ':'Ensayo en vivo en curso con ')+m[1]}],
[/^Avaliação: (.+)$/,function(m){return (I===1?'Rating: ':'Valoración: ')+m[1]}],
[/^Sem internet · (\d+) alterações? guardadas?$/,function(m){return I===1?'No internet · '+m[1]+pl(m[1],' change saved',' changes saved'):'Sin internet · '+m[1]+pl(m[1],' cambio guardado',' cambios guardados')}],
[/^(.+?): faltam (\d+) dias?\. (\d+) de (\d+) músicas( do setlist)? ainda não estão prontas(?: \(cerca de ([\d,]+) por semana\))?\.$/,function(m){
  var d=m[2],n=m[3],tot=m[4],sl=m[5]?true:false,pw=m[6];
  if(I===1)return m[1]+': '+d+pl(d,' day',' days')+' to go. '+n+' of '+tot+' songs'+(sl?' in the setlist':'')+' aren\'t ready yet'+(pw?' (about '+pw.replace(',','.')+' per week)':'')+'.';
  return m[1]+': faltan '+d+pl(d,' día',' días')+'. '+n+' de '+tot+' canciones'+(sl?' del setlist':'')+' aún no están listas'+(pw?' (unas '+pw+' por semana)':'')+'.';}],
[/^(.+?): faltam (\d+) dias?\. Todas as (\d+) músicas estão prontas\.$/,function(m){return I===1?m[1]+': '+m[2]+pl(m[2],' day',' days')+' to go. All '+m[3]+' songs are ready.':m[1]+': faltan '+m[2]+pl(m[2],' día',' días')+'. Las '+m[3]+' canciones están listas.'}],
[/^(.+?): faltam (\d+) dias?\. Importe as músicas ou monte o setlist\.$/,function(m){return I===1?m[1]+': '+m[2]+pl(m[2],' day',' days')+' to go. Import the songs or build the setlist.':m[1]+': faltan '+m[2]+pl(m[2],' día',' días')+'. Importa las canciones o arma el setlist.'}],
[/^(.+?)O show foi em (.+)\.$/,function(m){return (m[1]||'')+(I===1?'The show was on ':'El show fue el ')+m[2]+'.'}],
[/^(.*)O show é hoje\.$/,function(m){return (m[1]||'')+(I===1?'The show is today.':'El show es hoy.')}]
];
P=P.filter(function(x){return typeof x[1]==='function'});

function tr(s){
  var t=s.trim();if(!t)return s;
  var lead=s.slice(0,s.indexOf(t)),trail=s.slice(s.indexOf(t)+t.length);
  var e=EX[t];if(e)return lead+e[I]+trail;
  for(var i=0;i<P.length;i++){var m=t.match(P[i][0]);if(m)return lead+P[i][1](m)+trail}
  var pm=t.match(/^\((.+)\)$/);if(pm){var r=tr(pm[1]);if(r!==pm[1])return lead+'('+r+')'+trail}
  if(t.indexOf(' · ')>0){var parts=t.split(' · '),ch=false,out=parts.map(function(p){var q=tr(p);if(q!==p)ch=true;return q});if(ch)return lead+out.join(' · ')+trail}
  var cm=t.match(/^(.*[^\s])\s+\((.+)\)$/);if(cm){var ins=inst(cm[2]);if(ins!==cm[2])return lead+cm[1]+' ('+ins+')'+trail}
  return s;
}
window.CE_TR=tr;

var SKIP=/^(SCRIPT|STYLE|TEXTAREA|PRE|NOSCRIPT|CODE)$/;
var SKIPCLS='.cwrap,.ce,.cm-t,.t-title,.t-artist,.hero-name,.hero-tag,.mname,.pn,.stage-body,.cl,.tx,.ly,.ch';
function skipEl(el){
  while(el&&el.nodeType===1){
    if(SKIP.test(el.tagName))return true;
    if(el.matches&&el.matches(SKIPCLS))return true;
    el=el.parentNode;
  }
  return false;
}
var ATTRS=['placeholder','title','aria-label','alt'];
function doNode(n){
  if(n.nodeType===3){
    if(skipEl(n.parentNode))return;
    var v=n.nodeValue,r=tr(v);if(r!==v)n.nodeValue=r;
  }else if(n.nodeType===1){
    if(SKIP.test(n.tagName)&&n.tagName!=='TEXTAREA')return;
    if(!(n.closest&&n.closest(SKIPCLS))||true){
      ATTRS.forEach(function(a){var v=n.getAttribute&&n.getAttribute(a);if(v){var r=tr(v);if(r!==v)n.setAttribute(a,r)}});
    }
    if(n.tagName==='TEXTAREA'||(n.tagName==='INPUT'&&false))return;
    for(var c=n.firstChild;c;c=c.nextSibling)doNode(c);
  }
}
var title={en:'Rehearsal Notebook',es:'Cuaderno de Ensayo'}[lang];
document.title=title;
function start(){
  doNode(document.body);
  var mo=new MutationObserver(function(list){
    list.forEach(function(m){
      if(m.type==='childList')m.addedNodes.forEach(doNode);
      else if(m.type==='attributes')doNode(m.target);
    });
  });
  mo.observe(document.body,{childList:true,subtree:true});
}
if(document.body)start();else document.addEventListener('DOMContentLoaded',start);
})();
