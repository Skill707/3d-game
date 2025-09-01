import { attachPart } from "../utils/transformUtils";

export function transformSelectedObject(selectedObject, hit, attachToSurfaces, autoRotateParts) {
	const point = hit.point.clone();
	const attachTo = hit.object.name;
	const localNormal = hit.normal;
	const hitGroupObject = hit.object.parent;
	if (!hitGroupObject) return;
	const hitPart = hitGroupObject.userData;
	if (!hitPart) return;
	if (attachToSurfaces) {
		const final = attachPart(selectedObject, hitGroupObject, localNormal, point, attachTo);
		selectedObject.position.copy(final.position);
		if (autoRotateParts) selectedObject.rotation.copy(final.rotation);
	}
}
