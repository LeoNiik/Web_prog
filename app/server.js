'use strict';
const path = require('path');
const express = require('express');
const { Client } = require('pg');
var bodyParser = require('body-parser')
const { createHash } = require('crypto');
const utils = require('./utils');

const nodemailer = require('nodemailer');




//const result = createHash('sha256').update("bacon").digest('hex');
// Constants
const PORT = 80;
const HOST = '0.0.0.0';

// DB connection
const client = new Client({
	user: 'postgres',
	password: 'password',
	host: '172.25.0.1',
	port: 5433,
	database: 'esempio',
});

client
.connect()
.then(() => {
	console.log('Connected to PostgreSQL database');
})
.catch((err) => {
	console.error('Error connecting to PostgreSQL database', err);
});
//setting search_path
client.query('SET search_path to prova');

const app = express();

app.use(express.static('public'));
app.use(express.static('src'));
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});
// parse application/json
app.use(bodyParser.json())

// ritorno l' utente dato il sessid
async function getUserBySessID(id) {
	const result = await client.query('SELECT * FROM Users WHERE session_id = $1', [id]);
	const user = result.rows[0];
	return user;
}

const transporter = nodemailer.createTransport({
	service: "Gmail",
	host: "smtp.gmail.com",
	port: 465,
	secure: true,
	auth: {
	  user: "francolama21@gmail.com",
	  pass: process.env.EMAIL_PASS
	},
  });

//send mail given the email and the message
const sendEmail = (to, subject, text) => {
	console.log(to);
	const mailOptions = {
	  from: 'francolama21@gmail.com',
	  to: to,
	  subject: subject,
	  text: text,
	};
  
	transporter.sendMail(mailOptions, (error, info) => {
	  if (error) {
		return console.log('Error while sending email:', error);
	  }
	  console.log('Email sent:', info.response);
	});
  };
  


async function generateUniqueID() {
	let id;
    let isUnique = false;

    while (!isUnique) {
        id = utils.generateRandomString(32);

        const res = await client.query('SELECT id FROM Users WHERE session_id = $1', [id]);
        if (res.rows.length === 0) {
            isUnique = true;
        }
	}
	return id;
}

//TODO trovare un modo per assegnare
app.get("/api/convs/:id", async (req, res) => {
	try {
		const id = req.params.id;

		const result = await client.query('SELECT conversation_id,name,updated_at FROM Conversations JOIN Conversation_Participants ON Conversations.id=conversation_id JOIN users ON session_id WHERE session_id = $1', [id]);

		if (result.rows.length === 0) {
			res.status(401).send({
				status : "No conversations found"
			});
			return;
		}

		//return the conversation as HTML
		//TODO order the convs by lastUpdate
		let dinamicContent = '';

		
		result.rows.forEach(element => {
			const {conversation_id,name, updated_at} = element;
			let time = utils.extractTime(updated_at);
			console.log(conversation_id,name,time);

			dinamicContent += 
			'<div class="sidebar-entry" id="'+conversation_id+'">\
				<img src="https://via.placeholder.com/40" alt="Profile Picture" class="profile-pic">\
				<div class="chat-info">\
					<span class="chat-name">'+name+'</span>\
				</div>\
				<div class="notification-info">\
					<span class="time">'+time+'</span>\
					<span class="notifications">3</span>\
				</div>\
			</div>'
		});
		res.status(201).send({
			status : "success",
			content : dinamicContent
		});

	} catch (error) {
		
	}
});
// add a new friend

app.post('/api/friends/:id', async (req, res) => {
	
	// Handle login logic here
	
	const id = req.params.id;
	const friendname = req.body.name;
	console.log(friendname);
	try {

		let user = await getUserBySessID(id);
		console.log(user);
		if (!user) {
			return res.status(401).send({
				status : "Error getting current user"
			});
		}
		console.log(user.id);
		const friend_id = await client.query('SELECT id FROM Users WHERE username = $1', [friendname]);
		//controllo se esiste gia la richiesta

		const result = await client.query('SELECT * FROM friends WHERE user_id = $1 AND friend_id = $2', [user.id, friend_id.rows[0].id]);
		//controllo se l'altro utente ha gia' mandato una richiesta
		const result2 = await client.query('SELECT * FROM friends WHERE user_id = $1 AND friend_id = $2', [friend_id.rows[0].id, user.id]);
		if (result2.rows.length != 0) {
			res.status(401).send({	
				status : "success",
				content : "This user already sent you a friend request go to manage friends to accept it"
			});
			return;
		}
		if (result.rows.length != 0) {
			res.status(401).send({
				status : "success",
				content :  "Friend request already sent"
			});
		}
		//controllare se le query ritornano qualcosa 
		
		
		await client.query('INSERT INTO friends (user_id, friend_id) VALUES ($1, $2)', [user.id, friend_id.rows[0].id]);
		await client.query('INSERT INTO friends (friend_id, user_id) VALUES ($1, $2)', [user.id, friend_id.rows[0].id]);
		
		res.status(200).send({
			status : "success",
			content : "Sent friend request to "+friendname
		});

	} catch (error) {
		console.error('Errore durante adding friends:', error);
		res.status(500).send({status : "internal error"});
	}
});
app.post('/api/friends/:id/accept', async (req, res) => {
	
	// Handle login logic here
	const id = req.params.id;
	const friend_id = req.body.friend_id;
	
	//update la table sostituendo pending con accepted
	try {
		let user = await getUserBySessID(id);
		if (!user) {
			return res.status(401).send({
				status : "Error getting current user"
			});
		}
		await client.query('UPDATE friends SET status = $1 WHERE user_id = $2 AND friend_id = $3', ['accepted', user.id, friend_id]);
		await client.query('UPDATE friends SET status = $1 WHERE friend_id = $2 AND user_id = $3', ['accepted', user.id, friend_id]);
		
		res.status(200).send({
			status : "success",
			content : "Friend request accepted"
		});
	} catch (error) {
		console.error('Errore durante adding friends:', error);
		res.status(500).send({status : "internal error"});
	}
});

app.post('/api/friends/:id/remove', async (req, res) => {
	
	// Handle login logic here
	const id = req.params.id;
	const friend_id = req.body.friend_id;
	
	//update la table sostituendo pending con accepted
	try {
		let user = await getUserBySessID(id);
		if (!user) {
			return res.status(401).send({
				status : "Error getting current user"
			});
		}
		await client.query('DELETE FROM friends WHERE user_id = $1 AND friend_id = $2', [user.id, friend_id]);
		await client.query('DELETE FROM friends WHERE friend_id = $1 AND user_id = $2', [user.id, friend_id]);
		
		res.status(200).send({
			status : "success",
			content : "Friend removed"
		});
	} catch (error) {
		console.error('Errore durante remove friends:', error);
		res.status(500).send({status : "internal error"});
	}
});

app.get("/api/friends/:id", async (req, res) => {
	try {
		const sessid = req.params.id;

		let user = await getUserBySessID(sessid);
		
		if (!user) {
			return res.status(401).send({
				status : "Error getting current user"
			});
		}
		let dinamicContent = '<h2>Friends</h2>';
		
		let result = await client.query(
			"SELECT username,id FROM users JOIN (SELECT friend_id,status FROM friends JOIN users ON user_id=id WHERE id=$1 and status='accepted') on id=friend_id;", [user.id]);
		if (result.rows.length === 0) {
			dinamicContent += '<p>No friends</p>'
			res.status(201).send({
				status : "success",
				content : dinamicContent  
			});
			return;
		}
		
		//return the conversation as HTML
		result.rows.forEach(element => {
			
			console.log(element.username);
			dinamicContent += '<div class="friend-entry"><p>'+element.username+'</p>\
			<button id='+element.id+' class="rmfriend-btn">remove</button></div>'; 
			
		});
		res.status(201).send({
			status : "success",
			content : dinamicContent
		});
		
	} catch (error) {
		console.log(error);
	}
});

app.get("/api/friends/:id/pending", async (req, res) => {
	try {
		const sessid = req.params.id;
		
		let user = await getUserBySessID(sessid);
		
		if (!user) {
			return res.status(401).send({
				status : "Error getting current user"
			});
		}
		
		let dinamicContent = '<h2>Pending</h2>';
		let result = await client.query(
			"SELECT username,id FROM users JOIN (SELECT user_id FROM friends JOIN users ON user_id=id WHERE friend_id=$1 and status='pending') on id=user_id;", [user.id]);
		if (result.rows.length === 0) {
			dinamicContent += 'No pendings requests';
			res.status(201).send({
				status : "success",
				content : dinamicContent  
			});
			return;
		}

		//return the friend requests as HTML
	

		
		result.rows.forEach(element => {
			dinamicContent += '<div class="friend-entry"><p>request from '+element.username+'</p><button id='+element.id+' class="acc-btn">accept</button></div>'; 
		});
		res.status(201).send({
			status : "success",
			content : dinamicContent
		});

	} catch (error) {
		console.log(error);
		res.status(201).send({
			status : "internal error"
		});
	}
});

app.post('/api/chat/', async (req,res) => {
	//prendo il sessid e il ricevente
	const {sessid, receiver} = req.body;
	try {
		const user = await client.query('SELECT id FROM Users WHERE session_id = $1', [sessid]);
		if(user.rows.length === 0){
			res.status(401).send({status : "User not found"});
		}
		const sender_id = user.rows[0].id;
		const receiver_id = await client.query('SELECT id FROM Users WHERE username = $1', [receiver]);
		if(receiver_id.rows.length === 0){
			res.status(401).send({status : "Receiver not found"});
		}

		//trova la conv_id a cui partecipano entrambi
		
		const sender_name = await client.query('SELECT username FROM Users WHERE id = $1', [sender_id]);
		const receiver_name = await client.query('SELECT username FROM Users WHERE id = $1', [receiver_id.rows[0].id]);
		
		conv_id = await client.query('SELECT conversation_id FROM Conversation_Participants WHERE user_id = $1 INTERSECT SELECT conversation_id FROM Conversation_Participants WHERE user_id = $2', [sender_id, receiver_id.rows[0].id]);
		
		if(conv_id.rows.length === 0){
			res.status(401).send({status : "No conversation found"});
		}
		//seleziono tutti i messaggi della conversazione
		const messages = await client.query('SELECT content,timestamp FROM Messages WHERE conversation_id = $1', [conv_id.rows[0].conversation_id]);

		//sorto messaggi per timestamp
		messages.rows.sort((a,b) => {
			return a.timestamp - b.timestamp;
		});
		//return the conversation as HTML

		let dinamicContent = '';
		messages.rows.forEach(element => {
			const {content, timestamp} = element;
			let time = utils.extractTime(timestamp);
			console.log(content,time);

			const name = (sender_id === sender_id) ? sender_name : receiver_name;
			
			dinamicContent += 
			'<div class="message">\
				<div class="message-content">\
					<p>'+name + ':' + content +'</p>\
				</div>\
				<div class="message-info">\
					<span class="message-time">'+time+'</span>\
				</div>\
			</div>'
		});
		res.status(201).send({
			status : "success",
			content : dinamicContent

		});
		
	} catch (error) {
		console.log('Error during conversation query')
	}
});

			

//send index.html as response for GET /
app.get('/', function(req, res) {
	res.sendFile(path.join(__dirname, 'public/index.html'));
});
					
async function getUser(username){

	if (!username) {
		return null;
	}

	// Cerca l'utente nel database
	const result = await client.query('SELECT * FROM Users WHERE username = $1', [username]);
	const user = result.rows[0];

	// Verifica che l'utente esista
	return user;
}
	
function comparePasswd(passwd, hash){
	const hashedPassword = createHash('sha256').update(passwd).digest('hex');
	return hashedPassword === hash;
}

// Placeholder for POST /api/login route
app.post('/api/login', async (req, res) => {
	
	// Handle login logic here
	
	const { username, password} = req.body;
	try {

		let user = await getUser(username);
		console.log(user);
		if (!user) {
			return res.status(401).send({
				status : "User "+username+" does not exist"
			});
		}

		const isPasswordValid = comparePasswd(password, user.password);
		// Confronta la password inserita con quella salvata nel database
		if (!isPasswordValid) {
			return res.status(401).send({status : "wrong credentials"});
		}
		//checko se l'utente e' verificato
		if (!user.verified){
			return res.status(401).send({status : "User not verified, check your email"});
		}

		// Se le credenziali sono valide, autentica l'utente
		let sessionid = utils.generateRandomString(32);
		await client.query('UPDATE Users SET session_id = $1 WHERE username = $2', [sessionid, username]);

		//genera il sessid
		//aggiorna il sessid
		//console loggo
		console.log('Utente autenticato:');
		console.log('Sessid:', sessionid);
		return res.status(200).send({status : "success", sessid : sessionid});

		
	} catch (error) {
		console.error('Errore durante il login:', error);
		res.status(500).send({status : "internal error"});
	}
});

app.post('/api/message', async (req,res) => {
	const {sessid, message, receiver, time} = req.body;
	try {
		const user = await client.query('SELECT id FROM Users WHERE session_id = $1', [sessid]);
		if(user.rows.length === 0){
			res.status(401).send({status : "User not found"});
		}
		const sender_id = user.rows[0].id;
		const receiver_id = await client.query('SELECT id FROM Users WHERE username = $1', [receiver]);
		if(receiver_id.rows.length === 0){
			res.status(401).send({status : "Receiver not found"});
		}

		//trova la conv_id a cui partecipano entrambi
		
		const conv_id = await client.query('SELECT conversation_id FROM Conversation_Participants WHERE user_id = $1 INTERSECT SELECT conversation_id FROM Conversation_Participants WHERE user_id = $2', [sender_id, receiver_id.rows[0].id]);
		
		if(conv_id.rows.length === 0){
			res.status(401).send({status : "No conversation found"});
		}
		//inserisci il messaggio
		let err = await client.query('INSERT INTO Messages (conversation_id, sender_id, content, timestamp) VALUES ($1, $2, $3, $4)', [conv_id.rows[0].conversation_id, sender_id, message, time]);
		if (err.rows.length === 0){
			res.status(401).send({status : "No Messages found"});

		}
		res.status(200).send({status : "success"});
	} catch (error) {
		console.log('Error during message query')
	}
});

app.post('/api/auth/sessid', async (req,res) => {
	const {sessid} = req.body;
	try {
		const user = await client.query('SELECT username FROM Users WHERE session_id = $1', [sessid]);
		if(user.rows.length === 0){
			res.status(401).send({status : "User not found"});
		}
		res.status(200).send({status : "success", username : user.rows[0].username});
		//res.sendFile(path.join(__dirname, 'public/home.html'));
	} catch (error) {
		console.log('Error during auth query')
	}

});

app.post('/api/convs/:id/search', async (req,res) => {
	const id = req.params.id;
	const convName = req.body.convName
	console.log(convName);
	try {

		client.query('SELECT conversation_id,name,updated_at FROM Conversations JOIN Conversation_Participants ON Conversations.id=conversation_id \
		JOIN users ON Conversation_Participants.user_id=users.id WHERE session_id = ($1) AND name LIKE ($2)'
		,[id, convName], (err, result) => {
			if (err) {
				console.error('Error executing query', err);
			}
			console.log(result);
			if(result.rows.length === 0){
				res.status(401).send(			
					{status : "error",
					content : 
					'<div class="sidebar-entry>"\
						<p>sNo chat containing '+convName+' </p>\
					</div>'
					
				});
				return;
			}
			//return the conversation as HTML
			//TODO order the convs by lastUpdate
			let dinamicContent = '';
			result.rows.forEach(element => {
			const {name, updated_at} = element;
			let time = utils.extractTime(updated_at);
			console.log(name,time);
			
			dinamicContent += 
			'<div class="sidebar-entry">\
				<img src="https://via.placeholder.com/40" alt="Profile Picture" class="profile-pic">\
				<div class="chat-info">\
					<span class="chat-name">'+name+'</span>\
				</div>\
				<div class="notification-info">\
					<span class="time">'+time+'</span>\
					<span class="notifications">3</span>\
				</div>\
			</div>'
			});
			res.status(201).send({
				status : "success",
				content : dinamicContent
			});			
		});
	} catch (error) {
		console.log('Error in query search', error);
	}
});

app.post('/api/reset', async (req,res) => {
	const {password,verify_token} = req.body;
	
	if (!password) {
		return res.status(401).send({
			status : "password "+password+" not valid"
		});
	}

	try {
		const user = await client.query('SELECT * FROM Users WHERE verify_token = $1', [verify_token]);
		if(user.rows.length === 0){
			res.status(401).send({status : "session_id not found"});
		}
		// Hash della password
		const hashedPassword = createHash('sha256').update(password).digest('hex');
		console.log(password,hashedPassword);
		//aggiorno la password
		await client.query('UPDATE Users SET password = $1 WHERE verify_token = $2', [hashedPassword, verify_token]);
		res.status(200).send({status : "success"});
	
	} catch (error) {
		console.error('Errore durante il reset password:', error);
		res.status(500).send({status : "internal error"});
	}
});

app.post('/api/forgot', async (req,res) => {
	const { email} = req.body;
	console.log(email);
	if (!email) {
		return res.status(401).send({
			status : "email "+email+" does not exist"
		});
	}
	try {
		//cerco l'email
		const user = await client.query('SELECT * FROM Users WHERE email = $1', [email]);
		if(user.rows.length === 0){
			res.status(401).send({status : "Email not found"});
		}
		//creo un link che li redirecta a reset_psw.html autehticando l'utente
		const link = 'http://192.168.1.38:8000/reset_psw.html?token='+user.rows[0].verify_token;

		//invio email
		sendEmail(email, 'Reset your password', 'Hi Mr. ' + user.rows[0].username + 'to reset your password click on the link: '+ link);
	
		res.status(200).send({status : "success"});
	} catch (error) {
		console.error('Errore durante il reset password:', error);
		res.status(500).send({status : "internal error"});
	}
});
// Placeholder for POST /signup route
app.post('/api/signup', async (req, res) => {
	
	const { username, password , email} = req.body;
	console.log(email);
	let user = await getUser(username);
	console.log(user);

	if(user){
		return res.status(401).send({status : 'User '+ username+' already exists'})
	}

	try {


		let clicked = false;
		//crea un handler per il link

		//finche' non e' cliccato il link non continuare
		
		
		// Hash della password
		const hashedPassword = createHash('sha256').update(password).digest('hex');
		console.log(password,hashedPassword)
		// Inserisci il nuovo utente nel database
		await client.query(
			'INSERT INTO Users (username, password, email) VALUES ($1,$2,$3)',
			[username,hashedPassword,email]
		);
			
		res.status(200).send({status : "success"});

		//generate default sessid
		const default_sessid = await generateUniqueID();
		const verify_token = await generateUniqueID();
		//aggiungi il sessid
		await client.query('UPDATE Users SET session_id = $1 WHERE username = $2', [default_sessid, username]);
		await client.query('UPDATE Users SET verify_token = $1 WHERE username = $2', [verify_token, username]);
		//const verify_token = await client.query('SELECT session_id FROM Users WHERE username = $1', [username]);

		const link = 'http://192.168.1.38:8000/verify?token='+default_sessid;
				//verify_token = session_id


		//invia email di verifica
		sendEmail(email, 'Verify your email', 'Hi Mr. ' + username + '. The man who sent this e-mail is very Gay\nClick on the link to verify your email: '+ link);

	} catch (error) {
		console.error('Errore durante la registrazione:', error);
		res.status(500).send({status : "internal error"});
	}	
});


app.get('/verify', async (req,res) => {
	const token = req.query.token;
	console.log(token);
	//verifica se in Users c'e' un sessid = token
	
	//prendi utente con sessid = token
	const user = await getUserBySessID(token);
	//se sessid esiste
	if (user.session_id){
		//set VERIFIED to true
		const result = await client.query('UPDATE Users SET verified = true WHERE session_id = $1', [token]);
		console.log(result);
		if (result){
			res.status(200).send({status : "success"});
		}

	}
	else{
		res.status(401).send({status : "error"});
	}
});

app.get('/login', (req,res) => {
	res.sendFile(path.join(__dirname, 'public/login.html'))
});

app.get('/forgot', (req,res) => {
	res.sendFile(path.join(__dirname, 'public/forgot.html'))
});

app.get('/signup', (req,res) => {
	res.sendFile(path.join(__dirname, 'public/signup.html'))
});

app.get('/easter_egg', (req,res) => {
	res.redirect('https://www.youtube.com/watch?v=2HKbbDukbJE&list=RD2HKbbDukbJE');
});

app.get('/home', (req,res) => {
	//se la richiesta arriva da /api/auth/sessid  o /login accetta, altrimenti redirecta in no_auth
	if (req.headers.referer === 'http://192.168.1.38:8000/api/auth/sessid'){
		res.sendFile(path.join(__dirname, 'public/home.html'));
	}
	else if (req.headers.referer === 'http://192.168.1.38:8000/login'){
		res.sendFile(path.join(__dirname, 'public/home.html'));
	}
	else{
		res.sendFile(path.join(__dirname, 'public/no_auth.html'));
	}
});

app.listen(PORT, HOST);


// CREATE TABLE Users (
//     id SERIAL PRIMARY KEY,
//     username VARCHAR(50) NOT NULL UNIQUE,
//     password VARCHAR(255) NOT NULL,
//     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//     session_id VARCHAR(32)

// );

// DROP TABLE IF EXISTS Conversations;
// CREATE TABLE Conversations (
//     id SERIAL PRIMARY KEY,
//     name VARCHAR(255),
//     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
// );

// DROP TABLE IF EXISTS Conversation_Participants; 
// CREATE TABLE Conversation_Participants (
//     id SERIAL PRIMARY KEY,
//     conversation_id INT REFERENCES Conversations(id) ON DELETE CASCADE,
//     user_id INT REFERENCES Users(id) ON DELETE CASCADE,
//     joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
// );

// DROP TABLE IF EXISTS friends; 
// CREATE TABLE friends (
//     user_id INT,
//     friend_id INT,
//     status ENUM('pending', 'accepted', 'declined') DEFAULT 'pending',
//     requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//     PRIMARY KEY (user_id, friend_id),
//     FOREIGN KEY (user_id) REFERENCES users(user_id),
//     FOREIGN KEY (friend_id) REFERENCES users(user_id)
// );

// DROP TABLE IF EXISTS Messages;
// CREATE TABLE Messages (
//     id SERIAL PRIMARY KEY,
//     conversation_id INT REFERENCES Conversations(id) ON DELETE CASCADE,
//     sender_id INT REFERENCES Users(id) ON DELETE CASCADE,
//     content TEXT NOT NULL,
//     timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//     status VARCHAR(50) DEFAULT 'sent'
// );


//seleziono solo le conversazioni di cui faccio parte

//SELECT conversation_id FROM Conversations JOIN Conversation_Participants where user_id = ($1) [id_utente] 

//seleziono tutti i messaggi data una conversazione 

//SELECT content,timestamp FROM Messages JOIN conversation WHERE Conversations.id = ($1) [conversation_id] 

//INSERT INTO Conversations (name) VALUES ($1) RETURNING id [conv_name]
//SELECT 
//INSERT INTO Conversation_Participants () VALUES ($1) [ 

