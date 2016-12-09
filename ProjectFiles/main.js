var highRes;
var lowRes;
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

	container.appendChild(renderer.domElement);
	//Add camera
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera(55.0, window.innerWidth / window.innerHeight, 0.5, 30000);
	camera.position.set(10,10,10);
	
	//Camera controls
	controller = new THREE.FirstPersonControls(camera);
	controller.movementSpeed = 10;
	controller.lookSpeed = .1;
	camera.lookAt(new THREE.Vector3());
	
	
	
	//Previous uniforms for blinnphong shader
	//uniforms = THREE.UniformsUtils.clone(THREE.ShaderLib.phong.uniforms);
	
	uniforms = {
		
	};
	
	mat = new THREE.ShaderMaterial({
		uniforms: uniforms,
		//three.js uses bufferGeometry and attributes has been deprecated
		//attributes: attributes
		vertexShader: phongVert,
		fragmentShader: phongFrag,
		uniforms: uniforms,
		//Phong shader would have this lights uniform enabled
		//lights: true
	});
	//Phong shader normally allows diffuse to be set
	//mat.uniforms.diffuse.value = new THREE.Color(0x00ffff);
	mat.uniforms.min = {value: 0};
	mat.uniforms.max = {value: 0};
	mat.needsUpdate = true;
	
	//Test cube for reference in the world
	/*var cGeometry = new THREE.CubeGeometry(2,2,2);
	var cMaterial = new THREE.MeshPhongMaterial({color: 0x00ffff});
	cGeometry.computeVertexNormals();
	var cube = new THREE.Mesh(cGeometry,cMaterial);
	scene.add(cube);*/

    var size = 65; //Must be power-of-two plus one
	var lodScale = 8; //Must be power of two
	var lowResSize = 9; //Must be ((size-1)/lodScale)+1
	
	highRes = buildMesh(size);
	lowRes = buildMesh(lowResSize);
	
	var offsets = highRes.geometry.attributes.aOffset.array;
	var positions = highRes.geometry.attributes.position.array;
	var normals = highRes.geometry.attributes.normal.array;
	var lowNormals = lowRes.geometry.attributes.normal.array;
	var lowPositions = lowRes.geometry.attributes.position.array;
	//Copy normals from smaller mesh
	//unused as three.js already creates normals for meshes.
	/*for(var i = 0; i < lowResSize; i++){
		for(var j = 0; j < lowResSize; j++){
			var index = (i*lodScale+j*size*lodScale)*3;
			normals[index] = lowNormals[i*3];
			normals[index+1] = lowNormals[i*3+1];
			normals[index+2] = lowNormals[i*3+2];
		}
	}*/
	
	//Loop through vertices of high resolution mesh and offset them to match the shape of the lower resolution mesh
	var partition = size / (lodScale);
	for(var i = 0; i < size; i++){
		for(var j = 0; j < size; j++){
			index = (i+j*size)*3+1;
			var partX = i / partition;
			var partY = j / partition;
			
			var x = partX % 1;
			var y = partY % 1;
			var xTile = Math.floor(partX);
			var yTile = Math.floor(partY);
			//if(j%lodScale == 0) console.log(xTile/lodScale);
			var topLeftIndex= xTile*lodScale+yTile*lodScale*size;
			//Top left, topRight, bottomLeft, bottomRight, x, y
			var interp = bilinearInterp(lowPositions[(xTile+yTile*lowResSize)*3+1],lowPositions[(xTile+1+yTile*lowResSize)*3+1],lowPositions[(xTile+(yTile+1)*lowResSize)*3+1],lowPositions[(xTile+1+(yTile+1)*lowResSize)*3+1],x,y);
			//Interpolates verts between those that are shared with the lower mesh
			//Sets vertex attributes to the difference of these values, so the shader can smoothly bring them back to their highres position
			offsets[index] = -(interp - positions[index]);
			positions[index] = interp;
			
			
			//This would change the normals of the high resolution mesh to better match those of the lower resolution one
			//As there seems to be built in mesh normalization in three.js this method did not seem to work
			/*normals[index-1] = bilinearInterp(normals[topLeftIndex*3-1],normals[(topLeftIndex+lodScale)*3-1],normals[(topLeftIndex+size*lodScale)*3-1],normals[(topLeftIndex+size*lodScale+lodScale)*3-1],x,y);
			normals[index] = bilinearInterp(normals[topLeftIndex*3+1],normals[(topLeftIndex+lodScale)*3],normals[(topLeftIndex+size*lodScale)*3],normals[(topLeftIndex+size*lodScale+lodScale)*3],x,y);
			normals[index+1] = bilinearInterp(normals[topLeftIndex*3+1],normals[(topLeftIndex+lodScale)*3+1],normals[(topLeftIndex+size*lodScale)*3+1],normals[(topLeftIndex+size*lodScale+lodScale)*3+1],x,y);
			*/
		}
	}
	
	
	
	//Send updated offset attributes
	highRes.geometry.attributes.aOffset.needsUpdate = true;
	highRes.geometry.attributes.position.needsUpdate = true;
	//highRes.geometry.attributes.normal.needsUpdate = true;
	scene.add(highRes);
	scene.add(lowRes);
	
	
	
	
	//Directional lighting and ambient light for back faces of objects that use the built-in blinn-phong shader
	var ambientLight = new THREE.AmbientLight(0x222222);
	scene.add(ambientLight);
	var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
	directionalLight.position.set(10,10,10);
	directionalLight.target.position.set(0, 0, 0);
	scene.add(directionalLight);

	//GUI
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
		params.Min =  Math.min(params.Min,params.Max);;
		mat.uniforms.min.value = params.Min;
	});
	var c3 = gui.add(params,"Max").min(0).max(100).name("Maximum Distance");
	mat.uniforms.max.value = params.Max;
	c3.onChange(function(v){
		params.Max =  Math.max(params.Min,params.Max);
		mat.uniforms.max.value = params.Max;
	});
	
	container.appendChild(stats.domElement)
	onWindowResize();
	window.addEventListener( 'resize', onWindowResize, false );
    render();
};

//Basic lerp, x should be clamped between 0 and 1
function linearInterp(first, second, x){
	return first-(x)*(first-second);
}
//Perform linear interpolation on X axis twice for top and bottom segments of quad
//then interpolate between those values based on y
function bilinearInterp(topLeft,topRight,bottomLeft,bottomRight,x,y){
	return linearInterp(linearInterp(topLeft,topRight,x),linearInterp(bottomLeft,bottomRight,x),y);
}

//Builds plane of number of segments, using simplex noise for height
function buildMesh(segments){
	var size = segments;
    var scale = 10;
	var height = 3;
	var halfScale = -scale;
    var noiseScale = 2;
    noiseScale /= (size-1);
    var width = scale / (size-1);
    var verticesPlane = new Float32Array(size*size*3);
	var offsetBuffer = new Float32Array(size*size*3);
	var noise = [];
	var indices = [];
	//Builds grid of variable sizes based on the same noise function,
	//different meshes with more or less vertices will all resemble the same shape
    for(var i = 0; i < size; i++)
    {
        for(var j = 0; j< size; j++)
        {
			noise[i+j*size] = (simplex.generateNoise(i* noiseScale +3, j * noiseScale) *.5)+.5;
			var index = (i+j*size)*3;
			//Verts
            verticesPlane[index] = i*width*2 + halfScale ;
            verticesPlane[index+1] = noise[i+j*size]*height;
			verticesPlane[index+2] = j*width*2 + halfScale;
			//Offsets
			offsetBuffer[index] = 0;
			offsetBuffer[index+1] = 0;
			offsetBuffer[index+2] = 0;
			
            
		    //Creates two triangles for each "quad" of the plane
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
	//aOffset will be used by shader to control vertex movement
	geometry.addAttribute( 'aOffset', new THREE.BufferAttribute(offsetBuffer, 3 ) );
	geometry.setIndex( new THREE.BufferAttribute( new Uint32Array( indices ), 1 ) );
	geometry.computeVertexNormals();
	//var material = new THREE.MeshPhongMaterial({color: 0x00ffff, wireframe: true});
	var mesh = new THREE.Mesh( geometry, mat );
	return mesh;
}
function onWindowResize( event ) {
	renderer.setSize( window.innerWidth, window.innerHeight );
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
}

var deltaTime;
//update called once before each frame is rendered
function update(){
	deltaTime = clock.getDelta();
	controller.update(deltaTime);
	stats.update();
	//Swap meshes if camera is close enough
	var swapIn = ( camera.position.distanceTo(new THREE.Vector3(0,0,0)) < Math.max(params.Max,15));//Plane is about 10 units across
	highRes.visible = swapIn;
	lowRes.visible = !swapIn;
	
}
function render() {
	update();
	renderer.render(scene,camera);
    requestAnimationFrame(render);
}