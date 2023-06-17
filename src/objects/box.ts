import * as THREE from 'three';

interface Velocity {
	x: number;
	y: number;
	z: number;
}

interface Position {
	x: number;
	y: number;
	z: number;
}

export class Box extends THREE.Mesh {
	width: number;
	height: number;
	depth: number;
	right: number;
	bottom: number;
	left: number;
	top: number;
	velocity: Velocity;
	zAcceleration: boolean;
	front: number;
	back: number;
	gravity: number;

	constructor({
		width,
		height,
		depth,
		color = '#00ff00',
		velocity = { x: 0, y: 0, z: 0 },
		position = { x: 0, y: 0, z: 0 },
		zAcceleration = false
	}: {
		width: number;
		height: number;
		depth: number;
		color?: string;
		velocity?: Velocity;
		position?: Position;
		zAcceleration?: boolean;
	}) {
		//calls constructor of parent class
		super(new THREE.BoxGeometry(width, height, depth), new THREE.MeshStandardMaterial({ color }));

		this.width = width;
		this.height = height;
		this.depth = depth;

		this.position.set(position.x, position.y, position.z);

		//get right and left pts
		this.right = this.position.x + this.width / 2;
		this.left = this.position.x - this.width / 2;

		//get top and bottom pts
		this.bottom = this.position.y - this.height / 2;
		this.top = this.position.y + this.height / 2;

		//get front and back pts
		this.front = this.position.z + this.depth / 2;
		this.back = this.position.z - this.depth / 2;

		this.velocity = velocity;
		this.gravity = -0.002;

		this.zAcceleration = zAcceleration;
	}

	updateSides() {
		this.right = this.position.x + this.width / 2;
		this.left = this.position.x - this.width / 2;

		this.bottom = this.position.y - this.height / 2;
		this.top = this.position.y + this.height / 2;

		this.front = this.position.z + this.depth / 2;
		this.back = this.position.z - this.depth / 2;
	}

	//for each frame
	update(ground: Box) {
		this.updateSides();

		if (this.zAcceleration) this.velocity.z += 0.0003;

		this.position.x += this.velocity.x;
		this.position.z += this.velocity.z;

		this.applyGravity(ground);
	}

	applyGravity(ground: Box) {
		this.velocity.y += this.gravity;

		//on hitting ground
		if (
			boxCollision({
				box1: this,
				box2: ground
			})
		) {
			const friction = 0.5;
			this.velocity.y *= friction; //reduce bounce on each hit
			this.velocity.y = -this.velocity.y; //set velocity opp
		} else this.position.y += this.velocity.y; //else act gravity
	}
}

export function boxCollision({ box1, box2 }: { box1: Box; box2: Box }) {
	const xCollision = box1.right >= box2.left && box1.left <= box2.right;
	const yCollision = box1.bottom + box1.velocity.y <= box2.top && box1.top >= box2.bottom; //box1.velocity.y overlap error
	const zCollision = box1.front >= box2.back && box1.back <= box2.front;

	return xCollision && yCollision && zCollision;
}
