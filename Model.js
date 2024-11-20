function deg2rad(angle) {
    return angle * Math.PI / 180;
}


function Vertex(p)
{
    this.p = p;
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
    this.count = 0;

    this.BufferData = function(vertices, indices, normals) {
        // Vertex buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    
        // Normal buffer (if using)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW); 
    
        // Index buffer
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    
        this.count = indices.length;
    }
    
    this.Draw = function() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);
    
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.vertexAttribPointer(shProgram.iAttribNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribNormal);
    
        gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
    }
}

function CreateSurfaceData(data) {
    let verticesForTriangles = [];
    let allTriangles = [];
    let allNormals = [];

    let uPolysNum = document.getElementById("u").value;
    let vPolysNum = document.getElementById("v").value;
    let a = 1, n = 1, m = 2, b = 1, q = 0;

    // Surface vertex data generation
    let originalVertices = CreateVertexData(uPolysNum, vPolysNum, m, b, n, q, a);
    
    processData(vPolysNum, uPolysNum, allTriangles, originalVertices, verticesForTriangles, allNormals);

    prepareRenderData(data, verticesForTriangles, allTriangles, allNormals);
}

function prepareRenderData(data, verticesForTriangles, allTriangles, allNormals){
    // Populate vertex buffer
    data.verticesF32 = new Float32Array(verticesForTriangles.length * 3);
    for (let i = 0, len = verticesForTriangles.length; i < len; i++) {
        data.verticesF32[i * 3 + 0] = verticesForTriangles[i].p[0];
        data.verticesF32[i * 3 + 1] = verticesForTriangles[i].p[1];
        data.verticesF32[i * 3 + 2] = verticesForTriangles[i].p[2];
    }

    //Populate index buffer
    data.indicesU16 = new Uint16Array(allTriangles.length * 3);
    for (let i = 0, len = allTriangles.length; i < len; i++) {
        data.indicesU16[i * 3 + 0] = allTriangles[i].v0;
        data.indicesU16[i * 3 + 1] = allTriangles[i].v1;
        data.indicesU16[i * 3 + 2] = allTriangles[i].v2;
    }

    // Populate normal buffer
    data.normalsF32 = new Float32Array(allNormals.length * 3);
    for (let i = 0, len = allNormals.length; i < len; i++) {
        data.normalsF32[i * 3 + 0] = allNormals[i][0];
        data.normalsF32[i * 3 + 1] = allNormals[i][1];
        data.normalsF32[i * 3 + 2] = allNormals[i][2];
    }
}

function processData(vPolysNum, uPolysNum, triangles, originalVertices, verticesForTriangles, allNormals) {
    for (let lineIndex = 1; lineIndex < vPolysNum; lineIndex++) {
        let currentLineOffset = lineIndex * uPolysNum;
        let previousLineOffset = (lineIndex - 1) * uPolysNum;

        for (let i = 0; i < uPolysNum; i++) {
            let v0ind = currentLineOffset + i;
            let v3ind = previousLineOffset + i;
            let v1ind = previousLineOffset + ((i + 1) % uPolysNum);
            let v2ind = currentLineOffset + ((i + 1) % uPolysNum);

            // The first triangle
            createTriangle(v0ind, v1ind, v3ind, originalVertices, verticesForTriangles, triangles, allNormals);

            // The second triangle
            createTriangle(v2ind, v1ind, v0ind, originalVertices, verticesForTriangles, triangles, allNormals);
        }
    }
}

function createTriangle(v0ind, v1ind, v2ind, originalVertices, verticesForTriangles, triangles, allNormals){
    let v0 = originalVertices[v0ind];
    let v1 = originalVertices[v1ind];
    let v2 = originalVertices[v2ind];

    // Adding a normal
    let normal = calculateNormal(v0, v1, v2);
    allNormals.push(normal, normal, normal);

    // Adding a triangle
    let trIndex0 = addTriangleVertex(v0, normal, verticesForTriangles);
    let trIndex1 = addTriangleVertex(v1, normal, verticesForTriangles);
    let trIndex2 = addTriangleVertex(v2, normal, verticesForTriangles);

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

function addTriangleVertex(vertex, normal, verticesForTriangles) {
    let newVertex = new Vertex([...vertex.p]);
    newVertex.normal = normal;
    verticesForTriangles.push(newVertex);
    return verticesForTriangles.length - 1;
}

function calculateNormal(v0, v1, v2) {
    const edge1 = m4.subtractVectors(v1.p, v0.p);
    const edge2 = m4.subtractVectors(v2.p, v0.p);
    let normal = m4.cross(edge1, edge2);
    return m4.normalize(normal);
}


function CreateVertexData(uPolysNum, vPolysNum, m, b, n, q, a) {
    let allPolylines = []; 

    let w = (m * Math.PI) / b;
    for (let i=0; i<vPolysNum; i++) {
        let v = (i * b) / vPolysNum;
        for (let j=0; j<uPolysNum; j++) {
            let u = (j * 2 * Math.PI) / uPolysNum;
            let x = v * Math.cos(u);
            let y = v * Math.sin(u);
            let z = a * Math.exp(-n * v) * Math.sin(w * v + q);
            allPolylines.push(new Vertex([x, y, z]));
        }
    }

    return allPolylines;
}
