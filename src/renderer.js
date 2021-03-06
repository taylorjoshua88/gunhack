/*
 * Gunhack
 * A procedurally generated FPS using raycasting
 *
 * renderer.js
 *
 * Defines the constructor and prototype for Renderer.
 * Renderer is in charge of rendering the game.
 *
 * Copyright (c) 2016 Joshua W Taylor
 * This code is licensed under The MIT License.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
*/

gh.Renderer = function(canvas, fov, drawDistance, fogDistance)
{
    //TODO: Add check for valid canvas
    this.screenCanvas = canvas;
    if (this.screenCanvas.getContext)
        this.screenCtx = this.screenCanvas.getContext('2d');
    else
        throw "Cannot get a 2D canvas context.";
    this.canvas = document.createElement("canvas");
    this.canvas.width  = this.screenCanvas.width;
    this.canvas.height = this.screenCanvas.height;
    if (this.canvas.getContext)
        this.ctx = this.canvas.getContext('2d');
    else
        throw "Cannot get a 2D canvas context.";
    this.filterCanvas = document.createElement("canvas");
    this.filterCanvas.width  = this.screenCanvas.width;
    this.filterCanvas.height = 1;
    if (this.filterCanvas.getContext)
        this.filterCtx = this.filterCanvas.getContext('2d');
    else
        throw "Cannot get a 2D canvas context.";

    this.filterData = this.filterCtx.createImageData(this.filterCanvas.width,1);
    this.fov = (fov === undefined ? 60 : fov);
    this.drawDistance = (drawDistance !== undefined ? drawDistance : 3200);
    this.fogDistance = (fogDistance !== undefined ? fogDistance : 2400);
    this.x = 0;
    this.y = 0;
    this.angle = 0;
    this.depthBuffer = [];
    // Used for returning from fullscreen
    this.oldWidth  = this.screenCanvas.width;
    this.oldHeight = this.screenCanvas.height;
    document.addEventListener("webkitfullscreenchange",
        this.ToggleFullscreen.bind(this), false);
    document.addEventListener("mozfullscreenchange",
        this.ToggleFullscreen.bind(this), false);
    document.addEventListener("MSFullscreenChange",
        this.ToggleFullscreen.bind(this), false);
    document.addEventListener("fullscreenchange",
        this.ToggleFullscreen.bind(this), false);
    this.fullscreen = false;
};

gh.Renderer.prototype.ToggleFullscreen = function()
{
    if (document.webkitIsFullScreen || document.mozFullScreen ||
        document.msFullscreenElement !== null)
    {
        if (!this.fullscreen)
        {
            this.screenCanvas.width  = this.canvas.width = screen.width;
            this.screenCanvas.height = this.canvas.height = screen.height;
            this.filterCanvas.width  = this.canvas.width;
            this.fullscreen = true;
        }
        else
        {
            this.screenCanvas.width  = this.canvas.width  = this.oldWidth;
            this.screenCanvas.height = this.canvas.height = this.oldHeight;
            this.filterCanvas.width  = this.canvas.width;
            this.fullscreen = false;
        }
    }
};

gh.Renderer.prototype.SetCamera = function(x, y, angle, fov)
{
    if (x !== undefined) this.x = x;
    if (y !== undefined) this.y = y;
    if (angle !== undefined) this.angle = angle;
    if (fov !== undefined) this.fov = fov;
};

gh.Renderer.prototype.RenderMinimap = function(map, x, y, width, height)
{
    var minimapCanvas = map.GetMinimapCanvas();
    var aspectRatio = minimapCanvas.width / minimapCanvas.height;
    var oldCompositeOp = this.ctx.globalCompositeOperation;
    var minimapPlayerX, minimapPlayerY;

    if (x === undefined || y === undefined ||
        width === undefined || height === undefined)
        throw "Tried to render minimap without dimensions";

    if (aspectRatio < 1)
    {
        width *= aspectRatio;
    }
    if (aspectRatio > 1)
    {
        height /= aspectRatio;
    }

    this.ctx.globalCompositeOperation = "source-over";
    this.ctx.drawImage(minimapCanvas, x, y, width, height);

    // Draw player on minimap
    minimapPlayerX = this.x / map.worldWidth  * width;
    minimapPlayerY = this.y / map.worldHeight * height;

    this.ctx.strokeStyle = "rgba(0,255,0,0.365)";
    this.ctx.beginPath();
    this.ctx.moveTo(minimapPlayerX, minimapPlayerY);
    this.ctx.arc(minimapPlayerX, minimapPlayerY, 10,
        -this.angle + this.fov / 2,
        -this.angle - this.fov / 2, true);
    this.ctx.lineTo(minimapPlayerX, minimapPlayerY);
    this.ctx.stroke();

    this.ctx.globalCompositeOperation = oldCompositeOp;
};

gh.Renderer.prototype.RenderMap = function(map)
{
    // Clean up variable locations and initialization
    var startAngle, dAngle, renderHeight, halfRenderHeight, curRay;
    var halfCanvasHeight = this.canvas.height / 2;

    if (!(map instanceof gh.Map))
        throw "RenderMap() passed parameter not derived from gh.Map!";

    startAngle = this.angle + this.fov / 2;
    dAngle = this.fov / this.canvas.width;

    // Texture errors result in pink columns
    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = "#FF00FF";
    this.ctx.beginPath();

    for (var column = 0; column < this.canvas.width; column++)
    {
        var rayAngle = startAngle - dAngle * column;
        var sampleX;

        curRay = map.CastRay(this.x, this.y, rayAngle);
        if (curRay === null)
            continue;

        this.depthBuffer[column] =
            curRay.distToOrigin * Math.cos(this.angle - rayAngle);
        renderHeight = this.canvas.height * map.tilesize /
            this.depthBuffer[column];
        halfRenderHeight = renderHeight / 2;
        sampleX = map.texturemap.SampleColumn(curRay.sample,curRay.wallType-1);

        // Draw a plain line if an error arises in sampling the texture
        if (sampleX === null)
        {
            this.ctx.moveTo(column + 0.5, 0.5 +
                halfCanvasHeight - halfRenderHeight);
            this.ctx.lineTo(column + 0.5, 0.5 +
                halfCanvasHeight + halfRenderHeight);
        }
        else
        {
            this.ctx.drawImage(map.texturemap.atlas, 0.5 + sampleX, 0, 1,
                map.texturemap.atlas.height, column + 0.5, halfCanvasHeight -
                halfRenderHeight, 1, renderHeight);
        }

        // Shading
        this.ctx.fillStyle = "#000000";
        // Wall orientation
        if (curRay.orientation === 0 || curRay.orientation == 2)
        {
            this.ctx.globalAlpha = 0.25;
            this.ctx.fillRect(column + 0.5, 0.5 + halfCanvasHeight -
                halfRenderHeight, 1, renderHeight);
        }
        // Distance shading
        if (this.depthBuffer[column] > this.fogDistance)
        {
            this.ctx.globalAlpha = gh.ClampValue(
                (this.depthBuffer[column] - this.fogDistance) /
                (this.drawDistance - this.fogDistance));
            this.ctx.fillRect(column + 0.5, 0.5 + halfCanvasHeight -
                halfRenderHeight, 1, renderHeight);
        }
        this.ctx.globalAlpha = 1.0;
    }
    this.ctx.stroke();
};

// Renders floor and ceiling to the screen canvas
gh.Renderer.prototype.RenderBackground = function(ceiling, floor)
{
    var ceilGrad, floorGrad;
    var halfCanvasHeight = this.screenCanvas.height / 2;
    //TODO: Pre-calculate half canvas height and width
    ceilGrad = this.screenCtx.createLinearGradient(0,0,0,halfCanvasHeight);
    ceilGrad.addColorStop(0, ceiling);
    ceilGrad.addColorStop(1, "black");
    this.screenCtx.fillStyle = ceilGrad;
    this.screenCtx.fillRect(0, 0, this.screenCanvas.width,
        this.screenCanvas.height / 2);

    floorGrad = this.screenCtx.createLinearGradient(0,halfCanvasHeight,0,
        this.screenCanvas.height);
    floorGrad.addColorStop(0, "black");
    floorGrad.addColorStop(1, floor);
    this.screenCtx.fillStyle = floorGrad;
    this.screenCtx.fillRect(0, this.screenCanvas.height / 2,
        this.screenCanvas.width, this.screenCanvas.height);
};

gh.Renderer.prototype.RenderFrame = function(game)
{
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.filterData = this.filterCtx.createImageData(this.filterCanvas.width,1);

    this.RenderBackground(game.map.ceiling, game.map.floor);

    this.SetCamera(game.player.x, game.player.y, game.player.angle);

    this.RenderMap(game.map);
    this.RenderMinimap(game.map, 0, 0, 250, 250);

    this.screenCtx.drawImage(this.canvas, 0, 0);
};
