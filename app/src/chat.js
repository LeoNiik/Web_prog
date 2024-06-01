document.addEventListener('DOMContentLoaded', (event) => {
    showConvs();
    assignEventListeners();
    // Apri il popup modale
///poroceopces//////
}); 

function isValid(str) {
    return !(str === '');
}
function sendMessage() {

    const messageInput = document.getElementById('new-message');
    const messageOutput = document.getElementById('messages');
    const message = messageInput.value.trim();
    console.log("Messaggio da inviare: " + message);
    
    if(!isValid(message)) return;
    let time = new Date();
    let shownTime = time.getHours()+':'+time.getMinutes();
    registerMessage();
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

function registerMessage(){
    //send message to the backend, to store it
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
    fetch('http://192.168.1.48:8000/api/convs/'+id, options)
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
    window.location.href = '/login';
}

function searchConv() {
    const convName = document.getElementById('search-bar').value;
    let id = sessionStorage.getItem('sessid');
    let sidebar = document.getElementById('entries-wrapper');

    const options = {
        method: 'post',
        headers: {
        'Content-Type': 'application/json'
        },
        convName
    };
    fetch('http://192.168.1.48:8000/api/convs/'+id+'/search', options)
    .then(response => response.json())
    .then(data => {
        console.log(data);
        if(data.status === 'success'){
            //got conversations
            sidebar.innerHTML += data.content;
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
function showChat(){
    let id = sessionStorage.getItem('uid');
    fetch('http:/192.168.1.48:8000/api/chat/'+id)
    .then(data => {
        console.log(data);
    })
    .catch(error => console.error('Error:', error));
    return;
}

function assignEventListeners() {
    newChatListeners();
    messageListeners();
    moreOptionsListeners();
    newFriendsListeners();
    searchConvListeners();
    logoutListeners();

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
            // Azione da eseguire quando si clicca sull'icona
            console.log('Nuova chat cliccata!');
            // Puoi anche aprire il modal per creare una nuova chat, per esempio
            const modal = document.getElementById('popup-newfriend');
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
            logout();
        });
    }
}

//TODO
    //
    //add a friendship system (update db)
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
    // rendere il sito responsive
    //
    // dividere i messaggi tra sx/dx ricevente/mittente, fixare in generale i messaggi
    // es. in base alla lunghezza
    //
    //
//TODO login.html

    //implementare forgot-password e remember me
    //
    //

