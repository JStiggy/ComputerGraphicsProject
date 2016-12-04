var phongVert = `
#define PHONG 
  uniform float min;
  uniform float max;
  attribute vec3 aOffset;
  varying vec3 vViewPosition; 
  #ifndef FLAT_SHADED 
   
  varying vec3 vNormal; 
  #endif 
  #include <common> 
  #include <uv_pars_vertex> 
  #include <uv2_pars_vertex> 
  #include <displacementmap_pars_vertex> 
  #include <envmap_pars_vertex> 
  #include <color_pars_vertex> 
  #include <morphtarget_pars_vertex> 
  #include <skinning_pars_vertex> 
  #include <shadowmap_pars_vertex> 
  #include <logdepthbuf_pars_vertex> 
  #include <clipping_planes_pars_vertex> 
  void main() { 
   
  #include <uv_vertex> 
   
  #include <uv2_vertex> 
   
  #include <color_vertex> 
   
  #include <beginnormal_vertex> 
   
  #include <morphnormal_vertex> 
   
  #include <skinbase_vertex> 
   
  #include <skinnormal_vertex> 
   
  #include <defaultnormal_vertex> 
  #ifndef FLAT_SHADED 
   
  vNormal = normalize( transformedNormal ); 
  #endif 
   
  #include <begin_vertex> 
   
  #include <displacementmap_vertex> 
   
  #include <morphtarget_vertex> 
   
  #include <skinning_vertex> 
   
  #include <project_vertex> 
   
  #include <logdepthbuf_vertex> 
   
  #include <clipping_planes_vertex> 

  vViewPosition = - mvPosition.xyz; 
   
  #include <worldpos_vertex> 
   
  #include <envmap_vertex> 
   
  #include <shadowmap_vertex> 

  float distance = distance(cameraPosition , position);
  float ratio = (distance - min) / (max - min);
  ratio = clamp(ratio,0.0,1.0);
  
  vec3 offset = mix(aOffset,vec3(0,0,0),ratio);

  mvPosition = modelViewMatrix * vec4( position + offset, 1.0 );
  gl_Position = projectionMatrix * mvPosition;

  } `;