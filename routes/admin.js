const site_name = "TCC-USP"; //string do nome padrão que é mostrado na aba do navegador
var message = " ";

module.exports = {
    //carrega a página de login de adm
    getAdminLoginPage: (req, res) => {
        console.log("Página de login do adm.");

        //direcionar para a pagina inicial do usuario caso ele ja tenha uma sessao iniciada
        if(req.session.adm == 1) {
            console.log("Sessao existente. Redirecionando para página inicial do adm.");

            res.redirect('/mars/adm');
        }
        //se nao houver sessao iniciada, é carregada a pagina inicial para login do adm
        else {
            console.log("Esperando login...");

            res.render('adm/marsPage.ejs', {
                title: site_name
                , message
            });
        }
    },
    //verifica se o login é válido. Se sim, direciona para a página do adm.
    tryAdmLogin: (req, res) => {
        //dados inseridos pelo usuario para login
        let name = req.body.name;
        let pwd = req.body.pwd;

        //verifica se o email e a senha inseridos são equivalentes às do banco de dados
        db.query("SELECT adm FROM `admin` WHERE name=? AND password=?", [name, pwd], (err, result) => {
            if (err) {
                return res.status(500).send(err);
            }
            //caso as informações estejam corretas, será carregada a página inicial do adm
            //e atualizará 'sess' que indica se há uma sessão iniciada
            if(result.length > 0) {
                req.session.adm = 1;

                console.log("Dados de login de adm válidos.");

                res.redirect('/mars/adm');
            }
            //Dados de login inválidos: mensagem de erro enviada para a página
            else {
                console.log("Login inválido.");

                res.render('adm/marsPage.ejs', {
                    title: site_name
                    , message: "Login inválido"
                });
            }
        });
    },
    //Carrega página do adm.
    getAdminPage: (req, res) => {
        let solicitation = [];
        let id = [];

        if(req.session.adm == 1) {
            console.log("Página inicial do adm");

            //busca no banco de dados novas solicitações de registro de usuário
            db.query("SELECT user_id FROM `user` WHERE status='em espera';", (err, idResult) => {
                if (err)  return res.status(500).send(err);

                if(idResult.length > 0) {

                    for(var i = 0; i < idResult.length; i++) {
                        id[i] = idResult[i].user_id;
                    }

                    //pegar informações dos candidatos
                    var select_command = "SELECT * FROM user INNER JOIN candidate \
                    ON user.user_id=candidate.user_id \
                    WHERE user.user_id IN (" + id.join() + ");"

                    db.query(select_command, (err, candidate) => {
                        if (err)  return res.status(500).send(err);
                        
                        var select_command = "SELECT * FROM user INNER JOIN company \
                        ON user.user_id=company.user_id \
                        WHERE user.user_id IN (" + id.join() + ");"

                        db.query(select_command, (err, company) => {
                            if (err)  return res.status(500).send(err);

                            var select_command = "SELECT * FROM user INNER JOIN professor \
                            ON user.user_id=professor.user_id \
                            WHERE user.user_id IN (" + id.join() + ");"

                            db.query(select_command, (err, professor) => {
                                if (err)  return res.status(500).send(err);
                                
                                res.render('adm/admPage.ejs', {
                                    title: site_name
                                    , candidate
                                    , company
                                    , professor
                                    //, solicitation: userResult
                                });
                            });
                        });
                    });
                }
                else {
                    res.render('adm/admPage.ejs', {
                        title: site_name
                        , candidate: []
                        , company: []
                        , professor: []
                        //, solicitation: userResult
                    });
                }
            });
        }
        else {
            console.log("Sessao inexistente. Necessário fazer login.");

            res.redirect('/mars');
        }
    },
    getRefused: (req, res) => {
        let id = [];

        if(req.session.adm == 1) {
            console.log("Página recusados do adm");

            //busca no banco de dados novas solicitações de registro de usuário
            db.query("SELECT user_id FROM `user` WHERE status='recusado';", (err, idResult) => {
                if (err)  return res.status(500).send(err);

                if(idResult.length > 0) {

                    for(var i = 0; i < idResult.length; i++) {
                        id[i] = idResult[i].user_id;
                    }

                    //pegar informações dos candidatos
                    var select_command = "SELECT * FROM user INNER JOIN candidate \
                    ON user.user_id=candidate.user_id \
                    WHERE user.user_id IN (" + id.join() + ");"

                    db.query(select_command, (err, candidate) => {
                        if (err)  return res.status(500).send(err);
                        
                        var select_command = "SELECT * FROM user INNER JOIN company \
                        ON user.user_id=company.user_id \
                        WHERE user.user_id IN (" + id.join() + ");"

                        db.query(select_command, (err, company) => {
                            if (err)  return res.status(500).send(err);

                            var select_command = "SELECT * FROM user INNER JOIN professor \
                            ON user.user_id=professor.user_id \
                            WHERE user.user_id IN (" + id.join() + ");"

                            db.query(select_command, (err, professor) => {
                                if (err)  return res.status(500).send(err);
                                
                                res.render('adm/refuseds.ejs', {
                                    title: site_name
                                    , candidate
                                    , company
                                    , professor
                                    //, solicitation: userResult
                                });
                            });
                        });
                    });
                }
                else {
                    res.render('adm/refuseds.ejs', {
                        title: site_name
                        , candidate: []
                        , company: []
                        , professor: []
                    });
                }
            });
        }
        else {
            console.log("Sessao inexistente. Necessário fazer login.");

            res.redirect('/mars');
        }
    },
    //Aceita o registro do usuário.
    tryAddUser: (req, res) => {
        let user_id = req.params.sid;

        db.query("UPDATE `user` \
        SET status='aceito' \
        WHERE user_id=?;", [user_id], (err, result) => {
            if (err) {
                return res.status(500).send(err);
            }
            else {
                console.log("Registro realizado");
                res.redirect('/mars/adm');
            }
        });
    },
    //Recusa o registro do usuário.
    tryDeclineUser: (req, res) => {
        let user_id = req.params.sid;

        db.query("UPDATE `user` \
        SET status='recusado' \
        WHERE user_id=?;", [user_id], (err, result) => {
            if (err) {
                return res.status(500).send(err);
            }
            else {
                console.log("Registro recusado");
                res.redirect('/mars/adm');
            }
        });
    },
    //Logout do adm
    admLogout: (req, res) => {
        req.session.adm = 0;

        console.log("Saindo da conta adm");

        res.redirect('/mars');
    }
};