
var gl;
var points;
var verticesPlane;
var noise = [];
var indices = [];

var container;
var renderer;
var scene;
var camera;
var controller;
var clock;
var stats;
var gui;
var params;
var mat;

window.onload = function init()
{
	container = document.getElementById('container');
	clock = new THREE.Clock();
	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setPixelRatio( window.devicePixelRatio );
	//document.body.appendChild(renderer.domElement);
	container.appendChild(renderer.domElement);
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera(55.0, window.innerWidth / window.innerHeight, 0.5, 30000);
	camera.position.set(10,10,10);
	
	controller = new THREE.FirstPersonControls(camera);
	controller.movementSpeed = 10;
	controller.lookSpeed = .1;
	camera.lookAt(new THREE.Vector3());
	
	var cGeometry = new THREE.CubeGeometry(2,2,2);
	var cMaterial = new THREE.MeshPhongMaterial({color: 0x00ffff});
	
	var uniforms = {
		min: {value: 10},
		max: {value: 20},
	};
	var attributes = {
		
	};
	
	/*mat = new THREE.ShaderMaterial({
		uniforms: uniforms,
		//attributes: attributes,
		vertexShader: document.getElementById('vertex-shader').textContent,
		fragmentShader: document.getElementById('fragment-shader').textContent
	});*/
	
	uniforms = THREE.UniformsUtils.clone(THREE.ShaderLib.phong.uniforms);
	//uniforms.color = 0x00ffff;
	//uniforms.min.value = 10;
	//unforms.max.value = 20;
	mat = new THREE.ShaderMaterial({
		uniforms: uniforms,
		//attributes: attributes,
		vertexShader: phongVert,
		fragmentShader: phongFrag,
		uniforms: uniforms,
		lights: true
	});
	mat.uniforms.diffuse.value = new THREE.Color(0x00ffff);
	mat.needsUpdate = true;
	
	
	cGeometry.computeVertexNormals();
	var cube = new THREE.Mesh(cGeometry,mat);
	scene.add(cube);
	
	
	
    var simplex = new SimplexNoise();
    //var canvas = document.getElementById( "gl-canvas" );
    
   // gl = WebGLUtils.setupWebGL( canvas );
   // if ( !gl ) { alert( "WebGL isn't available" ); }

   // gl.enable(gl.DEPTH_TEST);

    var size = 100;
    var scale = 10;
	var halfScale = -scale;
    var noiseScale = 2;
    noiseScale /= size;
    var width = scale / (size-1);
    verticesPlane = new Float32Array(size*size*3);
    for(var i = 0; i < size; i++)
    {
        for(var j = 0; j< size; j++)
        {
			noise[i+j*size] = (simplex.generateNoise(i* noiseScale, j * noiseScale) *.5)+.5;
			
            verticesPlane[(i+j*size)*3] = i*width*2 + halfScale ;
            verticesPlane[(i+j*size)*3+1] = noise[i+j*size]*2;
			verticesPlane[(i+j*size)*3+2] = j*width*2 + halfScale;
			
           
            if(i> 0 && j> 0)
            {
                indices.push(i-1 + (j-1) * size);
                indices.push(i-1 + j* size);
                indices.push(i + j* size);

                indices.push(i + j* size);
                indices.push(i + (j-1) * size);
                indices.push(i - 1 + (j-1) * size);      
            }
        }
    }
	var geometry = new THREE.BufferGeometry();
	geometry.addAttribute( 'position', new THREE.BufferAttribute(verticesPlane, 3 ) );
	geometry.setIndex( new THREE.BufferAttribute( new Uint32Array( indices ), 1 ) );
	geometry.computeVertexNormals();
	var material = new THREE.MeshPhongMaterial({color: 0x00ffff, wireframe: true});
	
	
	
	var mesh = new THREE.Mesh( geometry, mat );
	
	scene.add(mesh);
	
	
	var ambientLight = new THREE.AmbientLight(0x222222);
	scene.add(ambientLight);
	var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
	directionalLight.position.set(10,10,10);
	directionalLight.target.position.set(0, 0, 0);
	scene.add(directionalLight);
    //
    //  Configure WebGL
    //
    //gl.viewport( 0, 0, canvas.width, canvas.height );
   // gl.clearColor( 0.0, 0.0, 0.0, 1.0 );

    //  Load shaders and initialize attribute buffers

    //var program = initShaders( gl, "vertex-shader", "fragment-shader" );
   // gl.useProgram( program );
    
    // Load the data into the GPU
/*
    var iB = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iB);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW)

    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(noise), gl.STATIC_DRAW);
    
    var aColor = gl.getAttribLocation( program, "aColor");
    gl.vertexAttribPointer(aColor, 1, gl.FLOAT, false, 0 ,0);
    gl.enableVertexAttribArray( aColor);

    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(verticesPlane), gl.STATIC_DRAW );
    // Associate out shader variables with our data buffer
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    //gl.lineWidth(10);
*/
	stats = new Stats();
	
	gui = new dat.GUI();
	params = {
		Wireframe: false
	};
	var c1 = gui.add(params,"Wireframe");
	c1.onChange(function(v){
		mat.wireframe = v;
	});
	
	container.appendChild(stats.domElement)
	onWindowResize();
	window.addEventListener( 'resize', onWindowResize, false );
    render();
};
function onWindowResize( event ) {
	renderer.setSize( window.innerWidth, window.innerHeight );
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
}

var deltaTime;
function update(){
	deltaTime = clock.getDelta();
	controller.update(deltaTime);
	stats.update();
}
function render() {
    //gl.clear( gl.COLOR_BUFFER_BIT );
    //gl.drawElements(gl.LINES, indices.length, gl.UNSIGNED_SHORT, 0);
	update();
	renderer.render(scene,camera);
    requestAnimationFrame(render);
}