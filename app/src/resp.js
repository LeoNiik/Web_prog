
var navBar;
document.addEventListener("DOMContentLoaded", function() {
    navBar = document.getElementById("navBar");
    hideMenu();
});
  
function showMenu(){
    navBar.style.right = "0";
}
  
function hideMenu(){
    navBar.style.right = "-200px";
}