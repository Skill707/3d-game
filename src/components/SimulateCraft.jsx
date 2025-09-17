import { computeWingForces } from "../utils/wignsUtils";
import { Quaternion, Vector3 } from "three";
import { euler, quat, RigidBody, useFixedJoint, vec3 } from "@react-three/rapier";
import { useFrame, useThree } from "@react-three/fiber";
import { applyLocalForce, applyLocalForceAtPoint } from "../utils/transformUtils";
import { Box, PerspectiveCamera, useKeyboardControls } from "@react-three/drei";
import { createContext, useContext, useEffect, useRef } from "react";
import { useAtom, useSetAtom } from "jotai";
import { hudDataAtom } from "../state/hudDataAtom";
import partsStorageAtom from "../state/partsStorageAtom";
import { CreatePart } from "../utils/partFactory";

function clamp(value, min = -1, max = 1) {
	if (value < min) return min;
	if (value > max) return max;
	return value;
}

const rad2deg = (value) => value * (180 / Math.PI);
const deg2rad = (value) => (value * Math.PI) / 180;

export default function SimulateCraft({ craftRBRef }) {
	const [partsStorage] = useAtom(partsStorageAtom);
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
	const setHudData = useSetAtom(hudDataAtom);
	const craftGroupRef = useRef(null);
	const rigidBodes = useRef(null);

	const { scene } = useThree();
	console.log("SimulateCraft UPDATE", scene);

	useEffect(() => {
		craftControlsRef.current = craftControlsInit;
		rigidBodes.current = [craftRBRef.current];
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useFrame((state, delta) => {
		if (craftRBRef.current) {
			const position = vec3(craftRBRef.current.translation());
			const quaternion = quat(craftRBRef.current.rotation());
			const eulerRot = euler().setFromQuaternion(quat(craftRBRef.current.rotation()));

			const globalVel = vec3(craftRBRef.current.linvel());
			const speed = globalVel.length();
			const vertSpeed = globalVel.y;
			const altitude = position.y + 1000;

			const localCom = vec3(craftRBRef.current.localCom());
			const worldCom = vec3(craftRBRef.current.worldCom());
			const mass = craftRBRef.current.mass();

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

			//applyLocalForceAtPoint(craftRBRef.current, { x: 0, y: mLeftWing.liftForce, z: -mLeftWing.dragForce }, [-2, 0, 0], delta);
			//applyLocalForceAtPoint(craftRBRef.current, { x: 0, y: mRightWing.liftForce, z: -mRightWing.dragForce }, [2, 0, 0], delta);

			pitch = clamp(pitch + (rad2deg(aoa) * 0) / 30, -1, 1);
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

			//applyLocalForceAtPoint(craftRBRef.current, { x: 0, y: eLeftWing.liftForce, z: -eLeftWing.dragForce }, [-2, 0, -4], delta);
			//applyLocalForceAtPoint(craftRBRef.current, { x: 0, y: eRightWing.liftForce, z: -eRightWing.dragForce }, [2, 0, -4], delta);

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

			//applyLocalForceAtPoint(craftRBRef.current, { x: rudder.liftForce, y: 0, z: 0 }, [0, 1, -4], delta);

			setHudData([
				{ name: "SPD", value: speed, unit: " M/S" },
				{ name: "ALT", value: altitude, unit: " M" },
				{ name: "MASS", value: mass, unit: " KG" },
				{ name: "VS", value: vertSpeed, unit: " M/S" },
				{ name: "THR", value: throttle * 100, unit: " %" },
				{ name: "AOA", value: rad2deg(aoa), unit: " °" },
				{ name: "AOS", value: rad2deg(aos), unit: " °" },
				{ name: "Vel", value: localVel.map((v) => v.toFixed(0)), unit: "" },
				{ name: "lCom", value: localCom.toArray().map((v) => v.toFixed(2)), unit: "" },
				{ name: "wCom", value: worldCom.toArray().map((v) => v.toFixed(0)), unit: "" },
				{ name: "Pos", value: position.toArray().map((v) => v.toFixed(0)), unit: "" },
			]);

			if (craftGroupRef.current) {
				craftGroupRef.current.children.map((object) => {
					console.log("object", object);

					const part = object.userData.part;
					if (part && part.partType.includes("engine")) {
						const maxForce = part.engine.maxForce;
						applyLocalForce(craftRBRef.current, { x: 0, y: 0, z: weight * throttle }, delta);
					}
				});
			}
		}
	});

	const JointedThing = ({ part }) => {
		console.log("JointedThing", part.id);

		const newBody = useRef(null);
		const parentBody = useRef(null);

		useEffect(() => {
			if (newBody.current) {
				const mass = newBody.current.mass();
				const rootMass = craftRBRef.current.mass();
				craftRBRef.current.setAdditionalMass(rootMass + mass, true);
			}

			if (newBody.current && rigidBodes.current) {
				console.log(rigidBodes);
				rigidBodes.current.push(newBody.current);
				rigidBodes.current.map((rb) => {
					const attachedParts = rb.userData.part.attachedParts;

					if (attachedParts.length > 0) {
						const find = attachedParts.find((ap) => ap.id == part.id);
						if (find) {
							parentBody.current = rb;
						}
					}
				});
			}
		}, []);

		const joint = useFixedJoint(parentBody, newBody, [
			[0, 0, 0],
			[0, 0, 0, 1],
			[0, 0, 0],
			[0, 0, 0, 1],
		]);

		return (
			<RigidBody ref={newBody} name={part.partType + part.id} colliders={false} gravityScale={1} type={"dynamic"} userData={{ part, joint }}>
				<CreatePart part={part} />
			</RigidBody>
		);
	};

	const rootPart = partsStorage.parts[0];

	return (
		<group ref={craftGroupRef} name="craft" layers={2}>
			<RigidBody ref={craftRBRef} name={"rootPart"} colliders={false} type={"dynamic"} gravityScale={1} userData={{ part: rootPart, joint: null }}>
				<CreatePart part={rootPart} />
				<PerspectiveCamera makeDefault={true} name="craftCamera" fov={75} far={10000} />
			</RigidBody>
			{partsStorage.parts.map((part) => {
				if (part.id === rootPart.id) return null;
				return <JointedThing part={part} />;
			})}
		</group>
	);
}

/*

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
                {partsStorage.parts.map((part) => (
                    <RigidBody key={part.id} name={part.partType + part.id} colliders={false} type={editor ? "fixed" : "dynamic"}>
                        <CreatePart part={part} selected={part.id === partsStorage.selectedPart?.id} editor={editor} />
                    </RigidBody>
                ))}
            </group>
        </RigidBody>
*/
