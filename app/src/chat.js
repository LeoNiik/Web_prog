document.addEventListener('DOMContentLoaded', (event) => {
    showConvs();
    assignEventListeners();
    // Apri il popup modale
///poroceopces//////
});
    


function isValid(txt) {
    return str.trim().length === 0;
}
function sendMessage() {
    
    if(!isValid(message)) return;

    const message = messageInput.value.trim();
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
    fetch('http://localhost:8000/api/convs/'+id, options)
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

function assignEventListeners() {
    const messageInput = document.getElementById('new-message');
    const messageOutput = document.getElementById('messages');
    const modal = document.getElementById('popup-modal');
    const newChatButton = document.getElementById('new-chat');
    newChatButton.addEventListener('click', function () {
        // Azione da eseguire quando si clicca sull'icona
        console.log('Nuova chat cliccata!');
        // Puoi anche aprire il modal per creare una nuova chat, per esempio
        const modal = document.getElementById('popup-modal');
        modal.style.display = 'block';
    });
        // Chiudi il modal quando si clicca sulla 'x'
    const closeButton = document.querySelector('.close-button');
    
    closeButton.addEventListener('click', function () {
        const modal = document.getElementById('popup-modal');
        modal.style.display = 'none';
    });

    // Chiudi il modal quando si clicca fuori dalla finestra del modal
    window.addEventListener('click', function (event) {
        const modal = document.getElementById('popup-modal');
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    });
    

    //manda messaggio quando si preme enter
    messageInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            sendMessage();
        }
    
    });
}

//TODO
    //
    //add a friendship system (update db)
    //
    //how to manage user session
    //
    //implement newChat(), newFriend(), retrieveChat()
    //
    // last but not least implement all real time message logic
    //
    //


