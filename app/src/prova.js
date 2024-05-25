document.addEventListener("DOMContentLoaded", function() {
    showConvs();
    document.addEventListener("keypress", function(event) {
        // If the user presses the "Enter" key on the keyboard
        if (event.key === "Enter") {
          // Cancel the default action, if needed
          event.preventDefault();
          // Trigger the button element with a click
          document.getElementById('login-btn').click();
        }
    });
});
function loginHandler() {
    console.log(new Date().valueOf())
    username = document.getElementById('username').value
    password = document.getElementById('password').value
    btn = document.getElementById('login-btn')
    btn.innerText = '. . .'
    btn.className = 'loading-btn'
    err = document.getElementById('err-text')
    //add user input check



    const data = {
        username,
        password
    };
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    };
    console.log(options.body)
    fetch('http://localhost:8000/api/login', options)
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        if(data.status == 'success'){
            //salvo il session id nella cache, rimuovo se era gia presente
            localStorage.removeItem('sessid');
            //login succesful
            localStorage.setItem('sessid', data.sessid);
            window.location.href = '/home';
        }
        else{
            //login failed
            btn.innerText = 'Login';
            btn.className = 'btn';
            err.innerText= data.status;
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

function getRequestWithTimeout(url) {
    return new Promise((resolve, reject) => {
        // Set a timeout to delay the fetch request
        setTimeout(() => {
        fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
                return response.json(); // Assuming the response is JSON
            })
        .then(data => resolve(data))
        .catch(error => reject(error));
        }, 1000); // 1 second timeout
    });
}
// Usage example

function showChat(){
    let id = localStorage.getItem('sessid');
    fetch('http:/localhost:8000/api/chat/'+id)
    .then(data => {
        console.log(data);
    })
    .catch(error => console.error('Error:', error));
    return;
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
        }
        else{
            //error in the backend
            //sidebar.innerHTML += "clicca per riprovare"
        }
    })
    .catch(error => console.error('Error:', error));
    return;
}

function signupHandler() {

    let username = document.getElementById('username').value;
    let password = document.getElementById('password').value;
    let conf_password = document.getElementById('conf-password').value;
    let btn = document.getElementById('login-btn');
    btn.innerText = '. . .';
    btn.className = 'loading-btn';
    let err = document.getElementById('err-text');
    //add user input check


    if(password != conf_password){
        err.innerText = 'le password non coincidono'
        return
    }else{
        err.innerText = ''
    }
    const data = {
        username,
        password
    };
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    };

    fetch('http://localhost:8000/api/signup', options)
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        if(data.status === 'success'){
            //sign up succesful
            window.location.href = '/login';
        }else{
            //sign up failed
            btn.innerText = 'Sign up';
            btn.className = 'btn';
            err.innerText= data.status;
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });

}


