var phongVert = `
  uniform float min;
  uniform float max;
  attribute vec3 aOffset;
  varying vec3 vColor;
  void main() { 
  float distance = distance(cameraPosition , position);
  float ratio = (distance - min) / (max - min);
  ratio = clamp(ratio,0.0,1.0);
  //lerp offset based on distance to the camera
  vec3 offset = mix(aOffset,vec3(0,0,0),ratio);

  vec4 mvPosition = modelViewMatrix * vec4( position + offset, 1.0 );
  gl_Position = projectionMatrix * mvPosition;
  vColor = vec3(0,position.y/5.0,position.y/5.0);
  } `;