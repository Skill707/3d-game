export default function useTransformControls({}) {
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
			{editor && transformControlsMode && transformObject && (
				<TransformControls
					enabled={true}
					ref={transformControlsRef}
					object={transformObject}
					onObjectChange={(e) => {
						handleEndTransform();
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
}
