'use strict';

let gl;                         // The webgl context.
let surface;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.

document.getElementById("draw").addEventListener("click", redraw);

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
    
    // Update the light position in a circular motion
    const lightPos = updateLightPosition();

    /* Set the values of the projection transformation */
    let projection = m4.perspective(Math.PI/8, 1, 8, 12); 
    
    /* Get the view matrix from the SimpleRotator object.*/
    let modelView = spaceball.getViewMatrix();

    let rotateToPointZero = m4.axisRotation([0.707,0.707,0], 0.7);
    let translateToPointZero = m4.translation(0,0,-10);

    let matAccum0 = m4.multiply(rotateToPointZero, modelView);
    let matAccum1 = m4.multiply(translateToPointZero, matAccum0);
        
    /* Multiply the projection matrix times the modelview matrix to give the
       combined transformation matrix, and send that to the shader program. */
    let modelViewProjectionMatrix = m4.multiply(projection, matAccum1);

    gl.uniform3fv(shProgram.iLightPos, lightPos);
    gl.uniform4fv(shProgram.iColor, [1.0, 0.0, 0.0, 1.0]);
    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjectionMatrix);
    gl.uniformMatrix4fv(shProgram.iModelViewMatrix, false, matAccum1);
    gl.uniform3fv(shProgram.iViewPos, [0.0, 0.0, 1.0]);

    surface.Draw();
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

    let data = {};
    
    CreateSurfaceData(data)

    surface = new Model('Surface');
    surface.BufferData(data.verticesF32, data.indicesU16, data.normalsF32, data.textCoordF32);

    surface.iTextureDiffuse  = LoadTexture('textures/diffuse.jpg');
    surface.iTextureSpecular = LoadTexture('textures/specular.png');
    surface.iTextureNormal = LoadTexture('textures/normal.png');

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
    draw();
    animationId = requestAnimationFrame(animate);
}

function redraw() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (surface) {
        gl.deleteBuffer(surface.vertexBuffer);
        gl.deleteBuffer(surface.normalBuffer);
    }

    if (shProgram) {
        gl.deleteProgram(shProgram.prog);
    }

    // Reset variables
    surface = null;
    shProgram = null;

    init()
}