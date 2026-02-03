const { exec } = require('child_process');
const fs = require('fs');

console.log('Проверка сборки проекта...');

// Проверяем наличие package.json
if (!fs.existsSync('./package.json')) {
  console.error('Файл package.json не найден!');
  return;
}

// Выполняем сборку
exec('npm run build', (error, stdout, stderr) => {
  if (error) {
    console.error(`Ошибка при сборке: ${error.message}`);
    console.error(`stderr: ${stderr}`);
    return;
  }
  
  console.log(`stdout: ${stdout}`);
  
  // Проверяем наличие папки dist
  if (fs.existsSync('./dist')) {
    console.log('Папка dist успешно создана');
    
    const distContents = fs.readdirSync('./dist');
    console.log('Содержимое папки dist:', distContents);
  } else {
    console.log('Папка dist не создана');
  }
});