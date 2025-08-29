import { produce } from "immer";
import * as THREE from "three";

// Применяет поворот к точке вокруг центра
export function rotatePointAroundPivot(point, pivot, rotation) {
	// Создаем векторы из массивов
	const pointVec = new THREE.Vector3(...point);
	const pivotVec = new THREE.Vector3(...pivot);

	// Создаем матрицу поворота из углов Эйлера
	const rotationMatrix = new THREE.Matrix4();
	rotationMatrix.makeRotationFromEuler(new THREE.Euler(...rotation));

	// Смещаем точку к началу координат
	pointVec.sub(pivotVec);

	// Применяем поворот
	pointVec.applyMatrix4(rotationMatrix);

	// Возвращаем точку обратно
	pointVec.add(pivotVec);

	return [pointVec.x, pointVec.y, pointVec.z];
}

// Обновляет позицию и поворот детали относительно родительской детали
export function updateRelativeTransform(part, parentPart, positionDelta, rotationDelta) {
	// Поворачиваем позицию детали вокруг позиции родителя
	const newPos = rotatePointAroundPivot(
		[part.pos[0] + positionDelta[0], part.pos[1] + positionDelta[1], part.pos[2] + positionDelta[2]],
		parentPart.pos,
		rotationDelta
	);

	// Обновляем поворот детали
	const newRot = [part.rot[0] + rotationDelta[0], part.rot[1] + rotationDelta[1], part.rot[2] + rotationDelta[2]];

	return { pos: newPos, rot: newRot };
}

// Helper: безопасно извлекает позицию (THREE.Vector3) из входа, который может быть:
// - THREE.Matrix4
// - объект события с полем `matrix` или `matrixWorld` (THREE.Matrix4)
// - массив из 16 чисел
// - объект события с полем `point` (Vector3-like)
export function matrix4ToVector3(input) {
	// extract THREE.Matrix4 from several possible shapes
	let mat = null;
	if (input instanceof THREE.Matrix4) mat = input;
	else if (input && input.matrix instanceof THREE.Matrix4) mat = input.matrix;
	else if (input && input.matrixWorld instanceof THREE.Matrix4) mat = input.matrixWorld;
	else if (Array.isArray(input) && input.length === 16) mat = new THREE.Matrix4().fromArray(input);

	if (mat) {
		const v = new THREE.Vector3();
		v.setFromMatrixPosition(mat); // корректно извлекает translation
		return v;
	}

	// fallback: try to read x,y,z
	if (input && (typeof input.x === "number" || Array.isArray(input))) {
		return new THREE.Vector3(input.x ?? input[0] ?? 0, input.y ?? input[1] ?? 0, input.z ?? input[2] ?? 0);
	}

	return null;
}

export function matrix4ToEuler(input) {
	// extract THREE.Matrix4 from several possible shapes
	let mat = null;
	if (input instanceof THREE.Matrix4) mat = input;
	else if (input && input.matrix instanceof THREE.Matrix4) mat = input.matrix;
	else if (input && input.matrixWorld instanceof THREE.Matrix4) mat = input.matrixWorld;
	else if (Array.isArray(input) && input.length === 16) mat = new THREE.Matrix4().fromArray(input);

	if (mat) {
		const e = new THREE.Euler();
		e.setFromRotationMatrix(mat);
		return e;
	}

	return null;
}

export function transformSelectedObject(selectedObject, hit) {
	const point = hit.point.clone();
	const attachTo = hit.object.name;
	const localNormal = hit.normal;
	const hitGroupObject = hit.object.parent;
	if (!hitGroupObject) return;
	const hitPart = hitGroupObject.userData;
	if (!hitPart) return;
	const final = attachPart(hitPart, hitGroupObject, localNormal, point, attachTo);
	selectedObject.position.copy(final.position);
	selectedObject.rotation.copy(final.rotation);
}

function attachPart(hitPart, hitGroupObject, localNormal, point, attachTo = "side") {
	let finalPosition = point.clone();
	let finalQuat = new THREE.Quaternion();

	// Мировая нормаль в точке касания
	const normal = localNormal.clone().transformDirection(hitGroupObject.matrixWorld).normalize();

	// Мировая ориентация базовой детали
	const baseQuat = hitGroupObject.getWorldQuaternion(new THREE.Quaternion());
	const baseMatrix = new THREE.Matrix4().makeRotationFromQuaternion(baseQuat);

	// Извлекаем «правую» ось детали (локальный X в мире)
	const baseX = new THREE.Vector3().setFromMatrixColumn(baseMatrix, 0).normalize();

	// Теперь пересобираем: up = normal, right = максимально близкий к baseX
	let right = new THREE.Vector3().crossVectors(normal, baseX).normalize();
	if (right.lengthSq() < 1e-6) {
		// если нормаль почти параллельна X, fallback через Z
		const baseZ = new THREE.Vector3().setFromMatrixColumn(baseMatrix, 2).normalize();
		right = new THREE.Vector3().crossVectors(normal, baseZ).normalize();
	}
	const forward = new THREE.Vector3().crossVectors(right, normal).normalize();

	// 6. Смещение по высоте (пример для "side")
	if (attachTo === "side") {
		// Собираем новую матрицу
		const finalMatrix = new THREE.Matrix4().makeBasis(forward, normal, right.clone().negate());
		finalQuat = new THREE.Quaternion().setFromRotationMatrix(finalMatrix);
		const centerHeight = (hitPart.shapeSegments.front.height + hitPart.shapeSegments.back.height) / 4;
		const offset = new THREE.Vector3(0, -centerHeight, 0).applyQuaternion(finalQuat);
		finalPosition.sub(offset);
	} else if (attachTo === "front" || attachTo === "back") {
		const attachFacePos = hitPart.shapeSegments[attachTo].pos;
		finalPosition.copy(hitGroupObject.position).add(new THREE.Vector3().fromArray(attachFacePos));
		const finalMatrix = new THREE.Matrix4().makeBasis(forward.clone(), right.clone(), normal.clone());
		finalQuat = new THREE.Quaternion().setFromRotationMatrix(finalMatrix);
		let offset = new THREE.Vector3().fromArray(attachFacePos).applyQuaternion(finalQuat);
		finalPosition.add(offset);
	}
	const finalRotation = new THREE.Euler().setFromQuaternion(finalQuat);
	return { position: finalPosition, rotation: finalRotation };
}

export const saveTransformation = (partsStorageAPI, object, objects = null, lastHit = null, autoResizeParts = false) => {
	partsStorageAPI(
		produce((draft) => {
			const selectedPart = draft.parts.find((p) => p.objectName === object.name);
			selectedPart.drag = false;
			// можно ещё сохранить финальную pos/rot сюда
			selectedPart.pos = [object.position.x, object.position.y, object.position.z];
			selectedPart.rot = [object.rotation.x, object.rotation.y, object.rotation.z];
			draft.selectedPart = null; // кастыль
			draft.selectedPart = selectedPart;

			if (lastHit) {
				const attachTo = lastHit.object.name;
				const hitGroupObject = lastHit.object.parent;
				const hitPart = hitGroupObject.userData;

				if (hitGroupObject) {
					const foundPart = draft.parts.find((p) => p.id === hitPart.id);
					//foundPart.shape.sections[0] = p.shape.sections[0];
					if (!foundPart.attachedParts.find((part) => part.id === selectedPart.id)) {
						foundPart.attachedParts.push({
							id: selectedPart.id,
							offset: new THREE.Vector3().subVectors(object.position, hitGroupObject.position).toArray(),
							name: attachTo,
						});
					}

					selectedPart.attachedToPart = {
						id: hitPart.id,
						offset: new THREE.Vector3().subVectors(object.position, hitGroupObject.position).toArray(),
						name: attachTo,
					};

					if (autoResizeParts) {
						if (attachTo !== "side") {
							let otherSide = "front";
							if (attachTo === "front") otherSide = "back";
							const foundShape = foundPart.shapeSegments[attachTo];
							const selectedShape = selectedPart.shapeSegments[otherSide];

							selectedPart.shapeSegments[otherSide] = {
								...foundShape,
								name: selectedShape.name,
								pos: selectedShape.pos,
							};
						}
					}
				}
			}
			function saveAttaced(id, attachedParts, objects) {
				if (!attachedParts || !objects || !id) return;
				attachedParts.forEach((part) => {
					const parObj = objects.find((obj) => "dragPart" + part.id === obj.name);
					const par = draft.parts.find((p) => p.id === part.id);
					par.pos = parObj.position.toArray();
					par.rot = parObj.rotation.toArray();
					saveAttaced(par.id, par.attachedParts, objects);
				});
			}

			if (objects) {
				saveAttaced(selectedPart.id, selectedPart.attachedParts, objects);
			}
		})
	);
};

/**
 * Обновляет трансформации всех деталей в draft.
 * @param {Object3D} Object3D
 * @param {Array} Vector3 Array
 * @returns {THREE.Vector3} Vector3
 */
export function clonePosWithOffset(Object3D, offset) {
	return Object3D.position.clone().add(new THREE.Vector3().fromArray(offset));
}

/*
, handleClickPart, handleStartDragPart, handleCopyPart, handleEndDragPart 
	const euler = new THREE.Euler().fromArray(part.rot);
	const quaternion = new THREE.Quaternion().setFromEuler(euler);
	const matrix = new THREE.Matrix4().compose(new THREE.Vector3().fromArray(part.pos), quaternion, new THREE.Vector3(1, 1, 1));
*/
