document.addEventListener("DOMContentLoaded", function() {
    hideMenu();
    });
    
function showMenu(){
    let navBar = document.getElementById("navBar");
    navBar.style.right = "0";
}
  
function hideMenu(){
    let navBar = document.getElementById("navBar");
    navBar.style.right = "-200px";
}

