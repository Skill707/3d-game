import { useAtom } from "jotai";
import { useEffect, useRef } from "react";
import { settingsAtom } from "../state/atoms";
import { CreatePart } from "../utils/partFactory";
import { useDragControls } from "../hooks/useDragControls";
import partsStorageAtom from "../state/partsStorageAtom";
import useMouseControls from "../hooks/useMouseControls";
import { euler, quat, RigidBody, vec3 } from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";
import { useKeyboardControls } from "@react-three/drei";
import { applyLocalForce, applyLocalTorque } from "../utils/transformUtils";

export const Craft = ({ orbitControlsRef, editor = true }) => {
	console.log("Craft UPDATE");
	const [partsStorage, partsStorageAPI] = useAtom(partsStorageAtom);
	const [settingsStorage, setSettingsStorage] = useAtom(settingsAtom);
	const lastAddedRef = useRef(null);
	const craftGroupRef = useRef(null);
	const rigidBodyRef = useRef(null);
	const craftControlsRef = useRef({ pitch: 0, roll: 0, yaw: 0, throttle: 0 });
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
		rigidBodyRef.current.setTranslation(vec3({ x: 0, y: 5, z: 0 }), true);
		rigidBodyRef.current.setRotation(quat({ x: 0, y: 0, z: 0, w: 1 }), true);
		craftGroupRef.current.position.set(0, -5, 0);
		//console.log("reset", craftGroupRef.current);
	}, [editor]);

	useFrame((state, delta) => {
		if (editor) return;
		if (orbitControlsRef.current && rigidBodyRef.current) {
			const position = vec3(rigidBodyRef.current.translation());
			const quaternion = quat(rigidBodyRef.current.rotation());
			const eulerRot = euler().setFromQuaternion(quat(rigidBodyRef.current.rotation()));

			orbitControlsRef.current.target.lerp(position, 0.1);
			orbitControlsRef.current.update();

			craftControlsRef.current = {
				pitch: 0,
				roll: 0,
				yaw: 0,
				throttle: 0,
			};

			const actions = {
				pitchUp: () => (craftControlsRef.current.pitch = -1),
				pitchDown: () => (craftControlsRef.current.pitch = 1),
				rollLeft: () => (craftControlsRef.current.roll = -1),
				rollRight: () => (craftControlsRef.current.roll = 1),
				yawLeft: () => (craftControlsRef.current.yaw = 1),
				yawRight: () => (craftControlsRef.current.yaw = -1),
				throttleUp: () => (craftControlsRef.current.throttle = 1),
				throttleDown: () => (craftControlsRef.current.throttle = 0),
			};

			for (const [name, value] of Object.entries(get())) {
				if (value) actions[name]();
			}

			const { pitch, roll, yaw, throttle } = craftControlsRef.current;
			const torque = 2;
			applyLocalTorque(rigidBodyRef.current, { x: pitch * torque, y: yaw * torque, z: roll * torque });

			const mass = rigidBodyRef.current.mass();
			//console.log(mass, rigidBodyRef.current.localCom());
			const gravity = 9.81;
			const weight = mass * gravity;
			// Сила, компенсирующая вес
			const forceUp = { x: 0, y: weight, z: weight * 1.5 * throttle };

			applyLocalForce(rigidBodyRef.current, forceUp, delta);
		}
	});

	return (
		<RigidBody
			name="craftRigidBody"
			ref={rigidBodyRef}
			colliders={false}
			type={editor ? "fixed" : "dynamic"}
			onContactForce={(payload) => {
				console.log(`The total force generated was: ${payload.totalForce}`, payload);
			}}
		>
			<group ref={craftGroupRef} name="craft">
				{partsStorage.parts.map((part) => (
					<CreatePart key={part.id} part={part} selected={part.id === partsStorage.selectedPart?.id} editor={editor} />
				))}
			</group>
		</RigidBody>
	);
};
