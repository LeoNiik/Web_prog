document.addEventListener('DOMContentLoaded', async (event) => {
    assignEventListeners();
    await refreshConvs();
    // Apri il popup modale
///poroceopces//////
}); 

const IP = '192.168.1.9';
//

function newMessage() {


    let data = registerMessage(message);
    //forse si puo fare ritornare al backend l ora im modo che glio orari siano piu consistenti
    if (message !== '') {
        console.log("Messaggio inviato: " + message);
        messageInput.value = ''; // Reset campo di input
    }

}

async function getMessages(conv_id){
    let id = sessionStorage.getItem('sessid');
    const options = {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify({id, conv_id})
    };
    //fai
    try {
        const response = await fetch('http://' + IP + ':8000/api/get_message/', options);
        const data = await response.json();
        console.log(data);
        return data;
    } catch (error) {
        console.error('Error:', error);
        return null;  // or you can return an empty array or object depending on your needs
    }


}


async function refreshMessages(){
    let id = sessionStorage.getItem('sessid');
    const messageDiv = document.getElementById('messages');
    const messageData = await getMessages();

    if(messageData === 'success'){
        messageDiv.innerHTML = messageData.content;
    } 

}
//send the message (with time, sender, receiver) to the backend
function registerMessage(){
    let id = sessionStorage.getItem('sessid');
    let messageInput = document.getElementById('new-message').value;
    let receiver = document.querySelector('.contact-name');
    let time = new Date();
    
    message = messageInput.value.trim();
    console.log('[DEBUG] newMessage:: message '+ message);    
    if(message==='') return;
    
    let shownTime = time.getHours()+':'+time.getMinutes();
    const options = {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify({id, message, receiver, shownTime})
    };
    fetch('http://'+IP+':8000/api/send_message', options)
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
    .catch(error => console.error('Error:', error));
    return data;
    
}
async function getRequest(url){
    const options = {
        method: 'GET',
        headers: {
        'Content-Type': 'application/json'
        }
    };
    try {
        const response = await fetch(url, options);
        const data = await response.json();
        console.log(data);
        return data;
    } catch (error) {
        console.log('Error:', error);
        return null;  // or you can return an empty array or object depending on your needs
    }
}
async function postRequest(url,data){
    const options = {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    };
    try {
        const response = await fetch(url, options);
        const data = await response.json();
        console.log(data);
        return data;
    } catch (error) {
        console.log('Error:', error);
        return null;  // or you can return an empty array or object depending on your needs
    }
}
async function getConvs(){
    //"/api/convs/:id"
    let id = sessionStorage.getItem('sessid');
    const data = getRequest('http://' + IP + ':8000/api/convs/' + id);
    console.log('[LOG] getConvs() data: ' + data);
    return data
}
//BISOGNA USARE SESSION PER l id della sessione e localStorage per il remember-me

function logout() {
    //chiedi al backend di generare un nuovo sessid
    
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

async function getFriends() {
    const id = sessionStorage.getItem('sessid');
    const data = getRequest('http://' + IP + ':8000/api/friends/' + id);
    console.log(data);
    return data;
}

async function newChat(friend_id){
    //prendo l id dell amico
    let id = sessionStorage.getItem('sessid');
    const sendData = { 
        friend_id : friend_id
    };
    const resData = postRequest('http://'+IP+':8000/api/convs/'+id+'/create', sendData);

    console.log(resData)
}

//risolvere problema dei click esponenziali
function assignEventListeners() {
    newChatListeners();
    messageListeners();
    manageFriendsListeners();
    moreOptionsListeners();
    newFriendsListeners();
    searchConvListeners();
    friendModalListeners();
    logoutListeners();


    
    function newChatListeners(){
        const modal = document.getElementById('popup-newchat');
        const newChatButton = document.getElementById('new-chat');
    
        newChatButton.addEventListener('click', async function () {
            // Azione da eseguire quando si clicca sull'icona
            console.log('Nuova chat cliccata!');    
            await refreshFriends();
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
        button.addEventListener('click',async function () {
            closeDropdown();
            // Azione da eseguire quando si clicca sull'icona
            // Puoi anche aprire il modal per creare una nuova chat, per esempio
            await refreshFriends();
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

    // dropdown.addEventListener('click', function(event) {
    //     event.stopPropagation(); // Prevent the event from bubbling up
    // }); 
}
function acceptFriendListeners(){
    const buttons = document.querySelectorAll(".acc-btn");
    buttons.forEach((button)=>{
        button.addEventListener('click', async (event)=>{
            const friend_id = event.target.id;
            await acceptFriend(friend_id,true);
        });
    
    });
}
function writeToListeners(){
    const entries = document.querySelectorAll(".write-to-entry");
    console.log(entries);
    entries.forEach((button)=>{
        button.addEventListener('click', async (event)=>{
            const friend_id = button.id;
            console.log('clicked write to'+friend_id);
            await newChat(friend_id);
            refreshConvs();
        });
    });
}
function refuseFriendListeners(){
    const buttons = document.querySelectorAll(".ref-btn");
    buttons.forEach((button)=>{
        button.addEventListener('click', async (event)=>{
            const friendname = button.id;
            await acceptFriend(friendname,false);
        });
    
    });
}
function removeFriendsListeners(){
    const buttons = document.querySelectorAll(".rmfriend-btn");
    buttons.forEach((button)=>{
        button.addEventListener('click', (event)=>{
        
            const friend_id = button.id;
            removeFriend(friend_id);
        });
    });
}
function openConvListeners(){
    const buttons = document.querySelectorAll(".open-conv-btn");
    console.log(buttons);
    buttons.forEach((button)=>{
        button.addEventListener('click', (event)=>{
            const conv_id = button.id;
            console.log('[DEBUG] openConv clicked'+ conv_id);
            openConv(conv_id);
        });
    });
}
function openConv(conv_id){
    
}
async function removeFriend(friend_id) {
    //prendo l id dell amico
    let id = sessionStorage.getItem('sessid');
    let status_label = document.getElementById('res-friend');
    const sendData = { 
        friend_id : friend_id
    };
    const resData = await postRequest('http://'+IP+':8000/api/friends/'+id+'/remove', sendData);
    if(resData.status === 'success'){
        //got conversations
        await refreshFriends();
        }
    else{
        //error in the backend
        status_label.innerText = data.status;
        }
    console.log(resData)
}

function closeDropdown(){
    const dropdown = document.getElementById('dropdown');
    dropdown.style.display = 'none';

}
async function getPendingRequests(){
    const id = sessionStorage.getItem('sessid');
    const data = getRequest('http://' + IP + ':8000/api/friends/' + id +'/pending');
    console.log(data);
    return data;
}

async function refreshFriends(){
    let pendingData = await getPendingRequests();
    let friendData = await getFriends();
    let friendDiv = document.getElementById('friends-wrapper'); 
    console.log(friendData);
    console.log(pendingData);

    if(!pendingData) return;
    if(!friendData) return;
    const pendingDiv = document.getElementById("pending");
    const activeDiv = document.getElementById("active-friends");

    if(friendData.status === 'success'){
        activeDiv.innerHTML = friendData.content;
        friendDiv.innerHTML = friendData.writeTo;
    }else{
        activeDiv.innerHTML = "error fetching friends";
        friendDiv.innerHTML = 'error';
    }
    
    if(pendingData.status === 'success'){
        pendingDiv.innerHTML = pendingData.content;
    }else{
        pendingDiv.innerHTML = "error fetching requests";
    }
    removeFriendsListeners();
    acceptFriendListeners();
    refuseFriendListeners();
    writeToListeners();
}
 
async function refreshConvs(){
    //faccio una riciesta alla api per avere le conversazioni 
    // "/api/convs/:id"
    let convData = await getConvs();
    convDiv = document.getElementById("entries-wrapper");

    if(convData.status === 'success'){
        convDiv.innerHTML = convData.content;
    }
    openConvListeners();
}

async function acceptFriend(friend_id, accepted){
    let id = sessionStorage.getItem('sessid');
    let status_label = document.getElementById('res-friend');
    const sendData = { 
        friend_id : friend_id,
        accept : accepted
    }; 
    const resData = await postRequest('http://'+IP+':8000/api/friends/'+id+'/accept', sendData);
    console.log(resData);
    if(resData.status === 'success'){
        await refreshFriends();    
    } 
}


function newFriend(){
    let id = sessionStorage.getItem('sessid');
    let status_label = document.getElementById('res-friend');
    const friendname = document.getElementById('friend-name');
    const sendData = {
        name : friendname.value
    }
    const resData = postRequest('http://'+IP+':8000/api/friends/'+id,sendData);  
    if(resData.status === 'success'){
        status_label.innerText = resData.content;
    }
}

//TODO
    //
    //add a friendship system (update db) <-- leonardo (fatto)
    //
    //how to manage user session (fatto(?))
    //  
    //implement newChat(), newFriend() (fatto)
    //
    //in removeFriends() lato server eliminare anche le conversazioni tra i due se esistono
    //
    //retrieveChat()
    //
    //aggiungere un sistema di storage delle immagini degli utenti
    //
    //modificare lo stile
    //
    //far apparire in chat-wrapper la chat al click
    //
    //aggiungere invio file (facoltativo/se rimane tempo)
    //
    //la cazzo di searchbar
    //
    // last but not least implement all real time message logic

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

    //implementare forgot-password e remember me (implementare mail) FATTO (da Jacopo project manager)
    //aggiorna tabella con mail                                      FATTO (da Jacopo project manager)
    //

//TODO index.html    <------- nicolò
//
//tutto quanto
//
//
