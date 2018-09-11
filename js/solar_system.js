var CANVAS, GL, SHADER_PROGRAM, TIMER, WEBGL;
var SYSTEM;
var NBPLANETS = 1000;


function solar_main() {
    CANVAS = document.getElementById("canvas");
    WEBGL = new Webgl();

    Navigation.setMouseEvents();

    SYSTEM = new System(NBPLANETS);
    WEBGL.scene.load();
    checkLoaded();

    start();
}

// function gameLoad() {
//     TIMERLOAD = setInterval("checkLoaded()", 100); // vérifie le chargement    
// }

function checkLoaded() {
    for (var I = 0; I < WEBGL.scene.objects.length; ++I) {
        if (WEBGL.scene.objects[I].loaded == false)
            return false;
    }
    clearInterval(TIMERLOAD);
    WEBGL.scene.draw();
    return true;
}

function start() {
    TIMER = setInterval("WEBGL.scene.draw ()", 25);
}

function stop() {
    clearInterval(TIMER);
}

function restart() {
    stop();
    delete (SYSTEM);
    WEBGL.scene.clean();
    SYSTEM = new System(NBPLANETS);
    WEBGL.scene.load();
    checkLoaded();
    start();
}

/* 
* To change this template, choose Tools | Templates
* and open the template in the editor.
*/

function Webgl() {
    Webgl.initGL();
    this.shaders = new Shaders();
    this.scene = new Scene();
    this.navigation = new Navigation(0., 8., 0.);
    window.onresize = Webgl.sizeCanvas;
}

Webgl.sizeCanvas = function (event) {
    CANVAS.width = window.innerWidth;
    CANVAS.height = window.innerHeight * 3 / 5;
    GL.viewportWidth = CANVAS.width;
    GL.viewportHeight = CANVAS.height;
    GL.viewportX = CANVAS.offsetLeft;
    GL.viewportY = CANVAS.offsetTop;
    GL.viewport(0.0, 0.0, GL.viewportWidth, GL.viewportHeight);
}

Webgl.initGL = function () {
    try {
        GL = CANVAS.getContext("experimental-webgl");
        Webgl.sizeCanvas();
    }
    catch (e) { }
    if (!GL) {
        window.location = "https://www.spacegoo.com/install_webgl.php";
    }
}
Shaders = function () {
    this.fragmentShader = getShader("shader-fs");
    this.vertexShader = getShader("shader-vs");

    SHADER_PROGRAM = GL.createProgram();
    GL.attachShader(SHADER_PROGRAM, this.vertexShader);
    GL.attachShader(SHADER_PROGRAM, this.fragmentShader);
    GL.linkProgram(SHADER_PROGRAM);

    if (!GL.getProgramParameter(SHADER_PROGRAM, GL.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    GL.useProgram(SHADER_PROGRAM);

    SHADER_PROGRAM.vertexPositionAttribute = GL.getAttribLocation(SHADER_PROGRAM, "aVertexPosition");
    GL.enableVertexAttribArray(SHADER_PROGRAM.vertexPositionAttribute);

    SHADER_PROGRAM.textureCoordAttribute = GL.getAttribLocation(SHADER_PROGRAM, "aTextureCoord");
    GL.enableVertexAttribArray(SHADER_PROGRAM.textureCoordAttribute);

    SHADER_PROGRAM.vertexNormalAttribute = GL.getAttribLocation(SHADER_PROGRAM, "aVertexNormal");
    GL.enableVertexAttribArray(SHADER_PROGRAM.vertexNormalAttribute);

    SHADER_PROGRAM.rayon = GL.getUniformLocation(SHADER_PROGRAM, "rayon");
    SHADER_PROGRAM.position = GL.getUniformLocation(SHADER_PROGRAM, "position");

    SHADER_PROGRAM.light = GL.getUniformLocation(SHADER_PROGRAM, "light");
    SHADER_PROGRAM.render = GL.getUniformLocation(SHADER_PROGRAM, "render");
    SHADER_PROGRAM.pMatrixUniform = GL.getUniformLocation(SHADER_PROGRAM, "uPMatrix");
    SHADER_PROGRAM.mvMatrixUniform = GL.getUniformLocation(SHADER_PROGRAM, "uMVMatrix");
    SHADER_PROGRAM.samplerUniform = GL.getUniformLocation(SHADER_PROGRAM, "uSampler");
}

getShader = function (id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) return null;

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }

    var shader;
    if (shaderScript.type == "x-shader/x-fragment") shader = GL.createShader(GL.FRAGMENT_SHADER);
    else if (shaderScript.type == "x-shader/x-vertex") shader = GL.createShader(GL.VERTEX_SHADER);
    else return null;

    GL.shaderSource(shader, str);
    GL.compileShader(shader);

    if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
        alert(GL.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

var DISPLAYED = true;
var UP; // la direction du ciel
var VIEW_POINT; // ce que regarde la caméra
var RENDER;
var DT = 0.025;

Scene = function () {
    VIEW_POINT = new Point(0., 0., 0.);
    UP = new Point(0, 0, -1);
    VIEW_POINT = new Point(0, 0, 0);


    SPHERE = new Sphere();
    SPHERE_BUILT = true;

    this.objects = new Array();
    this.numItems = 0;

    this.count = 0;
    this.zde = document.getElementById('fps');
    this.count = 0;
    this.dtheta = 0.004;
    this.angle = 0;

    this.sky = new Sphere();
    this.sky.makeObject(100000., "images/etoiles4.jpg", false);


    this.draw = function () {

        this.angle += this.dtheta;
        this.count++;
        if (this.count % 10 == 0)
            var time = new Date().getTime();
        SYSTEM.update(DT);
        var sinphi = Math.sin(CAM_PHI);
        var cosphi = Math.cos(CAM_PHI);
        var costheta = Math.cos(CAM_THETA);
        var sintheta = Math.sin(CAM_THETA);
        CAM_POINT.X = CAM_R * costheta * sinphi;
        CAM_POINT.Y = CAM_R * sintheta * sinphi;
        CAM_POINT.Z = CAM_R * cosphi;
        UP.X = -costheta * cosphi;
        UP.Y = -sintheta * cosphi;
        UP.Z = sinphi;
        GL.uniform1i(SHADER_PROGRAM.samplerUniform, 0);

        if (DISPLAYED) {

            GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

            lib_matrix_loadIdentity();
            lookAt(CAM_POINT, VIEW_POINT, UP);

            LOADED = false;

            GL.uniform1i(SHADER_PROGRAM.render, 1);
            GL.uniform3f(SHADER_PROGRAM.position, 0, 0, 0);
            lib_matrix_mvPushMatrix();

            this.sky.object.rayon = 100000.;
            lib_matrix_mvRotateYFast(-Math.PI / 1.8);

            lib_matrix_setMatrixUniforms();
            this.sky.object.draw();
            lib_matrix_mvPopMatrix();


            lib_matrix_mvPushMatrix();
            this.objects[0].rayon = 100.;
            GL.uniform3f(SHADER_PROGRAM.position, 0, 0, 0);
            lib_matrix_mvRotateYFast(Math.PI / 2.);
            lib_matrix_mvRotateXFast(this.angle);
            lib_matrix_setMatrixUniforms();
            this.objects[0].draw();
            lib_matrix_mvPopMatrix();

            lib_matrix_setMatrixUniforms();

            GL.uniform1i(SHADER_PROGRAM.render, 2);
            for (I = 1; I < this.objects.length; ++I) {
                this.objects[I].rayon = SYSTEM.planets[I].masse;
                var n = 1. / Math.sqrt(SYSTEM.planets[I].position.X * SYSTEM.planets[I].position.X + SYSTEM.planets[I].position.Y * SYSTEM.planets[I].position.Y + SYSTEM.planets[I].position.Z * SYSTEM.planets[I].position.Z);
                GL.uniform3f(SHADER_PROGRAM.light, n * SYSTEM.planets[I].position.X, n * SYSTEM.planets[I].position.Y, n * SYSTEM.planets[I].position.Z);
                GL.uniform3f(SHADER_PROGRAM.position, SYSTEM.planets[I].position.X, SYSTEM.planets[I].position.Y, SYSTEM.planets[I].position.Z);
                this.objects[I].draw();
            }

            lib_matrix_setMatrixUniforms();

            GL.flush();
        }
        if (this.count % 30 == 0) {
            try {
                document.getElementById('planets').innerHTML = NBPLANETS;
                document.getElementById('planetsc').innerHTML = SYSTEM.nbPlanets;
                var time2 = new Date().getTime();
                var fps = parseInt(1000. / (time2 - time));
                this.zde.innerHTML = fps;
                delete (time);
                delete (time2);
            } catch (err) { }
        }
        return true;
    }

    this.load = function () {
        GL.clearDepth(1.0);
        GL.enable(GL.DEPTH_TEST);
        GL.depthFunc(GL.LEQUAL);
        lib_matrix_perspective(72, GL.viewportWidth / GL.viewportHeight, 0.1, 200000.);
        GL.clearColor(0.0, 0.0, 0.0, 1.0);
        LOADED = false;
        this.sky.object.load();
        for (I = 0; I < this.objects.length; ++I) {
            this.objects[I].load();
        }

        window.onblur = Scene.displayOff;
        window.onfocus = Scene.displayOn;
    }

    this.addObject = function (object) {
        this.objects.push(object);
        this.numItems++;
    }

    this.clean = function () { // enleve le sol seulement
        delete (this.objects);
        this.objects = new Array();
        this.numItems = 0;
    }
}

Scene.displayOff = function (event) {
    //DISPLAYED=false;
}

Scene.displayOn = function (event) {
    DISPLAYED = true;
}
var RAYON = 0.;
var RENDER = -1;
var LOADED = false;
var VERTEX_BUFFER, VERTEX_INDEX_BUFFER;

aObject = function (texture, render, scale) {

    this.loaded = false;
    this.render = render;
    this.rayon = scale;

    if (texture) {
        this.texture = GL.createTexture();
        this.texture.image = new Image();
        this.texture.image.src = texture;
        this.texture.image.parent = this;
        this.texture.image.onload = function () { lib_textures_loadTextureLR(this.parent.texture); this.parent.loaded = true; }
    } else {
        this.texture = false;
    }

    this.draw = function () {
        if (RAYON != this.rayon) {
            GL.uniform1f(SHADER_PROGRAM.rayon, this.rayon);
            RAYON = this.rayon;
        }
        if (this.texture)
            GL.bindTexture(GL.TEXTURE_2D, this.texture);
        if (!LOADED) {
            GL.bindBuffer(GL.ARRAY_BUFFER, VERTEX_BUFFER);
            GL.vertexAttribPointer(SHADER_PROGRAM.vertexPositionAttribute, 3, GL.FLOAT, false, 32, 0);
            GL.vertexAttribPointer(SHADER_PROGRAM.vertexNormalAttribute, 3, GL.FLOAT, false, 32, 12);
            GL.vertexAttribPointer(SHADER_PROGRAM.textureCoordAttribute, 2, GL.FLOAT, false, 32, 24);
            GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, VERTEX_INDEX_BUFFER);
            LOADED = true;
        }
        GL.drawElements(GL.TRIANGLES, VERTEX_INDEX_BUFFER.numItems, GL.UNSIGNED_SHORT, 0);
    }

    this.drawFast = function () {
        GL.drawElements(GL.TRIANGLES, VERTEX_INDEX_BUFFER.numItems, GL.UNSIGNED_SHORT, 0);
    }

    this.load = function () {
        if (!LOADED) {
            VERTEX_BUFFER = GL.createBuffer();
            GL.bindBuffer(GL.ARRAY_BUFFER, VERTEX_BUFFER);
            GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(VERTEX_SPHERE), GL.STATIC_DRAW);
            VERTEX_BUFFER.numItems = VERTEX_SPHERE.length / 3;
            VERTEX_INDEX_BUFFER = GL.createBuffer();
            GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, VERTEX_INDEX_BUFFER);
            GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(SPHERE_INDEX), GL.STATIC_DRAW);
            VERTEX_INDEX_BUFFER.numItems = SPHERE_INDEX.length;
            LOADED = true;
        }
    }

    this.clean = function () {
        GL.deleteBuffer(this.vertexBuffer);
        GL.deleteBuffer(this.vertexIndexBuffer);
    }
}


var CAM_POINT;
var CAM_THETA, CAM_PHI, CAM_R;
var BEGIN = false;
var CLICK = false;

var Navigation = function (camX, camY, camZ) {
    this.oldMouseX = -1.;
    this.oldMouseY = -1.;
    CAM_THETA = Math.PI / 2.;
    CAM_PHI = Math.PI / 2.2;
    CAM_R = 280.;
    CAM_POINT = new Point(camX, camY, camZ);

    this.handleMouseDown = function (event) // passe en mode click -> on monte
    {
        this.oldMouseX = event.clientX;
        this.oldMouseY = event.clientY;
        CLICK = true;
    }

    this.handleMouseUp = function (event) // supprime le mode click -> on descend
    {
        CLICK = false;
    }

    this.handleMouseMove = function (event) {
        if (CLICK) {
            CAM_THETA -= 0.001 * (event.clientX - this.oldMouseX);
            CAM_PHI -= 0.001 * (event.clientY - this.oldMouseY);
            this.oldMouseX = event.clientX;
            this.oldMouseY = event.clientY;
        }
        if (CAM_PHI >= Math.PI) {
            CAM_PHI = Math.PI;
        }
        if (CAM_PHI <= 0) {
            CAM_PHI = 0.;
        }
        if (CAM_THETA >= 3. * Math.PI / 2.)
            CAM_THETA = -Math.PI / 2.;
        if (CAM_THETA < -Math.PI / 2.)
            CAM_THETA = 3 * Math.PI / 2.;
        else
            return;
    }

    this.handleMouseRoll = function (event) {
        var roll;
        if (event.detail) {
            roll = event.detail; //Firefox
        } else {
            roll = -0.025 * event.wheelDelta; //chrome
        }
        // CAM_R += 10. * roll;
        // if (CAM_R < 150)
        //     CAM_R = 150;
        // if (CAM_R > 1000.)
        //     CAM_R = 1000.;
    }

    this.handleKeyDown = function (event) {
        var reinit = false;
        var stop = false;
        switch (event.keyCode) {
            case 38: // up
                reinit = true;
                NBPLANETS += 1000;
                break;
            case 40: // down
                reinit = true;
                NBPLANETS -= 1000;
                break;
            case 39: // left
                DT *= 2;
                break;
            case 37: //right
                DT /= 2.;
                break;
            case 32: //
                stop = !stop;
                break;
            default:
                break;
        }
        if (stop)
            clearInterval(TIMER);
        if (false) //DT > 0.2)
            alert("Too high speed ! Numerical instabilities may occur !")
        if (NBPLANETS < 0)
            NBPLANETS = 0;
        if (reinit)
            restart();
    }
}

Navigation.setMouseEvents = function () {
    document.onmousedown = WEBGL.navigation.handleMouseDown;
    document.onmouseup = WEBGL.navigation.handleMouseUp;
    document.onmousemove = WEBGL.navigation.handleMouseMove;
    document.onkeydown = WEBGL.navigation.handleKeyDown;
    document.onmousewheel = WEBGL.navigation.handleMouseRoll; //pour chrome
    // window.addEventListener('DOMMouseScroll', WEBGL.navigation.handleMouseRoll, false); //pour FF
}
/* 
    * Basic 3D - Point class. 
    */

Point = function (x, y, z) {
    this.X = x;
    this.Y = y;
    this.Z = z;

    this.display = function (name) {
        console.log(name + " = [" + this.X + ", " + this.Y + ", " + this.Z + ']');
    }
    // returns vector p-this
    /*this.vector = function(p)
    {
        return new Point(p.X - this.X, p.Y - this.Y, p.Z - this.Z) ;
    }*/

    // ajoute le vecteur p au vecteur courant
    this.add = function (p) {
        this.X += p.X;
        this.Y += p.Y;
        this.Z += p.Z;
    }

    // retire le vecteur p au vecteur courant
    this.sub = function (p) {
        this.X -= p.X;
        this.Y -= p.Y;
        this.Z -= p.Z;
    }

    /* this.subNew = function (p)
        {
            return new Point(this.X - p.X, this.Y - p.Y, this.Z - p.Z) ;
        }*/

    // produit vectoriel
    this.prodVect = function (p, res) {
        res.X = this.Y * p.Z - this.Z * p.Y;
        res.Y = this.Z * p.X - this.X * p.Z;
        res.Z = this.X * p.Y - this.Y * p.X;
    }

    // multiplie le vecteur courant par le scalaire a
    this.multFloat = function (a) {
        this.X *= a;
        this.Y *= a;
        this.Z *= a;
    }

    // produit scalaire de deux vecteurs
    this.prodScal = function (p) {
        return this.X * p.X + this.Y * p.Y + this.Z * p.Z;
    }

    // returns L2 norm of this
    this.norm = function () {
        return Math.sqrt(this.X * this.X + this.Y * this.Y + this.Z * this.Z);
    }

    this.norm2 = function () {
        return (this.X * this.X + this.Y * this.Y + this.Z * this.Z);
    }

    // normalise le vecteur courant
    this.normalize = function () {
        var invn = 1. / Math.sqrt(this.X * this.X + this.Y * this.Y + this.Z * this.Z);
        this.X *= invn;
        this.Y *= invn;
        this.Z *= invn;
    }

    /* this.normalized = function ()
        {
            var res = this ;
            res.normalize () ;
            return res ;
        }*/

    // returns distance between p and current point
    this.distance = function (p) {
        var dx = p.X - this.X;
        var dy = p.Y - this.Y;
        var dz = p.Z - this.Z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
}
/* 
    * To change this template, choose Tools | Templates
    * and open the template in the editor.
    */

var LATITUDE_BANDS = 25;
var LONGITUDE_BANDS = 25;
var SPHERE_POSITION = new Array(3 * (LONGITUDE_BANDS + 1) * (LATITUDE_BANDS + 1));
var SPHERE_NORMAL = new Array(3 * (LONGITUDE_BANDS + 1) * (LATITUDE_BANDS + 1));
var SPHERE_TEXTURE = new Array(2 * (LONGITUDE_BANDS + 1) * (LATITUDE_BANDS + 1));
var SPHERE_INDEX = new Array(6 * LATITUDE_BANDS * LONGITUDE_BANDS);
var VERTEX_SPHERE = new Array(8 * SPHERE_POSITION.length / 3);

var SPHERE_BUILT = false;

Sphere = function () {
    if (!SPHERE_BUILT) {
        var index_position = 0;
        var index_normal = 0;
        var index_tex = 0;
        var cons2 = Math.PI / LATITUDE_BANDS;
        var cons1 = 2 * Math.PI / LONGITUDE_BANDS;
        var invlat = 1. / LATITUDE_BANDS;
        var invlon = 1. / LONGITUDE_BANDS;
        for (var latNumber = 0; latNumber <= LATITUDE_BANDS; latNumber++) {
            var theta = latNumber * cons2;
            var sinTheta = Math.sin(theta);
            var cosTheta = Math.cos(theta);

            for (var longNumber = 0; longNumber <= LONGITUDE_BANDS; longNumber++) {
                var phi = longNumber * cons1;
                var sinPhi = Math.sin(phi);
                var cosPhi = Math.cos(phi);

                var x = cosPhi * sinTheta;
                var y = cosTheta;
                var z = sinPhi * sinTheta;
                var u = 1 - (longNumber * invlon);
                var v = 1 - (latNumber * invlat);

                SPHERE_NORMAL[index_normal++] = x;
                SPHERE_NORMAL[index_normal++] = y;
                SPHERE_NORMAL[index_normal++] = z;
                SPHERE_TEXTURE[index_tex++] = u;
                SPHERE_TEXTURE[index_tex++] = v;
                SPHERE_POSITION[index_position++] = x;
                SPHERE_POSITION[index_position++] = y;
                SPHERE_POSITION[index_position++] = z;
            }
        }
        var index_index = 0;
        var idx = 0;
        for (latNumber = 0; latNumber < LATITUDE_BANDS; ++latNumber) {
            for (longNumber = 0; longNumber < LONGITUDE_BANDS; ++longNumber, ++idx) {
                var first = (latNumber * (LONGITUDE_BANDS + 1)) + longNumber;
                var second = first + LONGITUDE_BANDS + 1;
                SPHERE_INDEX[index_index++] = first;
                SPHERE_INDEX[index_index++] = second;
                SPHERE_INDEX[index_index++] = first + 1;

                SPHERE_INDEX[index_index++] = second;
                SPHERE_INDEX[index_index++] = second + 1;
                SPHERE_INDEX[index_index++] = first + 1;
            }
        }

        var zou = SPHERE_POSITION.length / 3;
        var index = 0;
        for (var i = 0; i < zou; ++i, index += 8) {
            var j = 3 * i;
            VERTEX_SPHERE[index] = SPHERE_POSITION[j];
            VERTEX_SPHERE[index + 1] = SPHERE_POSITION[j + 1];
            VERTEX_SPHERE[index + 2] = SPHERE_POSITION[j + 2];
            VERTEX_SPHERE[index + 3] = SPHERE_NORMAL[j];
            VERTEX_SPHERE[index + 4] = SPHERE_NORMAL[j + 1];
            VERTEX_SPHERE[index + 5] = SPHERE_NORMAL[j + 2];
            VERTEX_SPHERE[index + 6] = SPHERE_TEXTURE[i * 2];
            VERTEX_SPHERE[index + 7] = SPHERE_TEXTURE[i * 2 + 1];
        }
    }

    SPHERE_BUILT = true;

    this.makeObject = function (radius, texture, add) {
        this.object = new aObject(texture, 2, radius);
        if (add)
            WEBGL.scene.addObject(this.object);
    }
}

/* 
* To change this template, choose Tools | Templates
* and open the template in the editor.
*/
var SPHERE;

Planet = function (masse, position, vitesse, texture) {
    this.masse = masse;
    this.position = position;
    this.vitesse = vitesse;
    SPHERE.makeObject(masse, texture, true);
}/* 
* To change this template, choose Tools | Templates
* and open the template in the editor.
*/

var G = 1.;
var FACT = 0.001;


System = function (nbPlanets) {
    // soleil = planete 0
    this.nbPlanets = nbPlanets;

    this.MAXI = 10;
    this.MAXJ = 10;
    this.MAXK = 5;


    this.grid = new Array(this.MAXI); // on découpe le zdé en une grille fixe 10*10*10 de cellules de taille 120*120*40
    for (var i = 0; i < this.MAXI; ++i) {
        this.grid[i] = new Array(this.MAXJ);
        for (var j = 0; j < this.MAXJ; ++j) {
            this.grid[i][j] = new Array(this.MAXK);
            for (var k = 0; k < this.MAXK; ++k)
                this.grid[i][j][k] = new Array();
        }
    }
    var zizou = 1. / 120.;
    this.planets = new Array(this.nbPlanets);
    // sun : 1
    var zero = new Point(0, 0, 0);
    this.planets[0] = new Planet(100., zero, zero, "images/saturne.jpg");
    var cinqpi = 11 * Math.PI / 24.;
    var septpi = 13. * Math.PI / 24.;
    for (i = 1; i < this.nbPlanets; ++i) {
        var masse = randFloat(1., 3.);
        var theta = randFloat(0., 2. * Math.PI);
        var phi = randFloat(cinqpi, septpi);
        var R = randFloat(200., 400.);
        var speed = new Point(0, 0, 0);
        var position = new Point(0, 0, 0);
        position.X = R * Math.sin(phi) * Math.cos(theta);
        position.Y = R * Math.sin(phi) * Math.sin(theta);
        position.Z = R * Math.cos(phi);
        var I = parseInt((position.X + 600) * this.zizouI);
        var J = parseInt((position.Y + 600) * this.zizouJ);
        var K = parseInt((position.Z + 100) * this.zizouK);
        if (I < this.MAXI && I >= 0 && J < this.MAXJ && J >= 0 && K < this.MAXK && K >= 0)
            this.grid[I][J][K].push(i);
        speed.X = -position.Y;
        speed.Y = position.X;
        speed.Z = 0;
        speed.normalize();
        var speedN = randFloat(8., 12.);
        speed.multFloat(speedN);
        if (i == 1)
            this.planets[i] = new Planet(masse, position, speed, "images/pierre.jpg");
        else
            this.planets[i] = new Planet(masse, position, speed, false);
        delete (speed);
        delete (position);
    }

    this.acc = new Point(0, 0, 0);
    this.zizouI = this.MAXI / 1200.;
    this.zizouJ = this.MAXJ / 1200.;
    this.zizouK = this.MAXK / 200.;

    this.updateGrid = function (maxi, maxj, maxk) {
        this.MAXI = maxi;
        this.MAXJ = maxj;
        this.MAXK = maxk;
        /*
        delete(this.grid) ;
        this.grid = new Array(this.MAXI) ;
        for (i = 0 ; i < this.MAXI ; ++i)
        {
            this.grid[i] = new Array(this.MAXJ) ;
            for (j = 0 ; j < this.MAXJ ; ++j)
            {
                this.grid[i][j] = new Array(this.MAXK) ;
                for (k = 0 ; k < this.MAXK ; ++k)
                {
                    this.grid[i][j][k] = new Array () ;
                }
            }
        }*/
        this.zizouI = this.MAXI / 1200.;
        this.zizouJ = this.MAXJ / 1200.;
        this.zizouK = this.MAXK / 200.;
    }

    this.update = function (dt) {
        if (this.planets.length < 1000)
            this.updateGrid(5, 5, 3);
        if (this.planets.length < 400)
            this.updateGrid(2, 2, 1);
        if (this.planets.length < 100)
            this.updateGrid(1, 1, 1);
        var dtG = -dt * G;
        // calcul de la distance terre soleil : 
        // update de la grille
        for (var I = 0; I < this.MAXI; ++I) {
            for (var J = 0; J < this.MAXJ; ++J) {
                for (var K = 0; K < this.MAXK; ++K) {
                    delete (this.grid[I][J][K]);   // -> mise à zero
                    this.grid[I][J][K] = new Array();
                }
            }
        }
        for (var i = 1; i < this.planets.length; ++i) {
            // mise à jour de la grille
            I = parseInt((this.planets[i].position.X + 600.) * this.zizouI);
            J = parseInt((this.planets[i].position.Y + 600.) * this.zizouJ);
            K = parseInt((this.planets[i].position.Z + 100.) * this.zizouK);
            if (I < this.MAXI && I >= 0 && J < this.MAXJ && J >= 0 && K < this.MAXK && K >= 0) {
                this.grid[I][J][K].push(i);  // -> remplissage
            }
        }
        var deleteIdx = new Array(); // les planetes à détruire


        for (I = 0; I < this.MAXI; ++I) {
            for (J = 0; J < this.MAXJ; ++J) {
                for (K = 0; K < this.MAXK; ++K) {
                    var nbPlans = this.grid[I][J][K].length;
                    if (nbPlans <= 1)
                        continue;
                    for (var planId = 0; planId < nbPlans - 1; ++planId) {
                        var id = this.grid[I][J][K][planId];
                        var zde = this.planets[id];
                        var position = zde.position;
                        var masse = zde.masse;
                        for (var planOt = planId + 1; planOt < nbPlans; ++planOt) {
                            var idOt = this.grid[I][J][K][planOt];
                            var positionOt = this.planets[idOt].position;
                            var masseOt = this.planets[idOt].masse;
                            var d = (position.X - positionOt.X) * (position.X - positionOt.X) + (position.Y - positionOt.Y) * (position.Y - positionOt.Y) + (position.Z - positionOt.Z) * (position.Z - positionOt.Z);

                            if (d < (masse + masseOt) * (masse + masseOt)) {// on fait grossir les planetes qui vont bien
                                var r1 = this.planets[id].masse;
                                var r2 = this.planets[idOt].masse;
                                this.planets[id].masse = Math.pow((r1 * r1 * r1 + r2 * r2 * r2), 0.33);
                                var m1 = this.planets[id].masse;
                                var m2 = this.planets[idOt].masse;
                                var tmp = 1. / (m1 + m2);
                                this.planets[id].vitesse.X = tmp * (m1 * zde.vitesse.X + m2 * this.planets[idOt].vitesse.X);
                                this.planets[id].vitesse.Y = tmp * (m1 * zde.vitesse.Y + m2 * this.planets[idOt].vitesse.Y);
                                this.planets[id].vitesse.Z = tmp * (m1 * zde.vitesse.Z + m2 * this.planets[idOt].vitesse.Z);

                                this.planets[id].position.X = tmp * (m1 * zde.position.X + m2 * this.planets[idOt].position.X);
                                this.planets[id].position.Y = tmp * (m1 * zde.position.Y + m2 * this.planets[idOt].position.Y);
                                this.planets[id].position.Z = tmp * (m1 * zde.position.Z + m2 * this.planets[idOt].position.Z);
                                deleteIdx.push(idOt);
                            }
                            else { // on rajoute une force
                                var invDist = 1. / d;
                                var ziou = FACT * dtG * this.planets[idOt].masse * invDist;
                                this.acc.X = ziou * (this.planets[idOt].position.X - zde.position.X);
                                this.acc.Y = ziou * (this.planets[idOt].position.Y - zde.position.Y);
                                this.acc.Z = ziou * (this.planets[idOt].position.Z - zde.position.Z);
                                zde.vitesse.X += this.acc.X;
                                zde.vitesse.Y += this.acc.Y;
                                zde.vitesse.Z += this.acc.Z;
                            }
                        }
                    }
                }
            }
        }
        deleteIdx.sort();
        for (var zou = deleteIdx.length - 1; zou >= 0; --zou) {
            this.planets.splice(deleteIdx[zou], 1);
            WEBGL.scene.objects.splice(deleteIdx[zou], 1);
        }
        this.nbPlanets -= deleteIdx.length;
        WEBGL.scene.numItems -= deleteIdx.length;
        delete (deleteIdx);
        // sun

        for (i = 1; i < this.planets.length; ++i) {

            zde = this.planets[i];
            invDist = 1. / zde.position.norm2();
            ziou = dtG * this.planets[0].masse * invDist;
            this.acc.X = ziou * zde.position.X;
            this.acc.Y = ziou * zde.position.Y;
            this.acc.Z = ziou * zde.position.Z;
            zde.position.X += dt * zde.vitesse.X;
            zde.position.Y += dt * zde.vitesse.Y;
            zde.position.Z += dt * zde.vitesse.Z;
            zde.vitesse.X += this.acc.X;
            zde.vitesse.Y += this.acc.Y;
            zde.vitesse.Z += this.acc.Z;
        }
        // */
    }
}
function lib_textures_loadTextureLR(texture) {
    GL.bindTexture(GL.TEXTURE_2D, texture);
    GL.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, true);
    GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, texture.image);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR);
    GL.generateMipmap(GL.TEXTURE_2D);
    GL.bindTexture(GL.TEXTURE_2D, null);
}

//texture sans mipmaping, Haute Résolution
function lib_textures_loadTextureHR(texture) {
    GL.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, true);
    GL.bindTexture(GL.TEXTURE_2D, texture);
    GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, texture.image);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR_MIPMAP_LINEAR);
    GL.generateMipmap(GL.TEXTURE_2D);
    GL.bindTexture(GL.TEXTURE_2D, null);
}
var MV_MATRIX;
var MV_MATRIX_STACK = [];
var P_MATRIX, P_MATRIX_INV;

function lib_matrix_mvPushMatrix() {
    MV_MATRIX_STACK.push(MV_MATRIX.dup());
}

function lib_matrix_mvPopMatrix() {
    MV_MATRIX = MV_MATRIX_STACK.pop();
    return MV_MATRIX;
}



function lib_matrix_loadIdentity() { MV_MATRIX = Matrix.I(4); }
function lib_matrix_multMatrix(m) { MV_MATRIX = MV_MATRIX.multiplyFast(m); }
function lib_matrix_mvTranslate(v) { MV_MATRIX.translateFast(v[0], v[1], v[2]); }
function lib_matrix_mvRotate(ang, v) { MV_MATRIX.rotateFast(Matrix.Rotation(ang, $V([v[0], v[1], v[2]])).ensure4x4()); }
function lib_matrix_mvRotateYFast(ang) { MV_MATRIX.rotateFast(Matrix.RotationXFast(ang)); }
function lib_matrix_mvRotateXFast(ang) { MV_MATRIX.rotateFast(Matrix.RotationYFast(ang)); }
function lib_matrix_mvRotateZFast(ang) { MV_MATRIX.rotateFast(Matrix.RotationZFast(ang)); }


function lib_matrix_perspective(fovy, aspect, znear, zfar) {
    P_MATRIX = makePerspective(fovy, aspect, znear, zfar);
    GL.uniformMatrix4fv(SHADER_PROGRAM.pMatrixUniform, false, P_MATRIX.flattenFast());
    P_MATRIX_INV = P_MATRIX.inverse();
}


function lib_matrix_setMatrixUniforms() {
    GL.uniformMatrix4fv(SHADER_PROGRAM.mvMatrixUniform, false, MV_MATRIX.flattenFast());
    GL.uniformMatrix3fv(SHADER_PROGRAM.nMatrixUniform, false, MV_MATRIX.inverse().flattenTransposeFast3());
}/* 
* To change this template, choose Tools | Templates
* and open the template in the editor.
*/

function randFloat(min, max) {
    var r = Math.random();
    return r * (max - min) + min;
}

solar_main();