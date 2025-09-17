import { Quaternion, Vector3 } from "three";


function clamp(value, min = -1, max = 1) {
    if (value < min) return min;
    if (value > max) return max;
    return value;
}

const rad2deg = (value) => value * (180 / Math.PI);
const deg2rad = (value) => (value * Math.PI) / 180;

class Curve {
    constructor(points) {
        // points = [{x: angleDeg, y: value}, ...]
        this.points = points.sort((a, b) => a.x - b.x);
    }

    evaluate(x) {
        // clamp за пределами диапазона
        if (x <= this.points[0].x) return this.points[0].y;
        if (x >= this.points[this.points.length - 1].x) return this.points[this.points.length - 1].y;

        // найти два соседних сегмента
        for (let i = 0; i < this.points.length - 1; i++) {
            const p1 = this.points[i];
            const p2 = this.points[i + 1];
            if (x >= p1.x && x <= p2.x) {
                const t = (x - p1.x) / (p2.x - p1.x);
                return p1.y * (1 - t) + p2.y * t;
            }
        }
    }
}

const CL = new Curve([
    { x: -180, y: 0 },
    { x: -135, y: 1.15 },
    { x: -90, y: 0 },
    { x: -45, y: -1.15 },
    { x: -27, y: -0.93 },
    { x: -23, y: -0.85 },
    { x: -20, y: -1.2 },
    { x: -16, y: -1.5 },
    { x: -15, y: -1.5 },
    { x: -10, y: -1.1 },
    { x: -5, y: -0.6 },
    { x: 0, y: 0.0 },
    { x: 5, y: 0.6 },
    { x: 10, y: 1.1 },
    { x: 15, y: 1.5 },
    { x: 16, y: 1.5 },
    { x: 20, y: 1.2 },
    { x: 23, y: 0.85 },
    { x: 27, y: 0.93 },
    { x: 45, y: 1.15 },
    { x: 90, y: 0 },
    { x: 135, y: -1.15 },
    { x: 180, y: 0 },
]);

const CD = new Curve([
    { x: -180, y: 0 },
    { x: -90, y: 1.25 },
    { x: -27, y: 0.25 },
    { x: -20, y: 0.15 },
    { x: -15, y: 0.025 },
    { x: -10, y: 0.012 },
    { x: 0, y: 0.005 },
    { x: 10, y: 0.012 },
    { x: 15, y: 0.025 },
    { x: 20, y: 0.15 },
    { x: 27, y: 0.25 },
    { x: 90, y: 1.25 },
    { x: 180, y: 0 },
]);

export function computeWingForces({
    globalVel = new Vector3(),
    quaternion = new Quaternion(),
    airDensity = 1.225, // плотность воздуха кг/м³
    wingArea = 10, // площадь крыла м²
    wingUp = new Vector3(0, 1, 0), // нормаль крыла
    wingForward = new Vector3(0, 0, 1), // продольная ось крыла
    input = 0,
    controlSurface = [0, 0],
} = {}) {
    // === 1. Скорость rigidbody
    const speed = globalVel.length();
    //if (speed < 1e-3) return { lift: new Vector3(), drag: new Vector3() };

    // === 2. Получаем ориентацию крыла

    const forward = wingForward.applyQuaternion(quaternion).normalize();
    const up = wingUp.applyQuaternion(quaternion).normalize();
    const right = new Vector3().crossVectors(forward, up).normalize();

    // === 3. Проекции скорости на оси крыла
    const vRight = globalVel.dot(right);
    const vUp = globalVel.dot(up);
    const vForward = globalVel.dot(forward);
    const localVel = [vRight, vUp, vForward];

    // === 4. Углы
    const aoa = Math.atan2(-vUp, vForward); // угол атаки
    const aos = Math.atan2(vRight, vForward); // угол скольжения

    // === 5. Коэффициенты
    const cl = CL.evaluate(rad2deg(aoa) + input);
    const cd = CD.evaluate(rad2deg(aoa) + input); // индуктивное сопротивление

    // === 6. Динамическое давление
    const qDyn = 0.5 * airDensity * speed * speed;

    // === 7. Подъёмная сила (направление: нормаль вектора скорости × forward)
    //const clampedVel = vel.clone().clampLength(0, 350);
    //const liftDir = up.clone(); //.cross(forward).normalize();
    const liftDir = up.clone(); //.cross(forward).normalize();

    const liftForce = clamp(qDyn * wingArea * cl, -100000, 100000);
    //const lift = liftDir.clone().multiplyScalar(liftForce);

    // === 8. Сила сопротивления (против скорости)
    const dragDir = globalVel.clone().normalize().negate();
    const dragForce = clamp(qDyn * wingArea * cd, -100000, 100000);

    //const drag = dragDir.multiplyScalar(dragForce);

    return { aoa, aos, liftForce, dragForce, localVel, cl, cd };
}
