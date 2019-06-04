const site_name = "TCC-USP";
const {sendMail} = require('./functions');
const fs = require('fs');

module.exports = {
    //carrega a pagina de registro na qual sera selecionado qual o tipo de usuario(candidato, empresa, docente)
    getUserType: (req, res) => {
        console.log("Página de seleção do tipo de registro");
        
        res.status(200).render('regist/registerType.ejs', {
            title: site_name
            , logged: 0
        });
    },
    //carrega a página de registro
    getRegisterPage: (req, res) => {
        var type = req.params.type;

        console.log("Página de registro de usuário");

        var select_command = "SELECT name FROM courses";
        db.query(select_command, (err, uspCourses) => {
            res.status(200).render('regist/register.ejs', {
                title: site_name
                , type
                , logged: 0
                , uspCourses
            });
        });
    },
    //realiza o registro do usuario no bd
    tryRegister: (req, res) => {
        //variavel que indica se é candidato, docente ou empresa
        var type = req.params.type;

        //informações de registro do usuário
        var name = req.body.name;
        var email = req.body.email;
        var linkedin = req.body.linkedin;
        var pwd = req.body.pwd;
        var url = name.replace(/ /g,"-");

        //local de armazenamento das imagens de perfil
        var imgLocal = path + "\\public\\user_img\\";

        //variaveis com tabelas específicas para cada tipo de usuário(candidato, empresa ou docente)
        var specific_command = "";
        var specific_values = [];
        switch(type) {
            case 'candidato':
                type = 'candidate'
                var telephone = req.body.telephone;
                var uspNumber = req.body.uspNumber;
                var course = req.body.course;
                break;

            case 'empresa':
                type = 'company'
                var site = req.body.site;
                var cnpj = req.body.cnpj;
                break;

            case 'docente':
                type = 'professor'
                var institute = req.body.institute;
                break;

            default:
        }

        //primeiro verifica se o email já está em uso
        var select_command = "SELECT user_id from `user` WHERE `email`= ?";
        db.query(select_command, [email], (err, emailResult) => {
            
            if (err) return res.status(500).send(err);
            
            console.log("Email de registro verificado")

            //se o comando retornar algo significa que o email já está em uso e avisa o usuário
            if(emailResult.length > 0) {
                console.log("E-mail em uso, redirecionando..");

                res.status(401).render('message.ejs', {
                    title: site_name
                    , logged: 0
                    , message: 'E-mail em uso'
                });
            }

            else {
                //faz um hash na senha, gerando o parametro hash
                bcrypt.hash(pwd, 10, function(err, hash) {
                    
                    if (err) return res.status(500).send(err);
                    
                    //inserir valores de cadastro no bd
                    var insert_command = "INSERT INTO user \
                    (name, email, url, linkedin, about, type, password, status) \
                    VALUES (?, ?, '', ?, '', ?, ?, 'em espera');\
                    SELECT LAST_INSERT_ID();";
                    var values = [name, email, linkedin, type, hash];

                    db.query(insert_command, values, (err, userResult) => {
                        
                        if (err) return res.status(500).send(err);

                        console.log("Registro realizado no usuário de id " + userResult[0].insertId);

                        if(type != 'candidate') {
                            //salvar imagem numa pasta
                            if(req.files) {
                            if (Object.keys(req.files).length == 0) {
                                console.log('No files were uploaded.');
                            }

                            if (Object.keys(req.files).length != 0) {
                                // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
                                let sampleFile = req.files.sampleFile;

                                var imgLocal = path + "\\public\\user_img\\";
                                var location =  imgLocal + userResult[0].insertId + ".jpg";

                                //redimensiona e corta a imagem inserida para as dimensões em resize e salva em location
                                sharp(sampleFile.data)
                                    .resize(80, 80)
                                    .toFile(location, function(err) {
                                        if (err) return res.status(500).send(err);

                                        console.log('Imagem salva');
                                    });
                            }
                            }
                        }

                        //verificar se a url gerada já existe
                        select_command = "SELECT user_id from user WHERE url=?"
                        db.query(select_command, [url], (err, urlResult) => {
                            
                            if (err) return res.status(500).send(err);

                            console.log("url verificado");

                            //se o comando retornar algo significa que a url já existe
                            if(urlResult.length > 0) {
                                console.log("Url existente, criando nova..");

                                url = url + '-' + userResult[0].insertId;
                            }

                            //inserir valores de cadastro no bd
                            var update_command = "UPDATE `user` SET url=? WHERE user_id=?;"
                            db.query(update_command, [url, userResult[0].insertId], (err, updateUrl) => {
                                
                                if (err) return res.status(500).send(err);

                                //gera os comandos para inserir os dados específicos do tipo de usuário no banco de dados
                                switch(type) {
                                    case 'candidate':
                                        specific_command = "INSERT INTO candidate \
                                        (user_id, course, skills, usp_number, telephone) \
                                        VALUES (?, ?, '', ?, ?);";
                                        specific_values = [userResult[0].insertId, course, uspNumber, telephone];
                                        break;

                                    case 'company':
                                        specific_command = "INSERT INTO company \
                                        (user_id, site, cnpj) \
                                        VALUES (?, ?, ?);";
                                        specific_values = [userResult[0].insertId, site, cnpj];
                                        break;

                                    case 'professor':
                                        specific_command = "INSERT INTO professor \
                                        (user_id, institute) \
                                        VALUES (?, ?);";
                                        specific_values = [userResult[0].insertId, institute];
                                        break;

                                    default:
                                }

                                //registrar os dados restantes na tabela específica para o tipo de usuário registrado
                                db.query(specific_command, specific_values, (err, result) => {
                                    
                                    if (err) return res.status(500).send(err);

                                    console.log("Registro finalizado");
                                    message = "Dados recebidos. A solicitação de registro será avaliada";
                                    
                                    //sendMail(email, 'register');
                                    
                                    res.status(201).render('message.ejs', {
                                        title: site_name
                                        , logged: 0
                                        , message
                                    });
                                });
                            });
                        });

                    });

                });
            }
            
        });
    }
};