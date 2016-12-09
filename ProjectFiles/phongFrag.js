 var phongFrag = `
  varying vec3 vColor;
 
  void main() { 
   //Color from vertex shader are a function of the height of indivdual vertices.
  gl_FragColor = vec4(vColor,1.0);
 
  } `;
  