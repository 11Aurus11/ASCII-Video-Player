import fs from 'fs';
import { execSync } from 'child_process';
import { Jimp } from 'jimp';

// Проверка FFmpeg
try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
} catch (e) {
    console.error('Установите FFmpeg: winget install ffmpeg');
    process.exit(1);
}

// Конфигурация
const MAX_WIDTH = process.stdout.columns || 120;
const MAX_HEIGHT = process.stdout.rows || 60;
const VIDEO_PATH = './assets/BadApple.mp4';
const FRAMES_DIR = './frames';
const OUTPUT_FILE = './frames.txt';
const FPS = 24;

// Проверка видео
if (!fs.existsSync(VIDEO_PATH)) {
    console.error('Видео не найдено!');
    process.exit(1);
}

// Создание папки для кадров
if (!fs.existsSync(FRAMES_DIR)) {
    fs.mkdirSync(FRAMES_DIR, { recursive: true });
}

// Извлечение кадров через FFmpeg
console.log(`Извлекаю кадры (${MAX_WIDTH}x${MAX_HEIGHT} && ${FPS} FPS)...`);
execSync(
    `ffmpeg -i "${VIDEO_PATH}" -vf "fps=${FPS},scale=${MAX_WIDTH}:${MAX_HEIGHT}" -pix_fmt rgb24 "${FRAMES_DIR}/frame_%04d.png"`,
    { stdio: 'ignore' }
);

// Конвертация в ASCII
console.log('Конвертирую в ASCII...');
const frames = fs.readdirSync(FRAMES_DIR)
  .filter(f => f.endsWith('.png'))
  .sort();

const asciiFrames = [];
for (const file of frames) {
    const imagePath = `${FRAMES_DIR}/${file}`;
    const image = await Jimp.read(imagePath);

    image.resize({ w: MAX_WIDTH, h:MAX_HEIGHT });

    let ascii = '';
    for (let y = 0; y < MAX_HEIGHT; y++) {
        for (let x = 0; x < MAX_WIDTH; x++) {
            const pixel = image.getPixelColor(x, y);
            const r = (pixel >> 24) & 0xFF;
            const g = (pixel >> 16) & 0xFF;
            const b = (pixel >> 8) & 0xFF;
        
            const brightness = (r + g + b) / 3;
        // 1 Вариант
        //   ascii += brightness > 128 ? ' ' : '█';

        // 2 Вариант более плотный
            const chars = '@%#*+=-:. ';
            const charIndex = Math.min(
                Math.floor((255 - brightness) / 255 * chars.length),
                chars.length - 1
            );
            ascii += chars[charIndex];

        }
        ascii += '\n';
    }
    asciiFrames.push(ascii);
}

// Сохранение результата
fs.writeFileSync(OUTPUT_FILE, asciiFrames.join('\n\n'));
console.log(`Готово! ${asciiFrames.length} кадров сохранено в frames.txt`);

// Воспроизведение
console.clear();
console.log('Воспроизведение');
setTimeout(() => {
    let i = 0;
    setInterval(() => {
        console.clear();
        process.stdout.write(asciiFrames[i]);
        i = (i + 1) % asciiFrames.length;
    }, 1000 / FPS);
}, 1000);