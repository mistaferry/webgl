function deg2rad(angle) {
    return angle * Math.PI / 180;
}

function Vertex(p, t)
{
    this.p = p;
    this.t = t;
    this.normal = [];
    this.triangles = [];
}

function Triangle(v0, v1, v2)
{
    this.v0 = v0;
    this.v1 = v1;
    this.v2 = v2;
    this.normal = [];
    this.tangent = [];
}

// Constructor
function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.iIndexBuffer = gl.createBuffer();
    this.iNormalBuffer = gl.createBuffer();
    this.iTextureBuffer = gl.createBuffer();
    this.count = 0;

    // Identifier of a diffuse texture
    this.iTextureDiffuse  = -1;
    this.iTextureSpecular = -1;
    this.iTextureNormal = -1;

    this.BufferData = function(vertices, indices, normals, textCoord) {
        // Vertex buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    
        // Normal buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW); 
    
        // Index buffer
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    
        // Texture buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTextureBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, textCoord, gl.STATIC_DRAW);

        this.count = indices.length;
    }
    
    this.Draw = function() {

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, surface.iTextureDiffuse);
        gl.uniform1i(shProgram.iTextureDiffuse, 0); 

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, surface.iTextureSpecular);
        gl.uniform1i(shProgram.iTextureSpecular, 1);

        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, surface.iTextureNormal);
        gl.uniform1i(shProgram.iTextureNormal, 2);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);
    
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.vertexAttribPointer(shProgram.iAttribNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribNormal);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTextureBuffer);
        gl.vertexAttribPointer(shProgram.iAttribTextureCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribTextureCoord);
    
        gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
    }
}

let a = 1, n = 1, m = 2, b = 1, q = 0;
let w = (m * Math.PI) / b;
let uPolysNum = 0;
let vPolysNum = 0;

function CreateSurfaceData(data) {
    let renderVertices = [];
    let allTriangles = [];
    let facetNormals = [];

    uPolysNum = document.getElementById("u").value;
    vPolysNum = document.getElementById("v").value;

    // Surface vertex data generation
    let originalVertices = CreateVertexData(uPolysNum, vPolysNum);
    
    processData(vPolysNum, uPolysNum, allTriangles, originalVertices, renderVertices, facetNormals);

    prepareRenderData(data, renderVertices, allTriangles, facetNormals);
}

function prepareRenderData(data, renderVertices, allTriangles, facetNormals){
    // Populate texture buffer
    data.textCoordF32 = new Float32Array(renderVertices.length * 2);

    // Populate vertex buffer
    data.verticesF32 = new Float32Array(renderVertices.length * 3);
    for (let i = 0, len = renderVertices.length; i < len; i++) {
        data.verticesF32[i * 3 + 0] = renderVertices[i].p[0];
        data.verticesF32[i * 3 + 1] = renderVertices[i].p[1];
        data.verticesF32[i * 3 + 2] = renderVertices[i].p[2];

        data.textCoordF32[i * 2 + 0] = renderVertices[i].t[0];
        data.textCoordF32[i * 2 + 1] = renderVertices[i].t[1];
    }

    //Populate index buffer
    data.indicesU16 = new Uint16Array(allTriangles.length * 3);
    for (let i = 0, len = allTriangles.length; i < len; i++) {
        data.indicesU16[i * 3 + 0] = allTriangles[i].v0;
        data.indicesU16[i * 3 + 1] = allTriangles[i].v1;
        data.indicesU16[i * 3 + 2] = allTriangles[i].v2;
    }

    // Populate normal buffer
    data.normalsF32 = new Float32Array(facetNormals.length * 3);
    for (let i = 0, len = facetNormals.length; i < len; i++) {
        data.normalsF32[i * 3 + 0] = facetNormals[i][0];
        data.normalsF32[i * 3 + 1] = facetNormals[i][1];
        data.normalsF32[i * 3 + 2] = facetNormals[i][2];
    }
}

function processData(vPolysNum, uPolysNum, triangles, originalVertices, renderVertices, facetNormals) {
    calculateAverageFacetNormal(originalVertices);

    for (let lineIndex = 1; lineIndex < vPolysNum; lineIndex++) {
        let currentLineOffset = lineIndex * uPolysNum;
        let previousLineOffset = (lineIndex - 1) * uPolysNum;

        for (let i = 0; i < uPolysNum; i++) {
            let v0ind = currentLineOffset + i;
            let v3ind = previousLineOffset + i;
            let v1ind = previousLineOffset + ((i + 1) % uPolysNum);
            let v2ind = currentLineOffset + ((i + 1) % uPolysNum);

            // The first triangle
            createTriangle(v0ind, v1ind, v3ind, originalVertices, renderVertices, triangles, facetNormals);

            // The second triangle
            createTriangle(v2ind, v1ind, v0ind, originalVertices, renderVertices, triangles, facetNormals);
        }
    }
    
}

function createTriangle(v0ind, v1ind, v2ind, originalVertices, renderVertices, triangles, facetNormals){
    let v0 = originalVertices[v0ind];
    let v1 = originalVertices[v1ind];
    let v2 = originalVertices[v2ind];

    // Adding a normal.
    let normal = v1.normal[0];
    facetNormals.push(normal, normal, normal);

    // Adding a triangle
    let trIndex0 = addTriangleVertex(v0, normal, renderVertices);
    let trIndex1 = addTriangleVertex(v1, normal, renderVertices);
    let trIndex2 = addTriangleVertex(v2, normal, renderVertices);

    let triangle = new Triangle(trIndex0, trIndex1, trIndex2);
    triangles.push(triangle);
    triangle.normal.push(normal);
    
    // Adding a triangle and a normal to the vertices
    addTriangleToVertices(triangle, normal, [v0, v1, v2]);
}

function addTriangleToVertices(triangle, normal, vertices) {
    vertices.forEach(vertex => vertex.triangles.push(triangle));
    vertices.forEach(vertex => vertex.normal.push(normal));
}

function addTriangleVertex(vertex, normal, renderVertices) {
    let newVertex = new Vertex([...vertex.p], [...vertex.t]);
    newVertex.normal = normal;
    renderVertices.push(newVertex);
    return renderVertices.length - 1;
}

function calculateNormal(v0, v1, v2) {
    const edge1 = m4.subtractVectors(v1.p, v0.p);
    const edge2 = m4.subtractVectors(v2.p, v0.p);
    let normal = m4.cross(edge1, edge2);
    return m4.normalize(normal);
}


function CreateVertexData(uPolysNum, vPolysNum) {
    let allPolylines = []; 
    let stepU = 2 * Math.PI / uPolysNum;
    let stepV = b / vPolysNum;
    for (let i=0; i<vPolysNum; i++) {
        let v = i * stepV;  // Поточне значення v
        for (let j = 0; j < uPolysNum; j++) {
            let u = j * stepU;  // Поточне значення u
            let vertex = surfaceEquation(u,v);
            allPolylines.push(vertex);
        }
    }

    return allPolylines;
}

function surfaceEquation(u, v){
    let uNorm = u / (2 * Math.PI);
    let vNorm = v / b;

    let x = v * Math.cos(u);
    let y = v * Math.sin(u);
    let z = a * Math.exp(-n * v) * Math.sin(w * v + q);
    return new Vertex([x, y, z], [uNorm, vNorm]);
}

function calculateAverageFacetNormal(originalVertices){
    let stepU = 2 * Math.PI / uPolysNum;
    let stepV = b / vPolysNum;
    let count = 0;
    for (let i=0; i<vPolysNum; i++) {
        for (let j = 0; j < uPolysNum; j++) {
            let normals = []
            let currV = surfaceEquation(j * stepU, i * stepV);
            let v1 = surfaceEquation((j+1) * stepU, i * stepV);
            let v2 = surfaceEquation(j * stepU, (i+1) * stepV);
            let v3 = surfaceEquation((j-1) * stepU, (i-1) * stepV);
            let v4 = surfaceEquation((j-1) * stepU, i * stepV);
            let v5 = surfaceEquation(j * stepU, (i-1) * stepV);
            let v6 = surfaceEquation((j+1) * stepU, (i-1) * stepV);

            normals.push(calculateNormal(v2, v1, currV));
            normals.push(calculateNormal(v2, currV, v3));
            normals.push(calculateNormal(v3, currV, v4));
            normals.push(calculateNormal(currV, v5, v4));
            normals.push(calculateNormal(currV, v6, v5));
            normals.push(calculateNormal(v1, v6, currV));

            let average = [0, 0, 0];
            for (let normal of normals) {
                average[0] += normal[0];
                average[1] += normal[1];
                average[2] += normal[2];
            }

            average[0] /= normals.length;
            average[1] /= normals.length;
            average[2] /= normals.length;
            average = m4.normalize(average);

            originalVertices[count].normal.push(average);
            count++;
        }
    }
}