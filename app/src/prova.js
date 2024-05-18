document.addEventListener("DOMContentLoaded", function() {
    const messagesContainer = document.getElementById('messages');
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    var id = 'statte zitto' 
    const messages = [
        "hello"
    ];

    // function getConversation(id){
    //     fetch("http://localhost/api/get/convs/"+id)
    //     .then((response) => response.json())
    //     .then((json) => console.log(json));
    // }

    // function login(){

    //     fetch('http://localhost/login')
    //     .then((response) => response.json())
    //     .then((json) => console.log(json))
    // }
    // function renderMessages() {
    //     messagesContainer.innerHTML = '';
    //     messages.forEach(message => {
    //         const messageElement = document.createElement('div');
    //         messageElement.className = 'message';
    //         messageElement.innerHTML = `<strong>${message.sender}: </strong><span>${message.content}</span>`;
    //         messagesContainer.appendChild(messageElement);
    //     });
    // }

    // function addMessage(content) {
    //     const newMessage = {
    //         id: messages.length + 1,
    //         content: content,
    //         sender: 'User1'
    //     };
    //     messages.push(newMessage);
    //     renderMessages();
    // }

    // messageForm.addEventListener('submit', function(event) {
    //     event.preventDefault();
    //     const message = messageInput.value.trim();
    //     if (message) {
    //         addMessage(message);
    //         messageInput.value = '';
    //         messagesContainer.scrollTop = messagesContainer.scrollHeight;
    //     }
    // });

});


