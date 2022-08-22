/*! Made with ct.js http://ctjs.rocks/ */

if (location.protocol === 'file:') {
    // eslint-disable-next-line no-alert
    alert('Your game won\'t work like this because\nWeb 👏 builds 👏 require 👏 a web 👏 server!\n\nConsider using a desktop build, or upload your web build to itch.io, GameJolt or your own website.\n\nIf you haven\'t created this game, please contact the developer about this issue.\n\n Also note that ct.js games do not work inside the itch app; you will need to open the game with your browser of choice.');
}

const deadPool = []; // a pool of `kill`-ed copies for delaying frequent garbage collection
const copyTypeSymbol = Symbol('I am a ct.js copy');
setInterval(function cleanDeadPool() {
    deadPool.length = 0;
}, 1000 * 60);

/**
 * The ct.js library
 * @namespace
 */
const ct = {
    /**
     * A target number of frames per second. It can be interpreted as a second in timers.
     * @type {number}
     */
    speed: [60][0] || 60,
    templates: {},
    snd: {},
    stack: [],
    fps: [60][0] || 60,
    /**
     * A measure of how long a frame took time to draw, usually equal to 1 and larger on lags.
     * For example, if it is equal to 2, it means that the previous frame took twice as much time
     * compared to expected FPS rate.
     *
     * Use ct.delta to balance your movement and other calculations on different framerates by
     * multiplying it with your reference value.
     *
     * Note that `this.move()` already uses it, so there is no need to premultiply
     * `this.speed` with it.
     *
     * **A minimal example:**
     * ```js
     * this.x += this.windSpeed * ct.delta;
     * ```
     *
     * @template {number}
     */
    delta: 1,
    /**
     * A measure of how long a frame took time to draw, usually equal to 1 and larger on lags.
     * For example, if it is equal to 2, it means that the previous frame took twice as much time
     * compared to expected FPS rate.
     *
     * This is a version for UI elements, as it is not affected by time scaling, and thus works well
     * both with slow-mo effects and game pause.
     *
     * @template {number}
     */
    deltaUi: 1,
    /**
     * The camera that outputs its view to the renderer.
     * @template {Camera}
     */
    camera: null,
    /**
     * ct.js version in form of a string `X.X.X`.
     * @template {string}
     */
    version: '2.0.2',
    meta: [{"name":"SpaceRanger","author":"Vlodkow","site":"","version":"0.0.1"}][0],
    get width() {
        return ct.pixiApp.renderer.view.width;
    },
    /**
     * Resizes the drawing canvas and viewport to the given value in pixels.
     * When used with ct.fittoscreen, can be used to enlarge/shrink the viewport.
     * @param {number} value New width in pixels
     * @template {number}
     */
    set width(value) {
        ct.camera.width = ct.roomWidth = value;
        if (!ct.fittoscreen || ct.fittoscreen.mode === 'fastScale') {
            ct.pixiApp.renderer.resize(value, ct.height);
        }
        if (ct.fittoscreen) {
            ct.fittoscreen();
        }
        return value;
    },
    get height() {
        return ct.pixiApp.renderer.view.height;
    },
    /**
     * Resizes the drawing canvas and viewport to the given value in pixels.
     * When used with ct.fittoscreen, can be used to enlarge/shrink the viewport.
     * @param {number} value New height in pixels
     * @template {number}
     */
    set height(value) {
        ct.camera.height = ct.roomHeight = value;
        if (!ct.fittoscreen || ct.fittoscreen.mode === 'fastScale') {
            ct.pixiApp.renderer.resize(ct.width, value);
        }
        if (ct.fittoscreen) {
            ct.fittoscreen();
        }
        return value;
    }
};

// eslint-disable-next-line no-console
console.log(
    `%c 😺 %c ct.js game editor %c v${ct.version} %c https://ctjs.rocks/ `,
    'background: #446adb; color: #fff; padding: 0.5em 0;',
    'background: #5144db; color: #fff; padding: 0.5em 0;',
    'background: #446adb; color: #fff; padding: 0.5em 0;',
    'background: #5144db; color: #fff; padding: 0.5em 0;'
);

ct.highDensity = [true][0];
const pixiAppSettings = {
    width: [1366][0],
    height: [768][0],
    antialias: ![false][0],
    powerPreference: 'high-performance',
    sharedTicker: false,
    sharedLoader: true
};
try {
    /**
     * The PIXI.Application that runs ct.js game
     * @template {PIXI.Application}
     */
    ct.pixiApp = new PIXI.Application(pixiAppSettings);
} catch (e) {
    console.error(e);
    // eslint-disable-next-line no-console
    console.warn('[ct.js] Something bad has just happened. This is usually due to hardware problems. I\'ll try to fix them now, but if the game still doesn\'t run, try including a legacy renderer in the project\'s settings.');
    PIXI.settings.SPRITE_MAX_TEXTURES = Math.min(PIXI.settings.SPRITE_MAX_TEXTURES, 16);
    ct.pixiApp = new PIXI.Application(pixiAppSettings);
}

PIXI.settings.ROUND_PIXELS = [false][0];
ct.pixiApp.ticker.maxFPS = [60][0] || 0;
if (!ct.pixiApp.renderer.options.antialias) {
    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
}
/**
 * @template PIXI.Container
 */
ct.stage = ct.pixiApp.stage;
ct.pixiApp.renderer.autoDensity = ct.highDensity;
document.getElementById('ct').appendChild(ct.pixiApp.view);

/**
 * A library of different utility functions, mainly Math-related, but not limited to them.
 * @namespace
 */
ct.u = {
    /**
     * Get the environment the game runs on.
     * @returns {string} Either 'ct.ide', or 'nw', or 'electron', or 'browser'.
     */
    getEnvironment() {
        if (window.name === 'ct.js debugger') {
            return 'ct.ide';
        }
        try {
            if (nw.require) {
                return 'nw';
            }
        } catch (oO) {
            void 0;
        }
        try {
            require('electron');
            return 'electron';
        } catch (Oo) {
            void 0;
        }
        return 'browser';
    },
    /**
     * Get the current operating system the game runs on.
     * @returns {string} One of 'windows', 'darwin' (which is MacOS), 'linux', or 'unknown'.
     */
    getOS() {
        const ua = window.navigator.userAgent;
        if (ua.indexOf('Windows') !== -1) {
            return 'windows';
        }
        if (ua.indexOf('Linux') !== -1) {
            return 'linux';
        }
        if (ua.indexOf('Mac') !== -1) {
            return 'darwin';
        }
        return 'unknown';
    },
    /**
     * Returns the length of a vector projection onto an X axis.
     * @param {number} l The length of the vector
     * @param {number} d The direction of the vector
     * @returns {number} The length of the projection
     */
    ldx(l, d) {
        return l * Math.cos(d * Math.PI / 180);
    },
    /**
     * Returns the length of a vector projection onto an Y axis.
     * @param {number} l The length of the vector
     * @param {number} d The direction of the vector
     * @returns {number} The length of the projection
     */
    ldy(l, d) {
        return l * Math.sin(d * Math.PI / 180);
    },
    /**
     * Returns the direction of a vector that points from the first point to the second one.
     * @param {number} x1 The x location of the first point
     * @param {number} y1 The y location of the first point
     * @param {number} x2 The x location of the second point
     * @param {number} y2 The y location of the second point
     * @returns {number} The angle of the resulting vector, in degrees
     */
    pdn(x1, y1, x2, y2) {
        return (Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI + 360) % 360;
    },
    // Point-point DistanCe
    /**
     * Returns the distance between two points
     * @param {number} x1 The x location of the first point
     * @param {number} y1 The y location of the first point
     * @param {number} x2 The x location of the second point
     * @param {number} y2 The y location of the second point
     * @returns {number} The distance between the two points
     */
    pdc(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
    },
    /**
     * Convers degrees to radians
     * @param {number} deg The degrees to convert
     * @returns {number} The resulting radian value
     */
    degToRad(deg) {
        return deg * Math.PI / 180;
    },
    /**
     * Convers radians to degrees
     * @param {number} rad The radian value to convert
     * @returns {number} The resulting degree
     */
    radToDeg(rad) {
        return rad / Math.PI * 180;
    },
    /**
     * Rotates a vector (x; y) by `deg` around (0; 0)
     * @param {number} x The x component
     * @param {number} y The y component
     * @param {number} deg The degree to rotate by
     * @returns {PIXI.Point} A pair of new `x` and `y` parameters.
     */
    rotate(x, y, deg) {
        return ct.u.rotateRad(x, y, ct.u.degToRad(deg));
    },
    /**
     * Rotates a vector (x; y) by `rad` around (0; 0)
     * @param {number} x The x component
     * @param {number} y The y component
     * @param {number} rad The radian value to rotate around
     * @returns {PIXI.Point} A pair of new `x` and `y` parameters.
     */
    rotateRad(x, y, rad) {
        const sin = Math.sin(rad),
              cos = Math.cos(rad);
        return new PIXI.Point(
            cos * x - sin * y,
            cos * y + sin * x
        );
    },
    /**
     * Gets the most narrow angle between two vectors of given directions
     * @param {number} dir1 The direction of the first vector
     * @param {number} dir2 The direction of the second vector
     * @returns {number} The resulting angle
     */
    deltaDir(dir1, dir2) {
        dir1 = ((dir1 % 360) + 360) % 360;
        dir2 = ((dir2 % 360) + 360) % 360;
        var t = dir1,
            h = dir2,
            ta = h - t;
        if (ta > 180) {
            ta -= 360;
        }
        if (ta < -180) {
            ta += 360;
        }
        return ta;
    },
    /**
     * Returns a number in between the given range (clamps it).
     * @param {number} min The minimum value of the given number
     * @param {number} val The value to fit in the range
     * @param {number} max The maximum value of the given number
     * @returns {number} The clamped value
     */
    clamp(min, val, max) {
        return Math.max(min, Math.min(max, val));
    },
    /**
     * Linearly interpolates between two values by the apha value.
     * Can also be describing as mixing between two values with a given proportion `alpha`.
     * @param {number} a The first value to interpolate from
     * @param {number} b The second value to interpolate to
     * @param {number} alpha The mixing value
     * @returns {number} The result of the interpolation
     */
    lerp(a, b, alpha) {
        return a + (b - a) * alpha;
    },
    /**
     * Returns the position of a given value in a given range. Opposite to linear interpolation.
     * @param  {number} a The first value to interpolate from
     * @param  {number} b The second value to interpolate top
     * @param  {number} val The interpolated values
     * @return {number} The position of the value in the specified range.
     * When a <= val <= b, the result will be inside the [0;1] range.
     */
    unlerp(a, b, val) {
        return (val - a) / (b - a);
    },
    /**
     * Re-maps the given value from one number range to another.
     * @param  {number} val The value to be mapped
     * @param  {number} inMin Lower bound of the value's current range
     * @param  {number} inMax Upper bound of the value's current range
     * @param  {number} outMin Lower bound of the value's target range
     * @param  {number} outMax Upper bound of the value's target range
     * @returns {number} The mapped value.
     */
    map(val, inMin, inMax, outMin, outMax) {
        return (val - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    },
    /**
     * Translates a point from UI space to game space.
     * @param {number} x The x coordinate in UI space.
     * @param {number} y The y coordinate in UI space.
     * @returns {PIXI.Point} A pair of new `x` and `y` coordinates.
     */
    uiToGameCoord(x, y) {
        return ct.camera.uiToGameCoord(x, y);
    },
    /**
     * Translates a point from fame space to UI space.
     * @param {number} x The x coordinate in game space.
     * @param {number} y The y coordinate in game space.
     * @returns {PIXI.Point} A pair of new `x` and `y` coordinates.
     */
    gameToUiCoord(x, y) {
        return ct.camera.gameToUiCoord(x, y);
    },
    hexToPixi(hex) {
        return Number('0x' + hex.slice(1));
    },
    pixiToHex(pixi) {
        return '#' + (pixi).toString(16).padStart(6, 0);
    },
    /**
     * Tests whether a given point is inside the given rectangle
     * (it can be either a copy or an array).
     * @param {number} x The x coordinate of the point.
     * @param {number} y The y coordinate of the point.
     * @param {(Copy|Array<Number>)} arg Either a copy (it must have a rectangular shape)
     * or an array in a form of [x1, y1, x2, y2], where (x1;y1) and (x2;y2) specify
     * the two opposite corners of the rectangle.
     * @returns {boolean} `true` if the point is inside the rectangle, `false` otherwise.
     */
    prect(x, y, arg) {
        var xmin, xmax, ymin, ymax;
        if (arg.splice) {
            xmin = Math.min(arg[0], arg[2]);
            xmax = Math.max(arg[0], arg[2]);
            ymin = Math.min(arg[1], arg[3]);
            ymax = Math.max(arg[1], arg[3]);
        } else {
            xmin = arg.x - arg.shape.left * arg.scale.x;
            xmax = arg.x + arg.shape.right * arg.scale.x;
            ymin = arg.y - arg.shape.top * arg.scale.y;
            ymax = arg.y + arg.shape.bottom * arg.scale.y;
        }
        return x >= xmin && y >= ymin && x <= xmax && y <= ymax;
    },
    /**
     * Tests whether a given point is inside the given circle (it can be either a copy or an array)
     * @param {number} x The x coordinate of the point
     * @param {number} y The y coordinate of the point
     * @param {(Copy|Array<Number>)} arg Either a copy (it must have a circular shape)
     * or an array in a form of [x1, y1, r], where (x1;y1) define the center of the circle
     * and `r` defines the radius of it.
     * @returns {boolean} `true` if the point is inside the circle, `false` otherwise
     */
    pcircle(x, y, arg) {
        if (arg.splice) {
            return ct.u.pdc(x, y, arg[0], arg[1]) < arg[2];
        }
        return ct.u.pdc(0, 0, (arg.x - x) / arg.scale.x, (arg.y - y) / arg.scale.y) < arg.shape.r;
    },
    /**
     * Copies all the properties of the source object to the destination object.
     * This is **not** a deep copy. Useful for extending some settings with default values,
     * or for combining data.
     * @param {object} o1 The destination object
     * @param {object} o2 The source object
     * @param {any} [arr] An optional array of properties to copy. If not specified,
     * all the properties will be copied.
     * @returns {object} The modified destination object
     */
    ext(o1, o2, arr) {
        if (arr) {
            for (const i in arr) {
                if (o2[arr[i]]) {
                    o1[arr[i]] = o2[arr[i]];
                }
            }
        } else {
            for (const i in o2) {
                o1[i] = o2[i];
            }
        }
        return o1;
    },
    /**
     * Returns a Promise that resolves after the given time.
     * This timer is run in gameplay time scale, meaning that it is affected by time stretching.
     * @param {number} time Time to wait, in milliseconds
     * @returns {CtTimer} The timer, which you can call `.then()` to
     */
    wait(time) {
        return ct.timer.add(time);
    },
    /**
     * Returns a Promise that resolves after the given time.
     * This timer runs in UI time scale and is not sensitive to time stretching.
     * @param {number} time Time to wait, in milliseconds
     * @returns {CtTimer} The timer, which you can call `.then()` to
     */
    waitUi(time) {
        return ct.timer.addUi(time);
    },
    /**
     * Creates a new function that returns a promise, based
     * on a function with a regular (err, result) => {...} callback.
     * @param {Function} f The function that needs to be promisified
     * @see https://javascript.info/promisify
     */
    promisify(f) {
        // eslint-disable-next-line func-names
        return function (...args) {
            return new Promise((resolve, reject) => {
                const callback = function callback(err, result) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                };
                args.push(callback);
                f.call(this, ...args);
            });
        };
    },
    required(paramName, method) {
        let str = 'The parameter ';
        if (paramName) {
            str += `${paramName} `;
        }
        if (method) {
            str += `of ${method} `;
        }
        str += 'is required.';
        throw new Error(str);
    },
    numberedString(prefix, input) {
        return prefix + '_' + input.toString().padStart(2, '0');
    },
    getStringNumber(str) {
        return Number(str.split('_').pop());
    }
};
ct.u.ext(ct.u, {// make aliases
    getOs: ct.u.getOS,
    lengthDirX: ct.u.ldx,
    lengthDirY: ct.u.ldy,
    pointDirection: ct.u.pdn,
    pointDistance: ct.u.pdc,
    pointRectangle: ct.u.prect,
    pointCircle: ct.u.pcircle,
    extend: ct.u.ext
});

// eslint-disable-next-line max-lines-per-function
(() => {
    const killRecursive = copy => {
        copy.kill = true;
        if (copy.onDestroy) {
            ct.templates.onDestroy.apply(copy);
            copy.onDestroy.apply(copy);
        }
        for (const child of copy.children) {
            if (child[copyTypeSymbol]) {
                killRecursive(child);
            }
        }
        const stackIndex = ct.stack.indexOf(copy);
        if (stackIndex !== -1) {
            ct.stack.splice(stackIndex, 1);
        }
        if (copy.template) {
            const templatelistIndex = ct.templates.list[copy.template].indexOf(copy);
            if (templatelistIndex !== -1) {
                ct.templates.list[copy.template].splice(templatelistIndex, 1);
            }
        }
        deadPool.push(copy);
    };
    const manageCamera = () => {
        if (ct.camera) {
            ct.camera.update(ct.delta);
            ct.camera.manageStage();
        }
    };

    ct.loop = function loop(delta) {
        ct.delta = delta;
        ct.deltaUi = ct.pixiApp.ticker.elapsedMS / (1000 / (ct.pixiApp.ticker.maxFPS || 60));
        ct.inputs.updateActions();
        ct.timer.updateTimers();
        ct.place.debugTraceGraphics.clear();

        for (let i = 0, li = ct.stack.length; i < li; i++) {
            ct.templates.beforeStep.apply(ct.stack[i]);
            ct.stack[i].onStep.apply(ct.stack[i]);
            ct.templates.afterStep.apply(ct.stack[i]);
        }
        // There may be a number of rooms stacked on top of each other.
        // Loop through them and filter out everything that is not a room.
        for (const item of ct.stage.children) {
            if (!(item instanceof Room)) {
                continue;
            }
            ct.rooms.beforeStep.apply(item);
            item.onStep.apply(item);
            ct.rooms.afterStep.apply(item);
        }
        // copies
        for (const copy of ct.stack) {
            // eslint-disable-next-line no-underscore-dangle
            if (copy.kill && !copy._destroyed) {
                killRecursive(copy); // This will also allow a parent to eject children
                                     // to a new container before they are destroyed as well
                copy.destroy({
                    children: true
                });
            }
        }

        for (const cont of ct.stage.children) {
            cont.children.sort((a, b) =>
                ((a.depth || 0) - (b.depth || 0)) || ((a.uid || 0) - (b.uid || 0)) || 0);
        }

        manageCamera();

        for (let i = 0, li = ct.stack.length; i < li; i++) {
            ct.templates.beforeDraw.apply(ct.stack[i]);
            ct.stack[i].onDraw.apply(ct.stack[i]);
            ct.templates.afterDraw.apply(ct.stack[i]);
            ct.stack[i].xprev = ct.stack[i].x;
            ct.stack[i].yprev = ct.stack[i].y;
        }

        for (const item of ct.stage.children) {
            if (!(item instanceof Room)) {
                continue;
            }
            ct.rooms.beforeDraw.apply(item);
            item.onDraw.apply(item);
            ct.rooms.afterDraw.apply(item);
        }
        /*%afterframe%*/
        if (ct.rooms.switching) {
            ct.rooms.forceSwitch();
        }
    };
})();




/**
 * @property {number} value The current value of an action. It is always in the range from -1 to 1.
 * @property {string} name The name of the action.
 */
class CtAction {
    /**
     * This is a custom action defined in the Settings tab → Edit actions section.
     * Actions are used to abstract different input methods into one gameplay-related interface:
     * for example, joystick movement, WASD keys and arrows can be turned into two actions:
     * `MoveHorizontally` and `MoveVertically`.
     * @param {string} name The name of the new action.
     */
    constructor(name) {
        this.name = name;
        this.methodCodes = [];
        this.methodMultipliers = [];
        this.prevValue = 0;
        this.value = 0;
        return this;
    }
    /**
     * Checks whether the current action listens to a given input method.
     * This *does not* check whether this input method is supported by ct.
     *
     * @param {string} code The code to look up.
     * @returns {boolean} `true` if it exists, `false` otherwise.
     */
    methodExists(code) {
        return this.methodCodes.indexOf(code) !== -1;
    }
    /**
     * Adds a new input method to listen.
     *
     * @param {string} code The input method's code to listen to. Must be unique per action.
     * @param {number} [multiplier] An optional multiplier, e.g. to flip its value.
     * Often used with two buttons to combine them into a scalar input identical to joysticks.
     * @returns {void}
     */
    addMethod(code, multiplier) {
        if (this.methodCodes.indexOf(code) === -1) {
            this.methodCodes.push(code);
            this.methodMultipliers.push(multiplier !== void 0 ? multiplier : 1);
        } else {
            throw new Error(`[ct.inputs] An attempt to add an already added input "${code}" to an action "${name}".`);
        }
    }
    /**
     * Removes the provided input method for an action.
     *
     * @param {string} code The input method to remove.
     * @returns {void}
     */
    removeMethod(code) {
        const ind = this.methodCodes.indexOf(code);
        if (ind !== -1) {
            this.methodCodes.splice(ind, 1);
            this.methodMultipliers.splice(ind, 1);
        }
    }
    /**
     * Changes the multiplier for an input method with the provided code.
     * This method will produce a warning if one is trying to change an input method
     * that is not listened by this action.
     *
     * @param {string} code The input method's code to change
     * @param {number} multiplier The new value
     * @returns {void}
     */
    setMultiplier(code, multiplier) {
        const ind = this.methodCodes.indexOf(code);
        if (ind !== -1) {
            this.methodMultipliers[ind] = multiplier;
        } else {
            // eslint-disable-next-line no-console
            console.warning(`[ct.inputs] An attempt to change multiplier of a non-existent method "${code}" at event ${this.name}`);
            // eslint-disable-next-line no-console
            console.trace();
        }
    }
    /**
     * Recalculates the digital value of an action.
     *
     * @returns {number} A scalar value between -1 and 1.
     */
    update() {
        this.prevValue = this.value;
        this.value = 0;
        for (let i = 0, l = this.methodCodes.length; i < l; i++) {
            const rawValue = ct.inputs.registry[this.methodCodes[i]] || 0;
            this.value += rawValue * this.methodMultipliers[i];
        }
        this.value = Math.max(-1, Math.min(this.value, 1));
    }
    /**
     * Resets the state of this action, setting its value to `0`
     * and its pressed, down, released states to `false`.
     *
     * @returns {void}
     */
    reset() {
        this.prevValue = this.value = 0;
    }
    /**
     * Returns whether the action became active in the current frame,
     * either by a button just pressed or by using a scalar input.
     *
     * `true` for being pressed and `false` otherwise
     * @type {boolean}
     */
    get pressed() {
        return this.prevValue === 0 && this.value !== 0;
    }
    /**
     * Returns whether the action became inactive in the current frame,
     * either by releasing all buttons or by resting all scalar inputs.
     *
     * `true` for being released and `false` otherwise
     * @type {boolean}
     */
    get released() {
        return this.prevValue !== 0 && this.value === 0;
    }
    /**
     * Returns whether the action is active, e.g. by a pressed button
     * or a currently used scalar input.
     *
     * `true` for being active and `false` otherwise
     * @type {boolean}
     */
    get down() {
        return this.value !== 0;
    }
    /* In case you need to be hated for the rest of your life, uncomment this */
    /*
    valueOf() {
        return this.value;
    }
    */
}

/**
 * A list of custom Actions. They are defined in the Settings tab → Edit actions section.
 * @type {Object.<string,CtAction>}
 */
ct.actions = {};
/**
 * @namespace
 */
ct.inputs = {
    registry: {},
    /**
     * Adds a new action and puts it into `ct.actions`.
     *
     * @param {string} name The name of an action, as it will be used in `ct.actions`.
     * @param {Array<Object>} methods A list of input methods. This list can be changed later.
     * @returns {CtAction} The created action
     */
    addAction(name, methods) {
        if (name in ct.actions) {
            throw new Error(`[ct.inputs] An action "${name}" already exists, can't add a new one with the same name.`);
        }
        const action = new CtAction(name);
        for (const method of methods) {
            action.addMethod(method.code, method.multiplier);
        }
        ct.actions[name] = action;
        return action;
    },
    /**
     * Removes an action with a given name.
     * @param {string} name The name of an action
     * @returns {void}
     */
    removeAction(name) {
        delete ct.actions[name];
    },
    /**
     * Recalculates values for every action in a game.
     * @returns {void}
     */
    updateActions() {
        for (const i in ct.actions) {
            ct.actions[i].update();
        }
    }
};

ct.inputs.addAction('Shoot', [{"code":"keyboard.Space"},{"code":"vkeys.Vk1"},{"code":"mouse.Left"}]);
ct.inputs.addAction('MoveX', [{"code":"keyboard.KeyD"},{"code":"keyboard.KeyA","multiplier":-1},{"code":"keyboard.ArrowLeft","multiplier":-1},{"code":"keyboard.ArrowRight"},{"code":"vkeys.Vjoy1X","multiplier":1}]);
ct.inputs.addAction('MoveY', [{"code":"keyboard.KeyW","multiplier":-1},{"code":"keyboard.KeyS"},{"code":"keyboard.ArrowDown"},{"code":"keyboard.ArrowUp","multiplier":-1},{"code":"vkeys.Vjoy1Y","multiplier":1}]);
ct.inputs.addAction('Touch', [{"code":"touch.Any"},{"code":"mouse.Left"}]);


/**
 * @typedef IRoomMergeResult
 *
 * @property {Array<Copy>} copies
 * @property {Array<Tilemap>} tileLayers
 * @property {Array<Background>} backgrounds
 */

class Room extends PIXI.Container {
    static getNewId() {
        this.roomId++;
        return this.roomId;
    }

    constructor(template) {
        super();
        this.x = this.y = 0;
        this.uid = Room.getNewId();
        this.tileLayers = [];
        this.backgrounds = [];
        if (!ct.room) {
            ct.room = ct.rooms.current = this;
        }
        if (template) {
            if (template.extends) {
                ct.u.ext(this, template.extends);
            }
            this.onCreate = template.onCreate;
            this.onStep = template.onStep;
            this.onDraw = template.onDraw;
            this.onLeave = template.onLeave;
            this.template = template;
            this.name = template.name;
            if (this === ct.room) {
                ct.pixiApp.renderer.backgroundColor = ct.u.hexToPixi(this.template.backgroundColor);
            }
            if (this === ct.room) {
    ct.place.tileGrid = {};
}
ct.fittoscreen();

            for (let i = 0, li = template.bgs.length; i < li; i++) {
                // Need to put extensions here, so we don't use ct.backgrounds.add
                const bg = new ct.templates.Background(
                    template.bgs[i].texture,
                    null,
                    template.bgs[i].depth,
                    template.bgs[i].extends
                );
                this.addChild(bg);
            }
            for (let i = 0, li = template.tiles.length; i < li; i++) {
                const tl = new Tilemap(template.tiles[i]);
                tl.cache();
                this.tileLayers.push(tl);
                this.addChild(tl);
            }
            for (let i = 0, li = template.objects.length; i < li; i++) {
                const exts = template.objects[i].exts || {};
                ct.templates.copyIntoRoom(
                    template.objects[i].template,
                    template.objects[i].x,
                    template.objects[i].y,
                    this,
                    {
                        tx: template.objects[i].tx,
                        ty: template.objects[i].ty,
                        tr: template.objects[i].tr,
                        ...exts
                    }
                );
            }
        }
        return this;
    }
    get x() {
        return -this.position.x;
    }
    set x(value) {
        this.position.x = -value;
        return value;
    }
    get y() {
        return -this.position.y;
    }
    set y(value) {
        this.position.y = -value;
        return value;
    }
}
Room.roomId = 0;

(function roomsAddon() {
    /* global deadPool */
    var nextRoom;
    /**
     * @namespace
     */
    ct.rooms = {
        templates: {},
        /**
         * An object that contains arrays of currently present rooms.
         * These include the current room (`ct.room`), as well as any rooms
         * appended or prepended through `ct.rooms.append` and `ct.rooms.prepend`.
         * @type {Object.<string,Array<Room>>}
         */
        list: {},
        /**
         * Creates and adds a background to the current room, at the given depth.
         * @param {string} texture The name of the texture to use
         * @param {number} depth The depth of the new background
         * @returns {Background} The created background
         */
        addBg(texture, depth) {
            const bg = new ct.templates.Background(texture, null, depth);
            ct.room.addChild(bg);
            return bg;
        },
        /**
         * Adds a new empty tile layer to the room, at the given depth
         * @param {number} layer The depth of the layer
         * @returns {Tileset} The created tile layer
         * @deprecated Use ct.tilemaps.create instead.
         */
        addTileLayer(layer) {
            return ct.tilemaps.create(layer);
        },
        /**
         * Clears the current stage, removing all rooms with copies, tile layers, backgrounds,
         * and other potential entities.
         * @returns {void}
         */
        clear() {
            ct.stage.children = [];
            ct.stack = [];
            for (const i in ct.templates.list) {
                ct.templates.list[i] = [];
            }
            for (const i in ct.backgrounds.list) {
                ct.backgrounds.list[i] = [];
            }
            ct.rooms.list = {};
            for (const name in ct.rooms.templates) {
                ct.rooms.list[name] = [];
            }
        },
        /**
         * This method safely removes a previously appended/prepended room from the stage.
         * It will trigger "On Leave" for a room and "On Destroy" event
         * for all the copies of the removed room.
         * The room will also have `this.kill` set to `true` in its event, if it comes in handy.
         * This method cannot remove `ct.room`, the main room.
         * @param {Room} room The `room` argument must be a reference
         * to the previously created room.
         * @returns {void}
         */
        remove(room) {
            if (!(room instanceof Room)) {
                if (typeof room === 'string') {
                    throw new Error('[ct.rooms] To remove a room, you should provide a reference to it (to an object), not its name. Provided value:', room);
                }
                throw new Error('[ct.rooms] An attempt to remove a room that is not actually a room! Provided value:', room);
            }
            const ind = ct.rooms.list[room.name];
            if (ind !== -1) {
                ct.rooms.list[room.name].splice(ind, 1);
            } else {
                // eslint-disable-next-line no-console
                console.warn('[ct.rooms] Removing a room that was not found in ct.rooms.list. This is strange…');
            }
            room.kill = true;
            ct.stage.removeChild(room);
            for (const copy of room.children) {
                copy.kill = true;
            }
            room.onLeave();
            ct.rooms.onLeave.apply(room);
        },
        /*
         * Switches to the given room. Note that this transition happens at the end
         * of the frame, so the name of a new room may be overridden.
         */
        'switch'(roomName) {
            if (ct.rooms.templates[roomName]) {
                nextRoom = roomName;
                ct.rooms.switching = true;
            } else {
                console.error('[ct.rooms] The room "' + roomName + '" does not exist!');
            }
        },
        switching: false,
        /**
         * Creates a new room and adds it to the stage, separating its draw stack
         * from existing ones.
         * This room is added to `ct.stage` after all the other rooms.
         * @param {string} roomName The name of the room to be appended
         * @param {object} [exts] Any additional parameters applied to the new room.
         * Useful for passing settings and data to new widgets and prefabs.
         * @returns {Room} A newly created room
         */
        append(roomName, exts) {
            if (!(roomName in ct.rooms.templates)) {
                console.error(`[ct.rooms] append failed: the room ${roomName} does not exist!`);
                return false;
            }
            const room = new Room(ct.rooms.templates[roomName]);
            if (exts) {
                ct.u.ext(room, exts);
            }
            ct.stage.addChild(room);
            room.onCreate();
            ct.rooms.onCreate.apply(room);
            ct.rooms.list[roomName].push(room);
            return room;
        },
        /**
         * Creates a new room and adds it to the stage, separating its draw stack
         * from existing ones.
         * This room is added to `ct.stage` before all the other rooms.
         * @param {string} roomName The name of the room to be prepended
         * @param {object} [exts] Any additional parameters applied to the new room.
         * Useful for passing settings and data to new widgets and prefabs.
         * @returns {Room} A newly created room
         */
        prepend(roomName, exts) {
            if (!(roomName in ct.rooms.templates)) {
                console.error(`[ct.rooms] prepend failed: the room ${roomName} does not exist!`);
                return false;
            }
            const room = new Room(ct.rooms.templates[roomName]);
            if (exts) {
                ct.u.ext(room, exts);
            }
            ct.stage.addChildAt(room, 0);
            room.onCreate();
            ct.rooms.onCreate.apply(room);
            ct.rooms.list[roomName].push(room);
            return room;
        },
        /**
         * Merges a given room into the current one. Skips room's OnCreate event.
         *
         * @param {string} roomName The name of the room that needs to be merged
         * @returns {IRoomMergeResult} Arrays of created copies, backgrounds, tile layers,
         * added to the current room (`ct.room`). Note: it does not get updated,
         * so beware of memory leaks if you keep a reference to this array for a long time!
         */
        merge(roomName) {
            if (!(roomName in ct.rooms.templates)) {
                console.error(`[ct.rooms] merge failed: the room ${roomName} does not exist!`);
                return false;
            }
            const generated = {
                copies: [],
                tileLayers: [],
                backgrounds: []
            };
            const template = ct.rooms.templates[roomName];
            const target = ct.room;
            for (const t of template.bgs) {
                const bg = new ct.templates.Background(t.texture, null, t.depth, t.extends);
                target.backgrounds.push(bg);
                target.addChild(bg);
                generated.backgrounds.push(bg);
            }
            for (const t of template.tiles) {
                const tl = new Tilemap(t);
                target.tileLayers.push(tl);
                target.addChild(tl);
                generated.tileLayers.push(tl);
                tl.cache();
            }
            for (const t of template.objects) {
                const c = ct.templates.copyIntoRoom(t.template, t.x, t.y, target, {
                    tx: t.tx || 1,
                    ty: t.ty || 1,
                    tr: t.tr || 0
                });
                generated.copies.push(c);
            }
            return generated;
        },
        forceSwitch(roomName) {
            if (nextRoom) {
                roomName = nextRoom;
            }
            if (ct.room) {
                ct.room.onLeave();
                ct.rooms.onLeave.apply(ct.room);
                ct.room = void 0;
            }
            ct.rooms.clear();
            deadPool.length = 0;
            var template = ct.rooms.templates[roomName];
            ct.roomWidth = template.width;
            ct.roomHeight = template.height;
            ct.camera = new Camera(
                ct.roomWidth / 2,
                ct.roomHeight / 2,
                ct.roomWidth,
                ct.roomHeight
            );
            if (template.cameraConstraints) {
                ct.camera.minX = template.cameraConstraints.x1;
                ct.camera.maxX = template.cameraConstraints.x2;
                ct.camera.minY = template.cameraConstraints.y1;
                ct.camera.maxY = template.cameraConstraints.y2;
            }
            ct.pixiApp.renderer.resize(template.width, template.height);
            ct.rooms.current = ct.room = new Room(template);
            ct.stage.addChild(ct.room);
            ct.room.onCreate();
            ct.rooms.onCreate.apply(ct.room);
            ct.rooms.list[roomName].push(ct.room);
            
            ct.camera.manageStage();
            ct.rooms.switching = false;
            nextRoom = void 0;
        },
        onCreate() {
            if (this === ct.room) {
    const debugTraceGraphics = new PIXI.Graphics();
    debugTraceGraphics.depth = 10000000; // Why not. Overlap everything.
    ct.room.addChild(debugTraceGraphics);
    ct.place.debugTraceGraphics = debugTraceGraphics;
}
for (const layer of this.tileLayers) {
    if (this.children.indexOf(layer) === -1) {
        continue;
    }
    ct.place.enableTilemapCollisions(layer);
}

        },
        onLeave() {
            if (this === ct.room) {
    ct.place.grid = {};
}
/* global ct */

if (!this.kill) {
    for (var tween of ct.tween.tweens) {
        tween.reject({
            info: 'Room switch',
            code: 1,
            from: 'ct.tween'
        });
    }
    ct.tween.tweens = [];
}

        },
        /**
         * The name of the starting room, as it was set in ct.IDE.
         * @type {string}
         */
        starting: 'ConnectMetamask'
    };
})();
/**
 * The current room
 * @type {Room}
 */
ct.room = null;

ct.rooms.beforeStep = function beforeStep() {
    ct.touch.updateGestures();
var i = 0;
while (i < ct.tween.tweens.length) {
    var tween = ct.tween.tweens[i];
    if (tween.obj.kill) {
        tween.reject({
            code: 2,
            info: 'Copy is killed'
        });
        ct.tween.tweens.splice(i, 1);
        continue;
    }
    var a = tween.timer.time / tween.duration;
    if (a > 1) {
        a = 1;
    }
    for (var field in tween.fields) {
        var s = tween.starting[field],
            d = tween.fields[field] - tween.starting[field];
        tween.obj[field] = tween.curve(s, d, a);
    }
    if (a === 1) {
        tween.resolve(tween.fields);
        ct.tween.tweens.splice(i, 1);
        continue;
    }
    i++;
}

};
ct.rooms.afterStep = function afterStep() {
    
};
ct.rooms.beforeDraw = function beforeDraw() {
    
};
ct.rooms.afterDraw = function afterDraw() {
    if (ct.sound.follow && !ct.sound.follow.kill) {
    ct.sound.howler.pos(
        ct.sound.follow.x,
        ct.sound.follow.y,
        ct.sound.useDepth ? ct.sound.follow.z : 0
    );
} else if (ct.sound.manageListenerPosition) {
    ct.sound.howler.pos(ct.camera.x, ct.camera.y, ct.camera.z || 0);
}
ct.keyboard.clear();
for (const touch of ct.touch.events) {
    touch.xprev = touch.x;
    touch.yprev = touch.y;
    touch.xuiprev = touch.x;
    touch.yuiprev = touch.y;
    ct.touch.clearReleased();
}
ct.mouse.xprev = ct.mouse.x;
ct.mouse.yprev = ct.mouse.y;
ct.mouse.xuiprev = ct.mouse.xui;
ct.mouse.yuiprev = ct.mouse.yui;
ct.mouse.pressed = ct.mouse.released = false;
ct.inputs.registry['mouse.Wheel'] = 0;

};


ct.rooms.templates['InGame'] = {
    name: 'InGame',
    width: 1366,
    height: 768,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":700,"y":650,"exts":{},"tx":0.5,"ty":0.5,"template":"Player_SpaceShip"}]'),
    bgs: JSON.parse('[{"depth":-10,"texture":"InGameBg","extends":{"movementY":0.2}},{"depth":-9,"texture":"Stars_Small","extends":{"movementY":0.5,"scaleX":1,"scaleY":1}}]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        this.asteroidTimer -= ct.delta;
if (this.asteroidTimer <= 0) {
    this.asteroidTimer = ct.random.range(ct.speed * 0.5, ct.speed * 3);
    ct.templates.copy('Asteroid', ct.random(ct.camera.width), -100);
}

if (this.bossEncountered) {
    // Stop spawning new entities if a boss has arrived
    return;
}
this.encounterTimer -= ct.delta;
if (this.encounterTimer <= 0) {
    this.encounterTimer = ct.random.range(ct.speed * 2, ct.speed * 7);
    ct.templates.copy('Enemy_Shooter', ct.random(ct.camera.width), -100);
}

this.waveTimer -= ct.delta;
if (this.waveTimer <= 0) {
    this.waveTimer = ct.random.range(ct.speed * 15, ct.speed * 20);
    const startingPhase = ct.random.dice(0, Math.PI / 2);
    // See it in the "Settings" tab > Scripts
    spawnWigglers(startingPhase);
}

this.bomberTimer -= ct.delta;
if (this.bomberTimer <= 0) {
    this.bomberTimer = ct.random.range(ct.speed * 30, ct.speed * 45);
    ct.templates.copy('Enemy_Bomber', ct.random(ct.camera.width), -100);
}

this.bossTimer -= ct.delta;
if (this.bossTimer <= 0) {
    this.bossEncountered = true;
    ct.templates.copy('DatBoss', ct.camera.width / 2, -300);
}
    },
    onDraw() {
        this.scoreLabel.text = 'Score: ' + this.score;
    },
    onLeave() {
        localStorage.score = this.score;
    },
    onCreate() {
        ct.sound.stop('Music_MainMenu');
ct.sound.spawn('Music_MainTheme', {
    loop: true,
    volume: 0.25
});


if (ct.touch.enabled) {
    ct.rooms.append('Controls_Layer', {isUi: true});
}
ct.rooms.append('UI_Layer', {isUi: true});

this.score = 0;

this.scoreLabel = new PIXI.Text('Score: ' + this.score, ct.styles.get('ScoreText'));
this.scoreLabel.x = 30;
this.scoreLabel.y = 20;
this.scoreLabel.depth = 100;
this.addChild(this.scoreLabel);

this.asteroidTimer = ct.speed * 3;
this.encounterTimer = ct.speed * 5;
this.waveTimer = ct.speed * 20;
this.bomberTimer = ct.speed * 60;
this.bossTimer = ct.speed * 60 * 1.7;

ct.transition.fadeIn();
    },
    extends: {}
}
ct.rooms.templates['ConnectMetamask'] = {
    name: 'ConnectMetamask',
    width: 1366,
    height: 768,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":704,"y":608,"exts":{},"tx":0.55,"ty":0.55,"template":"ConnectMetamask"},{"x":704,"y":400,"exts":{},"tx":0.5,"ty":0.5,"template":"GameInfo"},{"x":704,"y":152,"exts":{},"tx":0.5,"ty":0.5,"template":"LogoSpaceRanger"},{"x":1320,"y":720,"exts":{},"tx":0.5,"ty":0.5,"template":"FullScreen"}]'),
    bgs: JSON.parse('[{"depth":-10,"texture":"BgSpace","extends":{"repeat":"no-repeat","scaleX":0.74,"movementY":0,"movementX":0,"shiftX":-80,"scaleY":0.74}},{"depth":-8,"texture":"Stars_Big","extends":{"movementY":0,"movementX":-0.1,"scaleX":0.5,"scaleY":0.5}}]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        if(this.isLoading && ct.web3.isConnected) {
    this.isLoading = false;
    (async () => {
        const userShips = await ct.web3.contract.getUserShips(ct.web3.userAddress);
        if(!userShips.length) {
            ct.rooms.switch('MintShip');
        } else {
            // localStorage.userShip = JSON.stringify(userShips[0]);
            const ship = userShips[0];
            localStorage.userShip = JSON.stringify({
                id: parseInt(ship.id),
                shipType: ship.shipType,
                level: ship.level,
                attack: ship.attack,
                health: ship.health,
                speed: ship.health,
                weapons: ship.weapons,
                currentEnergy: ship.currentEnergy,
                maxEnergy: ship.maxEnergy,
                upgrades: ship.upgrades
            });
            
            console.log(localStorage.userShip)
            ct.rooms.switch('MainMenu');
        }
    })();
}

// Move Background
bgMoveOnStep(this, 0.04);

// Asteroids
this.asteroidTimer -= ct.delta;
if (this.asteroidTimer <= 0) {
    this.asteroidTimer = ct.random.range(60, 180);
    ct.templates.copy(ct.random.dice('AsteroidBig1', 'AsteroidBig2', 'AsteroidBig3'), ct.random(ct.camera.width), -100);
}

    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        this.isLoading = true;

ct.sound.spawn('Music_MainMenu', {
    loop: true,
    volume: 0.5
});

this.asteroidTimer = 20;
bgMoveInit(this);
    },
    extends: {}
}
ct.rooms.templates['RetryScreen'] = {
    name: 'RetryScreen',
    width: 1366,
    height: 768,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":680,"y":192,"exts":{},"tx":0.5,"ty":0.5,"template":"OhNo"},{"x":672,"y":608,"exts":{},"lastX":680,"lastY":608,"template":"ButtonMainMenu"},{"x":672,"y":536,"exts":{},"template":"ButtonClaimCoins"},{"x":1320,"y":720,"exts":{},"tx":0.5,"ty":0.5,"template":"FullScreen"}]'),
    bgs: JSON.parse('[{"depth":-10,"texture":"BgSpace","extends":{"scaleX":0.74,"scaleY":0.74,"shiftX":-80,"repeat":"no-repeat"}},{"depth":-9,"texture":"Stars_Small","extends":{"scaleX":0.5,"scaleY":0.5,"movementX":-0.1}}]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        ct.sound.spawn('Music_MainMenu', {
    loop: true,
    volume: 0.5
});
ct.sound.stop('Music_MainTheme');
ct.sound.stop('Music_BossTheme');

this.score = Number(localStorage.score);
this.highscore = Number(localStorage.highscore || 0);

localStorage.highscore = Math.max(this.highscore, this.score);

this.scoreText = new PIXI.Text('Score: '+ this.score, ct.styles.get('ScoreText'));
this.addChild(this.scoreText);
this.scoreText.x = ct.camera.width / 2;
this.scoreText.y = ct.camera.height / 2;
this.scoreText.anchor.x = 0.5;
this.scoreText.anchor.y = 0.5;

    },
    extends: {}
}
ct.rooms.templates['Controls_Layer'] = {
    name: 'Controls_Layer',
    width: 1366,
    height: 768,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":1226,"y":610,"exts":{},"tx":0.75,"ty":0.75,"template":"Button_Shoot"},{"x":178,"y":616,"exts":{},"tx":0.75,"ty":0.75,"template":"Joystick"}]'),
    bgs: JSON.parse('[]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        
    },
    extends: {}
}
ct.rooms.templates['BossTestingRoom'] = {
    name: 'BossTestingRoom',
    width: 1366,
    height: 768,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":950,"y":850,"exts":{},"template":"Player_SpaceShip"},{"x":950,"y":-300,"exts":{},"template":"DatBoss"},{"x":550,"y":400,"exts":{},"template":"AbstractBonus"},{"x":750,"y":400,"exts":{},"template":"AbstractBonus"},{"x":650,"y":550,"exts":{},"template":"AbstractBonus"},{"x":650,"y":250,"exts":{},"template":"AbstractBonus"},{"x":450,"y":250,"exts":{},"template":"AbstractBonus"},{"x":350,"y":400,"exts":{},"template":"AbstractBonus"},{"x":450,"y":550,"exts":{},"template":"AbstractBonus"}]'),
    bgs: JSON.parse('[{"depth":-19,"texture":"Stars_Small","extends":{"movementY":0.25}},{"depth":-18,"texture":"Stars_Big","extends":{"movementY":0.5}}]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        this.scoreLabel.text = 'Score: ' + this.score;

if (ct.templates.list.Player_Blue.length) {
    for (var i = 0; i < 3; i++) {
        this.shipIcons[i].visible = ct.templates.list.Player_Blue[0].lives > i;
    }
}
    },
    onLeave() {
        
    },
    onCreate() {
        if (ct.touch.enabled) {
    ct.rooms.append("Controls_Layer", {isUi: true});
}
ct.rooms.append('UI_Layer', {isUi: true});

this.score = 0;

this.scoreLabel = new PIXI.Text('Score: ' + this.score, ct.styles.get('ScoreText'));
this.scoreLabel.x = this.scoreLabel.y = 20;
this.scoreLabel.depth = 100;
this.addChild(this.scoreLabel);

this.shipIcons = [];
// Draw small ship icons in a top-right corner
for (var i = 0; i < 3; i++) {
    var icon = new PIXI.Sprite(ct.res.getTexture('PlayerShip_Blue', 0));
    icon.x = ct.width - 32 - i*48;
    icon.y = 32;
    icon.scale.x = icon.scale.y = 0.3;
    icon.depth = 100;
    this.addChild(icon);
    this.shipIcons.push(icon);
}


ct.transition.fadeIn();
    },
    extends: {}
}
ct.rooms.templates['UI_Layer'] = {
    name: 'UI_Layer',
    width: 1366,
    height: 768,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":680,"y":768,"exts":{},"tx":0.7,"ty":0.5,"template":"Healthbar_Base_Player"}]'),
    bgs: JSON.parse('[]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        
    },
    extends: {}
}
ct.rooms.templates['VictoryScreen'] = {
    name: 'VictoryScreen',
    width: 1366,
    height: 768,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":464,"y":192,"exts":{},"tx":0.6,"ty":0.6,"template":"Victory"},{"x":704,"y":600,"exts":{},"template":"ButtonMainMenu"},{"x":1320,"y":720,"exts":{},"tx":0.5,"ty":0.5,"template":"FullScreen"}]'),
    bgs: JSON.parse('[{"depth":-10,"texture":"BgSpace","extends":{"shiftX":-80,"scaleX":0.74,"scaleY":0.74,"repeat":"no-repeat"}},{"depth":-4,"texture":"Stars_Small","extends":{"movementY":0,"movementX":-0.1,"scaleX":0.5,"scaleY":0.5}}]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        ct.sound.spawn('Music_MainMenu', {
    loop: true,
    volume: 0.5
});
ct.sound.stop('Music_MainTheme');
ct.sound.stop('Music_BossTheme');

this.score = Number(localStorage.score);

this.scoreText = new PIXI.Text('Score: '+ this.score, ct.styles.get('ScoreText'));
this.addChild(this.scoreText);
this.scoreText.x = ct.camera.width / 2;
this.scoreText.y = ct.camera.height / 2;
this.scoreText.anchor.x = 0.5;
this.scoreText.anchor.y = 0.5;


    },
    extends: {}
}
ct.rooms.templates['MainMenu'] = {
    name: 'MainMenu',
    width: 1366,
    height: 768,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":180,"y":344,"exts":{},"template":"ButtonPlay"},{"x":1124,"y":496,"exts":{},"template":"EnemyPlanet"},{"x":180,"y":416,"exts":{},"template":"ButtonLeaderboard"},{"x":1160,"y":34,"exts":{},"template":"TopPanel"},{"x":115,"y":130,"exts":{},"template":"AccountId"},{"x":1080,"y":20,"exts":{},"template":"UserCoins"},{"x":64,"y":600,"exts":{},"template":"MainMenuText"},{"x":1220,"y":20,"exts":{},"template":"UserEnergy"},{"x":180,"y":272,"exts":{},"template":"ButtonMyShip"},{"x":1320,"y":720,"exts":{},"tx":0.5,"ty":0.5,"template":"FullScreen"}]'),
    bgs: JSON.parse('[{"depth":-10,"texture":"Levels","extends":{"repeat":"no-repeat"}},{"depth":-9,"texture":"Stars_Big","extends":{"movementY":0,"movementX":-0.1,"parallaxX":0,"parallaxY":0,"scaleX":0.5,"scaleY":0.5}}]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        ct.sound.spawn('Music_MainMenu', {
    loop: true,
    volume: 0.5
});
ct.sound.stop('Music_MainTheme');
ct.sound.stop('Music_BossTheme');

ct.web3.onAccountChange(()=> {
    ct.rooms.switch('ConnectMetamask');
});

    },
    extends: {}
}
ct.rooms.templates['MintShip'] = {
    name: 'MintShip',
    width: 1366,
    height: 768,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":312,"y":312,"exts":{},"tx":0.5,"ty":0.5,"template":"ShipCard1"},{"x":696,"y":312,"exts":{},"tx":0.5,"ty":0.5,"template":"ShipCard2"},{"x":504,"y":528,"exts":{},"tx":0.5,"ty":0.5,"template":"ShipCard5"},{"x":1120,"y":504,"exts":{},"template":"EnemyPlanet"},{"x":888,"y":528,"exts":{},"tx":0.5,"ty":0.5,"template":"ShipCard3"},{"x":1080,"y":312,"exts":{},"tx":0.5,"ty":0.5,"template":"ShipCard4"},{"x":1320,"y":720,"exts":{},"tx":0.5,"ty":0.5,"template":"FullScreen"}]'),
    bgs: JSON.parse('[{"depth":-10,"texture":"MintShip","extends":{"repeat":"no-repeat"}},{"depth":-8,"texture":"Stars_Big","extends":{"movementY":0,"movementX":-0.1,"scaleX":0.5,"scaleY":0.5}}]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        ct.sound.spawn('Music_MainMenu', {
    loop: true,
    volume: 0.5
});
// ct.sound.stop('Music_MainMenu');
// ct.sound.stop('Music_BossTheme');

this.authorsNotice = new PIXI.Text('Choose your NFT spaceship to start your first mission:', ct.styles.get('White_H3_Center'));
this.addChild(this.authorsNotice);
this.authorsNotice.x = ct.camera.width / 2;
this.authorsNotice.y = 125;
this.authorsNotice.anchor.x = 0.5;
this.authorsNotice.anchor.y = 0.5;

this.authorsNotice = new PIXI.Text('You will be able to modify this ship with the funds received from the destruction of aliens.', ct.styles.get('Gray_H3_Center'));
this.addChild(this.authorsNotice);
this.authorsNotice.x = ct.camera.width / 2;
this.authorsNotice.y = ct.camera.height - 50;
this.authorsNotice.anchor.x = 0.5;
this.authorsNotice.anchor.y = 0.5;

this.handleMint = async (shipType) => {
    console.log('handleMint');
    try {
        const tx = await ct.web3.contract.mint(shipType);
        ct.web3.showNewTransaction(tx);
        tx.wait().then(receipt => {
            if (receipt.status === 1) {
                ct.rooms.switch('MainMenu');
            }
        });
    } catch (e) {
        console.error("Error", e);
    };
}

ct.web3.onAccountChange(()=> {
    ct.rooms.switch('ConnectMetamask');
});
    },
    extends: {}
}
ct.rooms.templates['Leaderboard'] = {
    name: 'Leaderboard',
    width: 1366,
    height: 768,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":1124,"y":496,"exts":{},"template":"EnemyPlanet"},{"x":456,"y":192,"exts":{},"template":"LeaderboardTable"},{"x":40,"y":30,"exts":{},"template":"Back"},{"x":1320,"y":720,"exts":{},"tx":0.5,"ty":0.5,"template":"FullScreen"}]'),
    bgs: JSON.parse('[{"depth":-10,"texture":"Leaderboard","extends":{"repeat":"no-repeat"}},{"depth":-9,"texture":"Stars_Big","extends":{"movementY":0,"movementX":-0.1,"parallaxX":0,"parallaxY":0,"scaleX":0.5,"scaleY":0.5}}]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        ct.sound.spawn('Music_MainMenu', {
    loop: true,
    volume: 0.5
});
// ct.sound.stop('Music_MainMenu');
// ct.sound.stop('Music_BossTheme');

ct.web3.onAccountChange(()=> {
    ct.rooms.switch('ConnectMetamask');
});

    },
    extends: {}
}
ct.rooms.templates['MyShip'] = {
    name: 'MyShip',
    width: 1366,
    height: 768,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":1116,"y":496,"exts":{},"template":"EnemyPlanet"},{"x":40,"y":30,"exts":{},"template":"Back"},{"x":216,"y":216,"exts":{},"template":"ShipInfo"},{"x":504,"y":368,"exts":{},"template":"Player_SpaceShip_UI"},{"x":840,"y":304,"exts":{},"template":"LevelInfo"},{"x":1008,"y":312,"exts":{},"tx":0.5,"ty":0.5,"template":"ButtonUpdateLevel"},{"x":840,"y":384,"exts":{},"template":"EnergyInfo"},{"x":960,"y":568,"exts":{},"tx":0.55,"ty":0.55,"lastX":960,"lastY":576,"template":"SaveShip"},{"x":840,"y":440,"exts":{},"template":"CharacteristicsInfo"},{"x":1008,"y":392,"exts":{},"tx":0.5,"ty":0.5,"template":"ButtonAddEnergy"},{"x":960,"y":248,"exts":{},"template":"ShipName"},{"x":1320,"y":720,"exts":{},"tx":0.5,"ty":0.5,"template":"FullScreen"}]'),
    bgs: JSON.parse('[{"depth":-10,"texture":"MyShip","extends":{"repeat":"no-repeat"}},{"depth":-9,"texture":"Stars_Big","extends":{"movementY":0,"movementX":-0.1,"parallaxX":0,"parallaxY":0,"scaleX":0.5,"scaleY":0.5}}]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        ct.sound.spawn('Music_MainMenu', {
    loop: true,
    volume: 0.5
});
// ct.sound.stop('Music_MainMenu');
// ct.sound.stop('Music_BossTheme');

ct.web3.onAccountChange(()=> {
    ct.rooms.switch('ConnectMetamask');
});

    },
    extends: {}
}
ct.rooms.templates.CTTRANSITIONEMPTYROOM = {
    name: 'CTTRANSITIONEMPTYROOM',
    width: 1024,
    height: 1024,
    objects: [],
    bgs: [],
    tiles: [],
    onStep() {
        void 0;
    },
    onDraw() {
        void 0;
    },
    onLeave() {
        void 0;
    },
    onCreate() {
        void 0;
    }
};


/**
 * @namespace
 */
ct.styles = {
    types: { },
    /**
     * Creates a new style with a given name.
     * Technically, it just writes `data` to `ct.styles.types`
     */
    new(name, styleTemplate) {
        ct.styles.types[name] = styleTemplate;
        return styleTemplate;
    },
    /**
     * Returns a style of a given name. The actual behavior strongly depends on `copy` parameter.
     * @param {string} name The name of the style to load
     * @param {boolean|Object} [copy] If not set, returns the source style object.
     * Editing it will affect all new style calls.
     * When set to `true`, will create a new object, which you can safely modify
     * without affecting the source style.
     * When set to an object, this will create a new object as well,
     * augmenting it with given properties.
     * @returns {object} The resulting style
     */
    get(name, copy) {
        if (copy === true) {
            return ct.u.ext({}, ct.styles.types[name]);
        }
        if (copy) {
            return ct.u.ext(ct.u.ext({}, ct.styles.types[name]), copy);
        }
        return ct.styles.types[name];
    }
};

ct.styles.new(
    "ScoreText",
    {
    "fontFamily": "'Press Start 2P', sans-serif",
    "fontSize": 28,
    "fontStyle": "normal",
    "fontWeight": "900",
    "align": "center",
    "lineJoin": "round",
    "lineHeight": 37.800000000000004,
    "fill": "#FFF570",
    "strokeThickness": 1,
    "stroke": "rgba(0,0,0,0.41)",
    "dropShadow": true,
    "dropShadowBlur": 0,
    "dropShadowColor": "#00345E",
    "dropShadowAngle": -2.5535900500422257,
    "dropShadowDistance": 3.6055512754639896
});

ct.styles.new(
    "Blue12",
    {
    "fontFamily": "'Press Start 2P', sans-serif",
    "fontSize": 18,
    "fontStyle": "normal",
    "fontWeight": 400,
    "align": "center",
    "lineJoin": "round",
    "lineHeight": 36,
    "fill": "#70C4FF"
});

ct.styles.new(
    "Gray_H3_Center",
    {
    "fontFamily": "\"CTPROJFONTExo2.0-Regular\", \"Exo2.0-Regular\", sans-serif",
    "fontSize": 18,
    "fontStyle": "normal",
    "fontWeight": "400",
    "align": "center",
    "lineJoin": "round",
    "lineHeight": 24.3,
    "fill": "rgba(255,255,255,0.5)"
});

ct.styles.new(
    "White_H3_Center",
    {
    "fontFamily": "\"CTPROJFONTExo2.0-Regular\", \"Exo2.0-Regular\", sans-serif",
    "fontSize": 18,
    "fontStyle": "normal",
    "fontWeight": "400",
    "align": "center",
    "lineJoin": "round",
    "lineHeight": 24.3,
    "fill": "#FFFFFF"
});

ct.styles.new(
    "White_H3_Left",
    {
    "fontFamily": "\"CTPROJFONTExo2.0-Regular\", \"Exo2.0-Regular\", sans-serif",
    "fontSize": 18,
    "fontStyle": "normal",
    "fontWeight": "400",
    "align": "left",
    "lineJoin": "round",
    "lineHeight": 24.3,
    "fill": "#FFFFFF"
});

ct.styles.new(
    "White_H3_Right_Bold",
    {
    "fontFamily": "\"CTPROJFONTExo2.0-SemiBold\", \"Exo2.0-SemiBold\", sans-serif",
    "fontSize": 18,
    "fontStyle": "normal",
    "fontWeight": "400",
    "align": "right",
    "lineJoin": "round",
    "lineHeight": 24.3,
    "fill": "#FFFFFF"
});

ct.styles.new(
    "White_H3_Left_Bold",
    {
    "fontFamily": "\"CTPROJFONTExo2.0-SemiBold\", \"Exo2.0-SemiBold\", sans-serif",
    "fontSize": 18,
    "fontStyle": "normal",
    "fontWeight": "400",
    "align": "left",
    "lineJoin": "round",
    "lineHeight": 24.3,
    "fill": "#FFFFFF"
});

ct.styles.new(
    "Button_Text",
    {
    "fontFamily": "\"CTPROJFONTExo2.0-SemiBold\", \"Exo2.0-SemiBold\", sans-serif",
    "fontSize": 24,
    "fontStyle": "normal",
    "fontWeight": "600",
    "align": "left",
    "lineJoin": "round",
    "lineHeight": 28,
    "fill": "#10102E"
});

ct.styles.new(
    "White_H2_Left_Bold",
    {
    "fontFamily": "\"CTPROJFONTExo2.0-SemiBold\", \"Exo2.0-SemiBold\", sans-serif",
    "fontSize": 22,
    "fontStyle": "normal",
    "fontWeight": "400",
    "align": "left",
    "lineJoin": "round",
    "lineHeight": 29.700000000000003,
    "fill": "#FFFFFF"
});

ct.styles.new(
    "White_H4_Left",
    {
    "fontFamily": "\"CTPROJFONTExo2.0-Regular\", \"Exo2.0-Regular\", sans-serif",
    "fontSize": 14,
    "fontStyle": "normal",
    "fontWeight": "400",
    "align": "left",
    "lineJoin": "round",
    "lineHeight": 18.900000000000002,
    "fill": "#FFFFFF"
});



/**
 * @typedef ISimplePoint
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef ITandemSettings
 *
 * @property {ISimplePoint} [scale] Optional scaling object with `x` and `y` parameters.
 * @property {ISimplePoint} [position] Set this to additionally shift the emitter tandem relative
 * to the copy it was attached to, or relative to the copy it follows.
 * @property {number} [prewarmDelay] Optional; if less than 0, it will prewarm the emitter tandem,
 * meaning that it will simulate a given number of seconds before
 * showing particles in the world. If greater than 0, will postpone
 * the effect for the specified number of seconds.
 * @property {number} [tint] Optional tint to the whole effect.
 * @property {number} [alpha] Optional opacity set to the whole effect.
 * @property {number} [rotation] Optional rotation in radians.
 * @property {number} [angle] Optional rotation in degrees.
 * @property {boolean} [isUi] If set to true, will use the time scale of UI layers. This affects
 * how an effect is simulated during slowmo effects and game pause.
 * @property {number} [depth] The depth of the tandem. Defaults to Infinity
 * (will overlay everything).
 * @property {Room} [room] The room to attach the effect to.
 * Defaults to the current main room (ct.room); has no effect if attached to a copy.
 */

/**
 * A class for displaying and managing a collection of particle emitters.
 *
 * @property {boolean} frozen If set to true, the tandem will stop updating its emitters
 * @property {Copy|DisplayObject} follow A copy to follow
 * @extends PIXI.Container
 */
class EmitterTandem extends PIXI.Container {
    /**
     * Creates a new emitter tandem. This method should not be called directly;
     * better use the methods of `ct.emitters`.
     * @param {object} tandemData The template object of the tandem, as it was exported from ct.IDE.
     * @param {ITandemSettings} opts Additional settings applied to the tandem
     * @constructor
     */
    constructor(tandemData, opts) {
        super();
        this.emitters = [];
        this.delayed = [];

        for (const emt of tandemData) {
            const inst = new PIXI.particles.Emitter(
                this,
                ct.res.getTexture(emt.texture),
                emt.settings
            );
            const d = emt.settings.delay + opts.prewarmDelay;
            if (d > 0) {
                inst.emit = false;
                this.delayed.push({
                    value: d,
                    emitter: inst
                });
            } else if (d < 0) {
                inst.emit = true;
                inst.update(-d);
            } else {
                inst.emit = true;
            }
            inst.initialDeltaPos = {
                x: emt.settings.pos.x,
                y: emt.settings.pos.y
            };
            this.emitters.push(inst);
            inst.playOnce(() => {
                this.emitters.splice(this.emitters.indexOf(inst), 1);
            });
        }
        this.isUi = opts.isUi;
        this.scale.x = opts.scale.x;
        this.scale.y = opts.scale.y;
        if (opts.rotation) {
            this.rotation = opts.rotation;
        } else if (opts.angle) {
            this.angle = opts.angle;
        }
        this.deltaPosition = opts.position;
        this.depth = opts.depth;
        this.frozen = false;

        if (this.isUi) {
            ct.emitters.uiTandems.push(this);
        } else {
            ct.emitters.tandems.push(this);
        }
    }
    /**
     * A method for internal use; advances the particle simulation further
     * according to either a UI ticker or ct.delta.
     * @returns {void}
     */
    update() {
        if (this.stopped) {
            for (const emitter of this.emitters) {
                if (!emitter.particleCount) {
                    this.emitters.splice(this.emitters.indexOf(emitter), 1);
                }
            }
        }
        // eslint-disable-next-line no-underscore-dangle
        if ((this.appendant && this.appendant._destroyed) || this.kill || !this.emitters.length) {
            this.emit('done');
            if (this.isUi) {
                ct.emitters.uiTandems.splice(ct.emitters.uiTandems.indexOf(this), 1);
            } else {
                ct.emitters.tandems.splice(ct.emitters.tandems.indexOf(this), 1);
            }
            this.destroy();
            return;
        }
        if (this.frozen) {
            return;
        }
        const s = (this.isUi ? PIXI.Ticker.shared.elapsedMS : PIXI.Ticker.shared.deltaMS) / 1000;
        for (const delayed of this.delayed) {
            delayed.value -= s;
            if (delayed.value <= 0) {
                delayed.emitter.emit = true;
                this.delayed.splice(this.delayed.indexOf(delayed), 1);
            }
        }
        for (const emt of this.emitters) {
            if (this.delayed.find(delayed => delayed.emitter === emt)) {
                continue;
            }
            emt.update(s);
        }
        if (this.follow) {
            this.updateFollow();
        }
    }
    /**
     * Stops spawning new particles, then destroys itself.
     * Can be fired only once, otherwise it will log a warning.
     * @returns {void}
     */
    stop() {
        if (this.stopped) {
            // eslint-disable-next-line no-console
            console.trace('[ct.emitters] An attempt to stop an already stopped emitter tandem. Continuing…');
            return;
        }
        this.stopped = true;
        for (const emt of this.emitters) {
            emt.emit = false;
        }
        this.delayed = [];
    }
    /**
     * Stops spawning new particles, but continues simulation and allows to resume the effect later
     * with `emitter.resume();`
     * @returns {void}
     */
    pause() {
        for (const emt of this.emitters) {
            if (emt.maxParticles !== 0) {
                emt.oldMaxParticles = emt.maxParticles;
                emt.maxParticles = 0;
            }
        }
    }
    /**
     * Resumes previously paused effect.
     * @returns {void}
     */
    resume() {
        for (const emt of this.emitters) {
            emt.maxParticles = emt.oldMaxParticles || emt.maxParticles;
        }
    }
    /**
     * Removes all the particles from the tandem, but continues spawning new ones.
     * @returns {void}
     */
    clear() {
        for (const emt of this.emitters) {
            emt.cleanup();
        }
    }

    updateFollow() {
        if (!this.follow) {
            return;
        }
        if (this.follow.kill || !this.follow.scale) {
            this.follow = null;
            this.stop();
            return;
        }
        const delta = ct.u.rotate(
            this.deltaPosition.x * this.follow.scale.x,
            this.deltaPosition.y * this.follow.scale.y,
            -this.follow.angle
        );
        for (const emitter of this.emitters) {
            emitter.updateOwnerPos(this.follow.x + delta.x, this.follow.y + delta.y);
            const ownDelta = ct.u.rotate(
                emitter.initialDeltaPos.x * this.follow.scale.x,
                emitter.initialDeltaPos.y * this.follow.scale.y,
                -this.follow.angle
            );
            emitter.updateSpawnPos(ownDelta.x, ownDelta.y);
        }
    }
}

(function emittersAddon() {
    const defaultSettings = {
        prewarmDelay: 0,
        scale: {
            x: 1,
            y: 1
        },
        tint: 0xffffff,
        alpha: 1,
        position: {
            x: 0,
            y: 0
        },
        isUi: false,
        depth: Infinity
    };

    /**
     * @namespace
     */
    ct.emitters = {
        /**
         * A map of existing emitter templates.
         * @type Array<object>
         */
        templates: [{
    "Explosion": [
        {
            "texture": "Scorch",
            "settings": {
                "alpha": {
                    "list": [
                        {
                            "value": 0,
                            "time": 0
                        },
                        {
                            "time": 0.112,
                            "value": 0.30500000000000005
                        },
                        {
                            "time": 0.236,
                            "value": 0.5050000000000001
                        },
                        {
                            "value": 0.5900000000000001,
                            "time": 0.392
                        },
                        {
                            "time": 0.572,
                            "value": 0.5
                        },
                        {
                            "value": 0,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "scale": {
                    "list": [
                        {
                            "value": 0.050000000000000044,
                            "time": 0
                        },
                        {
                            "value": 1.6999999999999997,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "color": {
                    "list": [
                        {
                            "value": "FF3C00",
                            "time": 0
                        },
                        {
                            "time": 0.112,
                            "value": "FF551A"
                        },
                        {
                            "time": 0.236,
                            "value": "FF682E"
                        },
                        {
                            "value": "FF7B42",
                            "time": 0.392
                        },
                        {
                            "time": 0.572,
                            "value": "FFD599"
                        },
                        {
                            "value": "FF5F19",
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "blendMode": "add",
                "speed": {
                    "list": [
                        {
                            "value": 0,
                            "time": 0
                        },
                        {
                            "value": 0,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "startRotation": {
                    "min": 0,
                    "max": 360
                },
                "rotationSpeed": {
                    "min": 0,
                    "max": 0
                },
                "rotationAcceleration": 0,
                "lifetime": {
                    "min": 0.25,
                    "max": 0.5
                },
                "frequency": 0.015,
                "spawnChance": 1,
                "particlesPerWave": 1,
                "angleStart": 270,
                "emitterLifetime": 0.1,
                "maxParticles": 1000,
                "maxSpeed": 0,
                "pos": {
                    "x": 0,
                    "y": 0
                },
                "acceleration": {
                    "x": 0,
                    "y": 0
                },
                "addAtBack": false,
                "spawnType": "point",
                "spawnCircle": {
                    "x": 0,
                    "y": 0,
                    "r": 64,
                    "minR": 32
                },
                "delay": 0,
                "particleSpacing": 360,
                "noRotation": false
            }
        },
        {
            "texture": "Smoke",
            "settings": {
                "alpha": {
                    "list": [
                        {
                            "value": 0,
                            "time": 0
                        },
                        {
                            "time": 0.16,
                            "value": 0.08999999999999997
                        },
                        {
                            "time": 0.32,
                            "value": 0.5499999999999999
                        },
                        {
                            "value": 0.71,
                            "time": 0.572
                        },
                        {
                            "value": 0,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "scale": {
                    "list": [
                        {
                            "value": 0.55,
                            "time": 0
                        },
                        {
                            "value": 1.75,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "color": {
                    "list": [
                        {
                            "value": "595959",
                            "time": 0
                        },
                        {
                            "time": 0.16,
                            "value": "383838"
                        },
                        {
                            "time": 0.32,
                            "value": "292929"
                        },
                        {
                            "value": "2E2E2E",
                            "time": 0.572
                        },
                        {
                            "value": "363636",
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "blendMode": "normal",
                "speed": {
                    "list": [
                        {
                            "value": 0,
                            "time": 0
                        },
                        {
                            "value": 0,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "startRotation": {
                    "min": 0,
                    "max": 360
                },
                "rotationSpeed": {
                    "min": -60,
                    "max": 60
                },
                "rotationAcceleration": 0,
                "lifetime": {
                    "min": 3,
                    "max": 5
                },
                "frequency": 0.01,
                "spawnChance": 1,
                "particlesPerWave": 1,
                "angleStart": 270,
                "emitterLifetime": 0.1,
                "maxParticles": 1000,
                "maxSpeed": 0,
                "pos": {
                    "x": 0,
                    "y": 0
                },
                "acceleration": {
                    "x": 0,
                    "y": 0
                },
                "addAtBack": false,
                "spawnType": "point",
                "spawnCircle": {
                    "x": 0,
                    "y": 0,
                    "r": 32
                },
                "delay": 0,
                "minimumScaleMultiplier": 0.25
            }
        }
    ],
    "Electricity": [
        {
            "texture": "Spark",
            "settings": {
                "alpha": {
                    "list": [
                        {
                            "value": 0,
                            "time": 0
                        },
                        {
                            "value": 1,
                            "time": 0.5
                        },
                        {
                            "value": 0,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "scale": {
                    "list": [
                        {
                            "value": 0.22499999999999998,
                            "time": 0
                        },
                        {
                            "value": 0.175,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "color": {
                    "list": [
                        {
                            "value": "4AB4FF",
                            "time": 0
                        },
                        {
                            "value": "26A6FF",
                            "time": 0.5
                        },
                        {
                            "value": "21A3FF",
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "blendMode": "add",
                "speed": {
                    "list": [
                        {
                            "value": 10,
                            "time": 0
                        },
                        {
                            "value": 10,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "startRotation": {
                    "min": 0,
                    "max": 360
                },
                "rotationSpeed": {
                    "min": 0,
                    "max": 0
                },
                "rotationAcceleration": 0,
                "lifetime": {
                    "min": 0.1,
                    "max": 0.05
                },
                "frequency": 0.008,
                "spawnChance": 0.41,
                "particlesPerWave": 1,
                "angleStart": 270,
                "emitterLifetime": 0,
                "maxParticles": 1000,
                "maxSpeed": 0,
                "pos": {
                    "x": 0,
                    "y": 0
                },
                "acceleration": {
                    "x": 0,
                    "y": 0
                },
                "addAtBack": false,
                "spawnType": "point",
                "spawnCircle": {
                    "x": 0,
                    "y": 0,
                    "r": 32
                },
                "delay": 0,
                "minimumScaleMultiplier": 0.28
            }
        }
    ],
    "ChunkBurst": [
        {
            "texture": "Asteroids_Small",
            "settings": {
                "alpha": {
                    "list": [
                        {
                            "value": 0,
                            "time": 0
                        },
                        {
                            "value": 0.25500000000000006,
                            "time": 0.14682539682539686
                        },
                        {
                            "time": 0.40174603174603174,
                            "value": 0.5099999999999999
                        },
                        {
                            "value": 0.03500000000000003,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "scale": {
                    "list": [
                        {
                            "value": 0.77,
                            "time": 0
                        },
                        {
                            "value": 0.35,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "color": {
                    "list": [
                        {
                            "value": "ffffff",
                            "time": 0
                        },
                        {
                            "value": "ffffff",
                            "time": 0.14682539682539686
                        },
                        {
                            "time": 0.40174603174603174,
                            "value": "FFFFFF"
                        },
                        {
                            "value": "ffffff",
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "blendMode": "normal",
                "speed": {
                    "list": [
                        {
                            "value": 487.5,
                            "time": 0
                        },
                        {
                            "value": 100,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "startRotation": {
                    "min": 0,
                    "max": 360
                },
                "rotationSpeed": {
                    "min": -720,
                    "max": 720
                },
                "rotationAcceleration": 0,
                "lifetime": {
                    "min": 0.5,
                    "max": 2
                },
                "frequency": 0.01,
                "spawnChance": 1,
                "particlesPerWave": 1,
                "angleStart": 270,
                "emitterLifetime": 0.1,
                "maxParticles": 1000,
                "maxSpeed": 0,
                "pos": {
                    "x": 0,
                    "y": 0
                },
                "acceleration": {
                    "x": 0,
                    "y": 0
                },
                "addAtBack": false,
                "spawnType": "circle",
                "spawnCircle": {
                    "x": 0,
                    "y": 0,
                    "r": 64
                },
                "delay": 0,
                "minimumSpeedMultiplier": 0.01,
                "minimumScaleMultiplier": 0.61
            }
        },
        {
            "texture": "Smoke",
            "settings": {
                "alpha": {
                    "list": [
                        {
                            "value": 0,
                            "time": 0
                        },
                        {
                            "time": 0.07199999999999998,
                            "value": 0.33999999999999997
                        },
                        {
                            "value": 0.5549999999999999,
                            "time": 0.22822222222222222
                        },
                        {
                            "time": 0.5,
                            "value": 0.5449999999999999
                        },
                        {
                            "value": 0,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "scale": {
                    "list": [
                        {
                            "value": 0.24999999999999994,
                            "time": 0
                        },
                        {
                            "value": 0.7,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "color": {
                    "list": [
                        {
                            "value": "919191",
                            "time": 0
                        },
                        {
                            "time": 0.07199999999999998,
                            "value": "898989"
                        },
                        {
                            "value": "7A7A7A",
                            "time": 0.22822222222222222
                        },
                        {
                            "time": 0.5,
                            "value": "787878"
                        },
                        {
                            "value": "757575",
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "blendMode": "normal",
                "speed": {
                    "list": [
                        {
                            "value": 80,
                            "time": 0
                        },
                        {
                            "value": 0,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "startRotation": {
                    "min": 0,
                    "max": 360
                },
                "rotationSpeed": {
                    "min": -45,
                    "max": 45
                },
                "rotationAcceleration": 0,
                "lifetime": {
                    "min": 3,
                    "max": 5
                },
                "frequency": 0.005,
                "spawnChance": 1,
                "particlesPerWave": 1,
                "angleStart": 270,
                "emitterLifetime": 0.1,
                "maxParticles": 1000,
                "maxSpeed": 0,
                "pos": {
                    "x": 0,
                    "y": 0
                },
                "acceleration": {
                    "x": 0,
                    "y": 0
                },
                "addAtBack": false,
                "spawnType": "circle",
                "spawnCircle": {
                    "x": 0,
                    "y": 0,
                    "r": 128
                },
                "delay": 0,
                "minimumSpeedMultiplier": 0.07
            }
        }
    ],
    "Shield": [
        {
            "texture": "Light_02",
            "settings": {
                "alpha": {
                    "list": [
                        {
                            "value": 0,
                            "time": 0
                        },
                        {
                            "value": 0.99,
                            "time": 0.492
                        },
                        {
                            "value": 0,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "scale": {
                    "list": [
                        {
                            "value": 0.75,
                            "time": 0
                        },
                        {
                            "value": 0.75,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "color": {
                    "list": [
                        {
                            "value": "70C4FF",
                            "time": 0
                        },
                        {
                            "value": "70C4FF",
                            "time": 0.492
                        },
                        {
                            "value": "70C4FF",
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "blendMode": "screen",
                "speed": {
                    "list": [
                        {
                            "value": 1,
                            "time": 0
                        },
                        {
                            "value": 0,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "startRotation": {
                    "min": 0,
                    "max": 360
                },
                "rotationSpeed": {
                    "min": 0,
                    "max": 0
                },
                "rotationAcceleration": 90,
                "lifetime": {
                    "min": 0.5,
                    "max": 0.5
                },
                "frequency": 0.105,
                "spawnChance": 1,
                "particlesPerWave": 1,
                "angleStart": 270,
                "emitterLifetime": 0,
                "maxParticles": 101,
                "maxSpeed": 0,
                "pos": {
                    "x": 0,
                    "y": 0
                },
                "acceleration": {
                    "x": 0,
                    "y": 0
                },
                "addAtBack": false,
                "spawnType": "point",
                "spawnCircle": {
                    "x": 0,
                    "y": 0,
                    "r": 32
                },
                "delay": 0
            }
        },
        {
            "texture": "Twirl_03",
            "settings": {
                "alpha": {
                    "list": [
                        {
                            "value": 0,
                            "time": 0
                        },
                        {
                            "value": 0.515,
                            "time": 0.516
                        },
                        {
                            "value": 0,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "scale": {
                    "list": [
                        {
                            "value": 0.75,
                            "time": 0
                        },
                        {
                            "value": 0.75,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "color": {
                    "list": [
                        {
                            "value": "70C4FF",
                            "time": 0
                        },
                        {
                            "value": "70C4FF",
                            "time": 0.516
                        },
                        {
                            "value": "70C4FF",
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "blendMode": "add",
                "speed": {
                    "list": [
                        {
                            "value": 1,
                            "time": 0
                        },
                        {
                            "value": 0,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "startRotation": {
                    "min": 0,
                    "max": 360
                },
                "rotationSpeed": {
                    "min": 60,
                    "max": 90
                },
                "rotationAcceleration": 60,
                "lifetime": {
                    "min": 0.5,
                    "max": 1
                },
                "frequency": 0.075,
                "spawnChance": 1,
                "particlesPerWave": 1,
                "angleStart": 270,
                "emitterLifetime": 0,
                "maxParticles": 101,
                "maxSpeed": 0,
                "pos": {
                    "x": 0,
                    "y": 0
                },
                "acceleration": {
                    "x": 0,
                    "y": 0
                },
                "addAtBack": false,
                "spawnType": "point",
                "spawnCircle": {
                    "x": 0,
                    "y": 0,
                    "r": 128,
                    "minR": 128
                },
                "delay": 0,
                "noRotation": false
            }
        }
    ],
    "JetFlame": [
        {
            "texture": "Muzzle",
            "settings": {
                "alpha": {
                    "list": [
                        {
                            "value": 0,
                            "time": 0
                        },
                        {
                            "time": 0.15599999999999997,
                            "value": 0.815
                        },
                        {
                            "value": 0.95,
                            "time": 0.5680000000000001
                        },
                        {
                            "value": 0,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "scale": {
                    "list": [
                        {
                            "value": 0.2,
                            "time": 0
                        },
                        {
                            "value": 0.2,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "color": {
                    "list": [
                        {
                            "value": "F53D25",
                            "time": 0
                        },
                        {
                            "time": 0.15599999999999997,
                            "value": "F56925"
                        },
                        {
                            "value": "F5A225",
                            "time": 0.5680000000000001
                        },
                        {
                            "value": "F5A225",
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "blendMode": "add",
                "speed": {
                    "list": [
                        {
                            "value": 70,
                            "time": 0
                        },
                        {
                            "value": 50,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "startRotation": {
                    "min": 90,
                    "max": 90
                },
                "rotationSpeed": {
                    "min": 0,
                    "max": 0
                },
                "rotationAcceleration": 0,
                "lifetime": {
                    "min": 0.25,
                    "max": 0.75
                },
                "frequency": 0.04,
                "spawnChance": 0.81,
                "particlesPerWave": 1,
                "angleStart": 270,
                "emitterLifetime": 0,
                "maxParticles": 1000,
                "maxSpeed": 0,
                "pos": {
                    "x": 0,
                    "y": 0
                },
                "acceleration": {
                    "x": 0,
                    "y": 0
                },
                "addAtBack": false,
                "spawnType": "point",
                "spawnCircle": {
                    "x": 0,
                    "y": 0,
                    "r": 32
                },
                "delay": 0,
                "noRotation": false
            }
        }
    ],
    "PowerBoltTrail": [
        {
            "texture": "Laser_Bolt_Blue",
            "settings": {
                "alpha": {
                    "list": [
                        {
                            "value": 0,
                            "time": 0
                        },
                        {
                            "time": 0.14799999999999996,
                            "value": 0.47
                        },
                        {
                            "value": 0.58,
                            "time": 0.436
                        },
                        {
                            "value": 0,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "scale": {
                    "list": [
                        {
                            "value": 1,
                            "time": 0
                        },
                        {
                            "value": 1,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "color": {
                    "list": [
                        {
                            "value": "ffffff",
                            "time": 0
                        },
                        {
                            "time": 0.14799999999999996,
                            "value": "94FFFB"
                        },
                        {
                            "value": "ffffff",
                            "time": 0.436
                        },
                        {
                            "value": "ffffff",
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "blendMode": "add",
                "speed": {
                    "list": [
                        {
                            "value": 412.5,
                            "time": 0
                        },
                        {
                            "value": 225,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "startRotation": {
                    "min": 270,
                    "max": 270
                },
                "rotationSpeed": {
                    "min": 0,
                    "max": 0
                },
                "rotationAcceleration": 0,
                "lifetime": {
                    "min": 0.25,
                    "max": 0.75
                },
                "frequency": 0.028,
                "spawnChance": 1,
                "particlesPerWave": 1,
                "angleStart": 270,
                "emitterLifetime": 0,
                "maxParticles": 1000,
                "maxSpeed": 0,
                "pos": {
                    "x": 0,
                    "y": 0
                },
                "acceleration": {
                    "x": 0,
                    "y": 0
                },
                "addAtBack": false,
                "spawnType": "circle",
                "spawnCircle": {
                    "x": 0,
                    "y": 0,
                    "r": 17
                },
                "delay": 0,
                "noRotation": true
            }
        },
        {
            "texture": "Laser_X_Blue",
            "settings": {
                "alpha": {
                    "list": [
                        {
                            "value": 0,
                            "time": 0
                        },
                        {
                            "value": 1,
                            "time": 0.5
                        },
                        {
                            "value": 0,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "scale": {
                    "list": [
                        {
                            "value": 0.275,
                            "time": 0
                        },
                        {
                            "value": 0,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "color": {
                    "list": [
                        {
                            "value": "ffffff",
                            "time": 0
                        },
                        {
                            "value": "ffffff",
                            "time": 0.5
                        },
                        {
                            "value": "ffffff",
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "blendMode": "normal",
                "speed": {
                    "list": [
                        {
                            "value": 237.49999999999994,
                            "time": 0
                        },
                        {
                            "value": 362.5,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "startRotation": {
                    "min": 0,
                    "max": 360
                },
                "rotationSpeed": {
                    "min": 0,
                    "max": 0
                },
                "rotationAcceleration": 0,
                "lifetime": {
                    "min": 0.11,
                    "max": 0.33
                },
                "frequency": 0.008,
                "spawnChance": 1,
                "particlesPerWave": 1,
                "angleStart": 270,
                "emitterLifetime": 0,
                "maxParticles": 1000,
                "maxSpeed": 0,
                "pos": {
                    "x": 0,
                    "y": 0
                },
                "acceleration": {
                    "x": 0,
                    "y": 0
                },
                "addAtBack": false,
                "spawnType": "circle",
                "spawnCircle": {
                    "x": 0,
                    "y": 0,
                    "r": 32
                },
                "delay": 0,
                "noRotation": true
            }
        }
    ],
    "BlackHole": [
        {
            "texture": "Asteroids_Small",
            "settings": {
                "alpha": {
                    "list": [
                        {
                            "value": 0,
                            "time": 0
                        },
                        {
                            "value": 1,
                            "time": 0.5
                        },
                        {
                            "value": 1,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "scale": {
                    "list": [
                        {
                            "value": 1.61,
                            "time": 0
                        },
                        {
                            "time": 0.596,
                            "value": 0.24999999999999994
                        },
                        {
                            "value": 0.019999999999999962,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "color": {
                    "list": [
                        {
                            "value": "ffffff",
                            "time": 0
                        },
                        {
                            "value": "ffffff",
                            "time": 0.5
                        },
                        {
                            "value": "ffffff",
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "blendMode": "normal",
                "speed": {
                    "list": [
                        {
                            "value": 375,
                            "time": 0
                        },
                        {
                            "value": 1162.5,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "startRotation": {
                    "min": -190,
                    "max": -210
                },
                "rotationSpeed": {
                    "min": -180,
                    "max": 180
                },
                "rotationAcceleration": 3000,
                "lifetime": {
                    "min": 0.4,
                    "max": 0.8
                },
                "frequency": 0.012,
                "spawnChance": 1,
                "particlesPerWave": 1,
                "angleStart": 270,
                "emitterLifetime": 9.5,
                "maxParticles": 1000,
                "maxSpeed": 0,
                "pos": {
                    "x": 0,
                    "y": -8
                },
                "acceleration": {
                    "x": 0,
                    "y": 0
                },
                "addAtBack": false,
                "spawnType": "ring",
                "spawnCircle": {
                    "x": 0,
                    "y": 0,
                    "r": 521,
                    "minR": 353
                },
                "delay": 0,
                "minimumScaleMultiplier": 0.28
            }
        },
        {
            "texture": "Twirl_03",
            "settings": {
                "alpha": {
                    "list": [
                        {
                            "value": 0,
                            "time": 0
                        },
                        {
                            "value": 1,
                            "time": 0.5
                        },
                        {
                            "time": 0.8160000000000001,
                            "value": 0.7500000000000001
                        },
                        {
                            "value": 0,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "scale": {
                    "list": [
                        {
                            "value": 1.46,
                            "time": 0
                        },
                        {
                            "value": 0.31999999999999995,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "color": {
                    "list": [
                        {
                            "value": "000000",
                            "time": 0
                        },
                        {
                            "value": "000000",
                            "time": 0.5
                        },
                        {
                            "time": 0.8160000000000001,
                            "value": "000000"
                        },
                        {
                            "value": "000000",
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "blendMode": "multiply",
                "speed": {
                    "list": [
                        {
                            "value": 1,
                            "time": 0
                        },
                        {
                            "value": 1,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "startRotation": {
                    "min": 0,
                    "max": 360
                },
                "rotationSpeed": {
                    "min": 0,
                    "max": 960
                },
                "rotationAcceleration": 0,
                "lifetime": {
                    "min": 0.5,
                    "max": 0.5
                },
                "frequency": 0.03,
                "spawnChance": 1,
                "particlesPerWave": 1,
                "angleStart": 270,
                "emitterLifetime": 10,
                "maxParticles": 1000,
                "maxSpeed": 0,
                "pos": {
                    "x": 0,
                    "y": -8
                },
                "acceleration": {
                    "x": 0,
                    "y": 0
                },
                "addAtBack": false,
                "spawnType": "point",
                "spawnCircle": {
                    "x": 0,
                    "y": 0,
                    "r": 32
                },
                "delay": 0,
                "minimumScaleMultiplier": 0.4
            }
        },
        {
            "texture": "Light_02",
            "settings": {
                "alpha": {
                    "list": [
                        {
                            "value": 0,
                            "time": 0
                        },
                        {
                            "value": 1,
                            "time": 0.5
                        },
                        {
                            "value": 0,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "scale": {
                    "list": [
                        {
                            "value": 0.15,
                            "time": 0
                        },
                        {
                            "value": 0.15,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "color": {
                    "list": [
                        {
                            "value": "FF0004",
                            "time": 0
                        },
                        {
                            "value": "FF0004",
                            "time": 0.5
                        },
                        {
                            "value": "FF0004",
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "blendMode": "add",
                "speed": {
                    "list": [
                        {
                            "value": 0,
                            "time": 0
                        },
                        {
                            "value": 0,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "startRotation": {
                    "min": 0,
                    "max": 360
                },
                "rotationSpeed": {
                    "min": 0,
                    "max": 0
                },
                "rotationAcceleration": 0,
                "lifetime": {
                    "min": 0.5,
                    "max": 0.5
                },
                "frequency": 0.5,
                "spawnChance": 1,
                "particlesPerWave": 2,
                "angleStart": 270,
                "emitterLifetime": 10,
                "maxParticles": 1000,
                "maxSpeed": 0,
                "pos": {
                    "x": 0,
                    "y": -8
                },
                "acceleration": {
                    "x": 0,
                    "y": 0
                },
                "addAtBack": false,
                "spawnType": "point",
                "spawnCircle": {
                    "x": 0,
                    "y": 0,
                    "r": 32
                },
                "delay": 0,
                "minimumSpeedMultiplier": 1,
                "particleSpacing": 180
            }
        },
        {
            "texture": "Spark",
            "settings": {
                "alpha": {
                    "list": [
                        {
                            "value": 0,
                            "time": 0
                        },
                        {
                            "time": 0.27599999999999997,
                            "value": 1
                        },
                        {
                            "value": 0.99,
                            "time": 0.728
                        },
                        {
                            "value": 0,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "scale": {
                    "list": [
                        {
                            "value": 0.1,
                            "time": 0
                        },
                        {
                            "value": 0.15000000000000002,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "color": {
                    "list": [
                        {
                            "value": "FF0004",
                            "time": 0
                        },
                        {
                            "time": 0.27599999999999997,
                            "value": "FF0004"
                        },
                        {
                            "value": "FF0004",
                            "time": 0.728
                        },
                        {
                            "value": "FF0004",
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "blendMode": "add",
                "speed": {
                    "list": [
                        {
                            "value": 1,
                            "time": 0
                        },
                        {
                            "value": 1,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "startRotation": {
                    "min": 0,
                    "max": 360
                },
                "rotationSpeed": {
                    "min": 0,
                    "max": 0
                },
                "rotationAcceleration": 0,
                "lifetime": {
                    "min": 0.1,
                    "max": 0.1
                },
                "frequency": 0.008,
                "spawnChance": 1,
                "particlesPerWave": 3,
                "angleStart": 270,
                "emitterLifetime": 9.5,
                "maxParticles": 1000,
                "maxSpeed": 0,
                "pos": {
                    "x": 0,
                    "y": 0
                },
                "acceleration": {
                    "x": 0,
                    "y": 0
                },
                "addAtBack": false,
                "spawnType": "ring",
                "spawnCircle": {
                    "x": 0,
                    "y": 0,
                    "r": 249,
                    "minR": 89
                },
                "delay": 0,
                "noRotation": false,
                "minimumScaleMultiplier": 0.04,
                "particleSpacing": 120
            }
        }
    ],
    "Explosion_Boss": [
        {
            "texture": "Scorch",
            "settings": {
                "alpha": {
                    "list": [
                        {
                            "value": 0,
                            "time": 0
                        },
                        {
                            "time": 0.112,
                            "value": 0.30500000000000005
                        },
                        {
                            "time": 0.236,
                            "value": 0.5050000000000001
                        },
                        {
                            "value": 0.5900000000000001,
                            "time": 0.392
                        },
                        {
                            "time": 0.572,
                            "value": 0.5
                        },
                        {
                            "value": 0,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "scale": {
                    "list": [
                        {
                            "value": 0.050000000000000044,
                            "time": 0
                        },
                        {
                            "value": 1.9999999999999998,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "color": {
                    "list": [
                        {
                            "value": "FF3C00",
                            "time": 0
                        },
                        {
                            "time": 0.112,
                            "value": "FF551A"
                        },
                        {
                            "time": 0.236,
                            "value": "FF682E"
                        },
                        {
                            "value": "FF7B42",
                            "time": 0.392
                        },
                        {
                            "time": 0.572,
                            "value": "FFD599"
                        },
                        {
                            "value": "FF5F19",
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "blendMode": "add",
                "speed": {
                    "list": [
                        {
                            "value": 0,
                            "time": 0
                        },
                        {
                            "value": 0,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "startRotation": {
                    "min": 0,
                    "max": 360
                },
                "rotationSpeed": {
                    "min": 0,
                    "max": 0
                },
                "rotationAcceleration": 0,
                "lifetime": {
                    "min": 0.25,
                    "max": 0.5
                },
                "frequency": 0.015,
                "spawnChance": 1,
                "particlesPerWave": 1,
                "angleStart": 270,
                "emitterLifetime": 0.1,
                "maxParticles": 1000,
                "maxSpeed": 0,
                "pos": {
                    "x": 0,
                    "y": 0
                },
                "acceleration": {
                    "x": 0,
                    "y": 0
                },
                "addAtBack": false,
                "spawnType": "point",
                "spawnCircle": {
                    "x": 0,
                    "y": 0,
                    "r": 64,
                    "minR": 32
                },
                "delay": 0,
                "particleSpacing": 360,
                "noRotation": false
            }
        },
        {
            "texture": "Smoke",
            "settings": {
                "alpha": {
                    "list": [
                        {
                            "value": 0,
                            "time": 0
                        },
                        {
                            "time": 0.16,
                            "value": 0.08999999999999997
                        },
                        {
                            "time": 0.32,
                            "value": 0.5499999999999999
                        },
                        {
                            "value": 0.71,
                            "time": 0.572
                        },
                        {
                            "value": 0,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "scale": {
                    "list": [
                        {
                            "value": 0.55,
                            "time": 0
                        },
                        {
                            "value": 1.93,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "color": {
                    "list": [
                        {
                            "value": "595959",
                            "time": 0
                        },
                        {
                            "time": 0.16,
                            "value": "383838"
                        },
                        {
                            "time": 0.32,
                            "value": "292929"
                        },
                        {
                            "value": "2E2E2E",
                            "time": 0.572
                        },
                        {
                            "value": "363636",
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "blendMode": "normal",
                "speed": {
                    "list": [
                        {
                            "value": 0,
                            "time": 0
                        },
                        {
                            "value": 0,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "startRotation": {
                    "min": 0,
                    "max": 360
                },
                "rotationSpeed": {
                    "min": -60,
                    "max": 60
                },
                "rotationAcceleration": 0,
                "lifetime": {
                    "min": 3,
                    "max": 5
                },
                "frequency": 0.01,
                "spawnChance": 1,
                "particlesPerWave": 1,
                "angleStart": 270,
                "emitterLifetime": 0.1,
                "maxParticles": 1000,
                "maxSpeed": 0,
                "pos": {
                    "x": 0,
                    "y": 0
                },
                "acceleration": {
                    "x": 0,
                    "y": 0
                },
                "addAtBack": false,
                "spawnType": "circle",
                "spawnCircle": {
                    "x": 0,
                    "y": 0,
                    "r": 105,
                    "minR": 100
                },
                "delay": 0,
                "minimumScaleMultiplier": 0.25
            }
        },
        {
            "texture": "Spark",
            "settings": {
                "alpha": {
                    "list": [
                        {
                            "value": 0.665,
                            "time": 0
                        },
                        {
                            "value": 1,
                            "time": 0.5
                        },
                        {
                            "value": 0.005,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "scale": {
                    "list": [
                        {
                            "value": 0.08999999999999996,
                            "time": 0
                        },
                        {
                            "value": 0.08999999999999997,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "color": {
                    "list": [
                        {
                            "value": "FF0004",
                            "time": 0
                        },
                        {
                            "value": "FF0004",
                            "time": 0.5
                        },
                        {
                            "value": "FF0004",
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "blendMode": "add",
                "speed": {
                    "list": [
                        {
                            "value": 1,
                            "time": 0
                        },
                        {
                            "value": 1,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "startRotation": {
                    "min": 0,
                    "max": 360
                },
                "rotationSpeed": {
                    "min": -3000,
                    "max": 3000
                },
                "rotationAcceleration": 0,
                "lifetime": {
                    "min": 0.05,
                    "max": 0.05
                },
                "frequency": 0.008,
                "spawnChance": 1,
                "particlesPerWave": 1,
                "angleStart": 270,
                "emitterLifetime": 2.6,
                "maxParticles": 1000,
                "maxSpeed": 0,
                "pos": {
                    "x": 0,
                    "y": 0
                },
                "acceleration": {
                    "x": 0,
                    "y": 0
                },
                "addAtBack": false,
                "spawnType": "circle",
                "spawnCircle": {
                    "x": 0,
                    "y": 0,
                    "r": 193
                },
                "delay": 0
            }
        },
        {
            "texture": "Asteroids_Small",
            "settings": {
                "alpha": {
                    "list": [
                        {
                            "value": 0.010000000000000009,
                            "time": 0
                        },
                        {
                            "value": 0.995,
                            "time": 0.10399999999999998
                        },
                        {
                            "time": 0.8360000000000001,
                            "value": 1
                        },
                        {
                            "value": 0,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "scale": {
                    "list": [
                        {
                            "value": 1.9600000000000002,
                            "time": 0
                        },
                        {
                            "value": 1.9700000000000002,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "color": {
                    "list": [
                        {
                            "value": "4F4444",
                            "time": 0
                        },
                        {
                            "value": "4F4444",
                            "time": 0.10399999999999998
                        },
                        {
                            "time": 0.8360000000000001,
                            "value": "4F4444"
                        },
                        {
                            "value": "4F4444",
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "blendMode": "normal",
                "speed": {
                    "list": [
                        {
                            "value": 500,
                            "time": 0
                        },
                        {
                            "value": 100,
                            "time": 1
                        }
                    ],
                    "isStepped": false
                },
                "startRotation": {
                    "min": 0,
                    "max": 360
                },
                "rotationSpeed": {
                    "min": -720,
                    "max": 720
                },
                "rotationAcceleration": 0,
                "lifetime": {
                    "min": 1.01,
                    "max": 3
                },
                "frequency": 0.008,
                "spawnChance": 1,
                "particlesPerWave": 1,
                "angleStart": 270,
                "emitterLifetime": 0.2,
                "maxParticles": 1000,
                "maxSpeed": 0,
                "pos": {
                    "x": 0,
                    "y": 0
                },
                "acceleration": {
                    "x": 0,
                    "y": 0
                },
                "addAtBack": false,
                "spawnType": "circle",
                "spawnCircle": {
                    "x": 0,
                    "y": 0,
                    "r": 105
                },
                "delay": 0,
                "minimumScaleMultiplier": 0.06,
                "minimumSpeedMultiplier": 0.06
            }
        }
    ]
}][0] || {},
        /**
         * A list of all the emitters that are simulated in UI time scale.
         * @type Array<EmitterTandem>
         */
        uiTandems: [],
        /**
         * A list of all the emitters that are simulated in a regular game loop.
         * @type Array<EmitterTandem>
         */
        tandems: [],
        /**
         * Creates a new emitter tandem in the world at the given position.
         * @param {string} name The name of the tandem template, as it was named in ct.IDE.
         * @param {number} x The x coordinate of the new tandem.
         * @param {number} y The y coordinate of the new tandem.
         * @param {ITandemSettings} [settings] Additional configs for the created tandem.
         * @return {EmitterTandem} The newly created tandem.
         */
        fire(name, x, y, settings) {
            if (!(name in ct.emitters.templates)) {
                throw new Error(`[ct.emitters] An attempt to create a non-existent emitter ${name}.`);
            }
            const opts = Object.assign({}, defaultSettings, settings);
            const tandem = new EmitterTandem(ct.emitters.templates[name], opts);
            tandem.x = x;
            tandem.y = y;
            if (!opts.room) {
                ct.room.addChild(tandem);
                tandem.isUi = ct.room.isUi;
            } else {
                opts.room.addChild(tandem);
                tandem.isUi = opts.room.isUi;
            }
            return tandem;
        },
        /**
         * Creates a new emitter tandem and attaches it to the given copy
         * (or to any other DisplayObject).
         * @param {Copy|PIXI.DisplayObject} parent The parent of the created tandem.
         * @param {string} name The name of the tandem template.
         * @param {ITandemSettings} [settings] Additional options for the created tandem.
         * @returns {EmitterTandem} The newly created emitter tandem.
         */
        append(parent, name, settings) {
            if (!(name in ct.emitters.templates)) {
                throw new Error(`[ct.emitters] An attempt to create a non-existent emitter ${name}.`);
            }
            const opts = Object.assign({}, defaultSettings, settings);
            const tandem = new EmitterTandem(ct.emitters.templates[name], opts);
            if (opts.position) {
                tandem.x = opts.position.x;
                tandem.y = opts.position.y;
            }
            tandem.appendant = parent;
            parent.addChild(tandem);
            return tandem;
        },
        /**
         * Creates a new emitter tandem in the world, and configs it so it will follow a given copy.
         * This includes handling position, scale, and rotation.
         * @param {Copy|PIXI.DisplayObject} parent The copy to follow.
         * @param {string} name The name of the tandem template.
         * @param {ITandemSettings} [settings] Additional options for the created tandem.
         * @returns {EmitterTandem} The newly created emitter tandem.
         */
        follow(parent, name, settings) {
            if (!(name in ct.emitters.templates)) {
                throw new Error(`[ct.emitters] An attempt to create a non-existent emitter ${name}.`);
            }
            const opts = Object.assign({}, defaultSettings, settings);
            const tandem = new EmitterTandem(ct.emitters.templates[name], opts);
            tandem.follow = parent;
            tandem.updateFollow();
            if (!('getRoom' in parent)) {
                ct.room.addChild(tandem);
            } else {
                parent.getRoom().addChild(tandem);
            }
            return tandem;
        }
    };

    PIXI.Ticker.shared.add(() => {
        for (const tandem of ct.emitters.uiTandems) {
            tandem.update();
        }
        for (const tandem of ct.emitters.tandems) {
            tandem.update();
        }
    });
})();
/**
 * @extends {PIXI.AnimatedSprite}
 * @class
 * @property {string} template The name of the template from which the copy was created
 * @property {IShapeTemplate} shape The collision shape of a copy
 * @property {number} depth The relative position of a copy in a drawing stack.
 * Higher values will draw the copy on top of those with lower ones
 * @property {number} xprev The horizontal location of a copy in the previous frame
 * @property {number} yprev The vertical location of a copy in the previous frame
 * @property {number} xstart The starting location of a copy,
 * meaning the point where it was created — either by placing it in a room with ct.IDE
 * or by calling `ct.templates.copy`.
 * @property {number} ystart The starting location of a copy,
 * meaning the point where it was created — either by placing it in a room with ct.IDE
 * or by calling `ct.templates.copy`.
 * @property {number} hspeed The horizontal speed of a copy
 * @property {number} vspeed The vertical speed of a copy
 * @property {number} gravity The acceleration that pulls a copy at each frame
 * @property {number} gravityDir The direction of acceleration that pulls a copy at each frame
 * @property {number} depth The position of a copy in draw calls
 * @property {boolean} kill If set to `true`, the copy will be destroyed by the end of a frame.
 */
const Copy = (function Copy() {
    const textureAccessor = Symbol('texture');
    const zeroDirectionAccessor = Symbol('zeroDirection');
    const hspeedAccessor = Symbol('hspeed');
    const vspeedAccessor = Symbol('vspeed');
    let uid = 0;
    class Copy extends PIXI.AnimatedSprite {
        /**
         * Creates an instance of Copy.
         * @param {string} template The name of the template to copy
         * @param {number} [x] The x coordinate of a new copy. Defaults to 0.
         * @param {number} [y] The y coordinate of a new copy. Defaults to 0.
         * @param {object} [exts] An optional object with additional properties
         * that will exist prior to a copy's OnCreate event
         * @param {PIXI.DisplayObject|Room} [container] A container to set as copy's parent
         * before its OnCreate event. Defaults to ct.room.
         * @memberof Copy
         */
        constructor(template, x, y, exts, container) {
            container = container || ct.room;
            var t;
            if (template) {
                if (!(template in ct.templates.templates)) {
                    throw new Error(`[ct.templates] An attempt to create a copy of a non-existent template \`${template}\` detected. A typo?`);
                }
                t = ct.templates.templates[template];
                if (t.texture && t.texture !== '-1') {
                    const textures = ct.res.getTexture(t.texture);
                    super(textures);
                    this[textureAccessor] = t.texture;
                    this.anchor.x = textures[0].defaultAnchor.x;
                    this.anchor.y = textures[0].defaultAnchor.y;
                } else {
                    super([PIXI.Texture.EMPTY]);
                }
                this.template = template;
                this.parent = container;
                this.blendMode = t.blendMode || PIXI.BLEND_MODES.NORMAL;
                if (t.playAnimationOnStart) {
                    this.play();
                }
                if (t.extends) {
                    ct.u.ext(this, t.extends);
                }
            } else {
                super([PIXI.Texture.EMPTY]);
            }
            // it is defined in main.js
            // eslint-disable-next-line no-undef
            this[copyTypeSymbol] = true;
            this.position.set(x || 0, y || 0);
            this.xprev = this.xstart = this.x;
            this.yprev = this.ystart = this.y;
            this[hspeedAccessor] = 0;
            this[vspeedAccessor] = 0;
            this[zeroDirectionAccessor] = 0;
            this.speed = this.direction = this.gravity = 0;
            this.gravityDir = 90;
            this.depth = 0;
            if (exts) {
                ct.u.ext(this, exts);
                if (exts.tx) {
                    this.scale.x = exts.tx;
                }
                if (exts.ty) {
                    this.scale.y = exts.ty;
                }
                if (exts.tr) {
                    this.angle = exts.tr;
                }
            }
            this.uid = ++uid;
            if (template) {
                ct.u.ext(this, {
                    template,
                    depth: t.depth,
                    onStep: t.onStep,
                    onDraw: t.onDraw,
                    onCreate: t.onCreate,
                    onDestroy: t.onDestroy,
                    shape: ct.res.getTextureShape(t.texture || -1)
                });
                if (exts && exts.depth !== void 0) {
                    this.depth = exts.depth;
                }
                if (ct.templates.list[template]) {
                    ct.templates.list[template].push(this);
                } else {
                    ct.templates.list[template] = [this];
                }
                this.onBeforeCreateModifier();
                ct.templates.templates[template].onCreate.apply(this);
            }
            return this;
        }

        /**
         * The name of the current copy's texture, or -1 for an empty texture.
         * @param {string} value The name of the new texture
         * @type {(string|number)}
         */
        set tex(value) {
            if (this[textureAccessor] === value) {
                return value;
            }
            var {playing} = this;
            this.textures = ct.res.getTexture(value);
            this[textureAccessor] = value;
            this.shape = ct.res.getTextureShape(value);
            this.anchor.x = this.textures[0].defaultAnchor.x;
            this.anchor.y = this.textures[0].defaultAnchor.y;
            if (playing) {
                this.play();
            }
            return value;
        }
        get tex() {
            return this[textureAccessor];
        }

        get speed() {
            return Math.hypot(this.hspeed, this.vspeed);
        }
        /**
         * The speed of a copy that is used in `this.move()` calls
         * @param {number} value The new speed value
         * @type {number}
         */
        set speed(value) {
            if (value === 0) {
                this[zeroDirectionAccessor] = this.direction;
                this.hspeed = this.vspeed = 0;
                return;
            }
            if (this.speed === 0) {
                const restoredDir = this[zeroDirectionAccessor];
                this[hspeedAccessor] = value * Math.cos(restoredDir * Math.PI / 180);
                this[vspeedAccessor] = value * Math.sin(restoredDir * Math.PI / 180);
                return;
            }
            var multiplier = value / this.speed;
            this.hspeed *= multiplier;
            this.vspeed *= multiplier;
        }
        get hspeed() {
            return this[hspeedAccessor];
        }
        set hspeed(value) {
            if (this.vspeed === 0 && value === 0) {
                this[zeroDirectionAccessor] = this.direction;
            }
            this[hspeedAccessor] = value;
            return value;
        }
        get vspeed() {
            return this[vspeedAccessor];
        }
        set vspeed(value) {
            if (this.hspeed === 0 && value === 0) {
                this[zeroDirectionAccessor] = this.direction;
            }
            this[vspeedAccessor] = value;
            return value;
        }
        get direction() {
            if (this.speed === 0) {
                return this[zeroDirectionAccessor];
            }
            return (Math.atan2(this.vspeed, this.hspeed) * 180 / Math.PI + 360) % 360;
        }
        /**
         * The moving direction of the copy, in degrees, starting with 0 at the right side
         * and going with 90 facing upwards, 180 facing left, 270 facing down.
         * This parameter is used by `this.move()` call.
         * @param {number} value New direction
         * @type {number}
         */
        set direction(value) {
            this[zeroDirectionAccessor] = value;
            if (this.speed > 0) {
                var speed = this.speed;
                this.hspeed = speed * Math.cos(value * Math.PI / 180);
                this.vspeed = speed * Math.sin(value * Math.PI / 180);
            }
            return value;
        }

        /**
         * Performs a movement step, reading such parameters as `gravity`, `speed`, `direction`.
         * @returns {void}
         */
        move() {
            if (this.gravity) {
                this.hspeed += this.gravity * ct.delta * Math.cos(this.gravityDir * Math.PI / 180);
                this.vspeed += this.gravity * ct.delta * Math.sin(this.gravityDir * Math.PI / 180);
            }
            this.x += this.hspeed * ct.delta;
            this.y += this.vspeed * ct.delta;
        }
        /**
         * Adds a speed vector to the copy, accelerating it by a given delta speed
         * in a given direction.
         * @param {number} spd Additive speed
         * @param {number} dir The direction in which to apply additional speed
         * @returns {void}
         */
        addSpeed(spd, dir) {
            this.hspeed += spd * Math.cos(dir * Math.PI / 180);
            this.vspeed += spd * Math.sin(dir * Math.PI / 180);
        }

        /**
         * Returns the room that owns the current copy
         * @returns {Room} The room that owns the current copy
         */
        getRoom() {
            let parent = this.parent;
            while (!(parent instanceof Room)) {
                parent = parent.parent;
            }
            return parent;
        }

        // eslint-disable-next-line class-methods-use-this
        onBeforeCreateModifier() {
            // Filled by ct.IDE and catmods
            
        }
    }
    return Copy;
})();

(function ctTemplateAddon(ct) {
    const onCreateModifier = function () {
        this.$chashes = ct.place.getHashes(this);
for (const hash of this.$chashes) {
    if (!(hash in ct.place.grid)) {
        ct.place.grid[hash] = [this];
    } else {
        ct.place.grid[hash].push(this);
    }
}
if ([false][0] && this instanceof ct.templates.Copy) {
    this.$cDebugText = new PIXI.Text('Not initialized', {
        fill: 0xffffff,
        dropShadow: true,
        dropShadowDistance: 2,
        fontSize: [][0] || 16
    });
    this.$cDebugCollision = new PIXI.Graphics();
    this.addChild(this.$cDebugCollision, this.$cDebugText);
}

    };

    /**
     * An object with properties and methods for manipulating templates and copies,
     * mainly for finding particular copies and creating new ones.
     * @namespace
     */
    ct.templates = {
        Copy,
        /**
         * An object that contains arrays of copies of all templates.
         * @type {Object.<string,Array<Copy>>}
         */
        list: {
            BACKGROUND: [],
            TILEMAP: []
        },
        /**
         * A map of all the templates of templates exported from ct.IDE.
         * @type {object}
         */
        templates: { },
        /**
         * Creates a new copy of a given template inside a specific room.
         * @param {string} template The name of the template to use
         * @param {number} [x] The x coordinate of a new copy. Defaults to 0.
         * @param {number} [y] The y coordinate of a new copy. Defaults to 0.
         * @param {Room} [room] The room to which add the copy.
         * Defaults to the current room.
         * @param {object} [exts] An optional object which parameters will be applied
         * to the copy prior to its OnCreate event.
         * @returns {Copy} the created copy.
         */
        copyIntoRoom(template, x = 0, y = 0, room, exts) {
            // An advanced constructor. Returns a Copy
            if (!room || !(room instanceof Room)) {
                throw new Error(`Attempt to spawn a copy of template ${template} inside an invalid room. Room's value provided: ${room}`);
            }
            const obj = new Copy(template, x, y, exts);
            room.addChild(obj);
            ct.stack.push(obj);
            onCreateModifier.apply(obj);
            return obj;
        },
        /**
         * Creates a new copy of a given template inside the current root room.
         * A shorthand for `ct.templates.copyIntoRoom(template, x, y, ct.room, exts)`
         * @param {string} template The name of the template to use
         * @param {number} [x] The x coordinate of a new copy. Defaults to 0.
         * @param {number} [y] The y coordinate of a new copy. Defaults to 0.
         * @param {object} [exts] An optional object which parameters will be applied
         * to the copy prior to its OnCreate event.
         * @returns {Copy} the created copy.
         */
        copy(template, x = 0, y = 0, exts) {
            return ct.templates.copyIntoRoom(template, x, y, ct.room, exts);
        },
        /**
         * Applies a function to each copy in the current room
         * @param {Function} func The function to apply
         * @returns {void}
         */
        each(func) {
            for (const copy of ct.stack) {
                if (!(copy instanceof Copy)) {
                    continue; // Skip backgrounds and tile layers
                }
                func.apply(copy, this);
            }
        },
        /**
         * Applies a function to a given object (e.g. to a copy)
         * @param {Copy} obj The copy to perform function upon.
         * @param {Function} function The function to be applied.
         */
        withCopy(obj, func) {
            func.apply(obj, this);
        },
        /**
         * Applies a function to every copy of the given template name
         * @param {string} template The name of the template to perform function upon.
         * @param {Function} function The function to be applied.
         */
        withTemplate(template, func) {
            for (const copy of ct.templates.list[template]) {
                func.apply(copy, this);
            }
        },
        /**
         * Checks whether there are any copies of this template's name.
         * Will throw an error if you pass an invalid template name.
         * @param {string} template The name of a template to check.
         * @returns {boolean} Returns `true` if at least one copy exists in a room;
         * `false` otherwise.
         */
        exists(template) {
            if (!(template in ct.templates.templates)) {
                throw new Error(`[ct.templates] ct.templates.exists: There is no such template ${template}.`);
            }
            return ct.templates.list[template].length > 0;
        },
        /*
         * Checks whether a given object exists in game's world.
         * Intended to be applied to copies, but may be used with other PIXI entities.
         * @param {Copy|PIXI.DisplayObject|any} obj The copy which existence needs to be checked.
         * @returns {boolean} Returns `true` if a copy exists; `false` otherwise.
         */
        valid(obj) {
            if (obj instanceof Copy) {
                return !obj.kill;
            }
            if (obj instanceof PIXI.DisplayObject) {
                return Boolean(obj.position);
            }
            return Boolean(obj);
        },
        /**
         * Checks whether a given object is a ct.js copy.
         * @param {any} obj The object which needs to be checked.
         * @returns {boolean} Returns `true` if the passed object is a copy; `false` otherwise.
         */
        isCopy(obj) {
            return obj instanceof Copy;
        }
    };

    
ct.templates.templates["Player_SpaceShip"] = {
    depth: 5,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "11",
    onStep: function () {
        /* Movement
   Add acceleration when arrows or WASD are being pressed
*/

this.hspeed += ct.actions.MoveX.value * this.flyspeed;
this.vspeed += ct.actions.MoveY.value * this.flyspeed;

// Limit speed, but allow for faster movement on slowmo effect
this.speed = Math.max(Math.min(this.speed, this.speed - this.friction, this.maxspeed / ct.pixiApp.ticker.speed), 0);
this.move();

// Check if the ship is out of the view
if (this.x < 0 || this.x > ct.camera.width ||
    this.y < 30 || this.y > ct.camera.height - 30) {
    // Return back if the ship is outside the room
    this.speed = 0;
    this.x = Math.max(Math.min(this.x, ct.camera.width), 0);
    this.y = Math.max(Math.min(this.y, ct.camera.height - 30), 30);
}

/* Shooting */

this.shootTimer += ct.deltaUi;

// If the spacebar is pressed and at least a quarter of second has passed,
// create a new laser bullet depending on a weapon template
if (ct.actions.Shoot.down) {
    if (this.weapon === 'simple' && this.shootTimer > 12) {
        // 2 weapons
        if(this.ship.weapons == 2) {
            ct.templates.copy('Laser_Simple_Blue', this.x-15, this.y);
            ct.templates.copy('Laser_Simple_Blue', this.x+15, this.y);
        } else {
            // 1 weapon
            ct.templates.copy('Laser_Simple_Blue', this.x, this.y);
        }

        // Reset shooting delay
        this.shootTimer = 0;
        ct.sound.spawn('Laser_Small');

        // ct.templates.copy('Laser_Simple_Blue', this.x + 75*this.shootSwitch, this.y);
        // this.shootSwitch *= -1;
        // ct.sound.spawn('Laser_Small');
        // // Reset shooting delay
        // this.shootTimer = 0;
    }
    if (this.weapon === 'spread' && this.shootTimer > 15) {
        // create three laser bolts
        ct.templates.copy('Laser_Simple_Blue', this.x-40, this.y);
        ct.templates.copy('Laser_Simple_Blue', this.x, this.y - 20);
        ct.templates.copy('Laser_Simple_Blue', this.x+40, this.y);
        ct.sound.spawn('Laser_Small');
        // Reset shooting delay
        this.shootTimer = 0;
    }
    if (this.weapon === 'bolt' && this.shootTimer > 40) {
        // slow, but powerful
        ct.templates.copy('Laser_Bolt_Blue', this.x, this.y);
        ct.sound.spawn('Laser_Medium');
        // Reset shooting delay
        this.shootTimer = 0;
    }
    if (this.weapon === 'cross' && this.shootTimer > 10) {
        // this one shoots much faster
        var bullet = ct.templates.copy('Laser_Cross_Blue', this.x, this.y);
        bullet.scale.x = this.shootSwitch;
        this.shootSwitch *= -1;
        ct.sound.spawn('Laser_Medium');
        // Reset shooting delay
        this.shootTimer = 0;
    }
}

/* Damage on collision */
var obstacle = ct.place.occupied(this, this.x, this.y, 'Enemy')
            || ct.place.occupied(this, this.x, this.y, 'EnemyBullet');
if (obstacle && this.invulnerable < 0) {
    if (obstacle.cgroup === 'Enemy') {
        this.lives -= 25;
    } else {
        this.lives -= 5;
    }
    obstacle.kill = true;

    // Are we completely, like, dead?
    if (this.lives < 0) {
        this.kill = true;
    } else {
        // Set invulnerability for one second
        this.invulnerable = ct.speed;
    }
}
// Deplete invulnerability
this.invulnerable -= ct.delta;
    },
    onDraw: function () {
        // If we are invulnerable, alternate between full and partial opacity each 10 frames
// `this.invulnerable % 10` means 'get a fraction remainder when dividing by 10'
// `statement? 0.5 : 1` means that we pick 0.5 if the statement is true, or 1 otherwise
if (this.invulnerable > 0) {
    var damaged = this.invulnerable % 10 > 5;
    this.tint = damaged? 0xFF6666 : 0xFFFFFF;
} else {
    this.alpha = 1;
}
    },
    onDestroy: function () {
        ct.emitters.fire('Explosion', this.x, this.y);

localStorage.score = ct.room.score;

ct.u.wait(2999)
.then(() => ct.rooms.switch('RetryScreen'));
    },
    onCreate: function () {
        this.ship = JSON.parse(localStorage.userShip);

this.scale.x = 0.5;
this.scale.y = 0.5;

const ship = JSON.parse(localStorage.userShip);
this.tex = `${ship.shipType}${ship.level}`;

// Set movement friction, acceleration and speed limit
this.friction = 0.25;
this.flyspeed = this.ship.speed;
this.maxspeed = 7.5;

// This will help us to shoot continuously
this.shootTimer = 0;

this.lives = 100;
this.invulnerable = -1;

this.weapon = 'simple';
this.shootSwitch = 1; // This will flip the animation of the spherical bullets, and the position of individual energy bolts

//ct.emitters.append(this, 'Shield');
ct.emitters.append(this, 'JetFlame', {
    position: {
        x: -25,
        y: 90
    }
});
ct.emitters.append(this, 'JetFlame', {
    position: {
        x: 25,
        y: 90
    }
});
    },
    extends: {}
};
ct.templates.list['Player_SpaceShip'] = [];
ct.templates.templates["Laser_Simple_Blue"] = {
    depth: -1,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Laser_Simple_Blue",
    onStep: function () {
        if (this.y < -48) {
    this.kill = true;
}

this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.speed = 20;
this.direction = -90;
this.angle = this.direction;
this.cgroup = 'BulletsHeroes';

const ship = JSON.parse(localStorage.userShip);

this.damage = parseInt(ship.attack / 2);
    },
    extends: {}
};
ct.templates.list['Laser_Simple_Blue'] = [];
ct.templates.templates["Asteroid"] = {
    depth: 1,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Chunk_01",
    onStep: function () {
        this.move();
this.angle -= this.rotateSpeed * ct.delta;

var obstacle = ct.place.occupied(this, this.x, this.y, 'BulletsHeroes');
if (!obstacle) {
    obstacle = ct.place.occupied(this, this.x, this.y, 'EnemyBullet');
}
if (obstacle) {
    if (obstacle) {
        calculateDamage(this, obstacle);
    }
    this.addSpeed(obstacle.speed * 0.1, obstacle.direction);
}

if (this.x < -200 ||
    this.x > ct.camera.width + 200 ||
    this.y < -200 ||
    this.y > ct.camera.height + 200
) {
    this.kill = true;
    this.skipOnDestroy = true;
}

// this.move();

// if (this.y > ct.camera.height + 80 || this.x < -80 || this.x > ct.camera.width + 80) {
//     this.kill = true;
//     console.log('- big');
// }

// this.angle -= this.rotateSpeed * ct.delta;

// var collided = ct.place.occupied(this, this.x, this.y, 'Asteroid');
// if(collided) {
//     this.kill = true;
//     const m1 = ct.templates.copy('AsteroidMed1', this.x+15, this.y+15);
//     m1.direction = this.direction - 45;
//     const m2 = ct.templates.copy('AsteroidMed2', this.x-15, this.y-15);
//     m2.direction = this.direction + 45;
// }
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        if (this.skipOnDestroy) {
    return;
}
ct.emitters.fire('ChunkBurst', this.x, this.y);
ct.room.score += 10;
    },
    onCreate: function () {
        // Randomize texture
this.tex = ct.random.dice('AsteroidBig1', 'AsteroidBig2', 'AsteroidBig3');

this.speed = ct.random.range(1, 3);
this.direction = 90 + ct.random.range(-3, 3);
this.rotateSpeed = ct.random.range(-1, 1);
this.angle = ct.random.deg();
this.scale.x = this.scale.y = ct.random.range(0.5, 1);

this.health = this.scale.x * 10;

this.cgroup = 'Enemy';
    },
    extends: {}
};
ct.templates.list['Asteroid'] = [];
ct.templates.templates["Laser_Cross_Blue"] = {
    depth: -1,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Laser_X_Blue",
    onStep: function () {
        if (this.y < -48) {
    this.kill = true;
}

this.phase += ct.delta * 0.1;
this.x = this.xstart + Math.sin(this.phase) * 75 * this.scale.x;
this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.vspeed = -10;
this.cgroup = 'BulletsHeroes';
this.phase = 0;
ct.emitters.follow(this, 'Electricity');

this.damage = 7.5;
    },
    extends: {}
};
ct.templates.list['Laser_Cross_Blue'] = [];
ct.templates.templates["GameController"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    
    onStep: function () {
        this.asteroidTimer -= ct.delta;
if (this.asteroidTimer <= 0) {
    this.asteroidTimer = ct.random.range(ct.speed * 0.5, ct.speed * 3);
    ct.templates.copy('AbstractMeteor', ct.random(ct.camera.width), -100);
}

this.encounterTimer -= ct.delta;
if (this.encounterTimer <= 0) {
    this.encounterTimer = ct.random.range(ct.speed * 4, ct.speed * 7);
    ct.templates.copy('Enemy_Shooter', ct.random(ct.camera.width), -100);
}

this.waveTimer -= ct.delta;
if (this.waveTimer <= 0) {
    this.waveTimer = ct.random.range(ct.speed * 20, ct.speed * 45);

    // create 5 enemies, one by one in 1.4 seconds
    ct.templates.copy('Enemy_Wiggler', 0, -100);
    ct.u.wait(350)
    .then(() => {
        ct.templates.copy('Enemy_Wiggler', 0, -100);
    })
    .then(() => ct.u.wait(350))
    .then(() => {
        ct.templates.copy('Enemy_Wiggler', 0, -100);
    })
    .then(() => ct.u.wait(350))
    .then(() => {
        ct.templates.copy('Enemy_Wiggler', 0, -100);
    })
    .then(() => ct.u.wait(350))
    .then(() => {
        ct.templates.copy('Enemy_Wiggler', 0, -100);
    });
}

this.ufoTimer -= ct.delta;
if (this.ufoTimer <= 0) {
    this.ufoTimer = ct.random.range(ct.speed * 60, ct.speed * 90);
    ct.templates.copy('Enemy_Ufo', ct.random(ct.camera.width), -100);
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.asteroidTimer = ct.speed * 3;
this.encounterTimer = ct.speed * 10;
this.waveTimer = ct.speed * 30;
this.ufoTimer = ct.speed * 75;
    },
    extends: {}
};
ct.templates.list['GameController'] = [];
ct.templates.templates["AbstractBonus"] = {
    depth: 3,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Bonus_Lives",
    onStep: function () {
        this.move();

var player = ct.place.meet(this, this.x, this.y, 'Player_SpaceShip');
if (player) {
    ct.sound.spawn('Bonus');
    if (this.tex === 'Bonus_Lives') {
        player.lives += 25;
        // Don't allow the health to overflow
        if (player.lives > 100) {
            player.lives = 100;
        }
    } else if (this.tex === 'Bonus_Slowmo') {
        ct.sound.spawn('SlowmoEffect');
        ct.tween.add({
            obj: ct.pixiApp.ticker,
            fields: {
                speed: 0.2
            },
            duration: 1000,
            useUiDelta: true
        })
        .then(() => ct.u.waitUi(5000))
        .then(() => ct.tween.add({
            obj: ct.pixiApp.ticker,
            fields: {
                speed: 1
            },
            duration: 1000,
            useUiDelta: true
        }));
    } else {
        var graphToWeaponMap = {
            'Bonus_Spread': 'spread',
            'Bonus_Bolt': 'bolt',
            'Bonus_Cross': 'cross'
        };
        player.weapon = graphToWeaponMap[this.tex];
    }
    // Consume bonus
    this.kill = true;
}

// Destroy bonus if it fell off the screen
if (this.y > ct.camera.height + 48) {
    this.kill = true;
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        // get the player
var player = ct.templates.list['Player_SpaceShip'][0];
if (player) {
    if (player.lives < 90) {
    // add a chance to spawn a life bonus if there is 2 or less lives
    this.tex = ct.random.dice('Bonus_Lives', 'Bonus_Spread', 'Bonus_Bolt', 'Bonus_Cross', 'Bonus_Slowmo');
    } else {
        this.tex = ct.random.dice('Bonus_Spread', 'Bonus_Bolt', 'Bonus_Cross', 'Bonus_Slowmo');
    }

    this.speed = 3;
    this.direction = 90;
    console.log(this.tex);
}

    },
    extends: {}
};
ct.templates.list['AbstractBonus'] = [];
ct.templates.templates["Enemy_Shooter"] = {
    depth: 2,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "1-2",
    onStep: function () {
        this.move();

this.shootTimer -= ct.delta;
if (this.shootTimer < 0) {
    ct.templates.copy('EnemyBullet', this.x, this.y);
    this.shootTimer = 3 * ct.speed;
}

var obstacle = ct.place.occupied(this, this.x, this.y, 'BulletsHeroes');
if (obstacle) {
    calculateDamage(this, obstacle);
}

if (this.y > ct.camera.height + 100) {
    this.kill = true;
    this.skipOnDestroy = true;
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        if (this.skipOnDestroy) {
    return;
}
ct.emitters.fire('Explosion', this.x, this.y);
ct.sound.spawn(ct.random.dice('Explosion_01', 'Explosion_02', 'Explosion_03'));

if (ct.random.chance(20)) {
    ct.templates.copy('AbstractBonus', this.x, this.y);
}

ct.room.score += 100;
    },
    onCreate: function () {
        // This mob will slowly move to the bottom of the screen, shooting projectiles
// from time to time

this.speed = 3;
this.direction = 90 + ct.random.range(-20, 20);
this.angle = this.direction + 90;
this.scale.x = -0.6;
this.scale.y = 0.6;

this.cgroup = 'Enemy';

this.shootTimer = 2 * ct.speed;
this.health = 20;

ct.emitters.append(this, 'JetFlame', {
    position: {
        x: 0,
        y: 75
    }
});
    },
    extends: {}
};
ct.templates.list['Enemy_Shooter'] = [];
ct.templates.templates["EnemyBullet"] = {
    depth: -1,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Laser_Red",
    onStep: function () {
        this.move();

// Destroy a bullet if it fell off the screen
if (this.y > ct.camera.height + 32) {
    this.kill = true;
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.speed = 10;
this.damage = 5;
this.direction = this.direction || 90;
this.angle = this.direction;
ct.sound.spawn('Laser_Big');
    },
    extends: {
    "cgroup": "EnemyBullet"
}
};
ct.templates.list['EnemyBullet'] = [];
ct.templates.templates["Enemy_Wiggler"] = {
    depth: 2,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "1-1",
    onStep: function () {
        this.phase += 1 / 60 * ct.delta;

this.y += 2 * ct.delta;
this.x = Math.sin(this.phase) * (ct.camera.width * 0.4) + ct.camera.width / 2;

this.shootTimer -= ct.delta;
if (this.shootTimer < 0 && ct.templates.list['Player_SpaceShip'].length) {
    const hero = ct.templates.list['Player_SpaceShip'][0];
    const bullet = ct.templates.copy('EnemyBullet', this.x, this.y);
    bullet.direction = bullet.angle = ct.u.pdn(this.x, this.y, hero.x, hero.y)
    this.shootTimer = 3 * ct.speed;
}

var obstacle = ct.place.occupied(this, this.x, this.y, 'BulletsHeroes');
if (obstacle) {
    calculateDamage(this, obstacle);
}

if (this.y > ct.camera.height + 100) {
    this.kill = true;
    this.skipOnDestroy = true;
}
    },
    onDraw: function () {
        this.angle = ct.u.pdn(this.xprev, this.yprev, this.x, this.y) + 90;
    },
    onDestroy: function () {
        if (this.skipOnDestroy) {
    return;
}

ct.emitters.fire('Explosion', this.x, this.y);
ct.sound.spawn(ct.random.dice('Explosion_01', 'Explosion_02', 'Explosion_03'));

if (ct.random.chance(10)) {
    ct.templates.copy('AbstractBonus', this.x, this.y);
}

ct.room.score += 75;
    },
    onCreate: function () {
        // This mob will move in a sine wave and emit projectiles randomly
this.phase = this.phase || 0;

this.cgroup = 'Enemy';
this.scale.x = 0.6;
this.scale.y = 0.6;

this.shootTimer = 2 * ct.speed;
ct.emitters.append(this, 'JetFlame', {
    position: {
        x: 0,
        y: 100
    }
});

this.health = 10;
    },
    extends: {}
};
ct.templates.list['Enemy_Wiggler'] = [];
ct.templates.templates["Laser_Bolt_Blue"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Laser_Bolt_Blue",
    onStep: function () {
        if (this.y < -48) {
    this.kill = true;
}

this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.speed = 25;
this.direction = 270;
this.cgroup = 'BulletsHeroes';
ct.emitters.follow(this, 'PowerBoltTrail');

this.damage = 20;
    },
    extends: {}
};
ct.templates.list['Laser_Bolt_Blue'] = [];
ct.templates.templates["Enemy_Bomber"] = {
    depth: 3,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "1-4",
    onStep: function () {
        this.jumpTimer -= ct.delta;
if (this.jumpTimer < 0) {
    // Start jumping to a new location
    this.jumpTimer = ct.speed * 2;
    this.targetx = ct.random.range(75, ct.camera.width - 75);
    this.targety = ct.random.range(75, 300);
    ct.tween.add({
        obj: this,
        fields: {
            x: this.targetx,
            y: this.targety
        },
        duration: 1500
    });

    var bullet1 = ct.templates.copy('Laser_Cross_Red', this.x, this.y);
    bullet1.direction = 90 - 30;
    var bullet2 = ct.templates.copy('Laser_Cross_Red', this.x, this.y);
    bullet2.direction = 90 + 30;
    var bullet3 = ct.templates.copy('Laser_Cross_Red', this.x, this.y);
    bullet3.direction = 90 - 60;
    var bullet4 = ct.templates.copy('Laser_Cross_Red', this.x, this.y);
    bullet4.direction = 90 + 60;
}

var obstacle = ct.place.occupied(this, this.x, this.y, 'BulletsHeroes');
if (obstacle) {
    calculateDamage(this, obstacle);
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        ct.emitters.fire('Explosion', this.x, this.y);
ct.sound.spawn(ct.random.dice('Explosion_01', 'Explosion_02', 'Explosion_03'));
ct.templates.copy('AbstractBonus', this.x, this.y);
    },
    onCreate: function () {
        this.targetx = ct.random.range(75, ct.camera.width - 150);
this.targety = ct.random.range(75, 300);
this.angle = -180;

this.scale.x = 0.9;
this.scale.y = 0.9;

ct.tween.add({
    obj: this,
    fields: {
        x: this.targetx,
        y: this.targety
    },
    duration: 1500
});

// this mob will be quite sturdy
this.health = 120;

this.jumpTimer = ct.speed * 2;
    },
    extends: {}
};
ct.templates.list['Enemy_Bomber'] = [];
ct.templates.templates["Laser_Cross_Red"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Laser_Cross_Red",
    onStep: function () {
        this.angle -= 4.5 * ct.delta;
this.move();

// Destroy a bullet if it fell off the screen
if (this.y > ct.camera.height + 32) {
    this.kill = true;
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.speed = 10;
this.damage = 5;
this.direction = ct.random.range(90-45, 90+45);

if (!this.noSound) {
    ct.sound.spawn('Laser_Big');
}

this.angle = ct.random.deg();
    },
    extends: {
    "cgroup": "EnemyBullet"
}
};
ct.templates.list['Laser_Cross_Red'] = [];
ct.templates.templates["OhNo"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "OhNo",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['OhNo'] = [];
ct.templates.templates["Joystick"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Joystick_Center",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        this.button.x = this.x;
this.button.y = this.y;
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.button = ct.vkeys.joystick({
    key: "Vjoy1",
    tex: "Joystick_Center",
    trackballTex: "Joystick_Move",
    x: () => this.x,
    y: () => this.y,
    depth: 1000,
});
this.visible = false;
    },
    extends: {}
};
ct.templates.list['Joystick'] = [];
ct.templates.templates["Button_Shoot"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Button_Shoot",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        this.button.x = this.x;
this.button.y = this.y;
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.button = ct.vkeys.button({
    key: "Vk1",
    texNormal: "Button_Shoot",
    texActive: "Button_Shoot",
    texHover: "Button_Shoot",
    x: () => this.x,
    y: () => this.y,
    depth: 1000
});
this.button.visible = false;
    },
    extends: {}
};
ct.templates.list['Button_Shoot'] = [];
ct.templates.templates["DatBoss"] = {
    depth: 3,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "1-5",
    onStep: function () {
        if (this.shootRandom || this.shootAtPlayer || this.shootStar) {
    this.shootTimer -= ct.delta;
    if (this.shootTimer <= 0) {
        if (this.shootRandom) {
            const bullet = ct.templates.copy('Laser_Cross_Red', this.x, this.y - 80);
            bullet.angle = ct.random.range(240, -60);
            this.shootTimer += 10;
        } else if (this.shootAtPlayer && ct.templates.list['Player_SpaceShip'].length) {
            this.shootTimer += 40;
            const bullet = ct.templates.copy('Laser_Cross_Red', this.x, this.y - 80);
            const player = ct.templates.list['Player_SpaceShip'][0];
            bullet.angle = ct.u.pdn(this.x, this.y, player.x, player.y);
        } else if (this.shootStar) {
            for (let i = 180; i < 360; i += 30) {
                const bullet = ct.templates.copy('Laser_Cross_Red', this.x, this.y - 80, {
                    noSound: true
                });
                bullet.angle = i;
            }
            ct.sound.spawn('Laser_Big');
            this.shootTimer += 10;
        }
    }
}

var obstacle = ct.place.occupied(this, this.x, this.y, 'BulletsHeroes');
if (obstacle) {
    calculateDamage(this, obstacle);
}

if (ct.room.pullPlayerIn && ct.templates.list['Player_SpaceShip'].length) {
    const player = ct.templates.list['Player_SpaceShip'][0];
    player.addSpeed(ct.delta * 0.9, ct.u.pdn(player.x, player.y, this.x, this.y));
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        ct.room.score += 10000;

ct.emitters.fire('Explosion_Boss', this.x, this.y);
ct.sound.spawn('Explosion_02');

ct.u.wait(1000 * 5)
.then(() => {
    ct.rooms.switch('VictoryScreen');
});
    },
    onCreate: function () {
        this.angle = -180;

this.health = 1500;
ct.templates.copy('Healthbar_Base_Boss', 0, 0, {}, ct.rooms.list['UI_Layer'][0]);

ct.sound.spawn('Music_BossTheme', {
    loop: true,
    volume: 0.6
});
ct.sound.stop('Music_MainTheme');

this.shootTimer = 0;

ct.emitters.append(this, 'JetFlame', {
    position: {
        x: -75,
        y: 150
    }
});
ct.emitters.append(this, 'JetFlame', {
    position: {
        x: 75,
        y: 150
    }
});


// This will define what the boss currently does
// stage 0: drive to the starting location
// stage 1: drive to the right/left edge and spawn bullets in all directions while sliding to the opposite edge, creating valleys of negative space
// stage 2: spawn two symmetrical waves of wigglers
// stage 3: start pulling everything into its path and shoot in random directions
// stage 4: float a bit to left and right and pew pew continuously at the player's ship
this.stage = 0;

this.stageSelector = () => new Promise(resolve => {
    // stage 0: drive to the starting location
    if (this.stage === 0) {
        return ct.tween.add({
            obj: this,
            fields: {
                x : ct.camera.width / 2,
                y: ct.camera.height * 0.15
            },
            duration: 3000
        }).then(() => {
            this.stage = ct.random.dice(1, 2, 3, 4);
        }).then(() => this.stageSelector());
    }
    // stage 1: drive to the right/left edge and spawn bullets in all directions while sliding to the opposite edge, creating valleys of negative space
    if (this.stage === 1) {
        const startLocationX = ct.random.dice(
            ct.camera.width * 0.2,
            ct.camera.width * 0.8
        ), endLocationX = ct.camera.width - startLocationX;
        return ct.tween.add({
            obj: this,
            fields: {
                x: startLocationX
            },
            duration: 1000
        })
        .then(() => {
            this.shootStar = true;
        })
        .then(() => ct.tween.add({
            obj: this,
            fields: {
                x: endLocationX
            },
            duration: 8000
        })).then(() => {
            this.shootStar = false;
            this.stage = 0;
            return this.stageSelector();
        });
    }
    // stage 2: spawn two symmetrical waves of wigglers
    // and wiggle by itself as well
    if (this.stage === 2) {
        spawnWigglers(0);
        spawnWigglers(Math.PI / 2);
        return ct.tween.add({
            obj: this,
            fields: {
                x: ct.camera.width * 0.4
            },
            duration: 2000
        }).then(() => ct.tween.add({
            obj: this,
            fields: {
                x: ct.camera.width * 0.6
            },
            duration: 2000
        }))
        .then(() => ct.tween.add({
            obj: this,
            fields: {
                x: ct.camera.width * 0.4
            },
            duration: 2000
        }))
        .then(() => ct.tween.add({
            obj: this,
            fields: {
                x: ct.camera.width * 0.5
            },
            duration: 1500
        }))
        .then(() => {
            this.stage = ct.random.dice(1, 3, 4);
        })
        .then(() => this.stageSelector());
    }
    // stage 3: start pulling everything into its path and shoot in random directions
    // for 10 seconds
    if (this.stage === 3) {
        ct.sound.spawn('BlackHole');
        ct.emitters.follow(this, 'BlackHole');
        ct.room.pullPlayerIn = true;
        this.shootRandom = true;
        return ct.u.wait(10*1000)
        .then(() => {
            ct.room.pullPlayerIn = false;
            this.shootRandom = false;
            this.stage = ct.random.dice(1, 2, 4);
            return this.stageSelector();
        });
    }

    // stage 4: float a bit to left and right and pew pew continuously at the player's ship
    // We will also eat a bit of player's space
    if (this.stage === 4) {
        this.shootAtPlayer = true;
        return ct.tween.add({
            obj: this,
            fields: {
                x: ct.camera.width * 0.25,
                y: ct.camera.height * 0.2
            },
            duration: 3000
        }).then(() => ct.tween.add({
            obj: this,
            fields: {
                x: ct.camera.width * 0.75,
                y: ct.camera.height * 0.25
            },
            duration: 3000
        }))
        .then(() => ct.tween.add({
            obj: this,
            fields: {
                x: ct.camera.width * 0.25,
                y: ct.camera.height * 0.3
            },
            duration: 3000
        }))
        .then(() => ct.tween.add({
            obj: this,
            fields: {
                x: ct.camera.width * 0.75,
                y: ct.camera.height * 0.35
            },
            duration: 3000
        }))
        .then(() => {
            this.stage = 0;
            this.shootAtPlayer = false;
        })
        .then(() => this.stageSelector());
    }
});

this.stageSelector();
    },
    extends: {}
};
ct.templates.list['DatBoss'] = [];
ct.templates.templates["Healthbar_Base_Player"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Healthbar_Base",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        if (ct.templates.list['Player_SpaceShip'].length) {
    const player = ct.templates.list['Player_SpaceShip'][0];
    // calculate the needed length
    const width = player.lives / 100 * (794 + 20);
    // blend current and target length
    this.healthBar.width = this.healthBar.width * 0.9 + width * 0.1;
} else {
    // shrink to nothing
    this.healthBar.width = this.healthBar.width * 0.9;
}
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.scale.y = 0.8;

this.healthBar = new PIXI.NineSlicePlane(
    ct.res.getTexture('Healthbar_Bar', 0),
    15, 15, 15, 15
);
/* this can be also written in one line */

/* where to place this bar */
this.healthBar.x = -397-10;
this.healthBar.y = -46-6;
/* Precise placing made with the aid of graphics editor */

const player = ct.templates.list['Player_SpaceShip'][0]
this.healthBar.height = 52;
this.healthBar.width = player.lives / 100 * (794 + 20); // Assuming that the max health is 100
this.addChild(this.healthBar);
    },
    extends: {}
};
ct.templates.list['Healthbar_Base_Player'] = [];
ct.templates.templates["Healthbar_Base_Boss"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Healthbar_Base",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        if (ct.templates.list['DatBoss'].length) {
    const boss = ct.templates.list['DatBoss'][0];
    // calculate the needed length
    const width = boss.health / 1500 * (794 + 20);
    // blend current and target length
    this.healthBar.width = width;
} else {
    // shrink to nothing
    this.healthBar.width = 0;
}
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.scale.y = -0.8;
this.healthBar = new PIXI.NineSlicePlane(
    ct.res.getTexture('Healthbar_BossBar', 0),
    15, 15, 15, 15
);

this.x = ct.camera.width / 2;
this.y = -100;
ct.tween.add({
    obj: this,
    fields: {
        y: 0
    },
    duration: 1000
});

/* this can be also written in one line */

/* where to place this bar */
this.healthBar.x = -397-10;
this.healthBar.y = -46-6;
/* Precise placing made with the aid of graphics editor */

const boss = ct.templates.list['DatBoss'][0]
this.healthBar.height = 52;
this.healthBar.width = boss.health / 1500 * (794 + 20); // Assuming that the max health is 3000
this.addChild(this.healthBar);
    },
    extends: {}
};
ct.templates.list['Healthbar_Base_Boss'] = [];
ct.templates.templates["Victory"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "win",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        this.phase += 2.5 / 60 * ct.delta;
if (this.phase > Math.PI * 2) {
    this.phase -= Math.PI * 2;
}

this.y = this.ystart + Math.sin(this.phase) * 8;
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        // The logo floats vertically. Let's use a sine function for that.
// We will need a variable to change its phase

this.phase = 0;
    },
    extends: {}
};
ct.templates.list['Victory'] = [];
ct.templates.templates["ConnectMetamask"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "ConnectMetamask",
    onStep: function () {
        if (ct.actions.Touch.pressed) {
    if (ct.mouse.hovers(this) || ct.touch.collide(this)) {
        this.tex = 'ConnectMetamaskHover';
        ct.web3.connect();
    }
}

if (ct.touch.enabled) {
    if (ct.touch.hovers(this)) {
        this.tex = 'ConnectMetamaskHover';
        ct.web3.connect();
    }
}


    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.depth = 5;
    },
    extends: {
    "cgroup": "Asteroid"
}
};
ct.templates.list['ConnectMetamask'] = [];
ct.templates.templates["ConnectMetamaskHover"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "ConnectMetamaskHover",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.depth = 5;
    },
    extends: {
    "cgroup": "Asteroid"
}
};
ct.templates.list['ConnectMetamaskHover'] = [];
ct.templates.templates["LogoSpaceRanger"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Logo",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.depth = 5;
    },
    extends: {}
};
ct.templates.list['LogoSpaceRanger'] = [];
ct.templates.templates["GameInfo"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "game-info",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.depth = 5;
    },
    extends: {}
};
ct.templates.list['GameInfo'] = [];
ct.templates.templates["AsteroidBig1"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "AsteroidBig1",
    onStep: function () {
        this.move();

if (this.y > ct.camera.height + 80 || this.x < -80 || this.x > ct.camera.width + 80) {
    this.kill = true;
    console.log('- big');
}

this.angle -= 0.1 * ct.delta;

var collided = ct.place.occupied(this, this.x, this.y, 'Asteroid');
if(collided) {
    this.kill = true;
    const m1 = ct.templates.copy('AsteroidMed1', this.x+15, this.y+15);
    m1.direction = this.direction - 45;
    const m2 = ct.templates.copy('AsteroidMed2', this.x-15, this.y-15);
    m2.direction = this.direction + 45;
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.depth = 1;

this.speed = ct.random.range(2, 4);
this.direction = ct.random.range(80 - 20, 80 + 30);
    },
    extends: {
    "cgroup": "Asteroid"
}
};
ct.templates.list['AsteroidBig1'] = [];
ct.templates.templates["AsteroidBig2"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "AsteroidBig2",
    onStep: function () {
        this.move();

if (this.y > ct.camera.height + 80 || this.x < -80 || this.x > ct.camera.width + 80) {
    this.kill = true;
    console.log('- big');
}

this.angle += 0.1 * ct.delta;

var collided = ct.place.occupied(this, this.x, this.y, 'Asteroid');
if(collided) {
    this.kill = true;
    const m1 = ct.templates.copy('AsteroidMed1', this.x+15, this.y+15);
    m1.direction = this.direction - 45;
    const m2 = ct.templates.copy('AsteroidMed2', this.x-15, this.y-15);
    m2.direction = this.direction + 45;
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.depth = 1;

this.speed = ct.random.range(2, 4);
this.direction = ct.random.range(80 - 20, 80 + 30);
    },
    extends: {
    "cgroup": "Asteroid"
}
};
ct.templates.list['AsteroidBig2'] = [];
ct.templates.templates["AsteroidBig3"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "AsteroidBig3",
    onStep: function () {
        this.move();

if (this.y > ct.camera.height + 80 || this.x < -80 || this.x > ct.camera.width + 80) {
    this.kill = true;
    console.log('- big');
}

this.angle -= 0.15 * ct.delta;

var collided = ct.place.occupied(this, this.x, this.y, 'Asteroid');
if(collided) {
    this.kill = true;
    const m1 = ct.templates.copy('AsteroidMed1', this.x+15, this.y+15);
    m1.direction = this.direction - 45;
    const m2 = ct.templates.copy('AsteroidMed2', this.x-15, this.y-15);
    m2.direction = this.direction + 45;
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.depth = 1;

this.speed = ct.random.range(2, 4);
this.direction = ct.random.range(80 - 20, 80 + 30);
    },
    extends: {
    "cgroup": "Asteroid"
}
};
ct.templates.list['AsteroidBig3'] = [];
ct.templates.templates["AsteroidMed1"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "AsteroidMed1",
    onStep: function () {
        this.move();

if (this.y > ct.camera.height + 80 || this.x < -80 || this.x > ct.camera.width + 80) {
    this.kill = true;
    console.log('- med');
}

this.angle += 0.5 * ct.delta;

var collided = ct.place.occupied(this, this.x, this.y, 'Asteroid');
if(collided) {
    this.kill = true;
    const st1 = ct.templates.copy('AsteroidSmall1', this.x+10, this.y+10);
    st1.direction = this.direction - 45;
    const st2 = ct.templates.copy('AsteroidSmall2', this.x-10, this.y-10);
    st2.direction = this.direction + 45;
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.depth = 1;
this.speed = 2;
    },
    extends: {
    "cgroup": "Asteroid"
}
};
ct.templates.list['AsteroidMed1'] = [];
ct.templates.templates["AsteroidMed2"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "AsteroidMed2",
    onStep: function () {
        this.move();

if (this.y > ct.camera.height + 80 || this.x < -80 || this.x > ct.camera.width + 80) {
    this.kill = true;
    console.log('- med');
}

this.angle -= 0.5 * ct.delta;

var collided = ct.place.occupied(this, this.x, this.y, 'Asteroid');
if(collided) {
    this.kill = true;
    const st1 = ct.templates.copy('AsteroidSmall1', this.x+10, this.y+10);
    st1.direction = this.direction - 45;
    const st2 = ct.templates.copy('AsteroidSmall2', this.x-10, this.y-10);
    st2.direction = this.direction + 45;
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.depth = 1;
this.speed = 2;
    },
    extends: {
    "cgroup": "Asteroid"
}
};
ct.templates.list['AsteroidMed2'] = [];
ct.templates.templates["AsteroidSmall1"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "AsteroidSmall1",
    onStep: function () {
        this.move();

this.angle += 0.6 * ct.delta;

if (this.y > ct.camera.height + 80 || this.x < -80 || this.x > ct.camera.width + 80) {
    this.kill = true;
    console.log('- sm');
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.depth = 0;
this.speed = ct.random.range(1, 2);
    },
    extends: {}
};
ct.templates.list['AsteroidSmall1'] = [];
ct.templates.templates["AsteroidSmall2"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "AsteroidSmall2",
    onStep: function () {
        this.move();

this.angle -= 0.6 * ct.delta;

if (this.y > ct.camera.height + 80 || this.x < -80 || this.x > ct.camera.width + 80) {
    this.kill = true;
    console.log('- sm');
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.depth = 0;
this.speed = ct.random.range(1, 2);
    },
    extends: {}
};
ct.templates.list['AsteroidSmall2'] = [];
ct.templates.templates["Planet1"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Planet1",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['Planet1'] = [];
ct.templates.templates["Planet2"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Planet2",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['Planet2'] = [];
ct.templates.templates["Planet3"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Planet3",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['Planet3'] = [];
ct.templates.templates["Planet4"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Planet4",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['Planet4'] = [];
ct.templates.templates["Planet5"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Planet5",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['Planet5'] = [];
ct.templates.templates["Planet6"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Planet6",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['Planet6'] = [];
ct.templates.templates["Planet7"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Planet7",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['Planet7'] = [];
ct.templates.templates["Planet8"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Planet8",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['Planet8'] = [];
ct.templates.templates["Planet9"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Planet9",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['Planet9'] = [];
ct.templates.templates["ShipCard1"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "ShipCard1",
    onStep: function () {
        if (ct.actions.Touch.pressed) {
    if (ct.mouse.hovers(this) || ct.touch.collide(this)) {
        ct.room.handleMint(1);
    }
}

if (ct.touch.enabled) {
    if (ct.touch.hovers(this)) {
        ct.room.handleMint(1);
    }
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['ShipCard1'] = [];
ct.templates.templates["ShipCard2"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "ShipCard2",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        if (ct.actions.Touch.pressed) {
    if (ct.mouse.hovers(this) || ct.touch.collide(this)) {
        ct.room.handleMint(2);
    }
}

if (ct.touch.enabled) {
    if (ct.touch.hovers(this)) {
        ct.room.handleMint(2);
    }
}
    },
    extends: {}
};
ct.templates.list['ShipCard2'] = [];
ct.templates.templates["ShipCard3"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "ShipCard3",
    onStep: function () {
        if (ct.actions.Touch.pressed) {
    if (ct.mouse.hovers(this) || ct.touch.collide(this)) {
        ct.room.handleMint(3);
    }
}

if (ct.touch.enabled) {
    if (ct.touch.hovers(this)) {
        ct.room.handleMint(3);
    }
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['ShipCard3'] = [];
ct.templates.templates["ShipCard4"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "ShipCard4",
    onStep: function () {
        if (ct.actions.Touch.pressed) {
    if (ct.mouse.hovers(this) || ct.touch.collide(this)) {
        ct.room.handleMint(4);
    }
}

if (ct.touch.enabled) {
    if (ct.touch.hovers(this)) {
        ct.room.handleMint(4);
    }
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['ShipCard4'] = [];
ct.templates.templates["ShipCard5"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "ShipCard5",
    onStep: function () {
        if (ct.actions.Touch.pressed) {
    if (ct.mouse.hovers(this) || ct.touch.collide(this)) {
        ct.room.handleMint(5);
    }
}

if (ct.touch.enabled) {
    if (ct.touch.hovers(this)) {
        ct.room.handleMint(5);
    }
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['ShipCard5'] = [];
ct.templates.templates["ButtonPlay"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Button",
    onStep: function () {
        if (ct.actions.Touch.pressed) {
    if (ct.mouse.hovers(this) || ct.touch.collide(this)) {
        ct.rooms.switch('InGame');
    }
}

if (ct.touch.enabled) {
    if (ct.touch.hovers(this)) {
        ct.rooms.switch('InGame');
    }
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.btnText = new PIXI.Text('PLAY', ct.styles.get('Button_Text'));
this.addChild(this.btnText);
this.btnText.x = 0;
this.btnText.y = 0;
this.btnText.anchor.x = 1.53;
this.btnText.anchor.y = 0.5;
    },
    extends: {}
};
ct.templates.list['ButtonPlay'] = [];
ct.templates.templates["EnemyPlanet"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "EnemyPlanet",
    onStep: function () {
        this.angle -= 0.02 * ct.delta;

this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['EnemyPlanet'] = [];
ct.templates.templates["ButtonLeaderboard"] = {
    depth: 1,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Button",
    onStep: function () {
        if (ct.actions.Touch.pressed) {
    if (ct.mouse.hovers(this) || ct.touch.collide(this)) {
        ct.rooms.switch('Leaderboard');
    }
}

if (ct.touch.enabled) {
    if (ct.touch.hovers(this)) {
        ct.rooms.switch('Leaderboard');
    }
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.btnText = new PIXI.Text('LEADERBOARD', ct.styles.get('Button_Text'));
this.addChild(this.btnText);
this.btnText.x = 0;
this.btnText.y = 0;
this.btnText.anchor.x = 0.52;
this.btnText.anchor.y = 0.5;
    },
    extends: {}
};
ct.templates.list['ButtonLeaderboard'] = [];
ct.templates.templates["ButtonShip"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Button",
    onStep: function () {
        if (ct.actions.Touch.pressed) {
    if (ct.mouse.hovers(this) || ct.touch.collide(this)) {
        ct.rooms.switch('');
    }
}

if (ct.touch.enabled) {
    if (ct.touch.hovers(this)) {
        ct.rooms.switch('');
    }
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.btnText = new PIXI.Text('MY SHIP', ct.styles.get('Button_Text'));
this.addChild(this.btnText);
this.btnText.x = 0;
this.btnText.y = 0;
this.btnText.anchor.x = 0.9;
this.btnText.anchor.y = 0.5;
    },
    extends: {}
};
ct.templates.list['ButtonShip'] = [];
ct.templates.templates["ButtonMyShip"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Button",
    onStep: function () {
        if (ct.actions.Touch.pressed) {
    if (ct.mouse.hovers(this) || ct.touch.collide(this)) {
        ct.rooms.switch('MyShip');
    }
}

if (ct.touch.enabled) {
    if (ct.touch.hovers(this)) {
        ct.rooms.switch('MyShip');
    }
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.btnText = new PIXI.Text('MY SHACESHIP', ct.styles.get('Button_Text'));
this.addChild(this.btnText);
this.btnText.x = 0;
this.btnText.y = 0;
this.btnText.anchor.x = 0.5;
this.btnText.anchor.y = 0.5;
    },
    extends: {}
};
ct.templates.list['ButtonMyShip'] = [];
ct.templates.templates["Energy"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Energy",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['Energy'] = [];
ct.templates.templates["TopPanel"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "TopPanel",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['TopPanel'] = [];
ct.templates.templates["AccountId"] = {
    depth: 2,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        this.accountLabel.text = ct.web3.userAddress.slice(0, 5) + '...' + ct.web3.userAddress.slice(38, 42);
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.userAccount = "";
this.accountLabel = new PIXI.Text(this.userAccount, ct.styles.get('White_H2_Left_Bold'));
this.addChild(this.accountLabel);
// this.accountLabel.x = 1;
// this.accountLabel.y = 0.5;

    },
    extends: {}
};
ct.templates.list['AccountId'] = [];
ct.templates.templates["UserCoins"] = {
    depth: 2,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        this.scoreLabel.text = this.score;
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        const loadBalance = async () => {
    const balance = await ct.web3.contract.userBalance(ct.web3.userAddress);
    this.score = parseInt(balance);
}


loadBalance();

this.score = 0;
this.scoreLabel = new PIXI.Text(this.score, ct.styles.get('White_H3_Right_Bold'));
this.addChild(this.scoreLabel);
// this.scoreLabel.x = ct.camera.width - 200;
// this.scoreLabel.y = 22;
// this.scoreLabel.depth = 10;


    },
    extends: {}
};
ct.templates.list['UserCoins'] = [];
ct.templates.templates["MainMenuText"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.authorsNotice = new PIXI.Text(`Aliens have built 6 layers of defenses around their 
base station in our galaxy. Your task is to destroy 
the defenses level by level so that our other ships can
come closer for a massive strike.`, ct.styles.get('White_H3_Left'));
this.addChild(this.authorsNotice);
// this.authorsNotice.x = 50;
// this.authorsNotice.y = ct.camera.height - 120;
// this.authorsNotice.anchor.y = 0.5;

    },
    extends: {}
};
ct.templates.list['MainMenuText'] = [];
ct.templates.templates["UserEnergy"] = {
    depth: 2,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        const ship = JSON.parse(localStorage.userShip);

this.energyLabel = new PIXI.Text(ship.currentEnergy, ct.styles.get('White_H3_Right_Bold'));
this.addChild(this.energyLabel);
    },
    extends: {}
};
ct.templates.list['UserEnergy'] = [];
ct.templates.templates["ButtonRetry"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Button",
    onStep: function () {
        if (ct.actions.Touch.pressed) {
    if (ct.mouse.hovers(this) || ct.touch.collide(this)) {
        ct.sound.stop('Music_BossTheme');
        ct.sound.stop('Music_MainTheme');
        ct.rooms.switch('InGame');
    }
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.btnText = new PIXI.Text('RETRY', ct.styles.get('Button_Text'));
this.addChild(this.btnText);
this.btnText.x = 0;
this.btnText.y = 0;
this.btnText.anchor.x = 0.5;
this.btnText.anchor.y = 0.5;
    },
    extends: {}
};
ct.templates.list['ButtonRetry'] = [];
ct.templates.templates["ButtonMainMenu"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "ButtonGray",
    onStep: function () {
        if (ct.actions.Touch.pressed) {
    if (ct.mouse.hovers(this) || ct.touch.collide(this)) {
        ct.rooms.switch('MainMenu');
    }
}

if (ct.touch.enabled) {
    if (ct.touch.hovers(this)) {
        ct.rooms.switch('MainMenu');
    }
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.btnText = new PIXI.Text('MAIN MENU', ct.styles.get('Button_Text'));
this.addChild(this.btnText);
this.btnText.x = 0;
this.btnText.y = 0;
this.btnText.anchor.x = 0.5;
this.btnText.anchor.y = 0.5;
    },
    extends: {}
};
ct.templates.list['ButtonMainMenu'] = [];
ct.templates.templates["11"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "11",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['11'] = [];
ct.templates.templates["12"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "12",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['12'] = [];
ct.templates.templates["13"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "13",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['13'] = [];
ct.templates.templates["21"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "21",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['21'] = [];
ct.templates.templates["22"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "22",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['22'] = [];
ct.templates.templates["23"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "23",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['23'] = [];
ct.templates.templates["31"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "31",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['31'] = [];
ct.templates.templates["32"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "32",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['32'] = [];
ct.templates.templates["33"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "33",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['33'] = [];
ct.templates.templates["41"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "41",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['41'] = [];
ct.templates.templates["42"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "42",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['42'] = [];
ct.templates.templates["43"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "43",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['43'] = [];
ct.templates.templates["51"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "51",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['51'] = [];
ct.templates.templates["52"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "52",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['52'] = [];
ct.templates.templates["53"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "53",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['53'] = [];
ct.templates.templates["LeaderboardTable"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "leaderboard-table",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['LeaderboardTable'] = [];
ct.templates.templates["Back"] = {
    depth: 1,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "back",
    onStep: function () {
        if (ct.actions.Touch.pressed) {
    if (ct.mouse.hovers(this) || ct.touch.collide(this)) {
        ct.rooms.switch('MainMenu');
    }
}

if (ct.touch.enabled) {
    if (ct.touch.hovers(this)) {
        ct.rooms.switch('MainMenu');
    }
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['Back'] = [];
ct.templates.templates["ShipInfo"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "ShipInfo",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['ShipInfo'] = [];
ct.templates.templates["Player_SpaceShip_UI"] = {
    depth: 5,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "11",
    onStep: function () {
        
    },
    onDraw: function () {
        // If we are invulnerable, alternate between full and partial opacity each 10 frames
// `this.invulnerable % 10` means 'get a fraction remainder when dividing by 10'
// `statement? 0.5 : 1` means that we pick 0.5 if the statement is true, or 1 otherwise
if (this.invulnerable > 0) {
    var damaged = this.invulnerable % 10 > 5;
    this.tint = damaged? 0xFF6666 : 0xFFFFFF;
} else {
    this.alpha = 1;
}
    },
    onDestroy: function () {
        ct.emitters.fire('Explosion', this.x, this.y);

localStorage.score = ct.room.score;

ct.u.wait(2999)
.then(() => ct.rooms.switch('RetryScreen'));
    },
    onCreate: function () {
        const ship = JSON.parse(localStorage.userShip);

this.tex = `${ship.shipType}${ship.level}`;
    },
    extends: {}
};
ct.templates.list['Player_SpaceShip_UI'] = [];
ct.templates.templates["LevelInfo"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        const ship = JSON.parse(localStorage.userShip);
console.log('ship', ship);

this.authorsNotice = new PIXI.Text(`Level #${ship.level}`, ct.styles.get('White_H3_Left'));
this.addChild(this.authorsNotice);

    },
    extends: {}
};
ct.templates.list['LevelInfo'] = [];
ct.templates.templates["ButtonUpdateLevel"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Button",
    onStep: function () {
        if (ct.actions.Touch.pressed) {
    if (ct.mouse.hovers(this) || ct.touch.collide(this)) {
        ct.rooms.switch('MyShip');
    }
}

if (ct.touch.enabled) {
    if (ct.touch.hovers(this)) {
        ct.rooms.switch('MyShip');
    }
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.btnText = new PIXI.Text('UPDATE LEVEL', ct.styles.get('Button_Text'));
this.addChild(this.btnText);
this.btnText.x = 0;
this.btnText.y = 0;
this.btnText.anchor.x = 0.5;
this.btnText.anchor.y = 0.5;
    },
    extends: {}
};
ct.templates.list['ButtonUpdateLevel'] = [];
ct.templates.templates["ButtonAddEnergy"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Button",
    onStep: function () {
        if (ct.actions.Touch.pressed) {
    if (ct.mouse.hovers(this) || ct.touch.collide(this)) {
        ct.rooms.switch('MyShip');
    }
}

if (ct.touch.enabled) {
    if (ct.touch.hovers(this)) {
        ct.rooms.switch('MyShip');
    }
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.btnText = new PIXI.Text('BUY ENERGY', ct.styles.get('Button_Text'));
this.addChild(this.btnText);
this.btnText.x = 0;
this.btnText.y = 0;
this.btnText.anchor.x = 0.5;
this.btnText.anchor.y = 0.5;
    },
    extends: {}
};
ct.templates.list['ButtonAddEnergy'] = [];
ct.templates.templates["EnergyInfo"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        const ship = JSON.parse(localStorage.userShip);

this.authorsNotice = new PIXI.Text(`Energy ${ship.currentEnergy}/${ship.maxEnergy}`, ct.styles.get('White_H4_Left'));
this.addChild(this.authorsNotice);

    },
    extends: {}
};
ct.templates.list['EnergyInfo'] = [];
ct.templates.templates["SaveShip"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Button",
    onStep: function () {
        if (ct.actions.Touch.pressed) {
    if (ct.mouse.hovers(this) || ct.touch.collide(this)) {
        ct.rooms.switch('');
    }
}

if (ct.touch.enabled) {
    if (ct.touch.hovers(this)) {
        ct.rooms.switch('');
    }
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.btnText = new PIXI.Text('SAVE', ct.styles.get('Button_Text'));
this.addChild(this.btnText);
this.btnText.x = 0;
this.btnText.y = 0;
this.btnText.anchor.x = 0.5;
this.btnText.anchor.y = 0.5;
    },
    extends: {}
};
ct.templates.list['SaveShip'] = [];
ct.templates.templates["CharacteristicsInfo"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        const ship = JSON.parse(localStorage.userShip);

this.authorsNotice = new PIXI.Text(`Health: ${ship.health}
Attack: ${ship.attack}
Speed: ${ship.speed}
Weapons: ${ship.weapons}
Max Energy: ${ship.maxEnergy}
`, ct.styles.get('White_H4_Left'));
this.addChild(this.authorsNotice);

    },
    extends: {}
};
ct.templates.list['CharacteristicsInfo'] = [];
ct.templates.templates["ShipName"] = {
    depth: 2,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    
    onStep: function () {
        
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        const ship = JSON.parse(localStorage.userShip);

const names = {
    "1": "Spectrum",
    "2": "Polaris",
    "3": "Valkyrie",
    "4": "Sparrow",
    "5": "Alto"
}

this.shipName = new PIXI.Text(names[ship.shipType], ct.styles.get('White_H2_Left_Bold'));
this.addChild(this.shipName);
this.shipName.anchor.y = 0.5;
this.shipName.anchor.x = 0.5;
    },
    extends: {}
};
ct.templates.list['ShipName'] = [];
ct.templates.templates["ButtonClaimCoins"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Button",
    onStep: function () {
        if (ct.actions.Touch.pressed) {
    if (ct.mouse.hovers(this) || ct.touch.collide(this)) {
        this.handleClaimScore();
    }
}
    },
    onDraw: function () {
        this.btnText.text = this.buttonText;
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.score = Number(localStorage.score);

this.buttonText = 'Claim Coins'
this.btnText = new PIXI.Text(this.buttonText, ct.styles.get('Button_Text'));
this.addChild(this.btnText);
this.btnText.x = 0;
this.btnText.y = 0;
this.btnText.anchor.x = 0.5;
this.btnText.anchor.y = 0.5;

this.handleClaimScore = async () => {
    if (this.alpha == 1) {
        this.alpha = 0.6;
        const tx = await ct.web3.contract.claimRewards(this.score);
        ct.web3.showNewTransaction(tx);

        tx.wait().then(()=>{
            this.buttonText = 'Claimed!';
            this.alpha = 0.9;
        });
    } else if(this.alpha == 0.9) {
        ct.rooms.switch('InGame');
        ct.sound.stop('Music_BossTheme');
        ct.sound.stop('Music_MainTheme');
    }
}
    },
    extends: {}
};
ct.templates.list['ButtonClaimCoins'] = [];
ct.templates.templates["Coin"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "coin",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['Coin'] = [];
ct.templates.templates["FullScreen"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "icons8-fullscreen-64",
    onStep: function () {
        
if (ct.actions.Touch.pressed) {
    if (ct.mouse.hovers(this) || ct.touch.collide(this)) {
        ct.fittoscreen.toggleFullscreen();
    }
}

if (ct.touch.enabled) {
    if (ct.touch.hovers(this)) {
        ct.fittoscreen.toggleFullscreen();
    }
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['FullScreen'] = [];
    (function vkeysTemplates() {
    ct.templates.templates.VKEY = {
        onStep: function () {
            var down = false,
                hover = false;
            if (ct.mouse) {
                if (ct.mouse.hoversUi(this)) {
                    hover = true;
                    if (ct.mouse.down) {
                        down = true;
                    }
                }
            }
            if (ct.touch) {
                for (const touch of ct.touch.events) {
                    if (ct.touch.collideUi(this, touch.id)) {
                        down = hover = true;
                        break;
                    }
                }
            }
            if (ct.pointer) {
                if (ct.pointer.hoversUi(this)) {
                    hover = true;
                    if (ct.pointer.collidesUi(this)) {
                        down = true;
                    }
                }
            }

            if (down) {
                this.tex = this.opts.texActive || this.opts.texNormal;
                ct.inputs.registry['vkeys.' + this.opts.key] = 1;
            } else {
                ct.inputs.registry['vkeys.' + this.opts.key] = 0;
                if (hover) {
                    this.tex = this.opts.texHover || this.opts.texNormal;
                } else {
                    this.tex = this.opts.texNormal;
                }
            }
        },
        onDraw: function () {
            this.x = (typeof this.opts.x === 'function') ? this.opts.x() : this.opts.x;
            this.y = (typeof this.opts.y === 'function') ? this.opts.y() : this.opts.y;
        },
        onDestroy: function () {
            void 0;
        },
        onCreate: function () {
            this.tex = this.opts.texNormal;
            this.depth = this.opts.depth;
        }
    };

    ct.templates.templates.VJOYSTICK = {
        onCreate: function () {
            this.tex = this.opts.tex;
            this.depth = this.opts.depth;
            this.down = false;
            this.trackball = new PIXI.Sprite(ct.res.getTexture(this.opts.trackballTex, 0));
            this.addChild(this.trackball);
        },
        // eslint-disable-next-line complexity
        onStep: function () {
            var dx = 0,
                dy = 0;
            if (ct.mouse) {
                if (ct.mouse.hoversUi(this)) {
                    if (ct.mouse.down) {
                        this.down = true;
                    }
                }
                if (ct.mouse.released) {
                    this.down = false;
                }
                if (this.down) {
                    dx = ct.mouse.xui - this.x;
                    dy = ct.mouse.yui - this.y;
                }
            }
            if (ct.touch) {
                if (!this.touchId) {
                    for (const touch of ct.touch.events) {
                        if (ct.touch.collideUi(this, touch.id)) {
                            this.down = true;
                            this.touchId = touch.id;
                            break;
                        }
                    }
                }
                var touch = ct.touch.getById(this.touchId);
                if (touch) {
                    dx = touch.xui - this.x;
                    dy = touch.yui - this.y;
                } else {
                    this.touchId = false;
                    this.down = false;
                }
            }
            if (ct.pointer) {
                if (this.trackedPointer && !ct.pointer.down.includes(this.trackedPointer)) {
                    this.trackedPointer = void 0;
                }
                if (!this.trackedPointer) {
                    const pointer = ct.pointer.collidesUi(this);
                    if (pointer) {
                        this.down = true;
                        this.trackedPointer = pointer;
                    }
                }
                if (this.trackedPointer) {
                    dx = this.trackedPointer.xui - this.x;
                    dy = this.trackedPointer.yui - this.y;
                } else {
                    this.touchId = false;
                    this.down = false;
                }
            }
            var r = this.shape.r || this.shape.right || 64;
            if (this.down) {
                dx /= r;
                dy /= r;
                var length = Math.hypot(dx, dy);
                if (length > 1) {
                    dx /= length;
                    dy /= length;
                }
                ct.inputs.registry['vkeys.' + this.opts.key + 'X'] = dx;
                ct.inputs.registry['vkeys.' + this.opts.key + 'Y'] = dy;
            } else {
                ct.inputs.registry['vkeys.' + this.opts.key + 'X'] = 0;
                ct.inputs.registry['vkeys.' + this.opts.key + 'Y'] = 0;
            }
            this.trackball.x = dx * r;
            this.trackball.y = dy * r;
        },
        onDraw: function () {
            this.x = (typeof this.opts.x === 'function') ? this.opts.x() : this.opts.x;
            this.y = (typeof this.opts.y === 'function') ? this.opts.y() : this.opts.y;
        },
        onDestroy: function () {
            void 0;
        }
    };
})();
/* eslint-disable max-lines-per-function */
(function ctTransitionTemplates() {
    const devourer = () => {
        void 0;
    };
    ct.templates.templates.CTTRANSITION_FADE = {
        onStep() {
            void 0;
        },
        onDraw() {
            void 0;
        },
        onDestroy() {
            ct.rooms.remove(this.room);
        },
        onCreate() {
            this.tex = -1;
            this.overlay = new PIXI.Graphics();
            this.overlay.beginFill(this.color);
            this.overlay.drawRect(0, 0, ct.camera.width + 1, ct.camera.height + 1);
            this.overlay.endFill();
            this.overlay.alpha = this.in ? 1 : 0;
            this.addChild(this.overlay);
            this.promise = ct.tween.add({
                obj: this.overlay,
                fields: {
                    alpha: this.in ? 0 : 1
                },
                duration: this.duration,
                silent: true
            }).then(() => {
                this.kill = true;
            });
        }
    };
    ct.templates.templates.CTTRANSITION_SCALE = {
        onStep() {
            void 0;
        },
        onDraw() {
            void 0;
        },
        onDestroy() {
            ct.rooms.remove(this.room);
        },
        onCreate() {
            this.tex = -1;
            this.overlay = new PIXI.Graphics();
            this.overlay.beginFill(this.color);
            this.overlay.drawRect(0, 0, ct.camera.width + 1, ct.camera.height + 1);
            this.overlay.endFill();
            this.overlay.alpha = this.in ? 1 : 0;
            this.addChild(this.overlay);
            var sourceX = ct.camera.scale.x,
                sourceY = ct.camera.scale.y,
                endX = this.in ? sourceX : sourceX * this.scaling,
                endY = this.in ? sourceY : sourceY * this.scaling,
                startX = this.in ? sourceX * this.scaling : sourceX,
                startY = this.in ? sourceY * this.scaling : sourceY;
            ct.camera.scale.x = startX;
            ct.camera.scale.y = startY;
            this.promise = ct.tween.add({
                obj: ct.camera.scale,
                fields: {
                    x: endX,
                    y: endY
                },
                duration: this.duration,
                silent: true
            }).then(() => {
                ct.camera.scale.x = sourceX;
                ct.camera.scale.y = sourceY;
                this.kill = true;
            });
            ct.tween.add({
                obj: this.overlay,
                fields: {
                    alpha: this.in ? 0 : 1
                },
                duration: this.duration,
                silent: true
            })
            .catch(devourer);
        }
    };
    ct.templates.templates.CTTRANSITION_SLIDE = {
        onStep() {
            void 0;
        },
        onDraw() {
            void 0;
        },
        onDestroy() {
            ct.rooms.remove(this.room);
        },
        onCreate() {
            this.tex = -1;
            this.overlay = new PIXI.Graphics();
            this.overlay.beginFill(this.color);
            this.overlay.drawRect(0, 0, (ct.camera.width + 1), (ct.camera.height + 1));
            this.overlay.endFill();

            if (this.endAt === 'left' || this.endAt === 'right') {
                this.scale.x = this.in ? 1 : 0;
                this.promise = ct.tween.add({
                    obj: this.scale,
                    fields: {
                        x: this.in ? 0 : 1
                    },
                    duration: this.duration,
                    curve: ct.tween.easeOutQuart,
                    silent: true
                }).then(() => {
                    this.kill = true;
                });
            } else {
                this.scale.y = this.in ? 1 : 0;
                this.promise = ct.tween.add({
                    obj: this.scale,
                    fields: {
                        y: this.in ? 0 : 1
                    },
                    duration: this.duration,
                    curve: ct.tween.easeOutQuart,
                    silent: true
                }).then(() => {
                    this.kill = true;
                });
            }
            if (!this.in && this.endAt === 'left') {
                this.x = (ct.camera.width + 1);
                ct.tween.add({
                    obj: this,
                    fields: {
                        x: 0
                    },
                    duration: this.duration,
                    curve: ct.tween.easeOutQuart,
                    silent: true
                })
                .catch(devourer);
            }
            if (!this.in && this.endAt === 'top') {
                this.y = (ct.camera.height + 1);
                ct.tween.add({
                    obj: this,
                    fields: {
                        y: 0
                    },
                    duration: this.duration,
                    curve: ct.tween.easeOutQuart,
                    silent: true
                })
                .catch(devourer);
            }
            if (this.in && this.endAt === 'right') {
                ct.tween.add({
                    obj: this,
                    fields: {
                        x: (ct.camera.width + 1)
                    },
                    duration: this.duration,
                    curve: ct.tween.easeOutQuart,
                    silent: true
                })
                .catch(devourer);
            }
            if (this.in && this.endAt === 'bottom') {
                ct.tween.add({
                    obj: this,
                    fields: {
                        y: (ct.camera.height + 1)
                    },
                    duration: this.duration,
                    curve: ct.tween.easeOutQuart,
                    silent: true
                })
                .catch(devourer);
            }

            this.addChild(this.overlay);
        }
    };

    ct.templates.templates.CTTRANSITION_CIRCLE = {
        onStep() {
            void 0;
        },
        onDraw() {
            void 0;
        },
        onDestroy() {
            ct.rooms.remove(this.room);
        },
        onCreate() {
            this.tex = -1;
            this.x = (ct.camera.width + 1) / 2;
            this.y = (ct.camera.height + 1) / 2;
            this.overlay = new PIXI.Graphics();
            this.overlay.beginFill(this.color);
            this.overlay.drawCircle(
                0,
                0,
                ct.u.pdc(0, 0, (ct.camera.width + 1) / 2, (ct.camera.height + 1) / 2)
            );
            this.overlay.endFill();
            this.addChild(this.overlay);
            this.scale.x = this.scale.y = this.in ? 0 : 1;
            this.promise = ct.tween.add({
                obj: this.scale,
                fields: {
                    x: this.in ? 1 : 0,
                    y: this.in ? 1 : 0
                },
                duration: this.duration,
                silent: true
            }).then(() => {
                this.kill = true;
            });
        }
    };
})();


    ct.templates.beforeStep = function beforeStep() {
        
    };
    ct.templates.afterStep = function afterStep() {
        
    };
    ct.templates.beforeDraw = function beforeDraw() {
        if ([false][0] && this instanceof ct.templates.Copy) {
    this.$cDebugText.scale.x = this.$cDebugCollision.scale.x = 1 / this.scale.x;
    this.$cDebugText.scale.y = this.$cDebugCollision.scale.y = 1 / this.scale.y;
    this.$cDebugText.angle = this.$cDebugCollision.angle = -this.angle;

    const newtext = `Partitions: ${this.$chashes.join(', ')}
CGroup: ${this.cgroup || 'unset'}
Shape: ${(this._shape && this._shape.__type) || 'unused'}`;
    if (this.$cDebugText.text !== newtext) {
        this.$cDebugText.text = newtext;
    }
    this.$cDebugCollision
    .clear();
    ct.place.drawDebugGraphic.apply(this);
    this.$cHadCollision = false;
}

    };
    ct.templates.afterDraw = function afterDraw() {
        /* eslint-disable no-underscore-dangle */
if ((this.transform && (this.transform._localID !== this.transform._currentLocalID)) ||
    this.x !== this.xprev ||
    this.y !== this.yprev
) {
    delete this._shape;
    const oldHashes = this.$chashes || [];
    this.$chashes = ct.place.getHashes(this);
    for (const hash of oldHashes) {
        if (this.$chashes.indexOf(hash) === -1) {
            ct.place.grid[hash].splice(ct.place.grid[hash].indexOf(this), 1);
        }
    }
    for (const hash of this.$chashes) {
        if (oldHashes.indexOf(hash) === -1) {
            if (!(hash in ct.place.grid)) {
                ct.place.grid[hash] = [this];
            } else {
                ct.place.grid[hash].push(this);
            }
        }
    }
}

    };
    ct.templates.onDestroy = function onDestroy() {
        if (this.$chashes) {
    for (const hash of this.$chashes) {
        ct.place.grid[hash].splice(ct.place.grid[hash].indexOf(this), 1);
    }
}

    };
})(ct);
/**
 * @extends {PIXI.TilingSprite}
 * @property {number} shiftX How much to shift the texture horizontally, in pixels.
 * @property {number} shiftY How much to shift the texture vertically, in pixels.
 * @property {number} movementX The speed at which the background's texture moves by X axis,
 * wrapping around its area. The value is measured in pixels per frame, and takes
 * `ct.delta` into account.
 * @property {number} movementY The speed at which the background's texture moves by Y axis,
 * wrapping around its area. The value is measured in pixels per frame, and takes
 * `ct.delta` into account.
 * @property {number} parallaxX A value that makes background move faster
 * or slower relative to other objects. It is often used to create an effect of depth.
 * `1` means regular movement, values smaller than 1
 * will make it move slower and make an effect that a background is placed farther away from camera;
 * values larger than 1 will do the opposite, making the background appear closer than the rest
 * of object.
 * This property is for horizontal movement.
 * @property {number} parallaxY A value that makes background move faster
 * or slower relative to other objects. It is often used to create an effect of depth.
 * `1` means regular movement, values smaller than 1
 * will make it move slower and make an effect that a background is placed farther away from camera;
 * values larger than 1 will do the opposite, making the background appear closer than the rest
 * of object.
 * This property is for vertical movement.
 * @class
 */
class Background extends PIXI.TilingSprite {
    constructor(texName, frame = 0, depth = 0, exts = {}) {
        var width = ct.camera.width,
            height = ct.camera.height;
        const texture = texName instanceof PIXI.Texture ?
            texName :
            ct.res.getTexture(texName, frame || 0);
        if (exts.repeat === 'no-repeat' || exts.repeat === 'repeat-x') {
            height = texture.height * (exts.scaleY || 1);
        }
        if (exts.repeat === 'no-repeat' || exts.repeat === 'repeat-y') {
            width = texture.width * (exts.scaleX || 1);
        }
        super(texture, width, height);
        if (!ct.backgrounds.list[texName]) {
            ct.backgrounds.list[texName] = [];
        }
        ct.backgrounds.list[texName].push(this);
        ct.templates.list.BACKGROUND.push(this);
        ct.stack.push(this);
        this.anchor.x = this.anchor.y = 0;
        this.depth = depth;
        this.shiftX = this.shiftY = this.movementX = this.movementY = 0;
        this.parallaxX = this.parallaxY = 1;
        if (exts) {
            ct.u.extend(this, exts);
        }
        if (this.scaleX) {
            this.tileScale.x = Number(this.scaleX);
        }
        if (this.scaleY) {
            this.tileScale.y = Number(this.scaleY);
        }
        this.reposition();
    }
    onStep() {
        this.shiftX += ct.delta * this.movementX;
        this.shiftY += ct.delta * this.movementY;
    }
    /**
     * Updates the position of this background.
     */
    reposition() {
        const cameraBounds = this.isUi ?
            {
                x: 0, y: 0, width: ct.camera.width, height: ct.camera.height
            } :
            ct.camera.getBoundingBox();
        if (this.repeat !== 'repeat-x' && this.repeat !== 'no-repeat') {
            this.y = cameraBounds.y;
            this.tilePosition.y = -this.y * this.parallaxY + this.shiftY;
            this.height = cameraBounds.height + 1;
        } else {
            this.y = this.shiftY + cameraBounds.y * (this.parallaxY - 1);
        }
        if (this.repeat !== 'repeat-y' && this.repeat !== 'no-repeat') {
            this.x = cameraBounds.x;
            this.tilePosition.x = -this.x * this.parallaxX + this.shiftX;
            this.width = cameraBounds.width + 1;
        } else {
            this.x = this.shiftX + cameraBounds.x * (this.parallaxX - 1);
        }
    }
    onDraw() {
        this.reposition();
    }
    static onCreate() {
        void 0;
    }
    static onDestroy() {
        void 0;
    }
    get isUi() {
        return this.parent ? Boolean(this.parent.isUi) : false;
    }
}
/**
 * @namespace
 */
ct.backgrounds = {
    Background,
    list: {},
    /**
     * @returns {Background} The created background
     */
    add(texName, frame = 0, depth = 0, container = ct.room) {
        if (!texName) {
            throw new Error('[ct.backgrounds] The texName argument is required.');
        }
        const bg = new Background(texName, frame, depth);
        container.addChild(bg);
        return bg;
    }
};
ct.templates.Background = Background;

/**
 * @extends {PIXI.Container}
 * @class
 */
class Tilemap extends PIXI.Container {
    /**
     * @param {object} template A template object that contains data about depth
     * and tile placement. It is usually used by ct.IDE.
     */
    constructor(template) {
        super();
        this.pixiTiles = [];
        if (template) {
            this.depth = template.depth;
            this.tiles = template.tiles.map(tile => ({
                ...tile
            }));
            if (template.extends) {
                Object.assign(this, template.extends);
            }
            for (let i = 0, l = template.tiles.length; i < l; i++) {
                const textures = ct.res.getTexture(template.tiles[i].texture);
                const sprite = new PIXI.Sprite(textures[template.tiles[i].frame]);
                sprite.anchor.x = sprite.anchor.y = 0;
                sprite.shape = textures.shape;
                this.addChild(sprite);
                this.pixiTiles.push(sprite);
                this.tiles[i].sprite = sprite;
                sprite.x = template.tiles[i].x;
                sprite.y = template.tiles[i].y;
            }
        } else {
            this.tiles = [];
        }
        ct.templates.list.TILEMAP.push(this);
    }
    /**
     * Adds a tile to the tilemap. Will throw an error if a tilemap is cached.
     * @param {string} textureName The name of the texture to use
     * @param {number} x The horizontal location of the tile
     * @param {number} y The vertical location of the tile
     * @param {number} [frame] The frame to pick from the source texture. Defaults to 0.
     * @returns {PIXI.Sprite} The created tile
     */
    addTile(textureName, x, y, frame = 0) {
        if (this.cached) {
            throw new Error('[ct.tiles] Adding tiles to cached tilemaps is forbidden. Create a new tilemap, or add tiles before caching the tilemap.');
        }
        const texture = ct.res.getTexture(textureName, frame);
        const sprite = new PIXI.Sprite(texture);
        sprite.x = x;
        sprite.y = y;
        sprite.shape = texture.shape;
        this.tiles.push({
            texture: textureName,
            frame,
            x,
            y,
            width: sprite.width,
            height: sprite.height,
            sprite
        });
        this.addChild(sprite);
        this.pixiTiles.push(sprite);
        return sprite;
    }
    /**
     * Enables caching on this tileset, freezing it and turning it
     * into a series of bitmap textures. This proides great speed boost,
     * but prevents further editing.
     */
    cache(chunkSize = 1024) {
        if (this.cached) {
            throw new Error('[ct.tiles] Attempt to cache an already cached tilemap.');
        }

        // Divide tiles into a grid of larger cells so that we can cache these cells as
        const bounds = this.getLocalBounds();
        const cols = Math.ceil(bounds.width / chunkSize),
              rows = Math.ceil(bounds.height / chunkSize);
        this.cells = [];
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const cell = new PIXI.Container();
                this.cells.push(cell);
            }
        }
        for (let i = 0, l = this.tiles.length; i < l; i++) {
            const tile = this.children[0],
                  x = Math.floor((tile.x - bounds.x) / chunkSize),
                  y = Math.floor((tile.y - bounds.y) / chunkSize);
            this.cells[y * cols + x].addChild(tile);
        }
        this.removeChildren();

        // Filter out empty cells, cache filled ones
        for (let i = 0, l = this.cells.length; i < l; i++) {
            if (this.cells[i].children.length === 0) {
                this.cells.splice(i, 1);
                i--;
                l--;
                continue;
            }
            this.addChild(this.cells[i]);
            this.cells[i].cacheAsBitmap = true;
        }

        this.cached = true;
    }
    /**
     * Enables caching on this tileset, freezing it and turning it
     * into a series of bitmap textures. This proides great speed boost,
     * but prevents further editing.
     *
     * This version packs tiles into rhombus-shaped chunks, and sorts them
     * from top to bottom. This fixes seam issues for isometric games.
     */
    cacheDiamond(chunkSize = 1024) {
        if (this.cached) {
            throw new Error('[ct.tiles] Attempt to cache an already cached tilemap.');
        }

        this.cells = [];
        this.diamondCellMap = {};
        for (let i = 0, l = this.tiles.length; i < l; i++) {
            const tile = this.children[0];
            const [xNormalized, yNormalized] = ct.u.rotate(tile.x, tile.y * 2, -45);
            const x = Math.floor(xNormalized / chunkSize),
                  y = Math.floor(yNormalized / chunkSize),
                  key = `${x}:${y}`;
            if (!(key in this.diamondCellMap)) {
                const chunk = new PIXI.Container();
                chunk.chunkX = x;
                chunk.chunkY = y;
                this.diamondCellMap[key] = chunk;
                this.cells.push(chunk);
            }
            this.diamondCellMap[key].addChild(tile);
        }
        this.removeChildren();

        this.cells.sort((a, b) => {
            const maxA = Math.max(a.chunkY, a.chunkX),
                  maxB = Math.max(b.chunkY, b.chunkX);
            if (maxA === maxB) {
                return b.chunkX - a.chunkX;
            }
            return maxA - maxB;
        });

        for (let i = 0, l = this.cells.length; i < l; i++) {
            this.addChild(this.cells[i]);
            this.cells[i].cacheAsBitmap = true;
        }

        this.cached = true;
    }
}
ct.templates.Tilemap = Tilemap;

/**
 * @namespace
 */
ct.tilemaps = {
    /**
     * Creates a new tilemap at a specified depth, and adds it to the main room (ct.room).
     * @param {number} [depth] The depth of a newly created tilemap. Defaults to 0.
     * @returns {Tilemap} The created tilemap.
     */
    create(depth = 0) {
        const tilemap = new Tilemap();
        tilemap.depth = depth;
        ct.room.addChild(tilemap);
        return tilemap;
    },
    /**
     * Adds a tile to the specified tilemap. It is the same as
     * calling `tilemap.addTile(textureName, x, y, frame).
     * @param {Tilemap} tilemap The tilemap to modify.
     * @param {string} textureName The name of the texture to use.
     * @param {number} x The horizontal location of the tile.
     * @param {number} y The vertical location of the tile.
     * @param {number} [frame] The frame to pick from the source texture. Defaults to 0.
     * @returns {PIXI.Sprite} The created tile
     */
    addTile(tilemap, textureName, x, y, frame = 0) {
        return tilemap.addTile(textureName, x, y, frame);
    },
    /**
     * Enables caching on this tileset, freezing it and turning it
     * into a series of bitmap textures. This proides great speed boost,
     * but prevents further editing.
     *
     * This is the same as calling `tilemap.cache();`
     *
     * @param {Tilemap} tilemap The tilemap which needs to be cached.
     * @param {number} chunkSize The size of one chunk.
     */
    cache(tilemap, chunkSize) {
        tilemap.cache(chunkSize);
    },
    /**
     * Enables caching on this tileset, freezing it and turning it
     * into a series of bitmap textures. This proides great speed boost,
     * but prevents further editing.
     *
     * This version packs tiles into rhombus-shaped chunks, and sorts them
     * from top to bottom. This fixes seam issues for isometric games.
     * Note that tiles should be placed on a flat plane for the proper sorting.
     * If you need an effect of elevation, consider shifting each tile with
     * tile.pivot.y property.
     *
     * This is the same as calling `tilemap.cacheDiamond();`
     *
     * @param {Tilemap} tilemap The tilemap which needs to be cached.
     * @param {number} chunkSize The size of one chunk.
     */
    cacheDiamond(tilemap, chunkSize) {
        tilemap.cacheDiamond(chunkSize);
    }
};

/**
 * This class represents a camera that is used by ct.js' cameras.
 * Usually you won't create new instances of it, but if you need, you can substitute
 * ct.camera with a new one.
 *
 * @extends {PIXI.DisplayObject}
 * @class
 *
 * @property {number} x The real x-coordinate of the camera.
 * It does not have a screen shake effect applied, as well as may differ from `targetX`
 * if the camera is in transition.
 * @property {number} y The real y-coordinate of the camera.
 * It does not have a screen shake effect applied, as well as may differ from `targetY`
 * if the camera is in transition.
 * @property {number} width The width of the unscaled shown region.
 * This is the base, unscaled value. Use ct.camera.scale.x to get a scaled version.
 * To change this value, see `ct.width` property.
 * @property {number} height The width of the unscaled shown region.
 * This is the base, unscaled value. Use ct.camera.scale.y to get a scaled version.
 * To change this value, see `ct.height` property.
 * @property {number} targetX The x-coordinate of the target location.
 * Moving it instead of just using the `x` parameter will trigger the drift effect.
 * @property {number} targetY The y-coordinate of the target location.
 * Moving it instead of just using the `y` parameter will trigger the drift effect.
 *
 * @property {Copy|false} follow If set, the camera will follow the given copy.
 * @property {boolean} followX Works if `follow` is set to a copy.
 * Enables following in X axis. Set it to `false` and followY to `true`
 * to limit automatic camera movement to vertical axis.
 * @property {boolean} followY Works if `follow` is set to a copy.
 * Enables following in Y axis. Set it to `false` and followX to `true`
 * to limit automatic camera movement to horizontal axis.
 * @property {number|null} borderX Works if `follow` is set to a copy.
 * Sets the frame inside which the copy will be kept, in game pixels.
 * Can be set to `null` so the copy is set to the center of the screen.
 * @property {number|null} borderY Works if `follow` is set to a copy.
 * Sets the frame inside which the copy will be kept, in game pixels.
 * Can be set to `null` so the copy is set to the center of the screen.
 * @property {number} shiftX Displaces the camera horizontally
 * but does not change x and y parameters.
 * @property {number} shiftY Displaces the camera vertically
 * but does not change x and y parameters.
 * @property {number} drift Works if `follow` is set to a copy.
 * If set to a value between 0 and 1, it will make camera movement smoother
 *
 * @property {number} shake The current power of a screen shake effect,
 * relative to the screen's max side (100 is 100% of screen shake).
 * If set to 0 or less, it, disables the effect.
 * @property {number} shakePhase The current phase of screen shake oscillation.
 * @property {number} shakeDecay The amount of `shake` units substracted in a second.
 * Default is 5.
 * @property {number} shakeFrequency The base frequency of the screen shake effect.
 * Default is 50.
 * @property {number} shakeX A multiplier applied to the horizontal screen shake effect.
 * Default is 1.
 * @property {number} shakeY A multiplier applied to the vertical screen shake effect.
 * Default is 1.
 * @property {number} shakeMax The maximum possible value for the `shake` property
 * to protect players from losing their monitor, in `shake` units. Default is 10.
 */
const Camera = (function Camera() {
    const shakeCamera = function shakeCamera(camera, delta) {
        const sec = delta / (PIXI.Ticker.shared.maxFPS || 60);
        camera.shake -= sec * camera.shakeDecay;
        camera.shake = Math.max(0, camera.shake);
        if (camera.shakeMax) {
            camera.shake = Math.min(camera.shake, camera.shakeMax);
        }
        const phaseDelta = sec * camera.shakeFrequency;
        camera.shakePhase += phaseDelta;
        // no logic in these constants
        // They are used to desync fluctuations and remove repetitive circular movements
        camera.shakePhaseX += phaseDelta * (1 + Math.sin(camera.shakePhase * 0.1489) * 0.25);
        camera.shakePhaseY += phaseDelta * (1 + Math.sin(camera.shakePhase * 0.1734) * 0.25);
    };
    const followCamera = function followCamera(camera) {
        // eslint-disable-next-line max-len
        const bx = camera.borderX === null ? camera.width / 2 : Math.min(camera.borderX, camera.width / 2),
              // eslint-disable-next-line max-len
              by = camera.borderY === null ? camera.height / 2 : Math.min(camera.borderY, camera.height / 2);
        const tl = camera.uiToGameCoord(bx, by),
              br = camera.uiToGameCoord(camera.width - bx, camera.height - by);

        if (camera.followX) {
            if (camera.follow.x < tl.x - camera.interpolatedShiftX) {
                camera.targetX = camera.follow.x - bx + camera.width / 2;
            } else if (camera.follow.x > br.x - camera.interpolatedShiftX) {
                camera.targetX = camera.follow.x + bx - camera.width / 2;
            }
        }
        if (camera.followY) {
            if (camera.follow.y < tl.y - camera.interpolatedShiftY) {
                camera.targetY = camera.follow.y - by + camera.height / 2;
            } else if (camera.follow.y > br.y - camera.interpolatedShiftY) {
                camera.targetY = camera.follow.y + by - camera.height / 2;
            }
        }
    };
    const restrictInRect = function restrictInRect(camera) {
        if (camera.minX !== void 0) {
            const boundary = camera.minX + camera.width * camera.scale.x * 0.5;
            camera.x = Math.max(boundary, camera.x);
            camera.targetX = Math.max(boundary, camera.targetX);
        }
        if (camera.maxX !== void 0) {
            const boundary = camera.maxX - camera.width * camera.scale.x * 0.5;
            camera.x = Math.min(boundary, camera.x);
            camera.targetX = Math.min(boundary, camera.targetX);
        }
        if (camera.minY !== void 0) {
            const boundary = camera.minY + camera.height * camera.scale.y * 0.5;
            camera.y = Math.max(boundary, camera.y);
            camera.targetY = Math.max(boundary, camera.targetY);
        }
        if (camera.maxY !== void 0) {
            const boundary = camera.maxY - camera.height * camera.scale.y * 0.5;
            camera.y = Math.min(boundary, camera.y);
            camera.targetY = Math.min(boundary, camera.targetY);
        }
    };
    class Camera extends PIXI.DisplayObject {
        constructor(x, y, w, h) {
            super();
            this.follow = this.rotate = false;
            this.followX = this.followY = true;
            this.targetX = this.x = x;
            this.targetY = this.y = y;
            this.z = 500;
            this.width = w || 1920;
            this.height = h || 1080;
            this.shiftX = this.shiftY = this.interpolatedShiftX = this.interpolatedShiftY = 0;
            this.borderX = this.borderY = null;
            this.drift = 0;

            this.shake = 0;
            this.shakeDecay = 5;
            this.shakeX = this.shakeY = 1;
            this.shakeFrequency = 50;
            this.shakePhase = this.shakePhaseX = this.shakePhaseY = 0;
            this.shakeMax = 10;

            this.getBounds = this.getBoundingBox;
        }

        get scale() {
            return this.transform.scale;
        }
        set scale(value) {
            if (typeof value === 'number') {
                value = {
                    x: value,
                    y: value
                };
            }
            this.transform.scale.copyFrom(value);
        }

        /**
         * Moves the camera to a new position. It will have a smooth transition
         * if a `drift` parameter is set.
         * @param {number} x New x coordinate
         * @param {number} y New y coordinate
         * @returns {void}
         */
        moveTo(x, y) {
            this.targetX = x;
            this.targetY = y;
        }

        /**
         * Moves the camera to a new position. Ignores the `drift` value.
         * @param {number} x New x coordinate
         * @param {number} y New y coordinate
         * @returns {void}
         */
        teleportTo(x, y) {
            this.targetX = this.x = x;
            this.targetY = this.y = y;
            this.shakePhase = this.shakePhaseX = this.shakePhaseY = 0;
            this.interpolatedShiftX = this.shiftX;
            this.interpolatedShiftY = this.shiftY;
        }

        /**
         * Updates the position of the camera
         * @param {number} delta A delta value between the last two frames.
         * This is usually ct.delta.
         * @returns {void}
         */
        update(delta) {
            shakeCamera(this, delta);
            // Check if we've been following a copy that is now killed
            if (this.follow && this.follow.kill) {
                this.follow = false;
            }
            // Follow copies around
            if (this.follow && ('x' in this.follow) && ('y' in this.follow)) {
                followCamera(this);
            }

            // The speed of drift movement
            const speed = this.drift ? Math.min(1, (1 - this.drift) * delta) : 1;
            // Perform drift motion
            this.x = this.targetX * speed + this.x * (1 - speed);
            this.y = this.targetY * speed + this.y * (1 - speed);

            // Off-center shifts drift, too
            this.interpolatedShiftX = this.shiftX * speed + this.interpolatedShiftX * (1 - speed);
            this.interpolatedShiftY = this.shiftY * speed + this.interpolatedShiftY * (1 - speed);

            restrictInRect(this);

            // Recover from possible calculation errors
            this.x = this.x || 0;
            this.y = this.y || 0;
        }

        /**
         * Returns the current camera position plus the screen shake effect.
         * @type {number}
         */
        get computedX() {
            // eslint-disable-next-line max-len
            const dx = (Math.sin(this.shakePhaseX) + Math.sin(this.shakePhaseX * 3.1846) * 0.25) / 1.25;
            // eslint-disable-next-line max-len
            const x = this.x + dx * this.shake * Math.max(this.width, this.height) / 100 * this.shakeX;
            return x + this.interpolatedShiftX;
        }
        /**
         * Returns the current camera position plus the screen shake effect.
         * @type {number}
         */
        get computedY() {
            // eslint-disable-next-line max-len
            const dy = (Math.sin(this.shakePhaseY) + Math.sin(this.shakePhaseY * 2.8948) * 0.25) / 1.25;
            // eslint-disable-next-line max-len
            const y = this.y + dy * this.shake * Math.max(this.width, this.height) / 100 * this.shakeY;
            return y + this.interpolatedShiftY;
        }

        /**
         * Returns the position of the left edge where the visible rectangle ends,
         * in game coordinates.
         * This can be used for UI positioning in game coordinates.
         * This does not count for rotations, though.
         * For rotated and/or scaled viewports, see `getTopLeftCorner`
         * and `getBottomLeftCorner` methods.
         * @returns {number} The location of the left edge.
         * @type {number}
         * @readonly
         */
        get left() {
            return this.computedX - (this.width / 2) * this.scale.x;
        }
        /**
         * Returns the position of the top edge where the visible rectangle ends,
         * in game coordinates.
         * This can be used for UI positioning in game coordinates.
         * This does not count for rotations, though.
         * For rotated and/or scaled viewports, see `getTopLeftCorner`
         * and `getTopRightCorner` methods.
         * @returns {number} The location of the top edge.
         * @type {number}
         * @readonly
         */
        get top() {
            return this.computedY - (this.height / 2) * this.scale.y;
        }
        /**
         * Returns the position of the right edge where the visible rectangle ends,
         * in game coordinates.
         * This can be used for UI positioning in game coordinates.
         * This does not count for rotations, though.
         * For rotated and/or scaled viewports, see `getTopRightCorner`
         * and `getBottomRightCorner` methods.
         * @returns {number} The location of the right edge.
         * @type {number}
         * @readonly
         */
        get right() {
            return this.computedX + (this.width / 2) * this.scale.x;
        }
        /**
         * Returns the position of the bottom edge where the visible rectangle ends,
         * in game coordinates. This can be used for UI positioning in game coordinates.
         * This does not count for rotations, though.
         * For rotated and/or scaled viewports, see `getBottomLeftCorner`
         * and `getBottomRightCorner` methods.
         * @returns {number} The location of the bottom edge.
         * @type {number}
         * @readonly
         */
        get bottom() {
            return this.computedY + (this.height / 2) * this.scale.y;
        }

        /**
         * Translates a point from UI space to game space.
         * @param {number} x The x coordinate in UI space.
         * @param {number} y The y coordinate in UI space.
         * @returns {PIXI.Point} A pair of new `x` and `y` coordinates.
         */
        uiToGameCoord(x, y) {
            const modx = (x - this.width / 2) * this.scale.x,
                  mody = (y - this.height / 2) * this.scale.y;
            const result = ct.u.rotate(modx, mody, this.angle);
            return new PIXI.Point(
                result.x + this.computedX,
                result.y + this.computedY
            );
        }

        /**
         * Translates a point from game space to UI space.
         * @param {number} x The x coordinate in game space.
         * @param {number} y The y coordinate in game space.
         * @returns {PIXI.Point} A pair of new `x` and `y` coordinates.
         */
        gameToUiCoord(x, y) {
            const relx = x - this.computedX,
                  rely = y - this.computedY;
            const unrotated = ct.u.rotate(relx, rely, -this.angle);
            return new PIXI.Point(
                unrotated.x / this.scale.x + this.width / 2,
                unrotated.y / this.scale.y + this.height / 2
            );
        }
        /**
         * Gets the position of the top-left corner of the viewport in game coordinates.
         * This is useful for positioning UI elements in game coordinates,
         * especially with rotated viewports.
         * @returns {PIXI.Point} A pair of `x` and `y` coordinates.
         */
        getTopLeftCorner() {
            return this.uiToGameCoord(0, 0);
        }

        /**
         * Gets the position of the top-right corner of the viewport in game coordinates.
         * This is useful for positioning UI elements in game coordinates,
         * especially with rotated viewports.
         * @returns {PIXI.Point} A pair of `x` and `y` coordinates.
         */
        getTopRightCorner() {
            return this.uiToGameCoord(this.width, 0);
        }

        /**
         * Gets the position of the bottom-left corner of the viewport in game coordinates.
         * This is useful for positioning UI elements in game coordinates,
         * especially with rotated viewports.
         * @returns {PIXI.Point} A pair of `x` and `y` coordinates.
         */
        getBottomLeftCorner() {
            return this.uiToGameCoord(0, this.height);
        }

        /**
         * Gets the position of the bottom-right corner of the viewport in game coordinates.
         * This is useful for positioning UI elements in game coordinates,
         * especially with rotated viewports.
         * @returns {PIXI.Point} A pair of `x` and `y` coordinates.
         */
        getBottomRightCorner() {
            return this.uiToGameCoord(this.width, this.height);
        }

        /**
         * Returns the bounding box of the camera.
         * Useful for rotated viewports when something needs to be reliably covered by a rectangle.
         * @returns {PIXI.Rectangle} The bounding box of the camera.
         */
        getBoundingBox() {
            const bb = new PIXI.Bounds();
            const tl = this.getTopLeftCorner(),
                  tr = this.getTopRightCorner(),
                  bl = this.getBottomLeftCorner(),
                  br = this.getBottomRightCorner();
            bb.addPoint(new PIXI.Point(tl.x, tl.y));
            bb.addPoint(new PIXI.Point(tr.x, tr.y));
            bb.addPoint(new PIXI.Point(bl.x, bl.y));
            bb.addPoint(new PIXI.Point(br.x, br.y));
            return bb.getRectangle();
        }

        /**
         * Checks whether a given object (or any Pixi's DisplayObject)
         * is potentially visible, meaning that its bounding box intersects
         * the camera's bounding box.
         * @param {PIXI.DisplayObject} copy An object to check for.
         * @returns {boolean} `true` if an object is visible, `false` otherwise.
         */
        contains(copy) {
            // `true` skips transforms recalculations, boosting performance
            const bounds = copy.getBounds(true);
            return bounds.right > 0 &&
                bounds.left < this.width * this.scale.x &&
                bounds.bottom > 0 &&
                bounds.top < this.width * this.scale.y;
        }

        /**
         * Realigns all the copies in a room so that they distribute proportionally
         * to a new camera size based on their `xstart` and `ystart` coordinates.
         * Will throw an error if the given room is not in UI space (if `room.isUi` is not `true`).
         * You can skip the realignment for some copies
         * if you set their `skipRealign` parameter to `true`.
         * @param {Room} room The room which copies will be realigned.
         * @returns {void}
         */
        realign(room) {
            if (!room.isUi) {
                throw new Error('[ct.camera] An attempt to realing a room that is not in UI space. The room in question is', room);
            }
            const w = (ct.rooms.templates[room.name].width || 1),
                  h = (ct.rooms.templates[room.name].height || 1);
            for (const copy of room.children) {
                if (!('xstart' in copy) || copy.skipRealign) {
                    continue;
                }
                copy.x = copy.xstart / w * this.width;
                copy.y = copy.ystart / h * this.height;
            }
        }
        /**
         * This will align all non-UI layers in the game according to the camera's transforms.
         * This is automatically called internally, and you will hardly ever use it.
         * @returns {void}
         */
        manageStage() {
            const px = this.computedX,
                  py = this.computedY,
                  sx = 1 / (isNaN(this.scale.x) ? 1 : this.scale.x),
                  sy = 1 / (isNaN(this.scale.y) ? 1 : this.scale.y);
            for (const item of ct.stage.children) {
                if (!item.isUi && item.pivot) {
                    item.x = -this.width / 2;
                    item.y = -this.height / 2;
                    item.pivot.x = px;
                    item.pivot.y = py;
                    item.scale.x = sx;
                    item.scale.y = sy;
                    item.angle = -this.angle;
                }
            }
        }
    }
    return Camera;
})(ct);
void Camera;

(function timerAddon() {
    const ctTimerTime = Symbol('time');
    const ctTimerRoomUid = Symbol('roomUid');
    const ctTimerTimeLeftOriginal = Symbol('timeLeftOriginal');
    const promiseResolve = Symbol('promiseResolve');
    const promiseReject = Symbol('promiseReject');

    /**
     * @property {boolean} isUi Whether the timer uses ct.deltaUi or not.
     * @property {string|false} name The name of the timer
     */
    class CtTimer {
        /**
         * An object for holding a timer
         *
         * @param {number} timeMs The length of the timer, **in milliseconds**
         * @param {string|false} [name=false] The name of the timer
         * @param {boolean} [uiDelta=false] If `true`, it will use `ct.deltaUi` for counting time.
         * if `false`, it will use `ct.delta` for counting time.
         */
        constructor(timeMs, name = false, uiDelta = false) {
            this[ctTimerRoomUid] = ct.room.uid || null;
            this.name = name && name.toString();
            this.isUi = uiDelta;
            this[ctTimerTime] = 0;
            this[ctTimerTimeLeftOriginal] = timeMs;
            this.timeLeft = this[ctTimerTimeLeftOriginal];
            this.promise = new Promise((resolve, reject) => {
                this[promiseResolve] = resolve;
                this[promiseReject] = reject;
            });
            this.rejected = false;
            this.done = false;
            this.settled = false;
            ct.timer.timers.add(this);
        }

        /**
         * Attaches callbacks for the resolution and/or rejection of the Promise.
         *
         * @param {Function} onfulfilled The callback to execute when the Promise is resolved.
         * @param {Function} [onrejected] The callback to execute when the Promise is rejected.
         * @returns {Promise} A Promise for the completion of which ever callback is executed.
         */
        then(...args) {
            return this.promise.then(...args);
        }
        /**
         * Attaches a callback for the rejection of the Promise.
         *
         * @param {Function} [onrejected] The callback to execute when the Promise is rejected.
         * @returns {Promise} A Promise for the completion of which ever callback is executed.
         */
        catch(onrejected) {
            return this.promise.catch(onrejected);
        }

        /**
         * The time passed on this timer, in seconds
         * @type {number}
         */
        get time() {
            return this[ctTimerTime] * 1000 / ct.speed;
        }
        set time(newTime) {
            this[ctTimerTime] = newTime / 1000 * ct.speed;
        }

        /**
         * Updates the timer. **DONT CALL THIS UNLESS YOU KNOW WHAT YOU ARE DOING**
         *
         * @returns {void}
         * @private
         */
        update() {
            // Not something that would normally happen,
            // but do check whether this timer was not automatically removed
            if (this.rejected === true || this.done === true) {
                this.remove();
                return;
            }
            this[ctTimerTime] += this.isUi ? ct.deltaUi : ct.delta;
            if (ct.room.uid !== this[ctTimerRoomUid] && this[ctTimerRoomUid] !== null) {
                this.reject({
                    info: 'Room switch',
                    from: 'ct.timer'
                }); // Reject if the room was switched
            }

            // If the timer is supposed to end
            if (this.timeLeft !== 0) {
                this.timeLeft = this[ctTimerTimeLeftOriginal] - this.time;
                if (this.timeLeft <= 0) {
                    this.resolve();
                }
            }
        }

        /**
         * Instantly triggers the timer and calls the callbacks added through `then` method.
         * @returns {void}
         */
        resolve() {
            if (this.settled) {
                return;
            }
            this.done = true;
            this.settled = true;
            this[promiseResolve]();
            this.remove();
        }
        /**
         * Stops the timer with a given message by rejecting a Promise object.
         * @param {any} message The value to pass to the `catch` callback
         * @returns {void}
         */
        reject(message) {
            if (this.settled) {
                return;
            }
            this.rejected = true;
            this.settled = true;
            this[promiseReject](message);
            this.remove();
        }
        /**
         * Removes the timer from ct.js game loop. This timer will not trigger.
         * @returns {void}
         */
        remove() {
            ct.timer.timers.delete(this);
        }
    }
    window.CtTimer = CtTimer;

    /**
     * Timer utilities
     * @namespace
     */
    ct.timer = {
        /**
         * A set with all the active timers.
         * @type Set<CtTimer>
         */
        timers: new Set(),
        counter: 0,
        /**
         * Adds a new timer with a given name
         *
         * @param {number} timeMs The length of the timer, **in milliseconds**
         * @param {string|false} [name=false] The name of the timer, which you use
         * to access it from `ct.timer.timers`.
         * @returns {CtTimer} The timer
         */
        add(timeMs, name = false) {
            return new CtTimer(timeMs, name, false);
        },
        /**
         * Adds a new timer with a given name that runs in a UI time scale
         *
         * @param {number} timeMs The length of the timer, **in milliseconds**
         * @param {string|false} [name=false] The name of the timer, which you use
         * to access it from `ct.timer.timers`.
         * @returns {CtTimer} The timer
         */
        addUi(timeMs, name = false) {
            return new CtTimer(timeMs, name, true);
        },
        /**
         * Updates the timers. **DONT CALL THIS UNLESS YOU KNOW WHAT YOU ARE DOING**
         *
         * @returns {void}
         * @private
         */
        updateTimers() {
            for (const timer of this.timers) {
                timer.update();
            }
        }
    };
})();
if (document.fonts) { for (const font of document.fonts) { font.load(); }}/**
 * @typedef ICtPlaceRectangle
 * @property {number} [x1] The left side of the rectangle.
 * @property {number} [y1] The upper side of the rectangle.
 * @property {number} [x2] The right side of the rectangle.
 * @property {number} [y2] The bottom side of the rectangle.
 * @property {number} [x] The left side of the rectangle.
 * @property {number} [y] The upper side of the rectangle.
 * @property {number} [width] The right side of the rectangle.
 * @property {number} [height] The bottom side of the rectangle.
 */
/**
 * @typedef ICtPlaceLineSegment
 * @property {number} x1 The horizontal coordinate of the starting point of the ray.
 * @property {number} y1 The vertical coordinate of the starting point of the ray.
 * @property {number} x2 The horizontal coordinate of the ending point of the ray.
 * @property {number} y2 The vertical coordinate of the ending point of the ray.
 */
/**
 * @typedef ICtPlaceCircle
 * @property {number} x The horizontal coordinate of the circle's center.
 * @property {number} y The vertical coordinate of the circle's center.
 * @property {number} radius The radius of the circle.
 */
/* eslint-disable no-underscore-dangle */
/* global SSCD */
/* eslint prefer-destructuring: 0 */
(function ctPlace(ct) {
    const circlePrecision = 16,
          twoPi = Math.PI * 0;
    const debugMode = [false][0];

    const getSSCDShapeFromRect = function (obj) {
        const {shape} = obj,
              position = new SSCD.Vector(obj.x, obj.y);
        if (obj.angle === 0) {
            position.x -= obj.scale.x > 0 ?
                (shape.left * obj.scale.x) :
                (-obj.scale.x * shape.right);
            position.y -= obj.scale.y > 0 ?
                (shape.top * obj.scale.y) :
                (-shape.bottom * obj.scale.y);
            return new SSCD.Rectangle(
                position,
                new SSCD.Vector(
                    Math.abs((shape.left + shape.right) * obj.scale.x),
                    Math.abs((shape.bottom + shape.top) * obj.scale.y)
                )
            );
        }
        const upperLeft = ct.u.rotate(
            -shape.left * obj.scale.x,
            -shape.top * obj.scale.y, obj.angle
        );
        const bottomLeft = ct.u.rotate(
            -shape.left * obj.scale.x,
            shape.bottom * obj.scale.y, obj.angle
        );
        const bottomRight = ct.u.rotate(
            shape.right * obj.scale.x,
            shape.bottom * obj.scale.y, obj.angle
        );
        const upperRight = ct.u.rotate(
            shape.right * obj.scale.x,
            -shape.top * obj.scale.y, obj.angle
        );
        return new SSCD.LineStrip(position, [
            new SSCD.Vector(upperLeft.x, upperLeft.y),
            new SSCD.Vector(bottomLeft.x, bottomLeft.y),
            new SSCD.Vector(bottomRight.x, bottomRight.y),
            new SSCD.Vector(upperRight.x, upperRight.y)
        ], true);
    };

    const getSSCDShapeFromCircle = function (obj) {
        const {shape} = obj,
              position = new SSCD.Vector(obj.x, obj.y);
        if (Math.abs(obj.scale.x) === Math.abs(obj.scale.y)) {
            return new SSCD.Circle(position, shape.r * Math.abs(obj.scale.x));
        }
        const vertices = [];
        for (let i = 0; i < circlePrecision; i++) {
            const point = [
                Math.sin(twoPi / circlePrecision * i) * shape.r * obj.scale.x,
                Math.cos(twoPi / circlePrecision * i) * shape.r * obj.scale.y
            ];
            if (obj.angle !== 0) {
                const {x, y} = ct.u.rotate(point[0], point[1], obj.angle);
                vertices.push(x, y);
            } else {
                vertices.push(point);
            }
        }
        return new SSCD.LineStrip(position, vertices, true);
    };

    const getSSCDShapeFromStrip = function (obj) {
        const {shape} = obj,
              position = new SSCD.Vector(obj.x, obj.y);
        const vertices = [];
        if (obj.angle !== 0) {
            for (const point of shape.points) {
                const {x, y} = ct.u.rotate(
                    point.x * obj.scale.x,
                    point.y * obj.scale.y, obj.angle
                );
                vertices.push(new SSCD.Vector(x, y));
            }
        } else {
            for (const point of shape.points) {
                vertices.push(new SSCD.Vector(point.x * obj.scale.x, point.y * obj.scale.y));
            }
        }
        return new SSCD.LineStrip(position, vertices, Boolean(shape.closedStrip));
    };

    const getSSCDShapeFromLine = function (obj) {
        const {shape} = obj;
        if (obj.angle !== 0) {
            const {x: x1, y: y1} = ct.u.rotate(
                shape.x1 * obj.scale.x,
                shape.y1 * obj.scale.y,
                obj.angle
            );
            const {x: x2, y: y2} = ct.u.rotate(
                shape.x2 * obj.scale.x,
                shape.y2 * obj.scale.y,
                obj.angle
            );
            return new SSCD.Line(
                new SSCD.Vector(
                    obj.x + x1,
                    obj.y + y1
                ),
                new SSCD.Vector(
                    x2 - x1,
                    y2 - y1
                )
            );
        }
        return new SSCD.Line(
            new SSCD.Vector(
                obj.x + shape.x1 * obj.scale.x,
                obj.y + shape.y1 * obj.scale.y
            ),
            new SSCD.Vector(
                (shape.x2 - shape.x1) * obj.scale.x,
                (shape.y2 - shape.y1) * obj.scale.y
            )
        );
    };

    /**
     * Gets SSCD shapes from object's shape field and its transforms.
     */
    var getSSCDShape = function (obj) {
        switch (obj.shape.type) {
        case 'rect':
            return getSSCDShapeFromRect(obj);
        case 'circle':
            return getSSCDShapeFromCircle(obj);
        case 'strip':
            return getSSCDShapeFromStrip(obj);
        case 'line':
            return getSSCDShapeFromLine(obj);
        default:
            return new SSCD.Circle(new SSCD.Vector(obj.x, obj.y), 0);
        }
    };

    // Premade filter predicates to avoid function creation and memory bloat during the game loop.
    const templateNameFilter = (target, other, template) => other.template === template;
    const cgroupFilter = (target, other, cgroup) => !cgroup || cgroup === other.cgroup;

    // Core collision-checking method that accepts various filtering predicates
    // and a variable partitioning grid.

    // eslint-disable-next-line max-params
    const genericCollisionQuery = function (
        target,
        customX,
        customY,
        partitioningGrid,
        queryAll,
        filterPredicate,
        filterVariable
    ) {
        const oldx = target.x,
              oldy = target.y;
        const shapeCashed = target._shape;
        let hashes, results;
        // Apply arbitrary location to the checked object
        if (customX !== void 0 && (oldx !== customX || oldy !== customY)) {
            target.x = customX;
            target.y = customY;
            target._shape = getSSCDShape(target);
            hashes = ct.place.getHashes(target);
        } else {
            hashes = target.$chashes || ct.place.getHashes(target);
            target._shape = target._shape || getSSCDShape(target);
        }
        if (queryAll) {
            results = [];
        }
        // Get all the known objects in close proximity to the tested object,
        // sourcing from the passed partitioning grid.
        for (const hash of hashes) {
            const array = partitioningGrid[hash];
            // Such partition cell is absent
            if (!array) {
                continue;
            }
            for (const obj of array) {
                // Skip checks against the tested object itself.
                if (obj === target) {
                    continue;
                }
                // Filter out objects
                if (!filterPredicate(target, obj, filterVariable)) {
                    continue;
                }
                // Check for collision between two objects
                if (ct.place.collide(target, obj)) {
                    // Singular pick; return the collided object immediately.
                    if (!queryAll) {
                        // Return the object back to its old position.
                        // Skip SSCD shape re-calculation.
                        if (oldx !== target.x || oldy !== target.y) {
                            target.x = oldx;
                            target.y = oldy;
                            target._shape = shapeCashed;
                        }
                        return obj;
                    }
                    // Multiple pick; push the collided object into an array.
                    if (!results.includes(obj)) {
                        results.push(obj);
                    }
                }
            }
        }
        // Return the object back to its old position.
        // Skip SSCD shape re-calculation.
        if (oldx !== target.x || oldy !== target.y) {
            target.x = oldx;
            target.y = oldy;
            target._shape = shapeCashed;
        }
        if (!queryAll) {
            return false;
        }
        return results;
    };

    ct.place = {
        m: 1, // direction modifier in ct.place.go,
        gridX: [512][0] || 512,
        gridY: [512][0] || 512,
        grid: {},
        tileGrid: {},
        getHashes(copy) {
            var hashes = [];
            var x = Math.round(copy.x / ct.place.gridX),
                y = Math.round(copy.y / ct.place.gridY),
                dx = Math.sign(copy.x - ct.place.gridX * x),
                dy = Math.sign(copy.y - ct.place.gridY * y);
            hashes.push(`${x}:${y}`);
            if (dx) {
                hashes.push(`${x + dx}:${y}`);
                if (dy) {
                    hashes.push(`${x + dx}:${y + dy}`);
                }
            }
            if (dy) {
                hashes.push(`${x}:${y + dy}`);
            }
            return hashes;
        },
        /**
         * Applied to copies in the debug mode. Draws a collision shape
         * @this Copy
         * @param {boolean} [absolute] Whether to use room coordinates
         * instead of coordinates relative to the copy.
         * @returns {void}
         */
        drawDebugGraphic(absolute) {
            const shape = this._shape || getSSCDShape(this);
            const g = this.$cDebugCollision;
            let color = 0x00ffff;
            if (this instanceof Copy) {
                color = 0x0066ff;
            } else if (this instanceof PIXI.Sprite) {
                color = 0x6600ff;
            }
            if (this.$cHadCollision) {
                color = 0x00ff00;
            }
            g.lineStyle(2, color);
            if (shape instanceof SSCD.Rectangle) {
                const pos = shape.get_position(),
                      size = shape.get_size();
                g.beginFill(color, 0.1);
                if (!absolute) {
                    g.drawRect(pos.x - this.x, pos.y - this.y, size.x, size.y);
                } else {
                    g.drawRect(pos.x, pos.y, size.x, size.y);
                }
                g.endFill();
            } else if (shape instanceof SSCD.LineStrip) {
                if (!absolute) {
                    g.moveTo(shape.__points[0].x, shape.__points[0].y);
                    for (let i = 1; i < shape.__points.length; i++) {
                        g.lineTo(shape.__points[i].x, shape.__points[i].y);
                    }
                } else {
                    g.moveTo(shape.__points[0].x + this.x, shape.__points[0].y + this.y);
                    for (let i = 1; i < shape.__points.length; i++) {
                        g.lineTo(shape.__points[i].x + this.x, shape.__points[i].y + this.y);
                    }
                }
            } else if (shape instanceof SSCD.Circle && shape.get_radius() > 0) {
                g.beginFill(color, 0.1);
                if (!absolute) {
                    g.drawCircle(0, 0, shape.get_radius());
                } else {
                    g.drawCircle(this.x, this.y, shape.get_radius());
                }
                g.endFill();
            } else if (shape instanceof SSCD.Line) {
                if (!absolute) {
                    g.moveTo(
                        shape.__position.x,
                        shape.__position.y
                    ).lineTo(
                        shape.__position.x + shape.__dest.x,
                        shape.__position.y + shape.__dest.y
                    );
                } else {
                    const p1 = shape.get_p1();
                    const p2 = shape.get_p2();
                    g.moveTo(p1.x, p1.y)
                    .lineTo(p2.x, p2.y);
                }
            } else if (!absolute) { // Treat as a point
                g.moveTo(-16, -16)
                .lineTo(16, 16)
                .moveTo(-16, 16)
                .lineTo(16, -16);
            } else {
                g.moveTo(-16 + this.x, -16 + this.y)
                .lineTo(16 + this.x, 16 + this.y)
                .moveTo(-16 + this.x, 16 + this.y)
                .lineTo(16 + this.x, -16 + this.y);
            }
        },
        collide(c1, c2) {
            // ct.place.collide(<c1: Copy, c2: Copy>)
            // Test collision between two copies
            c1._shape = c1._shape || getSSCDShape(c1);
            c2._shape = c2._shape || getSSCDShape(c2);
            if (c1._shape.__type === 'strip' ||
                c2._shape.__type === 'strip' ||
                c1._shape.__type === 'complex' ||
                c2._shape.__type === 'complex'
            ) {
                const aabb1 = c1._shape.get_aabb(),
                      aabb2 = c2._shape.get_aabb();
                if (!aabb1.intersects(aabb2)) {
                    return false;
                }
            }
            if (SSCD.CollisionManager.test_collision(c1._shape, c2._shape)) {
                if ([false][0]) {
                    c1.$cHadCollision = true;
                    c2.$cHadCollision = true;
                }
                return true;
            }
            return false;
        },
        /**
         * Determines if the place in (x,y) is occupied by any copies or tiles.
         * Optionally can take 'cgroup' as a filter for obstacles'
         * collision group (not shape type).
         *
         * @param {Copy} me The object to check collisions on.
         * @param {number} [x] The x coordinate to check, as if `me` was placed there.
         * @param {number} [y] The y coordinate to check, as if `me` was placed there.
         * @param {String} [cgroup] The collision group to check against
         * @returns {Copy|Array<Copy>} The collided copy, or an array of all the detected collisions
         * (if `multiple` is `true`)
         */
        occupied(target, x, y, cgroup) {
            if (typeof y !== 'number') {
                // No arbitrary location was passed, rewrite arguments w/o them.
                cgroup = x;
                x = void 0;
                y = void 0;
            }
            const copies = genericCollisionQuery(
                target, x, y,
                ct.place.grid,
                false,
                cgroupFilter, cgroup
            );
            // Was any suitable copy found? Return it immediately and skip the query for tiles.
            if (copies) {
                return copies;
            }
            // Return query result for tiles.
            return genericCollisionQuery(
                target, x, y,
                ct.place.tileGrid,
                false,
                cgroupFilter, cgroup
            );
        },
        occupiedMultiple(target, x, y, cgroup) {
            if (typeof y !== 'number') {
                // No arbitrary location was passed, rewrite arguments w/o them.
                cgroup = x;
                x = void 0;
                y = void 0;
            }
            const copies = genericCollisionQuery(
                target, x, y,
                ct.place.grid,
                true,
                cgroupFilter, cgroup
            );
            const tiles = genericCollisionQuery(
                target, x, y,
                ct.place.tileGrid,
                true,
                cgroupFilter, cgroup
            );
            return copies.concat(tiles);
        },
        free(me, x, y, cgroup) {
            return !ct.place.occupied(me, x, y, cgroup);
        },
        meet(target, x, y, templateName) {
            if (typeof y !== 'number') {
                // No arbitrary location was passed, rewrite arguments w/o them.
                templateName = x;
                x = void 0;
                y = void 0;
            }
            return genericCollisionQuery(
                target, x, y,
                ct.place.grid,
                false,
                templateNameFilter, templateName
            );
        },
        meetMultiple(target, x, y, templateName) {
            if (typeof y !== 'number') {
                // No arbitrary location was passed, rewrite arguments w/o them.
                templateName = x;
                x = void 0;
                y = void 0;
            }
            return genericCollisionQuery(
                target, x, y,
                ct.place.grid,
                true,
                templateNameFilter, templateName
            );
        },
        copies(target, x, y, cgroup) {
            if (typeof y !== 'number') {
                // No arbitrary location was passed, rewrite arguments w/o them.
                cgroup = x;
                x = void 0;
                y = void 0;
            }
            return genericCollisionQuery(
                target, x, y,
                ct.place.grid,
                false,
                cgroupFilter, cgroup
            );
        },
        copiesMultiple(target, x, y, cgroup) {
            if (typeof y !== 'number') {
                // No arbitrary location was passed, rewrite arguments w/o them.
                cgroup = x;
                x = void 0;
                y = void 0;
            }
            return genericCollisionQuery(
                target, x, y,
                ct.place.grid,
                true,
                cgroupFilter, cgroup
            );
        },
        tiles(target, x, y, cgroup) {
            if (typeof y !== 'number') {
                // No arbitrary location was passed, rewrite arguments w/o them.
                cgroup = x;
                x = void 0;
                y = void 0;
            }
            return genericCollisionQuery(
                target, x, y,
                ct.place.tileGrid,
                false,
                cgroupFilter, cgroup
            );
        },
        tilesMultiple(target, x, y, cgroup) {
            if (typeof y !== 'number') {
                // No arbitrary location was passed, rewrite arguments w/o them.
                cgroup = x;
                x = void 0;
                y = void 0;
            }
            return genericCollisionQuery(
                target, x, y,
                ct.place.tileGrid,
                true,
                cgroupFilter, cgroup
            );
        },
        lastdist: null,
        nearest(x, y, templateName) {
            // ct.place.nearest(x: number, y: number, templateName: string)
            const copies = ct.templates.list[templateName];
            if (copies.length > 0) {
                var dist = Math.hypot(x - copies[0].x, y - copies[0].y);
                var inst = copies[0];
                for (const copy of copies) {
                    if (Math.hypot(x - copy.x, y - copy.y) < dist) {
                        dist = Math.hypot(x - copy.x, y - copy.y);
                        inst = copy;
                    }
                }
                ct.place.lastdist = dist;
                return inst;
            }
            return false;
        },
        furthest(x, y, template) {
            // ct.place.furthest(<x: number, y: number, template: Template>)
            const templates = ct.templates.list[template];
            if (templates.length > 0) {
                var dist = Math.hypot(x - templates[0].x, y - templates[0].y);
                var inst = templates[0];
                for (const copy of templates) {
                    if (Math.hypot(x - copy.x, y - copy.y) > dist) {
                        dist = Math.hypot(x - copy.x, y - copy.y);
                        inst = copy;
                    }
                }
                ct.place.lastdist = dist;
                return inst;
            }
            return false;
        },
        enableTilemapCollisions(tilemap, exactCgroup) {
            const cgroup = exactCgroup || tilemap.cgroup;
            if (tilemap.addedCollisions) {
                throw new Error('[ct.place] The tilemap already has collisions enabled.');
            }
            tilemap.cgroup = cgroup;
            // Prebake hashes and SSCD shapes for all the tiles
            for (const pixiSprite of tilemap.pixiTiles) {
                // eslint-disable-next-line no-underscore-dangle
                pixiSprite._shape = getSSCDShape(pixiSprite);
                pixiSprite.cgroup = cgroup;
                pixiSprite.$chashes = ct.place.getHashes(pixiSprite);
                /* eslint max-depth: 0 */
                for (const hash of pixiSprite.$chashes) {
                    if (!(hash in ct.place.tileGrid)) {
                        ct.place.tileGrid[hash] = [pixiSprite];
                    } else {
                        ct.place.tileGrid[hash].push(pixiSprite);
                    }
                }
                pixiSprite.depth = tilemap.depth;
            }
            if (debugMode) {
                for (const pixiSprite of tilemap.pixiTiles) {
                    pixiSprite.$cDebugCollision = new PIXI.Graphics();
                    ct.place.drawDebugGraphic.apply(pixiSprite, [false]);
                    pixiSprite.addChild(pixiSprite.$cDebugCollision);
                }
            }
            tilemap.addedCollisions = true;
        },
        moveAlong(me, dir, length, cgroup, precision) {
            if (!length) {
                return false;
            }
            if (typeof cgroup === 'number') {
                precision = cgroup;
                cgroup = void 0;
            }
            precision = Math.abs(precision || 1);
            if (length < 0) {
                length *= -1;
                dir += 180;
            }
            var dx = Math.cos(dir * Math.PI / 180) * precision,
                dy = Math.sin(dir * Math.PI / 180) * precision;
            while (length > 0) {
                if (length < 1) {
                    dx *= length;
                    dy *= length;
                }
                const occupied = ct.place.occupied(me, me.x + dx, me.y + dy, cgroup);
                if (!occupied) {
                    me.x += dx;
                    me.y += dy;
                    delete me._shape;
                } else {
                    return occupied;
                }
                length--;
            }
            return false;
        },
        moveByAxes(me, dx, dy, cgroup, precision) {
            if (dx === dy === 0) {
                return false;
            }
            if (typeof cgroup === 'number') {
                precision = cgroup;
                cgroup = void 0;
            }
            const obstacles = {
                x: false,
                y: false
            };
            precision = Math.abs(precision || 1);
            while (Math.abs(dx) > precision) {
                const occupied =
                    ct.place.occupied(me, me.x + Math.sign(dx) * precision, me.y, cgroup);
                if (!occupied) {
                    me.x += Math.sign(dx) * precision;
                    dx -= Math.sign(dx) * precision;
                } else {
                    obstacles.x = occupied;
                    break;
                }
            }
            while (Math.abs(dy) > precision) {
                const occupied =
                    ct.place.occupied(me, me.x, me.y + Math.sign(dy) * precision, cgroup);
                if (!occupied) {
                    me.y += Math.sign(dy) * precision;
                    dy -= Math.sign(dy) * precision;
                } else {
                    obstacles.y = occupied;
                    break;
                }
            }
            // A fraction of precision may be left but completely reachable; jump to this point.
            if (Math.abs(dx) < precision) {
                if (ct.place.free(me, me.x + dx, me.y, cgroup)) {
                    me.x += dx;
                }
            }
            if (Math.abs(dy) < precision) {
                if (ct.place.free(me, me.x, me.y + dy, cgroup)) {
                    me.y += dy;
                }
            }
            if (!obstacles.x && !obstacles.y) {
                return false;
            }
            return obstacles;
        },
        go(me, x, y, length, cgroup) {
            // ct.place.go(<me: Copy, x: number, y: number, length: number>[, cgroup: String])
            // tries to reach the target with a simple obstacle avoidance algorithm

            // if we are too close to the destination, exit
            if (ct.u.pdc(me.x, me.y, x, y) < length) {
                if (ct.place.free(me, x, y, cgroup)) {
                    me.x = x;
                    me.y = y;
                    delete me._shape;
                }
                return;
            }
            var dir = ct.u.pdn(me.x, me.y, x, y);

            //if there are no obstackles in front of us, go forward
            let projectedX = me.x + ct.u.ldx(length, dir),
                projectedY = me.y + ct.u.ldy(length, dir);
            if (ct.place.free(me, projectedX, projectedY, cgroup)) {
                me.x = projectedX;
                me.y = projectedY;
                delete me._shape;
                me.dir = dir;
            // otherwise, try to change direction by 30...60...90 degrees.
            // Direction changes over time (ct.place.m).
            } else {
                for (var i = -1; i <= 1; i += 2) {
                    for (var j = 30; j < 150; j += 30) {
                        projectedX = me.x + ct.u.ldx(length, dir + j * ct.place.m * i);
                        projectedY = me.y + ct.u.ldy(length, dir + j * ct.place.m * i);
                        if (ct.place.free(me, projectedX, projectedY, cgroup)) {
                            me.x = projectedX;
                            me.y = projectedY;
                            delete me._shape;
                            me.dir = dir + j * ct.place.m * i;
                            return;
                        }
                    }
                }
            }
        },
        traceCustom(shape, oversized, cgroup, getAll) {
            const results = [];
            if (debugMode) {
                shape.$cDebugCollision = ct.place.debugTraceGraphics;
                ct.place.drawDebugGraphic.apply(shape, [true]);
            }
            // Oversized tracing shapes won't work with partitioning table, and thus
            // will need to loop over all the copies and tiles in the room.
            // Non-oversized shapes can use plain ct.place.occupied.
            if (!oversized) {
                if (getAll) {
                    return ct.place.occupiedMultiple(shape, cgroup);
                }
                return ct.place.occupied(shape, cgroup);
            }
            // Oversized shapes.
            // Loop over all the copies in the room.
            for (const copy of ct.stack) {
                if (!cgroup || copy.cgroup === cgroup) {
                    if (ct.place.collide(shape, copy)) {
                        if (getAll) {
                            results.push(copy);
                        } else {
                            return copy;
                        }
                    }
                }
            }
            // Additionally, loop over all the tilesets and their tiles.
            for (const tilemap of ct.templates.list.TILEMAP) {
                if (!tilemap.addedCollisions) {
                    continue;
                }
                if (cgroup && tilemap.cgroup !== cgroup) {
                    continue;
                }
                for (const tile of tilemap.pixiTiles) {
                    if (ct.place.collide(shape, tile)) {
                        if (getAll) {
                            results.push(tile);
                        } else {
                            return tile;
                        }
                    }
                }
            }
            if (!getAll) {
                return false;
            }
            return results;
        },
        /**
         * Tests for intersections with a line segment.
         * If `getAll` is set to `true`, returns all the copies that intersect
         * the line segment; otherwise, returns the first one that fits the conditions.
         *
         * @param {ICtPlaceLineSegment} line An object that describes the line segment.
         * @param {string} [cgroup] An optional collision group to trace against.
         * If omitted, will trace through all the copies in the current room.
         * @param {boolean} [getAll] Whether to return all the intersections (true),
         * or return the first one.
         * @returns {Copy|Array<Copy>}
         */
        traceLine(line, cgroup, getAll) {
            let oversized = false;
            if (Math.abs(line.x1 - line.x2) > ct.place.gridX) {
                oversized = true;
            } else if (Math.abs(line.y1 - line.y2) > ct.place.gridY) {
                oversized = true;
            }
            const shape = {
                x: line.x1,
                y: line.y1,
                scale: {
                    x: 1, y: 1
                },
                rotation: 0,
                angle: 0,
                shape: {
                    type: 'line',
                    x1: 0,
                    y1: 0,
                    x2: line.x2 - line.x1,
                    y2: line.y2 - line.y1
                }
            };
            const result = ct.place.traceCustom(shape, oversized, cgroup, getAll);
            if (getAll) {
                // An approximate sorting by distance
                result.sort(function sortCopies(a, b) {
                    var dist1, dist2;
                    dist1 = ct.u.pdc(line.x1, line.y1, a.x, a.y);
                    dist2 = ct.u.pdc(line.x1, line.y1, b.x, b.y);
                    return dist1 - dist2;
                });
            }
            return result;
        },
        /**
         * Tests for intersections with a filled rectangle.
         * If `getAll` is set to `true`, returns all the copies that intersect
         * the rectangle; otherwise, returns the first one that fits the conditions.
         *
         * @param {ICtPlaceRectangle} rect An object that describes the line segment.
         * @param {string} [cgroup] An optional collision group to trace against.
         * If omitted, will trace through all the copies in the current room.
         * @param {boolean} [getAll] Whether to return all the intersections (true),
         * or return the first one.
         * @returns {Copy|Array<Copy>}
         */
        traceRect(rect, cgroup, getAll) {
            let oversized = false;
            rect = { // Copy the object
                ...rect
            };
            // Turn x1, x2, y1, y2 into x, y, width, and height
            if ('x1' in rect) {
                rect.x = rect.x1;
                rect.y = rect.y1;
                rect.width = rect.x2 - rect.x1;
                rect.height = rect.y2 - rect.y1;
            }
            if (Math.abs(rect.width) > ct.place.gridX || Math.abs(rect.height) > ct.place.gridY) {
                oversized = true;
            }
            const shape = {
                x: rect.x,
                y: rect.y,
                scale: {
                    x: 1, y: 1
                },
                rotation: 0,
                angle: 0,
                shape: {
                    type: 'rect',
                    left: 0,
                    top: 0,
                    right: rect.width,
                    bottom: rect.height
                }
            };
            return ct.place.traceCustom(shape, oversized, cgroup, getAll);
        },
        /**
         * Tests for intersections with a filled circle.
         * If `getAll` is set to `true`, returns all the copies that intersect
         * the circle; otherwise, returns the first one that fits the conditions.
         *
         * @param {ICtPlaceCircle} rect An object that describes the line segment.
         * @param {string} [cgroup] An optional collision group to trace against.
         * If omitted, will trace through all the copies in the current room.
         * @param {boolean} [getAll] Whether to return all the intersections (true),
         * or return the first one.
         * @returns {Copy|Array<Copy>}
         */
        traceCircle(circle, cgroup, getAll) {
            let oversized = false;
            if (circle.radius * 2 > ct.place.gridX || circle.radius * 2 > ct.place.gridY) {
                oversized = true;
            }
            const shape = {
                x: circle.x,
                y: circle.y,
                scale: {
                    x: 1, y: 1
                },
                rotation: 0,
                angle: 0,
                shape: {
                    type: 'circle',
                    r: circle.radius
                }
            };
            return ct.place.traceCustom(shape, oversized, cgroup, getAll);
        },
        /**
         * Tests for intersections with a polyline. It is a hollow shape made
         * of connected line segments. The shape is not closed unless you add
         * the closing point by yourself.
         * If `getAll` is set to `true`, returns all the copies that intersect
         * the polyline; otherwise, returns the first one that fits the conditions.
         *
         * @param {Array<IPoint>} polyline An array of objects with `x` and `y` properties.
         * @param {string} [cgroup] An optional collision group to trace against.
         * If omitted, will trace through all the copies in the current room.
         * @param {boolean} [getAll] Whether to return all the intersections (true),
         * or return the first one.
         * @returns {Copy|Array<Copy>}
         */
        tracePolyline(polyline, cgroup, getAll) {
            const shape = {
                x: 0,
                y: 0,
                scale: {
                    x: 1, y: 1
                },
                rotation: 0,
                angle: 0,
                shape: {
                    type: 'strip',
                    points: polyline
                }
            };
            return ct.place.traceCustom(shape, true, cgroup, getAll);
        },
        /**
         * Tests for intersections with a point.
         * If `getAll` is set to `true`, returns all the copies that intersect
         * the point; otherwise, returns the first one that fits the conditions.
         *
         * @param {object} point An object with `x` and `y` properties.
         * @param {string} [cgroup] An optional collision group to trace against.
         * If omitted, will trace through all the copies in the current room.
         * @param {boolean} [getAll] Whether to return all the intersections (true),
         * or return the first one.
         * @returns {Copy|Array<Copy>}
         */
        tracePoint(point, cgroup, getAll) {
            const shape = {
                x: point.x,
                y: point.y,
                scale: {
                    x: 1, y: 1
                },
                rotation: 0,
                angle: 0,
                shape: {
                    type: 'point'
                }
            };
            return ct.place.traceCustom(shape, false, cgroup, getAll);
        }
    };
    // Aliases
    ct.place.traceRectange = ct.place.traceRect;
    // a magic procedure which tells 'go' function to change its direction
    setInterval(function switchCtPlaceGoDirection() {
        ct.place.m *= -1;
    }, 789);
})(ct);

/* eslint-disable no-mixed-operators */
/* eslint-disable no-bitwise */
ct.random = function random(x) {
    return Math.random() * x;
};
ct.u.ext(ct.random, {
    dice(...variants) {
        return variants[Math.floor(Math.random() * variants.length)];
    },
    histogram(...histogram) {
        const coeffs = [...histogram];
        let sumCoeffs = 0;
        for (let i = 0; i < coeffs.length; i++) {
            sumCoeffs += coeffs[i];
            if (i > 0) {
                coeffs[i] += coeffs[i - 1];
            }
        }
        const bucketPosition = Math.random() * sumCoeffs;
        var i;
        for (i = 0; i < coeffs.length; i++) {
            if (coeffs[i] > bucketPosition) {
                break;
            }
        }
        return i / coeffs.length + Math.random() / coeffs.length;
    },
    optimistic(exp) {
        return 1 - ct.random.pessimistic(exp);
    },
    pessimistic(exp) {
        exp = exp || 2;
        return Math.random() ** exp;
    },
    range(x1, x2) {
        return x1 + Math.random() * (x2 - x1);
    },
    deg() {
        return Math.random() * 360;
    },
    coord() {
        return [Math.floor(Math.random() * ct.width), Math.floor(Math.random() * ct.height)];
    },
    chance(x, y) {
        if (y) {
            return (Math.random() * y < x);
        }
        return (Math.random() * 100 < x);
    },
    from(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    },
    // Mulberry32, by bryc from https://stackoverflow.com/a/47593316
    createSeededRandomizer(a) {
        return function seededRandomizer() {
            var t = a += 0x6D2B79F5;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }
});
{
    const handle = {};
    handle.currentRootRandomizer = ct.random.createSeededRandomizer(456852);
    ct.random.seeded = function seeded() {
        return handle.currentRootRandomizer();
    };
    ct.random.setSeed = function setSeed(seed) {
        handle.currentRootRandomizer = ct.random.createSeededRandomizer(seed);
    };
    ct.random.setSeed(9323846264);
}

/* global Howler Howl */
(function ctHowler() {
    ct.sound = {};
    ct.sound.howler = Howler;
    Howler.orientation(0, -1, 0, 0, 0, 1);
    Howler.pos(0, 0, 0);
    ct.sound.howl = Howl;

    var defaultMaxDistance = [][0] || 2500;
    ct.sound.useDepth = [false][0] === void 0 ?
        false :
        [false][0];
    ct.sound.manageListenerPosition = [false][0] === void 0 ?
        true :
        [false][0];

    /**
     * Detects if a particular codec is supported in the system
     * @param {string} type One of: "mp3", "mpeg", "opus", "ogg", "oga", "wav",
     * "aac", "caf", m4a", "mp4", "weba", "webm", "dolby", "flac".
     * @returns {boolean} true/false
     */
    ct.sound.detect = Howler.codecs;

    /**
     * Creates a new Sound object and puts it in resource object
     *
     * @param {string} name Sound's name
     * @param {object} formats A collection of sound files of specified extension,
     * in format `extension: path`
     * @param {string} [formats.ogg] Local path to the sound in ogg format
     * @param {string} [formats.wav] Local path to the sound in wav format
     * @param {string} [formats.mp3] Local path to the sound in mp3 format
     * @param {object} options An options object
     *
     * @returns {object} Sound's object
     */
    ct.sound.init = function init(name, formats, options) {
        options = options || {};
        var sounds = [];
        if (formats.wav && formats.wav.slice(-4) === '.wav') {
            sounds.push(formats.wav);
        }
        if (formats.mp3 && formats.mp3.slice(-4) === '.mp3') {
            sounds.push(formats.mp3);
        }
        if (formats.ogg && formats.ogg.slice(-4) === '.ogg') {
            sounds.push(formats.ogg);
        }
        // Do not use music preferences for ct.js debugger
        var isMusic = !navigator.userAgent.startsWith('ct.js') && options.music;
        var howl = new Howl({
            src: sounds,
            autoplay: false,
            preload: !isMusic,
            html5: isMusic,
            loop: options.loop,
            pool: options.poolSize || 5,

            onload: function () {
                if (!isMusic) {
                    ct.res.soundsLoaded++;
                }
            },
            onloaderror: function () {
                ct.res.soundsError++;
                howl.buggy = true;
                console.error('[ct.sound.howler] Oh no! We couldn\'t load ' +
                    (formats.wav || formats.mp3 || formats.ogg) + '!');
            }
        });
        if (isMusic) {
            ct.res.soundsLoaded++;
        }
        ct.res.sounds[name] = howl;
    };

    var set3Dparameters = (howl, opts, id) => {
        howl.pannerAttr({
            coneInnerAngle: opts.coneInnerAngle || 360,
            coneOuterAngle: opts.coneOuterAngle || 360,
            coneOuterGain: opts.coneOuterGain || 1,
            distanceModel: opts.distanceModel || 'linear',
            maxDistance: opts.maxDistance || defaultMaxDistance,
            refDistance: opts.refDistance || 1,
            rolloffFactor: opts.rolloffFactor || 1,
            panningModel: opts.panningModel || 'HRTF'
        }, id);
    };
    /**
     * Spawns a new sound and plays it.
     *
     * @param {string} name The name of a sound to be played
     * @param {object} [opts] Options object.
     * @param {Function} [cb] A callback, which is called when the sound finishes playing
     *
     * @returns {number} The ID of the created sound. This can be passed to Howler methods.
     */
    ct.sound.spawn = function spawn(name, opts, cb) {
        opts = opts || {};
        if (typeof opts === 'function') {
            cb = opts;
            opts = {};
        }
        var howl = ct.res.sounds[name];
        var id = howl.play();
        if (opts.loop) {
            howl.loop(true, id);
        }
        if (opts.volume !== void 0) {
            howl.volume(opts.volume, id);
        }
        if (opts.rate !== void 0) {
            howl.rate(opts.rate, id);
        }
        if (opts.x !== void 0 || opts.position) {
            if (opts.x !== void 0) {
                howl.pos(opts.x, opts.y || 0, opts.z || 0, id);
            } else {
                const copy = opts.position;
                howl.pos(copy.x, copy.y, opts.z || (ct.sound.useDepth ? copy.depth : 0), id);
            }
            set3Dparameters(howl, opts, id);
        }
        if (cb) {
            howl.once('end', cb, id);
        }
        return id;
    };

    /**
     * Stops playback of a sound, resetting its time to 0.
     *
     * @param {string} name The name of a sound
     * @param {number} [id] An optional ID of a particular sound
     * @returns {void}
     */
    ct.sound.stop = function stop(name, id) {
        if (ct.sound.playing(name, id)) {
            ct.res.sounds[name].stop(id);
        }
    };

    /**
     * Pauses playback of a sound or group, saving the seek of playback.
     *
     * @param {string} name The name of a sound
     * @param {number} [id] An optional ID of a particular sound
     * @returns {void}
     */
    ct.sound.pause = function pause(name, id) {
        ct.res.sounds[name].pause(id);
    };

    /**
     * Resumes a given sound, e.g. after pausing it.
     *
     * @param {string} name The name of a sound
     * @param {number} [id] An optional ID of a particular sound
     * @returns {void}
     */
    ct.sound.resume = function resume(name, id) {
        ct.res.sounds[name].play(id);
    };
    /**
     * Returns whether a sound is currently playing,
     * either an exact sound (found by its ID) or any sound of a given name.
     *
     * @param {string} name The name of a sound
     * @param {number} [id] An optional ID of a particular sound
     * @returns {boolean} `true` if the sound is playing, `false` otherwise.
     */
    ct.sound.playing = function playing(name, id) {
        return ct.res.sounds[name].playing(id);
    };
    /**
     * Preloads a sound. This is usually applied to music files before playing
     * as they are not preloaded by default.
     *
     * @param {string} name The name of a sound
     * @returns {void}
     */
    ct.sound.load = function load(name) {
        ct.res.sounds[name].load();
    };


    /**
     * Changes/returns the volume of the given sound.
     *
     * @param {string} name The name of a sound to affect.
     * @param {number} [volume] The new volume from `0.0` to `1.0`.
     * If empty, will return the existing volume.
     * @param {number} [id] If specified, then only the given sound instance is affected.
     *
     * @returns {number} The current volume of the sound.
     */
    ct.sound.volume = function volume(name, volume, id) {
        return ct.res.sounds[name].volume(volume, id);
    };

    /**
     * Fades a sound to a given volume. Can affect either a specific instance or the whole group.
     *
     * @param {string} name The name of a sound to affect.
     * @param {number} newVolume The new volume from `0.0` to `1.0`.
     * @param {number} duration The duration of transition, in milliseconds.
     * @param {number} [id] If specified, then only the given sound instance is affected.
     *
     * @returns {void}
     */
    ct.sound.fade = function fade(name, newVolume, duration, id) {
        if (ct.sound.playing(name, id)) {
            var howl = ct.res.sounds[name],
                oldVolume = id ? howl.volume(id) : howl.volume;
            try {
                howl.fade(oldVolume, newVolume, duration, id);
            } catch (e) {
                // eslint-disable-next-line no-console
                console.warn('Could not reliably fade a sound, reason:', e);
                ct.sound.volume(name, newVolume, id);
            }
        }
    };

    /**
     * Moves the 3D listener to a new position.
     *
     * @see https://github.com/goldfire/howler.js#posx-y-z
     *
     * @param {number} x The new x coordinate
     * @param {number} y The new y coordinate
     * @param {number} [z] The new z coordinate
     *
     * @returns {void}
     */
    ct.sound.moveListener = function moveListener(x, y, z) {
        Howler.pos(x, y, z || 0);
    };

    /**
     * Moves a 3D sound to a new location
     *
     * @param {string} name The name of a sound to move
     * @param {number} id The ID of a particular sound.
     * Pass `null` if you want to affect all the sounds of a given name.
     * @param {number} x The new x coordinate
     * @param {number} y The new y coordinate
     * @param {number} [z] The new z coordinate
     *
     * @returns {void}
     */
    ct.sound.position = function position(name, id, x, y, z) {
        if (ct.sound.playing(name, id)) {
            var howl = ct.res.sounds[name],
                oldPosition = howl.pos(id);
            howl.pos(x, y, z || oldPosition[2], id);
        }
    };

    /**
     * Get/set the global volume for all sounds, relative to their own volume.
     * @param {number} [volume] The new volume from `0.0` to `1.0`.
     * If omitted, will return the current global volume.
     *
     * @returns {number} The current volume.
     */
    ct.sound.globalVolume = Howler.volume.bind(Howler);

    ct.sound.exists = function exists(name) {
        return (name in ct.res.sounds);
    };
})();

(function ctKeyboard() {
    var keyPrefix = 'keyboard.';
    var setKey = function (key, value) {
        ct.inputs.registry[keyPrefix + key] = value;
    };

    ct.keyboard = {
        string: '',
        lastKey: '',
        lastCode: '',
        alt: false,
        shift: false,
        ctrl: false,
        clear() {
            delete ct.keyboard.lastKey;
            delete ct.keyboard.lastCode;
            ct.keyboard.string = '';
            ct.keyboard.alt = false;
            ct.keyboard.shift = false;
            ct.keyboard.ctrl = false;
        },
        check: [],
        onDown(e) {
            ct.keyboard.shift = e.shiftKey;
            ct.keyboard.alt = e.altKey;
            ct.keyboard.ctrl = e.ctrlKey;
            ct.keyboard.lastKey = e.key;
            ct.keyboard.lastCode = e.code;
            if (e.code) {
                setKey(e.code, 1);
            } else {
                setKey('Unknown', 1);
            }
            if (e.key) {
                if (e.key.length === 1) {
                    ct.keyboard.string += e.key;
                } else if (e.key === 'Backspace') {
                    ct.keyboard.string = ct.keyboard.string.slice(0, -1);
                } else if (e.key === 'Enter') {
                    ct.keyboard.string = '';
                }
            }
            e.preventDefault();
        },
        onUp(e) {
            ct.keyboard.shift = e.shiftKey;
            ct.keyboard.alt = e.altKey;
            ct.keyboard.ctrl = e.ctrlKey;
            if (e.code) {
                setKey(e.code, 0);
            } else {
                setKey('Unknown', 0);
            }
            e.preventDefault();
        }
    };

    if (document.addEventListener) {
        document.addEventListener('keydown', ct.keyboard.onDown, false);
        document.addEventListener('keyup', ct.keyboard.onUp, false);
    } else {
        document.attachEvent('onkeydown', ct.keyboard.onDown);
        document.attachEvent('onkeyup', ct.keyboard.onUp);
    }
})();

(function(global) {
    'use strict';
  
    var nativeKeyboardEvent = ('KeyboardEvent' in global);
    if (!nativeKeyboardEvent)
      global.KeyboardEvent = function KeyboardEvent() { throw TypeError('Illegal constructor'); };
  
    [
      ['DOM_KEY_LOCATION_STANDARD', 0x00], // Default or unknown location
      ['DOM_KEY_LOCATION_LEFT', 0x01], // e.g. Left Alt key
      ['DOM_KEY_LOCATION_RIGHT', 0x02], // e.g. Right Alt key
      ['DOM_KEY_LOCATION_NUMPAD', 0x03], // e.g. Numpad 0 or +
    ].forEach(function(p) { if (!(p[0] in global.KeyboardEvent)) global.KeyboardEvent[p[0]] = p[1]; });
  
    var STANDARD = global.KeyboardEvent.DOM_KEY_LOCATION_STANDARD,
        LEFT = global.KeyboardEvent.DOM_KEY_LOCATION_LEFT,
        RIGHT = global.KeyboardEvent.DOM_KEY_LOCATION_RIGHT,
        NUMPAD = global.KeyboardEvent.DOM_KEY_LOCATION_NUMPAD;
  
    //--------------------------------------------------------------------
    //
    // Utilities
    //
    //--------------------------------------------------------------------
  
    function contains(s, ss) { return String(s).indexOf(ss) !== -1; }
  
    var os = (function() {
      if (contains(navigator.platform, 'Win')) { return 'win'; }
      if (contains(navigator.platform, 'Mac')) { return 'mac'; }
      if (contains(navigator.platform, 'CrOS')) { return 'cros'; }
      if (contains(navigator.platform, 'Linux')) { return 'linux'; }
      if (contains(navigator.userAgent, 'iPad') || contains(navigator.platform, 'iPod') || contains(navigator.platform, 'iPhone')) { return 'ios'; }
      return '';
    } ());
  
    var browser = (function() {
      if (contains(navigator.userAgent, 'Chrome/')) { return 'chrome'; }
      if (contains(navigator.vendor, 'Apple')) { return 'safari'; }
      if (contains(navigator.userAgent, 'MSIE')) { return 'ie'; }
      if (contains(navigator.userAgent, 'Gecko/')) { return 'moz'; }
      if (contains(navigator.userAgent, 'Opera/')) { return 'opera'; }
      return '';
    } ());
  
    var browser_os = browser + '-' + os;
  
    function mergeIf(baseTable, select, table) {
      if (browser_os === select || browser === select || os === select) {
        Object.keys(table).forEach(function(keyCode) {
          baseTable[keyCode] = table[keyCode];
        });
      }
    }
  
    function remap(o, key) {
      var r = {};
      Object.keys(o).forEach(function(k) {
        var item = o[k];
        if (key in item) {
          r[item[key]] = item;
        }
      });
      return r;
    }
  
    function invert(o) {
      var r = {};
      Object.keys(o).forEach(function(k) {
        r[o[k]] = k;
      });
      return r;
    }
  
    //--------------------------------------------------------------------
    //
    // Generic Mappings
    //
    //--------------------------------------------------------------------
  
    // "keyInfo" is a dictionary:
    //   code: string - name from UI Events KeyboardEvent code Values
    //     https://w3c.github.io/uievents-code/
    //   location (optional): number - one of the DOM_KEY_LOCATION values
    //   keyCap (optional): string - keyboard label in en-US locale
    // USB code Usage ID from page 0x07 unless otherwise noted (Informative)
  
    // Map of keyCode to keyInfo
    var keyCodeToInfoTable = {
      // 0x01 - VK_LBUTTON
      // 0x02 - VK_RBUTTON
      0x03: { code: 'Cancel' }, // [USB: 0x9b] char \x0018 ??? (Not in D3E)
      // 0x04 - VK_MBUTTON
      // 0x05 - VK_XBUTTON1
      // 0x06 - VK_XBUTTON2
      0x06: { code: 'Help' }, // [USB: 0x75] ???
      // 0x07 - undefined
      0x08: { code: 'Backspace' }, // [USB: 0x2a] Labelled Delete on Macintosh keyboards.
      0x09: { code: 'Tab' }, // [USB: 0x2b]
      // 0x0A-0x0B - reserved
      0X0C: { code: 'Clear' }, // [USB: 0x9c] NumPad Center (Not in D3E)
      0X0D: { code: 'Enter' }, // [USB: 0x28]
      // 0x0E-0x0F - undefined
  
      0x10: { code: 'Shift' },
      0x11: { code: 'Control' },
      0x12: { code: 'Alt' },
      0x13: { code: 'Pause' }, // [USB: 0x48]
      0x14: { code: 'CapsLock' }, // [USB: 0x39]
      0x15: { code: 'KanaMode' }, // [USB: 0x88]
      0x16: { code: 'Lang1' }, // [USB: 0x90]
      // 0x17: VK_JUNJA
      // 0x18: VK_FINAL
      0x19: { code: 'Lang2' }, // [USB: 0x91]
      // 0x1A - undefined
      0x1B: { code: 'Escape' }, // [USB: 0x29]
      0x1C: { code: 'Convert' }, // [USB: 0x8a]
      0x1D: { code: 'NonConvert' }, // [USB: 0x8b]
      0x1E: { code: 'Accept' }, // [USB: ????]
      0x1F: { code: 'ModeChange' }, // [USB: ????]
  
      0x20: { code: 'Space' }, // [USB: 0x2c]
      0x21: { code: 'PageUp' }, // [USB: 0x4b]
      0x22: { code: 'PageDown' }, // [USB: 0x4e]
      0x23: { code: 'End' }, // [USB: 0x4d]
      0x24: { code: 'Home' }, // [USB: 0x4a]
      0x25: { code: 'ArrowLeft' }, // [USB: 0x50]
      0x26: { code: 'ArrowUp' }, // [USB: 0x52]
      0x27: { code: 'ArrowRight' }, // [USB: 0x4f]
      0x28: { code: 'ArrowDown' }, // [USB: 0x51]
      0x29: { code: 'Select' }, // (Not in D3E)
      0x2A: { code: 'Print' }, // (Not in D3E)
      0x2B: { code: 'Execute' }, // [USB: 0x74] (Not in D3E)
      0x2C: { code: 'PrintScreen' }, // [USB: 0x46]
      0x2D: { code: 'Insert' }, // [USB: 0x49]
      0x2E: { code: 'Delete' }, // [USB: 0x4c]
      0x2F: { code: 'Help' }, // [USB: 0x75] ???
  
      0x30: { code: 'Digit0', keyCap: '0' }, // [USB: 0x27] 0)
      0x31: { code: 'Digit1', keyCap: '1' }, // [USB: 0x1e] 1!
      0x32: { code: 'Digit2', keyCap: '2' }, // [USB: 0x1f] 2@
      0x33: { code: 'Digit3', keyCap: '3' }, // [USB: 0x20] 3#
      0x34: { code: 'Digit4', keyCap: '4' }, // [USB: 0x21] 4$
      0x35: { code: 'Digit5', keyCap: '5' }, // [USB: 0x22] 5%
      0x36: { code: 'Digit6', keyCap: '6' }, // [USB: 0x23] 6^
      0x37: { code: 'Digit7', keyCap: '7' }, // [USB: 0x24] 7&
      0x38: { code: 'Digit8', keyCap: '8' }, // [USB: 0x25] 8*
      0x39: { code: 'Digit9', keyCap: '9' }, // [USB: 0x26] 9(
      // 0x3A-0x40 - undefined
  
      0x41: { code: 'KeyA', keyCap: 'a' }, // [USB: 0x04]
      0x42: { code: 'KeyB', keyCap: 'b' }, // [USB: 0x05]
      0x43: { code: 'KeyC', keyCap: 'c' }, // [USB: 0x06]
      0x44: { code: 'KeyD', keyCap: 'd' }, // [USB: 0x07]
      0x45: { code: 'KeyE', keyCap: 'e' }, // [USB: 0x08]
      0x46: { code: 'KeyF', keyCap: 'f' }, // [USB: 0x09]
      0x47: { code: 'KeyG', keyCap: 'g' }, // [USB: 0x0a]
      0x48: { code: 'KeyH', keyCap: 'h' }, // [USB: 0x0b]
      0x49: { code: 'KeyI', keyCap: 'i' }, // [USB: 0x0c]
      0x4A: { code: 'KeyJ', keyCap: 'j' }, // [USB: 0x0d]
      0x4B: { code: 'KeyK', keyCap: 'k' }, // [USB: 0x0e]
      0x4C: { code: 'KeyL', keyCap: 'l' }, // [USB: 0x0f]
      0x4D: { code: 'KeyM', keyCap: 'm' }, // [USB: 0x10]
      0x4E: { code: 'KeyN', keyCap: 'n' }, // [USB: 0x11]
      0x4F: { code: 'KeyO', keyCap: 'o' }, // [USB: 0x12]
  
      0x50: { code: 'KeyP', keyCap: 'p' }, // [USB: 0x13]
      0x51: { code: 'KeyQ', keyCap: 'q' }, // [USB: 0x14]
      0x52: { code: 'KeyR', keyCap: 'r' }, // [USB: 0x15]
      0x53: { code: 'KeyS', keyCap: 's' }, // [USB: 0x16]
      0x54: { code: 'KeyT', keyCap: 't' }, // [USB: 0x17]
      0x55: { code: 'KeyU', keyCap: 'u' }, // [USB: 0x18]
      0x56: { code: 'KeyV', keyCap: 'v' }, // [USB: 0x19]
      0x57: { code: 'KeyW', keyCap: 'w' }, // [USB: 0x1a]
      0x58: { code: 'KeyX', keyCap: 'x' }, // [USB: 0x1b]
      0x59: { code: 'KeyY', keyCap: 'y' }, // [USB: 0x1c]
      0x5A: { code: 'KeyZ', keyCap: 'z' }, // [USB: 0x1d]
      0x5B: { code: 'MetaLeft', location: LEFT }, // [USB: 0xe3]
      0x5C: { code: 'MetaRight', location: RIGHT }, // [USB: 0xe7]
      0x5D: { code: 'ContextMenu' }, // [USB: 0x65] Context Menu
      // 0x5E - reserved
      0x5F: { code: 'Standby' }, // [USB: 0x82] Sleep
  
      0x60: { code: 'Numpad0', keyCap: '0', location: NUMPAD }, // [USB: 0x62]
      0x61: { code: 'Numpad1', keyCap: '1', location: NUMPAD }, // [USB: 0x59]
      0x62: { code: 'Numpad2', keyCap: '2', location: NUMPAD }, // [USB: 0x5a]
      0x63: { code: 'Numpad3', keyCap: '3', location: NUMPAD }, // [USB: 0x5b]
      0x64: { code: 'Numpad4', keyCap: '4', location: NUMPAD }, // [USB: 0x5c]
      0x65: { code: 'Numpad5', keyCap: '5', location: NUMPAD }, // [USB: 0x5d]
      0x66: { code: 'Numpad6', keyCap: '6', location: NUMPAD }, // [USB: 0x5e]
      0x67: { code: 'Numpad7', keyCap: '7', location: NUMPAD }, // [USB: 0x5f]
      0x68: { code: 'Numpad8', keyCap: '8', location: NUMPAD }, // [USB: 0x60]
      0x69: { code: 'Numpad9', keyCap: '9', location: NUMPAD }, // [USB: 0x61]
      0x6A: { code: 'NumpadMultiply', keyCap: '*', location: NUMPAD }, // [USB: 0x55]
      0x6B: { code: 'NumpadAdd', keyCap: '+', location: NUMPAD }, // [USB: 0x57]
      0x6C: { code: 'NumpadComma', keyCap: ',', location: NUMPAD }, // [USB: 0x85]
      0x6D: { code: 'NumpadSubtract', keyCap: '-', location: NUMPAD }, // [USB: 0x56]
      0x6E: { code: 'NumpadDecimal', keyCap: '.', location: NUMPAD }, // [USB: 0x63]
      0x6F: { code: 'NumpadDivide', keyCap: '/', location: NUMPAD }, // [USB: 0x54]
  
      0x70: { code: 'F1' }, // [USB: 0x3a]
      0x71: { code: 'F2' }, // [USB: 0x3b]
      0x72: { code: 'F3' }, // [USB: 0x3c]
      0x73: { code: 'F4' }, // [USB: 0x3d]
      0x74: { code: 'F5' }, // [USB: 0x3e]
      0x75: { code: 'F6' }, // [USB: 0x3f]
      0x76: { code: 'F7' }, // [USB: 0x40]
      0x77: { code: 'F8' }, // [USB: 0x41]
      0x78: { code: 'F9' }, // [USB: 0x42]
      0x79: { code: 'F10' }, // [USB: 0x43]
      0x7A: { code: 'F11' }, // [USB: 0x44]
      0x7B: { code: 'F12' }, // [USB: 0x45]
      0x7C: { code: 'F13' }, // [USB: 0x68]
      0x7D: { code: 'F14' }, // [USB: 0x69]
      0x7E: { code: 'F15' }, // [USB: 0x6a]
      0x7F: { code: 'F16' }, // [USB: 0x6b]
  
      0x80: { code: 'F17' }, // [USB: 0x6c]
      0x81: { code: 'F18' }, // [USB: 0x6d]
      0x82: { code: 'F19' }, // [USB: 0x6e]
      0x83: { code: 'F20' }, // [USB: 0x6f]
      0x84: { code: 'F21' }, // [USB: 0x70]
      0x85: { code: 'F22' }, // [USB: 0x71]
      0x86: { code: 'F23' }, // [USB: 0x72]
      0x87: { code: 'F24' }, // [USB: 0x73]
      // 0x88-0x8F - unassigned
  
      0x90: { code: 'NumLock', location: NUMPAD }, // [USB: 0x53]
      0x91: { code: 'ScrollLock' }, // [USB: 0x47]
      // 0x92-0x96 - OEM specific
      // 0x97-0x9F - unassigned
  
      // NOTE: 0xA0-0xA5 usually mapped to 0x10-0x12 in browsers
      0xA0: { code: 'ShiftLeft', location: LEFT }, // [USB: 0xe1]
      0xA1: { code: 'ShiftRight', location: RIGHT }, // [USB: 0xe5]
      0xA2: { code: 'ControlLeft', location: LEFT }, // [USB: 0xe0]
      0xA3: { code: 'ControlRight', location: RIGHT }, // [USB: 0xe4]
      0xA4: { code: 'AltLeft', location: LEFT }, // [USB: 0xe2]
      0xA5: { code: 'AltRight', location: RIGHT }, // [USB: 0xe6]
  
      0xA6: { code: 'BrowserBack' }, // [USB: 0x0c/0x0224]
      0xA7: { code: 'BrowserForward' }, // [USB: 0x0c/0x0225]
      0xA8: { code: 'BrowserRefresh' }, // [USB: 0x0c/0x0227]
      0xA9: { code: 'BrowserStop' }, // [USB: 0x0c/0x0226]
      0xAA: { code: 'BrowserSearch' }, // [USB: 0x0c/0x0221]
      0xAB: { code: 'BrowserFavorites' }, // [USB: 0x0c/0x0228]
      0xAC: { code: 'BrowserHome' }, // [USB: 0x0c/0x0222]
      0xAD: { code: 'AudioVolumeMute' }, // [USB: 0x7f]
      0xAE: { code: 'AudioVolumeDown' }, // [USB: 0x81]
      0xAF: { code: 'AudioVolumeUp' }, // [USB: 0x80]
  
      0xB0: { code: 'MediaTrackNext' }, // [USB: 0x0c/0x00b5]
      0xB1: { code: 'MediaTrackPrevious' }, // [USB: 0x0c/0x00b6]
      0xB2: { code: 'MediaStop' }, // [USB: 0x0c/0x00b7]
      0xB3: { code: 'MediaPlayPause' }, // [USB: 0x0c/0x00cd]
      0xB4: { code: 'LaunchMail' }, // [USB: 0x0c/0x018a]
      0xB5: { code: 'MediaSelect' },
      0xB6: { code: 'LaunchApp1' },
      0xB7: { code: 'LaunchApp2' },
      // 0xB8-0xB9 - reserved
      0xBA: { code: 'Semicolon',  keyCap: ';' }, // [USB: 0x33] ;: (US Standard 101)
      0xBB: { code: 'Equal', keyCap: '=' }, // [USB: 0x2e] =+
      0xBC: { code: 'Comma', keyCap: ',' }, // [USB: 0x36] ,<
      0xBD: { code: 'Minus', keyCap: '-' }, // [USB: 0x2d] -_
      0xBE: { code: 'Period', keyCap: '.' }, // [USB: 0x37] .>
      0xBF: { code: 'Slash', keyCap: '/' }, // [USB: 0x38] /? (US Standard 101)
  
      0xC0: { code: 'Backquote', keyCap: '`' }, // [USB: 0x35] `~ (US Standard 101)
      // 0xC1-0xCF - reserved
  
      // 0xD0-0xD7 - reserved
      // 0xD8-0xDA - unassigned
      0xDB: { code: 'BracketLeft', keyCap: '[' }, // [USB: 0x2f] [{ (US Standard 101)
      0xDC: { code: 'Backslash',  keyCap: '\\' }, // [USB: 0x31] \| (US Standard 101)
      0xDD: { code: 'BracketRight', keyCap: ']' }, // [USB: 0x30] ]} (US Standard 101)
      0xDE: { code: 'Quote', keyCap: '\'' }, // [USB: 0x34] '" (US Standard 101)
      // 0xDF - miscellaneous/varies
  
      // 0xE0 - reserved
      // 0xE1 - OEM specific
      0xE2: { code: 'IntlBackslash',  keyCap: '\\' }, // [USB: 0x64] \| (UK Standard 102)
      // 0xE3-0xE4 - OEM specific
      0xE5: { code: 'Process' }, // (Not in D3E)
      // 0xE6 - OEM specific
      // 0xE7 - VK_PACKET
      // 0xE8 - unassigned
      // 0xE9-0xEF - OEM specific
  
      // 0xF0-0xF5 - OEM specific
      0xF6: { code: 'Attn' }, // [USB: 0x9a] (Not in D3E)
      0xF7: { code: 'CrSel' }, // [USB: 0xa3] (Not in D3E)
      0xF8: { code: 'ExSel' }, // [USB: 0xa4] (Not in D3E)
      0xF9: { code: 'EraseEof' }, // (Not in D3E)
      0xFA: { code: 'Play' }, // (Not in D3E)
      0xFB: { code: 'ZoomToggle' }, // (Not in D3E)
      // 0xFC - VK_NONAME - reserved
      // 0xFD - VK_PA1
      0xFE: { code: 'Clear' } // [USB: 0x9c] (Not in D3E)
    };
  
    // No legacy keyCode, but listed in D3E:
  
    // code: usb
    // 'IntlHash': 0x070032,
    // 'IntlRo': 0x070087,
    // 'IntlYen': 0x070089,
    // 'NumpadBackspace': 0x0700bb,
    // 'NumpadClear': 0x0700d8,
    // 'NumpadClearEntry': 0x0700d9,
    // 'NumpadMemoryAdd': 0x0700d3,
    // 'NumpadMemoryClear': 0x0700d2,
    // 'NumpadMemoryRecall': 0x0700d1,
    // 'NumpadMemoryStore': 0x0700d0,
    // 'NumpadMemorySubtract': 0x0700d4,
    // 'NumpadParenLeft': 0x0700b6,
    // 'NumpadParenRight': 0x0700b7,
  
    //--------------------------------------------------------------------
    //
    // Browser/OS Specific Mappings
    //
    //--------------------------------------------------------------------
  
    mergeIf(keyCodeToInfoTable,
            'moz', {
              0x3B: { code: 'Semicolon', keyCap: ';' }, // [USB: 0x33] ;: (US Standard 101)
              0x3D: { code: 'Equal', keyCap: '=' }, // [USB: 0x2e] =+
              0x6B: { code: 'Equal', keyCap: '=' }, // [USB: 0x2e] =+
              0x6D: { code: 'Minus', keyCap: '-' }, // [USB: 0x2d] -_
              0xBB: { code: 'NumpadAdd', keyCap: '+', location: NUMPAD }, // [USB: 0x57]
              0xBD: { code: 'NumpadSubtract', keyCap: '-', location: NUMPAD } // [USB: 0x56]
            });
  
    mergeIf(keyCodeToInfoTable,
            'moz-mac', {
              0x0C: { code: 'NumLock', location: NUMPAD }, // [USB: 0x53]
              0xAD: { code: 'Minus', keyCap: '-' } // [USB: 0x2d] -_
            });
  
    mergeIf(keyCodeToInfoTable,
            'moz-win', {
              0xAD: { code: 'Minus', keyCap: '-' } // [USB: 0x2d] -_
            });
  
    mergeIf(keyCodeToInfoTable,
            'chrome-mac', {
              0x5D: { code: 'MetaRight', location: RIGHT } // [USB: 0xe7]
            });
  
    // Windows via Bootcamp (!)
    if (0) {
      mergeIf(keyCodeToInfoTable,
              'chrome-win', {
                0xC0: { code: 'Quote', keyCap: '\'' }, // [USB: 0x34] '" (US Standard 101)
                0xDE: { code: 'Backslash',  keyCap: '\\' }, // [USB: 0x31] \| (US Standard 101)
                0xDF: { code: 'Backquote', keyCap: '`' } // [USB: 0x35] `~ (US Standard 101)
              });
  
      mergeIf(keyCodeToInfoTable,
              'ie', {
                0xC0: { code: 'Quote', keyCap: '\'' }, // [USB: 0x34] '" (US Standard 101)
                0xDE: { code: 'Backslash',  keyCap: '\\' }, // [USB: 0x31] \| (US Standard 101)
                0xDF: { code: 'Backquote', keyCap: '`' } // [USB: 0x35] `~ (US Standard 101)
              });
    }
  
    mergeIf(keyCodeToInfoTable,
            'safari', {
              0x03: { code: 'Enter' }, // [USB: 0x28] old Safari
              0x19: { code: 'Tab' } // [USB: 0x2b] old Safari for Shift+Tab
            });
  
    mergeIf(keyCodeToInfoTable,
            'ios', {
              0x0A: { code: 'Enter', location: STANDARD } // [USB: 0x28]
            });
  
    mergeIf(keyCodeToInfoTable,
            'safari-mac', {
              0x5B: { code: 'MetaLeft', location: LEFT }, // [USB: 0xe3]
              0x5D: { code: 'MetaRight', location: RIGHT }, // [USB: 0xe7]
              0xE5: { code: 'KeyQ', keyCap: 'Q' } // [USB: 0x14] On alternate presses, Ctrl+Q sends this
            });
  
    //--------------------------------------------------------------------
    //
    // Identifier Mappings
    //
    //--------------------------------------------------------------------
  
    // Cases where newer-ish browsers send keyIdentifier which can be
    // used to disambiguate keys.
  
    // keyIdentifierTable[keyIdentifier] -> keyInfo
  
    var keyIdentifierTable = {};
    if ('cros' === os) {
      keyIdentifierTable['U+00A0'] = { code: 'ShiftLeft', location: LEFT };
      keyIdentifierTable['U+00A1'] = { code: 'ShiftRight', location: RIGHT };
      keyIdentifierTable['U+00A2'] = { code: 'ControlLeft', location: LEFT };
      keyIdentifierTable['U+00A3'] = { code: 'ControlRight', location: RIGHT };
      keyIdentifierTable['U+00A4'] = { code: 'AltLeft', location: LEFT };
      keyIdentifierTable['U+00A5'] = { code: 'AltRight', location: RIGHT };
    }
    if ('chrome-mac' === browser_os) {
      keyIdentifierTable['U+0010'] = { code: 'ContextMenu' };
    }
    if ('safari-mac' === browser_os) {
      keyIdentifierTable['U+0010'] = { code: 'ContextMenu' };
    }
    if ('ios' === os) {
      // These only generate keyup events
      keyIdentifierTable['U+0010'] = { code: 'Function' };
  
      keyIdentifierTable['U+001C'] = { code: 'ArrowLeft' };
      keyIdentifierTable['U+001D'] = { code: 'ArrowRight' };
      keyIdentifierTable['U+001E'] = { code: 'ArrowUp' };
      keyIdentifierTable['U+001F'] = { code: 'ArrowDown' };
  
      keyIdentifierTable['U+0001'] = { code: 'Home' }; // [USB: 0x4a] Fn + ArrowLeft
      keyIdentifierTable['U+0004'] = { code: 'End' }; // [USB: 0x4d] Fn + ArrowRight
      keyIdentifierTable['U+000B'] = { code: 'PageUp' }; // [USB: 0x4b] Fn + ArrowUp
      keyIdentifierTable['U+000C'] = { code: 'PageDown' }; // [USB: 0x4e] Fn + ArrowDown
    }
  
    //--------------------------------------------------------------------
    //
    // Location Mappings
    //
    //--------------------------------------------------------------------
  
    // Cases where newer-ish browsers send location/keyLocation which
    // can be used to disambiguate keys.
  
    // locationTable[location][keyCode] -> keyInfo
    var locationTable = [];
    locationTable[LEFT] = {
      0x10: { code: 'ShiftLeft', location: LEFT }, // [USB: 0xe1]
      0x11: { code: 'ControlLeft', location: LEFT }, // [USB: 0xe0]
      0x12: { code: 'AltLeft', location: LEFT } // [USB: 0xe2]
    };
    locationTable[RIGHT] = {
      0x10: { code: 'ShiftRight', location: RIGHT }, // [USB: 0xe5]
      0x11: { code: 'ControlRight', location: RIGHT }, // [USB: 0xe4]
      0x12: { code: 'AltRight', location: RIGHT } // [USB: 0xe6]
    };
    locationTable[NUMPAD] = {
      0x0D: { code: 'NumpadEnter', location: NUMPAD } // [USB: 0x58]
    };
  
    mergeIf(locationTable[NUMPAD], 'moz', {
      0x6D: { code: 'NumpadSubtract', location: NUMPAD }, // [USB: 0x56]
      0x6B: { code: 'NumpadAdd', location: NUMPAD } // [USB: 0x57]
    });
    mergeIf(locationTable[LEFT], 'moz-mac', {
      0xE0: { code: 'MetaLeft', location: LEFT } // [USB: 0xe3]
    });
    mergeIf(locationTable[RIGHT], 'moz-mac', {
      0xE0: { code: 'MetaRight', location: RIGHT } // [USB: 0xe7]
    });
    mergeIf(locationTable[RIGHT], 'moz-win', {
      0x5B: { code: 'MetaRight', location: RIGHT } // [USB: 0xe7]
    });
  
  
    mergeIf(locationTable[RIGHT], 'mac', {
      0x5D: { code: 'MetaRight', location: RIGHT } // [USB: 0xe7]
    });
  
    mergeIf(locationTable[NUMPAD], 'chrome-mac', {
      0x0C: { code: 'NumLock', location: NUMPAD } // [USB: 0x53]
    });
  
    mergeIf(locationTable[NUMPAD], 'safari-mac', {
      0x0C: { code: 'NumLock', location: NUMPAD }, // [USB: 0x53]
      0xBB: { code: 'NumpadAdd', location: NUMPAD }, // [USB: 0x57]
      0xBD: { code: 'NumpadSubtract', location: NUMPAD }, // [USB: 0x56]
      0xBE: { code: 'NumpadDecimal', location: NUMPAD }, // [USB: 0x63]
      0xBF: { code: 'NumpadDivide', location: NUMPAD } // [USB: 0x54]
    });
  
  
    //--------------------------------------------------------------------
    //
    // Key Values
    //
    //--------------------------------------------------------------------
  
    // Mapping from `code` values to `key` values. Values defined at:
    // https://w3c.github.io/uievents-key/
    // Entries are only provided when `key` differs from `code`. If
    // printable, `shiftKey` has the shifted printable character. This
    // assumes US Standard 101 layout
  
    var codeToKeyTable = {
      // Modifier Keys
      ShiftLeft: { key: 'Shift' },
      ShiftRight: { key: 'Shift' },
      ControlLeft: { key: 'Control' },
      ControlRight: { key: 'Control' },
      AltLeft: { key: 'Alt' },
      AltRight: { key: 'Alt' },
      MetaLeft: { key: 'Meta' },
      MetaRight: { key: 'Meta' },
  
      // Whitespace Keys
      NumpadEnter: { key: 'Enter' },
      Space: { key: ' ' },
  
      // Printable Keys
      Digit0: { key: '0', shiftKey: ')' },
      Digit1: { key: '1', shiftKey: '!' },
      Digit2: { key: '2', shiftKey: '@' },
      Digit3: { key: '3', shiftKey: '#' },
      Digit4: { key: '4', shiftKey: '$' },
      Digit5: { key: '5', shiftKey: '%' },
      Digit6: { key: '6', shiftKey: '^' },
      Digit7: { key: '7', shiftKey: '&' },
      Digit8: { key: '8', shiftKey: '*' },
      Digit9: { key: '9', shiftKey: '(' },
      KeyA: { key: 'a', shiftKey: 'A' },
      KeyB: { key: 'b', shiftKey: 'B' },
      KeyC: { key: 'c', shiftKey: 'C' },
      KeyD: { key: 'd', shiftKey: 'D' },
      KeyE: { key: 'e', shiftKey: 'E' },
      KeyF: { key: 'f', shiftKey: 'F' },
      KeyG: { key: 'g', shiftKey: 'G' },
      KeyH: { key: 'h', shiftKey: 'H' },
      KeyI: { key: 'i', shiftKey: 'I' },
      KeyJ: { key: 'j', shiftKey: 'J' },
      KeyK: { key: 'k', shiftKey: 'K' },
      KeyL: { key: 'l', shiftKey: 'L' },
      KeyM: { key: 'm', shiftKey: 'M' },
      KeyN: { key: 'n', shiftKey: 'N' },
      KeyO: { key: 'o', shiftKey: 'O' },
      KeyP: { key: 'p', shiftKey: 'P' },
      KeyQ: { key: 'q', shiftKey: 'Q' },
      KeyR: { key: 'r', shiftKey: 'R' },
      KeyS: { key: 's', shiftKey: 'S' },
      KeyT: { key: 't', shiftKey: 'T' },
      KeyU: { key: 'u', shiftKey: 'U' },
      KeyV: { key: 'v', shiftKey: 'V' },
      KeyW: { key: 'w', shiftKey: 'W' },
      KeyX: { key: 'x', shiftKey: 'X' },
      KeyY: { key: 'y', shiftKey: 'Y' },
      KeyZ: { key: 'z', shiftKey: 'Z' },
      Numpad0: { key: '0' },
      Numpad1: { key: '1' },
      Numpad2: { key: '2' },
      Numpad3: { key: '3' },
      Numpad4: { key: '4' },
      Numpad5: { key: '5' },
      Numpad6: { key: '6' },
      Numpad7: { key: '7' },
      Numpad8: { key: '8' },
      Numpad9: { key: '9' },
      NumpadMultiply: { key: '*' },
      NumpadAdd: { key: '+' },
      NumpadComma: { key: ',' },
      NumpadSubtract: { key: '-' },
      NumpadDecimal: { key: '.' },
      NumpadDivide: { key: '/' },
      Semicolon: { key: ';', shiftKey: ':' },
      Equal: { key: '=', shiftKey: '+' },
      Comma: { key: ',', shiftKey: '<' },
      Minus: { key: '-', shiftKey: '_' },
      Period: { key: '.', shiftKey: '>' },
      Slash: { key: '/', shiftKey: '?' },
      Backquote: { key: '`', shiftKey: '~' },
      BracketLeft: { key: '[', shiftKey: '{' },
      Backslash: { key: '\\', shiftKey: '|' },
      BracketRight: { key: ']', shiftKey: '}' },
      Quote: { key: '\'', shiftKey: '"' },
      IntlBackslash: { key: '\\', shiftKey: '|' }
    };
  
    mergeIf(codeToKeyTable, 'mac', {
      MetaLeft: { key: 'Meta' },
      MetaRight: { key: 'Meta' }
    });
  
    // Corrections for 'key' names in older browsers (e.g. FF36-, IE9, etc)
    // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent.key#Key_values
    var keyFixTable = {
      Add: '+',
      Decimal: '.',
      Divide: '/',
      Subtract: '-',
      Multiply: '*',
      Spacebar: ' ',
      Esc: 'Escape',
      Nonconvert: 'NonConvert',
      Left: 'ArrowLeft',
      Up: 'ArrowUp',
      Right: 'ArrowRight',
      Down: 'ArrowDown',
      Del: 'Delete',
      Menu: 'ContextMenu',
      MediaNextTrack: 'MediaTrackNext',
      MediaPreviousTrack: 'MediaTrackPrevious',
      SelectMedia: 'MediaSelect',
      HalfWidth: 'Hankaku',
      FullWidth: 'Zenkaku',
      RomanCharacters: 'Romaji',
      Crsel: 'CrSel',
      Exsel: 'ExSel',
      Zoom: 'ZoomToggle'
    };
  
    //--------------------------------------------------------------------
    //
    // Exported Functions
    //
    //--------------------------------------------------------------------
  
  
    var codeTable = remap(keyCodeToInfoTable, 'code');
  
    try {
      var nativeLocation = nativeKeyboardEvent && ('location' in new KeyboardEvent(''));
    } catch (_) {}
  
    function keyInfoForEvent(event) {
      var keyCode = 'keyCode' in event ? event.keyCode : 'which' in event ? event.which : 0;
      var keyInfo = (function(){
        if (nativeLocation || 'keyLocation' in event) {
          var location = nativeLocation ? event.location : event.keyLocation;
          if (location && keyCode in locationTable[location]) {
            return locationTable[location][keyCode];
          }
        }
        if ('keyIdentifier' in event && event.keyIdentifier in keyIdentifierTable) {
          return keyIdentifierTable[event.keyIdentifier];
        }
        if (keyCode in keyCodeToInfoTable) {
          return keyCodeToInfoTable[keyCode];
        }
        return null;
      }());
  
      // TODO: Track these down and move to general tables
      if (0) {
        // TODO: Map these for newerish browsers?
        // TODO: iOS only?
        // TODO: Override with more common keyIdentifier name?
        switch (event.keyIdentifier) {
        case 'U+0010': keyInfo = { code: 'Function' }; break;
        case 'U+001C': keyInfo = { code: 'ArrowLeft' }; break;
        case 'U+001D': keyInfo = { code: 'ArrowRight' }; break;
        case 'U+001E': keyInfo = { code: 'ArrowUp' }; break;
        case 'U+001F': keyInfo = { code: 'ArrowDown' }; break;
        }
      }
  
      if (!keyInfo)
        return null;
  
      var key = (function() {
        var entry = codeToKeyTable[keyInfo.code];
        if (!entry) return keyInfo.code;
        return (event.shiftKey && 'shiftKey' in entry) ? entry.shiftKey : entry.key;
      }());
  
      return {
        code: keyInfo.code,
        key: key,
        location: keyInfo.location,
        keyCap: keyInfo.keyCap
      };
    }
  
    function queryKeyCap(code, locale) {
      code = String(code);
      if (!codeTable.hasOwnProperty(code)) return 'Undefined';
      if (locale && String(locale).toLowerCase() !== 'en-us') throw Error('Unsupported locale');
      var keyInfo = codeTable[code];
      return keyInfo.keyCap || keyInfo.code || 'Undefined';
    }
  
    if ('KeyboardEvent' in global && 'defineProperty' in Object) {
      (function() {
        function define(o, p, v) {
          if (p in o) return;
          Object.defineProperty(o, p, v);
        }
  
        define(KeyboardEvent.prototype, 'code', { get: function() {
          var keyInfo = keyInfoForEvent(this);
          return keyInfo ? keyInfo.code : '';
        }});
  
        // Fix for nonstandard `key` values (FF36-)
        if ('key' in KeyboardEvent.prototype) {
          var desc = Object.getOwnPropertyDescriptor(KeyboardEvent.prototype, 'key');
          Object.defineProperty(KeyboardEvent.prototype, 'key', { get: function() {
            var key = desc.get.call(this);
            return keyFixTable.hasOwnProperty(key) ? keyFixTable[key] : key;
          }});
        }
  
        define(KeyboardEvent.prototype, 'key', { get: function() {
          var keyInfo = keyInfoForEvent(this);
          return (keyInfo && 'key' in keyInfo) ? keyInfo.key : 'Unidentified';
        }});
  
        define(KeyboardEvent.prototype, 'location', { get: function() {
          var keyInfo = keyInfoForEvent(this);
          return (keyInfo && 'location' in keyInfo) ? keyInfo.location : STANDARD;
        }});
  
        define(KeyboardEvent.prototype, 'locale', { get: function() {
          return '';
        }});
      }());
    }
  
    if (!('queryKeyCap' in global.KeyboardEvent))
      global.KeyboardEvent.queryKeyCap = queryKeyCap;
  
    // Helper for IE8-
    global.identifyKey = function(event) {
      if ('code' in event)
        return;
  
      var keyInfo = keyInfoForEvent(event);
      event.code = keyInfo ? keyInfo.code : '';
      event.key = (keyInfo && 'key' in keyInfo) ? keyInfo.key : 'Unidentified';
      event.location = ('location' in event) ? event.location :
        ('keyLocation' in event) ? event.keyLocation :
        (keyInfo && 'location' in keyInfo) ? keyInfo.location : STANDARD;
      event.locale = '';
    };
  
  }(self));
  
(function ctVkeys() {
    ct.vkeys = {
        button(options) {
            var opts = ct.u.ext({
                key: 'Vk1',
                depth: 100,
                texNormal: -1,
                x: 128,
                y: 128,
                container: ct.room
            }, options || {});
            const copy = ct.templates.copy('VKEY', 0, 0, {
                opts: opts
            }, opts.container);
            if (typeof options.x === 'function' || typeof options.y === 'function') {
                copy.skipRealign = true;
            }
            return copy;
        },
        joystick(options) {
            var opts = ct.u.ext({
                key: 'Vjoy1',
                depth: 100,
                tex: -1,
                trackballTex: -1,
                x: 128,
                y: 128,
                container: ct.room
            }, options || {});
            const copy = ct.templates.copy('VJOYSTICK', 0, 0, {
                opts: opts
            }, opts.container);
            if (typeof options.x === 'function' || typeof options.y === 'function') {
                copy.skipRealign = true;
            }
            return copy;
        }
    };
})();

(function mountCtTouch(ct) {
    var keyPrefix = 'touch.';
    var setKey = function (key, value) {
        ct.inputs.registry[keyPrefix + key] = value;
    };
    var lastPanNum = 0,
        lastPanX = 0,
        lastPanY = 0,
        lastScaleDistance = 0,
        lastAngle = 0;
    // updates Action system's input methods for singular, double and triple touches
    var countTouches = () => {
        setKey('Any', ct.touch.events.length > 0 ? 1 : 0);
        setKey('Double', ct.touch.events.length > 1 ? 1 : 0);
        setKey('Triple', ct.touch.events.length > 2 ? 1 : 0);
    };
    // returns a new object with the necessary information about a touch event
    var copyTouch = e => {
        const rect = ct.pixiApp.view.getBoundingClientRect();
        const xui = (e.clientX - rect.left) / rect.width * ct.camera.width,
              yui = (e.clientY - rect.top) / rect.height * ct.camera.height;
        const positionGame = ct.u.uiToGameCoord(xui, yui);
        const touch = {
            id: e.identifier,
            x: positionGame.x,
            y: positionGame.y,
            xui: xui,
            yui: yui,
            xprev: positionGame.x,
            yprev: positionGame.y,
            xuiprev: xui,
            yuiprev: yui,
            r: e.radiusX ? Math.max(e.radiusX, e.radiusY) : 0
        };
        return touch;
    };
    var findTouch = id => {
        for (let i = 0; i < ct.touch.events.length; i++) {
            if (ct.touch.events[i].id === id) {
                return ct.touch.events[i];
            }
        }
        return false;
    };
    var findTouchId = id => {
        for (let i = 0; i < ct.touch.events.length; i++) {
            if (ct.touch.events[i].id === id) {
                return i;
            }
        }
        return -1;
    };
    var handleStart = function (e) {
        if (![false][0]) {
            e.preventDefault();
        }
        for (let i = 0, l = e.changedTouches.length; i < l; i++) {
            var touch = copyTouch(e.changedTouches[i]);
            ct.touch.events.push(touch);
            ct.touch.x = touch.x;
            ct.touch.y = touch.y;
            ct.touch.xui = touch.xui;
            ct.touch.yui = touch.yui;
        }
        countTouches();
    };
    var handleMove = function (e) {
        if (![false][0]) {
            e.preventDefault();
        }
        for (let i = 0, l = e.changedTouches.length; i < l; i++) {
            const touch = e.changedTouches[i],
                  upd = findTouch(e.changedTouches[i].identifier);
            if (upd) {
                const rect = ct.pixiApp.view.getBoundingClientRect();
                upd.xui = (touch.clientX - rect.left) / rect.width * ct.camera.width;
                upd.yui = (touch.clientY - rect.top) / rect.height * ct.camera.height;
                ({x: upd.x, y: upd.y} = ct.u.uiToGameCoord(upd.xui, upd.yui));
                upd.r = touch.radiusX ? Math.max(touch.radiusX, touch.radiusY) : 0;
                ct.touch.x = upd.x;
                ct.touch.y = upd.y;
                ct.touch.xui = upd.xui;
                ct.touch.yui = upd.yui;
            }
        }
    };
    var handleRelease = function (e) {
        if (![false][0]) {
            e.preventDefault();
        }
        var touches = e.changedTouches;
        for (let i = 0; i < touches.length; i++) {
            const ind = findTouchId(touches[i].identifier);
            if (ind !== -1) {
                ct.touch.released.push(ct.touch.events.splice(ind, 1)[0]);
            }
        }
        countTouches();
    };
    var mouseDown = function (e) {
        const rect = ct.pixiApp.view.getBoundingClientRect();
        var touch = {
            id: -1,
            xui: (e.clientX - rect.left) * ct.camera.width / rect.width,
            yui: (e.clientY - rect.top) * ct.camera.height / rect.height,
            r: 0
        };
        ({x: touch.x, y: touch.y} = ct.u.uiToGameCoord(touch.xui, touch.yui));
        ct.touch.events.push(touch);
        ct.touch.x = touch.x;
        ct.touch.y = touch.y;
        ct.touch.xui = touch.xui;
        ct.touch.yui = touch.yui;
        countTouches();
    };
    var mouseMove = function (e) {
        const rect = ct.pixiApp.view.getBoundingClientRect(),
              touch = findTouch(-1);
        if (touch) {
            touch.xui = (e.clientX - rect.left) * ct.camera.width / rect.width;
            touch.yui = (e.clientY - rect.top) * ct.camera.height / rect.height;
            ({x: touch.x, y: touch.y} = ct.u.uiToGameCoord(touch.xui, touch.yui));
            ct.touch.x = touch.x;
            ct.touch.y = touch.y;
            ct.touch.xui = touch.xui;
            ct.touch.yui = touch.yui;
        }
    };
    var mouseUp = function () {
        ct.touch.events = ct.touch.events.filter(x => x.id !== -1);
        countTouches();
    };
    ct.touch = {
        released: [],
        setupListeners() {
            document.addEventListener('touchstart', handleStart, false);
            document.addEventListener('touchstart', () => {
                ct.touch.enabled = true;
            }, {
                once: true
            });
            document.addEventListener('touchend', handleRelease, false);
            document.addEventListener('touchcancel', handleRelease, false);
            document.addEventListener('touchmove', handleMove, false);
        },
        setupMouseListeners() {
            document.addEventListener('mousemove', mouseMove, false);
            document.addEventListener('mouseup', mouseUp, false);
            document.addEventListener('mousedown', mouseDown, false);
        },
        enabled: false,
        events: [],
        x: 0,
        y: 0,
        xprev: 0,
        yprev: 0,
        xui: 0,
        yui: 0,
        xuiprev: 0,
        yuiprev: 0,
        clear() {
            ct.touch.events.length = 0;
            ct.touch.clearReleased();
            countTouches();
        },
        clearReleased() {
            ct.touch.released.length = 0;
        },
        collide(copy, id, rel) {
            var set = rel ? ct.touch.released : ct.touch.events;
            if (id !== void 0 && id !== false) {
                const i = findTouchId(id);
                if (i === -1) {
                    return false;
                }
                return ct.place.collide(copy, {
                    x: set[i].x,
                    y: set[i].y,
                    shape: {
                        type: set[i].r ? 'circle' : 'point',
                        r: set[i].r
                    },
                    scale: {
                        x: 1,
                        y: 1
                    }
                });
            }
            for (let i = 0, l = set.length; i < l; i++) {
                if (ct.place.collide(copy, {
                    x: set[i].x,
                    y: set[i].y,
                    shape: {
                        type: set[i].r ? 'circle' : 'point',
                        r: set[i].r
                    },
                    scale: {
                        x: 1,
                        y: 1
                    }
                })) {
                    return true;
                }
            }
            return false;
        },
        collideUi(copy, id, rel) {
            var set = rel ? ct.touch.released : ct.touch.events;
            if (id !== void 0 && id !== false) {
                const i = findTouchId(id);
                if (i === -1) {
                    return false;
                }
                return ct.place.collide(copy, {
                    x: set[i].xui,
                    y: set[i].yui,
                    shape: {
                        type: set[i].r ? 'circle' : 'point',
                        r: set[i].r
                    },
                    scale: {
                        x: 1,
                        y: 1
                    }
                });
            }
            for (let i = 0, l = set.length; i < l; i++) {
                if (ct.place.collide(copy, {
                    x: set[i].xui,
                    y: set[i].yui,
                    shape: {
                        type: set[i].r ? 'circle' : 'point',
                        r: set[i].r
                    },
                    scale: {
                        x: 1,
                        y: 1
                    }
                })) {
                    return true;
                }
            }
            return false;
        },
        hovers(copy, id, rel) {
            return ct.mouse ?
                (ct.mouse.hovers(copy) || ct.touch.collide(copy, id, rel)) :
                ct.touch.collide(copy, id, rel);
        },
        hoversUi(copy, id, rel) {
            return ct.mouse ?
                (ct.mouse.hoversUi(copy) || ct.touch.collideUi(copy, id, rel)) :
                ct.touch.collideUi(copy, id, rel);
        },
        getById: findTouch,
        updateGestures: function () {
            let x = 0,
                y = 0;
            const rect = ct.pixiApp.view.getBoundingClientRect();
            for (const event of ct.touch.events) {
                x += (event.clientX - rect.left) / rect.width;
                y += (event.clientY - rect.top) / rect.height;
            }
            x /= ct.touch.events.length;
            y /= ct.touch.events.length;

            let angle = 0,
                distance = lastScaleDistance;
            if (ct.touch.events.length > 1) {
                const events = [
                    ct.touch.events[0],
                    ct.touch.events[1]
                ].sort((a, b) => a.id - b.id);
                angle = ct.u.pdn(
                    events[0].x,
                    events[0].y,
                    events[1].x,
                    events[1].y
                );
                distance = ct.u.pdc(
                    events[0].x,
                    events[0].y,
                    events[1].x,
                    events[1].y
                );
            }

            if (lastPanNum === ct.touch.events.length) {
                if (ct.touch.events.length > 1) {
                    setKey('DeltaRotation', (ct.u.degToRad(ct.u.deltaDir(lastAngle, angle))));
                    setKey('DeltaPinch', distance / lastScaleDistance - 1);
                } else {
                    setKey('DeltaPinch', 0);
                    setKey('DeltaRotation', 0);
                }
                if (!ct.touch.events.length) {
                    setKey('PanX', 0);
                    setKey('PanY', 0);
                } else {
                    setKey('PanX', x - lastPanX);
                    setKey('PanY', y - lastPanY);
                }
            } else {
                // skip gesture updates to avoid shaking on new presses
                lastPanNum = ct.touch.events.length;
                setKey('DeltaPinch', 0);
                setKey('DeltaRotation', 0);
                setKey('PanX', 0);
                setKey('PanY', 0);
            }
            lastPanX = x;
            lastPanY = y;
            lastAngle = angle;
            lastScaleDistance = distance;
        }
    };
})(ct);

(function ctTransition() {
    const makeGenericTransition = function makeGenericTransition(name, exts) {
        ct.rooms.templates.CTTRANSITIONEMPTYROOM.width = ct.camera.width;
        ct.rooms.templates.CTTRANSITIONEMPTYROOM.height = ct.camera.height;
        const room = ct.rooms.append('CTTRANSITIONEMPTYROOM', {
            isUi: true
        });
        const transition = ct.templates.copyIntoRoom(
            name, 0, 0, room,
            Object.assign({
                room
            }, exts)
        );
        return transition.promise;
    };
    ct.transition = {
        fadeOut(duration, color) {
            duration = duration || 500;
            color = color || 0x000000; // Defaults to a black color
            return makeGenericTransition('CTTRANSITION_FADE', {
                duration,
                color,
                in: false
            });
        },
        fadeIn(duration, color) {
            duration = duration || 500;
            color = color || 0x000000; // Defaults to a black color
            return makeGenericTransition('CTTRANSITION_FADE', {
                duration,
                color,
                in: true
            });
        },
        scaleOut(duration, scaling, color) {
            duration = duration || 500;
            scaling = scaling || 0.1;
            color = color || 0x000000; // Defaults to a black color
            return makeGenericTransition('CTTRANSITION_SCALE', {
                duration,
                color,
                scaling,
                in: false
            });
        },
        scaleIn(duration, scaling, color) {
            duration = duration || 500;
            scaling = scaling || 0.1;
            color = color || 0x000000; // Defaults to a black color
            return makeGenericTransition('CTTRANSITION_SCALE', {
                duration,
                color,
                scaling,
                in: true
            });
        },
        slideOut(duration, direction, color) {
            duration = duration || 500;
            direction = direction || 'right';
            color = color || 0x000000; // Defaults to a black color
            return makeGenericTransition('CTTRANSITION_SLIDE', {
                duration,
                color,
                endAt: direction,
                in: false
            });
        },
        slideIn(duration, direction, color) {
            duration = duration || 500;
            direction = direction || 'right';
            color = color || 0x000000; // Defaults to a black color
            return makeGenericTransition('CTTRANSITION_SLIDE', {
                duration,
                color,
                endAt: direction,
                in: true
            });
        },
        circleOut(duration, color) {
            color = color || 0x000000; // Defaults to a black color
            return makeGenericTransition('CTTRANSITION_CIRCLE', {
                duration,
                color,
                in: true
            });
        },
        circleIn(duration, color) {
            color = color || 0x000000; // Defaults to a black color
            return makeGenericTransition('CTTRANSITION_CIRCLE', {
                duration,
                color,
                in: false
            });
        }
    };
})();


/* eslint-disable no-nested-ternary */
/* global CtTimer */

ct.tween = {
    /**
     * Creates a new tween effect and adds it to the game loop
     *
     * @param {Object} options An object with options:
     * @param {Object|Copy} options.obj An object to animate. All objects are supported.
     * @param {Object} options.fields A map with pairs `fieldName: newValue`.
     * Values must be of numerical type.
     * @param {Function} options.curve An interpolating function. You can write your own,
     * or use default ones (see methods in `ct.tween`). The default one is `ct.tween.ease`.
     * @param {Number} options.duration The duration of easing, in milliseconds.
     * @param {Number} options.useUiDelta If true, use ct.deltaUi instead of ct.delta.
     * The default is `false`.
     * @param {boolean} options.silent If true, will not throw errors if the animation
     * was interrupted.
     *
     * @returns {Promise} A promise which is resolved if the effect was fully played,
     * or rejected if it was interrupted manually by code, room switching or instance kill.
     * You can call a `stop()` method on this promise to interrupt it manually.
     */
    add(options) {
        var tween = {
            obj: options.obj,
            fields: options.fields || {},
            curve: options.curve || ct.tween.ease,
            duration: options.duration || 1000,
            timer: new CtTimer(this.duration, false, options.useUiDelta || false)
        };
        var promise = new Promise((resolve, reject) => {
            tween.resolve = resolve;
            tween.reject = reject;
            tween.starting = {};
            for (var field in tween.fields) {
                tween.starting[field] = tween.obj[field] || 0;
            }
            ct.tween.tweens.push(tween);
        });
        if (options.silent) {
            promise.catch(() => void 0);
            tween.timer.catch(() => void 0);
        }
        promise.stop = function stop() {
            tween.reject({
                code: 0,
                info: 'Stopped by game logic',
                from: 'ct.tween'
            });
        };
        return promise;
    },
    /**
     * Linear interpolation.
     * Here and below, these parameters are used:
     *
     * @param {Number} s Starting value
     * @param {Number} d The change of value to transition to, the Delta
     * @param {Number} a The current timing state, 0-1
     * @returns {Number} Interpolated value
     */
    linear(s, d, a) {
        return d * a + s;
    },
    ease(s, d, a) {
        a *= 2;
        if (a < 1) {
            return d / 2 * a * a + s;
        }
        a--;
        return -d / 2 * (a * (a - 2) - 1) + s;
    },
    easeInQuad(s, d, a) {
        return d * a * a + s;
    },
    easeOutQuad(s, d, a) {
        return -d * a * (a - 2) + s;
    },
    easeInCubic(s, d, a) {
        return d * a * a * a + s;
    },
    easeOutCubic(s, d, a) {
        a--;
        return d * (a * a * a + 1) + s;
    },
    easeInOutCubic(s, d, a) {
        a *= 2;
        if (a < 1) {
            return d / 2 * a * a * a + s;
        }
        a -= 2;
        return d / 2 * (a * a * a + 2) + s;
    },
    easeInOutQuart(s, d, a) {
        a *= 2;
        if (a < 1) {
            return d / 2 * a * a * a * a + s;
        }
        a -= 2;
        return -d / 2 * (a * a * a * a - 2) + s;
    },
    easeInQuart(s, d, a) {
        return d * a * a * a * a + s;
    },
    easeOutQuart(s, d, a) {
        a--;
        return -d * (a * a * a * a - 1) + s;
    },
    easeInCirc(s, d, a) {
        return -d * (Math.sqrt(1 - a * a) - 1) + s;
    },
    easeOutCirc(s, d, a) {
        a--;
        return d * Math.sqrt(1 - a * a) + s;
    },
    easeInOutCirc(s, d, a) {
        a *= 2;
        if (a < 1) {
            return -d / 2 * (Math.sqrt(1 - a * a) - 1) + s;
        }
        a -= 2;
        return d / 2 * (Math.sqrt(1 - a * a) + 1) + s;
    },
    easeInBack(s, d, a) {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        var x = c3 * a * a * a - c1 * a * a;
        return d * x + s;
    },
    easeOutBack(s, d, a) {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        var x = 1 + c3 * (a - 1) ** 3 + c1 * (a - 1) ** 2;
        return d * x + s;
    },
    easeInOutBack(s, d, a) {
        const c1 = 1.70158;
        const c2 = c1 * 1.525;
        var x = a < 0.5 ?
            ((2 * a) ** 2 * ((c2 + 1) * 2 * a - c2)) / 2 :
            ((2 * a - 2) ** 2 * ((c2 + 1) * (a * 2 - 2) + c2) + 2) / 2;
        return d * x + s;
    },
    easeInElastic(s, d, a) {
        const c4 = (2 * Math.PI) / 3;
        var x = a === 0 ?
            0 :
            a === 1 ?
                1 :
                -(2 ** (10 * a - 10)) * Math.sin((a * 10 - 10.75) * c4);
        return d * x + s;
    },
    easeOutElastic(s, d, a) {
        const c4 = (2 * Math.PI) / 3;
        var x = a === 0 ?
            0 :
            a === 1 ?
                1 :
                2 ** (-10 * a) * Math.sin((a * 10 - 0.75) * c4) + 1;
        return d * x + s;
    },
    easeInOutElastic(s, d, a) {
        const c5 = (2 * Math.PI) / 4.5;
        var x = a === 0 ?
            0 :
            a === 1 ?
                1 :
                a < 0.5 ?
                    -(2 ** (20 * a - 10) * Math.sin((20 * a - 11.125) * c5)) / 2 :
                    (2 ** (-20 * a + 10) * Math.sin((20 * a - 11.125) * c5)) / 2 + 1;
        return d * x + s;
    },
    easeOutBounce(s, d, a) {
        const n1 = 7.5625;
        const d1 = 2.75;
        var x;
        if (a < 1 / d1) {
            x = n1 * a * a;
        } else if (a < 2 / d1) {
            x = n1 * (a -= 1.5 / d1) * a + 0.75;
        } else if (a < 2.5 / d1) {
            x = n1 * (a -= 2.25 / d1) * a + 0.9375;
        } else {
            x = n1 * (a -= 2.625 / d1) * a + 0.984375;
        }
        return d * x + s;
    },
    easeInBounce(s, d, a) {
        const n1 = 7.5625;
        const d1 = 2.75;
        var x;
        a = 1 - a;
        if (a < 1 / d1) {
            x = n1 * a * a;
        } else if (a < 2 / d1) {
            x = n1 * (a -= 1.5 / d1) * a + 0.75;
        } else if (a < 2.5 / d1) {
            x = n1 * (a -= 2.25 / d1) * a + 0.9375;
        } else {
            x = n1 * (a -= 2.625 / d1) * a + 0.984375;
        }
        return d * (1 - x) + s;
    },
    easeInOutBounce(s, d, a) {
        const n1 = 7.5625;
        const d1 = 2.75;
        var x, b;
        if (a < 0.5) {
            b = 1 - 2 * a;
        } else {
            b = 2 * a - 1;
        }
        if (b < 1 / d1) {
            x = n1 * b * b;
        } else if (b < 2 / d1) {
            x = n1 * (b -= 1.5 / d1) * b + 0.75;
        } else if (b < 2.5 / d1) {
            x = n1 * (b -= 2.25 / d1) * b + 0.9375;
        } else {
            x = n1 * (b -= 2.625 / d1) * b + 0.984375;
        }
        if (a < 0.5) {
            x = (1 - b) / 1;
        } else {
            x = (1 + b) / 1;
        }
        return d * x + s;
    },
    tweens: [],
    wait: ct.u.wait
};
ct.tween.easeInOutQuad = ct.tween.ease;

// Get Chain settings
const currentChain = [false][0] ? {
  chainId: Number(""),
  chainName: "",
  rpcUrls: [""],
  blockExplorerUrls: [""],
  currencySymbol: "",
  currencyDecimals: Number(""),
} : window.defaultChainSettings["mumbai-testnet"];

let accountChangedCallback = () => {
};
let networkChangedCallback = () => {
};

/**
 * Show new transaction event
 * @param tx - transaction object
 * @param position string - where show transaction info block. Default: "bottom-center". Options: top-center, bottom-center, top-right, bottom-right
 */
const showNewTransaction = (tx, position) => {
  // Test to see if the browser supports the HTML template
  if ('content' in document.createElement('template')) {
    const transactionsBlock = document.getElementById('transactions');
    transactionsBlock.classList.add('visible');

    const template = document.getElementById('one-transaction-template');
    const txTemplate = template.content.cloneNode(true);

    const txBlock = txTemplate.querySelector('.one-transaction');
    txBlock.dataset.id = +new Date();

    const txLink = txTemplate.querySelector('.tx-link');
    const txHideButton = txTemplate.querySelector('.tx-hide');
    const txLoader = txTemplate.querySelector('.tx-loader');
    const txStatus = txTemplate.querySelector('.tx-status');

    txLink.textContent = tx.hash.slice(0, 6) + "..." + tx.hash.slice(36, 42);
    txLink.href = currentChain.blockExplorerUrls[0] + "/tx/" + tx.hash;
    transactionsBlock.appendChild(txTemplate);

    // Listen to hide tx info and remove block
    const listener = () => {
      txHideButton.removeEventListener('click', listener);
      transactionsBlock.querySelector(`.one-transaction[data-id="${txBlock.dataset.id}"]`).remove();
    };
    txHideButton.addEventListener('click', listener);

    // Wait till status update
    tx.wait().then(receipt => {
      // Hide loader
      txLoader.remove();

      // Update tx status text
      if (receipt.status === 1) {
        txStatus.textContent = "Success";
      } else {
        txStatus.textContent = "Error";
      }

      // Remove Tx in 3 seconds after update
      setTimeout(() => {
        txHideButton.dispatchEvent(new Event('click'));
      }, 3000);
    });
  }
}

// Init catmod
ct.web3 = {
  chainId: currentChain.chainId,
  contractAddress: "0xeF26D544994f9fD5C4CA65d96f67f3f98FD37cb3",
  connectOnInit: [true][0],
  showWrongNetwork: [true][0],
  isConnected: false,
  userAddress: "",
  contract: {},
  nft: {},
  connect: () => alert("Please Install metamask"),
  onAccountChange: (callback) => accountChangedCallback = callback,
  onNetworkChange: (callback) => networkChangedCallback = callback,
  showNewTransaction: (tx, position) => showNewTransaction(tx, position),
};

// Show alerts when no required settings
if (!ct.web3.chainId) {
  alert('Web3 Connector error: ChainID is empty');
} else if (!ct.web3.contractAddress) {
  alert('Web3 Connector error: contract address is empty');
}

if (window.ethereum) {
  // console.log('chainId', ct.web3.chainId);
  console.log('contractAddress', ct.web3.contractAddress);

  const isCorrectNetwork = async () => {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    return Number(chainId) === ct.web3.chainId;
  }

  // Replace method to connect user metamask account
  ct.web3.connect = async () => {
    ct.web3.isConnected = false;
    const provider = new window.ethers.providers.Web3Provider(window.ethereum, 'any');
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    ct.web3.userAddress = await signer.getAddress();

    try {
      isCorrectNetwork().then(isCorrect => {
        if (isCorrect) {
          const contractABI = [{
  "_format": "hh-sol-artifact-1",
  "contractName": "SpaceRanger",
  "sourceName": "contracts/SpaceRanger.sol",
  "abi": [
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "account",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "operator",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "bool",
          "name": "approved",
          "type": "bool"
        }
      ],
      "name": "ApprovalForAll",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "previousOwner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "OwnershipTransferred",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "operator",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256[]",
          "name": "ids",
          "type": "uint256[]"
        },
        {
          "indexed": false,
          "internalType": "uint256[]",
          "name": "values",
          "type": "uint256[]"
        }
      ],
      "name": "TransferBatch",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "operator",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "TransferSingle",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "string",
          "name": "value",
          "type": "string"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        }
      ],
      "name": "URI",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "SHIPS_TYPE_SUPPLY",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        }
      ],
      "name": "balanceOf",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address[]",
          "name": "accounts",
          "type": "address[]"
        },
        {
          "internalType": "uint256[]",
          "name": "ids",
          "type": "uint256[]"
        }
      ],
      "name": "balanceOfBatch",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "burn",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        },
        {
          "internalType": "uint256[]",
          "name": "ids",
          "type": "uint256[]"
        },
        {
          "internalType": "uint256[]",
          "name": "values",
          "type": "uint256[]"
        }
      ],
      "name": "burnBatch",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_scores",
          "type": "uint256"
        }
      ],
      "name": "claimRewards",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_owner",
          "type": "address"
        }
      ],
      "name": "getUserShips",
      "outputs": [
        {
          "components": [
            {
              "internalType": "uint256",
              "name": "id",
              "type": "uint256"
            },
            {
              "internalType": "uint8",
              "name": "health",
              "type": "uint8"
            },
            {
              "internalType": "uint8",
              "name": "attack",
              "type": "uint8"
            },
            {
              "internalType": "uint8",
              "name": "weapons",
              "type": "uint8"
            },
            {
              "internalType": "uint8",
              "name": "speed",
              "type": "uint8"
            },
            {
              "internalType": "uint8",
              "name": "level",
              "type": "uint8"
            },
            {
              "internalType": "uint8",
              "name": "currentEnergy",
              "type": "uint8"
            },
            {
              "internalType": "uint8",
              "name": "maxEnergy",
              "type": "uint8"
            },
            {
              "internalType": "uint8",
              "name": "shipType",
              "type": "uint8"
            },
            {
              "internalType": "bool",
              "name": "onSale",
              "type": "bool"
            },
            {
              "internalType": "uint256",
              "name": "salePrice",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "totalBattles",
              "type": "uint256"
            },
            {
              "internalType": "enum SpaceRanger.ShipUpgradeType[]",
              "name": "upgrades",
              "type": "uint8[]"
            }
          ],
          "internalType": "struct SpaceRanger.Ship[]",
          "name": "",
          "type": "tuple[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "operator",
          "type": "address"
        }
      ],
      "name": "isApprovedForAll",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "lastFlyTime",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint8",
          "name": "_shipTypeId",
          "type": "uint8"
        }
      ],
      "name": "mint",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "mintedShips",
      "outputs": [
        {
          "internalType": "uint16",
          "name": "",
          "type": "uint16"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "renounceOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256[]",
          "name": "ids",
          "type": "uint256[]"
        },
        {
          "internalType": "uint256[]",
          "name": "amounts",
          "type": "uint256[]"
        },
        {
          "internalType": "bytes",
          "name": "data",
          "type": "bytes"
        }
      ],
      "name": "safeBatchTransferFrom",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        },
        {
          "internalType": "bytes",
          "name": "data",
          "type": "bytes"
        }
      ],
      "name": "safeTransferFrom",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "operator",
          "type": "address"
        },
        {
          "internalType": "bool",
          "name": "approved",
          "type": "bool"
        }
      ],
      "name": "setApprovalForAll",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_uri",
          "type": "string"
        }
      ],
      "name": "setURI",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "ships",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "internalType": "uint8",
          "name": "health",
          "type": "uint8"
        },
        {
          "internalType": "uint8",
          "name": "attack",
          "type": "uint8"
        },
        {
          "internalType": "uint8",
          "name": "weapons",
          "type": "uint8"
        },
        {
          "internalType": "uint8",
          "name": "speed",
          "type": "uint8"
        },
        {
          "internalType": "uint8",
          "name": "level",
          "type": "uint8"
        },
        {
          "internalType": "uint8",
          "name": "currentEnergy",
          "type": "uint8"
        },
        {
          "internalType": "uint8",
          "name": "maxEnergy",
          "type": "uint8"
        },
        {
          "internalType": "uint8",
          "name": "shipType",
          "type": "uint8"
        },
        {
          "internalType": "bool",
          "name": "onSale",
          "type": "bool"
        },
        {
          "internalType": "uint256",
          "name": "salePrice",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "totalBattles",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "numString",
          "type": "string"
        }
      ],
      "name": "stringToUint",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes4",
          "name": "interfaceId",
          "type": "bytes4"
        }
      ],
      "name": "supportsInterface",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalMintedShips",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "transferOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_id",
          "type": "uint256"
        },
        {
          "internalType": "enum SpaceRanger.ShipUpgradeType",
          "name": "_upgradeType",
          "type": "uint8"
        }
      ],
      "name": "upgradeShipCharacteristics",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_id",
          "type": "uint256"
        }
      ],
      "name": "upgradeShipLevel",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_tokenId",
          "type": "uint256"
        }
      ],
      "name": "uri",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "userBalance",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "userLevel",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "userShips",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ],
  "bytecode": "0x6101206040526000608081815260a082905260c082905260e08290526101009190915262000032906004906005620000e8565b5060006005553480156200004557600080fd5b506040518060a001604052806062815260200162003a1a606291396200006b816200007d565b50620000773362000096565b62000268565b80516200009290600290602084019062000197565b5050565b600380546001600160a01b038381166001600160a01b0319831681179093556040519116919082907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e090600090a35050565b82805482825590600052602060002090600f01601090048101928215620001855791602002820160005b838211156200015357835183826101000a81548161ffff021916908360ff160217905550926020019260020160208160010104928301926001030262000112565b8015620001835782816101000a81549061ffff021916905560020160208160010104928301926001030262000153565b505b506200019392915062000214565b5090565b828054620001a5906200022b565b90600052602060002090601f016020900481019282620001c9576000855562000185565b82601f10620001e457805160ff191683800117855562000185565b8280016001018555821562000185579182015b8281111562000185578251825591602001919060010190620001f7565b5b8082111562000193576000815560010162000215565b600181811c908216806200024057607f821691505b602082108114156200026257634e487b7160e01b600052602260045260246000fd5b50919050565b6137a280620002786000396000f3fe608060405234801561001057600080fd5b50600436106101c35760003560e01c80634e1273f4116100f9578063a22cb46511610097578063e985e9c511610071578063e985e9c5146104e6578063f242432a14610522578063f2fde38b14610535578063f5298aca1461054857600080fd5b8063a22cb465146104b7578063b062d9b5146104ca578063baf45424146104d357600080fd5b80636ecd2306116100d35780636ecd23061461045b578063715018a61461046e57806378655c09146104765780638da5cb5b1461049c57600080fd5b80634e1273f4146104155780635b3fdb6a146104355780636b20c4541461044857600080fd5b80631795e83c11610166578063280e31cc11610140578063280e31cc146102df5780632eb2c2d6146102ff5780633779a025146103125780634d4e8dfa1461031b57600080fd5b80631795e83c1461028c57806317cb4935146102ac5780631bd95155146102cc57600080fd5b806302fe5305116101a257806302fe530514610231578063039f82f8146102465780630962ef79146102595780630e89341c1461026c57600080fd5b8062fdd58e146101c85780630103c92b146101ee57806301ffc9a71461020e575b600080fd5b6101db6101d6366004612909565b61055b565b6040519081526020015b60405180910390f35b6101db6101fc366004612933565b60066020526000908152604090205481565b61022161021c36600461296b565b6105f4565b60405190151581526020016101e5565b61024461023f366004612a27565b610644565b005b610244610254366004612a6f565b610658565b610244610267366004612aa3565b610a93565b61027f61027a366004612aa3565b610aba565b6040516101e59190612b14565b6101db61029a366004612933565b600a6020526000908152604090205481565b6102bf6102ba366004612933565b610aeb565b6040516101e59190612b97565b6101db6102da366004612a27565b610d90565b6101db6102ed366004612933565b60076020526000908152604090205481565b61024461030d366004612d4c565b610e34565b6101db6103e881565b6103a9610329366004612aa3565b6008602052600090815260409020805460018201546002830154600390930154919260ff80831693610100840482169362010000810483169363010000008204841693640100000000830481169365010000000000840482169366010000000000008104831693600160381b8204841693600160401b909204909116918c565b604080519c8d5260ff9b8c1660208e0152998b16998c019990995296891660608b015294881660808a015292871660a089015290861660c0880152851660e0870152909316610100850152911515610120840152610140830191909152610160820152610180016101e5565b610428610423366004612df5565b610e80565b6040516101e59190612efa565b610244610443366004612aa3565b610fa9565b610244610456366004612f0d565b61140c565b610244610469366004612f80565b611454565b610244611928565b610489610484366004612aa3565b61193c565b60405161ffff90911681526020016101e5565b6003546040516001600160a01b0390911681526020016101e5565b6102446104c5366004612fa3565b611974565b6101db60055481565b6101db6104e1366004612909565b611983565b6102216104f4366004612fd4565b6001600160a01b03918216600090815260016020908152604080832093909416825291909152205460ff1690565b610244610530366004613007565b6119b4565b610244610543366004612933565b6119f9565b61024461055636600461306b565b611a6f565b60006001600160a01b0383166105cb5760405162461bcd60e51b815260206004820152602a60248201527f455243313135353a2061646472657373207a65726f206973206e6f742061207660448201526930b634b21037bbb732b960b11b60648201526084015b60405180910390fd5b506000818152602081815260408083206001600160a01b03861684529091529020545b92915050565b60006001600160e01b03198216636cdb3d1360e11b148061062557506001600160e01b031982166303a24d0760e21b145b806105ee57506301ffc9a760e01b6001600160e01b03198316146105ee565b61064c611ab2565b61065581611b0c565b50565b6000828152600860205260409020805483146106ac5760405162461bcd60e51b815260206004820152601360248201527214dc1858d954da1a5c081b9bdd08199bdd5b99606a1b60448201526064016105c2565b60048101546006116107105760405162461bcd60e51b815260206004820152602760248201527f43616e2774207570677261646520736869702c2073706f7473206c696d6974206044820152661c995858da195960ca1b60648201526084016105c2565b6000805b600483015481101561079c5783600381111561073257610732612b27565b8360040182815481106107475761074761309e565b90600052602060002090602091828204019190069054906101000a900460ff16600381111561077857610778612b27565b141561078c5781610788816130ca565b9250505b610795816130ea565b9050610714565b5060008360038111156107b1576107b1612b27565b14156108535760038160ff161061081b5760405162461bcd60e51b815260206004820152602860248201527f43616e277420757067726164652c2061726d6f722073706f7473206c696d6974604482015267081c995858da195960c21b60648201526084016105c2565b6001820180546002919060009061083690849060ff16613105565b92506101000a81548160ff021916908360ff160217905550610a45565b600183600381111561086757610867612b27565b14156108ef5760ff8116156108d05760405162461bcd60e51b815260206004820152602960248201527f43616e277420757067726164652c20656e67696e652073706f7473206c696d696044820152681d081c995858da195960ba1b60648201526084016105c2565b600182810180546003906108369084906301000000900460ff16613105565b600383600381111561090357610903612b27565b141561098c5760028160ff161061096e5760405162461bcd60e51b815260206004820152602960248201527f43616e277420757067726164652c20776561706f6e2073706f7473206c696d696044820152681d081c995858da195960ba1b60648201526084016105c2565b6001828101805460029290610836908490610100900460ff16613105565b60028360038111156109a0576109a0612b27565b1415610a455760028160ff1610610a0b5760405162461bcd60e51b815260206004820152602960248201527f43616e277420757067726164652c20656e657267792073706f7473206c696d696044820152681d081c995858da195960ba1b60648201526084016105c2565b60028260010160068282829054906101000a900460ff16610a2c9190613105565b92506101000a81548160ff021916908360ff1602179055505b600482018054600181018255600091825260209182902091810490910180548592601f166101000a60ff81021990911690836003811115610a8857610a88612b27565b021790555050505050565b3360009081526006602052604081208054839290610ab290849061312a565b909155505050565b6060610ac582611b1f565b604051602001610ad59190613142565b6040516020818303038152906040529050919050565b6001600160a01b038116600090815260096020526040812054606091906001600160401b03811115610b1f57610b1f612988565b604051908082528060200260200182016040528015610bb857816020015b604080516101a0810182526000808252602080830182905292820181905260608083018290526080830182905260a0830182905260c0830182905260e083018290526101008301829052610120830182905261014083018290526101608301919091526101808201528252600019909201910181610b3d5790505b50905060005b6001600160a01b038416600090815260096020526040902054811015610d89576001600160a01b03841660009081526009602052604081208054600892919084908110610c0d57610c0d61309e565b60009182526020808320909101548352828101939093526040918201902081516101a08101835281548152600182015460ff808216838701526101008083048216848701526201000083048216606085015263010000008304821660808501526401000000008304821660a0850152650100000000008304821660c085015266010000000000008304821660e0850152600160381b8304821690840152600160401b9091041615156101208201526002820154610140820152600382015461016082015260048201805484518187028101870190955280855291949293610180860193909290830182828015610d5257602002820191906000526020600020906000905b82829054906101000a900460ff166003811115610d3057610d30612b27565b815260206001928301818104948501949093039092029101808411610d115790505b505050505081525050828281518110610d6d57610d6d61309e565b602002602001018190525080610d82906130ea565b9050610bbe565b5092915050565b60008082815b8151811015610e2b576000818351610dae91906131d6565b90506000838381518110610dc457610dc461309e565b01602001516001600160f81b03198116915060f81c6000610de66030836131d6565b9050610df36001856131d6565b610dfe90600a6132d1565b610e0890826132dd565b610e12908861312a565b9650505050508080610e23906130ea565b915050610d96565b50909392505050565b6001600160a01b038516331480610e505750610e5085336104f4565b610e6c5760405162461bcd60e51b81526004016105c2906132fc565b610e798585858585611c24565b5050505050565b60608151835114610ee55760405162461bcd60e51b815260206004820152602960248201527f455243313135353a206163636f756e747320616e6420696473206c656e677468604482015268040dad2e6dac2e8c6d60bb1b60648201526084016105c2565b600083516001600160401b03811115610f0057610f00612988565b604051908082528060200260200182016040528015610f29578160200160208202803683370190505b50905060005b8451811015610fa157610f74858281518110610f4d57610f4d61309e565b6020026020010151858381518110610f6757610f6761309e565b602002602001015161055b565b828281518110610f8657610f8661309e565b6020908102919091010152610f9a816130ea565b9050610f2f565b509392505050565b600081815260086020908152604080832033845260098352818420805483518186028101860190945280845291949361101893929083018282801561100d57602002820191906000526020600020905b815481526020019060010190808311610ff9575b505050505084611dce565b915050806110685760405162461bcd60e51b815260206004820152601d60248201527f596f7520646f6e2774206861766520746869732053706163655368697000000060448201526064016105c2565b6001820154600364010000000090910460ff16106110d45760405162461bcd60e51b815260206004820152602360248201527f596f752063616e277420696e63726561736520537061636553686970206c657660448201526232b61760e91b60648201526084016105c2565b60018281015460009164010000000090910460ff1614156111755733600090815260066020526040902054620186a0106111445760405162461bcd60e51b81526020600482015260116024820152704e656564206d6f72652062616c616e636560781b60448201526064016105c2565b3360009081526006602052604081208054620186a092906111669084906131d6565b90915550600291506111f69050565b336000908152600660205260409020546207a120106111ca5760405162461bcd60e51b81526020600482015260116024820152704e656564206d6f72652062616c616e636560781b60448201526064016105c2565b33600090815260066020526040812080546207a12092906111ec9084906131d6565b9091555060039150505b60018301546000906112339061121590600160381b900460ff16611b1f565b600186015461122e90640100000000900460ff16611b1f565b611e2e565b90506112493361124283610d90565b6001611e5a565b60018401546000906112749061126890600160381b900460ff16611b1f565b61122e8560ff16611b1f565b905061129a3361128383610d90565b600160405180602001604052806000815250611f77565b6001808601805460ff8087166401000000000264ff000000001990921691909117918290556201000090910416141561130857600185810180546002906112eb90849062010000900460ff16613105565b92506101000a81548160ff021916908360ff16021790555061133f565b60018581018054600a9290611326908490610100900460ff16613105565b92506101000a81548160ff021916908360ff1602179055505b6001850180546014919060009061135a90849060ff16613105565b92506101000a81548160ff021916908360ff16021790555060148560010160068282829054906101000a900460ff166113939190613105565b92506101000a81548160ff021916908360ff16021790555060018560010160038282829054906101000a900460ff166113cc9190613105565b825460ff9182166101009390930a92830291909202199091161790555050505060018201805468ff00000000000000001916905550600060029091015550565b6001600160a01b038316331480611428575061142883336104f4565b6114445760405162461bcd60e51b81526004016105c2906132fc565b61144f838383612091565b505050565b60045460ff821611156114a95760405162461bcd60e51b815260206004820152601860248201527f53706163655368697020646f65736e277420657869737473000000000000000060448201526064016105c2565b60008160ff16116114f15760405162461bcd60e51b815260206004820152601260248201527115dc9bdb99c814dc1858d954da1a5c08125160721b60448201526064016105c2565b336000908152600960205260409020541561154e5760405162461bcd60e51b815260206004820152601a60248201527f596f7520616c726561647920686176652053706163655368697000000000000060448201526064016105c2565b600061155b60018361334b565b90506103e860048260ff16815481106115765761157661309e565b60009182526020909120601082040154600f9091166002026101000a900461ffff16106116005760405162461bcd60e51b815260206004820152603260248201527f4e6f206d6f7265207368697073206f662074686973206d6f646966696361746960448201527137b71034b71037bab91039ba30ba34b7b71760711b60648201526084016105c2565b6000600560008154611611906130ea565b91829055509050600061163361162960ff8616611b1f565b61122e6001611b1f565b90506116423361128383610d90565b600160048460ff168154811061165a5761165a61309e565b90600052602060002090601091828204019190066002028282829054906101000a900461ffff1661168b919061336e565b92506101000a81548161ffff021916908361ffff1602179055506000806000806116b78860ff1661222f565b93509350935093506000604051806101a001604052808881526020018660ff1681526020018560ff1681526020018360ff1681526020018460ff168152602001600160ff168152602001600a60ff168152602001600a60ff1681526020018a60ff168152602001600015158152602001600081526020016000815260200160006001600160401b0381111561174e5761174e612988565b604051908082528060200260200182016040528015611777578160200160208202803683370190505b50815250905080600860008981526020019081526020016000206000820151816000015560208201518160010160006101000a81548160ff021916908360ff16021790555060408201518160010160016101000a81548160ff021916908360ff16021790555060608201518160010160026101000a81548160ff021916908360ff16021790555060808201518160010160036101000a81548160ff021916908360ff16021790555060a08201518160010160046101000a81548160ff021916908360ff16021790555060c08201518160010160056101000a81548160ff021916908360ff16021790555060e08201518160010160066101000a81548160ff021916908360ff1602179055506101008201518160010160076101000a81548160ff021916908360ff1602179055506101208201518160010160086101000a81548160ff021916908315150217905550610140820151816002015561016082015181600301556101808201518160040190805190602001906118f89291906127b0565b50503360009081526009602090815260408220805460018101825590835291200197909755505050505050505050565b611930611ab2565b61193a60006122c0565b565b6004818154811061194c57600080fd5b9060005260206000209060109182820401919006600202915054906101000a900461ffff1681565b61197f338383612312565b5050565b6009602052816000526040600020818154811061199f57600080fd5b90600052602060002001600091509150505481565b6001600160a01b0385163314806119d057506119d085336104f4565b6119ec5760405162461bcd60e51b81526004016105c2906132fc565b610e7985858585856123f3565b611a01611ab2565b6001600160a01b038116611a665760405162461bcd60e51b815260206004820152602660248201527f4f776e61626c653a206e6577206f776e657220697320746865207a65726f206160448201526564647265737360d01b60648201526084016105c2565b610655816122c0565b6001600160a01b038316331480611a8b5750611a8b83336104f4565b611aa75760405162461bcd60e51b81526004016105c2906132fc565b61144f838383611e5a565b6003546001600160a01b0316331461193a5760405162461bcd60e51b815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e657260448201526064016105c2565b805161197f906002906020840190612864565b606081611b435750506040805180820190915260018152600360fc1b602082015290565b8160005b8115611b6d5780611b57816130ea565b9150611b669050600a836133aa565b9150611b47565b6000816001600160401b03811115611b8757611b87612988565b6040519080825280601f01601f191660200182016040528015611bb1576020820181803683370190505b5090505b8415611c1c57611bc66001836131d6565b9150611bd3600a866133be565b611bde90603061312a565b60f81b818381518110611bf357611bf361309e565b60200101906001600160f81b031916908160001a905350611c15600a866133aa565b9450611bb5565b949350505050565b8151835114611c455760405162461bcd60e51b81526004016105c2906133d2565b6001600160a01b038416611c6b5760405162461bcd60e51b81526004016105c29061341a565b33611c7a81878787878761252b565b60005b8451811015611d60576000858281518110611c9a57611c9a61309e565b602002602001015190506000858381518110611cb857611cb861309e565b602090810291909101810151600084815280835260408082206001600160a01b038e168352909352919091205490915081811015611d085760405162461bcd60e51b81526004016105c29061345f565b6000838152602081815260408083206001600160a01b038e8116855292528083208585039055908b16825281208054849290611d4590849061312a565b9250508190555050505080611d59906130ea565b9050611c7d565b50846001600160a01b0316866001600160a01b0316826001600160a01b03167f4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb8787604051611db09291906134a9565b60405180910390a4611dc6818787878787612530565b505050505050565b81516000908190815b81811015611e1d5784868281518110611df257611df261309e565b60200260200101511415611e0d57925060019150611e279050565b611e16816130ea565b9050611dd7565b5060008092509250505b9250929050565b60608282604051602001611e439291906134d7565b604051602081830303815290604052905092915050565b6001600160a01b038316611e805760405162461bcd60e51b81526004016105c2906134fd565b336000611e8c8461269b565b90506000611e998461269b565b9050611eb98387600085856040518060200160405280600081525061252b565b6000858152602081815260408083206001600160a01b038a16845290915290205484811015611efa5760405162461bcd60e51b81526004016105c290613540565b6000868152602081815260408083206001600160a01b038b81168086529184528285208a8703905582518b81529384018a90529092908816917fc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62910160405180910390a46040805160208101909152600090525b50505050505050565b6001600160a01b038416611fd75760405162461bcd60e51b815260206004820152602160248201527f455243313135353a206d696e7420746f20746865207a65726f206164647265736044820152607360f81b60648201526084016105c2565b336000611fe38561269b565b90506000611ff08561269b565b90506120018360008985858961252b565b6000868152602081815260408083206001600160a01b038b1684529091528120805487929061203190849061312a565b909155505060408051878152602081018790526001600160a01b03808a1692600092918716917fc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62910160405180910390a4611f6e836000898989896126e6565b6001600160a01b0383166120b75760405162461bcd60e51b81526004016105c2906134fd565b80518251146120d85760405162461bcd60e51b81526004016105c2906133d2565b60003390506120fb8185600086866040518060200160405280600081525061252b565b60005b83518110156121c057600084828151811061211b5761211b61309e565b6020026020010151905060008483815181106121395761213961309e565b602090810291909101810151600084815280835260408082206001600160a01b038c1683529093529190912054909150818110156121895760405162461bcd60e51b81526004016105c290613540565b6000928352602083815260408085206001600160a01b038b16865290915290922091039055806121b8816130ea565b9150506120fe565b5060006001600160a01b0316846001600160a01b0316826001600160a01b03167f4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb86866040516122119291906134a9565b60405180910390a46040805160208101909152600090525b50505050565b60008060008084600b1415612252575060199250600c91506005905060016122b9565b846015141561226f5750601a9250600a91506006905060016122b9565b84601f141561228c575060159250600791506004905060026122b9565b84602914156122a95750601a9250600b91506005905060016122b9565b5060179250600691506004905060025b9193509193565b600380546001600160a01b038381166001600160a01b0319831681179093556040519116919082907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e090600090a35050565b816001600160a01b0316836001600160a01b031614156123865760405162461bcd60e51b815260206004820152602960248201527f455243313135353a2073657474696e6720617070726f76616c20737461747573604482015268103337b91039b2b63360b91b60648201526084016105c2565b6001600160a01b03838116600081815260016020908152604080832094871680845294825291829020805460ff191686151590811790915591519182527f17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31910160405180910390a3505050565b6001600160a01b0384166124195760405162461bcd60e51b81526004016105c29061341a565b3360006124258561269b565b905060006124328561269b565b905061244283898985858961252b565b6000868152602081815260408083206001600160a01b038c168452909152902054858110156124835760405162461bcd60e51b81526004016105c29061345f565b6000878152602081815260408083206001600160a01b038d8116855292528083208985039055908a168252812080548892906124c090849061312a565b909155505060408051888152602081018890526001600160a01b03808b16928c821692918816917fc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62910160405180910390a4612520848a8a8a8a8a6126e6565b505050505050505050565b611dc6565b6001600160a01b0384163b15611dc65760405163bc197c8160e01b81526001600160a01b0385169063bc197c81906125749089908990889088908890600401613584565b602060405180830381600087803b15801561258e57600080fd5b505af19250505080156125be575060408051601f3d908101601f191682019092526125bb918101906135e2565b60015b61266b576125ca6135ff565b806308c379a0141561260457506125df61361b565b806125ea5750612606565b8060405162461bcd60e51b81526004016105c29190612b14565b505b60405162461bcd60e51b815260206004820152603460248201527f455243313135353a207472616e7366657220746f206e6f6e20455243313135356044820152732932b1b2b4bb32b91034b6b83632b6b2b73a32b960611b60648201526084016105c2565b6001600160e01b0319811663bc197c8160e01b14611f6e5760405162461bcd60e51b81526004016105c2906136a4565b604080516001808252818301909252606091600091906020808301908036833701905050905082816000815181106126d5576126d561309e565b602090810291909101015292915050565b6001600160a01b0384163b15611dc65760405163f23a6e6160e01b81526001600160a01b0385169063f23a6e619061272a90899089908890889088906004016136ec565b602060405180830381600087803b15801561274457600080fd5b505af1925050508015612774575060408051601f3d908101601f19168201909252612771918101906135e2565b60015b612780576125ca6135ff565b6001600160e01b0319811663f23a6e6160e01b14611f6e5760405162461bcd60e51b81526004016105c2906136a4565b82805482825590600052602060002090601f016020900481019282156128545791602002820160005b8382111561282557835183826101000a81548160ff0219169083600381111561280457612804612b27565b021790555092602001926001016020816000010492830192600103026127d9565b80156128525782816101000a81549060ff0219169055600101602081600001049283019260010302612825565b505b506128609291506128d8565b5090565b82805461287090613731565b90600052602060002090601f0160209004810192826128925760008555612854565b82601f106128ab57805160ff1916838001178555612854565b82800160010185558215612854579182015b828111156128545782518255916020019190600101906128bd565b5b8082111561286057600081556001016128d9565b80356001600160a01b038116811461290457600080fd5b919050565b6000806040838503121561291c57600080fd5b612925836128ed565b946020939093013593505050565b60006020828403121561294557600080fd5b61294e826128ed565b9392505050565b6001600160e01b03198116811461065557600080fd5b60006020828403121561297d57600080fd5b813561294e81612955565b634e487b7160e01b600052604160045260246000fd5b601f8201601f191681016001600160401b03811182821017156129c3576129c3612988565b6040525050565b60006001600160401b038311156129e3576129e3612988565b6040516129fa601f8501601f19166020018261299e565b809150838152848484011115612a0f57600080fd5b83836020830137600060208583010152509392505050565b600060208284031215612a3957600080fd5b81356001600160401b03811115612a4f57600080fd5b8201601f81018413612a6057600080fd5b611c1c848235602084016129ca565b60008060408385031215612a8257600080fd5b82359150602083013560048110612a9857600080fd5b809150509250929050565b600060208284031215612ab557600080fd5b5035919050565b60005b83811015612ad7578181015183820152602001612abf565b838111156122295750506000910152565b60008151808452612b00816020860160208601612abc565b601f01601f19169290920160200192915050565b60208152600061294e6020830184612ae8565b634e487b7160e01b600052602160045260246000fd5b60008151808452602080850194508084016000805b84811015612b8b5782516004808210612b7857634e487b7160e01b845260218152602484fd5b5088529683019691830191600101612b52565b50959695505050505050565b60006020808301818452808551808352604092508286019150828160051b87010184880160005b83811015612c8a57603f198984030185528151805184528781015160ff908116898601528782015181168886015260608083015182169086015260808083015182169086015260a08083015182169086015260c08083015182169086015260e08083015182169086015261010080830151909116908501526101208082015115159085015261014080820151908501526101608082015190850152610180908101516101a091850182905290612c7681860183612b3d565b968901969450505090860190600101612bbe565b509098975050505050505050565b60006001600160401b03821115612cb157612cb1612988565b5060051b60200190565b600082601f830112612ccc57600080fd5b81356020612cd982612c98565b604051612ce6828261299e565b83815260059390931b8501820192828101915086841115612d0657600080fd5b8286015b84811015612d215780358352918301918301612d0a565b509695505050505050565b600082601f830112612d3d57600080fd5b61294e838335602085016129ca565b600080600080600060a08688031215612d6457600080fd5b612d6d866128ed565b9450612d7b602087016128ed565b935060408601356001600160401b0380821115612d9757600080fd5b612da389838a01612cbb565b94506060880135915080821115612db957600080fd5b612dc589838a01612cbb565b93506080880135915080821115612ddb57600080fd5b50612de888828901612d2c565b9150509295509295909350565b60008060408385031215612e0857600080fd5b82356001600160401b0380821115612e1f57600080fd5b818501915085601f830112612e3357600080fd5b81356020612e4082612c98565b604051612e4d828261299e565b83815260059390931b8501820192828101915089841115612e6d57600080fd5b948201945b83861015612e9257612e83866128ed565b82529482019490820190612e72565b96505086013592505080821115612ea857600080fd5b50612eb585828601612cbb565b9150509250929050565b600081518084526020808501945080840160005b83811015612eef57815187529582019590820190600101612ed3565b509495945050505050565b60208152600061294e6020830184612ebf565b600080600060608486031215612f2257600080fd5b612f2b846128ed565b925060208401356001600160401b0380821115612f4757600080fd5b612f5387838801612cbb565b93506040860135915080821115612f6957600080fd5b50612f7686828701612cbb565b9150509250925092565b600060208284031215612f9257600080fd5b813560ff8116811461294e57600080fd5b60008060408385031215612fb657600080fd5b612fbf836128ed565b915060208301358015158114612a9857600080fd5b60008060408385031215612fe757600080fd5b612ff0836128ed565b9150612ffe602084016128ed565b90509250929050565b600080600080600060a0868803121561301f57600080fd5b613028866128ed565b9450613036602087016128ed565b9350604086013592506060860135915060808601356001600160401b0381111561305f57600080fd5b612de888828901612d2c565b60008060006060848603121561308057600080fd5b613089846128ed565b95602085013595506040909401359392505050565b634e487b7160e01b600052603260045260246000fd5b634e487b7160e01b600052601160045260246000fd5b600060ff821660ff8114156130e1576130e16130b4565b60010192915050565b60006000198214156130fe576130fe6130b4565b5060010190565b600060ff821660ff84168060ff03821115613122576131226130b4565b019392505050565b6000821982111561313d5761313d6130b4565b500190565b7f68747470733a2f2f697066732e696f2f697066732f626166796265696278796881527f646e653478337571626c6c6a6b6c3261657478766c64747062346c637473746a6020820152707165323279723737676e726e6c6169612f60781b6040820152600082516131ba816051850160208701612abc565b64173539b7b760d91b6051939091019283015250605601919050565b6000828210156131e8576131e86130b4565b500390565b600181815b8085111561322857816000190482111561320e5761320e6130b4565b8085161561321b57918102915b93841c93908002906131f2565b509250929050565b60008261323f575060016105ee565b8161324c575060006105ee565b8160018114613262576002811461326c57613288565b60019150506105ee565b60ff84111561327d5761327d6130b4565b50506001821b6105ee565b5060208310610133831016604e8410600b84101617156132ab575081810a6105ee565b6132b583836131ed565b80600019048211156132c9576132c96130b4565b029392505050565b600061294e8383613230565b60008160001904831182151516156132f7576132f76130b4565b500290565b6020808252602f908201527f455243313135353a2063616c6c6572206973206e6f7420746f6b656e206f776e60408201526e195c881b9bdc88185c1c1c9bdd9959608a1b606082015260800190565b600060ff821660ff841680821015613365576133656130b4565b90039392505050565b600061ffff80831681851680830382111561338b5761338b6130b4565b01949350505050565b634e487b7160e01b600052601260045260246000fd5b6000826133b9576133b9613394565b500490565b6000826133cd576133cd613394565b500690565b60208082526028908201527f455243313135353a2069647320616e6420616d6f756e7473206c656e677468206040820152670dad2e6dac2e8c6d60c31b606082015260800190565b60208082526025908201527f455243313135353a207472616e7366657220746f20746865207a65726f206164604082015264647265737360d81b606082015260800190565b6020808252602a908201527f455243313135353a20696e73756666696369656e742062616c616e636520666f60408201526939103a3930b739b332b960b11b606082015260800190565b6040815260006134bc6040830185612ebf565b82810360208401526134ce8185612ebf565b95945050505050565b600083516134e9818460208801612abc565b83519083019061338b818360208801612abc565b60208082526023908201527f455243313135353a206275726e2066726f6d20746865207a65726f206164647260408201526265737360e81b606082015260800190565b60208082526024908201527f455243313135353a206275726e20616d6f756e7420657863656564732062616c604082015263616e636560e01b606082015260800190565b6001600160a01b0386811682528516602082015260a0604082018190526000906135b090830186612ebf565b82810360608401526135c28186612ebf565b905082810360808401526135d68185612ae8565b98975050505050505050565b6000602082840312156135f457600080fd5b815161294e81612955565b600060033d11156136185760046000803e5060005160e01c5b90565b600060443d10156136295790565b6040516003193d81016004833e81513d6001600160401b03816024840111818411171561365857505050505090565b82850191508151818111156136705750505050505090565b843d870101602082850101111561368a5750505050505090565b6136996020828601018761299e565b509095945050505050565b60208082526028908201527f455243313135353a204552433131353552656365697665722072656a656374656040820152676420746f6b656e7360c01b606082015260800190565b6001600160a01b03868116825285166020820152604081018490526060810183905260a06080820181905260009061372690830184612ae8565b979650505050505050565b600181811c9082168061374557607f821691505b6020821081141561376657634e487b7160e01b600052602260045260246000fd5b5091905056fea2646970667358221220c8cb81cffea22abb4612b76d1e60aeba991eb947284f8e5d58979bd471ecebb564736f6c6343000809003368747470733a2f2f6261667962656962787968646e653478337571626c6c6a6b6c3261657478766c64747062346c637473746a7165323279723737676e726e6c6169612e697066732e6e667473746f726167652e6c696e6b2f7b69647d2e6a736f6e",
  "deployedBytecode": "0x608060405234801561001057600080fd5b50600436106101c35760003560e01c80634e1273f4116100f9578063a22cb46511610097578063e985e9c511610071578063e985e9c5146104e6578063f242432a14610522578063f2fde38b14610535578063f5298aca1461054857600080fd5b8063a22cb465146104b7578063b062d9b5146104ca578063baf45424146104d357600080fd5b80636ecd2306116100d35780636ecd23061461045b578063715018a61461046e57806378655c09146104765780638da5cb5b1461049c57600080fd5b80634e1273f4146104155780635b3fdb6a146104355780636b20c4541461044857600080fd5b80631795e83c11610166578063280e31cc11610140578063280e31cc146102df5780632eb2c2d6146102ff5780633779a025146103125780634d4e8dfa1461031b57600080fd5b80631795e83c1461028c57806317cb4935146102ac5780631bd95155146102cc57600080fd5b806302fe5305116101a257806302fe530514610231578063039f82f8146102465780630962ef79146102595780630e89341c1461026c57600080fd5b8062fdd58e146101c85780630103c92b146101ee57806301ffc9a71461020e575b600080fd5b6101db6101d6366004612909565b61055b565b6040519081526020015b60405180910390f35b6101db6101fc366004612933565b60066020526000908152604090205481565b61022161021c36600461296b565b6105f4565b60405190151581526020016101e5565b61024461023f366004612a27565b610644565b005b610244610254366004612a6f565b610658565b610244610267366004612aa3565b610a93565b61027f61027a366004612aa3565b610aba565b6040516101e59190612b14565b6101db61029a366004612933565b600a6020526000908152604090205481565b6102bf6102ba366004612933565b610aeb565b6040516101e59190612b97565b6101db6102da366004612a27565b610d90565b6101db6102ed366004612933565b60076020526000908152604090205481565b61024461030d366004612d4c565b610e34565b6101db6103e881565b6103a9610329366004612aa3565b6008602052600090815260409020805460018201546002830154600390930154919260ff80831693610100840482169362010000810483169363010000008204841693640100000000830481169365010000000000840482169366010000000000008104831693600160381b8204841693600160401b909204909116918c565b604080519c8d5260ff9b8c1660208e0152998b16998c019990995296891660608b015294881660808a015292871660a089015290861660c0880152851660e0870152909316610100850152911515610120840152610140830191909152610160820152610180016101e5565b610428610423366004612df5565b610e80565b6040516101e59190612efa565b610244610443366004612aa3565b610fa9565b610244610456366004612f0d565b61140c565b610244610469366004612f80565b611454565b610244611928565b610489610484366004612aa3565b61193c565b60405161ffff90911681526020016101e5565b6003546040516001600160a01b0390911681526020016101e5565b6102446104c5366004612fa3565b611974565b6101db60055481565b6101db6104e1366004612909565b611983565b6102216104f4366004612fd4565b6001600160a01b03918216600090815260016020908152604080832093909416825291909152205460ff1690565b610244610530366004613007565b6119b4565b610244610543366004612933565b6119f9565b61024461055636600461306b565b611a6f565b60006001600160a01b0383166105cb5760405162461bcd60e51b815260206004820152602a60248201527f455243313135353a2061646472657373207a65726f206973206e6f742061207660448201526930b634b21037bbb732b960b11b60648201526084015b60405180910390fd5b506000818152602081815260408083206001600160a01b03861684529091529020545b92915050565b60006001600160e01b03198216636cdb3d1360e11b148061062557506001600160e01b031982166303a24d0760e21b145b806105ee57506301ffc9a760e01b6001600160e01b03198316146105ee565b61064c611ab2565b61065581611b0c565b50565b6000828152600860205260409020805483146106ac5760405162461bcd60e51b815260206004820152601360248201527214dc1858d954da1a5c081b9bdd08199bdd5b99606a1b60448201526064016105c2565b60048101546006116107105760405162461bcd60e51b815260206004820152602760248201527f43616e2774207570677261646520736869702c2073706f7473206c696d6974206044820152661c995858da195960ca1b60648201526084016105c2565b6000805b600483015481101561079c5783600381111561073257610732612b27565b8360040182815481106107475761074761309e565b90600052602060002090602091828204019190069054906101000a900460ff16600381111561077857610778612b27565b141561078c5781610788816130ca565b9250505b610795816130ea565b9050610714565b5060008360038111156107b1576107b1612b27565b14156108535760038160ff161061081b5760405162461bcd60e51b815260206004820152602860248201527f43616e277420757067726164652c2061726d6f722073706f7473206c696d6974604482015267081c995858da195960c21b60648201526084016105c2565b6001820180546002919060009061083690849060ff16613105565b92506101000a81548160ff021916908360ff160217905550610a45565b600183600381111561086757610867612b27565b14156108ef5760ff8116156108d05760405162461bcd60e51b815260206004820152602960248201527f43616e277420757067726164652c20656e67696e652073706f7473206c696d696044820152681d081c995858da195960ba1b60648201526084016105c2565b600182810180546003906108369084906301000000900460ff16613105565b600383600381111561090357610903612b27565b141561098c5760028160ff161061096e5760405162461bcd60e51b815260206004820152602960248201527f43616e277420757067726164652c20776561706f6e2073706f7473206c696d696044820152681d081c995858da195960ba1b60648201526084016105c2565b6001828101805460029290610836908490610100900460ff16613105565b60028360038111156109a0576109a0612b27565b1415610a455760028160ff1610610a0b5760405162461bcd60e51b815260206004820152602960248201527f43616e277420757067726164652c20656e657267792073706f7473206c696d696044820152681d081c995858da195960ba1b60648201526084016105c2565b60028260010160068282829054906101000a900460ff16610a2c9190613105565b92506101000a81548160ff021916908360ff1602179055505b600482018054600181018255600091825260209182902091810490910180548592601f166101000a60ff81021990911690836003811115610a8857610a88612b27565b021790555050505050565b3360009081526006602052604081208054839290610ab290849061312a565b909155505050565b6060610ac582611b1f565b604051602001610ad59190613142565b6040516020818303038152906040529050919050565b6001600160a01b038116600090815260096020526040812054606091906001600160401b03811115610b1f57610b1f612988565b604051908082528060200260200182016040528015610bb857816020015b604080516101a0810182526000808252602080830182905292820181905260608083018290526080830182905260a0830182905260c0830182905260e083018290526101008301829052610120830182905261014083018290526101608301919091526101808201528252600019909201910181610b3d5790505b50905060005b6001600160a01b038416600090815260096020526040902054811015610d89576001600160a01b03841660009081526009602052604081208054600892919084908110610c0d57610c0d61309e565b60009182526020808320909101548352828101939093526040918201902081516101a08101835281548152600182015460ff808216838701526101008083048216848701526201000083048216606085015263010000008304821660808501526401000000008304821660a0850152650100000000008304821660c085015266010000000000008304821660e0850152600160381b8304821690840152600160401b9091041615156101208201526002820154610140820152600382015461016082015260048201805484518187028101870190955280855291949293610180860193909290830182828015610d5257602002820191906000526020600020906000905b82829054906101000a900460ff166003811115610d3057610d30612b27565b815260206001928301818104948501949093039092029101808411610d115790505b505050505081525050828281518110610d6d57610d6d61309e565b602002602001018190525080610d82906130ea565b9050610bbe565b5092915050565b60008082815b8151811015610e2b576000818351610dae91906131d6565b90506000838381518110610dc457610dc461309e565b01602001516001600160f81b03198116915060f81c6000610de66030836131d6565b9050610df36001856131d6565b610dfe90600a6132d1565b610e0890826132dd565b610e12908861312a565b9650505050508080610e23906130ea565b915050610d96565b50909392505050565b6001600160a01b038516331480610e505750610e5085336104f4565b610e6c5760405162461bcd60e51b81526004016105c2906132fc565b610e798585858585611c24565b5050505050565b60608151835114610ee55760405162461bcd60e51b815260206004820152602960248201527f455243313135353a206163636f756e747320616e6420696473206c656e677468604482015268040dad2e6dac2e8c6d60bb1b60648201526084016105c2565b600083516001600160401b03811115610f0057610f00612988565b604051908082528060200260200182016040528015610f29578160200160208202803683370190505b50905060005b8451811015610fa157610f74858281518110610f4d57610f4d61309e565b6020026020010151858381518110610f6757610f6761309e565b602002602001015161055b565b828281518110610f8657610f8661309e565b6020908102919091010152610f9a816130ea565b9050610f2f565b509392505050565b600081815260086020908152604080832033845260098352818420805483518186028101860190945280845291949361101893929083018282801561100d57602002820191906000526020600020905b815481526020019060010190808311610ff9575b505050505084611dce565b915050806110685760405162461bcd60e51b815260206004820152601d60248201527f596f7520646f6e2774206861766520746869732053706163655368697000000060448201526064016105c2565b6001820154600364010000000090910460ff16106110d45760405162461bcd60e51b815260206004820152602360248201527f596f752063616e277420696e63726561736520537061636553686970206c657660448201526232b61760e91b60648201526084016105c2565b60018281015460009164010000000090910460ff1614156111755733600090815260066020526040902054620186a0106111445760405162461bcd60e51b81526020600482015260116024820152704e656564206d6f72652062616c616e636560781b60448201526064016105c2565b3360009081526006602052604081208054620186a092906111669084906131d6565b90915550600291506111f69050565b336000908152600660205260409020546207a120106111ca5760405162461bcd60e51b81526020600482015260116024820152704e656564206d6f72652062616c616e636560781b60448201526064016105c2565b33600090815260066020526040812080546207a12092906111ec9084906131d6565b9091555060039150505b60018301546000906112339061121590600160381b900460ff16611b1f565b600186015461122e90640100000000900460ff16611b1f565b611e2e565b90506112493361124283610d90565b6001611e5a565b60018401546000906112749061126890600160381b900460ff16611b1f565b61122e8560ff16611b1f565b905061129a3361128383610d90565b600160405180602001604052806000815250611f77565b6001808601805460ff8087166401000000000264ff000000001990921691909117918290556201000090910416141561130857600185810180546002906112eb90849062010000900460ff16613105565b92506101000a81548160ff021916908360ff16021790555061133f565b60018581018054600a9290611326908490610100900460ff16613105565b92506101000a81548160ff021916908360ff1602179055505b6001850180546014919060009061135a90849060ff16613105565b92506101000a81548160ff021916908360ff16021790555060148560010160068282829054906101000a900460ff166113939190613105565b92506101000a81548160ff021916908360ff16021790555060018560010160038282829054906101000a900460ff166113cc9190613105565b825460ff9182166101009390930a92830291909202199091161790555050505060018201805468ff00000000000000001916905550600060029091015550565b6001600160a01b038316331480611428575061142883336104f4565b6114445760405162461bcd60e51b81526004016105c2906132fc565b61144f838383612091565b505050565b60045460ff821611156114a95760405162461bcd60e51b815260206004820152601860248201527f53706163655368697020646f65736e277420657869737473000000000000000060448201526064016105c2565b60008160ff16116114f15760405162461bcd60e51b815260206004820152601260248201527115dc9bdb99c814dc1858d954da1a5c08125160721b60448201526064016105c2565b336000908152600960205260409020541561154e5760405162461bcd60e51b815260206004820152601a60248201527f596f7520616c726561647920686176652053706163655368697000000000000060448201526064016105c2565b600061155b60018361334b565b90506103e860048260ff16815481106115765761157661309e565b60009182526020909120601082040154600f9091166002026101000a900461ffff16106116005760405162461bcd60e51b815260206004820152603260248201527f4e6f206d6f7265207368697073206f662074686973206d6f646966696361746960448201527137b71034b71037bab91039ba30ba34b7b71760711b60648201526084016105c2565b6000600560008154611611906130ea565b91829055509050600061163361162960ff8616611b1f565b61122e6001611b1f565b90506116423361128383610d90565b600160048460ff168154811061165a5761165a61309e565b90600052602060002090601091828204019190066002028282829054906101000a900461ffff1661168b919061336e565b92506101000a81548161ffff021916908361ffff1602179055506000806000806116b78860ff1661222f565b93509350935093506000604051806101a001604052808881526020018660ff1681526020018560ff1681526020018360ff1681526020018460ff168152602001600160ff168152602001600a60ff168152602001600a60ff1681526020018a60ff168152602001600015158152602001600081526020016000815260200160006001600160401b0381111561174e5761174e612988565b604051908082528060200260200182016040528015611777578160200160208202803683370190505b50815250905080600860008981526020019081526020016000206000820151816000015560208201518160010160006101000a81548160ff021916908360ff16021790555060408201518160010160016101000a81548160ff021916908360ff16021790555060608201518160010160026101000a81548160ff021916908360ff16021790555060808201518160010160036101000a81548160ff021916908360ff16021790555060a08201518160010160046101000a81548160ff021916908360ff16021790555060c08201518160010160056101000a81548160ff021916908360ff16021790555060e08201518160010160066101000a81548160ff021916908360ff1602179055506101008201518160010160076101000a81548160ff021916908360ff1602179055506101208201518160010160086101000a81548160ff021916908315150217905550610140820151816002015561016082015181600301556101808201518160040190805190602001906118f89291906127b0565b50503360009081526009602090815260408220805460018101825590835291200197909755505050505050505050565b611930611ab2565b61193a60006122c0565b565b6004818154811061194c57600080fd5b9060005260206000209060109182820401919006600202915054906101000a900461ffff1681565b61197f338383612312565b5050565b6009602052816000526040600020818154811061199f57600080fd5b90600052602060002001600091509150505481565b6001600160a01b0385163314806119d057506119d085336104f4565b6119ec5760405162461bcd60e51b81526004016105c2906132fc565b610e7985858585856123f3565b611a01611ab2565b6001600160a01b038116611a665760405162461bcd60e51b815260206004820152602660248201527f4f776e61626c653a206e6577206f776e657220697320746865207a65726f206160448201526564647265737360d01b60648201526084016105c2565b610655816122c0565b6001600160a01b038316331480611a8b5750611a8b83336104f4565b611aa75760405162461bcd60e51b81526004016105c2906132fc565b61144f838383611e5a565b6003546001600160a01b0316331461193a5760405162461bcd60e51b815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e657260448201526064016105c2565b805161197f906002906020840190612864565b606081611b435750506040805180820190915260018152600360fc1b602082015290565b8160005b8115611b6d5780611b57816130ea565b9150611b669050600a836133aa565b9150611b47565b6000816001600160401b03811115611b8757611b87612988565b6040519080825280601f01601f191660200182016040528015611bb1576020820181803683370190505b5090505b8415611c1c57611bc66001836131d6565b9150611bd3600a866133be565b611bde90603061312a565b60f81b818381518110611bf357611bf361309e565b60200101906001600160f81b031916908160001a905350611c15600a866133aa565b9450611bb5565b949350505050565b8151835114611c455760405162461bcd60e51b81526004016105c2906133d2565b6001600160a01b038416611c6b5760405162461bcd60e51b81526004016105c29061341a565b33611c7a81878787878761252b565b60005b8451811015611d60576000858281518110611c9a57611c9a61309e565b602002602001015190506000858381518110611cb857611cb861309e565b602090810291909101810151600084815280835260408082206001600160a01b038e168352909352919091205490915081811015611d085760405162461bcd60e51b81526004016105c29061345f565b6000838152602081815260408083206001600160a01b038e8116855292528083208585039055908b16825281208054849290611d4590849061312a565b9250508190555050505080611d59906130ea565b9050611c7d565b50846001600160a01b0316866001600160a01b0316826001600160a01b03167f4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb8787604051611db09291906134a9565b60405180910390a4611dc6818787878787612530565b505050505050565b81516000908190815b81811015611e1d5784868281518110611df257611df261309e565b60200260200101511415611e0d57925060019150611e279050565b611e16816130ea565b9050611dd7565b5060008092509250505b9250929050565b60608282604051602001611e439291906134d7565b604051602081830303815290604052905092915050565b6001600160a01b038316611e805760405162461bcd60e51b81526004016105c2906134fd565b336000611e8c8461269b565b90506000611e998461269b565b9050611eb98387600085856040518060200160405280600081525061252b565b6000858152602081815260408083206001600160a01b038a16845290915290205484811015611efa5760405162461bcd60e51b81526004016105c290613540565b6000868152602081815260408083206001600160a01b038b81168086529184528285208a8703905582518b81529384018a90529092908816917fc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62910160405180910390a46040805160208101909152600090525b50505050505050565b6001600160a01b038416611fd75760405162461bcd60e51b815260206004820152602160248201527f455243313135353a206d696e7420746f20746865207a65726f206164647265736044820152607360f81b60648201526084016105c2565b336000611fe38561269b565b90506000611ff08561269b565b90506120018360008985858961252b565b6000868152602081815260408083206001600160a01b038b1684529091528120805487929061203190849061312a565b909155505060408051878152602081018790526001600160a01b03808a1692600092918716917fc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62910160405180910390a4611f6e836000898989896126e6565b6001600160a01b0383166120b75760405162461bcd60e51b81526004016105c2906134fd565b80518251146120d85760405162461bcd60e51b81526004016105c2906133d2565b60003390506120fb8185600086866040518060200160405280600081525061252b565b60005b83518110156121c057600084828151811061211b5761211b61309e565b6020026020010151905060008483815181106121395761213961309e565b602090810291909101810151600084815280835260408082206001600160a01b038c1683529093529190912054909150818110156121895760405162461bcd60e51b81526004016105c290613540565b6000928352602083815260408085206001600160a01b038b16865290915290922091039055806121b8816130ea565b9150506120fe565b5060006001600160a01b0316846001600160a01b0316826001600160a01b03167f4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb86866040516122119291906134a9565b60405180910390a46040805160208101909152600090525b50505050565b60008060008084600b1415612252575060199250600c91506005905060016122b9565b846015141561226f5750601a9250600a91506006905060016122b9565b84601f141561228c575060159250600791506004905060026122b9565b84602914156122a95750601a9250600b91506005905060016122b9565b5060179250600691506004905060025b9193509193565b600380546001600160a01b038381166001600160a01b0319831681179093556040519116919082907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e090600090a35050565b816001600160a01b0316836001600160a01b031614156123865760405162461bcd60e51b815260206004820152602960248201527f455243313135353a2073657474696e6720617070726f76616c20737461747573604482015268103337b91039b2b63360b91b60648201526084016105c2565b6001600160a01b03838116600081815260016020908152604080832094871680845294825291829020805460ff191686151590811790915591519182527f17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31910160405180910390a3505050565b6001600160a01b0384166124195760405162461bcd60e51b81526004016105c29061341a565b3360006124258561269b565b905060006124328561269b565b905061244283898985858961252b565b6000868152602081815260408083206001600160a01b038c168452909152902054858110156124835760405162461bcd60e51b81526004016105c29061345f565b6000878152602081815260408083206001600160a01b038d8116855292528083208985039055908a168252812080548892906124c090849061312a565b909155505060408051888152602081018890526001600160a01b03808b16928c821692918816917fc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62910160405180910390a4612520848a8a8a8a8a6126e6565b505050505050505050565b611dc6565b6001600160a01b0384163b15611dc65760405163bc197c8160e01b81526001600160a01b0385169063bc197c81906125749089908990889088908890600401613584565b602060405180830381600087803b15801561258e57600080fd5b505af19250505080156125be575060408051601f3d908101601f191682019092526125bb918101906135e2565b60015b61266b576125ca6135ff565b806308c379a0141561260457506125df61361b565b806125ea5750612606565b8060405162461bcd60e51b81526004016105c29190612b14565b505b60405162461bcd60e51b815260206004820152603460248201527f455243313135353a207472616e7366657220746f206e6f6e20455243313135356044820152732932b1b2b4bb32b91034b6b83632b6b2b73a32b960611b60648201526084016105c2565b6001600160e01b0319811663bc197c8160e01b14611f6e5760405162461bcd60e51b81526004016105c2906136a4565b604080516001808252818301909252606091600091906020808301908036833701905050905082816000815181106126d5576126d561309e565b602090810291909101015292915050565b6001600160a01b0384163b15611dc65760405163f23a6e6160e01b81526001600160a01b0385169063f23a6e619061272a90899089908890889088906004016136ec565b602060405180830381600087803b15801561274457600080fd5b505af1925050508015612774575060408051601f3d908101601f19168201909252612771918101906135e2565b60015b612780576125ca6135ff565b6001600160e01b0319811663f23a6e6160e01b14611f6e5760405162461bcd60e51b81526004016105c2906136a4565b82805482825590600052602060002090601f016020900481019282156128545791602002820160005b8382111561282557835183826101000a81548160ff0219169083600381111561280457612804612b27565b021790555092602001926001016020816000010492830192600103026127d9565b80156128525782816101000a81549060ff0219169055600101602081600001049283019260010302612825565b505b506128609291506128d8565b5090565b82805461287090613731565b90600052602060002090601f0160209004810192826128925760008555612854565b82601f106128ab57805160ff1916838001178555612854565b82800160010185558215612854579182015b828111156128545782518255916020019190600101906128bd565b5b8082111561286057600081556001016128d9565b80356001600160a01b038116811461290457600080fd5b919050565b6000806040838503121561291c57600080fd5b612925836128ed565b946020939093013593505050565b60006020828403121561294557600080fd5b61294e826128ed565b9392505050565b6001600160e01b03198116811461065557600080fd5b60006020828403121561297d57600080fd5b813561294e81612955565b634e487b7160e01b600052604160045260246000fd5b601f8201601f191681016001600160401b03811182821017156129c3576129c3612988565b6040525050565b60006001600160401b038311156129e3576129e3612988565b6040516129fa601f8501601f19166020018261299e565b809150838152848484011115612a0f57600080fd5b83836020830137600060208583010152509392505050565b600060208284031215612a3957600080fd5b81356001600160401b03811115612a4f57600080fd5b8201601f81018413612a6057600080fd5b611c1c848235602084016129ca565b60008060408385031215612a8257600080fd5b82359150602083013560048110612a9857600080fd5b809150509250929050565b600060208284031215612ab557600080fd5b5035919050565b60005b83811015612ad7578181015183820152602001612abf565b838111156122295750506000910152565b60008151808452612b00816020860160208601612abc565b601f01601f19169290920160200192915050565b60208152600061294e6020830184612ae8565b634e487b7160e01b600052602160045260246000fd5b60008151808452602080850194508084016000805b84811015612b8b5782516004808210612b7857634e487b7160e01b845260218152602484fd5b5088529683019691830191600101612b52565b50959695505050505050565b60006020808301818452808551808352604092508286019150828160051b87010184880160005b83811015612c8a57603f198984030185528151805184528781015160ff908116898601528782015181168886015260608083015182169086015260808083015182169086015260a08083015182169086015260c08083015182169086015260e08083015182169086015261010080830151909116908501526101208082015115159085015261014080820151908501526101608082015190850152610180908101516101a091850182905290612c7681860183612b3d565b968901969450505090860190600101612bbe565b509098975050505050505050565b60006001600160401b03821115612cb157612cb1612988565b5060051b60200190565b600082601f830112612ccc57600080fd5b81356020612cd982612c98565b604051612ce6828261299e565b83815260059390931b8501820192828101915086841115612d0657600080fd5b8286015b84811015612d215780358352918301918301612d0a565b509695505050505050565b600082601f830112612d3d57600080fd5b61294e838335602085016129ca565b600080600080600060a08688031215612d6457600080fd5b612d6d866128ed565b9450612d7b602087016128ed565b935060408601356001600160401b0380821115612d9757600080fd5b612da389838a01612cbb565b94506060880135915080821115612db957600080fd5b612dc589838a01612cbb565b93506080880135915080821115612ddb57600080fd5b50612de888828901612d2c565b9150509295509295909350565b60008060408385031215612e0857600080fd5b82356001600160401b0380821115612e1f57600080fd5b818501915085601f830112612e3357600080fd5b81356020612e4082612c98565b604051612e4d828261299e565b83815260059390931b8501820192828101915089841115612e6d57600080fd5b948201945b83861015612e9257612e83866128ed565b82529482019490820190612e72565b96505086013592505080821115612ea857600080fd5b50612eb585828601612cbb565b9150509250929050565b600081518084526020808501945080840160005b83811015612eef57815187529582019590820190600101612ed3565b509495945050505050565b60208152600061294e6020830184612ebf565b600080600060608486031215612f2257600080fd5b612f2b846128ed565b925060208401356001600160401b0380821115612f4757600080fd5b612f5387838801612cbb565b93506040860135915080821115612f6957600080fd5b50612f7686828701612cbb565b9150509250925092565b600060208284031215612f9257600080fd5b813560ff8116811461294e57600080fd5b60008060408385031215612fb657600080fd5b612fbf836128ed565b915060208301358015158114612a9857600080fd5b60008060408385031215612fe757600080fd5b612ff0836128ed565b9150612ffe602084016128ed565b90509250929050565b600080600080600060a0868803121561301f57600080fd5b613028866128ed565b9450613036602087016128ed565b9350604086013592506060860135915060808601356001600160401b0381111561305f57600080fd5b612de888828901612d2c565b60008060006060848603121561308057600080fd5b613089846128ed565b95602085013595506040909401359392505050565b634e487b7160e01b600052603260045260246000fd5b634e487b7160e01b600052601160045260246000fd5b600060ff821660ff8114156130e1576130e16130b4565b60010192915050565b60006000198214156130fe576130fe6130b4565b5060010190565b600060ff821660ff84168060ff03821115613122576131226130b4565b019392505050565b6000821982111561313d5761313d6130b4565b500190565b7f68747470733a2f2f697066732e696f2f697066732f626166796265696278796881527f646e653478337571626c6c6a6b6c3261657478766c64747062346c637473746a6020820152707165323279723737676e726e6c6169612f60781b6040820152600082516131ba816051850160208701612abc565b64173539b7b760d91b6051939091019283015250605601919050565b6000828210156131e8576131e86130b4565b500390565b600181815b8085111561322857816000190482111561320e5761320e6130b4565b8085161561321b57918102915b93841c93908002906131f2565b509250929050565b60008261323f575060016105ee565b8161324c575060006105ee565b8160018114613262576002811461326c57613288565b60019150506105ee565b60ff84111561327d5761327d6130b4565b50506001821b6105ee565b5060208310610133831016604e8410600b84101617156132ab575081810a6105ee565b6132b583836131ed565b80600019048211156132c9576132c96130b4565b029392505050565b600061294e8383613230565b60008160001904831182151516156132f7576132f76130b4565b500290565b6020808252602f908201527f455243313135353a2063616c6c6572206973206e6f7420746f6b656e206f776e60408201526e195c881b9bdc88185c1c1c9bdd9959608a1b606082015260800190565b600060ff821660ff841680821015613365576133656130b4565b90039392505050565b600061ffff80831681851680830382111561338b5761338b6130b4565b01949350505050565b634e487b7160e01b600052601260045260246000fd5b6000826133b9576133b9613394565b500490565b6000826133cd576133cd613394565b500690565b60208082526028908201527f455243313135353a2069647320616e6420616d6f756e7473206c656e677468206040820152670dad2e6dac2e8c6d60c31b606082015260800190565b60208082526025908201527f455243313135353a207472616e7366657220746f20746865207a65726f206164604082015264647265737360d81b606082015260800190565b6020808252602a908201527f455243313135353a20696e73756666696369656e742062616c616e636520666f60408201526939103a3930b739b332b960b11b606082015260800190565b6040815260006134bc6040830185612ebf565b82810360208401526134ce8185612ebf565b95945050505050565b600083516134e9818460208801612abc565b83519083019061338b818360208801612abc565b60208082526023908201527f455243313135353a206275726e2066726f6d20746865207a65726f206164647260408201526265737360e81b606082015260800190565b60208082526024908201527f455243313135353a206275726e20616d6f756e7420657863656564732062616c604082015263616e636560e01b606082015260800190565b6001600160a01b0386811682528516602082015260a0604082018190526000906135b090830186612ebf565b82810360608401526135c28186612ebf565b905082810360808401526135d68185612ae8565b98975050505050505050565b6000602082840312156135f457600080fd5b815161294e81612955565b600060033d11156136185760046000803e5060005160e01c5b90565b600060443d10156136295790565b6040516003193d81016004833e81513d6001600160401b03816024840111818411171561365857505050505090565b82850191508151818111156136705750505050505090565b843d870101602082850101111561368a5750505050505090565b6136996020828601018761299e565b509095945050505050565b60208082526028908201527f455243313135353a204552433131353552656365697665722072656a656374656040820152676420746f6b656e7360c01b606082015260800190565b6001600160a01b03868116825285166020820152604081018490526060810183905260a06080820181905260009061372690830184612ae8565b979650505050505050565b600181811c9082168061374557607f821691505b6020821081141561376657634e487b7160e01b600052602260045260246000fd5b5091905056fea2646970667358221220c8cb81cffea22abb4612b76d1e60aeba991eb947284f8e5d58979bd471ecebb564736f6c63430008090033",
  "linkReferences": {},
  "deployedLinkReferences": {}
}][0];
          ct.web3.contract = new ethers.Contract(
            ct.web3.contractAddress,
            contractABI.abi ? contractABI.abi : contractABI,
            signer
          );
          ct.web3.isConnected = true;
        }
      });
    } catch (e) {
      alert("Error on contract initialisation, please check Contract ABI");
    }
  };

  const switchNetwork = async () => {
    const chainHex = ethers.utils.hexStripZeros(ethers.utils.hexlify(ct.web3.chainId));
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainHex }],
      });
    } catch (switchError) {
      if (switchError.code === 4902 && ct.web3.chainId) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: chainHex,
              chainName: currentChain.chainName,
              rpcUrls: currentChain.rpcUrls,
              blockExplorerUrls: currentChain.blockExplorerUrls,
              nativeCurrency: {
                symbol: currentChain.currencySymbol,
                decimals: currentChain.currencyDecimals
              }
            }]
        });
      }
    }
  }

  const initAlchemy = () => {
    const callAlchemyAPI = async (method, params) => {
      const apiKey = "CQVVxy7Ws2E9HYVsBjj19gcbUmzAIzuJ";
      const baseURL = window.defaultChainSettings["mumbai-testnet"].alchemyURL;

      if (baseURL.length) {
        let fetchURL = `${baseURL}/${apiKey}/${method}/`;
        if (Object.keys(params).length) {
          const searchParams = Object.keys(params).map(key => {
            if (Array.isArray(params[key])) {
              return params[key].map(item => key + '[]=' + item).join('&');
            } else {
              return key + '=' + params[key];
            }
          }).join('&');
          fetchURL += `?${searchParams}`;
        }

        return await fetch(fetchURL, {
          method: 'GET',
          redirect: 'follow'
        }).then(response => response.json());
      } else {
        alert('Chain not supported');
      }
    }

    /**
     * Gets all NFTs currently owned by a given address.
     * @param owner string (required) - Address for NFT owner.
     * @param pageKey string - UUID for pagination.
     * @param contractAddresses array of strings - Array of contract addresses to filter the responses with.
     * @param withMetadata boolean - if true query will include metadata for each returned token.
     * @param filters array of strings - Array of filters (as ENUMS) that will be applied to the query.
     * @link https://docs.alchemy.com/reference/getnfts
     * @return Promise
     */
    ct.web3.nft.getNFTs = (params) => {
      return new Promise((resolve, reject) => {
        callAlchemyAPI('getNFTs', params).then(result => {
          resolve(result);
        }).catch(err => reject(err));
      });
    };

    /**
     * Gets the metadata associated with a given NFT.
     * @param contractAddress string (required) - Address of NFT contract.
     * @param tokenId string (required) - Integer or Hexadecimal - Id for NFT.
     * @param tokenType string - 'ERC721' or 'ERC1155'.
     * @link https://docs.alchemy.com/reference/getnftmetadata
     * @return Promise
     */
    ct.web3.nft.getNFTMetadata = (params) => {
      return new Promise((resolve, reject) => {
        callAlchemyAPI('getNFTMetadata', params).then(result => {
          resolve(result);
        }).catch(err => reject(err));
      });
    };

    /**
     * Queries NFT high-level collection/contract level information.
     * @param contractAddress string (required) - Address of NFT contract.
     * @link https://docs.alchemy.com/reference/getcontractmetadata
     * @return Promise
     */
    ct.web3.nft.getContractMetadata = (params) => {
      return new Promise((resolve, reject) => {
        callAlchemyAPI('getContractMetadata', params).then(result => {
          resolve(result);
        }).catch(err => reject(err));
      });
    };

    /**
     * Gets minted NFTs for a given NFT contract.
     * @param contractAddress string (required) - Address of NFT contract.
     * @param withMetadata boolean - if true returns NFT metadata, otherwise will only return tokenIds.
     * @param startToken string - An offset used for pagination.
     * @param limit integer - Sets the total number of NFTs returned in the response. Defaults to 100.
     * @link https://docs.alchemy.com/reference/getnftsforcollection
     * @return Promise
     */
    ct.web3.nft.getNFTsForCollection = (params) => {
      return new Promise((resolve, reject) => {
        callAlchemyAPI('getNFTsForCollection', params).then(result => {
          resolve(result);
        }).catch(err => reject(err));
      });
    };

    /**
     * Get the owner(s) for a token.
     * @param contractAddress string (required) - Address of NFT contract.
     * @param tokenId string (required) - The ID of the token
     * @link https://docs.alchemy.com/reference/getownersfortoken
     * @return Promise
     */
    ct.web3.nft.getOwnersForToken = (params) => {
      return new Promise((resolve, reject) => {
        callAlchemyAPI('getOwnersForToken', params).then(result => {
          resolve(result);
        }).catch(err => reject(err));
      });
    };

    /**
     * Gets all owners for a given NFT contract.
     * @param contractAddress string (required) - Address of NFT collection.
     * @param withTokenBalances boolean - if true the query will include the token balances per token id for each owner.
     * @link https://docs.alchemy.com/reference/getownersforcollection
     * @return Promise
     */
    ct.web3.nft.getOwnersForCollection = (params) => {
      return new Promise((resolve, reject) => {
        callAlchemyAPI('getOwnersForCollection', params).then(result => {
          resolve(result);
        }).catch(err => reject(err));
      });
    };
  }

  // Reload game on switch chain
  const chainChangeEvent = () => {
    networkChangedCallback();
    initModule();
  };

  // Account change - connect and load new signer
  const accountChangeEvent = (account) => {
    accountChangedCallback();
    if (account.length) {
      initModule();
    } else {
      // metamask disconnected
      window.location.reload();
    }
  };

  const initModule = () => {
    const web3SwitchNetwork = document.querySelector(".web3-btn");

    // Cleanup listeners
    window.ethereum.removeListener("chainChanged", chainChangeEvent);
    window.ethereum.removeListener("accountsChanged", accountChangeEvent);
    web3SwitchNetwork.removeEventListener("click", switchNetwork);

    // Add listeners
    window.ethereum.on("chainChanged", chainChangeEvent);
    window.ethereum.on("accountsChanged", accountChangeEvent);
    web3SwitchNetwork.addEventListener("click", switchNetwork);

    isCorrectNetwork().then(isCorrect => {
      const alertMessage = document.getElementById('wrong-network-alert');
      if (!isCorrect) {
        // Show wrong network error message
        alertMessage.classList.add('visible');
      } else {
        // Hide wrong network error message
        alertMessage.classList.remove('visible');

        // Connect Metamask on init
        if (ct.web3.connectOnInit) {
          ct.web3.connect();
        }

        // Alchemy NFT API methods
        if ("CQVVxy7Ws2E9HYVsBjj19gcbUmzAIzuJ") {
          initAlchemy();
        }
      }
    });
  }

  window.addEventListener("load", function () {
    // Init module when all scripts loaded
    initModule();
  });

} else {
  const alertMessage = document.getElementById('no-metamask-alert');
  alertMessage.classList.add('visible');
}

(function ctMouse() {
    var keyPrefix = 'mouse.';
    var setKey = function (key, value) {
        ct.inputs.registry[keyPrefix + key] = value;
    };
    var buttonMap = {
        0: 'Left',
        1: 'Middle',
        2: 'Right',
        3: 'Special1',
        4: 'Special2',
        5: 'Special3',
        6: 'Special4',
        7: 'Special5',
        8: 'Special6',
        unknown: 'Unknown'
    };

    ct.mouse = {
        xui: 0,
        yui: 0,
        xprev: 0,
        yprev: 0,
        xuiprev: 0,
        yuiprev: 0,
        inside: false,
        pressed: false,
        down: false,
        released: false,
        button: 0,
        hovers(copy) {
            if (!copy.shape) {
                return false;
            }
            if (copy.shape.type === 'rect') {
                return ct.u.prect(ct.mouse.x, ct.mouse.y, copy);
            }
            if (copy.shape.type === 'circle') {
                return ct.u.pcircle(ct.mouse.x, ct.mouse.y, copy);
            }
            if (copy.shape.type === 'point') {
                return ct.mouse.x === copy.x && ct.mouse.y === copy.y;
            }
            return false;
        },
        hoversUi(copy) {
            if (!copy.shape) {
                return false;
            }
            if (copy.shape.type === 'rect') {
                return ct.u.prect(ct.mouse.xui, ct.mouse.yui, copy);
            }
            if (copy.shape.type === 'circle') {
                return ct.u.pcircle(ct.mouse.xui, ct.mouse.yui, copy);
            }
            if (copy.shape.type === 'point') {
                return ct.mouse.xui === copy.x && ct.mouse.yui === copy.y;
            }
            return false;
        },
        hide() {
            ct.pixiApp.renderer.view.style.cursor = 'none';
        },
        show() {
            ct.pixiApp.renderer.view.style.cursor = '';
        },
        get x() {
            return ct.u.uiToGameCoord(ct.mouse.xui, ct.mouse.yui).x;
        },
        get y() {
            return ct.u.uiToGameCoord(ct.mouse.xui, ct.mouse.yui).y;
        }
    };

    ct.mouse.listenerMove = function listenerMove(e) {
        var rect = ct.pixiApp.view.getBoundingClientRect();
        ct.mouse.xui = (e.clientX - rect.left) * ct.camera.width / rect.width;
        ct.mouse.yui = (e.clientY - rect.top) * ct.camera.height / rect.height;
        if (ct.mouse.xui > 0 &&
            ct.mouse.yui > 0 &&
            ct.mouse.yui < ct.camera.height &&
            ct.mouse.xui < ct.camera.width
        ) {
            ct.mouse.inside = true;
        } else {
            ct.mouse.inside = false;
        }
        window.focus();
    };
    ct.mouse.listenerDown = function listenerDown(e) {
        setKey(buttonMap[e.button] || buttonMap.unknown, 1);
        ct.mouse.pressed = true;
        ct.mouse.down = true;
        ct.mouse.button = e.button;
        window.focus();
        e.preventDefault();
    };
    ct.mouse.listenerUp = function listenerUp(e) {
        setKey(buttonMap[e.button] || buttonMap.unknown, 0);
        ct.mouse.released = true;
        ct.mouse.down = false;
        ct.mouse.button = e.button;
        window.focus();
        e.preventDefault();
    };
    ct.mouse.listenerContextMenu = function listenerContextMenu(e) {
        e.preventDefault();
    };
    ct.mouse.listenerWheel = function listenerWheel(e) {
        setKey('Wheel', ((e.wheelDelta || -e.detail) < 0) ? -1 : 1);
        //e.preventDefault();
    };

    ct.mouse.setupListeners = function setupListeners() {
        if (document.addEventListener) {
            document.addEventListener('mousemove', ct.mouse.listenerMove, false);
            document.addEventListener('mouseup', ct.mouse.listenerUp, false);
            document.addEventListener('mousedown', ct.mouse.listenerDown, false);
            document.addEventListener('wheel', ct.mouse.listenerWheel, false, {
                passive: false
            });
            document.addEventListener('contextmenu', ct.mouse.listenerContextMenu, false);
            document.addEventListener('DOMMouseScroll', ct.mouse.listenerWheel, {
                passive: false
            });
        } else { // IE?
            document.attachEvent('onmousemove', ct.mouse.listenerMove);
            document.attachEvent('onmouseup', ct.mouse.listenerUp);
            document.attachEvent('onmousedown', ct.mouse.listenerDown);
            document.attachEvent('onmousewheel', ct.mouse.listenerWheel);
            document.attachEvent('oncontextmenu', ct.mouse.listenerContextMenu);
        }
    };
})();

(
  function fittoscreen(ct) {
    document.body.style.overflow = 'hidden';
    var canv = ct.pixiApp.view;
    const positionCanvas = function positionCanvas(mode, scale) {
        if (mode === 'fastScale' || mode === 'fastScaleInteger') {
            canv.style.transform = `translate(-50%, -50%) scale(${scale})`;
            canv.style.position = 'absolute';
            canv.style.top = '50%';
            canv.style.left = '50%';
        } else if (mode === 'expandViewport' || mode === 'expand' || mode === 'scaleFill') {
            canv.style.position = 'static';
            canv.style.top = 'unset';
            canv.style.left = 'unset';
        } else if (mode === 'scaleFit') {
            canv.style.transform = 'translate(-50%, -50%)';
            canv.style.position = 'absolute';
            canv.style.top = '50%';
            canv.style.left = '50%';
        }
    };
    var resize = function resize() {
        const {mode} = ct.fittoscreen;
        const pixelScaleModifier = ct.highDensity ? (window.devicePixelRatio || 1) : 1;
        const kw = window.innerWidth / ct.roomWidth,
              kh = window.innerHeight / ct.roomHeight;
        let k = Math.min(kw, kh);
        if (mode === 'fastScaleInteger') {
            k = k < 1 ? k : Math.floor(k);
        }
        var canvasWidth, canvasHeight,
            cameraWidth, cameraHeight;
        if (mode === 'expandViewport' || mode === 'expand') {
            canvasWidth = Math.ceil(window.innerWidth * pixelScaleModifier);
            canvasHeight = Math.ceil(window.innerHeight * pixelScaleModifier);
            cameraWidth = window.innerWidth;
            cameraHeight = window.innerHeight;
        } else if (mode === 'fastScale' || mode === 'fastScaleInteger') {
            canvasWidth = Math.ceil(ct.roomWidth * pixelScaleModifier);
            canvasHeight = Math.ceil(ct.roomHeight * pixelScaleModifier);
            cameraWidth = ct.roomWidth;
            cameraHeight = ct.roomHeight;
        } else if (mode === 'scaleFit' || mode === 'scaleFill') {
            if (mode === 'scaleFill') {
                canvasWidth = Math.ceil(ct.roomWidth * kw * pixelScaleModifier);
                canvasHeight = Math.ceil(ct.roomHeight * kh * pixelScaleModifier);
                cameraWidth = window.innerWidth / k;
                cameraHeight = window.innerHeight / k;
            } else { // scaleFit
                canvasWidth = Math.ceil(ct.roomWidth * k * pixelScaleModifier);
                canvasHeight = Math.ceil(ct.roomHeight * k * pixelScaleModifier);
                cameraWidth = ct.roomWidth;
                cameraHeight = ct.roomHeight;
            }
        }

        ct.pixiApp.renderer.resize(canvasWidth, canvasHeight);
        if (mode !== 'scaleFill' && mode !== 'scaleFit') {
            ct.pixiApp.stage.scale.x = ct.pixiApp.stage.scale.y = pixelScaleModifier;
        } else {
            ct.pixiApp.stage.scale.x = ct.pixiApp.stage.scale.y = pixelScaleModifier * k;
        }
        canv.style.width = Math.ceil(canvasWidth / pixelScaleModifier) + 'px';
        canv.style.height = Math.ceil(canvasHeight / pixelScaleModifier) + 'px';
        if (ct.camera) {
            ct.camera.width = cameraWidth;
            ct.camera.height = cameraHeight;
        }
        positionCanvas(mode, k);
    };
    var toggleFullscreen = function () {
        try {
            // Are we in Electron?
            const win = require('electron').remote.BrowserWindow.getFocusedWindow();
            win.setFullScreen(!win.isFullScreen());
            return;
        } catch (e) {
            void e; // Continue with web approach
        }
        var canvas = document.fullscreenElement ||
                     document.webkitFullscreenElement ||
                     document.mozFullScreenElement ||
                     document.msFullscreenElement,
            requester = document.getElementById('ct'),
            request = requester.requestFullscreen ||
                      requester.webkitRequestFullscreen ||
                      requester.mozRequestFullScreen ||
                      requester.msRequestFullscreen,
            exit = document.exitFullscreen ||
                   document.webkitExitFullscreen ||
                   document.mozCancelFullScreen ||
                   document.msExitFullscreen;
        if (!canvas) {
            var promise = request.call(requester);
            if (promise) {
                promise
                .catch(function fullscreenError(err) {
                    console.error('[ct.fittoscreen]', err);
                });
            }
        } else if (exit) {
            exit.call(document);
        }
    };
    var queuedFullscreen = function queuedFullscreen() {
        toggleFullscreen();
        document.removeEventListener('mouseup', queuedFullscreen);
        document.removeEventListener('keyup', queuedFullscreen);
        document.removeEventListener('click', queuedFullscreen);
    };
    var queueFullscreen = function queueFullscreen() {
        document.addEventListener('mouseup', queuedFullscreen);
        document.addEventListener('keyup', queuedFullscreen);
        document.addEventListener('click', queuedFullscreen);
    };
    window.addEventListener('resize', resize);
    ct.fittoscreen = resize;
    ct.fittoscreen.toggleFullscreen = queueFullscreen;
    var $mode = 'scaleFit';
    Object.defineProperty(ct.fittoscreen, 'mode', {
        configurable: false,
        enumerable: true,
        set(value) {
            $mode = value;
        },
        get() {
            return $mode;
        }
    });
    ct.fittoscreen.mode = $mode;
    ct.fittoscreen.getIsFullscreen = function getIsFullscreen() {
        try {
            // Are we in Electron?
            const win = require('electron').remote.BrowserWindow.getFocusedWindow;
            return win.isFullScreen;
        } catch (e) {
            void e; // Continue with web approach
        }
        return document.fullscreen || document.webkitIsFullScreen || document.mozFullScreen;
    };
})(ct);
/**
 * @typedef {ITextureOptions}
 * @property {} []
 */

(function resAddon(ct) {
    const loadingScreen = document.querySelector('.ct-aLoadingScreen'),
          loadingBar = loadingScreen.querySelector('.ct-aLoadingBar');
    const dbFactory = window.dragonBones ? dragonBones.PixiFactory.factory : null;
    /**
     * A utility object that manages and stores textures and other entities
     * @namespace
     */
    ct.res = {
        sounds: {},
        textures: {},
        skeletons: {},
        /**
         * Loads and executes a script by its URL
         * @param {string} url The URL of the script file, with its extension.
         * Can be relative or absolute.
         * @returns {Promise<void>}
         * @async
         */
        loadScript(url = ct.u.required('url', 'ct.res.loadScript')) {
            var script = document.createElement('script');
            script.src = url;
            const promise = new Promise((resolve, reject) => {
                script.onload = () => {
                    resolve();
                };
                script.onerror = () => {
                    reject();
                };
            });
            document.getElementsByTagName('head')[0].appendChild(script);
            return promise;
        },
        /**
         * Loads an individual image as a named ct.js texture.
         * @param {string} url The path to the source image.
         * @param {string} name The name of the resulting ct.js texture
         * as it will be used in your code.
         * @param {ITextureOptions} textureOptions Information about texture's axis
         * and collision shape.
         * @returns {Promise<Array<PIXI.Texture>>}
         */
        loadTexture(url = ct.u.required('url', 'ct.res.loadTexture'), name = ct.u.required('name', 'ct.res.loadTexture'), textureOptions = {}) {
            const loader = new PIXI.Loader();
            loader.add(url, url);
            return new Promise((resolve, reject) => {
                loader.load((loader, resources) => {
                    resolve(resources);
                });
                loader.onError.add(() => {
                    reject(new Error(`[ct.res] Could not load image ${url}`));
                });
            })
            .then(resources => {
                const tex = [resources[url].texture];
                tex.shape = tex[0].shape = textureOptions.shape || {};
                tex[0].defaultAnchor = new PIXI.Point(
                    textureOptions.anchor.x || 0,
                    textureOptions.anchor.x || 0
                );
                ct.res.textures[name] = tex;
                return tex;
            });
        },
        /**
         * Loads a skeleton made in DragonBones into the game
         * @param {string} ske Path to the _ske.json file that contains
         * the armature and animations.
         * @param {string} tex Path to the _tex.json file that describes the atlas
         * with a skeleton's textures.
         * @param {string} png Path to the _tex.png atlas that contains
         * all the textures of the skeleton.
         * @param {string} name The name of the skeleton as it will be used in ct.js game
         */
        loadDragonBonesSkeleton(ske, tex, png, name = ct.u.required('name', 'ct.res.loadDragonBonesSkeleton')) {
            const dbf = dragonBones.PixiFactory.factory;
            const loader = new PIXI.Loader();
            loader
                .add(ske, ske)
                .add(tex, tex)
                .add(png, png);
            return new Promise((resolve, reject) => {
                loader.load(() => {
                    resolve();
                });
                loader.onError.add(() => {
                    reject(new Error(`[ct.res] Could not load skeleton with _ske.json: ${ske}, _tex.json: ${tex}, _tex.png: ${png}.`));
                });
            }).then(() => {
                dbf.parseDragonBonesData(loader.resources[ske].data);
                dbf.parseTextureAtlasData(
                    loader.resources[tex].data,
                    loader.resources[png].texture
                );
                // eslint-disable-next-line id-blacklist
                ct.res.skeletons[name] = loader.resources[ske].data;
            });
        },
        /**
         * Loads a Texture Packer compatible .json file with its source image,
         * adding ct.js textures to the game.
         * @param {string} url The path to the JSON file that describes the atlas' textures.
         * @returns {Promise<Array<string>>} A promise that resolves into an array
         * of all the loaded textures.
         */
        loadAtlas(url = ct.u.required('url', 'ct.res.loadAtlas')) {
            const loader = new PIXI.Loader();
            loader.add(url, url);
            return new Promise((resolve, reject) => {
                loader.load((loader, resources) => {
                    resolve(resources);
                });
                loader.onError.add(() => {
                    reject(new Error(`[ct.res] Could not load atlas ${url}`));
                });
            })
            .then(resources => {
                const sheet = resources[url].spritesheet;
                for (const animation in sheet.animations) {
                    const tex = sheet.animations[animation];
                    const animData = sheet.data.animations;
                    for (let i = 0, l = animData[animation].length; i < l; i++) {
                        const a = animData[animation],
                              f = a[i];
                        tex[i].shape = sheet.data.frames[f].shape;
                    }
                    tex.shape = tex[0].shape || {};
                    ct.res.textures[animation] = tex;
                }
                return Object.keys(sheet.animations);
            });
        },
        /**
         * Loads a bitmap font by its XML file.
         * @param {string} url The path to the XML file that describes the bitmap fonts.
         * @param {string} name The name of the font.
         * @returns {Promise<string>} A promise that resolves into the font's name
         * (the one you've passed with `name`).
         */
        loadBitmapFont(url = ct.u.required('url', 'ct.res.loadBitmapFont'), name = ct.u.required('name', 'ct.res.loadBitmapFont')) {
            const loader = new PIXI.Loader();
            loader.add(name, url);
            return new Promise((resolve, reject) => {
                loader.load((loader, resources) => {
                    resolve(resources);
                });
                loader.onError.add(() => {
                    reject(new Error(`[ct.res] Could not load bitmap font ${url}`));
                });
            });
        },
        loadGame() {
            // !! This method is intended to be filled by ct.IDE and be executed
            // exactly once at game startup. Don't put your code here.
            const changeProgress = percents => {
                loadingScreen.setAttribute('data-progress', percents);
                loadingBar.style.width = percents + '%';
            };

            const atlases = [["./img/a0.json","./img/a1.json","./img/a2.json","./img/a3.json","./img/a4.json","./img/a5.json","./img/a6.json"]][0];
            const tiledImages = [{"Stars_Big":{"source":"./img/t0.png","shape":{"type":"rect","top":0,"bottom":1024,"left":0,"right":1024},"anchor":{"x":0,"y":0}},"Stars_Small":{"source":"./img/t1.png","shape":{"type":"rect","top":0,"bottom":1024,"left":0,"right":1024},"anchor":{"x":0,"y":0}},"Healthbar_Bar":{"source":"./img/t2.png","shape":{"type":"rect","top":6,"bottom":46,"left":10,"right":42},"anchor":{"x":0.19230769230769232,"y":0.11538461538461539}},"BgSpace":{"source":"./img/t3.png","shape":{"type":"rect","top":600,"bottom":600,"left":1100,"right":1100},"anchor":{"x":0.5,"y":0.5}},"MintShip":{"source":"./img/t4.png","shape":{"type":"rect","top":0,"bottom":768,"left":0,"right":1366},"anchor":{"x":0,"y":0}},"Levels":{"source":"./img/t5.png","shape":{"type":"rect","top":384,"bottom":384,"left":683,"right":683},"anchor":{"x":0.5,"y":0.5}},"InGameBg":{"source":"./img/t6.png","shape":{"type":"rect","top":0,"bottom":600,"left":0,"right":600},"anchor":{"x":0,"y":0}},"Leaderboard":{"source":"./img/t7.png","shape":{"type":"rect","top":384,"bottom":384,"left":683,"right":683},"anchor":{"x":0.5,"y":0.5}},"MyShip":{"source":"./img/t8.png","shape":{"type":"rect","top":0,"bottom":768,"left":0,"right":1366},"anchor":{"x":0,"y":0}}}][0];
            const sounds = [[{"name":"Laser_Small","wav":false,"mp3":"./snd/684d983f-9827-4ac8-9915-bd498154c5f4.mp3","ogg":false,"poolSize":10,"isMusic":false},{"name":"Laser_Medium","wav":false,"mp3":"./snd/1abe65bd-fd7f-4101-803d-28fa73e21732.mp3","ogg":false,"poolSize":10,"isMusic":false},{"name":"Laser_Big","wav":false,"mp3":"./snd/fe3a3bb6-74ac-4835-b9f3-6c03cf8fd0b0.mp3","ogg":false,"poolSize":5,"isMusic":false},{"name":"Bonus","wav":"./snd/c55e02d8-e533-4126-b0d8-b5164416d0d5.wav","mp3":false,"ogg":false,"poolSize":3,"isMusic":false},{"name":"Explosion_01","wav":"./snd/17ef15ea-b246-474e-9e50-a9211c3281d6.wav","mp3":false,"ogg":false,"poolSize":5,"isMusic":false},{"name":"Explosion_02","wav":"./snd/ba1c4845-8f8e-4326-a3c4-5c7d979d0a98.wav","mp3":false,"ogg":false,"poolSize":5,"isMusic":false},{"name":"Explosion_03","wav":"./snd/8104f996-d422-4157-921f-76e2ffff3b49.wav","mp3":false,"ogg":false,"poolSize":5,"isMusic":false},{"name":"SlowmoEffect","wav":false,"mp3":"./snd/db12b1db-1b93-45eb-84f4-a14c131c8ca0.mp3","ogg":false,"poolSize":5,"isMusic":false},{"name":"BlackHole","wav":false,"mp3":"./snd/c8ee5675-8608-40fa-b04e-ad9ccc36c777.mp3","ogg":false,"poolSize":5,"isMusic":false},{"name":"Music_BossTheme","wav":false,"mp3":"./snd/97158431-4c4f-4f9c-96b9-06da025fb98a.mp3","ogg":false,"poolSize":5,"isMusic":false},{"name":"Music_MainMenu","wav":false,"mp3":"./snd/2WT52qK46GnP42.mp3","ogg":false,"poolSize":5,"isMusic":true},{"name":"Music_MainTheme","wav":false,"mp3":"./snd/nHKPjWQ6Fnb4Cj.mp3","ogg":false,"poolSize":5,"isMusic":true}]][0];
            const bitmapFonts = [{}][0];
            const dbSkeletons = [[]][0]; // DB means DragonBones

            if (sounds.length && !ct.sound) {
                throw new Error('[ct.res] No sound system found. Make sure you enable one of the `sound` catmods. If you don\'t need sounds, remove them from your ct.js project.');
            }

            const totalAssets = atlases.length;
            let assetsLoaded = 0;
            const loadingPromises = [];

            loadingPromises.push(...atlases.map(atlas =>
                ct.res.loadAtlas(atlas)
                .then(texturesNames => {
                    assetsLoaded++;
                    changeProgress(assetsLoaded / totalAssets * 100);
                    return texturesNames;
                })));

            for (const name in tiledImages) {
                loadingPromises.push(ct.res.loadTexture(
                    tiledImages[name].source,
                    name,
                    {
                        anchor: tiledImages[name].anchor,
                        shape: tiledImages[name].shape
                    }
                ));
            }
            for (const font in bitmapFonts) {
                loadingPromises.push(ct.res.loadBitmapFont(bitmapFonts[font], font));
            }
            for (const skel of dbSkeletons) {
                ct.res.loadDragonBonesSkeleton(...skel);
            }

            for (const sound of sounds) {
                ct.sound.init(sound.name, {
                    wav: sound.wav || false,
                    mp3: sound.mp3 || false,
                    ogg: sound.ogg || false
                }, {
                    poolSize: sound.poolSize,
                    music: sound.isMusic
                });
            }

            /*@res@*/
            

            Promise.all(loadingPromises)
            .then(() => {
                Object.defineProperty(ct.templates.Copy.prototype, 'cgroup', {
    set: function (value) {
        this.$cgroup = value;
    },
    get: function () {
        return this.$cgroup;
    }
});
Object.defineProperty(ct.templates.Copy.prototype, 'moveContinuous', {
    value: function (cgroup, precision) {
        if (this.gravity) {
            this.hspeed += this.gravity * ct.delta * Math.cos(this.gravityDir * Math.PI / 180);
            this.vspeed += this.gravity * ct.delta * Math.sin(this.gravityDir * Math.PI / 180);
        }
        return ct.place.moveAlong(this, this.direction, this.speed * ct.delta, cgroup, precision);
    }
});

Object.defineProperty(ct.templates.Copy.prototype, 'moveContinuousByAxes', {
    value: function (cgroup, precision) {
        if (this.gravity) {
            this.hspeed += this.gravity * ct.delta * Math.cos(this.gravityDir * Math.PI / 180);
            this.vspeed += this.gravity * ct.delta * Math.sin(this.gravityDir * Math.PI / 180);
        }
        return ct.place.moveByAxes(
            this,
            this.hspeed * ct.delta,
            this.vspeed * ct.delta,
            cgroup,
            precision
        );
    }
});

Object.defineProperty(ct.templates.Tilemap.prototype, 'enableCollisions', {
    value: function (cgroup) {
        ct.place.enableTilemapCollisions(this, cgroup);
    }
});
ct.touch.setupListeners();
if ([false][0]) {
    ct.touch.setupMouseListeners();
}
ct.mouse.setupListeners();

                loadingScreen.classList.add('hidden');
                ct.pixiApp.ticker.add(ct.loop);
                ct.rooms.forceSwitch(ct.rooms.starting);
            })
            .catch(console.error);
        },
        /*
         * Gets a pixi.js texture from a ct.js' texture name,
         * so that it can be used in pixi.js objects.
         * @param {string|-1} name The name of the ct.js texture, or -1 for an empty texture
         * @param {number} [frame] The frame to extract
         * @returns {PIXI.Texture|Array<PIXI.Texture>} If `frame` was specified,
         * returns a single PIXI.Texture. Otherwise, returns an array
         * with all the frames of this ct.js' texture.
         *
         * @note Formatted as a non-jsdoc comment as it requires a better ts declaration
         * than the auto-generated one
         */
        getTexture(name, frame) {
            if (frame === null) {
                frame = void 0;
            }
            if (name === -1) {
                if (frame !== void 0) {
                    return PIXI.Texture.EMPTY;
                }
                return [PIXI.Texture.EMPTY];
            }
            if (!(name in ct.res.textures)) {
                throw new Error(`Attempt to get a non-existent texture ${name}`);
            }
            const tex = ct.res.textures[name];
            if (frame !== void 0) {
                return tex[frame];
            }
            return tex;
        },
        /*
         * Returns the collision shape of the given texture.
         * @param {string|-1} name The name of the ct.js texture, or -1 for an empty collision shape
         * @returns {object}
         *
         * @note Formatted as a non-jsdoc comment as it requires a better ts declaration
         * than the auto-generated one
         */
        getTextureShape(name) {
            if (name === -1) {
                return {};
            }
            if (!(name in ct.res.textures)) {
                throw new Error(`Attempt to get a shape of a non-existent texture ${name}`);
            }
            return ct.res.textures[name].shape;
        },
        /**
         * Creates a DragonBones skeleton, ready to be added to your copies.
         * @param {string} name The name of the skeleton asset
         * @param {string} [skin] Optional; allows you to specify the used skin
         * @returns {object} The created skeleton
         */
        makeSkeleton(name, skin) {
            const r = ct.res.skeletons[name],
                  skel = dbFactory.buildArmatureDisplay('Armature', r.name, skin);
            skel.ctName = name;
            skel.on(dragonBones.EventObject.SOUND_EVENT, function skeletonSound(event) {
                if (ct.sound.exists(event.name)) {
                    ct.sound.spawn(event.name);
                } else {
                    // eslint-disable-next-line no-console
                    console.warn(`Skeleton ${skel.ctName} tries to play a non-existing sound ${event.name} at animation ${skel.animation.lastAnimationName}`);
                }
            });
            return skel;
        }
    };

    ct.res.loadGame();
})(ct);

/**
 * A collection of content that was made inside ct.IDE.
 * @type {any}
 */
ct.content = JSON.parse(["{}"][0] || '{}');

const calculateDamage = function(ship, bullet) {
    ship.health -= bullet.damage;
    if (bullet.template === 'Laser_Bolt_Blue') { // Bolts may survive the collision do additional damage
        if (ship.health < 0) {
            bullet.damage += ship.health; // bring overkill damage back to the bullet
            if (bullet.damage <= 0) {
                bullet.kill = true;
            }
        } else {
            bullet.kill = true;
        }
    } else {
        bullet.kill = true;
    }
    if (ship.health <= 0) {
        ship.kill = true;
    }
};
const spawnWigglers = function(startingPhase) {
    // create 5 enemies, one by one in 1.4 seconds
    ct.templates.copy('Enemy_Wiggler', 0, -100, {
        phase: startingPhase
    });
    ct.u.wait(350)
    .then(() => {
        ct.templates.copy('Enemy_Wiggler', 0, -100, {
            phase: startingPhase
        });
    })
    .then(() => ct.u.wait(350))
    .then(() => {
        ct.templates.copy('Enemy_Wiggler', 0, -100, {
            phase: startingPhase
        });
    })
    .then(() => ct.u.wait(350))
    .then(() => {
        ct.templates.copy('Enemy_Wiggler', 0, -100, {
            phase: startingPhase
        });
    })
    .then(() => ct.u.wait(350))
    .then(() => {
        ct.templates.copy('Enemy_Wiggler', 0, -100, {
            phase: startingPhase
        });
    });
};;
// Move Background

const bgMoveInit = function (room) {
    room.bgMoveTimer = 0;
    room.bgMoveSpeed = 1;
    room.bgMoveDirection = -1;
};

const bgMoveOnStep = function (room, speed) {
    room.bgMoveTimer -= ct.delta;
    if (room.bgMoveTimer <= 0 && ct.backgrounds.list['BgSpace'].length) {
        const bg = ct.backgrounds.list['BgSpace'][0];
        bg.movementX = speed * room.bgMoveSpeed * room.bgMoveDirection;
        bg.movementY = (speed/2) * room.bgMoveSpeed * room.bgMoveDirection;

        room.bgMoveSpeed +=1;
        if(room.bgMoveSpeed > 1) {
            room.bgMoveSpeed = 0;
        }

        if(room.bgMoveSpeed == 0) {
            room.bgMoveDirection *= -1;
            room.bgMoveTimer = 1200;
        } else {
            room.bgMoveTimer = 120;
        }
    }
}
;
