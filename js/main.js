import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

// Инициализация Telegram WebApp
if (typeof Telegram !== "undefined" && Telegram.WebApp) {
    Telegram.WebApp.ready(); // Сообщаем Telegram, что WebApp готов
    Telegram.WebApp.expand(); // Расширяем WebApp на весь экран
} else {
    console.warn("Telegram WebApp API is не доступен. Проверьте окружение.");
}

// Настройка Three.js сцены
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x2f2f2f); // Серый фон сцены

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.getElementById("container3D").appendChild(renderer.domElement);

// Студийное освещение
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3); // Мягкий окружающий свет
scene.add(ambientLight);

const spotLight1 = new THREE.SpotLight(0xffffff, 1.2);
spotLight1.position.set(10, 20, 10);
spotLight1.castShadow = true;
spotLight1.shadow.mapSize.width = 2048;
spotLight1.shadow.mapSize.height = 2048;
scene.add(spotLight1);

const spotLight2 = new THREE.SpotLight(0xffffff, 0.8);
spotLight2.position.set(-10, 20, 10);
spotLight2.castShadow = true;
scene.add(spotLight2);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(5, 10, -5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

let mixer;

// Управление камерой
const controls = new OrbitControls(camera, renderer.domElement);
controls.update();

// Ограничение приближения камеры
let minDistance = 1; // По умолчанию минимальное расстояние
controls.minDistance = minDistance;
controls.maxDistance = 100; // Максимальное расстояние (можно настроить)

// Загрузка модели
const loader = new GLTFLoader();
loader.load(
    'models/dante/scene.gltf',
    (gltf) => {
        const model = gltf.scene;

        // Центрирование модели
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        model.position.x -= 0.3;
        model.position.y -= center.y;
        model.position.z -= center.z;

        // Установка минимального расстояния для приближения камеры
        const maxDim = Math.max(size.x, size.y, size.z);
        minDistance = maxDim * 0.8; // Ограничение на основе размера модели
        controls.minDistance = minDistance;

        // Установка камеры
        const fov = camera.fov * (Math.PI / 180);
        const cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        camera.position.set(0, 0, cameraZ * 1.5);
        camera.lookAt(0, 0, 0);

        scene.add(model);

        // Анимация модели (если есть)
        if (gltf.animations && gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(model);
            const action = mixer.clipAction(gltf.animations[0]);
            action.play();
        }
    },
    (xhr) => {
        console.log((xhr.loaded / xhr.total * 100).toFixed(2) + '% loaded');
    },
    (error) => {
        console.error('An error occurred while loading the model:', error);
    }
);

// Обработка изменения размера окна
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Анимация сцены
const clock = new THREE.Clock();

const animate = () => {
    requestAnimationFrame(animate);

    if (mixer) {
        const delta = clock.getDelta();
        mixer.update(delta);
    }

    controls.update();
    renderer.render(scene, camera);
};

animate();
