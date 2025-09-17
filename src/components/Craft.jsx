import { useAtom } from "jotai";
import { useEffect, useRef } from "react";
import { settingsAtom } from "../state/atoms";
import { CreatePart } from "../utils/partFactory";
import { useDragControls } from "../hooks/useDragControls";
import partsStorageAtom from "../state/partsStorageAtom";
import useMouseControls from "../hooks/useMouseControls";
import { Quaternion, Vector3 } from "three";

export const Craft = ({ craftRBRef, cameraControlsRef, editor = true }) => {
	const [partsStorage, partsStorageAPI] = useAtom(partsStorageAtom);
	console.log("Craft UPDATE", partsStorage.parts);
	const [settingsStorage, setSettingsStorage] = useAtom(settingsAtom);
	const lastAddedRef = useRef(null);
	const craftGroupRef = useRef(null);

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
		/*if (craftRBRef.current) {
			craftRBRef.current.setTranslation(new Vector3(0, 0, 0), true);
			craftRBRef.current.setRotation(quat({ x: 0, y: 0, z: 0, w: 1 }), true);
			craftRBRef.current.setLinvel(new Vector3(0, 0, 20), true);
			console.log("craftRB", craftRBRef.current);
			craftRBRef.current.setAdditionalMassProperties(8000, new Vector3(0, 0, 0), new Vector3(0, 0, 0), new Quaternion(0, 0, 0, 0), true);
		}*/
		//if (craftGroupRef.current) {	}
		if (editor && cameraControlsRef.current) {
			cameraControlsRef.current.object.position.set(30, 20, 30);
			cameraControlsRef.current.target = new Vector3(0, 0, 0);
			//cameraControlsRef.current.target.lerp(position, 1);
			cameraControlsRef.current.update();
		}

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [editor]);

	return (
		<group ref={craftGroupRef} name="craft" layers={2}>
			{partsStorage.parts.map((part) => (
				<CreatePart key={part.id} part={part} selected={part.id === partsStorage.selectedPart?.id} editor={editor} />
			))}
		</group>
	);
};

/*
				<WaspModel />

name="craftRigidBody"
			ref={craftRBRef}
			gravityScale={1}
			colliders={false}
			linearVelocity={[0, 0, 50]}
			type={editor ? "fixed" : "dynamic"}
			onContactForce={(payload) => {}}
*/
