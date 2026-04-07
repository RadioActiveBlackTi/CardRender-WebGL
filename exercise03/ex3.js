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

   float ambientStrength = 0.5;
   float diffuseStrength = 0.6;
   float specularStrength = 0.4;
   float shininess = 2500.0;

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
    
    var width = 30;
    var height = width * 1.618;
    var radius = width * 0.05;
    var depth = 0.3;
    var division = 10;

    var boxArray = makeGeometry.makeRoundCard(width, height, radius, division);
    var boxBufferInfo = twgl.createBufferInfoFromArrays(gl, boxArray);

    var wallArray = makeGeometry.makeRoundWall(width, height, radius, 2 * depth, division);
    var wallBufferInfo = twgl.createBufferInfoFromArrays(gl, wallArray);
  
    // setup GLSL program
    var programInfo = twgl.createProgramInfo(gl, [vs, fs]);
  
    var boxVAO   = twgl.createVAOFromBufferInfo(gl, programInfo, boxBufferInfo);
    var wallVAO  = twgl.createVAOFromBufferInfo(gl, programInfo, wallBufferInfo);
  
    function degToRad(d) {
      return d * Math.PI / 180;
    }

    function radToDeg(r) {
      return r * 180 / Math.PI;
    }
  
    var fieldOfViewRadians = degToRad(60);

    var cardRBTNode = new Node();
    var frontRBTNode = new Node();
    var frontNode = new Node();
    var backRBTNode = new Node();
    var backNode = new Node();
    var wallRBTNode = new Node();
    var wallNode = new Node();

    frontRBTNode.setParent(cardRBTNode);
    backRBTNode.setParent(cardRBTNode);
    wallRBTNode.setParent(cardRBTNode);
    frontNode.setParent(frontRBTNode);
    backNode.setParent(backRBTNode);
    wallNode.setParent(wallRBTNode);

    frontRBTNode.localRbt = Rbt.compose(null, [0, 0, depth]);
    backRBTNode.localRbt = Rbt.compose(Quat.makeYRotation(Math.PI), [0, 0, -depth]);
    wallRBTNode.localRbt = Rbt.identity();

    frontNode.localTRS = new TRS();
    backNode.localTRS = new TRS();
    wallNode.localTRS = new TRS();
  
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

    var backUniforms = {
      u_color: [0.9, 1, 0, 1],
      u_matrix: m4.identity(),
      u_lightWorldPos: [0, 10, 50],
      u_cameraWorldPos: [0, 0, 100],
      u_world: m4.identity(),
      u_viewInverse: m4.identity(),
      u_worldInverseTranspose: m4.identity(),
    };

    var wallUniforms = {
      u_color: [0.7, 0.7, 0.75, 1],
      u_matrix: m4.identity(),
      u_lightWorldPos: [0, 10, 50],
      u_cameraWorldPos: [0, 0, 100],
      u_world: m4.identity(),
      u_viewInverse: m4.identity(),
      u_worldInverseTranspose: m4.identity(),
    }

    frontNode.drawInfo = {
      programInfo: programInfo,
      bufferInfo: boxBufferInfo,
      vertexArray: boxVAO,
      uniforms: boxUniforms,
    };

    backNode.drawInfo = {
      programInfo: programInfo,
      bufferInfo: boxBufferInfo,
      vertexArray: boxVAO,
      uniforms: backUniforms,
    };

    wallNode.drawInfo = {
      programInfo: programInfo,
      bufferInfo: wallBufferInfo,
      vertexArray: wallVAO,
      uniforms: wallUniforms,
    };

    var objects = [
      frontNode,
      backNode,
      wallNode,
    ];
    
    var objectsToDraw = [
      frontNode.drawInfo,
      backNode.drawInfo,
      wallNode.drawInfo,
    ];

    var objectAngleX = 0;
    var objectAngleY = 0;
    var objectAngleZ = 0;
    var objectSX = 0;
    var objectSY = 0;
    var objectSZ = 0;
    webglLessonsUI.setupSlider("#angleX", {value: radToDeg(objectAngleX), slide: updateObjectAngleX, min: -360, max: 360});
    webglLessonsUI.setupSlider("#angleY", {value: radToDeg(objectAngleY), slide: updateObjectAngleY, min: -360, max: 360});
    webglLessonsUI.setupSlider("#angleZ", {value: radToDeg(objectAngleZ), slide: updateObjectAngleZ, min: -360, max: 360});
    webglLessonsUI.setupSlider("#SX", {value: objectSX, slide: updateObjectSX, min: -100, max: 100});
    webglLessonsUI.setupSlider("#SY", {value: objectSY, slide: updateObjectSY, min: -100, max: 100});
    webglLessonsUI.setupSlider("#SZ", {value: objectSZ, slide: updateObjectSZ, min: -100, max: 100});

    function updateObjectAngleX(event, ui) {
      objectAngleX = degToRad(ui.value);
      drawScene();
    }

    function updateObjectAngleY(event, ui) {
      objectAngleY = degToRad(ui.value);
      drawScene();
    }

    function updateObjectAngleZ(event, ui) {
      objectAngleZ = degToRad(ui.value);
      drawScene();
    }

    function updateObjectSX(event, ui) {
      objectSX = ui.value;
      drawScene();
    }

    function updateObjectSY(event, ui) {
      objectSY = ui.value;
      drawScene();
    }

    function updateObjectSZ(event, ui) {
      objectSZ = ui.value;
      drawScene();
    }
    requestAnimationFrame(drawScene);
  
    // Draw the scene.
    function drawScene(time) {
      time = time * 0.0005;
  
      twgl.resizeCanvasToDisplaySize(gl.canvas);
  
      // Tell WebGL how to convert from clip space to pixels
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
  
      // Compute the projection matrix
      var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      var projectionMatrix =
          m4.perspective(fieldOfViewRadians, aspect, 1, 2000);
  
      // Compute the camera's matrix using look at.
      var cameraPosition = [0, 0, 100];
      var target = [0, 0, 0];
      var up = [0, 1, 0];
      var cameraRbt = Rbt.lookAt(cameraPosition, target, up);
      var cameraMatrix = Rbt.toM4(cameraRbt);
  
      // Make a view matrix from the camera matrix.
      var viewMatrix = m4.inverse(cameraMatrix);
      boxUniforms.u_viewInverse = m4.inverse(viewMatrix);
  
      var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);
  
      var boxYRotation   =  time * 0.8;
      var boxXRotation   =  0.1 * Math.sin(time);
      var boxZRotation   =  0.2 * Math.cos(time * 0.3);
      var boxYTranslation = 3 * Math.sin(time * 5);
  
      // Compute the matrices for each object.
      
      var cardRbt = Rbt.makeXRotation(boxXRotation);
      cardRbt = Rbt.multiply(cardRbt, Rbt.makeYRotation(boxYRotation));
      cardRbt = Rbt.multiply(cardRbt, Rbt.makeZRotation(boxZRotation));

      var auxRbt = Rbt.multiply(Rbt.transFact(cardRbt), Rbt.linFact(cameraRbt));

      var M = Rbt.makeXRotation(objectAngleX);
      M = Rbt.multiply(M, Rbt.makeYRotation(objectAngleY));
      M = Rbt.multiply(M, Rbt.makeZRotation(objectAngleZ));
      M = Rbt.multiply(Rbt.compose(null, [objectSX, objectSY + boxYTranslation, objectSZ]), M);
      var tempRbt = Rbt.multiply(auxRbt, M);
      tempRbt = Rbt.multiply(tempRbt, Rbt.inverse(auxRbt));
      cardRbt = Rbt.multiply(tempRbt, cardRbt);
      cardRBTNode.localRbt = cardRbt;

      cardRBTNode.updateWorldRbt();
  
      // ------ Draw the objects --------

      objects.forEach(function(object) {
        // console.log(object);
        var world = object.getWorldMatrix();
        object.drawInfo.uniforms.u_world = world;
        object.drawInfo.uniforms.u_worldInverseTranspose = m4.transpose(m4.inverse(world));
        object.drawInfo.uniforms.u_matrix = m4.multiply(viewProjectionMatrix, world);
        
        // console.log(world);
      }); 
      
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