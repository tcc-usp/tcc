const site_name = "TCC-USP";
var message = '';
var fs = require('fs');

module.exports = {
    //pegar informações do usuário para mostrá-las na página inicial do usuário
    getUserInfo: (req, res) => {
        sess = req.session;//contem a sessao do usuario

        var imgLocal = path + "/public/user_img/";
        var file =  imgLocal + sess.user_id + ".jpg"

        //verifica se possui imagem de perfil
        var profileImg = (fs.existsSync(file)) ? 'True' : 'False';

        //caso nenhuma sessao esteja iniciada o usuario é redirecionado para a pagina inicial de login
        if (!sess.user_id) {
            console.log("Nenhuma sessão iniciada. Ir para página inicial\n");
            res.status(401).redirect('/');
        }
        //caso haja uma sessao iniciada, serao pegos os dados do usuario no banco de dados 
        else {
            console.log("Carregando informações do usuário..\n");

            var selectInfoCommand = "SELECT * FROM `user` INNER JOIN `" + sess.type + "` \
            ON user.user_id=" + sess.type + ".user_id \
            WHERE user.user_id = " + sess.user_id;

            db.query(selectInfoCommand, (err, result) => {

                //armazenar os dados na sessao para futura necessidade de acesso a informacao
                sess.name = result[0].name;
                sess.email = result[0].email;
                sess.linkedin = result[0].linkedin;
                sess.about = result[0].about;

                //carrega a pagina do perfil de acordo com o tipo de usuario(candidato, professor ou empresa)
                switch(sess.type) {
                    case 'candidate':
                        sess.course = result[0].course;
                        sess.usp_number = result[0].usp_number;
                        sess.telephone = result[0].telephone;

                        if (result[0].skills != '@' && result[0].skills != '') {
                            sess.skills = result[0].skills.split("@");
                        }
                        else{
                            sess.skills = [];
                        }

                        res.status(200).render('user/userPage.ejs', {
                            title: site_name
                            , sess
                            , logged: 1
                            , profileImg
                        });

                        break;

                    case 'company':
                        sess.site = result[0].site;
                        sess.cnpj = result[0].cnpj;

                        res.status(200).render('user/userPage.ejs', {
                            title: site_name
                            , sess
                            , logged: 1
                            , profileImg
                        });
                        break;

                    case 'professor':
                        sess.institute = result[0].institute;

                        res.status(200).render('user/userPage.ejs', {
                            title: site_name
                            , sess
                            , logged: 1
                            , profileImg
                        });
                        break;

                    default:
                }
            });
        }
    },
    //carrega a página de edição de informações do usuário
    getEditPage: (req, res) => {
        sess = req.session;

        if (!sess.user_id) {
            console.log("Nenhuma sessão iniciada. Ir para página inicial\n");
            res.status(401).redirect('/');
        }
        else {
            console.log("Página de edição de informações do usuário\n");

            var select_command = "SELECT name FROM courses";
            db.query(select_command, (err, uspCourses) => {
                res.status(200).render('user/editUser.ejs', {
                    title: site_name
                    , logged: 1
                    , sess
                    , uspCourses
                })
            });
        }
    },
    //executa as alterações dos dados do usuario
    tryEditInfo: (req, res) => {
        console.log("Editando informações para:");
        console.log(req.body);

        sess = req.session;
        
        var linkedin = req.body.linkedin;
        var about = req.body.about;
        
        switch(sess.type) {
            case 'candidate':
                var telephone = req.body.telephone;
                var course = req.body.course;
                var skill = req.body.skill;

                var skills = '@';

                if (skill.length > 0) {
                    skill.forEach((skill, index) => {
                        if(!skill == '') {
                            skills = skills + skill + "@";
                        }
                    });
                }

                //variáveis para comando e dados da atualização do banco de dados
                var update_command = "UPDATE `user`, `candidate` \
                SET user.about=?, user.linkedin=?, candidate.telephone=?, candidate.course=?, candidate.skills=? \
                WHERE user.user_id=?\
                AND candidate.user_id=?;";
                var update_info = [about, linkedin, telephone, course, skills, sess.user_id, sess.user_id];

                break;

            case 'company':
                var name = req.body.name;
                var site = req.body.site;

                //variáveis para comando e dados da atualização do banco de dados
                var update_command = "UPDATE `user`, `company` \
                SET user.name=?, user.linkedin=?, user.about=?, company.site=?\
                WHERE user.user_id=?\
                AND company.user_id=?;";
                var update_info = [name, linkedin, about, site, sess.user_id, sess.user_id];

                break;

            case 'professor':
                var institute = req.body.institute;

                //variáveis para comando e dados da atualização do banco de dados
                var update_command = "UPDATE `user`, `professor` \
                SET user.linkedin=?, user.about=?, professor.institute=?\
                WHERE user.user_id=? AND professor.user_id=?;";
                var update_info = [linkedin, about, institute, sess.user_id, sess.user_id];

                break;
        }

        //atualizar informações no banco de dados
        db.query(update_command, update_info, (err, result) => {
            if (err) {
                return res.status(500).send(err);
            }
            else{
                console.log('Informações atualizadas\n');
                res.status(200).redirect('/perfil');
            }
        });
    },
    //altera a foto de perfil do usuário
    alterPhoto: (req, res) => {

        sess = req.session;
        var imgLocal = path + "\\public\\user_img\\";

        console.log("Alterar foto");

        //verifica se foi inserida alguma foto
        //caso não tenha sido, apenas atualiza a página
        //**essa verificação está sendo feita agora na no cliente, desbilitando o botão quando não houver nada
        if (Object.keys(req.files).length == 0) {
            console.log('Nenhuma foto foi inserida\n');
            res.status(200).redirect('/perfil');
        }
        //havendo uma foto inserida, é feita a atualização da foto
        else {
            var location =  imgLocal + sess.user_id + ".jpg";

            //caso já exista uma foto do usuário, ela será deletada
            if (fs.existsSync(location)) {
                fs.unlinkSync(location);
            }
            // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
            var sampleFile = req.files.sampleFile;

            //redimensiona e corta a imagem inserida para as dimensões em resize e salva em location
            sharp(sampleFile.data)
                .resize(80, 80)
                .toFile(location, function(err) {
                    if (err){
                        return res.status(500).send(err);
                    }
                    else {
                        console.log('Imagem atualizada\n');
                        res.status(200).redirect('/perfil');
                    }
                });
        }
    },
    //pegar as candidaturas do usuário
    getApplications: (req, res) => {

        sess = req.session;
        var projects = [];//armazena os ids dos projetos em que foram feitas candidaturas
        var skills = [];
        let message = (sess.message) ? sess.message : '';
        sess.message = '';

        if (!sess.user_id) {
            console.log("Nenhuma sessão iniciada. Ir para página inicial\n");
            res.status(401).redirect('/');
        }
        else{

            console.log("Página de candidaturas do usuário\n");

            //selecionar todos os ids dos projetos com candidaturas feitas pelo usuario
            var select_command = "SELECT project_id, date FROM application WHERE user_id=? ORDER BY date DESC;";
            db.query(select_command, [sess.user_id], (err, result) => {
                if (err) return res.status(500).send(err);

                if(result.length > 0) {
                    for(var i = 0; i < result.length; i++) {
                        projects[i] = result[i].project_id;
                    }

                    //seleciona info dos projetos com os ids coletados
                    select_command = "SELECT * FROM project \
                    WHERE project_id IN (" + projects.join() + ") \
                    ORDER BY FIELD(status, 'recebendo inscrições', 'em analise', 'finalizado', 'cancelado');"
                    //ORDER BY FIELD(project_id, " + projects.join() + ");";
                    db.query(select_command, (err, projResult) => {

                        if (err) return res.status(500).send(err);
                        
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

                        if (projResult[0].skills != '@') {
                            skills = projResult[0].skills.split("@");
                        }

                        res.status(200).render('user/candidate/appliedProjects.ejs', {
                            title: site_name
                            , project: projResult
                            , logged: 1
                            , skills
                            , message
                        });
                    });
                }
                else {
                    res.status(200).render('user/candidate/appliedProjects.ejs', {
                        title: site_name
                        , project: projects
                        , logged: 1
                        , skills
                        , message
                    });
                }
            });
        }
    },
    //carregar a página para alterar a senha
    getChangePassPage: (req, res) => {
        if (!sess.user_id) {
            console.log("Nenhuma sessão iniciada. Ir para página inicial\n");
            res.status(401).redirect('/');
        }
        else{
            res.status(200).render('user/changePass.ejs', {
                title: site_name
                , message
                , logged: 1
            });
        }
    },
    //trocar a senha
    tryChangePass: (req, res) => {

        sess = req.session;
        var pass = req.body.actualPass;
        var newPass = req.body.pwd;

        //verifica se a senha inserida confere com a atual
        bcrypt.compare(pass, sess.pass, function(err, ans) {
            if(ans) {
                console.log("Senha atual confere. Atualizando senha..");
                
                //hash a nova senha
                bcrypt.hash(newPass, 10, function(err, hash) {
                    if (err) {
                        return res.status(500).send(err);
                    }

                    //salva a nova senha no bd
                    var update_command = "UPDATE `user` SET password=? WHERE user_id=?";
                    db.query(update_command, [hash, sess.user_id], (err, result) => {
                        if (err) {
                            return res.status(500).send(err);
                        }
                        else{
                            res.status(200).render('message.ejs', {
                                title: site_name
                                , message: "Senha alterada"
                                , logged: 1
                            });
                        }
                    });
                });
            }
            //Se a senha não conferir com a atual, manda mensagem se erro
            else {
                console.log("Senha não confere.");
                message = 'Senha não confere';
                res.status(401).render('user/changePass.ejs', {
                    title: site_name
                    , message
                    , logged: 1
                });
            } 
        });
    },
    //terminar a sessao do usuario e redirecionar para a pagina inicial do site
    logout: (req,res) => {
        req.session.destroy(function(err) {
            if(err) {
                console.log(err);
            } else {
                console.log("Deslogando usuario..\n");
                res.status(200).redirect('/');
            }
        });
    }
};