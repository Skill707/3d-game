import { useAtom, useSetAtom } from "jotai";
import { useEffect, useRef } from "react";
import { settingsAtom } from "../state/atoms";
import { CreatePart } from "../utils/partFactory";
import { useDragControls } from "../hooks/useDragControls";
import partsStorageAtom from "../state/partsStorageAtom";
import useMouseControls from "../hooks/useMouseControls";
import { euler, quat, RigidBody, vec3 } from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";
import { PerspectiveCamera, useKeyboardControls } from "@react-three/drei";
import { applyLocalForceAtPoint } from "../utils/transformUtils";
import { Quaternion, Vector3 } from "three";
import { hudDataAtom } from "../state/hudDataAtom";
import { WaspModel } from "./Wasp";

function clamp(value, min = -1, max = 1) {
	if (value < min) return min;
	if (value > max) return max;
	return value;
}

const rad2deg = (value) => value * (180 / Math.PI);
const deg2rad = (value) => (value * Math.PI) / 180;

class Curve {
	constructor(points) {
		// points = [{x: angleDeg, y: value}, ...]
		this.points = points.sort((a, b) => a.x - b.x);
	}

	evaluate(x) {
		// clamp за пределами диапазона
		if (x <= this.points[0].x) return this.points[0].y;
		if (x >= this.points[this.points.length - 1].x) return this.points[this.points.length - 1].y;

		// найти два соседних сегмента
		for (let i = 0; i < this.points.length - 1; i++) {
			const p1 = this.points[i];
			const p2 = this.points[i + 1];
			if (x >= p1.x && x <= p2.x) {
				const t = (x - p1.x) / (p2.x - p1.x);
				return p1.y * (1 - t) + p2.y * t;
			}
		}
	}
}

const CL = new Curve([
	{ x: -180, y: 0 },
	{ x: -135, y: 1.15 },
	{ x: -90, y: 0 },
	{ x: -45, y: -1.15 },
	{ x: -27, y: -0.93 },
	{ x: -23, y: -0.85 },
	{ x: -20, y: -1.2 },
	{ x: -16, y: -1.5 },
	{ x: -15, y: -1.5 },
	{ x: -10, y: -1.1 },
	{ x: -5, y: -0.6 },
	{ x: 0, y: 0.0 },
	{ x: 5, y: 0.6 },
	{ x: 10, y: 1.1 },
	{ x: 15, y: 1.5 },
	{ x: 16, y: 1.5 },
	{ x: 20, y: 1.2 },
	{ x: 23, y: 0.85 },
	{ x: 27, y: 0.93 },
	{ x: 45, y: 1.15 },
	{ x: 90, y: 0 },
	{ x: 135, y: -1.15 },
	{ x: 180, y: 0 },
]);

const CD = new Curve([
	{ x: -180, y: 0 },
	{ x: -90, y: 1.25 },
	{ x: -27, y: 0.25 },
	{ x: -20, y: 0.15 },
	{ x: -15, y: 0.025 },
	{ x: -10, y: 0.012 },
	{ x: 0, y: 0.005 },
	{ x: 10, y: 0.012 },
	{ x: 15, y: 0.025 },
	{ x: 20, y: 0.15 },
	{ x: 27, y: 0.25 },
	{ x: 90, y: 1.25 },
	{ x: 180, y: 0 },
]);

function computeWingForces({
	globalVel = new Vector3(),
	quaternion = new Quaternion(),
	airDensity = 1.225, // плотность воздуха кг/м³
	wingArea = 10, // площадь крыла м²
	wingUp = new Vector3(0, 1, 0), // нормаль крыла
	wingForward = new Vector3(0, 0, 1), // продольная ось крыла
	input = 0,
	controlSurface = [0, 0],
} = {}) {
	// === 1. Скорость rigidbody
	const speed = globalVel.length();
	//if (speed < 1e-3) return { lift: new Vector3(), drag: new Vector3() };

	// === 2. Получаем ориентацию крыла

	const forward = wingForward.applyQuaternion(quaternion).normalize();
	const up = wingUp.applyQuaternion(quaternion).normalize();
	const right = new Vector3().crossVectors(forward, up).normalize();

	// === 3. Проекции скорости на оси крыла
	const vRight = globalVel.dot(right);
	const vUp = globalVel.dot(up);
	const vForward = globalVel.dot(forward);
	const localVel = [vRight, vUp, vForward];

	// === 4. Углы
	const aoa = Math.atan2(-vUp, vForward); // угол атаки
	const aos = Math.atan2(vRight, vForward); // угол скольжения

	// === 5. Коэффициенты
	const cl = CL.evaluate(rad2deg(aoa) + input);
	const cd = CD.evaluate(rad2deg(aoa) + input); // индуктивное сопротивление

	// === 6. Динамическое давление
	const qDyn = 0.5 * airDensity * speed * speed;

	// === 7. Подъёмная сила (направление: нормаль вектора скорости × forward)
	//const clampedVel = vel.clone().clampLength(0, 350);
	//const liftDir = up.clone(); //.cross(forward).normalize();
	const liftDir = up.clone(); //.cross(forward).normalize();

	const liftForce = clamp(qDyn * wingArea * cl, -100000, 100000);
	//const lift = liftDir.clone().multiplyScalar(liftForce);

	// === 8. Сила сопротивления (против скорости)
	const dragDir = globalVel.clone().normalize().negate();
	const dragForce = clamp(qDyn * wingArea * cd, -100000, 100000);

	//const drag = dragDir.multiplyScalar(dragForce);

	return { aoa, aos, liftForce, dragForce, localVel, cl, cd };
}

export const Craft = ({ craftRBRef, cameraControlsRef, editor = true }) => {
	const [partsStorage, partsStorageAPI] = useAtom(partsStorageAtom);
	console.log("Craft UPDATE", partsStorage.parts);
	const [settingsStorage, setSettingsStorage] = useAtom(settingsAtom);
	const setHudData = useSetAtom(hudDataAtom);
	const lastAddedRef = useRef(null);
	const craftGroupRef = useRef(null);
	const craftControlsInit = {
		pitch: 0,
		roll: 0,
		yaw: 0,
		throttle: 0,
		brake: 0,
		airbrake: 0,
		vtol: 0,
		trim: 0,
		shoot: 0,
	};
	const craftControlsRef = useRef(craftControlsInit);
	const [sub, get] = useKeyboardControls();

	const dragControlsRef = useDragControls(
		(editor && settingsStorage.activeSubToolId === "MOVE") || settingsStorage.activeSubToolId === "RESHAPE",
		cameraControlsRef,
		partsStorage,
		partsStorageAPI,
		lastAddedRef,
		settingsStorage
	);

	useMouseControls(editor, partsStorage, partsStorageAPI, settingsStorage, cameraControlsRef);

	useEffect(() => {
		if (settingsStorage.addParts.selectedPartType !== null && settingsStorage.addParts.pointerOut === true) {
			const changes = partsStorageAPI((api) => {
				api.addPart(settingsStorage.addParts.selectedPartType);
				api.commit();
			});
			console.log("changes", changes);
			if (changes.length > 0) {
				lastAddedRef.current = "dragPart" + changes[0].id;
				setSettingsStorage((prev) => ({
					...prev,
					addParts: {
						...prev.addParts,
						selectedPartType: null,
					},
				}));
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [settingsStorage.addParts]);

	useEffect(() => {
		if (craftRBRef.current) {
			craftRBRef.current.setTranslation(new Vector3(0, 0, 0), true);
			craftRBRef.current.setRotation(quat({ x: 0, y: 0, z: 0, w: 1 }), true);
			craftRBRef.current.setLinvel(new Vector3(0, 0, 20), true);
			//console.log(craftRBRef.current);
		}
		//if (craftGroupRef.current) {	}
		if (editor && cameraControlsRef.current) {
			cameraControlsRef.current.object.position.set(30, 20, 30);
			cameraControlsRef.current.target = new Vector3(0, 0, 0);
			//cameraControlsRef.current.target.lerp(position, 1);
			cameraControlsRef.current.update();
		}

		craftControlsRef.current = craftControlsInit;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [editor]);

	useFrame((state, delta) => {
		if (editor) return;

		if (craftRBRef.current) {
			const position = vec3(craftRBRef.current.translation());
			const quaternion = quat(craftRBRef.current.rotation());
			const eulerRot = euler().setFromQuaternion(quat(craftRBRef.current.rotation()));

			const globalVel = vec3(craftRBRef.current.linvel());
			const speed = globalVel.length();
			const vertSpeed = globalVel.y;
			const altitude = position.y + 500;

			const forward = new Vector3(0, 0, 1).applyQuaternion(quaternion).normalize();
			const up = new Vector3(0, 1, 0).applyQuaternion(quaternion).normalize();
			const right = new Vector3().crossVectors(forward, up).normalize();

			// === 3. Проекции скорости на оси крыла
			const vRight = globalVel.dot(right);
			const vUp = globalVel.dot(up);
			const vForward = globalVel.dot(forward);
			const localVel = [vRight, vUp, vForward];

			// === 4. Углы
			const aoa = Math.atan2(-vUp, vForward); // угол атаки
			const aos = Math.atan2(vRight, vForward); // угол скольжения

			const actions = {
				pitchUp: (p) => (p ? (craftControlsRef.current.pitch = -1) : (craftControlsRef.current.pitch = 0)),
				pitchDown: (p) => (p ? (craftControlsRef.current.pitch = 1) : craftControlsRef.current.pitch),
				rollLeft: (p) => (p ? (craftControlsRef.current.roll = -1) : (craftControlsRef.current.roll = 0)),
				rollRight: (p) => (p ? (craftControlsRef.current.roll = 1) : craftControlsRef.current.roll),
				yawLeft: (p) => (p ? (craftControlsRef.current.yaw = 1) : (craftControlsRef.current.yaw = 0)),
				yawRight: (p) => (p ? (craftControlsRef.current.yaw = -1) : craftControlsRef.current.yaw),
				throttleUp: (p) => (p ? (craftControlsRef.current.throttle = clamp((craftControlsRef.current.throttle += delta * 1), 0)) : 0),
				throttleDown: (p) => {
					if (p) {
						craftControlsRef.current.throttle = clamp((craftControlsRef.current.throttle -= delta * 1), 0);
						craftControlsRef.current.airbrake = clamp((craftControlsRef.current.airbrake += delta * 1), 0);
					} else {
						craftControlsRef.current.airbrake = clamp((craftControlsRef.current.airbrake -= delta * 1), 0);
					}
				},
				vtolUp: (p) => (p ? (craftControlsRef.current.vtol = clamp((craftControlsRef.current.vtol += delta * 1), 0)) : 0),
				vtolDown: (p) => (p ? (craftControlsRef.current.vtol = clamp((craftControlsRef.current.vtol -= delta * 1), 0)) : 0),
				vtolZero: (p) => (p ? (craftControlsRef.current.vtol = 0) : 0),
				trimUp: (p) => (p ? (craftControlsRef.current.trim = clamp((craftControlsRef.current.trim += delta * 1), 0)) : 0),
				trimDown: (p) => (p ? (craftControlsRef.current.trim = clamp((craftControlsRef.current.trim -= delta * 1), 0)) : 0),
				trimZero: (p) => (p ? (craftControlsRef.current.trim = 0) : 0),
				brake: (p) => (p ? (craftControlsRef.current.brake = 1) : (craftControlsRef.current.brake = 0)),
				shoot: (p) => (p ? (craftControlsRef.current.shoot = 1) : (craftControlsRef.current.shoot = 0)),
			};

			for (const [name, value] of Object.entries(get())) {
				if (actions[name]) actions[name](value);
			}

			const mass = craftRBRef.current.mass();
			let { pitch, roll, yaw, throttle, vtol, trim, brake, airbrake } = craftControlsRef.current;

			const totalArea = mass / 300;
			const mainArea = totalArea * 0.8;
			const elevArea = totalArea * 0.2;

			const mLeftWing = computeWingForces({
				globalVel,
				quaternion,
				wingArea: mainArea / 2,
				input: roll * -20,
			});

			const mRightWing = computeWingForces({
				globalVel,
				quaternion,
				wingArea: mainArea / 2,
				input: roll * 20,
			});

			applyLocalForceAtPoint(craftRBRef.current, { x: 0, y: mLeftWing.liftForce, z: -mLeftWing.dragForce }, [-2, 0, 0], delta);
			applyLocalForceAtPoint(craftRBRef.current, { x: 0, y: mRightWing.liftForce, z: -mRightWing.dragForce }, [2, 0, 0], delta);

			pitch = clamp(pitch + (rad2deg(mLeftWing.aoa) * 0) / 30, -1, 1);
			const eLeftWing = computeWingForces({
				globalVel,
				quaternion,
				wingArea: elevArea / 2,
				input: pitch * 20 + roll * -10,
			});

			const eRightWing = computeWingForces({
				globalVel,
				quaternion,
				wingArea: elevArea / 2,
				input: pitch * 20 + roll * 10,
			});

			applyLocalForceAtPoint(craftRBRef.current, { x: 0, y: eLeftWing.liftForce, z: -eLeftWing.dragForce }, [-2, 0, -4], delta);
			applyLocalForceAtPoint(craftRBRef.current, { x: 0, y: eRightWing.liftForce, z: -eRightWing.dragForce }, [2, 0, -4], delta);

			//const torque = mass * 1;
			//applyLocalTorque(craftRBRef.current, { x: pitch * torque, y: 0, z: 0 });

			//console.log(mass, craftRBRef.current.localCom());
			const gravity = 9.81;
			const weight = mass * gravity;

			const rudder = computeWingForces({
				globalVel,
				quaternion,
				wingArea: elevArea / 2,
				wingUp: new Vector3(1, 0, 0),
				input: yaw * -20,
			});

			applyLocalForceAtPoint(craftRBRef.current, { x: rudder.liftForce, y: 0, z: 0 }, [0, 1, -4], delta);

			applyLocalForceAtPoint(craftRBRef.current, { x: 0, y: 0, z: weight * throttle }, [0, 0, -5], delta);

			setHudData([
				{ name: "SPD", value: speed, unit: " M/S" },
				{ name: "ALT", value: altitude, unit: " M" },
				{ name: "VS", value: vertSpeed, unit: " M/S" },
				{ name: "THR", value: throttle * 100, unit: " %" },
				{ name: "AOA", value: rad2deg(aoa), unit: " °" },
				{ name: "AOS", value: rad2deg(aos), unit: " °" },
				{ name: "Vel", value: localVel.map((v) => v.toFixed(0)), unit: "" },
				{ name: "Pos", value: position.toArray().map((v) => v.toFixed(0)), unit: "" },
			]);

			/*if (craftGroupRef.current) {
				craftGroupRef.current.children.map((dragPart) => {
					const part = dragPart.userData;
					if (part && part.partType.includes("engine")) {
						const maxForce = part.engine.maxForce;
						applyLocalForceAtPoint(craftRBRef.current, { x: 0, y: 0, z: weight * throttle }, part.position, delta);
					}
				});
			}*/
		}
	});

	return (
		<RigidBody
			name="craftRigidBody"
			ref={craftRBRef}
			gravityScale={1}
			colliders={false}
			linearVelocity={[0, 0, 50]}
			type={editor ? "fixed" : "dynamic"}
			onContactForce={(payload) => {}}
		>
			<group ref={craftGroupRef} name="craft" layers={2}>
				<WaspModel />
			</group>
			<PerspectiveCamera makeDefault={!editor} name="craftCamera" fov={75} />
		</RigidBody>
	);
};

/*

{partsStorage.parts.map((part) => (
					<CreatePart key={part.id} part={part} selected={part.id === partsStorage.selectedPart?.id} editor={editor} />
				))}
*/
