window.AudioContext = window.AudioContext || window.webkitAudioContext;
class renderWave {
    constructor(message) {
        this._samples = 10000;
        this._strokeStyle = "#3098ff";
        this.audioContext = new AudioContext();
        this.canvas = document.querySelector("canvas");
        this.ctx = this.canvas.getContext("2d");
        this.data = [];
        message
            .then(arrayBuffer => {
            return this.audioContext.decodeAudioData(arrayBuffer);
        })
            .then(audioBuffer => {
            this.draw(this.normalizedData(audioBuffer));
            this.drawData(this.data);
        });
    }
    normalizedData(audioBuffer) {
        const rawData = audioBuffer.getChannelData(0); // We only need to work with one channel of data
        const samples = this._samples; // Number of samples we want to have in our final data set
        const blockSize = Math.floor(rawData.length / samples); // Number of samples in each subdivision
        const filteredData = [];
        for (let i = 0; i < samples; i++) {
            filteredData.push(rawData[i * blockSize]);
        }
        return filteredData;
    }
    draw(normalizedData) {
        // set up the canvas
        const canvas = this.canvas;
        const dpr = window.devicePixelRatio || 1;
        const padding = 10;
        canvas.width = canvas.offsetWidth * dpr;
        canvas.height = (canvas.offsetHeight + padding * 2) * dpr;
        this.ctx.scale(dpr, dpr);
        this.ctx.translate(0, canvas.offsetHeight / 2 + padding); // set Y = 0 to be in the middle of the canvas
        // draw the line segments
        const width = canvas.offsetWidth / normalizedData.length;
        for (let i = 0; i < normalizedData.length; i++) {
            const x = width * i;
            let height = normalizedData[i] * canvas.offsetHeight - padding;
            if (height < 0) {
                height = 0;
            }
            else if (height > canvas.offsetHeight / 2) {
                height = height > canvas.offsetHeight / 2;
            }
            // this.drawLineSegment(this.ctx, x, height, width, (i + 1) % 2);
            this.data.push({
                x: x,
                h: height,
                w: width,
                isEven: (i + 1) % 2
            });
        }
        return this.data;
    }
    drawLineSegment(ctx, x, height, width, isEven, colors = this._strokeStyle) {
        ctx.lineWidth = 1; // how thick the line is
        ctx.strokeStyle = colors; // what color our line is
        ctx.beginPath();
        height = isEven ? height : -height;
        ctx.moveTo(x, 0);
        ctx.lineTo(x + width, height);
        ctx.stroke();
    }
    drawData(data, colors = this._strokeStyle) {
        data.map(item => {
            this.drawLineSegment(this.ctx, item.x, item.h, item.w, item.isEven, colors);
        });
    }
    drawTimeline(percent) {
        let end = Math.ceil(this._samples * percent);
        let start = end - 5 || 0;
        let t = this.data.slice(0, end);
        this.drawData(t, "#1d1e22");
    }
}
document.getElementById("fileinput").addEventListener("change", function () {
    var wave = new renderWave(this.files[0].arrayBuffer());
    var audioPlayer = document.getElementById("audio");
    audioPlayer.src = URL.createObjectURL(this.files[0]);
    // audioPlayer.play();
    audioPlayer.ontimeupdate = function () {
        let percent = this.currentTime / this.duration;
        wave.drawTimeline(percent);
    };
});