const state = {}

// https://www.red3d.com/cwr/boids/

const getBoid = () => {
    return {
        pos: createVector(random(0, width), random(0, height)),
        vel: createVector(2, 0).rotate(random(0, 360)),
        color: random(200, 255),
        numNeighbours: 0,
    }
}

function windowResized() {
    const canvasId = "p5CanvasDiv"
    const canvasDiv = document.getElementById(canvasId)
    resizeCanvas(canvasDiv.offsetWidth, 500);
}

function toggleDbg() {
    state.debug = !state.debug
}

function updateSliderText(sliderId, value) {
    const x = document.getElementById(sliderId)
    x.innerHTML = `${value} / 100`
}

function setup() {
    const canvasId = "p5CanvasDiv"
    const canvasDiv = document.getElementById(canvasId)
    const canvas = createCanvas(canvasDiv.offsetWidth, 500)
    canvas.parent(canvasId)
    rectMode(CENTER)
    angleMode(DEGREES)

    state.i = 0
    state.overall = 0
    state.randomSpawn = true
    state.boids = []
    state.center = createVector(width / 2, height / 2)
    state.maxNeighbours = 0
    state.minNeighbours = Infinity
    state.cohesion = 50
    state.alignment = 60
    state.seperation = 40
    updateSliderText("cohesionSliderValue", state.cohesion)
    updateSliderText("seperationSliderValue", state.seperation)
    updateSliderText("alignmentSliderValue", state.alignment)

    const max = 90
    for (let i = 0; i < max; i++) {
        const boid = getBoid()
        if (state.randomSpawn) {
            state.boids.push(boid)
            continue
        }

        const rotation = (360 / max) * i
        boid.pos.x = 100
        boid.pos.y = 0
        boid.pos.rotate(rotation)
        boid.pos.add(state.center)

        boid.vel.x = 0
        boid.vel.y = 2
        boid.vel.rotate(rotation)

        state.boids.push(boid)
    }

    const cohesionSlider = document.getElementById("cohesionSlider");
    cohesionSlider.value = state.cohesion
    state.cohesion = cohesionSlider.value
    cohesionSlider.oninput = function () {
        state.cohesion = this.value
        updateSliderText("cohesionSliderValue", state.cohesion)
    }

    const seperationSlider = document.getElementById("seperationSlider");
    seperationSlider.value = state.seperation
    state.seperation = seperationSlider.value
    seperationSlider.oninput = function () {
        state.seperation = this.value
        updateSliderText("seperationSliderValue", state.seperation)
    }

    const alignmentSlider = document.getElementById("alignmentSlider");
    alignmentSlider.value = state.alignment
    state.alignment = alignmentSlider.value
    alignmentSlider.oninput = function () {
        state.alignment = this.value
        updateSliderText("alignmentSliderValue", state.alignment)
    }

}

function draw() {
    background(130, 130, 130)

    state.i += 1
    if (state.i > 0) {
        updateBoids()
        outOfScreen()
    }

    drawBoids()
}

function mousePressed() {
    const mousePos = createVector(mouseX, mouseY)
    const b = getBoid()
    b.pos = mousePos
    state.boids.push(b)
}

const updateBoids = () => {
    state.maxNeighbours = 0
    state.minNeighbours = Infinity
    state.boids.forEach((g, i) => {

        const newHeading = createVector(0, 0)
        let changed = false

        const selected = state.boids.filter(other => other != g)

        const inRange = (arr, range) => {
            return arr.filter(e => e.pos.dist(g.pos) < range)
        }

        let numNeighbours = 0

        // seperation -> steer away from group
        let others = inRange(selected, state.seperation / 2)
        numNeighbours += others.length
        if (others.length > 0) {
            const seperation = createVector(0, 0)
            others.forEach(other => {
                const direction = other.pos.copy().sub(g.pos)
                seperation.add(direction)
            })
            seperation.rotate(180)
            seperation.mult(12)
            newHeading.add(seperation)
            changed = true

            if (state.debug) {
                stroke(0, 0, 255)
                line(g.pos.x, g.pos.y, g.pos.x + seperation.x / 10, g.pos.y + seperation.y / 10)
            }
        }

        // cohesion -> steer to center of group
        others = inRange(selected, state.cohesion)

        numNeighbours += others.length
        if (others.length > 0) {
            const center = g.pos.copy()
            others.forEach(other => {
                center.add(other.pos)
            })
            center.div(others.length + 1)
            center.sub(g.pos)
            newHeading.add(center)
            changed = true

            if (state.debug) {
                stroke(0, 255, 0)
                line(g.pos.x, g.pos.y, g.pos.x + center.x, g.pos.y + center.y)
            }
        }

        // alignment -> align with direction of group
        others = inRange(selected, state.alignment * 2)

        numNeighbours += others.length
        if (others.length > 0) {
            const groupAlignment = g.vel.copy()
            others.forEach(other => {
                groupAlignment.add(other.vel)
            })
            groupAlignment.normalize().mult(20)
            newHeading.add(groupAlignment)
            changed = true

            if (state.debug) {
                stroke(255, 0, 0)
                line(g.pos.x, g.pos.y, g.pos.x + groupAlignment.x, g.pos.y + groupAlignment.y)
            }
        }

        // rotate in direction fo new angle
        if (changed) {
            g.numNeighbours = numNeighbours
            const angle = g.vel.angleBetween(newHeading)
            const mapped = map(angle, -180, 180, -15, 15)
            g.vel.rotate(mapped)
        }

        state.maxNeighbours = numNeighbours > state.maxNeighbours ? numNeighbours : state.maxNeighbours
        state.minNeighbours = numNeighbours < state.minNeighbours ? numNeighbours : state.minNeighbours

        g.pos.add(g.vel)
    })

}

const drawBoids = () => {
    stroke(0)
    state.boids.forEach(g => {
        push()
        translate(g.pos.x, g.pos.y)
        rotate(g.vel.heading())
        let b = map(g.numNeighbours, state.minNeighbours, state.maxNeighbours, 0, 255)
        b = b > 255 ? 255 : b
        fill(0, 0, b)
        beginShape();
        const x = 5
        vertex(-x, -x);
        vertex(x * 2, 0);
        vertex(-x, x);
        vertex(-x * 2, 0);
        vertex(-x, -x);
        endShape(CLOSE);
        pop()
    })
}

const outOfScreen = () => {
    state.boids.forEach(g => {
        if (g.pos.x > width) {
            g.pos.x = 0
        }

        if (g.pos.x < 0) {
            g.pos.x = width
        }

        if (g.pos.y > height) {
            g.pos.y = 0
        }

        if (g.pos.y < 0) {
            g.pos.y = height
        }
    })
}
