import { useAtom } from "jotai";
import { useEffect, useRef } from "react";
import { settingsAtom } from "../state/atoms";
import { CreatePart } from "../utils/partFactory";
import { useDragControls } from "../hooks/useDragControls";
import { TransformControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import partsStorageAtom from "../state/partsStorageAtom";
import { saveTransformation } from "../utils/transformUtils";
import useMouseControls from "../hooks/useMouseControls";

const Craft = ({ orbit, editor = true }) => {
	const [partsStorage, partsStorageAPI] = useAtom(partsStorageAtom);
	const [settingsStorage, setSettingsStorage] = useAtom(settingsAtom);
	const lastAddedRef = useRef(null);
	const { scene } = useThree();

	const dragControlsRef = useDragControls(
		(editor && settingsStorage.activeSubToolId === "MOVE") || settingsStorage.activeSubToolId === "RESHAPE",
		orbit,
		partsStorage,
		partsStorageAPI,
		lastAddedRef,
		settingsStorage
	);
	useMouseControls(editor, partsStorage, partsStorageAPI, settingsStorage, orbit);

	useEffect(() => {
		if (settingsStorage.addParts.selectedPartType !== null && settingsStorage.addParts.pointerOut === true) {
			const changes = partsStorageAPI((api) => {
				api.addPart(settingsStorage.addParts.selectedPartType);
				api.commit();
			});
			console.log(changes);
			lastAddedRef.current = "dragPart" + changes[0].id;
		}

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [settingsStorage.addParts]);

	const modesReg = {
		TRANSLATE: "translate",
		ROTATE: "rotate",
	};

	const transformControlsRef = useRef(null);
	const transformControlsMode = modesReg[settingsStorage.activeSubToolId];
	let transformObject = null;
	const objects = scene.children.filter((obj) => obj.name.includes("dragPart"));
	if (partsStorage.selectedPart) {
		transformObject = objects.find((o) => o.name === partsStorage.selectedPart.objectName);
	}
	const handleEndTransform = () => {
		if (transformObject) {
			saveTransformation(
				partsStorageAPI,
				transformObject,
				objects,
				null,
				settingsStorage.move.autoResizeParts,
				settingsStorage[transformControlsMode].mode
			);
		}
	};
	const rad2deg = (value) => value * (180 / Math.PI);
	const deg2rad = (value) => (value * Math.PI) / 180;

	return (
		<>
			{partsStorage.parts.map((part) => (
				<CreatePart key={part.id} part={part} selected={part.id === partsStorage.selectedPart?.id} editor={editor} />
			))}
			{editor && transformControlsMode && transformObject && (
				<TransformControls
					enabled={true}
					ref={transformControlsRef}
					object={transformObject}
					onObjectChange={(e) => {
						handleEndTransform();
					}}
					onChange={(e) => {
						//console.log("enter", e);
					}}
					mode={transformControlsMode}
					rotationSnap={deg2rad(settingsStorage.rotate.angleStep)}
					translationSnap={settingsStorage.translate.gridSize}
					space={
						transformControlsMode === "translate"
							? settingsStorage.translate.direction.toLocaleLowerCase()
							: settingsStorage.rotate.direction.toLocaleLowerCase()
					}
					size={transformObject.userData.shapeSegments.center.length * 0.2}
				/>
			)}
		</>
	);
};

export default Craft;
