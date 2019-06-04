# TCC

https://tcc-henrique.herokuapp.com/

Projeto de uma plataforma para publicações de vagas para desenvolvimento de projetos acadêmicos ou empresariais.
Universitários poderão se candidatar aos projetos a fim de realizá-los como TCC ou para outros fins acadêmicos.
Voltado para alunos da USP.

Linguagem servidor: NodeJS.

Banco de dados: MySQL.

Hospedagem: Heroku.

Instructions to deploy it
-install node.js

-npm install
prompt -> project directory -> npm init(can leave the standard values, entry point is app.js)

-install modules
npm install bcrypt
npm install body-parser
npm install ejs
npm install express
npm install express-fileupload
npm install express-session
npm install mysql
npm install nodemailer
npm install path
npm install sharp

-configure database connection at app.js
const db = mysql.createConnection ({
	host: '',
	user: '',
	password: '',
	database: '',
	multipleStatements: true
});

-configure email
var transporter = nodemailer.createTransport({
	service: 'gmail',
	secure: false,
	auth: {
		user: "<email>",
		pass: "<password>"
	}
});

-create tables at your MySQL database
CREATE TABLE IF NOT EXISTS `admin` ( 
`adm` INT NOT NULL AUTO_INCREMENT , 
`name` VARCHAR(30) NOT NULL , 
`password` VARCHAR(30) NOT NULL , 
PRIMARY KEY (`adm`)) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `application` ( 
`user_id` INT NOT NULL , 
`project_id` INT NOT NULL , 
`date` TIMESTAMP NOT NULL ) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `candidate` ( 
`user_id` INT NOT NULL , 
`course` VARCHAR(50) NOT NULL , 
`skills` VARCHAR(200) NOT NULL , 
`usp_number` INT NOT NULL , 
`telephone` VARCHAR(20) NOT NULL , 
UNIQUE (`user_id`)) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `company` ( 
`user_id` INT NOT NULL , 
`site` VARCHAR(50) NOT NULL , 
`cnpj` INT NOT NULL , 
UNIQUE (`user_id`)) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `courses` ( 
`name` VARCHAR(30) NOT NULL ) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `forgot_pass` ( 
`user_id` INT NOT NULL , 
`url` VARCHAR(10) NOT NULL ) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `notification` ( 
`notif_id` INT NOT NULL AUTO_INCREMENT , 
`about` TEXT NOT NULL , 
`user_id` VARCHAR(100) NOT NULL , 
`proj_id` INT NOT NULL , 
`date` TIMESTAMP NOT NULL , 
PRIMARY KEY (`notif_id`)) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `professor` ( 
`user_id` INT NOT NULL , 
`institute` VARCHAR(30) NOT NULL , 
UNIQUE (`user_id`)) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `project` ( 
`project_id` INT NOT NULL AUTO_INCREMENT , 
`user_id` INT NOT NULL , 
`owner` VARCHAR(50) NOT NULL , 
`name` VARCHAR(50) NOT NULL , 
`description` TEXT NOT NULL , 
`courses` VARCHAR(200) NOT NULL , 
`skills` VARCHAR(200) NOT NULL , 
`duration` VARCHAR(20) NOT NULL , 
`post_date` DATE NOT NULL , 
`final_date` DATE NOT NULL , 
`status` VARCHAR(20) NOT NULL , 
`candidates` INT NOT NULL , 
`city` VARCHAR(30) NOT NULL , 
`state` VARCHAR(20) NOT NULL , 
`type` VARCHAR(20) NOT NULL , 
PRIMARY KEY (`project_id`)) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `user` ( 
`user_id` INT NOT NULL AUTO_INCREMENT , 
`name` VARCHAR(100) NOT NULL , 
`email` VARCHAR(30) NOT NULL , 
`url` VARCHAR(50) NOT NULL , 
`linkedin` VARCHAR(50) NOT NULL , 
`about` TEXT NOT NULL , 
`type` VARCHAR(15) NOT NULL , 
`password` VARCHAR(100) NOT NULL , 
`status` VARCHAR(15) NOT NULL , 
PRIMARY KEY (`user_id`)) ENGINE = InnoDB;
