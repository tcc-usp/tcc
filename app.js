const express = require('express');
const session = require('express-session');
const fileUpload = require('express-fileupload'); //Simple express middleware for uploading files.
const bodyParser = require('body-parser');
const path = require('path');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const sharp = require('sharp');

const app = express();

//importar funcoes do arquivo index.js, relacionadas as funcionalidades do site mesmo sem estar logado
const {getHomePage,
	//teste,
	tryLogin,
	getInitialPage,
	getSupervisorsList,
	getSupervProf,
	getProjectsPage,
	getFilteredProjectPage,
	getRetrievePassPage,
	sendPass,
	getNewPassPage,
	updatePass,
	getNotificationPage} = require('./routes/index');

//importar funcoes do arquivo admin.js, relacionadas as funcionalidades do administrador da página
const {getAdminLoginPage,
	tryAdmLogin,
	getAdminPage,
	tryAddUser,
	tryDeclineUser,
	getRefused,
	admLogout} = require('./routes/admin');

//importar funcoes do arquivo regist.js, relacionadas ao registro de usuários
const {getUserType, 
	getRegisterPage, 
	tryRegister} = require('./routes/register');

//importar funcoes do arquivo profile.js, relacionadas as informações do usuário(perfil, edição, logout)
const {getUserInfo,
	getEditPage,
	tryEditInfo,
	alterPhoto,
	getApplications,
	getChangePassPage,
	tryChangePass,
	logout} = require('./routes/profile');

//importar funcoes do arquivo project.js, relacionadas aos projetos(criação, visualização, edição, candidatura)
const {getUserProjects,
	getNewProjectPage,
	tryCreateProject,
	getEditProjectPage,
	tryEditProject,
	tryApplyProject,
	getDelProjPage,
	delProject,
	getChangeProjStatus,
	changeProjStatus,
	getProjectInfo,
	getFullProject,
	getProfile} = require('./routes/project');

const {normalizePort} = require('./routes/functions');

const port = normalizePort(process.env.PORT || '8080');

//***
//definir valores para conexão com o banco de dados
/*const db = mysql.createConnection ({
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'tcc',
	multipleStatements: true
});*/

/*const db = mysql.createConnection ({
	host: 'us-cdbr-iron-east-02.cleardb.net',
	user: 'b2f92a9a476539',
	password: 'b4d76567',
	database: 'heroku_251c516b09b1849',
	multipleStatements: true
});*/

const db = mysql.createConnection ({
	host: 'remotemysql.com',
	user: 'vzr4WsxLmC',
	password: 'hAgFk40oaT',
	database: 'vzr4WsxLmC',
	multipleStatements: true
});

//***
//definir valores para o uso do e-mail
var transporter = nodemailer.createTransport({
	service: 'gmail',
	secure: false,
	auth: {
		user: "tcc.uspsc@gmail.com",
		pass: "tccusp123"
	}
});

//conectar com o bd
db.connect((err) => {
	if(err){
		throw err;
	}
	console.log('Connected to database\n');
});


global.db = db;//global para uso do banco de dados em outros arquivos
global.bcrypt = bcrypt;//global para encrypt da senha
global.transporter = transporter;
global.path = __dirname;
global.sharp = sharp;
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

// configurar middleware
app.set('views', __dirname + '/views'); // set express to look in this folder to render our view
app.set('view engine', 'ejs'); // configure template engine
app.set('port', process.env.port || port); // set express to use this port
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // parse form data client
app.use(session({secret:'hms082jfowq89coen', resave:false, saveUninitialized:true}));
app.use(express.static(path.join(__dirname, 'public'))); // configure express to use public folder
app.use(fileUpload()); // configure fileupload

//Site login
app.post('/', tryLogin);
app.get('/', getHomePage);

//lista de empresas/docentes cadastrado
app.get('/empresas', getSupervisorsList);
app.get('/docentes', getSupervisorsList);
//perfil da empresa/docente
app.get('/empresas/:url', getSupervProf);
app.get('/docentes/:url', getSupervProf);

app.get('/docentes', getSupervisorsList);
//perfil da empresa/docente
app.get('/empresas/:url', getSupervProf);

//Registro de usuario
app.get('/registro', getUserType);
app.get('/registro-:type', getRegisterPage);
app.post('/registro-:type', tryRegister);

//recuperação de senha
app.get('/recuperar-senha', getRetrievePassPage);
app.post('/recuperar-senha', sendPass);
app.get('/nova-senha/:url', getNewPassPage);
app.post('/nova-senha/:url', updatePass);

//página inicial do usuário
app.get('/inicio', getInitialPage);
//show profile, edit profile, edit password
app.get('/perfil', getUserInfo);
app.post('/perfil', alterPhoto);
app.get('/edit-perfil', getEditPage);
app.post('/edit-perfil', tryEditInfo);
app.get('/perfil/:userUrl', getProfile);
app.get('/trocar-senha', getChangePassPage);
app.post('/trocar-senha', tryChangePass);

//ver candidaturas realizadas
app.get('/candidaturas', getApplications);
//ver notificações
app.get('/notificacoes', getNotificationPage);

//Lista de projetos abertos
app.get('/projetos/:pag/:filter?', getFilteredProjectPage);
//Informações de um projeto
app.get('/projeto-:id', getProjectInfo);
//registrar candidatura a um projeto
app.get('/try/:pid', tryApplyProject);//try to change it to post later


//lista de projetos do usuario
app.get('/usuario-projetos-:status', getUserProjects);
//ver projeto completo com candidaturas
app.get('/meu-projeto/:id', getFullProject);
//criar novo projeto
app.get('/novo-projeto', getNewProjectPage);
app.post('/novo-projeto', tryCreateProject);
//editar um projeto
app.get('/editar_projeto/:nid', getEditProjectPage);
app.post('/editar_projeto/:projid', tryEditProject);
//atualizar etapa do projeto
app.get('/finalizar-:step/:id', getChangeProjStatus);
app.post('/finalizar-:step/:id', changeProjStatus);
//deletar projeto
app.get('/deletar-projeto/:id', getDelProjPage);
app.post('/deletar-projeto/:id', delProject);


//adm login page
app.get('/mars', getAdminLoginPage);
app.post('/mars', tryAdmLogin);
//adm initial page
app.get('/mars/adm', getAdminPage);
//adm accept/refuse registration
app.get('/mars/adm/add_:sid', tryAddUser);
app.get('/mars/adm/decline_:sid', tryDeclineUser);
//adm refused registrations list
app.get('/mars/recusados', getRefused);
//adm logout
app.get('/mars/logout', admLogout);

app.get('/logout', logout);

function teste(req, res) {
        var message = "teste";
        var i = 10;

        res.render('teste.ejs', {
            message
            , i
        });
    }

app.get('/teste', teste);
app.listen(port, () => {//later put process.env.port
	console.log(`Server running on port: ${port}`);
});