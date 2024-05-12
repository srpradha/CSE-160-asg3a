// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  varying vec2 v_UV;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  uniform float u_Size;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform int u_whichTexture;
  void main() {
    if (u_whichTexture == -2) {
      gl_FragColor = u_FragColor;
    }
    else if (u_whichTexture == -1) {
      gl_FragColor = vec4(v_UV, 1.0, 1.0);
    }
    else if (u_whichTexture == 0) {
      gl_FragColor = texture2D(u_Sampler0, v_UV);
    }
    else if (u_whichTexture == 1) {
      gl_FragColor = texture2D(u_Sampler1, v_UV);
    }
    else {
      gl_FragColor = vec4(1, 0.2, 0.2, 1);
    }
  }`;

// Global Variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
// let u_Size;
let u_ModelMatrix;
let g_globalAngle = 0;
let u_GlobalRotateMatrix;

let g_globalX = 0;
let g_globalY = 0;
let g_globalZ = 0;
let g_origin = [0, 0];

let a_UV;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_Sampler0;
let u_Sampler1;
let u_whichTexture;

function resetGlobals() {
    g_globalX = 0;
    g_globalY = 0;
    g_globalZ = 0;
    g_globalOrigin = [0, 0];
}


function setupWebGL() {
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    gl.enable(gl.DEPTH_TEST);
    // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function connectVariablesToGLSL() {
    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initialize shaders.');
        return;
    }

    // Get the storage location of a_Position
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return;
    }

    // Get the storage location of u_FragColor
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }

    // Get the storage location of u_ModelMatrix
    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
        console.log('Failed to get the storage location of u_ModelMatrix');
        return;
    }

    // Get the storage location of u_GlobalRotateMatrix
    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
    if (!u_GlobalRotateMatrix) {
        console.log('Failed to get the storage location of u_GlobalRotateMatrix');
        return;
    }

    // Get the storage location of a_UV
    a_UV = gl.getAttribLocation(gl.program, 'a_UV');
    if (a_UV < 0) {
        console.log('Failed to get the storage location of a_UV');
        return;
    }

    u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    if (!u_ViewMatrix) {
        console.log('Failed to get the storage location of u_ViewMatrix');
        return;
    }

    u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
    if (!u_ProjectionMatrix) {
        console.log('Failed to get the storage location of u_ProjectionMatrix');
        return;
    }

    u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
    if (!u_Sampler0) {
        console.log('Failed to get the storage location of u_Sampler0');
        return;
    }

    u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
    if (!u_Sampler0) {
        console.log('Failed to get the storage location of u_Sampler1');
        return;
    }

    u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
    if (!u_whichTexture) {
        console.log('Failed to get the storage location of u_whichTexture');
        return;
    }

    // // Get the storage location of u_Size
    // u_Size = gl.getUniformLocation(gl.program, 'u_Size');
    // if (!u_Size) {
    //     console.log('Failed to get the storage location of u_Size');
    //     return;
    // }

    // Set initial value for matrix to identity matrix
    var identityM = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

function main() {

    setupWebGL();
    connectVariablesToGLSL();
    addActionsForHtmlUI();

    // Register function (event handler) to be called on a mouse press
    document.onkeydown = keydown;

    initTextures();

    // Specify the color for clearing <canvas>
    // gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearColor(211 / 255, 211 / 255, 211 / 255, 1.0);

    // Render
    requestAnimationFrame(tick);
    // gl.clear(gl.COLOR_BUFFER_BIT);
    // renderAllShapes();
}

var g_eye = [0, 0, 3];
var g_at = [0, 0, -100];
var g_up = [0, 1, 0];

function keydown(ev) {
    // 'D' key
    if (ev.keyCode == 65) {
        g_eye[0] -= 0.2;
    }

    // 'A' key
    else if (ev.keyCode == 68) {
        g_eye[0] += 0.2;
    }

    // 'S' key
    else if (ev.keyCode == 83) {
        g_eye[2] += 0.2;
    }

    // 'W' key
    else if (ev.keyCode == 87) {
        g_eye[2] -= 0.2;
    }

    renderAllShapes();
    console.log(ev.keyCode);
}

var g_startTime = performance.now() / 1000.0;
var g_seconds = performance.now() / 1000.0 - g_startTime;

function tick() {
    // print some debug info
    g_seconds = performance.now() / 1000.0 - g_startTime;

    // draw everything
    renderAllShapes();

    // tell the browser to update again
    requestAnimationFrame(tick);
}


function convertCoordinatesEventToGL(ev) {
    var x = ev.clientX; // x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer

    let temp = [x, y];
    x = (x - g_globalOrigin[0]) / 400;
    y = (y - g_globalOrigin[1]) / 400;
    g_globalOrigin = temp;

    return ([x, y]);
}

// animation globals
let g_armAnimation = false;
let g_bodyAngle = 0;
let g_armL1Angle = 0;
let g_armL2Angle = 0;
let g_armL3Angle = 0;


function renderAllShapes() {

    // start time
    var startTime = performance.now();

    var projMat = new Matrix4();
    projMat.setPerspective(30, 1 * canvas.width / canvas.height, 1, 100);
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);

    var viewMat = new Matrix4();
    viewMat.setLookAt(g_eye[0], g_eye[1], g_eye[2], g_at[0], g_at[1], g_at[2], g_up[0], g_up[1], g_up[2]);
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

    // rotate the object
    var globalRotMat = new Matrix4();
    globalRotMat.rotate(g_globalX, 1, 0, 0); // x-axis
    globalRotMat.rotate(g_globalY, 0, 1, 0); // y-axis
    globalRotMat.rotate(g_globalZ, 0, 0, 1); // z-axis

    // pass the matrix to u_ModelMatrix.attribute
    // var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    // skybox
    var sky = new Cube();
    sky.color = [1.0, 0.0, 0.0, 1.0];
    sky.textureNum = 0;
    sky.matrix.scale(50, 50, 50);
    sky.matrix.translate(-0.5, -0.5, -0.5);
    sky.render();

    // floor
    var floor = new Cube();
    floor.color = [1.0, 0.0, 0.0, 1.0];
    floor.textureNum = 1;
    floor.matrix.translate(0, -0.75, 0.0);
    floor.matrix.scale(10, 0.01, 10);
    floor.matrix.translate(-0.5, 0.0, -0.5);
    floor.render();

    // test
    // drawTriangle3D([-1.0,0.0,0.0, -0.5, -1.0, 0.0, 0.0, 0.0, 0.0]);

    // draw the body cube
    var body = new Cube();
    body.color = [250 / 255, 240 / 255, 40 / 255, 1.0];
    body.matrix.translate(-0.25, -0.25, 0.0);
    body.matrix.rotate(g_bodyAngle, 0, 0, 1);
    body.matrix.scale(0.5, 0.5, 0.2);
    body.render();

    var eye1 = new Cube();
    eye1.color = [0, 0, 0, 1];
    eye1.matrix.translate(0.1, 0.2, -0.05);
    eye1.matrix.rotate(g_bodyAngle, 0, 0, 1);
    eye1.matrix.scale(0.1, 0.1, 0.1);
    eye1.render();

    var eye2 = new Cube();
    eye2.color = [0, 0, 0, 1];
    eye2.matrix.translate(-0.2, 0.2, -0.05);
    eye2.matrix.rotate(g_bodyAngle, 0, 0, 1);
    eye2.matrix.scale(0.1, 0.1, 0.1);
    eye2.render();

    var mouth = new Cube();
    mouth.color = [0, 0, 0, 1];
    mouth.matrix.translate(-0.2, -0.2, -0.05);
    mouth.matrix.rotate(g_bodyAngle, 0, 0, 1);
    mouth.matrix.scale(0.4, 0.2, 0.1);
    mouth.render();

    var armL = new Cube();
    armL.color = [251 / 255, 208 / 255, 67 / 255, 1.0];
    armL.matrix.translate(0.2, 0.06, 0.05);
    if (g_armAnimation) {
        armL.matrix.rotate(45 * Math.sin(g_seconds), 0, 0, 1);
    } else {
        armL.matrix.rotate(g_armL1Angle, 0, 0, 1);
    }
    var armLCoordMat = new Matrix4(armL.matrix);
    armL.matrix.scale(0.3, 0.1, 0.1);
    armL.render();

    var armL2 = new Cube();
    armL2.color = [251 / 255, 225 / 255, 67 / 255, 1.0];
    armL2.matrix = armLCoordMat;
    armL2.matrix.translate(0.3, 0.01, 0.02);
    if (g_armAnimation) {
        armL2.matrix.rotate(45 * Math.sin(g_seconds), 0, 0, 1);
    } else {
        armL2.matrix.rotate(g_armL2Angle, 0, 0, 1);
    }
    var armLCoordMat2 = new Matrix4(armL2.matrix);
    armL2.matrix.scale(0.2, 0.09, 0.07);
    armL2.render();

    var armL3 = new Cube();
    armL3.color = [250 / 255, 240 / 255, 40 / 255, 1.0];
    armL3.matrix = armLCoordMat2;
    armL3.matrix.translate(0.2, 0.01, 0.01);
    if (g_armAnimation) {
        armL3.matrix.rotate(45 * Math.sin(g_seconds), 0, 0, 1);
    } else {
        armL3.matrix.rotate(g_armL3Angle, 0, 0, 1);
    }
    armL3.matrix.scale(0.15, 0.05, 0.05);
    armL3.render();

    var nose = new Cube();
    nose.color = [0, 0, 0, 1];
    nose.matrix.translate(-0.05, 0.05, -0.05);
    nose.matrix.rotate(g_bodyAngle, 0, 0, 1);
    nose.matrix.scale(0.1, 0.1, 0.1);
    nose.render();


    // performance stats
    var duration = performance.now() - startTime;
    sendTextToHTML(" ms: " + Math.floor(duration) + " fps: " + Math.floor(10000 / duration) / 10, "performance")
}


var g_shapesList = [];

function click(ev) {
    let [x, y] = convertCoordinatesEventToGL(ev);

    // mouse click for rotation
    g_globalX = g_globalX - x * 10;
    g_globalY = g_globalY - y * 10;

    renderAllShapes();
}

// helper function to track origin
function updateOrigin(ev) {
    g_origin = [ev.clientX, ev.clientY];
}


// constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

// UI globals
let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 5;
let g_selectedType = POINT;
let g_selectedSegments = 10;

function addActionsForHtmlUI() {
    // reset cam button
    document.getElementById('clearButton').onclick = function () {
        g_globalX = 0;
        g_globalY = 0;
        g_globalZ = 0;
        renderAllShapes;
    };

    // animation buttons
    document.getElementById('animationAniOnButton').onclick = function () { g_armAnimation = true; };
    document.getElementById('animationAniOffButton').onclick = function () { g_armAnimation = false; };


    // angle sliders
    document.getElementById('armL1Slide').addEventListener('input', function () { g_armL1Angle = this.value; renderAllShapes(); });
    document.getElementById('armL2Slide').addEventListener('input', function () { g_armL2Angle = this.value; renderAllShapes(); });
    document.getElementById('armL3Slide').addEventListener('input', function () { g_armL3Angle = this.value; renderAllShapes(); });

    // camera sliders
    document.getElementById('xSlide').addEventListener('input', function () { g_globalX = this.value; renderAllShapes(); });
    document.getElementById('ySlide').addEventListener('input', function () { g_globalY = this.value; renderAllShapes(); });
    document.getElementById('zSlide').addEventListener('input', function () { g_globalZ = this.value; renderAllShapes(); });

    // document.getElementById('angleSlide').addEventListener('mousemove', function () { g_globalAngle = this.value; renderAllShapes(); });
}

// Set the text of a HTML element
function sendTextToHTML(text, htmlID) {
    var htmlElm = document.getElementById(htmlID);
    if (!htmlElm) {
        console.log("Failed to get " + htmlID + " from the HTML");
        return;
    }
    htmlElm.innerHTML = text;
}

function initTextures() {
    var image1 = new Image();
    if (!image1) {
        console.log('Failed to create the image object');
        return false;
    }

    image1.onload = function () { sendImageToTexture1(image1); }
    image1.src = 'sky.jpg';

    var image2 = new Image();
    if (!image2) {
        console.log('Failed to create the image object');
        return false;
    }

    image2.onload = function () { sendImageToTexture2(image2); }
    image2.src = 'grass.jpg';

    return true;
}


function sendImageToTexture1(image) {
    var texture = gl.createTexture();
    if (!texture) {
        console.log('Failed to create the texture object');
        return false;
    }

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.uniform1i(u_Sampler0, 0);
}

function sendImageToTexture2(image) {
    var texture = gl.createTexture();
    if (!texture) {
        console.log('Failed to create the texture object');
        return false;
    }

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.uniform1i(u_Sampler1, 1);
}