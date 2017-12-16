const path = require('path');
const fs = require('fs');
const util = require('util');
const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);
const rename = util.promisify(fs.rename);
const copyFile = util.promisify(fs.copyFile);

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
const transformDir = async (base) => {    
    try {
        let files = await readdir(base);
        for (let item of files) {
            let currentPath = path.join(base, item);
            let stats = await stat(currentPath);
            if (stats.isDirectory()) {
                await transformDir(currentPath);
            } else {
                let newFileDir = path.join(outputDir, item[0].toUpperCase());
                if (!fs.existsSync(newFileDir)) {
                    fs.mkdirSync(newFileDir);
                }
                if (!DEBUG) {
                    await rename(path.join(currentPath), path.join(newFileDir, item));
                } else {                    
                    await copyFile(path.join(currentPath), path.join(newFileDir, item));
                }
            }
        }
    } catch (e) {
        // console.log('error', e.message);
        throw e;
    }
};

// запуск функции
transformDir(inputDir)
    .then(() => {
        console.log('Файлы успешно разобраны!');
        // удаляем входную директорию
        if (!DEBUG) {
            console.log('Чистим входную директорию...');
            removeDir(inputDir);
            console.log('Очистка завершена!');
        }
    })
    .catch((err) => {
        console.log('Произошла ошибка: ', err.message);
    });
