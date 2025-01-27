import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

// Инициализация Telegram WebApp
if (typeof Telegram !== "undefined" && Telegram.WebApp) {
    Telegram.WebApp.ready(); // Сообщаем Telegram, что WebApp готов
    Telegram.WebApp.expand(); // Расширяем WebApp на весь экран
} else {
    console.warn("Telegram WebApp API не доступен. Проверьте окружение.");
}

// Настройка Three.js сцены
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000); // Чёрный фон сцены

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.getElementById("container3D").appendChild(renderer.domElement);

// Освещение
const ambientLight = new THREE.AmbientLight(0xffffff, 1); // Мягкий заполняющий свет
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
keyLight.position.set(10, 20, 10);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 2);
fillLight.position.set(-10, 10, 10);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xff0000, 1.5);
rimLight.position.set(0, 5, -10);
scene.add(rimLight);

// Настройка теней
[keyLight, fillLight, rimLight].forEach(light => {
    light.castShadow = true;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
});

let mixer;

// Управление камерой
const controls = new OrbitControls(camera, renderer.domElement);
controls.update();

// Ограничение вращения камеры
controls.minPolarAngle = Math.PI / 6;
controls.maxPolarAngle = Math.PI / 2;
controls.minDistance = 2;
controls.maxDistance = 4;

const loadingScreen = document.getElementById("loading-screen");
const loadingMessage = document.getElementById("loading-message");

// Загрузка модели
const loader = new GLTFLoader();
loader.load(
    "models/dante04/scene.gltf",
    (gltf) => {
        const model = gltf.scene;

        model.traverse((child) => {
            if (child.isMesh) {
                const material = child.material;
                if (material && material.aoMap && !child.geometry.attributes.uv2) {
                    child.geometry.setAttribute("uv2", child.geometry.attributes.uv);
                }
                if (material && !(material instanceof THREE.MeshStandardMaterial)) {
                    child.material = new THREE.MeshStandardMaterial({
                        map: material.map,
                        normalMap: material.normalMap,
                        roughnessMap: material.roughnessMap,
                        metalnessMap: material.metalnessMap,
                        aoMap: material.aoMap,
                        emissiveMap: material.emissiveMap,
                        roughness: material.roughness || 1,
                        metalness: 0,
                    });
                }
                if (material instanceof THREE.MeshStandardMaterial) {
                    material.metalness = 0;
                    material.roughness = 1;
                }
            }
        });

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        model.position.x -= center.x;
        model.position.y -= center.y;
        model.position.z -= center.z;

        const fov = camera.fov * (Math.PI / 180);
        const cameraZ = Math.abs(size.length() / 2 / Math.tan(fov / 2));
        camera.position.set(0, 0, cameraZ * 1.5);
        camera.lookAt(0, 0, 0);

        scene.add(model);

        if (gltf.animations && gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(model);
            const action = mixer.clipAction(gltf.animations[0]);
            action.play();
        }

        // Убираем загрузочный экран после полной загрузки
        loadingScreen.style.display = "none";
    },
    (xhr) => {
        // Проверяем xhr.total перед вычислением процентов
        if (xhr.total) {
            const percentLoaded = (xhr.loaded / xhr.total * 100).toFixed(2);
            loadingMessage.textContent = `${percentLoaded}%`;
        } else {
            loadingMessage.textContent = "0%";
        }
    },
    (error) => {
        console.error("An error occurred while loading the model:", error);
        loadingMessage.textContent = "Error loading the model.";
    }
);

// Обработка изменения размера окна
window.addEventListener("resize", () => {
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
