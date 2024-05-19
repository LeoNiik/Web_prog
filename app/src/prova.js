document.addEventListener("DOMContentLoaded", function() {
    
});
function loginHandler() {
    console.log(new Date().valueOf())
    username = document.getElementById('username').value
    password = document.getElementById('password').value

  
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
            //login succesful
            
        }else{
            //login failed
        
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });

}

function signupHandler() {

    username = document.getElementById('username').value
    password = document.getElementById('password').value
    conf_password = document.getElementById('conf-password').value
    err = document.getElementById('err-text')
    console.log(err)
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
    console.log(options.body)
    fetch('http://localhost:8000/api/signup', options)
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        if(data.status == 'success'){
            //sign up succesful
            // location.replace('/home')
        }else{
            //sign up failed
            err.innerText= 'login failed wrong credentials'
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });

}


