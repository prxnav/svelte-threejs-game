<script lang="ts">
	import * as THREE from 'three';
	import { onMount } from 'svelte';
	import { Box, boxCollision, type Velocity } from '../objects/box';
	import { ObjectManager } from '../object-manager';
	import { io } from 'socket.io-client';
	import { page } from '$app/stores';
	let renderer: THREE.WebGLRenderer, camera: THREE.Camera;

	let frames = 0;
	let spawnRate = 200;

	// let cube: Box;
	// let companionCube: Box;
	let scene: THREE.Scene;

	const ground = new Box({
		width: 10,
		height: 0.5,
		depth: 50,
		color: '#0369a1',
		position: {
			x: 0,
			y: -2,
			z: 0
		}
	});
	const keys = {
		a: {
			pressed: false
		},
		d: {
			pressed: false
		},
		s: {
			pressed: false
		},
		w: {
			pressed: false
		}
	};

	ground.receiveShadow = true;

	const light = new THREE.DirectionalLight(0xffffff, 1);
	light.position.y = 3;
	light.position.z = 1;
	light.castShadow = true;
	const room = new URLSearchParams($page.url.hash.substring(1)).get('roomId');
	const manager = new ObjectManager(ground, room);
	manager.onCubeCreated((_cube) => {
		scene.add(_cube);
	});
	const selfVelocity: Velocity = { x: 0, y: 0, z: 0 };
	onMount(() => {
		window.addEventListener('keydown', (e) => {
			switch (e.code) {
				case 'KeyA':
					keys.a.pressed = true;
					break;
				case 'KeyD':
					keys.d.pressed = true;
					break;
				case 'KeyS':
					keys.s.pressed = true;
					break;
				case 'KeyW':
					keys.w.pressed = true;
					break;
				case 'Space':
					selfVelocity.y = 0.09;
					break;
			}
		});
		window.addEventListener('keyup', (e) => {
			switch (e.code) {
				case 'KeyA':
					keys.a.pressed = false;
					break;
				case 'KeyD':
					keys.d.pressed = false;
					break;
				case 'KeyS':
					keys.s.pressed = false;
					break;
				case 'KeyW':
					keys.w.pressed = false;
					break;
			}
		});
	});

	onMount(() => {
		scene = new THREE.Scene();
		camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
		camera.position.set(4.61, 2.74, 8);
		camera.position.z = 5;

		renderer = new THREE.WebGLRenderer({
			alpha: true,
			antialias: true
		});
		renderer.shadowMap.enabled = true;
		renderer.setSize(window.innerWidth, window.innerHeight);
		document.getElementById('canvas')!.appendChild(renderer.domElement);

		scene.add(ground);
		scene.add(light);
		scene.add(new THREE.AmbientLight(0xffffff, 0.3));
	});
	onMount(() => {
		function animate() {
			const animationId = requestAnimationFrame(animate); //store id of each frame
			if (!manager.ready) return;
			renderer.render(scene, camera);

			//movement code

			selfVelocity.x = 0;
			selfVelocity.z = 0;

			if (keys.a.pressed) selfVelocity.x = -0.05;
			else if (keys.d.pressed) selfVelocity.x = 0.05;

			if (keys.s.pressed) selfVelocity.z = 0.05;
			else if (keys.w.pressed) selfVelocity.z = -0.05;

			if (manager.updateCube('self', selfVelocity)) {
				cancelAnimationFrame(animationId);
			}

			frames++;
		}
		manager.init();
		animate();
	});
</script>

<div id="canvas" />

<style>
	#canvas {
		width: 100%;
		height: 100%;
	}
	:global(body) {
		padding: 0;
		margin: 0;
		background: #0c4a6e;
	}
</style>
