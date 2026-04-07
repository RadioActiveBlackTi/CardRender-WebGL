# Preview

Some WebGL self-tutorial. (worked from about June, 2025 to July, 2025)
Some part would not function due to CORS (practiced on vscode html live).

# Contents
## 00-lib
- vec3.js: 3-dim vector operations
- vec4.js: related to homogenizing vec3
- m4.js: copied from GFXFundamentals. 4x4 matrix operations.
- quat.js: quaternion operations and conversion to mat3, slerp
- rbt.js: wrapper to control rigid body transformations. Works as 7-vec.
- arcball.js: helpers for arcball interaction
- sg.js: maintaining scene graph and manipulating it.
- geometry.js: making geometries (e.g. circle, cube, sphere)
- cors.js: some CORS things

## exercise01
- Thin-box Rotation and Translation with matrix.

## exercise02
- migration of exercise01 with Quaternion and Rbt.

## exercise03
- Round-walled box composition with Scene Graph
- Schene-graph oriented transformation

## exercise04
- Arcball Interaction

## exercise05
- One more Card Object
- Texture Mappinbg
- Diffuse, Specular, anisotropy
- Blooming effect using two-pass rendering
