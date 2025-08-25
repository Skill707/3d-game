import { useAtom } from "jotai";
import { useEffect, useRef } from "react";
import { partsAtom, settingsAtom } from "../state/atoms";
import { CreatePart } from "../utils/partFactory";
import { addPart } from "../state/actions";
import { useDragControls } from "../hooks/useDragControls";

const Craft = ({ orbit }) => {
	const [partsStorage, setPartsStorage] = useAtom(partsAtom);
	const [settingsStorage, setSettingsStorage] = useAtom(settingsAtom);
	const lastAddedRef = useRef(null);

	useEffect(() => {
		console.clear();
		//console.log("Craft mount");
		//return () => console.log("Craft unmount");
	});

	const dragControlsRef = useDragControls(orbit, partsStorage, setPartsStorage, lastAddedRef);

	useEffect(() => {
		//console.log("Craft Effect[settingsStorage.addParts]");

		if (settingsStorage.addParts.selectedPartType !== null && settingsStorage.addParts.pointerOut === true) {
			console.log("init add part");

			const newID = Math.max(0, ...partsStorage.parts.map((p) => p.id)) + 1; // Генерируем уникальный ID
			lastAddedRef.current = "dragPart" + newID;

			setPartsStorage((prev) => {
				const [parts, newPart] = addPart(prev.parts, newID, settingsStorage.addParts.selectedPartType);
				return { ...prev, parts, selectedPart: newPart };
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [settingsStorage.addParts]);

	return partsStorage.parts.map((part) => <CreatePart key={part.id} part={part} selected={part.id === partsStorage.selectedPart?.id} />);
};

export default Craft;
