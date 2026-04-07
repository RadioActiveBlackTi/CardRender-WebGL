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
**Link for ex1.html: https://radioactiveblackti.github.io/CardRender-WebGL/exercise01/ex1.html**
- Thin-box Rotation and Translation with matrix.

## exercise02
**Link for ex2.html: https://radioactiveblackti.github.io/CardRender-WebGL/exercise02/ex2.html**
- migration of exercise01 with Quaternion and Rbt.

## exercise03
**Link for ex3.html: https://radioactiveblackti.github.io/CardRender-WebGL/exercise03/ex3.html**
- Round-walled box composition with Scene Graph
- Schene-graph oriented transformation

## exercise04
**Link for ex4.html: https://radioactiveblackti.github.io/CardRender-WebGL/exercise04/ex4.html**
- Arcball Interaction

## exercise05
**Link for ex5.html: https://radioactiveblackti.github.io/CardRender-WebGL/exercise05/ex5.html**
- One more Card Object
- Texture Mappinbg
- Diffuse, Specular, anisotropy
- Blooming effect using two-pass rendering
