// TODO: Make Arcball Interface, and limit it
"use strict";

function loadImage(url, callback) {
  var image = new Image();
  image.src = url;
  image.onload = callback;
  return image;
}

function loadImages(urls, callback) {
  var images = [];
  var imagesToLoad = urls.length;
 
  var onImageLoad = function() {
    --imagesToLoad;
    if (imagesToLoad === 0) {
      callback(images);
    }
  };
 
  for (var ii = 0; ii < imagesToLoad; ++ii) {
    var image = loadImage(urls[ii], onImageLoad);
    images.push(image);
  }
}

function makeDrawInfo(gl, vs, fs, array, uniforms, textureList) {
  var di = { 
      programInfo: twgl.createProgramInfo(gl, [vs, fs]),
      bufferInfo: twgl.createBufferInfoFromArrays(gl, array),
      uniforms: uniforms,
      textureIdx: textureList,
    };
  di.vertexArray = twgl.createVAOFromBufferInfo(gl, di.programInfo, di.bufferInfo);
  return di;
}

function main() {
    // Get A WebGL context
    /** @type {HTMLCanvasElement} */
    var canvas = document.querySelector("#canvas");
    var gl = canvas.getContext("webgl2");
    if (!gl) {
      return;
    }

    const ext = gl.getExtension("EXT_texture_filter_anisotropic") ||
            gl.getExtension("WEBKIT_EXT_texture_filter_anisotropic") ||
            gl.getExtension("MOZ_EXT_texture_filter_anisotropic");
    

    var urls = [
      "../images/back.png",
      "../images/front0.png",
      "../images/front0Normal.png",
      "../images/front1.png",
    ];

    var mapTex = {
      back: 0,
      front0: 1,
      front0Normal: 2,
      front1: 3,
    };

    loadImages(urls, loadCallback);

    var textureNum = urls.length;
    var textures = [];
    for (var ii = 0; ii < textureNum; ++ii) {
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);


        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
          new Uint8Array([255, 255, 255, 255]));
        textures.push(texture);
    }

    function loadCallback(images) {
      for (var ii = 0; ii < textureNum; ++ii) {
        var texture = textures[ii];
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, images[ii]);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        if (ext) {
          const maxAnisotropy = gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
          gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, maxAnisotropy);
      }
        gl.generateMipmap(gl.TEXTURE_2D);
        textures[ii] = texture;
      }
      drawScene();
    }

  
    // Tell the twgl to match position with a_position, n
    // normal with a_normal etc..
    twgl.setAttributePrefix("a_");
    
    var width = 30;
    var height = width * 1.4;
    var radius = width * 0.03;
    var depth = 0.3;
    var division = 15;
    var screenScale = 0.6;

    var boxArray = makeGeometry.makeRoundCard(width, height, radius, division);
    var boxBufferInfo = twgl.createBufferInfoFromArrays(gl, boxArray);

    var wallArray = makeGeometry.makeRoundWall(width, height, radius, 2 * depth, division);
    var wallBufferInfo = twgl.createBufferInfoFromArrays(gl, wallArray);

    var sphereArray = makeGeometry.makeSphere(1, 9, 9);
    var sphereBufferInfo = twgl.createBufferInfoFromArrays(gl, sphereArray);

    var squareArray = makeGeometry.makeSquare2D(2);
    var squareBufferInfo = twgl.createBufferInfoFromArrays(gl, squareArray);
  
    // setup GLSL program
    var programInfo = twgl.createProgramInfo(gl, [vs, fs]);
    var uvProgramInfo = twgl.createProgramInfo(gl, [vs_uv, fs_uv]);
    var normalProgramInfo = twgl.createProgramInfo(gl, [vs_normal, fs_normal]);
    var bgProgramInfo = twgl.createProgramInfo(gl, [vs_bg, fs_bg]);
  
    var boxVAO   = twgl.createVAOFromBufferInfo(gl, programInfo, boxBufferInfo);
    var uvBoxVAO = twgl.createVAOFromBufferInfo(gl, uvProgramInfo, boxBufferInfo);
    var normalBoxVAO = twgl.createVAOFromBufferInfo(gl, normalProgramInfo, boxBufferInfo);
    var wallVAO  = twgl.createVAOFromBufferInfo(gl, programInfo, wallBufferInfo);
    var sphereVAO = twgl.createVAOFromBufferInfo(gl, programInfo, sphereBufferInfo);
    var bgVAO = twgl.createVAOFromBufferInfo(gl, bgProgramInfo, squareBufferInfo);
    
  
    function degToRad(d) {
      return d * Math.PI / 180;
    }

    function radToDeg(r) {
      return r * 180 / Math.PI;
    }

    function getMouseOnCanvas(e) {
      const rect = canvas.getBoundingClientRect();

      if (e.touches) {
        return {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top,
          width: rect.width,
          height: rect.height
      };
      }
      return {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          width: rect.width,
          height: rect.height
      };
    }
    
    let isDragging = false;
    let isAnimating = false;
    let arcballLock = true;

    let viewMatrix = m4.identity();
    let projectionMatrix = m4.identity();
  
    var fieldOfViewRadians = degToRad(60);

    // Compute the camera's matrix using look at.
    var cameraPosition = [0, 0, 100];
    var target = [0, 0, 0];
    var up = [0, 1, 0];
    var cameraRbt = Rbt.lookAt(cameraPosition, target, up);
    var cameraMatrix = Rbt.toM4(cameraRbt);

    var deckRBTNode = new Node();
    var card1 = new Card(depth);
    var card2 = new Card(depth);

    var cards = [card1, card2];
    
    var targetIdx = 0;
    var target = cards[targetIdx];
    
    card1.setParent(deckRBTNode);
    card2.setParent(deckRBTNode);

    card1.superNode.localRbt = Rbt.compose(null, [-20, 0, 0]);
    card2.superNode.localRbt = Rbt.compose(null, [20, 0, 0]);

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
        case 's':
        case 'S':
          targetIdx = (targetIdx + 1) % (cards.length);
          target = cards[targetIdx];
          console.log("Now target is ", targetIdx);
        
        case 'e':
        case 'E':
          card1.superNode.localRbt = Rbt.compose(null, [-20, 0, 0]);
          card2.superNode.localRbt = Rbt.compose(null, [20, 0, 0]);
          target.superNode.localRbt = Rbt.compose(Quat.identity(), [0, 0, 30]);
          console.log("Make target out");
          
        case 'w':
        case 'W':
            target.cardRBTNode.localRbt = Rbt.compose(Quat.identity(), Rbt.trans(target.cardRBTNode.localRbt));
            target.animationRBTNode.localRbt = Rbt.compose(Quat.identity(), Rbt.trans(target.animationRBTNode.localRbt));
            console.log("Make quaternion centering");
            isAnimating = false;
            console.log("Stop animate");
            drawScene();
            break;
        
        case 'q':
        case 'Q':
            card1.superNode.localRbt = Rbt.compose(null, [-20, 0, 0]);
            card2.superNode.localRbt = Rbt.compose(null, [20, 0, 0]);
            card1.cardRBTNode.localRbt = Rbt.identity();
            card1.animationRBTNode.localRbt = Rbt.identity();
            card2.cardRBTNode.localRbt = Rbt.identity();
            card2.animationRBTNode.localRbt = Rbt.identity();
            console.log("All things back");
            isAnimating = false;
            console.log("Stop animate");
            drawScene();
            break;
      }
    });

    var holdTimer;

    canvas.addEventListener('touchstart', (e) => {
      isDragging = true;
      let prevPos = getMouseOnCanvas(e);
      prevAxis = mapToArcball(prevPos, Rbt.trans(arcballNode.worldRbt), viewMatrix, projectionMatrix, gl.canvas, 0.5);
      holdTimer = setTimeout(() => {
        isAnimating = isAnimating ^ 1;
          if (isAnimating) {
            console.log("Now animate");
            drawScene();
          }
          else {
            console.log("Stop animate");
          }
      }, 2000);
    });
  
    canvas.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      if (isAnimating) return;
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
          var auxRbt = Rbt.multiply(Rbt.transFact(target.cardRBTNode.localRbt), Rbt.linFact(cameraRbt));
          // console.log("cardRBT: ", Rbt.transFact(cardRBTNode.localRbt));
          // console.log("auxRBT: ", auxRbt);
          var M = Rbt.multiply(auxRbt, Rbt.multiply(arcballRotationRbt, Rbt.inverse(auxRbt)));
          var tempRbt = Rbt.multiply(M, target.cardRBTNode.localRbt);
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

          if (arcballLock) {
            var finalQuat = clampArcballRotation(viewVector, cameraUp, tempQuat, Math.PI / 6);
            // finalQuat = flipArcballRotation(tempQuat, Math.PI / 3);
          }
          else {
            var finalQuat = tempQuat
            prevAxis = currAxis;
          }
          var finalTrans = Rbt.trans(tempRbt);
          target.cardRBTNode.localRbt = Rbt.compose(finalQuat, finalTrans);
        }
      }
      // console.log(arcballRotationRbt);
      drawScene();
    });
  
    canvas.addEventListener('touchend', (e) => {
      isDragging = false;
      clearTimeout(holdTimer);
    });

    canvas.addEventListener('mousedown', (e) => {
      isDragging = true;
      let prevPos = getMouseOnCanvas(e);
      prevAxis = mapToArcball(prevPos, Rbt.trans(arcballNode.worldRbt), viewMatrix, projectionMatrix, gl.canvas, 0.5);
    });
  
    canvas.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      if (isAnimating) return;
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
          var auxRbt = Rbt.multiply(Rbt.transFact(target.cardRBTNode.localRbt), Rbt.linFact(cameraRbt));
          // console.log("cardRBT: ", Rbt.transFact(cardRBTNode.localRbt));
          // console.log("auxRBT: ", auxRbt);
          var M = Rbt.multiply(auxRbt, Rbt.multiply(arcballRotationRbt, Rbt.inverse(auxRbt)));
          var tempRbt = Rbt.multiply(M, target.cardRBTNode.localRbt);
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
          
          if (arcballLock) {
            var finalQuat = clampArcballRotation(viewVector, cameraUp, tempQuat, Math.PI / 6);
            // finalQuat = flipArcballRotation(tempQuat, Math.PI / 3);
          }
          else {
            var finalQuat = tempQuat
            prevAxis = currAxis;
          }
          var finalTrans = Rbt.trans(tempRbt);
          target.cardRBTNode.localRbt = Rbt.compose(finalQuat, finalTrans);
          
        }
      }
      // console.log(arcballRotationRbt);
      drawScene();
    });
  
    canvas.addEventListener('mouseup', (e) => {
      isDragging = false;
    });

    window.addEventListener('resize', (e) => {
      drawScene();
    });

    var lightWorldPos1 = [0, -10, 50];
    var lightWorldPos2 = [0, 10, 20];
  
    // Uniforms for each object.
    var boxUniforms = makeUniforms([0, 0.9, 1, 1], lightWorldPos1, lightWorldPos2);
    var backUniforms = makeUniforms([0.9, 1, 0, 1], lightWorldPos1, lightWorldPos2);
    var wallUniforms = makeUniforms([0.7, 0.7, 0.75, 1], lightWorldPos1, lightWorldPos2);

    boxUniforms.image0 = 0;
    boxUniforms.image1 = 1;
    backUniforms.image0 = 0;

    var box2Uniforms = makeUniforms([0.9, 0.5, 0.3, 1], lightWorldPos1, lightWorldPos2);
    var back2Uniforms = makeUniforms([0.5, 1, 0.7, 1], lightWorldPos1, lightWorldPos2);
    var wall2Uniforms = makeUniforms([0.7, 0.7, 0.75, 1], lightWorldPos1, lightWorldPos2);

    box2Uniforms.image0 = 0;
    back2Uniforms.image0 = 0;

    var arcballUniforms = makeUniforms([0, 0.7, 0, 1], lightWorldPos1, lightWorldPos2);

    card1.frontNode.drawInfo = {
      programInfo: normalProgramInfo,
      bufferInfo: boxBufferInfo,
      vertexArray: normalBoxVAO,
      uniforms: boxUniforms,
      textureIdx: [mapTex.front0, mapTex.front0Normal],
    };

    card1.backNode.drawInfo = {
      programInfo: uvProgramInfo,
      bufferInfo: boxBufferInfo,
      vertexArray: uvBoxVAO,
      uniforms: backUniforms,
      textureIdx: [mapTex.back],
    };

    card1.wallNode.drawInfo = {
      programInfo: programInfo,
      bufferInfo: wallBufferInfo,
      vertexArray: wallVAO,
      uniforms: wallUniforms,
    };

    card2.frontNode.drawInfo = {
        programInfo: uvProgramInfo,
        bufferInfo: boxBufferInfo,
        vertexArray: uvBoxVAO,
        uniforms: box2Uniforms,
        textureIdx: [mapTex.front1],
    };
  
    card2.backNode.drawInfo = {
        programInfo: uvProgramInfo,
        bufferInfo: boxBufferInfo,
        vertexArray: uvBoxVAO,
        uniforms: back2Uniforms,
        textureIdx: [mapTex.back],
    };
  
    card2.wallNode.drawInfo = {
        programInfo: programInfo,
        bufferInfo: wallBufferInfo,
        vertexArray: wallVAO,
        uniforms: wall2Uniforms,
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
    webglLessonsUI.setupSlider("#lockArcball", {value: arcballLock, slide: updateArcballLock, min: 0, max: 1});

    function updateObjectSX(event, ui) {
      if (isAnimating) return;
      objectSX = ui.value;
      var cardTrans = Rbt.trans(target.cardRBTNode.localRbt);
      var cardQuat = Rbt.quat(target.cardRBTNode.localRbt);
      
      cardTrans = [objectSX, cardTrans[1], cardTrans[2]];
      target.cardRBTNode.localRbt = Rbt.compose(cardQuat, cardTrans);
      drawScene();
    }

    function updateObjectSY(event, ui) {
      if (isAnimating) return;
      objectSY = ui.value;

      var cardTrans = Rbt.trans(target.cardRBTNode.localRbt);
      var cardQuat = Rbt.quat(target.cardRBTNode.localRbt);
      
      cardTrans = [cardTrans[0], objectSY, cardTrans[2]];
      target.cardRBTNode.localRbt = Rbt.compose(cardQuat, cardTrans);
      drawScene();
    }

    function updateObjectSZ(event, ui) {
      if (isAnimating) return;
      objectSZ = ui.value;

      var cardTrans = Rbt.trans(target.cardRBTNode.localRbt);
      var cardQuat = Rbt.quat(target.cardRBTNode.localRbt);
      
      cardTrans = [cardTrans[0], cardTrans[1], objectSZ];
      target.cardRBTNode.localRbt = Rbt.compose(cardQuat, cardTrans);
      drawScene();
    }

    function updateArcballDraw(event, ui) {
      arcballDraw = ui.value;
      drawScene();
    }

    function updateArcballLock(event, ui) {
      arcballLock = ui.value;
    }
    requestAnimationFrame(drawScene);
    
    var objects = [
      card1.frontNode,
      card1.backNode,
      card1.wallNode,
      
      card2.frontNode,
      card2.backNode,
      card2.wallNode,
    ];
    
    var objectsToDraw = [
      card1.frontNode.drawInfo,
      card1.backNode.drawInfo,
      card1.wallNode.drawInfo,

      card2.frontNode.drawInfo,
      card2.backNode.drawInfo,
      card2.wallNode.drawInfo,
    ];

    // Background Frame Buffer
    var bg = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, bg);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA, gl.canvas.width, gl.canvas.height, 0,
      gl.RGBA, gl.UNSIGNED_BYTE, null);
    
    // Background Depth Frame Buffer
    var bgDepth = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, bgDepth);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, gl.canvas.width, gl.canvas.height, 0,
      gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);


    const fbBg = gl.createFramebuffer();

    // Frame Buffer for bloom
    var sample = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, sample);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA, gl.canvas.width, gl.canvas.height, 0,
      gl.RGBA, gl.UNSIGNED_BYTE, null);

    var bloom = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, bloom);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA, gl.canvas.width, gl.canvas.height, 0,
      gl.RGBA, gl.UNSIGNED_BYTE, null);
    const fbSample = gl.createFramebuffer();
    const fbBloom = gl.createFramebuffer();
    
    var bgDrawInfo = makeDrawInfo(gl, vs_bg, fs_bg, squareArray, {bg: 0, bloom: 1});
    var sampleDrawInfo = makeDrawInfo(gl, vs_bg, fs_sample, squareArray, {bg: 0});
    var bloomDrawInfo = makeDrawInfo(gl, vs_bg, fs_bloom, squareArray, {bg: 0});

    // Draw the scene.
    function drawScene(time) {
      time = time * 0.0005;
    
      // Resize canvas
      const resized = twgl.resizeCanvasToDisplaySize(gl.canvas);
      if (resized) {
        // Texture Resizing
        gl.bindTexture(gl.TEXTURE_2D, bg);
        gl.texImage2D(
          gl.TEXTURE_2D, 0, gl.RGBA, gl.canvas.width, gl.canvas.height, 0,
          gl.RGBA, gl.UNSIGNED_BYTE, null);

        gl.bindTexture(gl.TEXTURE_2D, bgDepth);
        gl.texImage2D(
          gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, gl.canvas.width, gl.canvas.height, 0,
          gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
        
        gl.bindTexture(gl.TEXTURE_2D, sample);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.canvas.width, gl.canvas.height, 0, 
          gl.RGBA, gl.UNSIGNED_BYTE, null);
      
        
        gl.bindTexture(gl.TEXTURE_2D, bloom);
        gl.texImage2D(
          gl.TEXTURE_2D, 0, gl.RGBA, gl.canvas.width, gl.canvas.height, 0,
          gl.RGBA, gl.UNSIGNED_BYTE, null);
      }
    
      // Step 1. Draw 3D objects on Texture
    
      // bind on frame buffer
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbBg);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, bg, 0);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, bgDepth, 0);
    
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
    
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
      // Ordinary Drawing Routine
      var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      projectionMatrix =
          m4.perspective(fieldOfViewRadians, aspect, 1, 2000);
    
      viewMatrix = m4.inverse(cameraMatrix);
      var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);
    
      if (isAnimating) {
        var boxYRotation = time * 0.8;
        var boxXRotation = 0.1 * Math.sin(time);
        var boxZRotation = 0.2 * Math.cos(time * 0.3);
        var boxYTranslation = 3 * Math.sin(time * 5);
    
        var BA = Rbt.makeXRotation(boxXRotation);
        BA = Rbt.multiply(BA, Rbt.makeYRotation(boxYRotation), BA);
        BA = Rbt.multiply(BA, Rbt.makeZRotation(boxZRotation), BA);
        BA = Rbt.multiply(Rbt.compose(null, [0, boxYTranslation, 0]), BA, BA);
    
        target.animationRBTNode.localRbt = BA;
      }
      deckRBTNode.updateWorldRbt();
      arcballNode.worldRbt = Rbt.multiply(target.wallRBTNode.worldRbt, target.wallRBTNode.localRbt);
    
      objects.forEach(function(object) {
        var world = object.getWorldMatrix();
        object.drawInfo.uniforms.u_world = world;
        object.drawInfo.uniforms.u_worldInverseTranspose = m4.transpose(m4.inverse(world));
        object.drawInfo.uniforms.u_matrix = m4.multiply(viewProjectionMatrix, world);
        object.drawInfo.uniforms.u_cameraWorldPos = Rbt.trans(cameraRbt);
      });
    
      objectsToDraw.forEach(function(object) {
        var programInfo = object.programInfo;
        gl.useProgram(programInfo.program);
        gl.bindVertexArray(object.vertexArray);
        twgl.setUniforms(programInfo, object.uniforms);
        if (object.textureIdx) {
          for (var ii = 0; ii < object.textureIdx.length; ++ii) {
            gl.activeTexture(gl.TEXTURE0 + ii);
            gl.bindTexture(gl.TEXTURE_2D, textures[object.textureIdx[ii]]);
          }
        }
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
        gl.bindVertexArray(object.vertexArray);
        twgl.setUniforms(programInfo, object.uniforms);
        twgl.drawBufferInfo(gl, object.bufferInfo, object.drawType);
      }
      // End of Step 1
      
      // Step 2. Blooming
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbSample);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, sample, 0);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.CULL_FACE);

      // Sampling region
      gl.useProgram(sampleDrawInfo.programInfo.program);
    
      gl.bindVertexArray(sampleDrawInfo.vertexArray);
      
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, bg);
      
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      twgl.setUniforms(sampleDrawInfo.programInfo, sampleDrawInfo.uniforms);
    
      twgl.drawBufferInfo(gl, sampleDrawInfo.bufferInfo);

      // blurring region
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbBloom);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, bloom, 0);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.useProgram(bloomDrawInfo.programInfo.program);
    
      gl.bindVertexArray(bloomDrawInfo.vertexArray);
      
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, sample);
      
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      twgl.setUniforms(bloomDrawInfo.programInfo, bloomDrawInfo.uniforms);
    
      twgl.drawBufferInfo(gl, bloomDrawInfo.bufferInfo);


      // End of Step 2
    
      // Step 3. Draw bg buffer with bloom
    
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.CULL_FACE);
    
      gl.clearColor(0.5, 0.7, 0.8, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, bg);

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, bloom);

      gl.useProgram(bgDrawInfo.programInfo.program);
    
      gl.bindVertexArray(bgDrawInfo.vertexArray);
      twgl.setUniforms(bgDrawInfo.programInfo, bgDrawInfo.uniforms);
      // wtf why it does not work
      const loc = gl.getUniformLocation(bgDrawInfo.programInfo.program, "u_bloom");
      gl.uniform1i(loc, 1);
      twgl.drawBufferInfo(gl, bgDrawInfo.bufferInfo);

      gl.disable(gl.BLEND);

      // End of Step 3
    
      if (isAnimating) {
        requestAnimationFrame(drawScene);
      }
    }
  }
  
  main();