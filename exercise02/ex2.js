// TODO: Create card-like cube, rotating by Y-axis and bouncing by Y-axis.
"use strict";

var vs = `#version 300 es

in vec4 a_position;
in vec3 a_normal;

uniform mat4 u_matrix;
uniform vec3 u_lightWorldPos;
uniform mat4 u_world;
uniform mat4 u_viewInverse;
uniform mat4 u_worldInverseTranspose;

out vec4 v_position;
out vec3 v_normal;
out vec3 v_surfaceToLight;
out vec3 v_surfaceToView;

void main() {
  // Multiply the position by the matrix.
  v_position = u_matrix * a_position;

  // Pass the color to the fragment shader.
  v_normal = (u_worldInverseTranspose * vec4(a_normal, 0)).xyz;
  v_surfaceToLight = u_lightWorldPos - (u_world * a_position).xyz;
  v_surfaceToView = (u_viewInverse[3] - (u_world * a_position)).xyz;
  
  gl_Position = v_position;
}
`;

var fs = `#version 300 es
precision highp float;

// Passed in from the vertex shader.
in vec4 v_position;
in vec3 v_normal;
in vec3 v_surfaceToLight;
in vec3 v_surfaceToView;

uniform vec4 u_color;
uniform vec3 u_lightWorldPos;
uniform vec3 u_cameraWorldPos;

out vec4 outColor;

vec3 bounce(vec3 normal, vec3 light) {
    return 2.0 * dot(normal, light) * normal - light;
}

void main() {
   vec3 normal = normalize(v_normal);
   vec3 t_position = vec3(v_position) / v_position.w;
   vec3 lightDir = normalize(u_lightWorldPos - t_position);
   vec3 viewDir = normalize(u_cameraWorldPos - t_position);

   vec3 halfVec = normalize(lightDir + viewDir);
   vec3 reflect = normalize(bounce(normal, lightDir));

   float ambientStrength = 0.3;
   float diffuseStrength = 0.6;
   float specularStrength = 0.2;
   float shininess = 50.0;

   float diffuseRaw = dot(normal, lightDir);
   float diffuse = 0.6 * max(diffuseRaw, 0.2);
   float specular = specularStrength * pow(max(dot(normal, halfVec), 0.0), shininess);

   float light = ambientStrength + diffuse + specular;

   outColor = vec4(light * u_color.rgb, u_color.a);
}
`;

function main() {
    // Get A WebGL context
    /** @type {HTMLCanvasElement} */
    var canvas = document.querySelector("#canvas");
    var gl = canvas.getContext("webgl2");
    if (!gl) {
      return;
    }
  
    // Tell the twgl to match position with a_position, n
    // normal with a_normal etc..
    twgl.setAttributePrefix("a_");
    
    var boxArray = makeGeometry.makeCube(30);
    var boxBufferInfo = twgl.createBufferInfoFromArrays(gl, boxArray);
  
    // setup GLSL program
    var programInfo = twgl.createProgramInfo(gl, [vs, fs]);
  
    var boxVAO   = twgl.createVAOFromBufferInfo(gl, programInfo, boxBufferInfo);
  
    function degToRad(d) {
      return d * Math.PI / 180;
    }
  
    var fieldOfViewRadians = degToRad(60);
  
    // Uniforms for each object.
    var boxUniforms = {
      u_color: [0, 0.9, 1, 1],
      u_matrix: m4.identity(),
      u_lightWorldPos: [0, 10, 50],
      u_cameraWorldPos: [0, 0, 100],
      u_world: m4.identity(),
      u_viewInverse: m4.identity(),
      u_worldInverseTranspose: m4.identity(),
    };

  
    var objectsToDraw = [
      {
        programInfo: programInfo,
        bufferInfo: boxBufferInfo,
        vertexArray: boxVAO,
        uniforms: boxUniforms,
      },
    ];
  
    function computeMatrix(viewProjectionMatrix, translation, xRotation, yRotation) {
      var matrix = m4.translate(viewProjectionMatrix,
          translation[0],
          translation[1],
          translation[2]);
      matrix = m4.xRotate(matrix, xRotation);
      return m4.yRotate(matrix, yRotation);
    }
  
    requestAnimationFrame(drawScene);
  
    // Draw the scene.
    function drawScene(time) {
      time = time * 0.0005;
  
      twgl.resizeCanvasToDisplaySize(gl.canvas);
  
      // Tell WebGL how to convert from clip space to pixels
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  
      // gl.enable(gl.CULL_FACE);
      // gl.enable(gl.DEPTH_TEST);
      
      gl.enable(gl.DEPTH_TEST);
      gl.disable(gl.CULL_FACE);
  
      // Compute the projection matrix
      var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      var projectionMatrix =
          m4.perspective(fieldOfViewRadians, aspect, 1, 2000);
  
      // Compute the camera's matrix using look at.
      var cameraPosition = [0, 0, 100];
      var target = [0, 0, 0];
      var up = [0, 1, 0];
      var cameraMatrix = m4.lookAt(cameraPosition, target, up);
  
      // Make a view matrix from the camera matrix.
      var viewMatrix = m4.inverse(cameraMatrix);
      boxUniforms.u_viewInverse = m4.inverse(viewMatrix);
  
      var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);
  
      var boxYRotation   =  time;
      var boxXRotation   =  0.1 * Math.sin(time);
      var boxYTranslation = [0, 3 * Math.sin(time * 5), 0];
  
      // Compute the matrices for each object.
      
      var worldRbt = Rbt.makeXRotation(boxXRotation);
      worldRbt = Rbt.multiply(worldRbt, Rbt.makeYRotation(boxYRotation));
      
      worldRbt = Rbt.multiply(worldRbt, Rbt.compose(null, boxYTranslation));
      // console.log(worldRbt);
      var worldMatrix = Rbt.toM4(worldRbt);
      // console.log(worldMatrix);
      worldMatrix = m4.scale(worldMatrix, 1, 1.618, 0.05);

      boxUniforms.u_world = worldMatrix;
      boxUniforms.u_worldInverseTranspose = m4.transpose(m4.inverse(worldMatrix));
      
      // u_matrix = projection * view * world
      boxUniforms.u_matrix = m4.multiply(viewProjectionMatrix, worldMatrix);
  
      // ------ Draw the objects --------
  
      objectsToDraw.forEach(function(object) {
        var programInfo = object.programInfo;
  
        gl.useProgram(programInfo.program);
  
        // Setup all the needed attributes.
        gl.bindVertexArray(object.vertexArray);
  
        // Set the uniforms we just computed
        twgl.setUniforms(programInfo, object.uniforms);
  
        twgl.drawBufferInfo(gl, object.bufferInfo);
      });
  
      requestAnimationFrame(drawScene);
    }
  }
  
  main();