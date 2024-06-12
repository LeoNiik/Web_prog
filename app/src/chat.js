document.addEventListener('DOMContentLoaded', (event) => {
    showConvs();
    assignEventListeners();
    // Apri il popup modale
///poroceopces//////
}); 

const IP = '192.168.1.38';
//

function sendMessage() {

    const messageInput = document.getElementById('new-message');
    const messageOutput = document.getElementById('messages');
    const message = messageInput.value.trim();
    console.log("Messaggio da inviare: " + message);
    
    if(message==='') return;
    let shownTime = registerMessage(message);
    //forse si puo fare ritornare al backend l ora im modo che glio orari siano piu consistenti
    if (message !== '') {
        console.log("Messaggio inviato: " + message);
        messageInput.value = ''; // Reset campo di input
    }
    messageOutput.innerHTML += 
    '<div class="message">\
        <p class="message-text">'+message+'</p>\
        <div class="message-info">\
            <span class="message-time">'+shownTime+'</span>\
        </div>\
    </div>';
}
//send the message (with time, sender, receiver) to the backend
function registerMessage(){
    let id = sessionStorage.getItem('sessid');
    let message = document.getElementById('new-message').value;
    let receiver = document.querySelector('.contact-name');
    let time = new Date();
    let shownTime = time.getHours()+':'+time.getMinutes();
    const options = {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify({id, message, receiver, shownTime})
    };
    fetch('http://'+IP+':8000/api/message', options)
    .then(response => response.json())
    .then(data => {
        console.log(data);
        if(data.status === 'success'){
            console.log('message sent');
        }
        else{
            console.log('message not sent');
        }
    })
    
}
function showConvs(){
    let id = localStorage.getItem('sessid');
    let sidebar = document.getElementById('sidebar');

    const options = {
        method: 'GET',
        headers: {
        'Content-Type': 'application/json'
        },
    };
    fetch('http://'+IP+':8000/api/convs/'+id, options)
    .then(response => response.json())
    .then(data => {
        console.log(data);
        if(data.status === 'success'){
            //got conversations
            sidebar.innerHTML += data.content;
            assignEventListeners();
        }
        else{
            //error in the backend
            //sidebar.innerHTML += "clicca per riprovare"
        }
    })
    .catch(error => console.error('Error:', error));
    return;
}

//BISOGNA USARE SESSION PER l id della sessione e localStorage per il remember-me

function logout() {
    //tutto sminchiato 
    sessionStorage.removeItem('sessid');
    sessionStorage.removeItem('remember_me');
    window.location.href = '/login';
}

function searchConv() {
    const convName = document.getElementById('search-bar').value;
    let id = sessionStorage.getItem('sessid');
    let sidebar = document.getElementById('entries-wrapper');
	console.log(convName);
    const sendData = {
        convName
    };
    const options = {
        method: 'post',
        headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify(sendData)
    };
    fetch('http://'+IP+':8000/api/convs/'+id+'/search', options)
    .then(response => response.json())
    .then(data => {
        console.log(data);
        if(data.status === 'success'){
            //got conversations
            sidebar.innerHTML = data.content;
            assignEventListeners();
        }
        else{

            sidebar.innerHTML = data.content;
            assignEventListeners();
        }
    })
    .catch(error => console.error('Error:', error));
    return;
}
//prendo in input il nome dell' utente della chat e chiedo al backend la chat

// function showChat(nome){
//     let id = sessionStorage.getItem('sessid');

//     //mando una post
// }

function getFriends(){
    let id = localStorage.getItem('sessid');

    const options = {
        method: 'GET',
        headers: {
        'Content-Type': 'application/json'
        },
    };
    fetch('http://'+IP+':8000/api/friends/'+id, options)
    .then(response => response.json())
    .then(data => {
        console.log(data);
        return data;
    })
    .catch(error => console.error('Error:', error));
    return;
}

function showChat(name){
    let id = sessionStorage.getItem('sessid');
    const data = { 
        id,
        name
    };     
    const options = {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    };
    fetch('http://'+IP+':8000/api/chat', options)
    .then(response => response.json())
    .then(data => {
        console.log(data);
        if(data.status === 'success'){
            //got conversations
            messages.innerHTML = data.content;
            assignEventListeners();
        }
        else{
            //error in the backend
            sidebar.innerHTML = data.content;
            assignEventListeners();
        }
    });  
}

//risolvere problema dei click esponenziali
function assignEventListeners() {
    newChatListeners();
    messageListeners();
    moreOptionsListeners();
    newFriendsListeners();
    searchConvListeners();
    friendModalListeners();
    logoutListeners();
    manageFriendsListeners();
    function newChatListeners(){
        const modal = document.getElementById('popup-newchat');
        const newChatButton = document.getElementById('new-chat');
    
        newChatButton.addEventListener('click', function () {
            // Azione da eseguire quando si clicca sull'icona
            console.log('Nuova chat cliccata!');    
            // Puoi anche aprire il modal per creare una nuova chat, per esempio
            const modal = document.getElementById('popup-newchat');
            modal.style.display = 'block';
        });
        // Chiudi il modal quando si clicca sulla 'x'
        const closeButton = modal.querySelector('.close-button');
        
        closeButton.addEventListener('click', function () {
            const modal = document.getElementById('popup-newchat');
            modal.style.display = 'none';
        });
    
        // Chiudi il modal quando si clicca fuori dalla finestra del modal
        window.addEventListener('click', function (event) {
            const modal = document.getElementById('popup-newchat');
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        });
    }
    function messageListeners() {
        const messageInput = document.getElementById('new-message');
        const messageOutput = document.getElementById('messages');
        //manda messaggio quando si preme enter
        messageInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                sendMessage();
            }
        
        });
    }
    function moreOptionsListeners() {
        const dropdownButton = document.getElementById('drop-btn');
        const dropdown = document.getElementById('dropdown');
    
        dropdownButton.addEventListener('click', (event) => {
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
            event.stopPropagation(); // Prevent the event from bubbling up
        });
    
        window.addEventListener('click', function () {
            dropdown.style.display = 'none';
        });
    
        dropdown.addEventListener('click', function(event) {
            event.stopPropagation(); // Prevent the event from bubbling up
        }); 
    }
    function newFriendsListeners() {
        const modal = document.getElementById('popup-newfriend');
        const newFriendButton = document.getElementById('new-friend');
        newFriendButton.addEventListener('click', function () {
            closeDropdown();
    
            // Azione da eseguire quando si clicca sull'icona
            // Puoi anche aprire il modal per creare una nuova chat, per esempio
            modal.style.display = 'block';
        });
        // Chiudi il modal quando si clicca sulla 'x'
        const closeButton = modal.querySelector('.close-button');
        
        closeButton.addEventListener('click', function () {
            const modal = document.getElementById('popup-newfriend');
            modal.style.display = 'none';
        });
    
        // Chiudi il modal quando si clicca fuori dalla finestra del modal
        window.addEventListener('click', function (event) {
            const modal = document.getElementById('popup-newfriend');
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        });
    }
    function manageFriendsListeners(){
        const button = document.getElementById("manage-friend");
        const modal = document.getElementById('popup-manager');
        button.addEventListener('click', function () {
            closeDropdown();
            // Azione da eseguire quando si clicca sull'icona
            // Puoi anche aprire il modal per creare una nuova chat, per esempio
            refreshFriends();
            modal.style.display = 'block';
        });
        // Chiudi il modal quando si clicca sulla 'x'
        const closeButton = modal.querySelector('.close-button');
        
        closeButton.addEventListener('click', function () {
            modal.style.display = 'none';
        });
    
        // Chiudi il modal quando si clicca fuori dalla finestra del modal
        window.addEventListener('click', function (event) {
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        });
    }
    
    function searchConvListeners(){
        const searchButton = document.getElementById('search-conv');
        searchButton.addEventListener('click', () => {
            console.log('click search');    
            searchConv();
        });
    }
    function logoutListeners(){
        const searchButton = document.getElementById('logout');
    
        searchButton.addEventListener('click', () => {
            closeDropdown();
            logout();
        });
    }
    function friendModalListeners(){
        const subFriend = document.getElementById("sub-friend");
        subFriend.addEventListener('click', ()=>{
            console.log("friends clicked");
            newFriend();
        });
    }
}

function closeDropdown(){
    const dropdown = document.getElementById('dropdown');
    dropdown.style.display = 'none';

}
async function getPendingRequests(){
    let id = sessionStorage.getItem('sessid');
    const options = {
        method: 'GET',
        headers: {
        'Content-Type': 'application/json'
        }
    };
    try {
        const response = await fetch('http://' + IP + ':8000/api/friends/' + id + '/pending', options);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error);
        return null;  // or you can return an empty array or object depending on your needs
    }
}

async function refreshFriends(){
    console.log('golem negro');
    let pendingData = await getPendingRequests();
    // let friendData = getFriends();
    console.log(pendingData);
    if(!pendingData) return;
    // if(!friendData) return;
    const pendingDiv = document.getElementById("pending");
    const activeDiv = document.getElementById("active-friends");

    // if(friendData.status === 'success'){
    //     activeDiv.innerHTML = friendData.content;
    // }else{
    //     activeDiv.innerHTML = "error fetching friends";
    // }

    if(pendingData.status === 'success'){
        pendingDiv.innerHTML = pendingData.content;
    }else{
        pendingDiv.innerHTML = "error fetching friends";
    }
}

function newFriend(){
    let id = sessionStorage.getItem('sessid');
    const friendname = document.getElementById("friend-name").value;
    let status_label = document.getElementById('res-friend');
    const data = { 
        friendname
    };     
    const options = {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    };
    fetch('http://'+IP+':8000/api/friends/'+id, options)
    .then(response => response.json())
    .then(data => {
        console.log(data);
        if(data.status === 'success'){
            //got conversations
            status_label.innerText = "Sent friend request to "+ friendname;
        }
        else{
            //error in the backend
            status_label.innerText = data.status;
        }
    });  
}

//TODO
    //
    //add a friendship system (update db) <-- leonardo
    //
    //how to manage user session 
    //  
    //implement newChat(), newFriend(), retrieveChat(), 
    //
    // last but not least implement all real time message logic
    //
    //

//TODO home.html

    // far funzionare tutti i bottoni e icone
    //
    // rendere il sito responsive    <------ nicolò
    //
    // dividere i messaggi tra sx/dx ricevente/mittente, fixare in generale i messaggi  <-------- Jakydibe project manager
    // es. in base alla lunghezza
    //
    //

//TODO login.html

    //implementare forgot-password e remember me (implementare mail)
    //aggiorna tabella con mail
    //

//TODO index.html    <------- nicolò
//
//tutto quanto
//
//
