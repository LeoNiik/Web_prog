document.addEventListener("DOMContentLoaded", function() {
    var textElement = document.getElementById("movingText");
    var position = 0;
    var speed = 2; // Velocità di movimento (pixel per frame)

    function moveText() {
        position += speed;
        textElement.style.left = position + 'px';
        textElement.style.top = position +'px';
        // Se il testo esce dal bordo destro della finestra, riportalo all'inizio
        if (position > window.innerWidth) {
            position = -textElement.offsetWidth;
        }else if(position > window.innerHeight){
            position = -textElement.offsetHeight;
        }

        requestAnimationFrame(moveText);
    }

    moveText();
});

