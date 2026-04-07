function computeArcballRadius(cameraPosition, arcballCenter, fovY, screenScale = 0.5) {
    var d = Math.sqrt(Vec3.norm2(Vec3.sub(cameraPosition, arcballCenter)));
    var theta = fovY;
    if (d <= 0) {
        console.log("Warning: negative distance is not supported");
        return 1;
    }
    return d * Math.tan(theta / 2) * screenScale;
}

function projectToScreen(posWorld, viewMatrix, projMatrix, canvasSize) {
    // vec3 -> clip space -> NDC -> screen space
    const v4 = Vec4.fromVec3(posWorld);

    // proj * view * pos
    var clip = Vec4.multiplyM4(viewMatrix, v4);
    clip = Vec4.multiplyM4(projMatrix, clip);

    // perspective divide
    const ndc = Vec4.toNDC(clip);
    // screen space
    const screenX = (ndc[0] * 0.5 + 0.5) * canvasSize.width;
    const screenY = (1.0 - (ndc[1] * 0.5 + 0.5)) * canvasSize.height;

    return { x: screenX, y: screenY };
}

function mapToArcball(mousePos, arcballCenter_world, viewMatrix, projMatrix, canvasSize, screenScale = 0.5) {
    const arcballScreenCenter = projectToScreen(arcballCenter_world, viewMatrix, projMatrix, canvasSize);

    const arcballRadius = Math.min(canvasSize.width, canvasSize.height) * screenScale * 0.5;

    const dx = mousePos.x - arcballScreenCenter.x;
    const dy = mousePos.y - arcballScreenCenter.y;

    const sx = dx / arcballRadius;
    const sy = -dy / arcballRadius; 

    const length2 = sx * sx + sy * sy;

    if (length2 > 1.0) {
        const norm = 1.0 / Math.sqrt(length2);
        return [sx * norm, sy * norm, 0];
    } else {
        const z = Math.sqrt(1.0 - length2);
        return [sx, sy, z];
    }
}

function clampArcballRotation(v, w, q, maxAngleRadians) {
    const rotV = Quat.rotate(q, v);
    const angleZ = Math.acos(Math.max(-1, Math.min(1, Vec3.dot(rotV, v))));
    const rotW = Quat.rotate(q, w);
    const angleY = Math.acos(Math.max(-1, Math.min(1, Vec3.dot(rotW, w))));
    let halfAngle = maxAngleRadians / 2;
    let axis = [q[0], q[1], q[2]];
    if (angleZ <= maxAngleRadians && angleY <= maxAngleRadians) {
      return q;
    }
    
    const axisLen = Math.sqrt(Vec3.norm2(axis));
    if (axisLen < 1e-5) return [0, 0, 0, 1];
  
    const normalized = axis.map(v => v / axisLen);
    
    const sinHalf = Math.sin(halfAngle);
    const cosHalf = Math.cos(halfAngle);
    return [
      normalized[0] * sinHalf,
      normalized[1] * sinHalf,
      normalized[2] * sinHalf,
      cosHalf
    ];
  }

function flipArcballRotation(q, flipAngleRadians) {
    const angle = 2 * Math.acos(Math.max(-1, Math.min(1, q[3])));  // w = q[3]
    const flipQuat = Quat.compose([0, 1, 0], Math.PI);
    if (angle <= flipAngleRadians) {
        return q;
    }

    const result = Quat.multiply(flipQuat, q);
    return result;
}