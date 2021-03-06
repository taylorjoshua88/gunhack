/*
 * Gunhack
 * A procedurally generated FPS using raycasting
 *
 * entrypoint.js
 *
 * This is the entry point code that actually runs the game.
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

var game = new gh.Game(document.getElementById("gunhackCanvas"));

//TEMP: Just seeing if drawing works. This stuff should be initialized properly
//game.renderer.SetCamera(512, 512, 0.25, Math.PI / 3);

//TODO: DEFINITELY CHANGE THIS
/*
while (game.map.texturemap.ready == false)
    console.log("Waiting for assets to load...");
*/
//game.renderer.RenderMap(game.map);

requestAnimationFrame(game.GameLoop.bind(game));
