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

    // Location of the attribute variable in the shader program.
    this.iAttribVertex = -1;
    this.iAttribNormal = -1;
    this.iAttribTextureCoord = -1;

    // Location of the uniform specifying a color for the primitive.
    this.iColor = -1;
    // Location of the uniform matrix representing the combined transformation.
    this.iModelViewProjectionMatrix = -1;

    this.iLightPos = -1;

    this.Use = function() {
        gl.useProgram(this.prog);
    }
}

// Variables for light motion
let radius = 2.0; // Radius of the circular path
let lightHeight = 0.1; // Height of the light above the surface
let angle = 0.0; // Initial angle
let speed = 0.05; // Speed of the light's circular motion

function updateLightPosition() {
    // Update the angle for the circular motion
    angle += 0.05;
    if (angle > 2 * Math.PI) {
        angle -= 2 * Math.PI; // Keep the angle within [0, 2π]
    }

    let x = radius * Math.cos(angle);
    let z = radius * Math.sin(angle);
    let y = lightHeight; // Keep the light at a fixed height

    // Return the updated light position as a vector
    return [x, y, z];
}


/* Draws a colored cube, along with a set of coordinate axes.
 * (Note that the use of the above drawPrimitive function is not an efficient
 * way to draw with WebGL.  Here, the geometry is so simple that it doesn't matter.)
 */
function draw() { 
    gl.clearColor(0,0,0,1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // Update the light position in a circular motion
    let lightPos = updateLightPosition();

    // Pass the light position to the shader
    gl.uniform3fv(shProgram.iLightPos, lightPos);

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

    
    /* Draw the six faces of a cube, with different colors. */
    gl.uniform4fv(shProgram.iColor, [1.0, 0.0, 0.0, 1.0]); // Example: red color
    
    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjectionMatrix);

    surface.Draw();
}


/* Initialize the WebGL context. Called from init() */
function initGL() {
    let prog = createProgram( gl, vertexShaderSource, fragmentShaderSource );

    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();

    shProgram.iAttribVertex              = gl.getAttribLocation(prog, "vertex");
    shProgram.iAttribNormal              = gl.getAttribLocation(prog, "normal");
    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    shProgram.iColor                     = gl.getUniformLocation(prog, "color");
    shProgram.iLightPos = gl.getUniformLocation(prog, "lightPos");

    let data = {};
    
    CreateSurfaceData(data)

    surface = new Model('Surface');
    surface.BufferData(data.verticesF32, data.indicesU16, data.normalsF32, data.textCoordF32);

    surface.iTextureDiffuse  = LoadTexture("https://webglfundamentals.org/webgl/resources/f-texture.png");
    surface.iTextureSpecular = LoadTexture("https://webglfundamentals.org/webgl/resources/keyboard.jpg");
    surface.iTextureNormal = LoadTexture("https://texturelabs.org/wp-content/uploads/Texturelabs_Grunge_264thumbnail.jpg");

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