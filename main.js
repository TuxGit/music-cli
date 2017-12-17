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
const removeDir = (dir, done) => {
    if (fs.existsSync(dir)) {
        fs.readdir(dir, (err, files) => {
            if (err) {
                return done(err);
            }

            let count = files.length;
            if (count < 1) {
                return done(null, true);
            }

            for (let item of files) {
                let currentPath = path.join(dir, item);
                fs.stat(currentPath, (err, stats) => {
                    if (err) {
                        return done(err);
                    }
    
                    if (stats.isDirectory()) {
                        removeDir(currentPath, (err) => {
                            if (err) {
                                done(err);
                            }
                            fs.rmdirSync(currentPath);
                            if (--count < 1) {
                                done(null, true);
                            }
                        });
                    } else {
                        fs.unlink(currentPath, (err) => {
                            if (err) {
                                done(err);
                            }
                            if (--count < 1) {
                                done(null, true);
                            }
                        });
                    }
                });
            }
        });
    }
};

// основная функция чтения и разбора каталога
const transformDir = (base, done) => {
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
                    if (!DEBUG) {
                        fs.rename(currentPath, path.join(newFileDir, item), (err) => {
                            if (err) {
                                done(err);
                            } else if (--filesLength < 1) {
                                done(null, true);
                            }
                        });
                    } else {
                        fs.copyFile(currentPath, path.join(newFileDir, item), (err) => {
                            if (err) {
                                done(err);
                            } else if (--filesLength < 1) {
                                done(null, true);
                            }
                        });
                    }
                }
            });
        }
    });
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
            removeDir(inputDir, (err, success) => {
                if (err) {
                    console.log('Произошла ошибка при удалении директории: ', err.message);
                } else if (success) {
                    fs.rmdirSync(inputDir);
                    console.log('Очистка завершена!');
                }
            });
        }
    } else {
        console.log('Непредвиденное поведение программы!');
    }
});
