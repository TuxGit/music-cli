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

// функция чтения каталога
// let filesLength = 0;
// var error = null;
const transformDir = (base, done) => {
    // try {
    fs.readdir(base, (err, files) => {
        if (err) {
            return done(err);
        }
        
        let filesLength = files.length;
        if (filesLength < 1) {
            return done(null, true);
        }

        for (let item of files) {
            let currentPath = path.join(base, item);
            fs.stat(currentPath, (err, stats) => {
                if (err) {
                    return done(err);
                }

                if (stats.isDirectory()) {
                    transformDir(currentPath, (err) => {
                        if (err) {
                            done(err);
                        } else if (--filesLength < 1) {
                            done(null, true);
                        }
                    });
                } else {
                    let newFileDir = path.join(outputDir, item[0].toUpperCase());
                    if (!fs.existsSync(newFileDir)) {
                        fs.mkdirSync(newFileDir);
                    }
                    fs.copyFile(path.join(currentPath), path.join(newFileDir, item), (err) => {
                        if (err) {
                            // throw err;
                            done(err);
                            // return;  // так из цикла не выйти
                        } else if (--filesLength < 1) {
                            done(null, true);
                        }
                    });                    
                }
            });            
        }
    });
    // } catch (e) {
    //     return e.message;
    // }
};

// запуск функции
transformDir(inputDir, (err, success) => {
    if (err) {
        console.log('Произошла ошибка в ходе работы программы: ', err.message);
    } else if (success) {
        console.log('Файлы успешно разобраны!');
        // удаляем входную директорию
        if (!DEBUG) {
            console.log('Чистим входную директорию...');
            removeDir(inputDir);
            console.log('Очистка завершена!');
        }
    } else {
        console.log('Непредвиденное поведение программы!');
    }
});
