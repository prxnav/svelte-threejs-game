import { Box, type Velocity } from './objects/box';

type CB = 'cubeCreated';
interface CubeEvent {
	type: 'self' | 'companion';
}
export class ObjectManager {
	callbacks: Record<CB, Set<(box: Box, ce: CubeEvent) => void>>;
	selfBox: Box | undefined;
	companionBox: Box | undefined;
	enemies: Box[];

	constructor(private ground: Box) {
		this.enemies = [];
		this.callbacks = {
			cubeCreated: new Set()
		};
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
		cube.castShadow = true;
		this.selfBox = cube;
		this.callbacks.cubeCreated.forEach((cb) => cb(cube, { type: 'self' }));
	}

	updateCube(which: 'self' | 'companion', velocity: Velocity) {
		if (which === 'self') {
			this.selfBox!.velocity = velocity;
			this.selfBox?.update(this.ground);
		}
	}

	onCubeCreated(callback: (box: Box, event: CubeEvent) => void) {
		this.callbacks.cubeCreated.add(callback);
	}
}
