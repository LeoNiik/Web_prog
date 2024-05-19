document.addEventListener("DOMContentLoaded", function() {
    
});
function loginHandler() {
    console.log('diocane')
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
    })
    .catch((error) => {
        console.error('Error:', error);
    });

}


