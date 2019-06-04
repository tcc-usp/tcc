const site_name = "TCC-USP";
var message = '';
var fs = require('fs');

module.exports = {
    //pegar informações de projetos criados pelo usuário para mostrá-las na sua página
    getUserProjects: (req, res) => {

        sess = req.session;
        var logged = (sess.user_id) ? 1 : 0;
        var status = req.params.status;
        var closed = (status == 'recebendo-inscrições' ? 'no' : 'yes');
        var message = sess.message;

        sess.message = "";

        if (!sess.user_id) {
            console.log("Nenhuma sessão iniciada. Ir para página inicial\n");
            res.status(401).redirect('/');
        }
        else{

            //if(status == 'abertos') status = 'em andamento';
            if(status == 'recebendo-inscrições') status = 'recebendo inscrições';
            if(status == 'em-analise') status = 'em analise';
            if(status == 'finalizados') status = 'finalizado';

            console.log("Página de projetos do usuário\n");

            //seleciona os projetos criados pelo usuário
            var select_command = "SELECT * FROM project WHERE user_id=? AND status=? ORDER BY final_date ASC;";
            var values = [sess.user_id, status];

            db.query(select_command, values, (err, projects) => {
                if (err) return res.status(500).send(err);
                
                //formata as datas para o formato padrão
                if(projects.length > 0) {
                    projects.forEach((project, index) => {
                        post_date = JSON.stringify(project.post_date).substr(1, 10);
                        parts = post_date.split("-");
                        project.post_date = parts[2] + "/" + parts[1] + "/" + parts[0];

                        final_date = JSON.stringify(project.final_date).substr(1, 10);
                        parts = final_date.split("-");
                        project.final_date = parts[2] + "/" + parts[1] + "/" + parts[0];
                    })
                }

                res.status(200).render('project/myProjects.ejs', {
                    title: "Projetos " + site_name
                    , projects
                    , closed
                    , logged
                    , status
                    , message
                });
            });
        }
    },
    //carregar pagina para criacao de novo projeto
    getNewProjectPage: (req, res) => {

        sess = req.session;

        if (!sess.user_id) {
            console.log("Nenhuma sessão iniciada. Ir para página inicial\n");
            res.status(401).redirect('/');
        }
        else{
            console.log("Página de criação de novo projeto\n");

            var select_command = "SELECT name FROM courses";
            db.query(select_command, (err, uspCourses) => {
                if (err) return res.status(500).send(err);

                res.status(200).render('project/newProject.ejs', {
                    title: "Projetos " + site_name
                    , logged: 1
                    , uspCourses
                });
            });
        }
    },
    //inserir informaçoes do novo projeto no banco de dados
    tryCreateProject: (req, res) => {
        console.log("Criando novo projeto..");

        sess = req.session;

        var name = req.body.name;
        var description = req.body.description;
        var course = req.body.course;
        var duration = req.body.duration;
        var final_date = req.body.final_date;
        var city = req.body.city;
        var state = req.body.state;
        var type = req.body.type;
        var skill = req.body.skill;
        var skills = '@';
        var courses = '@';
        
        var now = new Date;
        var day = now.getDate();
        var month =  now.getMonth() + 1;
        var year = now.getFullYear();
        var today = year + "-" + month + "-" + day;

        //cria as strings para skills e courses serem inseridos no banco de dados com todas as informações em um campo
        if (skill.length > 0) {
            skill.forEach((skill, index) => {
                if(!skill == '') {
                    skills = skills + skill + "@";
                }
            });
        }
        if (course.length > 0) {
            course.forEach((course, index) => {
                if(!course == '') {
                    courses = courses + course + "@";
                }
            });
        }

        var insert_command = "INSERT INTO project \
        (name, user_id, owner, description, courses, skills, duration, post_date, final_date, status, candidates, city, state, type)\
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?);";
        var insert_values = [name, sess.user_id, sess.name, description, courses, skills, duration, today, final_date, "recebendo inscrições", city, state, type];
        
        db.query(insert_command, insert_values, (err, result) => {
            if (err) return res.status(500).send(err);
            
            console.log('Informações do projeto salvas\n');

            sess.message = "O projeto " + name + " foi criado com sucesso e já está aberto a inscrições.";

            res.status(201).redirect('/usuario-projetos-recebendo-inscrições');
        });
    },
    //pegar dados de um projeto para carregar a pagina de edicao de projeto
    getEditProjectPage: (req, res) => {

        sess = req.session;
        var project_id = req.params.nid;
        var skills = [];
        var courses = [];

        if (!sess.user_id) {
            console.log("Nenhuma sessão iniciada. Ir para página inicial\n");
            res.status(401).redirect('/');
        }
        else{
            console.log("Página de edição de informações de projeto\n");
            
            //pega informações do projeto selecionado
            var select_command = "SELECT * FROM `project` WHERE project_id=?";
            db.query(select_command, [project_id], (err, projResult) => {
                if (err) return res.status(500).send(err);

                if (projResult[0].skills != '@') {
                    skills = projResult[0].skills.split("@");
                }
                if (projResult[0].courses != '@') {
                    courses = projResult[0].courses.split("@");
                }

                select_command = "SELECT name FROM courses";
                db.query(select_command, (err, uspCourses) => {
                    if (err) return res.status(500).send(err);

                    res.status(200).render('project/editProject.ejs', {
                        title: "Projetos " + site_name
                        , project: projResult[0]
                        , uspCourses
                        , skills
                        , courses
                        , logged: 1
                    });
                });
            });
        }
    },
    //alterar dados de um projeto no banco de dados
    tryEditProject: (req, res) => {

        var project_id = req.params.projid;
        var name = req.body.name;
        var description = req.body.description;
        var course = req.body.course;
        var duration = req.body.duration;
        var final_date = req.body.final_date;
        var city = req.body.city;
        var state = req.body.state;
        var skill = req.body.skill;

        var skills = '@';
        var courses = '@';

        console.log("Editando informações de projeto para:");
        console.log(req.body);

        if (skill.length > 0) {
            skill.forEach((skill, index) => {
                if(!skill == '') {
                    skills = skills + skill + "@";
                }
            });
        }
        if (course.length > 0) {
            course.forEach((course, index) => {
                if(!course == '') {
                    courses = courses + course + "@";
                }
            });
        }

        //atualiza as demais informações do projeto
        var update_command = "UPDATE project \
        SET name=?, description=?, courses=?, skills=?, duration=?, final_date=?, city=?, state=?\
        WHERE project_id=?";
        var update_values = [name, description, courses, skills, duration, final_date, city, state, project_id];
        
        db.query(update_command, update_values, (err, result) => {
            if (err) return res.status(500).send(err);
            
            console.log("Informações atualizadas\n");
            res.status(200).redirect('/usuario-projetos-recebendo-inscrições');
        });
    },
    getDelProjPage: (req, res) => {

        sess = req.session;
        var project_id = req.params.id;
        var logged = (sess.user_id) ? 1 : 0;
        var btnTxt = "Deletar projeto";

        if (!sess.user_id) {
            console.log("Nenhuma sessão iniciada. Ir para página inicial\n");
            res.status(401).redirect('/');
        }
        else{
            console.log("Página para deletar projeto\n");

            var select_command = "SELECT user_id, name FROM project WHERE project_id=?";
            db.query(select_command, [project_id], (err, selectResult) => {
                if (err) return res.status(500).send(err);

                //confere se é o criador do projeto na sessão
                if(selectResult[0].user_id == sess.user_id) {

                    message = "Ao clicar em 'Deletar projeto', o projeto \
                    '" + selectResult[0].name + "' será deletado junto com todas suas informações e candidaturas. \
                    Àqueles que se candidataram será enviada uma notificação de que a vaga foi cancelada pelo \
                    responsável."

                    res.status(200).render('project/endProject.ejs', {
                        title: "Projetos " + site_name
                        , logged: 1
                        , btnTxt
                        , message
                    });
                }
                else {
                    console.log("id do usuario difere")
                    res.status(401).redirect('/');
                }
            });
        }
    },
    delProject: (req, res) => {
        sess = req.session;
        var project_id = req.params.id;

        var now = new Date;
        var day = now.getDate();
        var month =  now.getMonth() + 1;
        var year = now.getFullYear();
        var today = day + "/" + month + "/" + year;

        var status, about;

        var update_command = "UPDATE project SET status='cancelado' WHERE project_id=?";

        var select_command = "SELECT user_id, name FROM project WHERE project_id=?";
        db.query(select_command, [project_id], (err, selectResult) => {
            if (err) return res.status(500).send(err);

            about = "A vaga do projeto <a href='/projeto-" + project_id + "'>" + selectResult[0].name + "</a> à qual \
            você se candidatou foi cancelada pelo responsável."
            
            //atualiza o status do projeto
            db.query(update_command, [project_id], (err, projResult) => {
                if (err) return res.status(500).send(err);

                console.log("Projeto deletado\n")

                select_command = "SELECT user_id FROM application WHERE project_id=?";
                db.query(select_command, [project_id], (err, applicResult) => {
                    if (err) return res.status(500).send(err);

                    if (applicResult.length > 0) {

                        var candidate_ids = ',';
                        applicResult.forEach((applicResult, index) => {
                            candidate_ids = candidate_ids + applicResult.user_id + ',';
                        });

                        var insert_command = "INSERT INTO notification (user_id, proj_id, about) VALUES (?, ?, ?)";
                        db.query(insert_command, [candidate_ids, project_id, about], (err, result) => {
                            if (err) {
                                return res.status(500).send(err);
                            }
                            else{
                                console.log("Notificação criada");
                            }
                        });
                    }
                });
                res.status(200).redirect('/usuario-projetos-recebendo-inscrições');
            });
        });
    },
    //página de coonfirmação para finalização do projeto
    getChangeProjStatus: (req, res) => {
        sess = req.session;
        var project_id = req.params.id;
        var step = req.params.step;
        var logged = (sess.user_id) ? 1 : 0;

        var path = req.route.path;
        var status;
        var btnTxt;

        if (!sess.user_id) {
            console.log("Nenhuma sessão iniciada. Ir para página inicial\n");
            res.status(401).redirect('/');
        }
        else{

            if(step == 'inscricoes') status = 'aberto';
            if(step == 'projeto') status = 'em analise';

            var select_command = "SELECT user_id, name FROM project WHERE project_id=?";
            db.query(select_command, [project_id], (err, selectResult) => {
                if (err) return res.status(500).send(err);

                //confere se é o criador do projeto na sessão
                if(selectResult[0].user_id == sess.user_id) {

                    if(status == 'aberto') {
                        btnTxt = "Finalizar Inscrições";
                        message = "Ao clicar em 'Finalizar Incrições', as inscrições para o projeto \
                        '" + selectResult[0].name + "' serão encerradas e não mais mostrado na página pública \
                        de projetos. Àqueles que se candidataram será enviada uma notificação de que o processo\
                         encontra-se em análise de candidaturas e que o responsável entrará em contato por \
                         email para aviso de rejeição ou aprovação do candidato."
                    }
                    if(status == 'em analise') {
                        btnTxt = "Finalizar Processo";
                        message = "Ao clicar em 'Finalizar Processo', o projeto '" + selectResult[0].name + "' será encerrado e não \
                            mais mostrado na página pública de projetos. Àqueles que se candidataram será enviada uma \
                            notificação de finalização do processo e de que o responsável entrará em contato por email \
                            para aviso de rejeição ou aprovação do candidato."
                    }

                    res.status(200).render('project/endProject.ejs', {
                        title: "Projetos " + site_name
                        , logged
                        , message
                        , status
                        , btnTxt
                    });
                }
                else {
                    console.log("id do usuario difere")
                    res.status(401).redirect('/');
                }
            });
        }
    },
    //finalizar o projeto, atualizando o status no banco de dados e criando notificação para os respectivos candidatos
    changeProjStatus: (req, res) => {
        sess = req.session;
        var project_id = req.params.id;
        var step = req.params.step;

        var now = new Date;
        var day = now.getDate();
        var month =  now.getMonth() + 1;
        var year = now.getFullYear();
        var today = day + "/" + month + "/" + year;

        var path = req.route.path;
        var status, update_command, about;

        if(step == 'inscricoes') {
            status = 'recebendo inscrições';
            update_command = "UPDATE project SET status='em analise' WHERE project_id=?";
        }
        if(step == 'projeto') {
            status = 'em analise';
            update_command = "UPDATE project SET status='finalizado' WHERE project_id=?";
        }
        select_command = "SELECT user_id, name FROM project WHERE project_id=?";
        db.query(select_command, [project_id], (err, selectResult) => {
            if (err) return res.status(500).send(err);

            //atualiza o status do projeto
            db.query(update_command, [project_id], (err, projResult) => {
                if (err) return res.status(500).send(err);

                console.log("Projeto finalizado\n")

                select_command = "SELECT user_id FROM application WHERE project_id=?";
                db.query(select_command, [project_id], (err, applicResult) => {
                    if (err) return res.status(500).send(err);

                    if (applicResult.length > 0) {
                        if(status == 'recebendo inscrições') {
                            about = "As inscrições para a vaga do projeto \
                            <a href='/projeto-" + project_id + "'>" + selectResult[0].name + "</a> foram encerradas.\
                            O responsável pela vaga está analisando as candidaturas e entrará em contato por e-mail."
                        }
                        if(status == 'em analise') {
                            about = "O processo de seleção para a vaga do projeto \
                            <a href='/projeto-" + project_id + "'>" + selectResult[0].name + "</a> foi finalizado.\
                            O responsável pela vaga entrará em contato por email para notificá-lo do resultado."
                        }

                        let candidate_ids = ',';
                        applicResult.forEach((applicResult, index) => {
                            candidate_ids = candidate_ids + applicResult.user_id + ',';
                        });

                        let insert_command = "INSERT INTO notification (user_id, proj_id, about) VALUES (?, ?, ?)";
                        db.query(insert_command, [candidate_ids, project_id, about], (err, result) => {
                            if (err) {
                                return res.status(500).send(err);
                            }
                            else{
                                console.log("Notificação criada");
                            }
                        });
                    }
                });
                res.status(200).redirect('/usuario-projetos-recebendo-inscrições');
            });
        });
    },
    //inscrever o usuario em um projeto
    tryApplyProject: (req, res) => {
        sess = req.session;
        var project_id = req.params.pid;

        console.log("Inscrevendo o candidato no projeto");

        //verifica se é um candidato ou apenas visitante da página.
        //se for um usuário a inscrição é realizada
        if(sess.user_id) {
            //insere no banco de dados os valores correspondente à candidatura
            var insert_command = "INSERT INTO application (user_id, project_id) VALUES (?, ?);";
            db.query(insert_command, [sess.user_id, project_id], (err, result) => {
                if (err) return res.status(500).send(err);

                //pegar informações do projeto para criar a notificação de candidatura para o dono do projeto
                var select_command = "SELECT name, user_id FROM project WHERE project_id=?;";
                db.query(select_command, [project_id], (err, projResult) => {
                    if (err) return res.status(500).send(err);

                    //contar número de candidaturas para informar na notificação
                    //select_command = "SELECT COUNT(*) as cnt FROM application WHERE project_id=?";
                    select_command = "SELECT candidates FROM project WHERE project_id=?";
                    db.query(select_command, [project_id], (err, countResult) => {
                        if (err) return res.status(500).send(err);

                        var new_cand = countResult[0].candidates + 1;
                        
                        var update_command = "UPDATE project SET candidates=" + new_cand + " WHERE project_id=?";
                        db.query(update_command, [project_id], (err, countResult) => {
                            if (err) return res.status(500).send(err);

                            //verifica se a notificação já existe e, se existir, apenas atualiza o conteúdo
                            let user_id = "," + projResult[0].user_id + ",";
                            select_command = "SELECT date FROM notification WHERE user_id=? AND proj_id=?;";
                            db.query(select_command, [user_id, project_id], (err, notifRefult) => {
                                if (err) return res.status(500).send(err);

                                let about = "Um aluno candidatou-se ao projeto \
                                <a href='/meu-projeto/" + project_id + "'>" + projResult[0].name + "</a>.\
                                Total de candidaturas: " + new_cand + "."

                                //se a notificação do respectivo projeto já existe, atualiza-se o seu conteúdo
                                if(notifRefult.length > 0){
                                    command = "UPDATE notification SET about=? WHERE user_id=? AND proj_id=?;";

                                }
                                //caso não existe, cria-se uma nova
                                else{
                                    command = "INSERT INTO notification (about, user_id, proj_id) VALUES (?, ?, ?)";
                                }

                                db.query(command, [about, user_id, project_id], (err, result) => {
                                    if (err) {
                                        return res.status(500).send(err);
                                    }
                                    else{
                                        console.log("Notificação criada/atualizada");
                                        console.log("Application done\n");
                                        sess.message = "Candidatura para o " + projResult[0].name + " realizada.";
                                        res.status(201).redirect('/candidaturas');
                                    }
                                });
                            });
                        });
                    });
                });
            });
        }
        else{
            sess.redirect = '/projeto-' + project_id;
            res.status(401).redirect('/');
        }
    },
    //mostrar informações de um projeto
    getProjectInfo: (req, res) => {

        sess = req.session;
        var project_id = req.params.id;
        var logged = (sess.user_id) ? 1 : 0;
        var skill = [];
        var course = [];

        console.log("Página com informações de um projeto\n");
        
        var command_value = [project_id];

        //pegar informações gerais do projeto
        var select_command = "SELECT * FROM project WHERE project_id=?";
        db.query(select_command, command_value, (err, projResult) => {
            if (err) return res.status(500).send(err);
            
            if (projResult[0].skills != '@') {
                skill = projResult[0].skills.split("@");
            }
            if (projResult[0].courses != '@') {
                course = projResult[0].courses.split("@");
            }

            post_date = JSON.stringify(projResult[0].post_date).substr(1, 10);
            parts = post_date.split("-");
            projResult[0].post_date = parts[2] + "/" + parts[1] + "/" + parts[0];

            final_date = JSON.stringify(projResult[0].final_date).substr(1, 10);
            parts = final_date.split("-");
            projResult[0].final_date = parts[2] + "/" + parts[1] + "/" + parts[0];

            //pegar informações do criador do projeto
            select_command = "SELECT name, type, url FROM user WHERE user_id=?";
            command_value = [projResult[0].user_id];

            db.query(select_command, command_value, (err, ownerInfo) => {
                if (err) return res.status(500).send(err);

                if(logged == 1) {

                    select_command = "SELECT date FROM application WHERE user_id=? AND project_id=?";
                    command_value = [sess.user_id, project_id];

                    db.query(select_command, command_value, (err, applicResult) => {
                        if (err) return res.status(500).send(err);

                        let applied = (applicResult != '') ? 'yes' : 'no';

                        res.status(200).render('project/projectInfo.ejs', {
                            title: "Projetos " + site_name
                            , project: projResult[0]
                            , owner: ownerInfo[0]
                            , skill
                            , course
                            , logged
                            , applied
                        });
                    });
                }
                if(logged == 0) {
                    let applied = 'no'

                    res.status(200).render('project/projectInfo.ejs', {
                        title: "Projetos " + site_name
                        , project: projResult[0]
                        , owner: ownerInfo[0]
                        , skill
                        , course
                        , logged
                        , applied
                    });
                }
            });
        });
    },
    //mostrar todas as informações do projeto e seus candidatos
    getFullProject: (req, res) => {
        sess = req.session;
        var project_id = req.params.id;
        var applic = [];
        var candidate = [];
        var skill = [];
        var course = [];

        if (!sess.user_id) {
            console.log("Nenhuma sessão iniciada. Ir para página inicial\n");
            res.status(401).redirect('/');
        }
        else{
            console.log("Página para ver andamento do projeto\n");

            //pegar informaçoes do projeto
            var select_command = "SELECT * FROM `project` WHERE `project_id`=?";
            db.query(select_command, [project_id], (err, projResult) => {
                if (err) return res.status(500).send(err);
                
                if (projResult[0].skills != '@') {
                    skill = projResult[0].skills.split("@");
                }

                if (projResult[0].courses != '@') {
                    course = projResult[0].courses.split("@");
                }

                if(projResult.length > 0) {
                    projResult.forEach((project, index) => {
                        date = JSON.stringify(project.post_date).substr(1, 10);
                        parts = date.split("-");
                        project.post_date = parts[2] + "/" + parts[1] + "/" + parts[0];
                    })
                    projResult.forEach((project, index) => {
                        date = JSON.stringify(project.final_date).substr(1, 10);
                        parts = date.split("-");
                        project.final_date = parts[2] + "/" + parts[1] + "/" + parts[0];
                    })
                }
                
                //pegar usuarios que se inscreveram para o projeto
                select_command = "SELECT `user_id` FROM `application` WHERE project_id=?;";
                db.query(select_command, [project_id], (err, applicResult) => {
                    if (err) return res.status(500).send(err);

                    if(applicResult.length > 0) {

                        for(var i = 0; i < applicResult.length; i++) {
                            applic[i] = applicResult[i].user_id;
                        }

                        //pegar informações dos candidatos
                        select_command = "SELECT * FROM user INNER JOIN candidate \
                        ON user.user_id=candidate.user_id \
                        WHERE user.user_id IN (" + applic.join() + ");"

                        db.query(select_command, (err, userResult) => {
                            if (err) return res.status(500).send(err);

                            res.status(200).render('project/fullProject.ejs', {
                                title: "Projeto " + site_name
                                , project: projResult[0]
                                , candidate: userResult
                                , skill
                                , course
                                , sess
                                , logged: 1
                            });
                        });
                    }
                    else{
                        res.status(200).render('project/fullProject.ejs', {
                            title: "Projeto " + site_name
                            , project: projResult[0]
                            , candidate
                            , skill
                            , course
                            , sess
                            , logged: 1
                        });
                    }
                });
            });
        }
    },
    //mostrar perfil do candidato
    getProfile: (req, res) => {
        
        console.log("Carregando perfil do candidato\n");

        var user_url = req.params.userUrl;
        var imgLocal = path + "/public/user_img/";

        //pegar informações da tabela de usuário correspondente ao argumento da url
        var select_command = "SELECT * FROM user WHERE url=?";
        db.query(select_command, [user_url], (err, userResult) => {
            if (err) return res.status(500).send(err);

            var file =  imgLocal + userResult[0].user_id + ".jpg"

            //verifica se possui imagem de perfil
            var profileImg = (fs.existsSync(file)) ? 'True' : 'False';

            //pegar informações da tabela de candidato correspondente ao id de usuario
            select_command = "SELECT * FROM candidate WHERE user_id=?";
            db.query(select_command, [userResult[0].user_id], (err, candidResult) => {
                if (err) return res.status(500).send(err);
                
                if (candidResult[0].skills != '@' && candidResult[0].skills != '') {
                    skillResult = candidResult[0].skills.split("@");
                }
                else{
                    skillResult = [];
                }
                res.status(200).render('user/profile.ejs', {
                    title: site_name
                    , userInfo: userResult[0]
                    , candInfo: candidResult[0]
                    , skillInfo: skillResult
                    , profileImg
                    , logged: 1
                });
            });
        });
    }
};