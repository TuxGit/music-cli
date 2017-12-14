const path = require('path');
const fs = require('fs');

const baseDir = path.resolve(__dirname);
let inputDir = undefined;
let outputDir = undefined;
let DEBUG = false;  // в режими debug файлы не удаляются, а просто копируются

// парсим входные параметры
process.argv.slice(2).forEach((val, index, array) => {
    switch (val) {
        case '--input':
            index++;
            inputDir = array[index];
            break;
        case '--output':
            index++;
            outputDir = array[index];
            break;
        case '--debug':
            DEBUG = true;
    }
    // console.log(array);
    // console.log(`${index}: ${val}`);
});

if (!inputDir || !outputDir) {
    console.log('Неверно заданы параметры!!!');
    console.log('Пример использования:');
    console.log('node main.js --input ./test/input --output ./test/output [--debug]');
    process.exit(1);
}

inputDir = path.normalize(path.join(baseDir, inputDir));
outputDir = path.normalize(path.join(baseDir, outputDir));

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}


// функция удаления директории
const removeDir = (dir) => {
    if (fs.existsSync(dir)) {
        fs.readdirSync(dir).forEach(file => {
            let currentPath = path.join(dir, file);
            if (fs.statSync(currentPath).isDirectory()) {
                removeDir(currentPath);
            } else {
                fs.unlinkSync(currentPath);  // remove file
            }
        });
        fs.rmdirSync(dir);
    }
};

// основная функция чтения каталога и перенос файлов
const readDir = (base, level) => {
    try {
        const files = fs.readdirSync(base);
        files.forEach(item => {
            let currentPath = path.join(base, item);
            if (fs.statSync(currentPath).isDirectory()) {  // Stats
                readDir(currentPath, level + 1);
            } else {
                // todo - проверять расширение: .mp3, ...?
                let newFileDir = path.join(outputDir, item[0].toUpperCase());
                if (!fs.existsSync(newFileDir)) {
                    fs.mkdirSync(newFileDir);
                }
                // fs.linkSync(path.join(currentPath), path.join(newFileDir, item));
                if (!DEBUG) {
                    fs.renameSync(path.join(currentPath), path.join(newFileDir, item));
                } else {
                    fs.copyFileSync(path.join(currentPath), path.join(newFileDir, item));
                }
            }
        });        
        return 0;
    } catch (e) {
        // throw e;
        return e.message ? e.message : 1;
    }
};

// запуск функции
const res = readDir(inputDir, 0);
if (res === 0) {
    console.log('Файлы успешно разобраны!');
    // удаляем входную директорию
    if (!DEBUG) {
        console.log('Чистим входную директорию...');
        // fs.rmdirSync(inputDir); // если только пустая директория :(
        removeDir(inputDir);
        console.log('Очистка завершена!');
    }
} else {
    console.log('Произошла ошибка: ', res);
}
