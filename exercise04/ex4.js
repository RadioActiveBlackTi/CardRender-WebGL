// TODO: Make Arcball Interface, and limit it
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
    var radius = width * 0.02;
    var depth = 0.3;
    var division = 15;
    var screenScale = 0.6;

    var boxArray = makeGeometry.makeRoundCard(width, height, radius, division);
    var boxBufferInfo = twgl.createBufferInfoFromArrays(gl, boxArray);

    var wallArray = makeGeometry.makeRoundWall(width, height, radius, 2 * depth, division);
    var wallBufferInfo = twgl.createBufferInfoFromArrays(gl, wallArray);

    var sphereArray = makeGeometry.makeSphere(1, 9, 9);
    var sphereBufferInfo = twgl.createBufferInfoFromArrays(gl, sphereArray);
  
    // setup GLSL program
    var programInfo = twgl.createProgramInfo(gl, [vs, fs]);
  
    var boxVAO   = twgl.createVAOFromBufferInfo(gl, programInfo, boxBufferInfo);
    var wallVAO  = twgl.createVAOFromBufferInfo(gl, programInfo, wallBufferInfo);
    var sphereVAO = twgl.createVAOFromBufferInfo(gl, programInfo, sphereBufferInfo);
    
  
    function degToRad(d) {
      return d * Math.PI / 180;
    }

    function radToDeg(r) {
      return r * 180 / Math.PI;
    }

    function getMouseOnCanvas(e) {
      const rect = canvas.getBoundingClientRect();
      return {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          width: rect.width,
          height: rect.height
      };
    }
    
    let isDragging = false;
    let isAnimating = false;

    let viewMatrix = m4.identity();
    let projectionMatrix = m4.identity();
  
    var fieldOfViewRadians = degToRad(60);

    // Compute the camera's matrix using look at.
    var cameraPosition = [0, 0, 100];
    var target = [0, 0, 0];
    var up = [0, 1, 0];
    var cameraRbt = Rbt.lookAt(cameraPosition, target, up);
    var cameraMatrix = Rbt.toM4(cameraRbt);

    
    var cardRBTNode = new Node();
    var animationRBTNode = new Node();
    var frontRBTNode = new Node();
    var frontNode = new Node();
    var backRBTNode = new Node();
    var backNode = new Node();
    var wallRBTNode = new Node();
    var wallNode = new Node();

    animationRBTNode.setParent(cardRBTNode);
    frontRBTNode.setParent(animationRBTNode);
    backRBTNode.setParent(animationRBTNode);
    wallRBTNode.setParent(animationRBTNode);
    frontNode.setParent(frontRBTNode);
    backNode.setParent(backRBTNode);
    wallNode.setParent(wallRBTNode);

    frontRBTNode.localRbt = Rbt.compose(null, [0, 0, depth]);
    backRBTNode.localRbt = Rbt.compose(Quat.makeYRotation(Math.PI), [0, 0, -depth]);
    wallRBTNode.localRbt = Rbt.identity();

    frontNode.localTRS = new TRS();
    backNode.localTRS = new TRS();
    wallNode.localTRS = new TRS();

    var arcballNode = new Node()
    arcballNode.localTRS = new TRS();

    var arcballRotationRbt = Rbt.identity();
    var prevAxis = [0, 0, 0];
    var currAxis = [0, 0, 0];

    window.addEventListener('keydown', (e) => {
      const key = e.key;
      switch(key) {
        case 'a':
        case 'A':
          isAnimating = isAnimating ^ 1;
          if (isAnimating) {
            console.log("Now animate");
            drawScene();
          }
          else {
            console.log("Stop animate");
          }
          break;
      }
    });

    canvas.addEventListener('touchstart', (e) => {
      isDragging = true;
      let prevPos = getMouseOnCanvas(e);
      prevAxis = mapToArcball(prevPos, Rbt.trans(arcballNode.worldRbt), viewMatrix, projectionMatrix, gl.canvas, 0.5);
    });
  
    canvas.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      let currPos = getMouseOnCanvas(e);
      currAxis = mapToArcball(currPos, Rbt.trans(arcballNode.worldRbt), viewMatrix, projectionMatrix, gl.canvas, 0.5);

      const prevLengthSq = Vec3.norm2(prevAxis);
      const currLengthSq = Vec3.norm2(currAxis);

      if (prevLengthSq > 1e-6 && currLengthSq > 1e-6) {
        const normalizedPrev = Vec3.normalize(prevAxis);
        const normalizedCurr = Vec3.normalize(currAxis);

        const rotationAxis = Vec3.cross(normalizedPrev, normalizedCurr);
        
        const dotProduct = Vec3.dot(normalizedPrev, normalizedCurr);
        const rotationAngle = Math.acos(Math.max(-1.0, Math.min(1.0, dotProduct)));

        if (Vec3.norm2(rotationAxis) > 1e-12 && Math.abs(rotationAngle) > 1e-12) {
          const incrementalQuat = Quat.compose(Vec3.normalize(rotationAxis), rotationAngle);
          arcballRotationRbt = Rbt.compose(incrementalQuat);
          var auxRbt = Rbt.multiply(Rbt.transFact(cardRBTNode.localRbt), Rbt.linFact(cameraRbt));
          // console.log("cardRBT: ", Rbt.transFact(cardRBTNode.localRbt));
          // console.log("auxRBT: ", auxRbt);
          var M = Rbt.multiply(auxRbt, Rbt.multiply(arcballRotationRbt, Rbt.inverse(auxRbt)));
          var tempRbt = Rbt.multiply(M, cardRBTNode.localRbt);
          var tempQuat = Rbt.quat(tempRbt);
          var viewVector = Vec3.normalize([
                          -viewMatrix[8],
                          -viewMatrix[9],
                          -viewMatrix[10],
          ]);
          var cameraUp = Vec3.normalize([
                          viewMatrix[4],  // x
                          viewMatrix[5],  // y
                          viewMatrix[6],  // z
          ]);

          var finalQuat = clampArcballRotation(viewVector, cameraUp, tempQuat, Math.PI / 6);
          // finalQuat = flipArcballRotation(tempQuat, Math.PI / 3);
          var finalTrans = Rbt.trans(tempRbt);
          cardRBTNode.localRbt = Rbt.compose(finalQuat, finalTrans);
        }
      }
      // console.log(arcballRotationRbt);
      drawScene();
    });
  
    canvas.addEventListener('touchend', (e) => {
      isDragging = false;
      arcballRotationRbt = Rbt.identity();
    });

    canvas.addEventListener('mousedown', (e) => {
      isDragging = true;
      let prevPos = getMouseOnCanvas(e);
      prevAxis = mapToArcball(prevPos, Rbt.trans(arcballNode.worldRbt), viewMatrix, projectionMatrix, gl.canvas, 0.5);
    });
  
    canvas.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      let currPos = getMouseOnCanvas(e);
      currAxis = mapToArcball(currPos, Rbt.trans(arcballNode.worldRbt), viewMatrix, projectionMatrix, gl.canvas, 0.5);

      const prevLengthSq = Vec3.norm2(prevAxis);
      const currLengthSq = Vec3.norm2(currAxis);

      if (prevLengthSq > 1e-6 && currLengthSq > 1e-6) {
        const normalizedPrev = Vec3.normalize(prevAxis);
        const normalizedCurr = Vec3.normalize(currAxis);

        const rotationAxis = Vec3.cross(normalizedPrev, normalizedCurr);
        
        const dotProduct = Vec3.dot(normalizedPrev, normalizedCurr);
        const rotationAngle = Math.acos(Math.max(-1.0, Math.min(1.0, dotProduct)));

        if (Vec3.norm2(rotationAxis) > 1e-12 && Math.abs(rotationAngle) > 1e-12) {
          const incrementalQuat = Quat.compose(Vec3.normalize(rotationAxis), rotationAngle);
          arcballRotationRbt = Rbt.compose(incrementalQuat);
          var auxRbt = Rbt.multiply(Rbt.transFact(cardRBTNode.localRbt), Rbt.linFact(cameraRbt));
          // console.log("cardRBT: ", Rbt.transFact(cardRBTNode.localRbt));
          // console.log("auxRBT: ", auxRbt);
          var M = Rbt.multiply(auxRbt, Rbt.multiply(arcballRotationRbt, Rbt.inverse(auxRbt)));
          var tempRbt = Rbt.multiply(M, cardRBTNode.localRbt);
          var tempQuat = Rbt.quat(tempRbt);
          var viewVector = Vec3.normalize([
                          -viewMatrix[8],
                          -viewMatrix[9],
                          -viewMatrix[10],
          ]);
          var cameraUp = Vec3.normalize([
                          viewMatrix[4],  // x
                          viewMatrix[5],  // y
                          viewMatrix[6],  // z
          ]);

          var finalQuat = clampArcballRotation(viewVector, cameraUp, tempQuat, Math.PI / 6);
          // finalQuat = flipArcballRotation(tempQuat, Math.PI / 3);
          var finalTrans = Rbt.trans(tempRbt);
          cardRBTNode.localRbt = Rbt.compose(finalQuat, finalTrans);
        }
      }
      // console.log(arcballRotationRbt);
      drawScene();
    });
  
    canvas.addEventListener('mouseup', (e) => {
      isDragging = false;
      arcballRotationRbt = Rbt.identity();
    });

    window.addEventListener('resize', (e) => {
      drawScene();
    });
  
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

    var arcballUniforms = {
      u_color: [0, 0.7, 0, 1],
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

    arcballNode.drawInfo = {
      programInfo: programInfo,
      bufferInfo: sphereBufferInfo,
      vertexArray: sphereVAO,
      uniforms: arcballUniforms,
      drawType: gl.LINES,
    };


    var objectAngleX = 0;
    var objectAngleY = 0;
    var objectAngleZ = 0;
    var objectSX = 0;
    var objectSY = 0;
    var objectSZ = 0;
    var arcballDraw = false;
    
    webglLessonsUI.setupSlider("#SX", {value: objectSX, slide: updateObjectSX, min: -100, max: 100});
    webglLessonsUI.setupSlider("#SY", {value: objectSY, slide: updateObjectSY, min: -100, max: 100});
    webglLessonsUI.setupSlider("#SZ", {value: objectSZ, slide: updateObjectSZ, min: -100, max: 100});
    webglLessonsUI.setupSlider("#drawArcball", {value: arcballDraw, slide: updateArcballDraw, min: 0, max: 1});

    function updateObjectSX(event, ui) {
      objectSX = ui.value;
      var cardTrans = Rbt.trans(cardRBTNode.localRbt);
      var cardQuat = Rbt.quat(cardRBTNode.localRbt);
      
      cardTrans = [objectSX, cardTrans[1], cardTrans[2]];
      cardRBTNode.localRbt = Rbt.compose(cardQuat, cardTrans);
      drawScene();
    }

    function updateObjectSY(event, ui) {
      objectSY = ui.value;

      var cardTrans = Rbt.trans(cardRBTNode.localRbt);
      var cardQuat = Rbt.quat(cardRBTNode.localRbt);
      
      cardTrans = [cardTrans[0], objectSY, cardTrans[2]];
      cardRBTNode.localRbt = Rbt.compose(cardQuat, cardTrans);
      drawScene();
    }

    function updateObjectSZ(event, ui) {
      objectSZ = ui.value;

      var cardTrans = Rbt.trans(cardRBTNode.localRbt);
      var cardQuat = Rbt.quat(cardRBTNode.localRbt);
      
      cardTrans = [cardTrans[0], cardTrans[1], objectSZ];
      cardRBTNode.localRbt = Rbt.compose(cardQuat, cardTrans);
      drawScene();
    }

    function updateArcballDraw(event, ui) {
      arcballDraw = ui.value;
      drawScene();
    }
    requestAnimationFrame(drawScene);
  
    // Draw the scene.
    function drawScene(time) {
      time = time * 0.0005;

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
  
      twgl.resizeCanvasToDisplaySize(gl.canvas);
  
      // Tell WebGL how to convert from clip space to pixels
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
  
      // Compute the projection matrix
      var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      projectionMatrix =
          m4.perspective(fieldOfViewRadians, aspect, 1, 2000);
  
      // Make a view matrix from the camera matrix.
      viewMatrix = m4.inverse(cameraMatrix);
      boxUniforms.u_viewInverse = m4.inverse(viewMatrix);
  
      var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);
      
      if (isAnimating) {
        var boxYRotation   =  time * 0.8;
        var boxXRotation   =  0.1 * Math.sin(time);
        var boxZRotation   =  0.2 * Math.cos(time * 0.3);
        var boxYTranslation = 3 * Math.sin(time * 5);
    
        // Compute the matrices for each object.
        
        var BA = Rbt.makeXRotation(boxXRotation);
        BA = Rbt.multiply(BA, Rbt.makeYRotation(boxYRotation));
        BA = Rbt.multiply(BA, Rbt.makeZRotation(boxZRotation));
        BA = Rbt.multiply(Rbt.compose(null, [0, boxYTranslation, 0]), BA);
        
        animationRBTNode.localRbt = BA;
      }
      cardRBTNode.updateWorldRbt();
      arcballNode.worldRbt = Rbt.multiply(animationRBTNode.worldRbt, animationRBTNode.localRbt);

      

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
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
  
        twgl.drawBufferInfo(gl, object.bufferInfo, object.drawType);
      });

      if (arcballDraw) {
        var arcballRadius = computeArcballRadius(Rbt.trans(cameraRbt), Rbt.trans(arcballNode.worldRbt), fieldOfViewRadians, screenScale);
        arcballNode.localTRS.scale = [arcballRadius, arcballRadius, arcballRadius];
        
        var object = arcballNode;
        var world = object.getWorldMatrix();
        object.drawInfo.uniforms.u_world = world;
        object.drawInfo.uniforms.u_worldInverseTranspose = m4.transpose(m4.inverse(world));
        object.drawInfo.uniforms.u_matrix = m4.multiply(viewProjectionMatrix, world);

        object = arcballNode.drawInfo;
        var programInfo = object.programInfo;
  
        gl.useProgram(programInfo.program);
  
        // Setup all the needed attributes.
        gl.bindVertexArray(object.vertexArray);
  
        // Set the uniforms we just computed
        twgl.setUniforms(programInfo, object.uniforms);
  
        twgl.drawBufferInfo(gl, object.bufferInfo, object.drawType);
      }
      if (isAnimating) {
        requestAnimationFrame(drawScene);
      }
    }
  }
  
  main();