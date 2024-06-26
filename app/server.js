'use strict';
const path = require('path');
const express = require('express');
const fileUpload = require('express-fileupload');
const { Client } = require('pg');
var bodyParser = require('body-parser')
const { createHash } = require('crypto');
const utils = require('./utils');
const Server = require('socket.io');
const nodemailer = require('nodemailer');
const multer = require('multer');
const fs = require('fs');





//const result = createHash('sha256').update("bacon").digest('hex');
// Constants
const PORT = 80;
const HOST = '0.0.0.0';
const IP = 'gigachat.web'; //just for testing
// DB connection
const client = new Client({
	user: 'postgres',
	password: process.env.DB_PASSWORD,
	host: '172.25.0.1',
	port: 5433,
	database: 'gigachat',
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
client.query('SET search_path to chatschema');

const app = express();
const expressServer = app.listen(PORT, HOST);
let sockets = {};
const io = Server(expressServer, {
    cors: {
        origin: process.env.NODE_ENV === "production" ? false : [`http://${IP}:8000`, 'http://localhost:8000' , "http://127.0.0.1:8000"]
    }
});

app.use(fileUpload());


io.on('connection', (socket) => {
	// Comunica il custom socket ID al client		
	socket.on('setCustomId', (id)=>{
		socket.customId = id;
		// Aggiungi il socket alla variabile globale
		sockets[id] = socket;
		
		// console.log(`[DEBUG] onSetCustomID::sockets[id] - ${sockets[id].customId}`);
		// console.log(`[DEBUG] onSetCustomID::socket.customId - ${socket.customId}`);

	});

	// Gestione della disconnessione del client
	socket.on('disconnect', () => {
	  console.log(`Client ${socket.customId} si è disconnesso`);
	  delete sockets[socket.customId]; // Rimuovi il socket dalla variabile globale
	});
});

app.use(express.static('upload'))
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
	  user: process.env.EMAIL,
	  pass: process.env.EMAIL_PASS
	},
});

//send mail given the email and the message
const sendEmail = (to, subject, text) => {
	console.log(to);
	const mailOptions = {
	  from: process.env.EMAIL,
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
		const sessid = req.params.id;
		let user = await getUserBySessID(sessid);
		//console.log(user);
		if (!user) {
			return res.status(401).send({
				status : "Error getting current user"
			});
		}
		const result = await client.query('SELECT conversation_id,updated_at FROM Conversations JOIN Conversation_Participants ON Conversations.id=conversation_id JOIN users ON user_id=users.id WHERE users.id = $1 ORDER BY 2 DESC', [user.id]);
		//console.log('[DEBUG] result:', result.rows.length);
		if (result.rows.length === 0) {
			return res.status(401).send({
				status : 'success',
				content : "No conversations found"
			});
			return;
		}
		

		//retrieva il nome dell' amico con cui abbiamo la conversazione
		//return the conversation as HTML
		//TODO order the convs by lastUpdate
		let dinamicContent = '';

		console.log('[DEBUG] result:', result.rows);

		for (const element of result.rows) {
			const {conversation_id, updated_at} = element;
			console.log('[DEBUG] element:', element);
			let time = utils.extractTime(updated_at);
			//console.log(conversation_id,time);
			const convName = await client.query('SELECT * FROM Users JOIN (SELECT user_id FROM Conversation_Participants WHERE conversation_id = $1) on user_id=id WHERE id!=$2', [conversation_id,user.id]);
			//console.log('[DEBUG] convName:', convName.rows);
			let image_src = `https://via.placeholder.com/40`;

			if(fs.existsSync(`upload/${convName.rows[0].username}.png`)){
				image_src = `http://${IP}:8000/upload/${convName.rows[0].username}.png`;
			}
			dinamicContent += 
			'<div class="sidebar-entry open-conv-btn" id="'+conversation_id+'">\
				<img src='+image_src+' alt="Profile Picture" class="profile-pic">\
				<div class="chat-info">\
					<span class="chat-name">'+ convName.rows[0].username +'</span>\
				</div>\
				<div class="notification-info">\
					<span class="time">'+time+'</span>\
				</div>\
			</div>';
		}
		// console.log('[DEBUG] dinamicContent:', dinamicContent);
		return res.status(201).send({
			status : "success",
			content : dinamicContent
		});

	} catch (error) {
		console.error(error);
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
			return res.status(401).send({	
				status : "success",
				content : "This user already sent you a friend request go to manage friends to accept it"
			});
			return;
		}
		if (result.rows.length != 0) {
			return res.status(401).send({
				status : "success",
				content :  "Friend request already sent"
			});
		}
		//controllare se le query ritornano qualcosa 
		
		
		await client.query('INSERT INTO friends (user_id, friend_id, status) VALUES ($1, $2, $3)', [user.id, friend_id.rows[0].id,'sent']);
		await client.query('INSERT INTO friends (user_id, friend_id) VALUES ($1, $2)', [friend_id.rows[0].id,user.id]);
		
		return res.status(200).send({
			status : "success",
			content : "Sent friend request to "+friendname
		});

	} catch (error) {
		console.error('Errore durante adding friends:', error);
		return res.status(500).send({status : "internal error"});
	}
});

app.post('/api/get_conv_id/:id', async (req,res) => {
	const id = req.params.id;
	const  friend_id = req.body.friend_id;
	try {
		const user = await getUserBySessID(id)
		if(!user){
			return res.status(401).send({status : "User not found"});
		}
		const conv_id = await client.query('SELECT conversation_id FROM Conversation_Participants WHERE user_id = $1 INTERSECT SELECT conversation_id FROM Conversation_Participants WHERE user_id = $2', [user.id, friend_id]);
		if(conv_id.rows.length === 0){
			return res.status(401).send({status : "No conversation found"});
		}
		return res.status(201).send({status : "success", conv_id : conv_id.rows[0].conversation_id});
	} catch (error) {
		console.log('Error during get_conv_id query');
	}

});
app.post('/api/friends/:id/accept', async (req, res) => {
	
	// Handle login logic here
	const id = req.params.id;
	const {friend_id,accept}= req.body;
	console.log(friend_id,accept);
	//update la table sostituendo pending con accepted
	try {
		let user = await getUserBySessID(id);
		if (!user) {
			return res.status(401).send({
				status : "Error getting current user"
			});
		}
		if(accept === true){
			await client.query('UPDATE friends SET status = $1 WHERE user_id = $2 AND friend_id = $3', ['accepted', user.id, friend_id]);
			await client.query('UPDATE friends SET status = $1 WHERE friend_id = $2 AND user_id = $3', ['accepted', user.id, friend_id]);
		}else if(accept === false){
			await client.query('DELETE from friends WHERE user_id=$1 and friend_id=$2 and status=$3',[friend_id,user.id,'sent']);
			await client.query('DELETE from friends WHERE user_id=$1 and friend_id=$2 and status=$3',[user.id,friend_id,'pending']); 
		}else if(accept === 'cancel'){
			await client.query('DELETE from friends WHERE user_id=$1 and friend_id=$2 and status=$3',[friend_id,user.id,'pending']);
			await client.query('DELETE from friends WHERE user_id=$1 and friend_id=$2 and status=$3',[user.id,friend_id,'sent']); 
		}
		
		return res.status(200).send({
			status : "success",
			content : "Friend request accepted"
		});
	} catch (error) {
		console.error('Errore durante accepting friends:', error);
		return res.status(500).send({status : "internal error"});
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
		await client.query('DELETE FROM friends WHERE user_id = $1 AND friend_id = $2 AND status=$3', [user.id, friend_id,'accepted']);
		await client.query('DELETE FROM friends WHERE friend_id = $1 AND user_id = $2 AND status=$3', [user.id, friend_id,'accepted']);

		return res.status(200).send({
			status : "success",
			content : "Friend removed"
		});
	} catch (error) {
		console.error('Errore durante remove friends:', error);
		return res.status(500).send({status : "internal error"});
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
		let writeToContent = '<h2>Write to</h2>'
		
		let result = await client.query(
			"SELECT username,id FROM users JOIN (SELECT friend_id,status FROM friends JOIN users ON user_id=id WHERE id=$1 and status='accepted') on id=friend_id;", [user.id]);
		if (result.rows.length === 0) {
			dinamicContent += '<p>No friends</p>'
			writeToContent += '<p>No friends, add new friends in the three dots near the search bar</p>'
			return res.status(201).send({
				status : "success",
				content : dinamicContent,
				writeTo : writeToContent 
			});
			return;
		}
		
		//return the conversation as HTML
		result.rows.forEach(element => {

			let image_src = `https://via.placeholder.com/40`;
			if(fs.existsSync(`upload/${element.username}.png`)){
				image_src = `http://${IP}:8000/upload/${element.username}.png`;
			}

			console.log(element.username);
			dinamicContent += '<div class="friend-entry"><p><b>'+element.username+'</b></p>\
			<button id='+element.id+' class="rm-friend-btn">remove</button></div>'; 
			// un div per ogni amico con un bottone remove
			writeToContent +=  '<div class="write-to-entry" id="'+element.id+'">\
			<img src='+image_src+' alt="Profile Picture" class="profile-pic">\
			<div class="chat-info">\
				<span class="chat-name">'+element.username+'</span>\
			</div>\
			<div class="notification-info">\
				<span class="time">time</span>\
				<span class="notifications">3</span>\
			</div>\
			</div>';
	
		});

		return res.status(201).send({
			status : "success",
			content : dinamicContent,
			writeTo : writeToContent
		});
		
	} catch (error) {
		console.log(error);
	}
});

//mostra le richieste di amicizia ricevute
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
		let result = await client.query("SELECT username,id FROM users JOIN (SELECT friend_id FROM friends WHERE user_id=$1 AND status=$2) on id=friend_id;", [user.id,'pending']);
		//ritorna l' elemento solo all' amico che ha ricevuot la richiesta
		
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
			dinamicContent += '<div class="friend-entry"><p>request from <b>'+element.username+'</b></p><button id='+element.id+' class="acc-btn">accept</button><button id='+element.id+' class="ref-btn">refuse</button></div>'; 
		});
		return res.status(201).send({
			status : "success",
			content : dinamicContent
		});

	} catch (error) {
		console.log(error);
		return res.status(201).send({
			status : "internal error"
		});
	}
});

app.get("/api/friends/:id/sent", async (req, res) => {
	try {
		const sessid = req.params.id;
		
		let user = await getUserBySessID(sessid);
		
		if (!user) {
			return res.status(401).send({
				status : "Error getting current user"
			});
		}
		
		let dinamicContent = '<h2>Sent</h2>';
		let result = await client.query("SELECT username,id FROM users join (SELECT friend_id FROM friends WHERE user_id=$1 AND status=$2) on id=friend_id; ", [user.id,'sent']);
		//ritorna l' elemento solo all' amico che ha ricevuot la richiesta
		
		if (result.rows.length === 0) {
			dinamicContent += 'No sent requests';
			return res.status(201).send({
				status : "success",
				content : dinamicContent  
			});
			return;
		}
		//SELECT user_id FROM friends WHERE user_id=$1 AND status=$2 JOIN users where

		//return the friend requests as HTML
		result.rows.forEach(element => {
			dinamicContent += '<div class="friend-sent"><div class="friend-entry"><p>request sent to <b>'+element.username+'</b></p><button id='+element.id+' class="canc-btn">cancel</button></div></div>'; 
		});
		return res.status(201).send({
			status : "success",
			content : dinamicContent
		});

	} catch (error) {
		console.log(error);
		return res.status(201).send({
			status : "internal error"
		});
	}
});

app.post('/api/change_name/:id', async (req,res) => {
	const sessid = req.params.id;
	console.log('[DEBUG] /api/change_name::req.body - '+ req.body.name);
	const newname = req.body.name;
	try {
		const user = await getUserBySessID(sessid);
		if(!user){
			return res.status(401).send({status : "error"});
		}
		//checko se il nuovo nome contiene spazi
		if(newname.includes(' ')){
			return res.status(401).send({status : "success", content : 'Username cannot contain spaces'});
		}
		//checko se esiste gia' un utente con lo stesso nome
		const check = await client.query('SELECT * FROM Users WHERE username = $1', [newname]);
		if(check.rows.length != 0){
			return res.status(401).send({status : "success", content : "Username already taken"});
		}
		//cambio il nome dell' immagine profilo se esiste
		if(fs.existsSync(`upload/${user.username}.png`)){
			fs.rename(`upload/${user.username}.png`, `upload/${newname}.png`, function(err) {
				if ( err ) console.log('ERROR: ' + err);
			});
		}
		await client.query('UPDATE Users SET username = $1 WHERE id = $2', [newname, user.id]);
		return res.status(201).send({status : "success", content : 'Username Succesfully updated'});
	} catch (error) {
		console.error('Error during change name query: ', error);
	}
});

app.post('/api/chat/', async (req,res) => {
	//prendo il sessid e il ricevente
	const {id, receiver} = req.body;
	try {
		const user = await client.query('SELECT id FROM Users WHERE session_id = $1', [sessid]);
		if(user.rows.length === 0){
			return res.status(401).send({status : "User not found"});
		}
		const sender_id = user.rows[0].id;
		const receiver_id = await client.query('SELECT id FROM Users WHERE username = $1', [receiver]);
		if(receiver_id.rows.length === 0){
			return res.status(401).send({status : "Receiver not found"});
		}

		//trova la conv_id a cui partecipano entrambi
		
		const sender_name = await client.query('SELECT username FROM Users WHERE id = $1', [sender_id]);
		const receiver_name = await client.query('SELECT username FROM Users WHERE id = $1', [receiver_id.rows[0].id]);
		
		conv_id = await client.query('SELECT conversation_id FROM Conversation_Participants WHERE user_id = $1 INTERSECT SELECT conversation_id FROM Conversation_Participants WHERE user_id = $2', [sender_id, receiver_id.rows[0].id]);
		
		if(conv_id.rows.length === 0){
			return res.status(401).send({status : "No conversation found"});
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
			//console.log(content,time);

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
		return res.status(201).send({
			status : "success",
			content : dinamicContent

		});
		
	} catch (error) {
		console.log('Error during conversation query'+ error);
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
		return res.status(500).send({status : "internal error"});
	}
});

app.post('/api/contact_name/:id', async (req,res) => {
	const sessid = req.params.id;
	const {conv_id} = req.body;
	try {
		const user = await getUserBySessID(sessid);
		if(!user){
			return res.status(401).send({
				status : "error",
				content : 'user not found'
			});
		}
		//seleziono tutti i messaggi della conversazione
		const participants = await client.query('SELECT user_id FROM Conversation_Participants WHERE conversation_id = $1 and user_id != $2', [conv_id,user.id]);
		const friend_name = await client.query('SELECT username FROM Users WHERE id = $1', [participants.rows[0].user_id]);
		console.log("FRIEND_NAME in CONTACT_NAME: " + friend_name.rows[0].username);
		return res.status(201).send({
			status : "success",
			content : friend_name.rows[0].username
		});
	} catch (error) {
		console.log(error);
	}
});

app.post('/api/messages', async (req,res) => {
	const conv_id = req.body.conv_id;
	const sessid = req.body.id;
	try {
		console.log('[DEBUG] /api/messages::req.body - '+ conv_id +' - '+ sessid);
		const user = await getUserBySessID(sessid);
		if(!user){
			return res.status(401).send({
				status : "error",
				content : 'user not found'
			});
		}
		//seleziono tutti i messaggi della conversazione
		const messages = await client.query('SELECT content,timestamp,username FROM Messages JOIN Users on sender_id=users.id WHERE conversation_id = $1 ORDER BY 2 ASC', [conv_id]);
		//sort by timestamp
		
		if(messages.rows.length === 0){
			console.log('[DEBUG] /api/messages: No messages found');
			return res.status(401).send({status : "success",
				content : '<p class="empty-mes">No messages Found</p>'
			});
		}
		// console.log('[DEBUG] /api/messages::messages - '+ messages);
		//return the conversation as HTML

		let dinamicContent = '';
		messages.rows.forEach(element => {
			const {content, timestamp,username} = element;
			let time = utils.extractTime(timestamp);
			// console.log(content,time);
			let padding = 'style = "align-self:flex-start;""';
			

			if (username === user.username){
				padding = 'style = "align-self:flex-end;"';
				
			}
			dinamicContent += 
			'<div class="message" '+padding+' >\
				<div class="message-content">\
					<p><b>'+username+ '</b> : ' +  content + ' </p>\
				</div>\
				<div class="message-info">\
					<span class="message-time">'+time+'</span>\
				</div>\
			</div>'
		});
		return res.status(201).send({
			status : "success",
			content : dinamicContent

		});
		
	} catch (error) {
		console.log('[DEBUG] messages: Error during messages query')
		console.error(error);
	}
});

app.post('/api/send_message', async (req,res) => {
	const {id, message, receiver} = req.body;
	try {
		const user = await client.query('SELECT id FROM Users WHERE session_id = $1', [id]);
		if(user.rows.length === 0){
			return res.status(401).send({
				status : "error",
				content: "User not found"
			});
		}
		const sender_id = user.rows[0].id;
		const receiver_id = await client.query('SELECT id FROM Users WHERE username = $1', [receiver]);
		if(receiver_id.rows.length === 0){
			return res.status(401).send({
				status : "error",
				content : "Receiver not found"
			});
		}

		//trova la conv_id a cui partecipano entrambi
		
		let conv_id = await client.query('SELECT conversation_id FROM Conversation_Participants WHERE user_id = $1 INTERSECT SELECT conversation_id FROM Conversation_Participants WHERE user_id = $2', [sender_id, receiver_id.rows[0].id]);
		
		if(conv_id.rows.length === 0){
			return res.status(401).send({
				status : "error",
				content: "No conversation found"
			});
		}
		//inserisci il messaggio
		let err = await client.query('INSERT INTO Messages (conversation_id, sender_id, content) VALUES ($1, $2, $3) RETURNING id', [conv_id.rows[0].conversation_id, sender_id, message]);
		//updato il timestamp della conversazione tramite la query, usando il tempo del DB
		let update_ts = await client.query('UPDATE Conversations SET updated_at = (SELECT timestamp FROM Messages WHERE id = $1) WHERE id = $2', [err.rows[0].id, conv_id.rows[0].conversation_id]);

		if (err.rows.length === 0){
			return res.status(401).send({
				status : "error",
				content : "failed to send message"
			});
		}
		//mando una notifica di updateal receiver con il websocket
		//io.emit('message', {conv_id: conv_id.rows[0].conversation_id, sender_id: sender_id, message: message});		
		//return the conversation as HTML
		let friend_sessid = await client.query('SELECT session_id FROM Users WHERE id = $1', [receiver_id.rows[0].id]);
		friend_sessid = friend_sessid.rows[0].session_id;
		conv_id = conv_id.rows[0].conversation_id;

		if(sockets[id])
			await sockets[id].emit('update-messages', conv_id);
		if(sockets[friend_sessid])
			await sockets[friend_sessid].emit('update-messages', conv_id);

		return res.status(200).send({
			status : "success"
		});
	} catch (error) {
		console.log('[DEBUG} /api/send_message: error', error);
	}
});


app.post('/api/auth/sessid', async (req,res) => {
	const {sessid} = req.body;
	try {
		const user = await client.query('SELECT username FROM Users WHERE session_id = $1', [sessid]);
		if(user.rows.length === 0){
			return res.status(401).send({status : "User not found"});
		}
		return res.status(200).send({status : "success", username : user.rows[0].username});
		//res.sendFile(path.join(__dirname, 'public/home.html'));
	} catch (error) {
		console.log('Error during auth query')
	}

});

// http://'+IP+':8000/api/convs/'+id+'/remove
app.post('/api/convs/:id/remove', async (req,res)=>{
	const sessid = req.params.id;
	console.log('body in convs::create'+req.body);
	const conv_id = req.body.conv_id;
	let user = await getUserBySessID(sessid);
	
	if (!user) {
		return res.status(401).send({
			status : "Error getting current user"
		});
	}
	//check se la conversazione esiste e io sono un partecipante
	const check = await client.query('SELECT * FROM Conversation_Participants WHERE user_id = $1 AND conversation_id = $2', [user.id, conv_id]);
	if(check.rows.length === 0){
		return res.status(401).send({
			status : "Error, chat non-existent or user is not a partecipant"
		});
	}
	let friend_id = await client.query('SELECT user_id FROM Conversation_Participants WHERE user_id != $1 AND conversation_id = $2', [user.id, conv_id]);
	friend_id = friend_id.rows[0].user_id
	await client.query('DELETE FROM conversations WHERE id=$1', [conv_id]);
	
	let friend_sessid = await client.query('SELECT session_id FROM Users WHERE id = $1', [friend_id]);
	friend_sessid = friend_sessid.rows[0].session_id

	if(sockets[sessid])
		await sockets[sessid].emit('update-convs', conv_id);
	if(sockets[friend_sessid])
		await sockets[friend_sessid].emit('update-convs', conv_id);


	return res.status(201).send({
		status : 'success'
	});
});
app.post('/api/convs/:id/create', async (req,res) => {
	const sessid = req.params.id;
	console.log('body in convs::create'+req.body);
	const friend_id = req.body.friend_id;
	let user = await getUserBySessID(sessid);
	
	if (!user) {
		return res.status(401).send({
			status : "Error getting current user"
		});
	}
	try {
		//checko se esite gia' una conversazione con lo stesso friend_id
		const check = await client.query('SELECT conversation_id FROM Conversation_Participants WHERE user_id = $1 INTERSECT SELECT conversation_id FROM Conversation_Participants WHERE user_id = $2', [user.id, friend_id]);
		
		if(check.rows.length != 0){
			return res.status(401).send({status : "error",
				content : "conversation already exists"
			});
		}
		//creo una conversazione senza inserire niente e ritorno l'id
		let conv_id = await client.query('INSERT INTO Conversations DEFAULT VALUES RETURNING id');
		if(conv_id.rows.length === 0){
			return res.status(401).send({status : "error",
				content : "failed to create conversation"
			});
		}
		//inserico 2 entry a Conversation Partecipants con id e friend_id
		await client.query('INSERT INTO Conversation_Participants (conversation_id, user_id) VALUES ($1, $2)', [conv_id.rows[0].id, user.id]);
		await client.query('INSERT INTO Conversation_Participants (conversation_id, user_id) VALUES ($1, $2)', [conv_id.rows[0].id, friend_id]);

		let friend_sessid = await client.query('SELECT session_id FROM Users WHERE id = $1', [friend_id]);
		friend_sessid = friend_sessid.rows[0].session_id

		console.log('[DEBUG] api/messages::sockets - ', sockets);

		if(sockets[sessid])
			await sockets[sessid].emit('update-convs', null);
		if(sockets[friend_sessid])
			await sockets[friend_sessid].emit('update-convs', null);
		return res.status(200).send({status : "success"});
	} catch (error) {
		console.log('Error during conversation creation', error);
	}

});

app.post('/api/convs/:id/search', async (req,res) => {
	const id = req.params.id;
	const convName = req.body.convName
	console.log('[DEBUG] convName: ',convName);
	try {
		const user = await getUserBySessID(id);
		if(!user){
			//return error
			return res.status(401).send({status : "User not found"});
		}

		//const result = await client.query('SELECT conversation_id,updated_at FROM Conversations JOIN Conversation_Participants ON Conversations.id=conversation_id JOIN users ON user_id=users.id WHERE users.id != $1 AND username LIKE $2', [user.id, '%'+convName+'%']);
		// const result = await client.query('SELECT conversation_id,updated_at FROM Conversations JOIN Conversation_Participants ON Conversations.id=conversation_id JOIN users ON user_id=users.id WHERE users.id = $1 ', [user.id, '%'+convName+'%']);
		
		const result = await client.query('SELECT conversations.id,updated_at FROM Conversations JOIN Conversation_Participants ON Conversations.id=conversation_id JOIN Users on user_id=users.id WHERE users.id=$1',[user.id]);

		console.log('[DEBUG]/api/convs/:id/search::result - '+ JSON.stringify(result.rows) );

		//return the conversation as HTML
		//TODO order the convs by lastUpdate
		let dinamicContent = '';
		for (const element of result.rows) {

			console.log('[DEBUG] convName nel For:', convName);
			console.log('[DEBUG] /api/convs/search::element:', JSON.stringify(element));


			const conv_id = element.id
			const updated_at = element.updated_at
			console.log('{nigger}'+ conv_id)
			//console.log('[DEBUG] element:', element);
			let time = utils.extractTime(updated_at);

			const convName_for = await client.query('SELECT username FROM Users JOIN Conversation_Participants ON user_id=users.id WHERE conversation_id = $1 AND users.id!=$2 AND username LIKE $3', [conv_id,user.id,'%'+convName+'%']);

//SELECT username FROM users JOIN conversation_partecipants ON user_id=users.id WHERE conversation_id = $1 AND users.id!=$2 AND username LIKE $3,[] 
			if(convName_for.rows.length===0){
				continue;
			}
			

			console.log('[DEBUG] /api/convs/search::convName:', convName_for.rows);
			let image_src = `https://via.placeholder.com/40`;

			if(fs.existsSync(`upload/${convName_for.rows[0].username}.png`)){
				image_src = `http://${IP}:8000/upload/${convName_for.rows[0].username}.png`;
			}
			dinamicContent += 
			'<div class="sidebar-entry open-conv-btn" id="'+conv_id+'">\
				<img src='+image_src+' alt="Profile Picture" class="profile-pic">\
				<div class="chat-info">\
					<span class="chat-name">'+ convName_for.rows[0].username +'</span>\
				</div>\
				<div class="notification-info">\
					<span class="time">'+time+'</span>\
				</div>\
			</div>';
		}
		if(dinamicContent===''){
			return res.status(401).send(			
				{status : "success",
				content : 
				'<div class="sidebar-entry>"\
					<p>No chat containing '+convName+' </p>\
				</div>'
				
			});
		}
		return res.status(201).send({
			status : "success",
			content : dinamicContent
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
			return res.status(401).send({status : "session_id not found"});
		}
		// Hash della password
		const hashedPassword = createHash('sha256').update(password).digest('hex');
		console.log(password,hashedPassword);
		//aggiorno la password
		await client.query('UPDATE Users SET password = $1 WHERE verify_token = $2', [hashedPassword, verify_token]);
		return res.status(200).send({status : "success"});
	
	} catch (error) {
		console.error('Errore durante il reset password:', error);
		return res.status(500).send({status : "internal error"});
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
			return res.status(401).send({status : "Email not found"});
		}
		//creo un link che li redirecta a reset_psw.html autehticando l'utente
		const link = 'http://' + IP + ':8000/reset_psw.html?token='+user.rows[0].verify_token;

		//invio email
		sendEmail(email, 'Reset your password', 'Hi Mr. ' + user.rows[0].username + '.\n\n\nTo reset your password click on the link: '+ link);
	
		return res.status(200).send({status : "success"});
	} catch (error) {
		console.error('Errore durante il reset password:', error);
		return res.status(500).send({status : "internal error"});
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

		//checko se l' username contiene spazi
		if (username.includes(' ')){
			return res.status(401).send({status : "Username cannot contains spaces"});
		}

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
			
		
		//generate default sessid
		const default_sessid = await generateUniqueID();
		const verify_token = await generateUniqueID();
		//aggiungi il sessid
		await client.query('UPDATE Users SET session_id = $1 WHERE username = $2', [default_sessid, username]);
		await client.query('UPDATE Users SET verify_token = $1 WHERE username = $2', [verify_token, username]);
		//const verify_token = await client.query('SELECT session_id FROM Users WHERE username = $1', [username]);
		
		const link = 'http://'+IP+':8000/verify?token='+default_sessid;
				//verify_token = session_id
				

		//invia email di verifica
		sendEmail(email, 'Verify your email', 'Hi,' + username + '. Click on the following link to verify your account '+ link);
		return res.status(200).send({status : "success"});

	} catch (error) {
		console.error('Errore durante la registrazione:', error);
		return res.status(500).send({status : "internal error"});
	}	
});

app.post('/upload', async (req, res) => {
    const image  = req.files.image;
	const id = req.body.sessid;

	console.log(image);
	console.log(req.body.sessid);

    if (!image) return res.sendStatus(400);

    // If doesn't have image mime type prevent from uploading
    //if (!/^image/.test(image.mimetype)) return res.sendStatus(400);

	const user = await getUserBySessID(id);
	

	//rinomino l' immagine con il sessid dell' utente
	console.log("[DEBUG] /upload image: " + JSON.stringify(image.name));
	image.name = user.username + path.extname(image.name);
	//retrivo l'estensione dell' immagine
	//const ext = path.extname(image.name);
	//salvo l' immagine in locale 
    image.mv(__dirname + '/upload/' + image.name);


	//redirecto a home
	res.redirect('http://'+IP+':8000/home');


    res.sendStatus(200);
});
app.get('/profile/:id' , async (req,res) => {
	const {id} = req.params;
	const user = await getUserBySessID(id);

	let image_src = `https://via.placeholder.com/40`;

	//checko se esiste un'immagine con il nome dell'utente
	if(fs.existsSync(`upload/${user.username}.png`)){
		image_src = `http://${IP}:8000/upload/${user.username}.png`;
	}

	return res.status(200).send({
		status : "success",
		content : user,
		image : image_src
	});

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
			return res.status(200).send({status : "success"});
		}

	}
	else{
		return res.status(401).send({status : "error"});
	}
});

app.get('/login', (req,res) => {
	res.sendFile(path.join(__dirname, 'public/login.html'))
});

app.get('/index', (req,res) => {
	res.sendFile(path.join(__dirname, 'public/index.html'))
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

app.get('/upload/:name', (req,res) => {
	const {name} = req.params;
	res.sendFile(path.join(__dirname, 'upload/'+name));
});


app.get('/home', (req,res) => {
	//se la richiesta arriva da /api/auth/sessid  o /login accetta, altrimenti redirecta in no_auth
	if (req.headers.referer === 'http://' + IP + ':8000/api/auth/sessid'){
		res.sendFile(path.join(__dirname, 'public/home.html'));
	}
	else if (req.headers.referer === 'http://' + IP + ':8000/login'){
		res.sendFile(path.join(__dirname, 'public/home.html'));
	}
	else if (req.headers.referer === 'http://' + IP + ':8000/home'){
		//redirecto a http://' + IP + ':8000/api/auth/sessid
		res.sendFile(path.join(__dirname, 'public/home.html'));
	}
	else{
		res.sendFile(path.join(__dirname, 'public/no_auth.html'));
	}
});



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
//     status ENUM('pending', 'accepted', 'declined','sent') DEFAULT 'pending',
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

//SELECT conversations.id FROM Conversation JOIN conversation_partecipants ON Conversations.id=conversation_id JOIN Users on user_id=users.id WHERE users.id=$1\
//tutte le conversazioni di cui sono partecipante


//