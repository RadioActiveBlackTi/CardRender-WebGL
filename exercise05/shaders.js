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

void main() {
  // Multiply the position by the matrix.
  v_position = u_matrix * a_position;

  // Pass the color to the fragment shader.
  v_normal = (u_worldInverseTranspose * vec4(a_normal, 0)).xyz;
  
  gl_Position = v_position;
}
`;

var fs = `#version 300 es
precision highp float;

// Passed in from the vertex shader.
in vec4 v_position;
in vec3 v_normal;

uniform vec4 u_color;
uniform vec3 u_lightWorldPos1;
uniform vec3 u_lightWorldPos2;
uniform vec3 u_cameraWorldPos;

out vec4 outColor;

vec3 bounce(vec3 normal, vec3 light) {
    return 2.0 * dot(normal, light) * normal - light;
}

void main() {
   vec3 normal = normalize(v_normal);
   vec3 t_position = vec3(v_position) / v_position.w;
   vec3 lightDir1 = normalize(u_lightWorldPos1 - t_position);
   vec3 lightDir2 = normalize(u_lightWorldPos2 - t_position);
   vec3 viewDir = normalize(u_cameraWorldPos - t_position);

   vec3 halfVec1 = normalize(lightDir1 + viewDir);
   vec3 halfVec2 = normalize(lightDir2 + viewDir);

   float ambientStrength = 0.4;
   float diffuseStrength = 0.6;
   float specularStrength = 0.4;
   float shininess = 50.0;

   float diffuseRaw = dot(normal, lightDir1);
   float diffuse1 = 0.6 * max(diffuseRaw, 0.2);
   float specular1 = specularStrength * pow(max(dot(normal, halfVec1), 0.0), shininess);

   diffuseRaw = dot(normal, lightDir2);
   float diffuse2 = 0.6 * max(diffuseRaw, 0.2);
   float specular2 = specularStrength * pow(max(dot(normal, halfVec2), 0.0), shininess);

   float light = ambientStrength + diffuse1 + specular1 + diffuse2 + specular2;

   outColor = vec4(light * u_color.rgb, u_color.a);
}
`;

var vs_uv = `#version 300 es

in vec4 a_position;
in vec3 a_normal;
in vec2 a_texcoord;

uniform mat4 u_matrix;
uniform vec3 u_lightWorldPos;
uniform mat4 u_world;
uniform mat4 u_viewInverse;
uniform mat4 u_worldInverseTranspose;

out vec4 v_position;
out vec3 v_normal;
out vec2 v_texcoord;

void main() {
  // Multiply the position by the matrix.
  v_position = u_matrix * a_position;

  // Pass the color to the fragment shader.
  v_normal = (u_worldInverseTranspose * vec4(a_normal, 0)).xyz;
  v_texcoord = a_texcoord;
  
  gl_Position = v_position;
}
`;

var fs_uv = `#version 300 es
precision highp float;

// Passed in from the vertex shader.
in vec4 v_position;
in vec3 v_normal;
in vec2 v_texcoord;

uniform vec4 u_color;
uniform vec3 u_lightWorldPos1;
uniform vec3 u_lightWorldPos2;
uniform vec3 u_cameraWorldPos;

uniform sampler2D u_image0;

out vec4 outColor;

vec3 bounce(vec3 normal, vec3 light) {
    return 2.0 * dot(normal, light) * normal - light;
}

void main() {
   vec3 normal = normalize(v_normal);
   vec3 t_position = vec3(v_position) / v_position.w;
   vec3 lightDir1 = normalize(u_lightWorldPos1 - t_position);
   vec3 lightDir2 = normalize(u_lightWorldPos2 - t_position);
   vec3 viewDir = normalize(u_cameraWorldPos - t_position);

   vec3 halfVec1 = normalize(lightDir1 + viewDir);
   vec3 halfVec2 = normalize(lightDir2 + viewDir);
   
   float ambientStrength = 0.8;
   float diffuseStrength = 0.05;
   float specularStrength = 0.2;
   float shininess = 10.0;

   float diffuseRaw = dot(normal, lightDir1);
   float diffuse1 = 0.6 * max(diffuseRaw, 0.2);
   float specular1 = specularStrength * pow(max(dot(normal, halfVec1), 0.0), shininess);

   diffuseRaw = dot(normal, lightDir2);
   float diffuse2 = 0.6 * max(diffuseRaw, 0.2);
   float specular2 = specularStrength * pow(max(dot(normal, halfVec2), 0.0), shininess);

   float diffuse = min(diffuse1 + diffuse2, diffuseStrength);
   float specular = min(specular1 + specular2, specularStrength);

   float light = ambientStrength + diffuse + specular;

   vec4 color = texture(u_image0, v_texcoord);

   outColor = vec4(light * color.rgb, color.a);
}
`;


var vs_normal = `#version 300 es

in vec4 a_position;
in vec3 a_normal;
in vec3 a_tangent;
in vec3 a_binormal;
in vec2 a_texcoord;

uniform mat4 u_matrix;
uniform vec3 u_lightWorldPos;
uniform mat4 u_world;
uniform mat4 u_viewInverse;
uniform mat4 u_worldInverseTranspose;

out vec4 v_position;
out vec3 v_normal;
out vec2 v_texcoord;
out mat3 vNTMat;

void main() {
  // Multiply the position by the matrix.
  v_position = u_matrix * a_position;

  // Pass the color to the fragment shader.
  v_normal = (u_worldInverseTranspose * vec4(a_normal, 0)).xyz;
  v_texcoord = a_texcoord;
  vNTMat = mat3(u_worldInverseTranspose) * mat3(a_tangent, a_binormal, a_normal);
  
  gl_Position = v_position;
}
`;

var fs_normal = `#version 300 es
precision highp float;

// Passed in from the vertex shader.
in vec4 v_position;
in vec3 v_normal;
in vec2 v_texcoord;
in mat3 vNTMat;

uniform vec4 u_color;
uniform vec3 u_lightWorldPos1;
uniform vec3 u_lightWorldPos2;
uniform vec3 u_cameraWorldPos;

uniform sampler2D u_image0;
uniform sampler2D u_image1;

out vec4 outColor;

vec3 bounce(vec3 normal, vec3 light) {
  return 2.0 * dot(normal, light) * normal - light;
}

vec3 pastelHologramColor(vec2 uv) {
  vec2 p = uv * 4.0;
  float angle = atan(p.y - 2.0, p.x - 2.0);
  float radius = length(p - vec2(2.0));

  float hue = angle / 6.2831 + 0.5; // hue ∈ [0,1]

  float s = 0.3;
  float v = 1.0;
  float c = v * s;
  float x = c * (1.0 - abs(mod(hue * 6.0, 2.0) - 1.0));
  float m = v - c;

  vec3 rgb;
  if (hue < 1.0 / 6.0)      rgb = vec3(c, x, 0.0);
  else if (hue < 2.0 / 6.0) rgb = vec3(x, c, 0.0);
  else if (hue < 3.0 / 6.0) rgb = vec3(0.0, c, x);
  else if (hue < 4.0 / 6.0) rgb = vec3(0.0, x, c);
  else if (hue < 5.0 / 6.0) rgb = vec3(x, 0.0, c);
  else                     rgb = vec3(c, 0.0, x);

  return rgb + vec3(m);
}

void main() {

   vec3 tnormal = 2.0 * texture(u_image1, v_texcoord).rgb - 1.0;
   vec3 normal = normalize(vNTMat * tnormal);
   vec3 t_position = vec3(v_position) / v_position.w;
   vec3 lightDir1 = normalize(u_lightWorldPos1 - t_position);
   vec3 lightDir2 = normalize(u_lightWorldPos2 - t_position);
   vec3 viewDir = normalize(u_cameraWorldPos - t_position);

   vec3 halfVec1 = normalize(lightDir1 + viewDir);
   vec3 halfVec2 = normalize(lightDir2 + viewDir);

   vec3 aniTan = normalize(vec3(1, 1, 0));
   vec3 aniVec = normalize(aniTan);

   float ambientStrength = 0.6;
   float diffuseStrength = 0.6;
   float specularStrength = 0.6;
   
   float shininess = 50.0;
   float anisoShininess = 1.0;

   float diffuseRaw = dot(normal, lightDir1);
   float diffuse1 = 0.6 * max(diffuseRaw, 0.2);
   float specular1 = specularStrength * pow(max(dot(normal, halfVec1), 0.0), shininess);
   float aniso = dot(aniVec, normalize(v_normal));
   float aniso1 = pow(1.0 - aniso * aniso, anisoShininess);

   diffuseRaw = dot(normal, lightDir2);
   float diffuse2 = 0.6 * max(diffuseRaw, 0.2);
   float specular2 = specularStrength * pow(max(dot(v_normal, halfVec2), 0.0), shininess);
   aniso = dot(aniVec, normalize(v_normal));
   float aniso2 = pow(1.0 - aniso * aniso, anisoShininess);

   float light = ambientStrength + diffuse1 + specular1 + diffuse2 + specular2;

   vec4 color = texture(u_image0, v_texcoord);
   // color = vec4(0.5, 0.5, 0.5, 1);
   
   float f = aniso1 + aniso2;
   float shift = dot(viewDir, aniVec);
   float dotVN = dot(viewDir, normalize(v_normal));
   shift = shift * 10.0;
   float dirComp = (v_texcoord.x - v_texcoord.y + 1.0);
   float grid = max(0.7 * sin(dirComp * 5.0 + shift), 0.1);
   grid = pow(grid, 0.6);
   vec3 hologram = pastelHologramColor(v_texcoord);

   vec3 lightColor = light * color.rgb;
   vec3 holoColor = max(f * grid, 0.4) * hologram;

   float factor = max(1.0 - (dotVN + 1.0) / 2.0, 0.001);
   float anisotropyMix = pow(factor, 0.5);
   
   outColor = vec4(mix(lightColor, holoColor, anisotropyMix), color.a);
   // outColor = vec4(hologram, color.a);
}
`;

var vs_bg = `#version 300 es

in vec4 a_position;
in vec2 a_texcoord;

out vec4 v_position;
out vec2 v_texcoord;

void main() {
  // Multiply the position by the matrix.
  v_position = a_position;
  gl_Position = v_position;

  v_texcoord = a_texcoord;
}
`;

var fs_bg = `#version 300 es
precision highp float;

in vec4 v_position;
in vec2 v_texcoord;

uniform sampler2D u_bg;
uniform sampler2D u_bloom;

out vec4 outColor;

void main() {
  float bloom = 0.3;
  vec4 bgColor = texture(u_bg, v_texcoord);
  vec4 bloomColor = texture(u_bloom, v_texcoord);
  outColor = bloomColor * bloom + bgColor;
  // outColor = bloomColor;

  // outColor = vec4(v_texcoord.x, v_texcoord.y, 1.0, 1.0);
}
`;

var fs_sample = `#version 300 es
precision highp float;

in vec4 v_position;
in vec2 v_texcoord;

uniform sampler2D u_bg;

out vec4 outColor;

void main() {
  float threshold = 0.99;

  vec4 color = texture(u_bg, v_texcoord);
  float value = max(color.r, max(color.g, color.b));
  if (value > threshold) {
    outColor = color;
  }
  else {
    outColor = vec4(0.0);
  }
}
`;

var fs_bloom = `#version 300 es
precision highp float;

in vec4 v_position;
in vec2 v_texcoord;

uniform sampler2D u_bg;

out vec4 outColor;

void main() {
  vec2 texSize = vec2(textureSize(u_bg, 0));
  int size = 5;
  float seperateU = 5.5 / texSize.x;
  float seperateV = 5.5 / texSize.y;

  vec4 result = vec4(0.0);
  vec4 color = vec4(0.0);

  for (int i = -size; i <= size; ++i) {
    for (int j = -size; j <= size; ++j) {
      result += texture(u_bg, v_texcoord + vec2(float(i) * seperateU, float(j) * seperateV));
    }
  }

  color = result / float((2 * size + 1) * (2 * size + 1));
  float value = max(color.r, max(color.g, color.b));
  
  outColor = color;
  // outColor = vec4(v_texcoord.x, v_texcoord.y, 1.0, 1.0);
}
`;