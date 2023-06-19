import { Box, type Velocity, boxCollision } from './objects/box';
import io, { type Socket } from 'socket.io-client';
const WEBSOCKET_URL = 'ws://localhost:8000';

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
	socket: Socket;
	_selfId: string | undefined;
	constructor(private ground: Box, private room: string | null) {
		this._spawnRate = 200;
		this._frames = 0;
		this.enemies = [];
		this.callbacks = {
			cubeCreated: new Set()
		};
		this.socket = io(WEBSOCKET_URL);
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
		this.socket.on('init', ({ id }) => {
			this._selfId = id;
			if (this.room) {
				this.socket.emit('join-room', { id: this.room });
			} else {
				this.socket.emit('create-room', {});
			}
		});

		this.socket.on('room-joined', ({ roomID, box }) => {
			let cube = (this.selfBox = new Box(box));
			this.callbacks.cubeCreated.forEach((cb) => cb(cube, { type: 'self' }));
			cube.castShadow = true;
			location.hash = '#roomId=' + roomID;
		});
		this.socket.on('new-enemy', ({ enemy }) => {
			const enemyCube = new Box(enemy);
			this.enemies.push(enemyCube);
			this.callbacks.cubeCreated.forEach((cb) => cb(enemyCube, { type: 'enemy' }));
		});

		this.socket.on('new-companion', ({ id, box }) => {
			if (id === this._selfId) return;
			let cube = (this.companionBox = new Box({ ...box, color: 'blue' }));
			this.callbacks.cubeCreated.forEach((cb) => cb(cube, { type: 'companion' }));
			cube.castShadow = true;
			this.companionBox!.update(this.ground);
		});

		this.socket.on('get-position', ({ id, velocity, box }) => {
			if (id === this._selfId) return;
			const noCube = !this.companionBox;
			let cube = this.companionBox ?? (this.companionBox = new Box({ ...box, color: 'blue' }));
			cube.velocity = velocity;
			if (noCube) {
				this.callbacks.cubeCreated.forEach((cb) => cb(cube, { type: 'companion' }));
			}
			cube.castShadow = true;
			this.companionBox!.update(this.ground);
		});
	}

	updateCube(which: 'self' | 'companion', velocity: Velocity) {
		let crashed: boolean = false;
		if (which === 'self') {
			this.selfBox!.velocity = velocity;
			this.selfBox!.update(this.ground);
			this.socket.emit('update-position', { velocity, box: this.selfBox?.json });
			crashed = this.enemies.some((enemy) => {
				enemy.update(this.ground);
				return boxCollision({
					box1: this.selfBox!,
					box2: enemy
				});
			});
		} else {
		}

		// if (this._frames % this._spawnRate === 0) {
		// 	if (this._spawnRate > 20) this._spawnRate -= 20;
		// 	const enemy = this._createEnemy();
		// 	this.callbacks.cubeCreated.forEach((cb) => cb(enemy, { type: 'enemy' }));
		// }
		// this._frames++;
		return crashed;
	}

	onCubeCreated(callback: (box: Box, event: CubeEvent) => void) {
		this.callbacks.cubeCreated.add(callback);
	}

	public get ready() {
		return !!this.selfBox;
	}
}
