'use strict';

let gl;                         // The webgl context.
let surface;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.
let sphere;

let startScalePoint = [0.5,0.5]
let textureScale = 1.0;
let center = [0, 0, 0];

let sphereRadius = 0.1; // Радіус сфери
let latitudeBands = 30; // Кількість сегментів по широті
let longitudeBands = 30; // Кількість сегментів по довготі

// Constructor
function ShaderProgram(name, program) {

    this.name = name;
    this.prog = program;

    this.iAttribVertex = -1;
    this.iAttribNormal = -1;
    this.iAttribTextureCoord = -1;
    this.iModelViewProjectionMatrix = -1;
    this.iModelViewMatrix  = -1;
    this.iColor = -1;
    this.iLightPos = -1;
    this.iViewPos = -1;
    this.iStartScalePoint = -1;
    this.iTextureScale = -1;

    this.Use = function() {
        gl.useProgram(this.prog);
    }
}

let radius = 20.0;
let lightHeight = 5;
let angle = 0.0;

function updateLightPosition() {
    angle += 0.05;
    if (angle > 2 * Math.PI) {
        angle -= 2 * Math.PI;
    }

    let x = radius * Math.cos(angle);
    let y = radius * Math.sin(angle);
    let z = lightHeight;

    return [x, y, z];
}

/* Draws a colored cube, along with a set of coordinate axes.
 * (Note that the use of the above drawPrimitive function is not an efficient
 * way to draw with WebGL.  Here, the geometry is so simple that it doesn't matter.)
 */
function draw() { 
    gl.clearColor(0, 0.2, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    textureScale = document.getElementById("scaleSlider").value;
    let cVertex = surfaceEquation(startScalePoint[0], startScalePoint[1]);
    center = [cVertex.p[0], cVertex.p[1], cVertex.p[2]];

    // Update the light position in a circular motion
    const lightPos = updateLightPosition();

    /* Set the values of the projection transformation */
    let projection = m4.perspective(Math.PI/8, 1, 8, 12); 

    let modelView = spaceball.getViewMatrix();
    let rotateToPointZero = m4.axisRotation([0.707,0.707,0], 0.7);
    let translateToPointZero = m4.translation(0,0,-10);

    let matAccum0 = m4.multiply(rotateToPointZero, modelView);
    let matAccum1 = m4.multiply(translateToPointZero, matAccum0);
        
    let modelViewProjectionMatrix = m4.multiply(projection, matAccum1);

    gl.uniform3fv(shProgram.iLightPos, lightPos);
    gl.uniform4fv(shProgram.iColor, [1.0, 0.0, 0.0, 1.0]);
    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjectionMatrix);
    gl.uniformMatrix4fv(shProgram.iModelViewMatrix, false, matAccum1);
    gl.uniform3fv(shProgram.iViewPos, [0.0, 0.0, 1.0]);

    gl.uniform1i(shProgram.hasTexture, true);
    surface.Draw();

    // gl.useProgram(shProgram.prog);
    // gl.uniform3fv(shProgram.iLightPos, lightPos);
    // gl.uniform3fv(shProgram.iViewPos, [0.0, 0.0, 1.0]);
    // gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjectionMatrix);
    // gl.uniformMatrix4fv(shProgram.iModelViewMatrix, false, matAccum1);
    
    gl.uniform2f(shProgram.iStartScalePoint, map(startScalePoint[0], 0, Math.PI * 2, 0, 1), map(startScalePoint[1], 0, b, 0, 1));
    gl.uniform1f(shProgram.iTextureScale, textureScale);
    gl.uniform1i(shProgram.hasTexture, false);
    sphere.DisplayPoint();

    gl.uniform1i(shProgram.hasTexture, true); 
}

function map(value, a, b, c, d) {
    value = (value - a) / (b - a);
    return c + value * (d - c);
}


/* Initialize the WebGL context. Called from init() */
function initGL() {
    let prog = createProgram( gl, vertexShaderSource, fragmentShaderSource );

    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();

    shProgram.iAttribVertex              = gl.getAttribLocation(prog, "vertex");
    shProgram.iAttribNormal              = gl.getAttribLocation(prog, "normal");
    shProgram.iAttribTextureCoord        = gl.getAttribLocation(prog, "texCoord");
    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    shProgram.iModelViewMatrix           = gl.getUniformLocation(prog, "ModelViewMatrix");
    shProgram.iColor                     = gl.getUniformLocation(prog, "color");
    shProgram.iLightPos                  = gl.getUniformLocation(prog, "lightPos");
    shProgram.iViewPos                   = gl.getUniformLocation(prog, "viewPos");
    shProgram.iStartScalePoint           = gl.getUniformLocation(prog, "startScalePoint")
    shProgram.iTextureScale              = gl.getUniformLocation(prog, "textureScale")
    shProgram.hasTexture              = gl.getUniformLocation(prog, "hasTexture")

    let data = {};
    
    CreateSurfaceData(data)

    surface = new Model('Surface');
    surface.BufferData(data.verticesF32, data.indicesU16, data.normalsF32, data.textCoordF32);

    surface.iTextureDiffuse  = LoadTexture('textures/diffuse1.jpg');
    surface.iTextureSpecular = LoadTexture('textures/specular1.jpg');
    surface.iTextureNormal = LoadTexture('textures/normal1.jpg');

    gl.enable(gl.DEPTH_TEST);
}


/* Creates a program for use in the WebGL context gl, and returns the
 * identifier for that program.  If an error occurs while compiling or
 * linking the program, an exception of type Error is thrown.  The error
 * string contains the compilation or linking error.  If no error occurs,
 * the program identifier is the return value of the function.
 * The second and third parameters are strings that contain the
 * source code for the vertex shader and for the fragment shader.
 */
function createProgram(gl, vShader, fShader) {
    let vsh = gl.createShader( gl.VERTEX_SHADER );
    gl.shaderSource(vsh,vShader);
    gl.compileShader(vsh);
    if ( ! gl.getShaderParameter(vsh, gl.COMPILE_STATUS) ) {
        throw new Error("Error in vertex shader:  " + gl.getShaderInfoLog(vsh));
     }
    let fsh = gl.createShader( gl.FRAGMENT_SHADER );
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);
    if ( ! gl.getShaderParameter(fsh, gl.COMPILE_STATUS) ) {
       throw new Error("Error in fragment shader:  " + gl.getShaderInfoLog(fsh));
    }
    let prog = gl.createProgram();
    gl.attachShader(prog,vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if ( ! gl.getProgramParameter( prog, gl.LINK_STATUS) ) {
       throw new Error("Link error in program:  " + gl.getProgramInfoLog(prog));
    }
    return prog;
}


/**
 * initialization function that will be called when the page has loaded
 */
function init() {
    let canvas;
    try {
        canvas = document.getElementById("webglcanvas");
        gl = canvas.getContext("webgl");
        if ( ! gl ) {
            throw "Browser does not support WebGL";
        }
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }
    try {
        initGL(); 
        spaceball = new TrackballRotator(canvas, draw, 0);
        if (!animationId) {
            animate();
        }
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        return;
    }
    
}

let animationId = null;

function animate() {
    let sphereVertices = generateSphere(center, sphereRadius, latitudeBands, longitudeBands);
    sphere.PointBufferData(sphereVertices);
    draw();
    requestAnimationFrame(animate);
}


document.addEventListener("keydown", (event) => {
    let uMax = (uPolysNum - 1) * stepU;
    let vMax = (vPolysNum - 1) * stepV;
    const step = 0.01;
    
    switch (event.key) {
        case "w":
            startScalePoint[1] += step;
            if (startScalePoint[1] > vMax) {
                startScalePoint[1] = vMax;
            }
            break;
        case "s":
            startScalePoint[1] -= step;
            if (startScalePoint[1] < 0) {
                startScalePoint[1] = 0;
            }
            break;
        case "a":
            startScalePoint[0] -= step;
            if (startScalePoint[0] < 0) {
                startScalePoint[0] = 0;
            }
            break;
        case "d":
            startScalePoint[0] += step;
            if (startScalePoint[0] > uMax) {
                startScalePoint[0] = uMax;
            }
            break;
    }
    draw();    
});
