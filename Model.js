

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
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STREAM_DRAW);
        // gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        // gl.enableVertexAttribArray(shProgram.iAttribVertex);
    
        // Normal buffer (if using)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
        // gl.vertexAttribPointer(shProgram.iAttribNormal, 3, gl.FLOAT, false, 0, 0);
        // gl.enableVertexAttribArray(shProgram.iAttribNormal);

            
        // Index buffer
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STREAM_DRAW);
    
        this.count = indices.length;
    }
    

    this.Draw = function() {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.vertexAttribPointer(shProgram.iAttribNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribNormal);

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
    for (let i=0; i<vPolysNum; i++) {
        let v = (i * b) / vPolysNum; // Adjust v
        for (let j=0; j<uPolysNum; j++) {
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
    let normals = [];

    // Prepare surface data
    let uPolysNum = 5;
    let vPolysNum = 5; 
    let a = 1, n = 1, m = 1, b = 1, q = 0;

    // Generate surface data
    vertices = CreateData(uPolysNum, vPolysNum, m, b, n, q, a);
    
    calculateTriangles(vPolysNum, uPolysNum, triangles, vertices);

    calculateFacetNormal(uPolysNum, vPolysNum, vertices, triangles, normals);
    // calculateFacetNormal(vertices, triangles);


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

    data.normalsF32 = new Float32Array(normals.length);
    for (let i=0, len=normals.length; i<len; i++)
    {
        data.normalsF32[i*3 + 0] = (normals[i])[0];
        data.normalsF32[i*3 + 1] = (normals[i])[1];
        data.normalsF32[i*3 + 2] = (normals[i])[2];
    }
}

function calculateTriangles(vPolysNum, uPolysNum, triangles, vertices) {
    for (let lineIndex = 1; lineIndex < vPolysNum; lineIndex++) {
        let currentLineOffset = lineIndex * uPolysNum;
        let previousLineOffset = (lineIndex - 1) * uPolysNum;

        for (let i = 0; i < uPolysNum; i++) {
            let v0ind = currentLineOffset + i;
            let v3ind = previousLineOffset + i;
            let v1ind = previousLineOffset + ((i + 1) % uPolysNum);
            let v2ind = currentLineOffset + ((i + 1) % uPolysNum);

            // Set the first triangle
            setTriangleVertexes(v0ind, v1ind, v2ind, triangles, vertices);

            // Set the second triangle
            setTriangleVertexes(v0ind, v1ind, v3ind, triangles, vertices);
        }
    }
}

function setTriangleVertexes(vertex1, vertex2, vertex3, triangles, vertices) {
    let trian2 = new Triangle(vertex1, vertex2, vertex3);
    let trianInd2 = triangles.length;
    triangles.push(trian2);
    vertices[vertex1].triangles.push(trianInd2);
    vertices[vertex2].triangles.push(trianInd2);
    vertices[vertex3].triangles.push(trianInd2);
}



function calculateFacetNormal(uPolysNum, vPolysNum, vertices, triangles, normals) {
    // Для кожного вертекса обчислюємо нормаль
    for (let index = 0; index < vertices.length; index++) {
        let vertex = vertices[index];
        let normal = [0, 0, 0];

        // Проходимо через всі трикутники, що містять цей вертекс
        for (let triangleIndex of vertex.triangles) {
            let triangle = triangles[triangleIndex];

            // Обчислюємо нормаль цього трикутника
            let triNormal = computeNormalForTriangle(triangle.v0, triangle.v1, triangle.v2, vertices);

            // Додаємо нормаль трикутника до нормалі вертекса
            normal[0] += triNormal[0];
            normal[1] += triNormal[1];
            normal[2] += triNormal[2];
        }

        // Нормалізуємо суму нормалей
        let normalizedNormal = m4.normalize(normal);

        // Додаємо нормаль до масиву нормалей
        normals.push(normalizedNormal);

        // Присвоюємо індекс нормалі вертексу
        vertex.normal.push(normals.length - 1);
    }
}


function computeNormalForTriangle(v0, v1, v2, vertices) {
    v0 = vertices[v0];
    v1 = vertices[v1];
    v2 = vertices[v2];

    let v1v0 = [v1.p[0] - v0.p[0], v1.p[1] - v0.p[1], v1.p[2] - v0.p[2]];
    let v2v0 = [v2.p[0] - v0.p[0], v2.p[1] - v0.p[1], v2.p[2] - v0.p[2]];

    // Перехресний добуток для отримання нормалі
    let normal = m4.cross(v1v0, v2v0);

    // Нормалізація нормалі
    let normalizedNormal = m4.normalize(normal);
    return normalizedNormal;
}




