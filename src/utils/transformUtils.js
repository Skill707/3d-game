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

export function attachPart(selectedObject, hit) {
	const point = hit.point.clone();
	const attachTo = hit.object.name;
	const localNormal = hit.normal;
	const hitGroupObject = hit.object.parent;

	const hitPart = hitGroupObject.userData;
	const selectedPart = selectedObject.userData;
	const connectionType = selectedPart.partType;
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

	if (connectionType === "wing") {
		const pSel = new THREE.Vector3().fromArray(selectedPart.fuselage.rearSegmentPos);
		const finalMatrix = new THREE.Matrix4().makeBasis(right.clone(), forward.clone(), normal.clone().negate());
		finalQuat = new THREE.Quaternion().setFromRotationMatrix(finalMatrix);
		finalPosition = point.clone().add(pSel.clone().applyQuaternion(finalQuat));
	} else if (connectionType === "fuselage") {
		if (attachTo === "side") {
			finalPosition = point.clone();
			// Собираем новую матрицу
			const finalMatrix = new THREE.Matrix4().makeBasis(forward, normal, right.clone().negate());
			finalQuat = new THREE.Quaternion().setFromRotationMatrix(finalMatrix);
			const centerHeight = (selectedPart.fuselage.frontHeight + selectedPart.fuselage.rearHeight) / 4;
			const offset = new THREE.Vector3(0, -centerHeight, 0).applyQuaternion(finalQuat);
			finalPosition.sub(offset);
		} else if (attachTo === "front" || attachTo === "rear") {
			// локальные центры граней
			const pHit = new THREE.Vector3().fromArray(hitPart.fuselage[attachTo].pos);
			const pSel = new THREE.Vector3().fromArray(selectedPart.fuselage[otherSide(attachTo)].pos);
			// мировая точка центра грани базовой детали
			finalPosition = hitGroupObject.position.clone().add(pHit.clone().applyQuaternion(baseQuat));
			// итоговый поворот выбранной детали
			const finalMatrix = new THREE.Matrix4().makeBasis(forward.clone(), right.clone().negate(), normal.clone().negate());
			finalQuat = new THREE.Quaternion().setFromRotationMatrix(finalMatrix);
			// сдвиг выбранной детали так, чтобы её противоположная грань легла в hitFaceWorld
			const offsetSel = pSel.clone().applyQuaternion(finalQuat);
			finalPosition.sub(offsetSel);
		}
	}
	const finalRotation = new THREE.Euler().setFromQuaternion(finalQuat);
	return { position: finalPosition, rotation: finalRotation };
}

const otherSide = (side) => {
	if (side === "front") {
		return "rear";
	} else if (side === "rear") {
		return "front";
	} else {
		return "side";
	}
};

export function moveAttached(object, objects) {
	const part = object.userData;
	const attachedParts = part.attachedParts;
	if (!attachedParts) return;

	attachedParts.forEach((part) => {
		const obj = objects.find((obj) => "dragPart" + part.id === obj.name);
		if (!obj) return;

		if (part.offsetMatrix) {
			const offsetMatrix = new THREE.Matrix4().fromArray(part.offsetMatrix);
			const newMatrix = new THREE.Matrix4().copy(object.matrixWorld).multiply(offsetMatrix);
			newMatrix.decompose(obj.position, obj.quaternion, obj.scale);
		}

		obj.updateMatrixWorld(true);

		moveAttached(obj, objects);
	});
}

export function moveAttachedTo(id, attachedToParts, objects) {
	if (!attachedToParts) return;

	attachedToParts.forEach((part) => {
		const selObj = objects.find((obj) => "dragPart" + id === obj.name);
		const obj = objects.find((obj) => "dragPart" + part.id === obj.name);
		if (!selObj || !obj) return;
		if (obj.userData.root) return;

		if (part.offsetMatrix) {
			const offsetMatrix = new THREE.Matrix4().fromArray(part.offsetMatrix);

			// obj.matrixWorld = selObj.matrixWorld * offsetMatrix
			const newMatrix = new THREE.Matrix4().copy(selObj.matrixWorld).multiply(offsetMatrix);

			// Деконструируем матрицу в position/quaternion/scale
			newMatrix.decompose(obj.position, obj.quaternion, obj.scale);
		}

		const found = obj.userData;
		if (found) {
			moveAttachedTo(found.id, found.attachedToParts, objects);
		}
	});
}

export const saveTransformation = (partsStorageAPI, object, objects = null, lastHit = null, autoResizeParts = false, mode = "Connected") => {
	if (mode === "Connected") {
		moveAttached(object, objects);
		//moveAttachedTo(selectedPartID, selectedPart.attachedToParts, objects);
	}

	partsStorageAPI((api, prev) => {
		const selectedPart = object.userData;

		if (lastHit) {
			const attachTo = lastHit.object.name;
			console.log("1", lastHit.object);

			function findGroup(obj, group = null) {
				console.log(obj);

				if (obj.isGroup) group = obj;

				if (obj.parent.name.includes("dragPart")) return obj.parent;

				return findGroup(obj.parent, group);
			}
			const hitGroupObject = findGroup(lastHit.object);
			console.log("hitGroupObject", hitGroupObject);

			const hitPart = hitGroupObject.userData;
			if (!hitPart.attachedParts.find((part) => part.id === selectedPart.id)) {
				api.connectParts(hitGroupObject, attachTo, object);
				/*if (autoResizeParts && attachTo !== "side") {
					const hitSegment = hitPart.shapeSegments[attachTo];
					const selectedSegment = selectedPart.shapeSegments[otherSide(attachTo)];
					api.updPartsSegmentNameProps([
						{
							id: selectedPartID,
							segmentName: otherSide(attachTo),
							newProperties: { ...hitSegment, pos: selectedSegment.pos, slant: selectedSegment.slant, extendeble: false },
						},
					]);
				}*/
			}
		}

		let list = [];

		function saveAttaced(attachedParts) {
			if (!attachedParts) return;
			attachedParts.forEach((ap) => {
				const attachedPartObj = objects.find((obj) => "dragPart" + ap.id === obj.name);
				list.push({ id: ap.id, position: attachedPartObj.position.toArray(), rotation: attachedPartObj.rotation.toArray() });
				saveAttaced(attachedPartObj.userData.attachedParts);
			});
		}

		if (objects) {
			saveAttaced(selectedPart.attachedParts);
		}

		prev.parts = prev.parts.map((p) => {
			list.forEach((element, index) => {
				if (p.id === element.id) {
					if (element.position && element.rotation) {
						p.position = element.position;
						p.rotation = element.rotation;
					}
				}
			});
			if (p.id === selectedPart.id) {
				p.position = object.position.toArray();
				p.rotation = object.rotation.toArray();
			}
			return p;
		});

		selectedPart.position = object.position.toArray();
		selectedPart.rotation = object.rotation.toArray();

		api.selectPart(selectedPart);
		api.commit();
	});
};

export function getOffsetMatrix(firstObject, secondObject) {
	return new THREE.Matrix4().copy(firstObject.matrixWorld).invert().multiply(secondObject.matrixWorld).toArray();
}

export function localPosDelta(posDelta, rot) {
	const delta = new THREE.Vector3(...posDelta);
	const euler = new THREE.Euler(...rot);
	const quaternion = new THREE.Quaternion().setFromEuler(euler);
	return delta.applyQuaternion(quaternion).toArray();
}

export function localRotDelta(rotateDelta, rot) {
	const euler = new THREE.Euler(...rot);
	const q = new THREE.Quaternion().setFromEuler(euler);

	const qDelta = new THREE.Quaternion().setFromEuler(
		new THREE.Euler(...rotateDelta) // например [0, Math.PI/8, 0, "XYZ"]
	);
	// умножаем локально
	q.multiply(qDelta);
	// сохраняем обратно в Euler
	const newEuler = new THREE.Euler().setFromQuaternion(q, rot[3]);
	return newEuler.toArray();
}

export function applyLocalForce(rb, force, dt = 1 / 60) {
	if (!rb) return;
	const q = rb.rotation();
	const quat = new THREE.Quaternion(q.x, q.y, q.z, q.w);

	const impulse = {
		x: force.x * dt,
		y: force.y * dt,
		z: force.z * dt,
	};

	const local = new THREE.Vector3(impulse.x, impulse.y, impulse.z);
	const world = local.applyQuaternion(quat);

	rb.applyImpulse(world, true);
}

export function applyLocalTorque(rb, localTorque, wake = true) {
	if (!rb) return;

	// Берём мировую ориентацию тела
	const q = rb.rotation();
	const quat = new THREE.Quaternion(q.x, q.y, q.z, q.w);

	// Переводим локальный вектор в мировой
	const local = new THREE.Vector3(localTorque.x, localTorque.y, localTorque.z);
	const world = local.applyQuaternion(quat);

	// Применяем как обычный torque
	rb.applyTorqueImpulse(world, wake);
}

/*
, handleClickPart, handleStartDragPart, handleCopyPart, handleEndDragPart 
	const euler = new THREE.Euler().fromArray(part.rot);
	const quaternion = new THREE.Quaternion().setFromEuler(euler);
	const matrix = new THREE.Matrix4().compose(new THREE.Vector3().fromArray(part.pos), quaternion, new THREE.Vector3(1, 1, 1));
*/
