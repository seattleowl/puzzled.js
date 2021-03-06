import { PuzzledObjectInstance, aliases } from "./objects.js";
import { backgroundLayer } from "./layers.js";
import { rules } from "./rules.js";

export let activeMap = null;
export let ctx;

export function setCTX(context) {
	ctx = context;
}

export class PuzzledMap {
	#charGrid = [];
	#objects = [];
	#data = null;

	/**
	 * A grid repersenting the level.
	 * @param {string} data Data from the imported file.
	 */
	constructor(data) {
		this.#data = data;
	}

	/**
	 * Render all objects on the map.
	 */
	render() {
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		this.#objects
			.sort((a, b) => a.layer.index - b.layer.index)
			.forEach((obj) => {
				obj.render(ctx);
			});
	}

	setActive() {
		activeMap = this;
		let lines = this.#data.split("\n");

		lines.forEach((line) => {
			this.#charGrid.push(line.split(""));
		});

		this.#charGrid.forEach((row, y) => {
			row.forEach((char, x) => {
				let obj = new PuzzledObjectInstance(aliases[char], x, y);
				obj.map = this;
				this.#objects.push(obj);

				if (aliases[char] != backgroundLayer.objects[0]) {
					let bgTile = new PuzzledObjectInstance(
						backgroundLayer.objects[0],
						x,
						y
					);
					bgTile.map = this;
					this.#objects.push(bgTile);
				}
			});
		});
	}

	getAt(x, y, layer) {
		return this.#objects.filter((obj) => {
			return obj.mapX == x && obj.mapY == y && obj.layer.index == layer;
		})[0];
	}

	update(keypress) {
		// Mark the player as moving
		if (keypress) {
			if (keypress == "right") {
				this.#objects.forEach((obj) => {
					if (obj.parentObject.attributes.is == "player") obj.move(1, 0);
				});
			}

			if (keypress == "left") {
				this.#objects.forEach((obj) => {
					if (obj.parentObject.attributes.is == "player") obj.move(-1, 0);
				});
			}

			if (keypress == "up") {
				this.#objects.forEach((obj) => {
					if (obj.parentObject.attributes.is == "player") obj.move(0, -1);
				});
			}

			if (keypress == "down") {
				this.#objects.forEach((obj) => {
					if (obj.parentObject.attributes.is == "player") obj.move(0, 1);
				});
			}
		}

		// Apply rules
		this.#objects.forEach((obj) => {
			for (const rule of rules) {
				if (rule.late) continue;

				const match = obj.match(rule.critera);
				if (match) {
					rule.fire(...match);
				}
			}
		});

		// Move objects
		const moveObj = (object) => {
			if (object.movement != [0, 0]) {
				let newPos = [
					object.mapX + object.movement[0],
					object.mapY + object.movement[1]
				];

				if (!object.target) {
					object.mapX += object.movement[0];
					object.mapY += object.movement[1];
				} else if (object.target.match({ isMoving: true })) {
					moveObj(object.target);
					moveObj(object);
				}
			}

			object.clearMovement();
		};

		this.#objects.forEach(moveObj);

		// Apply late rules
		// rules
		// 	.filter((rule) => rule.late)
		// 	.forEach((rule) => rule.func(this.#objects));

		// Render
		this.render();
	}
}
