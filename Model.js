function deg2rad(angle) {
    return angle * Math.PI / 180;
}

// Vertex class to represent each vertex with a position, normal, and triangles it belongs to
function Vertex(position) {
    this.position = position;
    this.normal = [];
    this.triangles = [];
}

// Triangle class to represent each triangle with vertices, normal, and tangent
function Triangle(v0, v1, v2) {
    this.v0 = v0;
    this.v1 = v1;
    this.v2 = v2;
    this.normal = [];
    this.tangent = [];
}

// Updated Model class to hold multiple vertex buffers for polylines and render each
// Model class to manage vertex buffers and rendering
function Model(name) {
    this.name = name;
    this.vertexBuffers = []; // Array for multiple vertex buffers
    this.counts = [];        // Array for counts in each buffer
    this.iVertexBuffer = gl.createBuffer();
    this.iIndexBuffer = gl.createBuffer();
    this.count = 0;

    // Buffers data for line strips (polylines)
    this.BufferPolylineData = function(vertices) {
        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);

        this.vertexBuffers.push(vertexBuffer);
        this.counts.push(vertices.length / 3); // Store vertex count
    };

    // Buffers data for triangles
    this.BufferTriangleData = function(vertices, indices) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STREAM_DRAW);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STREAM_DRAW);

        this.count = indices.length;
    };

    // Draws polylines
    this.DrawPolyline = function() {
        for (let i = 0; i < this.vertexBuffers.length; i++) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffers[i]);
            gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(shProgram.iAttribVertex);
            gl.drawArrays(gl.LINE_STRIP, 0, this.counts[i]);
        }
    };

    // Draws triangles
    this.DrawTriangles = function() {
        gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
    };
}


// Generates the surface data for U and V polylines with specific parameters
function CreateSurfaceData(uPolysNum, vPolysNum, m, b, n, q, a) {
    let allPolylines = []; // Array to hold all polylines

    // Calculates w based on number of half-waves and line segment length
    let w = (m * Math.PI) / b;

    // Generate U and V polylines
    getUPolylines(uPolysNum, vPolysNum, a, n, w, q, b, allPolylines);
    getVPolylines(uPolysNum, vPolysNum, a, n, w, q, b, allPolylines);

    return allPolylines; // Returns all generated polylines
}

// Creates U-direction polylines and adds them to allPolylines array
function getUPolylines(uPolysNum, vPolysNum, a, n, w, q, b, allPolylines) {
    for (let i = 0; i <= uPolysNum; i++) {
        let u = (i * 2 * Math.PI) / uPolysNum; // Adjust u
        let uPolyline = [];
        for (let j = 0; j <= vPolysNum; j++) {
            let v = (j * b) / vPolysNum; // Adjust v
            let x = v * Math.cos(u);
            let y = v * Math.sin(u);
            let z = a * Math.exp(-n * v) * Math.sin(w * v + q);
            uPolyline.push(x, y, z);
        }
        allPolylines.push(uPolyline);
    }
}

// Creates V-direction polylines and adds them to allPolylines array
function getVPolylines(uPolysNum, vPolysNum, a, n, w, q, b, allPolylines) {
    for (let i = 0; i <= vPolysNum; i++) {
        let v = (i * b) / vPolysNum; // Adjust v
        let vPolyline = [];
        for (let j = 0; j <= uPolysNum; j++) {
            let u = (j * 2 * Math.PI) / uPolysNum; // Adjust u
            let x = v * Math.cos(u);
            let y = v * Math.sin(u);
            let z = a * Math.exp(-n * v) * Math.sin(w * v + q);
            vPolyline.push(x, y, z);
        }
        allPolylines.push(vPolyline);
    }
}

// Constructor
function CreateComplexSurface(data) {
    let vertices = [];
    let triangles = [];

    for (let i = 0, ang = 0; i < 72; i++, ang += 5) {
        vertices.push(new Vertex([Math.sin(deg2rad(ang)), 0, Math.cos(deg2rad(ang))]));
    }

    for (let i = 0, ang = 0; i < 72; i++, ang += 5) {
        let v0ind = vertices.length;
        vertices.push(new Vertex([Math.sin(deg2rad(ang)), 1, Math.cos(deg2rad(ang))]));

        if (i > 0) {
            let v1ind = v0ind - 73;
            let v2ind = v0ind - 1;
            let v3ind = v0ind - 72;

            triangles.push(new Triangle(v0ind, v1ind, v2ind));
            triangles.push(new Triangle(v0ind, v3ind, v1ind));
        }
    }

    data.verticesF32 = new Float32Array(vertices.flatMap(v => v.position));
    data.indicesU16 = new Uint16Array(triangles.flatMap(t => [t.v0, t.v1, t.v2]));
}
