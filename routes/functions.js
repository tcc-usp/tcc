module.exports = {
    //enviar email para 'dest'
    sendMail: function(dest, type, comp) {
        var subject, text = ' ';

        //set subject and text of the email
        if(type == 'register') {
            var subject = 'Registro TCC-USP';
            var text = 'Confirmar endereço de e-mail';
        }
        console.log(comp);
        if(type == 'forgotPass') {
            var subject = 'TCC-USP Senha esquecida';
            var text = 'Segue o link para uma nova senha no site: ' + comp[1] + '/nova-senha/' + comp[0];
        }

        //set email
        var mailOptions = {
            from: 'tcc.uspsc@gmail.com',  //***
            to: dest,
            subject,
            text
        };

        //send email
        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response + '\n');
            }
        });
    },
    normalizePort: function(val) {
        const port = parseInt(val, 10);

        if (isNaN(port)) {
            return val;
        }
        if (port >= 0) {
            return port;
        }
        return false;
    }
};