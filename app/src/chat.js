document.addEventListener('DOMContentLoaded', (event) => {
    const messageInput = document.getElementById('new-message');
    const messageOutput = document.getElementById('messages');
    messageInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            sendMessage();
        }
    });

    function sendMessage() {
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
});
