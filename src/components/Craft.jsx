import { useAtom } from "jotai";
import { useEffect, useRef } from "react";
import { partsAtom, settingsAtom } from "../state/atoms";
import { CreatePart } from "../utils/partFactory";
import { addPart } from "../state/actions";
import { useDragControls } from "../hooks/useDragControls";
import { TransformControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { saveTransformation } from "../utils/transformUtils";

const Craft = ({ orbit }) => {
	const [partsStorage, setPartsStorage] = useAtom(partsAtom);
	const [settingsStorage, setSettingsStorage] = useAtom(settingsAtom);
	const lastAddedRef = useRef(null);
	const { scene } = useThree();

	const dragControlsRef = useDragControls(settingsStorage.activeSubToolId === "MOVE", orbit, partsStorage, setPartsStorage, lastAddedRef);

	useEffect(() => {
		if (settingsStorage.addParts.selectedPartType !== null && settingsStorage.addParts.pointerOut === true) {
			const newID = Math.max(0, ...partsStorage.parts.map((p) => p.id)) + 1; // Генерируем уникальный ID
			lastAddedRef.current = "dragPart" + newID;

			setPartsStorage((prev) => {
				const [parts, newPart] = addPart(prev.parts, newID, settingsStorage.addParts.selectedPartType);
				return { ...prev, parts, selectedPart: newPart };
			});
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
			saveTransformation(setPartsStorage, transformObject, objects);
		}
	};
	return (
		<>
			{partsStorage.parts.map((part) => (
				<CreatePart key={part.id} part={part} selected={part.id === partsStorage.selectedPart?.id} />
			))}
			{transformControlsMode && transformObject && (
				<TransformControls
					enabled={true}
					ref={transformControlsRef}
					object={transformObject}
					onObjectChange={(e) => {
						handleEndTransform();
					}}
					mode={transformControlsMode}
					rotationSnap={settingsStorage.rotate.angleStep / 57.2958}
					translationSnap={settingsStorage.translate.gridSize}
					space={
						transformControlsMode === "translate"
							? settingsStorage.translate.direction.toLocaleLowerCase()
							: settingsStorage.rotate.direction.toLocaleLowerCase()
					}
				/>
			)}
		</>
	);
};

export default Craft;
