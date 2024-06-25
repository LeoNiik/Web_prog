document.addEventListener('DOMContentLoaded', async (event) => {
    assignEventListeners();
    await initSocketConnection();
    await refreshConvs();
    // Apri il popup modale
    ///poroceopces//////
}); 
var selectedChat = 0;
const IP = '192.168.1.25';
const socket = io('ws://'+IP+':8000');

// Funzione per inizializzare la connessione
async function initSocketConnection() {
    //prendo il sessid dalla sessione
    
    let id = sessionStorage.getItem('sessid');
    socket.emit('setCustomId', id);
    
}

//socket on update aggiorna la chat
socket.on('update-messages', async (conv_id) => {
    console.log('update messages received');
    console.log(conv_id);
    await refreshMessages(conv_id);
    document.getElementById('notification_audio').play();
});

socket.on('update-convs', async (conv_id)=>{
    console.log('update conversations received');
    if (selectedChat == conv_id) {
        closeConv();
    }
    await refreshConvs();    
});

async function getMessages(conv_id){
    let id = sessionStorage.getItem('sessid');
    try {
        const data = {
            conv_id : conv_id,
            id : id
        };
        const response = await postRequest('http://'+IP+':8000/api/messages', data);

        return response;
    } catch (error) {
        console.error('Error:', error);
        return null;  // or you can return an empty array or object depending on your needs
    }
}


async function refreshMessages(conv_id){
    let id = sessionStorage.getItem('sessid');
    const messageDiv = document.getElementById('messages');
    const contact_name = document.getElementById('contact-name');
    const messageData = await getMessages(conv_id);
    console.log('[DEBUG] refreshMessages::conv_id'+ conv_id);
    // console.log('[DEBUG] refreshMessages::messageData - '+ JSON.stringify(messageData));

    if(messageData.status === 'success' && selectedChat == conv_id){
        messageDiv.innerHTML = messageData.content;
    }
    scrollToBottom();
    function scrollToBottom() {
        const scrollableDiv = document.getElementById('messages');
        scrollableDiv.scrollTop = scrollableDiv.scrollHeight;
    }
    
}

async function getContactName(conv_id) {
    let id = sessionStorage.getItem('sessid');
    let sendData = {conv_id : conv_id};
    const resData = await postRequest('http://'+IP+':8000/api/contact_name/'+id, sendData)
    return resData;
}
//send the message (with time, sender, receiver) to the backend
async function newMessage(){
    let id = sessionStorage.getItem('sessid');
    let messageInput = document.getElementById('new-message');
    let receiver = document.querySelector('#contact-name').innerText;
    
    message = messageInput.value.trim();
    console.log('[DEBUG] newMessage::   '+ message);    
    if(message==='') return;
    
    const sendData = {
        id : id,
        message : message,
        receiver : receiver
    };
        
    console.log("[DEBUG] newMessage::sendData"+ JSON.stringify(sendData));
    let resData = await postRequest('http://'+IP+':8000/api/send_message', sendData);
    console.log("[DEBUG] newMessage::resData"+ JSON.stringify(resData));
    messageInput.value = ''
    scrollToBottom();
    function scrollToBottom() {
        const scrollableDiv = document.getElementById('messages');
        scrollableDiv.scrollTop = scrollableDiv.scrollHeight;
    }
    return resData;
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
        return data;
    } catch (error) {
        console.log('Error:', error);
        return null;  // or you can return an empty array or object depending on your needs
    }
}
async function getConvs(){
    //"/api/convs/:id"
    let id = sessionStorage.getItem('sessid');
    const data = await getRequest('http://' + IP + ':8000/api/convs/' + id);
    // console.log('[LOG] getConvs() data: ' + data.content);
    return data
}
//BISOGNA USARE SESSION PER l id della sessione e localStorage per il remember-me

function logout() {
    //chiedi al backend di generare un nuovo sessid
    
    sessionStorage.removeItem('sessid');
    sessionStorage.removeItem('remember_me');
    window.location.href = '/login';
}

async function searchConv() {
    const convName = document.getElementById('search-bar').value.trim();
    if(convName=='')
        refreshConvs();
    let id = sessionStorage.getItem('sessid');
    let sidebar = document.getElementById('entries-wrapper');
	console.log(convName);
    const sendData = {
        convName : convName
    };
    const resData = await postRequest(`http://${IP}:8000/api/convs/${id}/search`, sendData);
    convDiv = document.getElementById("entries-wrapper");
    console.log('[DEBUG]searchConv()::resData - '+resData)
    if(resData.status === 'success'){
        convDiv.innerHTML = resData.content;
    }
    openConvListeners();
    
}
//prendo in input il nome dell' utente della chat e chiedo al backend la chat

async function getFriends() {
    const id = sessionStorage.getItem('sessid');
    const data = await getRequest('http://' + IP + ':8000/api/friends/' + id);
    console.log(data);
    return data;
}

async function newChat(friend_id){
    //prendo l id dell amico
    let id = sessionStorage.getItem('sessid');
    const sendData = { 
        friend_id : friend_id
    };
    const resData = await postRequest('http://'+IP+':8000/api/convs/'+id+'/create', sendData);

    console.log('[DEBUG]newChat()::resData'+ resData);
}

//consenti di gestire il profilo (per ora solo uploadare immagine profilo)
/* <div id="popup-profile" class="modal">
<div class="modal-content">
    <input type="file" name="image" id="image" accept="image/*" required>
    <button onclick="uploadProfilePicture()">Upload</button>
</div>  */
// async function uploadProfilePicture(){
//     const formData = new FormData();
//     const id = sessionStorage.getItem('sessid');
//     const image = document.getElementById('image').files[0];
//     formData.append('image', image);

//     console.log('[DEBUG] uploadProfilePicture::formData - ' + formData);

//     const response = await fetch('http://'+IP+':8000/api/profile_pic/'+id+'/add', {
//         method: 'POST',
//         body: formData,
//     });

//     if (response.ok) {
//         alert('Image uploaded successfully!');
//     } else {
//         alert('Image upload failed!');
//     }
    
// }




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
    manageProfilePopup();
    closeConvListeners();
    changeNamePop();
    
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
                newMessage();

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


    //prendi il file dal form e invialo al backend
    async function manageProfilePopup(){
        const modal = document.getElementById('popup-profile');
        const manageProfileButton = document.getElementById('manage-profile');
        
        refreshProfile();

        manageProfileButton.addEventListener('click', function () {
            // Azione da eseguire quando si clicca sull'icona
            // Puoi anche aprire il modal per creare una nuova chat, per esempio
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
    async function changeNamePop(){
        const modal = document.getElementById('popup-changename');
        const manageProfileButton = document.getElementById('change-name-btn');
        
        manageProfileButton.addEventListener('click', function () {
            // Azione da eseguire quando si clicca sull'icona
            // Puoi anche aprire il modal per creare una nuova chat, per esempio
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
        const searchButton = document.getElementById('search-bar');
        searchButton.addEventListener('input', () => {
            console.log('input search');    
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

function deleteConvListeners(){
    const button = document.querySelector('.del-chat');
    button.addEventListener('click', async (event)=>{
        let conv_id = button.id;
        console.log('[DEBUG] deleteConvListeners::conv_id - ' + conv_id);
        let media = window.innerWidth <= 950

        if(media){
            toggleSidebar();
            await sleep(400);
        }
        await deleteConv(conv_id);
    });
}

async function deleteConv(conv_id){
    let id = sessionStorage.getItem('sessid');
    const sendData = {
        conv_id : conv_id
    }
    let resData = await postRequest('http://'+IP+':8000/api/convs/'+id+'/remove', sendData);
    console.log('[DEBUG] deleteConv::resData - '+ resData);
    chatSelected = 0;
    closeConv();

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
function closeConvListeners(){
    const button = document.getElementById('close-conv-btn');
    button.addEventListener('click', async (event)=>{
        console.log('click close conv');
        let media = window.innerWidth <= 950

        if(media){
            toggleSidebar();
            await sleep(400);
        }
        closeConv();
    });
}
function cancelFriendReqListeners(){
    const buttons = document.querySelectorAll(".canc-btn");
    buttons.forEach((button)=>{
        button.addEventListener('click', async (event)=>{
            const friendname = button.id;
            await acceptFriend(friendname,'cancel');
        });
    
    });
}
function removeFriendsListeners(){
    const buttons = document.querySelectorAll(".rm-friend-btn");
    buttons.forEach((button)=>{
        button.addEventListener('click', (event)=>{
        
            const friend_id = button.id;
            removeFriend(friend_id);
        });
    });
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

function openConvListeners(){
    const buttons = document.querySelectorAll(".open-conv-btn");
    // console.log(buttons);
    buttons.forEach((button)=>{
        button.addEventListener('click', (event)=>{
            const conv_id = button.id;
            console.log('[DEBUG] openConv clicked'+ conv_id);
            let media = window.innerWidth <= 950
            console.log('[DEBUG] openConv media : '+media)

            if(media){
                toggleSidebar();
            }
            openConv(conv_id);
        });
    });
}
function changeNameListeners(){
    let button = document.getElementById("sub-change")
    button.addEventListener('click', ()=>{
        changeName();
    });
}
async function changeName() {
    const name = document.getElementById('new-name').value;
    console.log('[DEBUG] changeName::name - ' + name)
    const id = sessionStorage.getItem('sessid');
    const sendData = {
        name : name
    };
    const resData = await postRequest('http://'+IP+':8000/api/change_name/'+id, sendData);
    console.log(resData);
    let resLabel = document.getElementById('new-name-status')
    if(resData.status === 'success'){
        resLabel.innerText = resData.content;
        refreshProfile()
    }

}
async function closeConv(){
    //pprocido
    let chatSelected = document.querySelector('.chat-selected');
    let chatDefault = document.querySelector('.chat-not-selected');

    chatDefault.style.display = 'block';
    chatSelected.style.display = 'none';
}
async function openConv(conv_id){

    const name = await getContactName(conv_id);
    let chatSelected = document.querySelector('.chat-selected');
    const delButton = chatSelected.querySelector('.del-chat');
    delButton.id = conv_id;
    deleteConvListeners();
    // console.log('[DEBUG] openConv::messages -' +  messages.status);
    let pfp = document.getElementById('pfp-header');
    let nameSpan = document.getElementById('contact-name');
    // const messages = await getMessages(conv_id);
    // let messagesDiv = document.getElementById('messages');
    let chatDefault = document.querySelector('.chat-not-selected');
    pfp.src = `http://${IP}:8000/upload/${name.content}.png`
    const resStatus = await checkPfp(pfp.src)
    

    //se la risposta e' 404 allora metti l'immagine di default
    if (resStatus === 404) {
        pfp.src = 'https://via.placeholder.com/40';
    }

    chatDefault.style.display = 'none';
    chatSelected.style.display = 'flex';
    selectedChat = conv_id;
    await refreshMessages(conv_id);
    if(name)
        nameSpan.innerText = name.content;
}
async function checkPfp(url){
    const options = {
        method: 'GET',
        headers: {
        'Content-Type': 'application/json'
        }
    };
    const response = await fetch(url, options);
    return response.status
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

        const sendData = {
            friend_id : friend_id
        };

        let resData = await postRequest('http://'+IP+':8000/api/get_conv_id/'+id , sendData);
        console.log('[DEBUG] removeFriend::response :',resData)
        const conv_id = resData.conv_id;
        console.log('[DEBUG] conv_id,', conv_id);
        await deleteConv(conv_id);
    }
    else{
        //error in the backend
        status_label.innerText = resData.status;
        }
    console.log(resData)
}

function closeDropdown(){
    const dropdown = document.getElementById('dropdown');
    dropdown.style.display = 'none';

}
async function getPendingRequests(){
    const id = sessionStorage.getItem('sessid');
    const data = await getRequest('http://' + IP + ':8000/api/friends/' + id +'/pending');
    console.log(data);
    return data;
}
async function getSentRequests(){
    const id = sessionStorage.getItem('sessid');
    const data = await getRequest('http://' + IP + ':8000/api/friends/' + id +'/sent');
    console.log(data);
    return data;
}
async function refreshProfile() {
    const sessid = sessionStorage.getItem('sessid');
    let res = await getRequest('http://'+IP+':8000/profile/'+sessid);
    let user = res.content;
    let username = user.username;
    
    let image_src = res.image;
    
    let profile_name = document.getElementById('profile-name').innerText = username;
    let pfp = document.getElementById("manage-profile-pfp").src = image_src;
}
async function refreshFriends(){
    let pendingData = await getPendingRequests();
    let friendData = await getFriends();
    let sentData = await getSentRequests();
    console.log(friendData);
    console.log(pendingData);
    if(!sentData) return;
    if(!pendingData) return;
    if(!friendData) return;
    const sentDiv = document.getElementById('sent-req');
    const friendDiv = document.getElementById('friends-wrapper'); 
    const pendingDiv = document.getElementById("pending");
    const activeDiv = document.getElementById("active-friends");

    if(friendData.status === 'success'){
        activeDiv.innerHTML = friendData.content;
        friendDiv.innerHTML = friendData.writeTo;
    }else{
        activeDiv.innerHTML = "error fetching friends";
        friendDiv.innerHTML = 'error';
    }
    if(sentData.status === 'success'){
        sentDiv.innerHTML = sentData.content;
    }else{
        sentDiv.innerHTML = "error fetching sent requests";
    }
    
    if(pendingData.status === 'success'){
        pendingDiv.innerHTML = pendingData.content;
    }else{
        pendingDiv.innerHTML = "error fetching pending requests";
    }
    removeFriendsListeners();
    acceptFriendListeners();
    refuseFriendListeners();
    writeToListeners();
    cancelFriendReqListeners();
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


async function newFriend(){
    let id = sessionStorage.getItem('sessid');
    let status_label = document.getElementById('res-friend');
    const friendname = document.getElementById('friend-name');
    const sendData = {
        name : friendname.value
    }
    const resData = await postRequest('http://'+IP+':8000/api/friends/'+id,sendData); 
    console.log(resData) 
    if(resData.status === 'success'){
        status_label.innerText = resData.content;
    }else{
        status_label.innerText = resData.content;
    }
}

function toggleSidebar(){
    let navBar = document.getElementById("sidebar");
    navBar.style.left = navBar.style.left == "0px" ? "-100%" : "0px"

}

//TODO
    //
    //add a friendship system (update db) <-- leonardo (fatto)
    //
    //how to manage user session (fatto(?))
    //  
    //implement newChat(), newFriend() (fatto)
    //
    //in removeFriends() lato server eliminare anche le conversazionie i messaggi tra i due se esistono
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