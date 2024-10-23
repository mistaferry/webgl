function deg2rad(angle) {
    return angle * Math.PI / 180;
}


// Constructor
function Model(name) {
    this.name = name;
    this.vertexBuffers = []; // Array to hold multiple vertex buffers
    this.counts = []; // Array to hold counts for multiple polylines

    this.BufferData = function(vertices) {
        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);

        this.vertexBuffers.push(vertexBuffer)
        // Count of vertices for this buffer
        this.counts.push(vertices.length / 3);
    }

    this.Draw = function() {
        for (let i = 0; i < this.vertexBuffers.length; i++) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffers[i]);
            gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(shProgram.iAttribVertex);
            gl.drawArrays(gl.LINE_STRIP, 0, this.counts[i]);
        }
    }
}


function CreateSurfaceData(uPolysNum, vPolysNum, m, b, n, q, a) {
    let allPolylines = []; // Array to hold all polylines
    // a number of integral half-waves, placed at the straight line segment with the b length
    let w = (m * Math.PI) / b;

    getUPolylines(uPolysNum, vPolysNum, a, n, w, q, b, allPolylines);
    getVPolylines(uPolysNum, vPolysNum, a, n, w, q, b, allPolylines);
    
    return allPolylines; // Return all polylines
}

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


