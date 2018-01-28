module.exports = function (originalCanvas, originalContext) {

    let canvas = document.createElement('canvas')
    canvas.height = originalCanvas.height
    canvas.width = originalCanvas.width
    let ctx = canvas.getContext('2d')

    var particles = [];
    var delta = 0;
    var last = Date.now();

    function animate() {
        delta = Date.now() - last;
        last = Date.now();

        let newParticles = []
        for (var i = 0; i < particles.length; i++) {
            var p = Object.assign({}, particles[i]);
            p.x += Math.cos(p.angle) * 4 + Math.random() * 2 - Math.random() * 2;
            p.y += Math.sin(p.angle) * 4 + Math.random() * 2 - Math.random() * 2;
            p.life -= delta;
            p.size -= delta / 10;

            if (p.size > 0) {
                newParticles.push(p)
            }
        }
        particles = newParticles
    }

    function render() {
        let color = particles.length && particles[0].color
        ctx.fillStyle = color;
        for (var i = 0; i < particles.length; i++) {
            if (ctx.fillStyle !== particles[i].color) {
                ctx.fillStyle = particles[i].color
            }

            if (Math.random() < 0.1) {
                continue;
            }
            var p = particles[i];
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2, false);
            ctx.fill();
        }

        originalContext.drawImage(canvas, 0, 0, canvas.width, canvas.height)
    }

    return {
        addTrail(x, y, size = 1) {
            for (let i = 0; i < 12; i++) {
                particles.push({
                    x,
                    y,
                    angle: i,
                    size: 1 + size * Math.random(),
                    color: '#F00'
                });
            }
        },
        addBurn(x, y, size = 1) {
            for (let i = 0; i < 12; i++) {
                particles.push({
                    x,
                    y,
                    angle: i,
                    size: 1 + size * Math.random(),
                    color: '#000'
                });
            }
        },
        add(x, y) {
            for (let i = 0; i < 36 * 2; i++) {
                particles.push({
                    x,
                    y,
                    angle: i * 5,
                    size: 5 + Math.random() * 3,
                    color: '#F00'
                });
            }
        },
        animateAndDraw() {
            animate()
            render()
        }
    };
}