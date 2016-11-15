
var gl;
var points;
var verticesPlane = [];
var noise = [];
var indices = [];
window.onload = function init()
{
    var simplex = new SimplexNoise();
    var canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.enable(gl.DEPTH_TEST);

    var size = 100;
    var scale = 1;
    var noiseScale = 2;
    noiseScale /= size;
    var width = scale / (size-1);
    
    for(var i = 0; i < size; i++)
    {
        for(var j = 0; j< size; j++)
        {
            verticesPlane[i+j*size] = new vec3(i*width*2-1, j*width*2-1, 0);
            
            noise[i+j*size] = (simplex.generateNoise(i* noiseScale, j * noiseScale) *.5)+.5;
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

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );

    //  Load shaders and initialize attribute buffers

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    // Load the data into the GPU

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

    render();
};

function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawElements(gl.LINES, indices.length, gl.UNSIGNED_SHORT, 0);
    requestAnimationFrame(render);
}