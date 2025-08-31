import * as THREE from "three";

// Проверяет, можно ли прикрепить деталь
function canAttachParts(part1, part2, attachPoint) {
	// Проверяем, не прикреплены ли уже детали друг к другу
	for (const point of ["front", "back", "side"]) {
		if (part1.attachedPartIDs[point].includes(part2.id) || part2.attachedPartIDs[point].includes(part1.id)) {
			return false;
		}
	}

	return true;
}

// Рекурсивно получает все прикрепленные детали
function getAttachedPartsRecursive(parts, startPartId, visited = new Set()) {
	visited.add(startPartId);

	const part = parts.find((p) => p.id === startPartId);
	if (!part) return visited;

	// Проверяем все точки крепления
	for (const attachPoint of ["front", "back", "side"]) {
		for (const attachedId of part.attachedPartIDs[attachPoint]) {
			if (!visited.has(attachedId)) {
				getAttachedPartsRecursive(parts, attachedId, visited);
			}
		}
	}

	return visited;
}

// Проверяет, образуют ли детали цикл при прикреплении
function wouldFormCycle(parts, part1Id, part2Id) {
	const attachedToPart1 = getAttachedPartsRecursive(parts, part1Id);
	return attachedToPart1.has(part2Id);
}


function moveAttached2(id, attachedParts, objects) {
	if (!attachedParts) return;
	attachedParts.forEach((part) => {
		const selObj = objects.find((obj) => "dragPart" + id === obj.name);
		const obj = objects.find((obj) => "dragPart" + part.id === obj.name);
		obj.position.copy(new THREE.Vector3(...selObj.position).add(new THREE.Vector3().fromArray(part.offset)));
		//obj.rotation.copy(new THREE.Euler(...selObj.rotation).add(new THREE.Euler().fromArray(part.rotOffset)));
		const found = obj.userData;
		if (!found) return;
		moveAttached2(found.id, found.attachedParts, objects);
	});
}
