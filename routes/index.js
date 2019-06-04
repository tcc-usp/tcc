const site_name = "TCC-USP"; //string do nome padrão que é mostrado na aba do navegador
var message = " ";
const {sendMail} = require('./functions');
var fs = require('fs');

module.exports = {
    teste: (req, res) => {
        var message = "teste";
        var i = 10;

        res.render('teste.ejs', {
            message
            , i
        });
    },
    //carregar a página inicial do site
    getHomePage: (req, res) => {
        sess = req.session;//contem dados da sessão do usuário

        //direcionar para a página inicial do usuário caso ele já tenha uma sessão iniciada
        if(sess.user_id) {
            console.log("Sessão existente. Redirecionando para página inicial do usuário.\n");

            res.status(401).redirect('/inicio');
        }
        //se não houver sessão iniciada, é carregada a página pública inicial do site
        else {
            console.log("Página pública inicial.\n");

            res.status(200).render('public/homePage.ejs', {
                title: site_name
                , message: ""
                , logged: 0
            });
        }
    },
    //tentar logar o usuário com o email e senha inseridos e salvar informações do usuário na sessão 
    //caso o login seja bem sucedido
    tryLogin: (req, res) => {
        sess = req.session;
        let email = req.body.email;
        let pwd = req.body.pwd;
        //var imgLocal = path + "/public/user_img/";

        //verifica se o email consta no banco de dados, coletando dados correspondentes se existir
        select_command = "SELECT * FROM user WHERE email=?";
        db.query(select_command, [email], (err, result) => {

            if (err) return res.status(500).send(err);

            //caso o e-mail exista, verifica se a senha é válida e guarda informações na sessão do usuário
            if(result.length > 0) {

                //comparar a senha inserida no login e a senha salva no banco de dados
                bcrypt.compare(pwd, result[0].password, function(err, ans) {
                    //Dados de login válidos
                    if(ans) {

                        //faz o login se o registro de conta estiver aceito
                        //salva dados do usuário na sessão
                        if(result[0].status == 'aceito') {
                            sess.user_id = result[0].user_id;
                            sess.name = result[0].name;
                            sess.email = result[0].email;
                            sess.linkedin = result[0].linkedin;
                            sess.about = result[0].about;
                            sess.type = result[0].type;
                            sess.pass = result[0].password;

                            var select_command = "SELECT * FROM " + result[0].type + " WHERE user_id=?;";
                            db.query(select_command, [sess.user_id], (err, typeResult) => {
                                if (err) return res.status(500).send(err);

                                console.log("Dados de login válidos. Iniciando login do usuário de id " + sess.user_id + "\n");

                                switch(sess.type) {
                                    case 'candidate':
                                        sess.course = typeResult[0].course;
                                        sess.usp_number = typeResult[0].usp_number;
                                        sess.telephone = typeResult[0].telephone;
                                        sess.complete = 'true';
                                        sess.skills = [];
                                        skills = [];

                                        if(typeResult[0].skills) {
                                            if (typeResult[0].skills != '@' && typeResult[0].skills != '') {
                                                skills = typeResult[0].skills.split("@");
                                            }
                                        }

                                        if(skills.length > 0) {
                                            skills.forEach((skill, index) => {
                                                if(skill != '') {
                                                    sess.skills.push(skill);
                                                }
                                            });
                                        }

                                        if(sess.about == '' || sess.skills == []) {
                                            sess.complete = 'false';
                                        }

                                        //direciona para a página inicial ou para a página de um projeto 
                                        //ao qual o usuário tentou se candidatar não estando logado
                                        if(sess.redirect) {
                                            let redirect = (sess.redirect != '') ? sess.redirect : '/inicio';
                                            sess.redirect = '';

                                            res.status(200).redirect(redirect);
                                        }
                                        //caso não tenha vindo de outra página do site
                                        else {
                                            res.status(200).redirect('/inicio');
                                        }
                                        break;

                                    case 'company':
                                        sess.site = result[0].site;
                                        sess.cnpj = result[0].cnpj;
                                        sess.complete = 'true';

                                        if(sess.about == '') {
                                            sess.complete = 'false';
                                        }

                                        //var file =  imgLocal + sess.user_id + ".jpg"

                                        //verifica se possui imagem de perfil
                                        //var profileImg = (fs.existsSync(file)) ? 'True' : 'False';

                                        res.status(200).redirect('/inicio');
                                        /*res.render('user/userPage.ejs', {
                                            title: site_name
                                            , sess
                                            , logged: 1
                                            , profileImg
                                        });*/
                                        break;

                                    case 'professor':
                                        sess.institute = result[0].institute;
                                        sess.complete = 'true';

                                        if(sess.about == '') {
                                            sess.complete = 'false';
                                        }

                                        //var file =  imgLocal + sess.user_id + ".jpg"

                                        //verifica se possui imagem de perfil
                                        //var profileImg = (fs.existsSync(file)) ? 'True' : 'False';
                                        res.status(200).redirect('/inicio');
                                        /*res.render('user/userPage.ejs', {
                                            title: site_name
                                            , sess
                                            , logged: 1
                                            , profileImg
                                        });*/
                                        break;

                                    default:
                                }
                            });
                        }
                        //casos em que o regitro da conta ainda não tenha sido aceito
                        if(result[0].status == 'em espera') {
                            console.log("Registro em análise.\n");

                            res.status(401).render('public/homePage.ejs', {
                                title: site_name
                                , message: 'Registro de conta ainda em análise'
                                , logged: 0
                            });
                        }
                        if(result[0].status == 'recusado') {
                            console.log("Registro recusado.\n");

                            res.status(401).render('public/homePage.ejs', {
                                title: site_name
                                , message: 'O registro desse e-mail foi recusado.'
                                , logged: 0
                            });
                        }
                    }
                    //Senha incorreta: mensagem de erro enviada para a página
                    else {
                        console.log("Login inválido.\n");

                        res.status(401).render('public/homePage.ejs', {
                            title: site_name
                            , message: 'Login inválido'
                            , logged: 0
                        });
                    } 
                });
            }
            //caso de e-mail inexistente no banco de dados: será enviada a mensagem de erro para a página
            else {
                console.log("E-mail inválido.\n");

                res.status(401).render('public/homePage.ejs', {
                    title: site_name
                    , message: 'E-mail inválido'
                    , logged: 0
                });
            }
        });
    },
    getInitialPage: (req, res) => {
        sess = req.session;
        var logged = (sess.user_id) ? 1 : 0;
        var proj_id = [];
        var suggest = [];

        console.log(sess);

        if(sess.user_id) {

            if(sess.type == 'candidate') {

                sess.complete = 'true';
                if(sess.about == '' || sess.skills == []) {
                    sess.complete = 'false';
                }

                var random_skill = sess.skills[Math.floor(Math.random()*sess.skills.length)];

                var select_command = "SELECT project_id, owner, name, city, type FROM project \
                WHERE courses LIKE '%" + sess.course + "%' AND status='recebendo inscrições' AND skills LIKE '%" + random_skill + "%' \
                OR courses LIKE '%" + sess.course + "%' AND status='recebendo inscrições' \
                ORDER BY RAND() LIMIT 3";
                db.query(select_command, (err, suggestion) => {
                    if(err) return res.status(500).send(err);


                //seleciona projetos recentemente abertos
                var select_command = "SELECT project_id, owner, name, city, type FROM project WHERE \
                status='recebendo inscrições' ORDER BY post_date DESC LIMIT 3";
                db.query(select_command, (err, newProject) => {
                    if(err) return res.status(500).send(err);
                
                    //seleciona projetos nos quais o usuário se candidatou e que o status foi atualizado recentemente
                    select_command = "SELECT proj_id, date FROM notification WHERE user_id LIKE '%,?,%' ORDER BY \
                    date DESC LIMIT 3";
                    db.query(select_command, [sess.user_id], (err, notif) => {
                        if(err) return res.status(500).send(err);

                            for(var i = 0; i < notif.length; i++) {
                                proj_id[i] = notif[i].proj_id;
                            }

                            //busca informações dos projetos encontrados na busca anterior
                            if(notif.length > 0) {
                                select_command = "SELECT project_id, name, owner, city, type, status FROM project \
                                WHERE project_id IN (" + proj_id.join() + ") ORDER BY post_date DESC LIMIT 3";
                                db.query(select_command, (err, proj) => {
                                    if(err) return res.status(500).send(err);

                                    console.log("Página inicial do candidato\n");

                                    res.status(200).render('user/candidate/initialPage.ejs', {
                                        title: "Empresas " + site_name
                                        , sess
                                        , newProject
                                        , logged
                                        , proj
                                        , suggestion
                                    });
                                });
                            }
                            else{
                                res.status(200).render('user/candidate/initialPage.ejs', {
                                    title: "Empresas " + site_name
                                    , sess
                                    , newProject
                                    , logged
                                    , proj: []
                                    , suggestion
                                });
                            }
                    });
                });
                });
            }
            if(sess.type != 'candidate') {
                sess.complete = 'true';

                if(sess.about == '') {
                    sess.complete = 'false';
                }

                select_command = "SELECT project_id, name, candidates, final_date FROM project WHERE user_id=? \
                AND status='recebendo inscrições' ORDER BY final_date ASC LIMIT 3;";
                db.query(select_command, [sess.user_id], (err, projects) => {
                    if(err) return res.status(500).send(err);

                    if(projects.length > 0) {
                        projects.forEach((project, index) => {
                            final_date = JSON.stringify(project.final_date).substr(1, 10);
                            parts = final_date.split("-");
                            project.final_date = parts[2] + "/" + parts[1] + "/" + parts[0];
                        });
                    }
                    
                    select_command = "SELECT about, date FROM notification WHERE \
                    user_id='," + sess.user_id + ",' ORDER BY date DESC LIMIT 3;";
                    db.query(select_command, (err, notification) => {
                        if(err) return res.status(500).send(err);

                        if(notification.length > 0) {
                            notification.forEach((notifi, index) => {
                                date = JSON.stringify(notifi.date).substr(1, 10);
                                parts = date.split("-");
                                notifi.date = parts[2] + "/" + parts[1] + "/" + parts[0];
                            });
                        }

                        res.status(200).render('user/candidate/initialPage.ejs', {
                            title: "Empresas " + site_name
                            , sess
                            , projects
                            , logged
                            , notification
                        });
                    });

                });
            }
        }
        else {
            res.status(401).redirect('/');
        }
    },
    //carregar página que mostra empresas ou docentes que utilizam o site
    getSupervisorsList: (req, res) => {
        sess = req.session;
        var logged = (sess.user_id) ? 1 : 0;

        let path = req.route.path;
        var type;

        if(path == '/empresas') type = 'company';

        if(path == '/docentes') type = 'professor';

        select_command = "SELECT url, name FROM user WHERE type='"+ type +"' AND status='aceito' ORDER BY name ASC";
        //busca informações das empresas no banco de dados e passa para a página
        db.query(select_command, (err, result) => {
            if(err) return res.status(500).send(err);

            else {
                console.log("Página de empresas/docentes cadastrados\n");

                res.status(200).render('public/supervisors.ejs', {
                    title: "Empresas " + site_name
                    , result
                    , logged
                    , type
                });
            }
        });
    },
    //carregar perfil público de uma empresa
    getSupervProf: (req, res) => {
        sess = req.session;
        var logged = (sess.user_id) ? 1 : 0;

        var url = req.params.url;

        var imgLocal = path + "/public/user_img/";

        let address = req.route.path;
        var type;

        if(address == '/empresas/:url') type = 'company';
        if(address == '/docentes/:url') type = 'professor';

        console.log("Carregando perfil da empresa/docente\n");

        //pegar informações da tabela de usuário correspondente ao parâmetro da url
        select_command = "SELECT * FROM user WHERE url=?";
        db.query(select_command, [url], (err, userResult) => {
            if (err) return res.status(500).send(err);
            
            //pegar informações da tabela de empresas correspondente ao id de usuario
            select_command = "SELECT * FROM " + type + " WHERE user_id=?";
            db.query(select_command, [userResult[0].user_id], (err, typeResult) => {
                if (err) return res.status(500).send(err);

                var file =  imgLocal + userResult[0].user_id + ".jpg"
                console.log(file);
                //verifica se possui imagem de perfil
                var profileImg = (fs.existsSync(file)) ? 'True' : 'False';

                //pegar quantidade de projetos criados pela empresa
                select_command = "SELECT COUNT(*) as cnt FROM project WHERE user_id=?";
                db.query(select_command, [userResult[0].user_id], (err, projResult) => {
                    if (err) return res.status(500).send(err);

                    res.status(200).render('public/supervisorProfile.ejs', {
                        title: site_name
                        , userInfo: userResult[0]
                        , typeInfo: typeResult[0]
                        , logged
                        , profileImg
                        , count: projResult[0].cnt
                    });
                });
            });
        });
    },
    //carregar página que mostra os projetos abertos
    getFilteredProjectPage: (req, res) => {

        sess = req.session;
        var logged = (sess.user_id) ? 1 : 0;
        
        var url = req.params.filter;
        var pag = parseInt(req.params.pag, 10)

        //values[] conterá os valores dos parâmetros para as buscas no bd
        var values = [];
        //application[] conterá os dados de candidaturas do usuário
        var application = [];
        //arrays que irão conter os valores das opções dos filtro
        var city = [];
        var course = [];
        var owner = [];
        var type = [];

        //conterão valores para filtragem
        var typeFilter = ''
        var courseFilter = ''
        var cityFilter = ''
        var ownerFilter = ''
        var selCourse = ''

        //variaveis para numeração das páginas
        var page = {
            actual: pag,
            itens: 10,
            previous: pag - 1,
            next: pag + 1,
            first : pag - 4,
            last: pag + 4,
            total: 0
        };

        page.first = (page.actual < 6) ? 1 : pag-4;
        page.last = (page.actual < 6) ? 9 : pag+4;

        //selecionar os dados das colunas que servirão para filtragem de projetos
        select_command = "SELECT DISTINCT owner, city, type, courses FROM project WHERE status='recebendo inscrições';"
        db.query(select_command, (err, filterList) => {
            if (err) return res.status(500).send(err);

            if(filterList.length > 0) {
                filterList.forEach((filterList, index) => {
                    if (filterList.courses != '@') {
                        courses = filterList.courses.split("@");
                    }
                    courses.forEach((courses, index) => {
                        if(courses != '') {
                            course.push(courses);
                        }
                    })
                    city.push(filterList.city);
                    owner.push(filterList.owner);
                    type.push(filterList.type);
                })
            }

            //ordena e retira valores duplicados das opções de filtragem
            city = [...new Set(city.map(item => item))].sort();
            course = [...new Set(course.map(item => item))].sort();
            owner = [...new Set(owner.map(item => item))].sort();
            type = [...new Set(type.map(item => item))].sort();

            //url = url.replace(/;/g, "");
            //caso seja necessário filtrar os dados
            if(url) {
                filters = url.split("&");

                typeFilter = filters[0].substring("tipo=".length);
                courseFilter = "%" + filters[1].substring("curso=".length) + "%";
                cityFilter = filters[2].substring("cidade=".length);
                ownerFilter = filters[3].substring("responsavel=".length);

                selCourse = filters[1].substring("curso=".length)

                //gerar o comando de acordo com os parâmetros fornecidos
                select_command = "SELECT COUNT(*) as cnt FROM project WHERE status='recebendo inscrições' ";
                complement = ''
                if(typeFilter != '*') {
                    complement += "AND type=? "
                    values.push(typeFilter);
                }
                if(courseFilter != '') {
                    complement += 'AND courses LIKE ?'
                    values.push(courseFilter);
                }
                if(cityFilter != '*') {
                    complement += "AND city=? "
                    values.push(cityFilter);
                }
                if(ownerFilter != '*') {
                    complement += "AND owner=?"
                    values.push(ownerFilter);
                }
                select_command += complement;
            }

            //mostrar todos os projetos, sem filtro
            if(!url) {
                select_command = "SELECT COUNT(*) as cnt FROM project WHERE status='recebendo inscrições';";
            }

            //Conta quantos a quantidade de projetos abertos existentes para numeração das páginas
            db.query(select_command, values, (err, row) => {

                if (err) return res.status(500).send(err);

                page.total = Math.ceil(row[0].cnt / page.itens);
                page.last = (page.last > page.total) ? page.total : page.last;

                if(url) {
                    select_command = "SELECT * FROM project WHERE status='recebendo inscrições' " + complement + " ORDER \
                    BY post_date DESC LIMIT " + (page.actual - 1) * page.itens + ", " + page.itens;
                }
                if(!url) {
                    select_command = "SELECT * FROM project WHERE status='recebendo inscrições' ORDER BY post_date DESC \
                    LIMIT " + (page.actual - 1) * page.itens + ", " + page.itens;
                }

                //Seleciona informações apenas dos projetos que aparecerão na página
                db.query(select_command, values, (err, projResult) => {
                    if (err) return res.status(500).send(err);

                    var projects = [];
                        
                    //tratar os dados relacionados a datas para que apareçam no formato padrão
                    if(projResult.length > 0) {
                        projResult.forEach((project, index) => {
                            post_date = JSON.stringify(project.post_date).substr(1, 10);
                            parts = post_date.split("-");
                            project.post_date = parts[2] + "/" + parts[1] + "/" + parts[0];

                            final_date = JSON.stringify(project.final_date).substr(1, 10);
                            parts = final_date.split("-");
                            project.final_date = parts[2] + "/" + parts[1] + "/" + parts[0];
                        })
                    }

                    //se estiver logado, fazer uma query nos projetos nos quais o usuario esta inscrito, 
                    //a fim de informar na pagina
                    if(logged) {
                        select_command = "SELECT project_id FROM application WHERE user_id=?;";
                        db.query(select_command, [sess.user_id], (err, applicResult) => {
                            if (err) return res.status(500).send(err);

                            if(applicResult.length > 0) {
                                applicResult.forEach((apresult, index) => {
                                    application.push(apresult.project_id);
                                })
                            }

                            res.status(200).render('public/openProjects.ejs', {
                                title: "Projetos " + site_name
                                , project: projResult
                                , logged
                                , application
                                , page
                                , city
                                , owner
                                , type
                                , course
                                , selCity: cityFilter
                                , selCourse
                                , selOwner: ownerFilter
                                , selType: typeFilter
                                , url
                            });
                        });
                    }
                    else {
                        res.status(200).render('public/openProjects.ejs', {
                            title: "Projetos " + site_name
                            , project: projResult
                            , logged
                            , application
                            , page
                            , city
                            , owner
                            , type
                            , course
                            , selCity: cityFilter
                            , selCourse
                            , selOwner: ownerFilter
                            , selType: typeFilter
                            , url
                        });
                    }
                });
            });
        });
    },
    //página para recuperar senha
    getRetrievePassPage: (req, res) => {
        console.log("Página de senha esquecida\n")
        
        res.status(200).render('public/forgotPass.ejs', {
            title: site_name
            , message: ''
            , logged: 0
        });
    },
    //enviar email com link de recuperação de senha
    sendPass: (req, res) => {
        email = req.body.email;
        header = req.headers.host;

        //verifica se o e-mail está registrado
        select_command = "SELECT user_id FROM `user` WHERE email=?";
        db.query(select_command, [email], (err, emailResult) => {
            if (err) {
                return res.status(500).send(err);
            }
            else {
                if(emailResult.length > 0) {
                    
                    console.log("id do usuário localizado")

                    //gera uma url aleatória
                    var url = "";
                    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

                    for (var i = 0; i < 4; i++) {
                        url += possible.charAt(Math.floor(Math.random() * possible.length));
                    }

                    //deleta antigas urls geradas para o mesmo usuário
                    delete_command = "DELETE FROM `forgot_pass` WHERE user_id=?";
                    db.query(delete_command, [emailResult[0].user_id], (err, deleteResult) => {
                        if (err) {
                            return res.status(500).send(err);
                        }
                        else {

                            console.log("urls antigas deletadas")

                            //registra na tabela forgot_pass a url de recuperação correspondente ao email
                            insert_command = "INSERT INTO forgot_pass (url, user_id) VALUES (?, ?);"
                            db.query(insert_command, [url, emailResult[0].user_id], (err, insertResult) => {
                                if (err) {
                                    return res.status(500).send(err);
                                }
                                else{
                                    console.log("url nova cadastrada");

                                    //envia email para 'email', referente a recuperação de senha
                                    sendMail(email, 'forgotPass', [url, header]);;

                                    let message = "Um e-mail com o link para recuperação da conta foi enviado no endereço " + email + ".";
                                    //res.render('public/sentPass.ejs', {
                                    res.status(200).render('message.ejs', {
                                        title: site_name
                                        //, email
                                        , message
                                        , logged: 0
                                    });
                                }
                            });
                        }
                    });
                }
                //se o email inserido não estiver registrado
                else {
                    console.log("E-mail inválido.\n");
                    res.status(401).render('public/forgotPass.ejs', {
                        title: site_name
                        , message: 'Este e-mail não está registrado'
                        , logged: 0
                    });
                }
            }
        });
    },
    //página para cadastrar nova senha
    getNewPassPage: (req,res) => {
        url = req.params.url;

        console.log("Página de recuperação de senha\n")

        //verifica se a url é válida
        select_command = "SELECT user_id FROM forgot_pass WHERE url=?"
        db.query(select_command, url, (err, result) => {
            if(err) {
                console.log(err);
            } 
            else {
                if(result.length > 0) {
                    res.status(200).render('public/newPass.ejs', {
                        title: site_name
                        , message: ''
                        , logged: 0
                    });
                }
            }
        });
    },
    //atualizar senha
    updatePass: (req,res) => {
        url = req.params.url;
        password = req.body.password;

        console.log("Atualizando senha");

        //seleciona o id do usuário correspondente a url
        select_command = "SELECT user_id FROM forgot_pass WHERE url=?"
        db.query(select_command, [url], (err, result) => {
            if(err) {
                console.log(err);
            } 
            else {
                //faz um hash na password
                bcrypt.hash(password, 10, function(err, hash) {
                    if (err) {
                        return res.status(500).send(err);
                    }
                    else{
                        //atualiza a senha no banco de dados
                        update_command = "UPDATE user SET password=? WHERE user_id=?";
                        db.query(update_command, [hash, result[0].user_id], (err, updateResult) => {
                            if(err) {
                                console.log(err);
                            } 
                            else {
                                console.log("Senha atualizada\n");
                                
                                //deleta as urls de recuperação de senha do usuário
                                delete_command = "DELETE FROM `forgot_pass` WHERE user_id=?";
                                db.query(delete_command, [result[0].user_id], (err, deleteResult) => {
                                    if (err) {
                                        return res.status(500).send(err);
                                    }
                                    else {
                                        res.status(200).render('message.ejs', {
                                            title: site_name
                                            , message: 'Senha alterada'
                                            , logged: 0
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    },
    getNotificationPage: (req, res) => {
        sess = req.session;
        var logged = (sess.user_id) ? 1 : 0;

        if(sess.user_id) {
            var select_command = "SELECT about, date FROM notification WHERE user_id LIKE '%," + sess.user_id + ",%' ORDER BY date DESC";
            db.query(select_command, (err, notification) => {
                if (err) return res.status(500).send(err);

                if(notification.length > 0) {
                    notification.forEach((notifi, index) => {
                        date = JSON.stringify(notifi.date).substr(1, 10);
                        parts = date.split("-");
                        notifi.date = parts[2] + "/" + parts[1] + "/" + parts[0];
                    });
                }
                
                res.status(200).render('user/notifications.ejs', {
                    title: site_name
                    , message: ''
                    , logged
                    , notification
                });
            });
        }
        else {
            res.status(401).redirect('/');
        }
    }
};