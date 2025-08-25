import * as THREE from "three";

// Вычисляет разницу между двумя позициями
export function calculatePositionDelta(oldPos, newPos) {
	return [newPos[0] - oldPos[0], newPos[1] - oldPos[1], newPos[2] - oldPos[2]];
}

// Вычисляет разницу между двумя поворотами (в радианах)
export function calculateRotationDelta(oldRot, newRot) {
	return [newRot[0] - oldRot[0], newRot[1] - oldRot[1], newRot[2] - oldRot[2]];
}

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

function transformSelectedObject(selectedObject, hit) {
	const point = hit.point.clone();
	const attachTo = hit.object.name;
	const localNormal = hit.normal;

	const hitGroupObject = hit.object.parent;
	if (!hitGroupObject) return;

	const hitPart = hitGroupObject.userData;
	if (!hitPart) return;

	let finalPosition = point.clone();
	/*finalPosition.x = finalPosition.x.toPrecision(1);
                        finalPosition.y = finalPosition.y.toPrecision(1);*/

	finalPosition.z = hitGroupObject.position.z;
	let finalRotation = new THREE.Euler();
	const size = [2, 2, 2];
	if (attachTo === "side") {
		// Transform normal from local to world space using part's rotation
		const partRotation = new THREE.Euler(...hitPart.rot);
		const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(partRotation);
		const normal = localNormal.applyMatrix4(rotationMatrix).normalize();

		// Convert normal to rotation using quaternion
		// Calculate the rotation from defaultUp to our normal
		const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
		// Convert quaternion to euler angles
		finalRotation.setFromQuaternion(quaternion);

		const offset = new THREE.Vector3(0, -size[1] / 2, 0).applyQuaternion(quaternion);
		finalPosition.sub(offset);
	} else if (attachTo === "front" || attachTo === "back") {
		const offset = attachTo === "front" ? size[2] / 2 : -size[2] / 2;
		finalPosition.set(hitGroupObject.position.x, hitGroupObject.position.y, point.z + offset);
		finalRotation.copy(new THREE.Euler(...hitPart.rot));
	} else {
		finalPosition.copy(point);
		finalRotation.copy(new THREE.Euler());
	}

	selectedObject.position.copy(finalPosition);
	selectedObject.rotation.copy(finalRotation);
}
