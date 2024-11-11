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
    this.count = 0;

    this.BufferData = function(vertices, indices) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STREAM_DRAW);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STREAM_DRAW);

        this.count = indices.length;
    }

    this.Draw = function() {

        //gl.drawArrays(gl.LINE_STRIP, 0, this.count);
        gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
    }
}

function CreateData(uPolysNum, vPolysNum, m, b, n, q, a) {
    let allPolylines = []; // Array to hold all polylines

    let w = (m * Math.PI) / b;

    getVPolylines(uPolysNum, vPolysNum, a, n, w, q, b, allPolylines);

    return allPolylines;
}

function getVPolylines(uPolysNum, vPolysNum, a, n, w, q, b, allPolylines) {
    for (let i=0, ang = 0; i<vPolysNum; i++, ang+=5) {
        let v = (i * b) / vPolysNum; // Adjust v
        for (let j=0, ang = 0; j<uPolysNum; j++, ang+=5) {
            let u = (j * 2 * Math.PI) / uPolysNum; // Adjust u
            let x = v * Math.cos(u);
            let y = v * Math.sin(u);
            let z = a * Math.exp(-n * v) * Math.sin(w * v + q);
            allPolylines.push(new Vertex([x, y, z]));
        }
    }
}

function CreateSurfaceData(data) {
    let vertices = [];
    let triangles = [];

    // Prepare surface data
    let uPolysNum = 5;
    let vPolysNum = 5; 
    let a = 1, n = 1, m = 1, b = 1, q = 0;

    // Generate surface data
    vertices = CreateData(uPolysNum, vPolysNum, m, b, n, q, a);
    
    for (let lineIndex = 1; lineIndex < vPolysNum; lineIndex++) {
        let currentLineOffset = lineIndex * vPolysNum;
        let previousLineOffset = (lineIndex - 1) * vPolysNum;
    
        for (let i = 0; i < uPolysNum; i++) {
            let v0ind = currentLineOffset + i;
            let v3ind = previousLineOffset + i;
            let v1ind = previousLineOffset + ((i + 1) % uPolysNum);
            let v2ind = currentLineOffset + ((i + 1) % uPolysNum);

            // Create the first triangle
            createTriangle(v0ind, v1ind, v2ind, triangles, vertices);
    
            // Create the second triangle
            createTriangle(v0ind, v1ind, v3ind, triangles, vertices);
        }
    }

    data.verticesF32 = new Float32Array(vertices.length*3);
    for (let i=0, len=vertices.length; i<len; i++)
    {
        data.verticesF32[i*3 + 0] = vertices[i].p[0];
        data.verticesF32[i*3 + 1] = vertices[i].p[1];
        data.verticesF32[i*3 + 2] = vertices[i].p[2];
    }

    data.indicesU16 = new Uint16Array(triangles.length*3);
    for (let i=0, len=triangles.length; i<len; i++)
    {
        data.indicesU16[i*3 + 0] = triangles[i].v0;
        data.indicesU16[i*3 + 1] = triangles[i].v1;
        data.indicesU16[i*3 + 2] = triangles[i].v2;
    }
}
function createTriangle(vertex1, vertex2, vertex3, triangles, vertices) {
    let trian2 = new Triangle(vertex1, vertex2, vertex3);
    let trianInd2 = triangles.length;
    triangles.push(trian2);
    vertices[vertex1].triangles.push(trianInd2);
    vertices[vertex2].triangles.push(trianInd2);
    vertices[vertex3].triangles.push(trianInd2);
}

