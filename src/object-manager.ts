import { Box, type Velocity, boxCollision } from './objects/box';

type CB = 'cubeCreated';
interface CubeEvent {
	type: 'self' | 'companion' | 'enemy';
}
export class ObjectManager {
	callbacks: Record<CB, Set<(box: Box, ce: CubeEvent) => void>>;
	selfBox: Box | undefined;
	companionBox: Box | undefined;
	enemies: Box[];

	_spawnRate: number;
	_frames: number;
	constructor(private ground: Box) {
		this._spawnRate = 200;
		this._frames = 0;
		this.enemies = [];
		this.callbacks = {
			cubeCreated: new Set()
		};
	}

	_createEnemy() {
		const enemy = new Box({
			width: 1,
			height: 1,
			depth: 1,
			position: {
				x: (Math.random() - 0.5) * 10,
				y: 0,
				z: -20
			},
			velocity: {
				x: 0,
				y: -0.01,
				z: 0.005
			},
			color: 'red',
			zAcceleration: true
		});
		enemy.castShadow = true;
		this.enemies.push(enemy);
		return enemy;
	}

	init() {
		const cube = new Box({
			width: 1,
			height: 1,
			depth: 1,
			velocity: {
				x: 0,
				y: -0.01,
				z: 0
			}
		});

		const companionCube = new Box({
			width: 1,
			height: 1,
			depth: 1,
			velocity: {
				x: 0,
				y: -0.01,
				z: 0
			},
			position: {
				x: (Math.random() - 0.5) * 10,
				y: 0,
				z: 0
			},
			color: 'blue'
		});
		cube.castShadow = true;
		this.selfBox = cube;
		this.callbacks.cubeCreated.forEach((cb) => cb(cube, { type: 'self' }));
		this.callbacks.cubeCreated.forEach((cb) => cb(companionCube, { type: 'companion' }));
	}

	updateCube(which: 'self' | 'companion', velocity: Velocity) {
		if (which === 'self') {
			this.selfBox!.velocity = velocity;
			this.selfBox!.update(this.ground);
			let crashed = this.enemies.some((enemy) => {
				enemy.update(this.ground);
				return boxCollision({
					box1: this.selfBox!,
					box2: enemy
				});
			});
			if (this._frames % this._spawnRate === 0) {
				if (this._spawnRate > 20) this._spawnRate -= 20;
				const enemy = this._createEnemy();
				this.callbacks.cubeCreated.forEach((cb) => cb(enemy, { type: 'enemy' }));
			}
			this._frames++;
			return crashed;
		}
	}

	onCubeCreated(callback: (box: Box, event: CubeEvent) => void) {
		this.callbacks.cubeCreated.add(callback);
	}
}
