var highRes;
var gl;
var points;
var simplex = new SimplexNoise();
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
	
	
	
	
	uniforms = THREE.UniformsUtils.clone(THREE.ShaderLib.phong.uniforms);
	
	
	mat = new THREE.ShaderMaterial({
		uniforms: uniforms,
		//attributes: attributes,
		vertexShader: phongVert,
		fragmentShader: phongFrag,
		uniforms: uniforms,
		lights: true
	});
	mat.uniforms.diffuse.value = new THREE.Color(0x00ffff);
	mat.uniforms.min = {value: 0};
	mat.uniforms.max = {value: 0};
	mat.needsUpdate = true;
	
	//Test cube
	//var cGeometry = new THREE.CubeGeometry(2,2,2);
	//var cMaterial = new THREE.MeshPhongMaterial({color: 0x00ffff});
	//cGeometry.computeVertexNormals();
	//var cube = new THREE.Mesh(cGeometry,cMaterial);
	//scene.add(cube);

    var size = 64;
	var lodScale = 8;
	var lowResSize = size/lodScale;
	highRes = buildMesh(size,1);
	var lowRes = buildMesh(size,lodScale);
	
	var offsets = highRes.geometry.attributes.aOffset.array;
	var positions = highRes.geometry.attributes.position.array;
	/*var normals = highRes.geometry.attributes.normal.array;
	var lowNormals = lowRes.geometry.attributes.normal.array;
	for(var i = 0; i < lowResSize; i++){
		for(var j = 0; j < lowResSize; j++){
			var index = (i*lodScale+j*size*lodScale)*3;
			normals[index] = lowNormals[i*3];
			normals[index+1] = lowNormals[i*3+1];
			normals[index+2] = lowNormals[i*3+2];
		}
	}*/
	var sizeLimit = size;
	for(var i = 0; i < sizeLimit; i++){
		for(var j = 0; j < sizeLimit; j++){
			if(i%lodScale != 0 || j%lodScale != 0){
				index = (i+j*size)*3+1;
				var partX = i / lodScale;
				var partY = j / lodScale;
				var x = partX % 1;
				var y = partY % 1;
				var xTile = Math.floor(partX)*lodScale;
				var yTile = Math.floor(partY)*lodScale;
				xTile = Math.min(xTile,size-lodScale-1);
				yTile = Math.min(yTile,size-lodScale-1);
				var topLeftIndex= xTile+yTile*size;
				//Top left, topRight, bottomLeft, bottomRight, x, y
				var interp = bilinearInterp(positions[topLeftIndex*3+1],positions[(topLeftIndex+lodScale)*3+1],positions[(topLeftIndex+size*lodScale)*3+1],positions[(topLeftIndex+size*lodScale+lodScale)*3+1],x,y);
				offsets[index] = -(interp - positions[index]);
				positions[index] = interp;
				//Normals
				/*normals[index-1] = bilinearInterp(normals[topLeftIndex*3-1],normals[(topLeftIndex+lodScale)*3-1],normals[(topLeftIndex+size*lodScale)*3-1],normals[(topLeftIndex+size*lodScale+lodScale)*3-1],x,y);
				normals[index] = bilinearInterp(normals[topLeftIndex*3+1],normals[(topLeftIndex+lodScale)*3],normals[(topLeftIndex+size*lodScale)*3],normals[(topLeftIndex+size*lodScale+lodScale)*3],x,y);
				normals[index+1] = bilinearInterp(normals[topLeftIndex*3+1],normals[(topLeftIndex+lodScale)*3+1],normals[(topLeftIndex+size*lodScale)*3+1],normals[(topLeftIndex+size*lodScale+lodScale)*3+1],x,y);
				*/
				
				
			}
		}
	}
	
	
	
	//Send updated offset attributes
	highRes.geometry.attributes.aOffset.needsUpdate = true;
	highRes.geometry.attributes.position.needsUpdate = true;
	//highRes.geometry.attributes.normal.needsUpdate = true;
	scene.add(highRes);
	//scene.add(lowRes);
	
	
	
	
	
	var ambientLight = new THREE.AmbientLight(0x222222);
	scene.add(ambientLight);
	var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
	directionalLight.position.set(10,10,10);
	directionalLight.target.position.set(0, 0, 0);
	scene.add(directionalLight);

	stats = new Stats();
	gui = new dat.GUI();
	params = {
		Wireframe: true,
		Min: 20,
		Max: 40
	};
	var c1 = gui.add(params,"Wireframe");
	mat.wireframe = params.Wireframe;
	c1.onChange(function(v){
		mat.wireframe = v;
	});
	var c2 = gui.add(params,"Min").min(0).max(100).name("Minimum Distance");
	mat.uniforms.min.value = params.Min;
	c2.onChange(function(v){
		mat.uniforms.min.value = Math.min(params.Min,params.Max);
	});
	var c3 = gui.add(params,"Max").min(0).max(100).name("Maximum Distance");
	mat.uniforms.max.value = params.Max;
	c3.onChange(function(v){
		mat.uniforms.max.value = Math.max(params.Min,params.Max);
	});
	
	container.appendChild(stats.domElement)
	onWindowResize();
	window.addEventListener( 'resize', onWindowResize, false );
    render();
};
function linearInterp(first, second, x){
	return first-(x)*(first-second);
}
function bilinearInterp(topLeft,topRight,bottomLeft,bottomRight,x,y){
	return linearInterp(linearInterp(topLeft,topRight,x),linearInterp(bottomLeft,bottomRight,x),y);
}

function buildMesh(segments,lod){
	var size = segments/lod;
    var scale = 10;
	var height = 3;
	var halfScale = -scale;
    var noiseScale = 2;
    noiseScale /= size;
    var width = scale / (size-1);
    var verticesPlane = new Float32Array(size*size*3);
	var offsetBuffer = new Float32Array(size*size*3);
	var noise = [];
	var indices = [];
    for(var i = 0; i < size; i++)
    {
        for(var j = 0; j< size; j++)
        {
			noise[i+j*size] = (simplex.generateNoise(i* noiseScale, j * noiseScale) *.5)+.5;
			var index = (i+j*size)*3;
			//Verts
            verticesPlane[index] = i*width*2 + halfScale ;
            verticesPlane[index+1] = noise[i+j*size]*height;
			verticesPlane[index+2] = j*width*2 + halfScale;
			//Offsets
			offsetBuffer[index] = 0;
			offsetBuffer[index+1] = 0;
			offsetBuffer[index+2] = 0;
			
            
		    
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
	geometry.addAttribute( 'aOffset', new THREE.BufferAttribute(offsetBuffer, 3 ) );
	geometry.setIndex( new THREE.BufferAttribute( new Uint32Array( indices ), 1 ) );
	geometry.computeVertexNormals();
	var material = new THREE.MeshPhongMaterial({color: 0x00ffff, wireframe: true});
	var mesh = new THREE.Mesh( geometry, mat );
	return mesh;
}
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