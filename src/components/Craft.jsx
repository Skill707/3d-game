import { useAtom, useSetAtom } from "jotai";
import { useEffect, useRef } from "react";
import { settingsAtom } from "../state/atoms";
import { CreatePart } from "../utils/partFactory";
import { useDragControls } from "../hooks/useDragControls";
import partsStorageAtom from "../state/partsStorageAtom";
import useMouseControls from "../hooks/useMouseControls";
import { euler, quat, RigidBody, vec3 } from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";
import { Billboard, Text, useKeyboardControls } from "@react-three/drei";
import { applyLocalForce, applyLocalForceAtPoint, applyLocalTorque } from "../utils/transformUtils";
import { Euler, Quaternion, Vector3 } from "three";
import { hudDataAtom } from "../state/hudDataAtom";

const rad2deg = (value) => value * (180 / Math.PI);
const deg2rad = (value) => (value * Math.PI) / 180;
function computeWingForces(
	rb,
	{
		airDensity = 1.225, // плотность воздуха кг/м³
		wingArea = 10, // площадь крыла м²
		cl0 = 0.3, // базовый Cl
		cd0 = 0.02, // базовый Cd (паразитное сопротивление)
		wingForward = new Vector3(1, 0, 0), // продольная ось крыла
		wingUp = new Vector3(0, 1, 0), // нормаль крыла
	} = {}
) {
	if (!rb) return { lift: new Vector3(), drag: new Vector3() };

	// === 1. Скорость rigidbody
	const v = rb.linvel();
	const vel = new Vector3(v.x, v.y, v.z);
	const speed = vel.length();
	if (speed < 1e-3) return { lift: new Vector3(), drag: new Vector3() };

	// === 2. Получаем ориентацию крыла
	const q = rb.rotation();
	const quat = new Quaternion(q.x, q.y, q.z, q.w);

	const forward = wingForward.clone().applyQuaternion(quat).normalize();
	const up = wingUp.clone().applyQuaternion(quat).normalize();
	const right = new Vector3().crossVectors(forward, up).normalize();

	// === 3. Проекции скорости на оси крыла
	const vForward = vel.dot(forward);
	const vUp = vel.dot(up);
	const vRight = vel.dot(right);

	console.log(vForward, vUp, vRight);

	// === 4. Углы
	const aoa = Math.atan2(vUp, vForward); // угол атаки

	const aos = Math.atan2(vRight, vForward); // угол скольжения

	// === 5. Коэффициенты
	const cl = cl0 + 2 * Math.PI * aoa; // линейная модель
	console.log(rad2deg(aoa), cl);

	const cd = cd0 + (cl * cl) / (Math.PI * 6 * 0.8); // индуктивное сопротивление

	// === 6. Динамическое давление
	const qDyn = 0.5 * airDensity * speed * speed;

	// === 7. Подъёмная сила (направление: нормаль вектора скорости × forward)
	const liftDir = new Vector3().crossVectors(vel, right).cross(vel).normalize();
	const lift = liftDir.multiplyScalar(qDyn * wingArea * cl);

	// === 8. Сила сопротивления (против скорости)
	const dragDir = vel.clone().normalize().negate();
	const drag = dragDir.multiplyScalar(qDyn * wingArea * cd);

	return { lift, drag, aoa, aos };
}

export const Craft = ({ orbitControlsRef, editor = true }) => {
	const [partsStorage, partsStorageAPI] = useAtom(partsStorageAtom);
	console.log("Craft UPDATE", partsStorage.parts);
	const [settingsStorage, setSettingsStorage] = useAtom(settingsAtom);
	const setHudData = useSetAtom(hudDataAtom);
	const lastAddedRef = useRef(null);
	const craftGroupRef = useRef(null);
	const rigidBodyRef = useRef(null);
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
		orbitControlsRef,
		partsStorage,
		partsStorageAPI,
		lastAddedRef,
		settingsStorage
	);

	useMouseControls(editor, partsStorage, partsStorageAPI, settingsStorage, orbitControlsRef);

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
		if (rigidBodyRef.current) {
			rigidBodyRef.current.setTranslation(new Vector3(0, 0, 0), true);
			rigidBodyRef.current.setRotation(quat({ x: 0, y: 0, z: 0, w: 1 }), true);
		}
		//if (craftGroupRef.current) {	}
		orbitControlsRef.current.object.position.set(30, 20, 30);
		orbitControlsRef.current.target = new Vector3(0, 0, 0);
		orbitControlsRef.current.update();
		craftControlsRef.current = craftControlsInit;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [editor]);

	useFrame((state, delta) => {
		if (editor) return;
		if (orbitControlsRef.current && rigidBodyRef.current) {
			const position = vec3(rigidBodyRef.current.translation());
			const quaternion = quat(rigidBodyRef.current.rotation());
			const eulerRot = euler().setFromQuaternion(quat(rigidBodyRef.current.rotation()));

			const linvel = rigidBodyRef.current.linvel();
			const speed = new Vector3(linvel.x, linvel.y, linvel.z).length();
			const altitude = position.y;

			setHudData({ speed, altitude });

			orbitControlsRef.current.target.lerp(position, 0.1);
			orbitControlsRef.current.update();

			function clamp(value, min = -1, max = 1) {
				if (value < min) return min;
				if (value > max) return max;
				return value;
			}

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

			const mass = rigidBodyRef.current.mass();

			const { pitch, roll, yaw, throttle, vtol, trim, brake, airbrake } = craftControlsRef.current;

			const torque = mass * 2;
			applyLocalTorque(rigidBodyRef.current, { x: pitch * torque, y: yaw * torque, z: roll * torque });

			//console.log(mass, rigidBodyRef.current.localCom());
			const gravity = 9.81;
			const weight = mass * gravity;
			// Сила, компенсирующая вес
			const forceUp = { x: 0, y: weight * vtol, z: 0 };
			applyLocalForce(rigidBodyRef.current, forceUp, delta);

			const { lift, drag, aoa, aos } = computeWingForces(rigidBodyRef.current, {
				wingArea: 90,
				cl0: 0.2,
				cd0: 0.02,
			});

			// переводим в импульсы
			const liftImpulse = lift.clone().multiplyScalar(delta);
			const dragImpulse = drag.clone().multiplyScalar(delta);

			console.log("liftImpulse", liftImpulse);

			//rigidBodyRef.current.applyImpulse(liftImpulse, true);
			//rigidBodyRef.current.applyImpulse(dragImpulse, true);

			if (craftGroupRef.current) {
				craftGroupRef.current.children.map((dragPart) => {
					const part = dragPart.userData;
					if (part && part.partType.includes("engine")) {
						const maxForce = part.engine.maxForce;
						applyLocalForceAtPoint(rigidBodyRef.current, { x: 0, y: 0, z: weight * throttle }, part.position, delta);
					}
				});
			}
		}
	});

	return (
		<RigidBody name="craftRigidBody" ref={rigidBodyRef} colliders={false} type={editor ? "fixed" : "dynamic"} onContactForce={(payload) => {}}>
			<group ref={craftGroupRef} name="craft" layers={2}>
				{partsStorage.parts.map((part) => (
					<CreatePart key={part.id} part={part} selected={part.id === partsStorage.selectedPart?.id} editor={editor} />
				))}
			</group>
		</RigidBody>
	);
};
