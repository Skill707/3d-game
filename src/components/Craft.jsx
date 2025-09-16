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
import { WaspModel } from "./Wasp";

function clamp(value, min = -1, max = 1) {
	if (value < min) return min;
	if (value > max) return max;
	return value;
}

const rad2deg = (value) => value * (180 / Math.PI);
const deg2rad = (value) => (value * Math.PI) / 180;

const Symfoil_Pol_Coefs_AOA15_From_Cl = [
	56.69939896088147, -301.1924202562678, 632.7647347138611, -669.8575814687855, 381.025160569637, -117.2471883399458, 18.52502688711168, 8.09205048613282,
	0.008141451286432179,
];
const Symfoil_Pol_Coefs_Cl_From_AOA15 = [
	0.00000004521214840366952, -0.000002997280406126126, 0.00007981670425431445, -0.001089141795736652, 0.008028872336561989, -0.03100402725378149,
	0.05692376545515582, 0.06755084769106541, 0.006027001665506408,
];
const Symfoil_Pol_Coefs_Cl_From_AOA23 = [
	0.000006531639754245241, -0.0009966139915261786, 0.06628834275197652, -2.510479677723191, 59.21474384593676, -890.8124581704506, 8347.495835726186,
	-44550.21618261789, 103684.6591100608,
];
const Symfoil_Pol_Coefs_Cl_From_AOA45 = [
	0.0000000004406847819882474, -0.0000001238258464254468, 0.00001513630479597077, -0.001051200033500869, 0.0453604552617353, -1.245239443939503,
	21.23550754623621, -205.6254944892285, 866.0326273977061,
];
const Symfoil_Pol_Coefs_Cl_From_AOA90 = [
	-0.0000000000000003927374371853442, 0.000000000000207507657140711, -0.00000000004762034290765777, 0.000000006198822020856777, -0.0000005005611174461749,
	0.00003198434972786261, -0.002520487424567187, 0.1297347726873584, -1.265402561771135,
];

function calcPolynomial(input, coefs) {
	let output = 0;
	for (let i = 0; i < coefs.length; i++) {
		output += coefs[i] * Math.pow(Math.abs(input), coefs.length - i - 1);
	}
	return output * (input >= 0 ? 1 : -1);
}

function computeWingForces(
	rb,
	{
		airDensity = 1.225, // плотность воздуха кг/м³
		wingArea = 10, // площадь крыла м²
		wingUp = new Vector3(0, 1, 0), // нормаль крыла
		wingForward = new Vector3(0, 0, 1), // продольная ось крыла
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

	const forward = wingForward.applyQuaternion(quat).normalize();
	const up = wingUp.applyQuaternion(quat).normalize();
	//const right = new Vector3(1, 0, 0).applyQuaternion(quat).normalize();
	const right = new Vector3().crossVectors(forward, up).normalize();
	/*console.log(
			right.toArray().map((v) => v.toFixed(2)),
		up.toArray().map((v) => v.toFixed(2)),
		forward.toArray().map((v) => v.toFixed(2))
	);*/

	// === 3. Проекции скорости на оси крыла
	const vRight = vel.dot(right);
	const vUp = vel.dot(up);
	const vForward = vel.dot(forward);
	const localVel = [vRight, vUp, vForward];

	// === 4. Углы
	const aoa = Math.atan2(-vUp, vForward); // угол атаки
	const aos = Math.atan2(vRight, vForward); // угол скольжения

	// === 5. Коэффициенты
	//const cl = cl0 + 2 * Math.PI * aoa; // линейная модель
	let cl = 0;
	if (Math.abs(aoa) < 15 * (Math.PI / 180)) {
		cl = calcPolynomial(rad2deg(aoa), Symfoil_Pol_Coefs_Cl_From_AOA15);
	} else if (Math.abs(aoa) < 23 * (Math.PI / 180)) {
		cl = calcPolynomial(rad2deg(aoa), Symfoil_Pol_Coefs_Cl_From_AOA23);
	} else if (Math.abs(aoa) < 45 * (Math.PI / 180)) {
		cl = calcPolynomial(rad2deg(aoa), Symfoil_Pol_Coefs_Cl_From_AOA45);
	} else if (Math.abs(aoa) < 90 * (Math.PI / 180)) {
		cl = calcPolynomial(rad2deg(aoa), Symfoil_Pol_Coefs_Cl_From_AOA90);
	} else {
		cl = 0;
	}
	cl = clamp(cl, -10, 10);

	const cd = (cl * cl) / (Math.PI * 6 * 0.8); // индуктивное сопротивление

	// === 6. Динамическое давление
	const qDyn = 0.5 * airDensity * speed * speed;

	// === 7. Подъёмная сила (направление: нормаль вектора скорости × forward)
	//const clampedVel = vel.clone().clampLength(0, 350);
	//const liftDir = up.clone(); //.cross(forward).normalize();
	const liftDir = up.clone(); //.cross(forward).normalize();

	const liftForce = clamp(qDyn * wingArea * cl, -100000, 100000);
	const lift = liftDir.clone().multiplyScalar(liftForce);

	// === 8. Сила сопротивления (против скорости)
	const dragDir = vel.clone().normalize().negate();
	const dragForce = clamp(qDyn * wingArea * cd, -100000, 100000);

	const drag = dragDir.multiplyScalar(dragForce);

	return { lift, drag, aoa, aos, liftForce, dragForce, localVel };
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
		throttle: 1,
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
			rigidBodyRef.current.setLinvel(new Vector3(0, 0, 50), true);
			//console.log(rigidBodyRef.current);
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

			orbitControlsRef.current.target.lerp(position, 0.1);
			orbitControlsRef.current.update();

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

			const { aoa, aos, liftForce, dragForce, localVel } = computeWingForces(rigidBodyRef.current, {
				wingArea: mass / 300,
			});

			let { pitch, roll, yaw, throttle, vtol, trim, brake, airbrake } = craftControlsRef.current;

			pitch = clamp(pitch + rad2deg(aoa) / 30, -1, 1);
			yaw = clamp(yaw, -1, 1);
			const torque = mass * 2;
			applyLocalTorque(rigidBodyRef.current, { x: pitch * torque, y: yaw * torque, z: roll * torque });

			//console.log(mass, rigidBodyRef.current.localCom());
			const gravity = 9.81;
			const weight = mass * gravity;

			// Сила, компенсирующая вес
			const force = { x: 0, y: weight * vtol + liftForce, z: weight * throttle - dragForce };
			applyLocalForce(rigidBodyRef.current, force, delta);

			const wingForces = computeWingForces(rigidBodyRef.current, {
				wingArea: 1,
				wingUp: new Vector3(1, 0, 0),
			});

			applyLocalForceAtPoint(rigidBodyRef.current, { x: wingForces.liftForce, y: 0, z: 0 }, [0, 0, -5], delta);
			console.log(wingForces.liftForce);

			setHudData([
				{ name: "SPD", value: speed, unit: " M/S" },
				{ name: "AOA", value: rad2deg(aoa), unit: " °" },
				{ name: "AOS", value: rad2deg(aos), unit: " °" },
				{ name: "LF", value: liftForce, unit: "", valueDigits: 2 },
				{ name: "DF", value: dragForce, unit: "", valueDigits: 2 },
				{ name: "Vel", value: localVel.map((v) => v.toFixed(0)), unit: "" },
				{ name: "Pos", value: position.toArray().map((v) => v.toFixed(0)), unit: "" },
			]);

			/*if (craftGroupRef.current) {
				craftGroupRef.current.children.map((dragPart) => {
					const part = dragPart.userData;
					if (part && part.partType.includes("engine")) {
						const maxForce = part.engine.maxForce;
						applyLocalForceAtPoint(rigidBodyRef.current, { x: 0, y: 0, z: weight * throttle }, part.position, delta);
					}
				});
			}*/
		}
	});

	return (
		<RigidBody
			name="craftRigidBody"
			ref={rigidBodyRef}
			gravityScale={1}
			colliders={false}
			linearVelocity={[0, 0, 50]}
			type={editor ? "fixed" : "dynamic"}
			onContactForce={(payload) => {}}
		>
			<group ref={craftGroupRef} name="craft" layers={2}>
				<WaspModel />
			</group>
		</RigidBody>
	);
};

/*
{partsStorage.parts.map((part) => (
					<CreatePart key={part.id} part={part} selected={part.id === partsStorage.selectedPart?.id} editor={editor} />
				))}
*/
