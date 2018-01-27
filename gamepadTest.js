var haveEvents = 'ongamepadconnected' in window;
var controllers = {};

let ball1 = Ball(100, 100, 'red')
ball1.init()
let ball2 = Ball(300, 300, 'blue')
ball2.init()

function Ball(startX, startY, color) {
    
    let size = 1
    let x = startX;
    let y = startY;
    let element = document.createElement('div');
    
    return {
        init,
        updateElement,
        updatePosition,
        getPosition,
        moveTowards,
        makeBigger
    }
    
    function init() {
        let ball = element
        ball.style.position = 'absolute'
        ball.style.top = y + 'px'
        ball.style.left = x + 'px'
        ball.style.height = (10 * size) + 'px'
        ball.style.width = (10 * size) + 'px'
        ball.style.borderRadius = '99px'
        ball.style.backgroundColor = color
        document.body.appendChild(ball)
    }
    
    function updateElement() {
        element.style.top = y + 'px'
        element.style.left = x + 'px'
    }
    
    function updateSize() {
        element.style.height = (10 * size) + 'px'
        element.style.width = (10 * size) + 'px'
    }
    
    function updatePosition(xf, yf) {
        let multi = Math.pow(1 / size, .1)
        x = x + 20 * xf * multi
        y = y + 20 * yf * multi
    }
    
    function moveTowards({x: tx, y: ty}, delta) {
        x += (tx - x) * 1 * delta
        y += (ty - y) * 1 * delta
    }
    
    function getPosition() {
        return {x, y}
    }
    
    function makeBigger() {
        size += .1
        updateSize()
    }
}

function connecthandler(e) {
    addgamepad(e.gamepad);
}

function addgamepad(gamepad) {
    if (gamepad.id.includes('Xbox 360')) {
        controllers[gamepad.index] = gamepad;
    }
}

function disconnecthandler(e) {
    removegamepad(e.gamepad);
}

function removegamepad(gamepad) {
    delete controllers[gamepad.index];
}

let prevTime = 0

function updateStatus(time) {
    let delta = ((time - prevTime) * .001) || .016
    prevTime = time
    if (!haveEvents) {
        scangamepads();
    }
    
    var i = 0;
    var j;
    
    for (j in controllers) {
        var controller = controllers[j];
        if (controller.buttons[0].pressed) {
            ball1.makeBigger()
        }
        if (Math.abs(controller.axes[0]) > .2 || Math.abs(controller.axes[1]) > .2) {
            ball1.updatePosition(controller.axes[0], controller.axes[1])
            ball1.updateElement()
        }
        
        if (controller.buttons[1].pressed) {
            ball2.makeBigger()
        }
        if (Math.abs(controller.axes[2]) > .2 || Math.abs(controller.axes[3]) > .2) {
            ball2.updatePosition(controller.axes[2], controller.axes[3])
            ball2.updateElement()
        }
        
    }
    
    ball1.moveTowards(ball2.getPosition(), delta)
    ball2.moveTowards(ball1.getPosition(), delta)
    
    ball1.updateElement()
    ball2.updateElement()
    
    requestAnimationFrame(updateStatus);
}

function scangamepads() {
    var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
    for (var i = 0; i < gamepads.length; i++) {
        if (gamepads[i]) {
            if (gamepads[i].index in controllers) {
                controllers[gamepads[i].index] = gamepads[i];
            } else {
                addgamepad(gamepads[i]);
            }
        }
    }
}


window.addEventListener("gamepadconnected", connecthandler);
window.addEventListener("gamepaddisconnected", disconnecthandler);

if (!haveEvents) {
    setInterval(scangamepads, 500);
}
updateStatus()
