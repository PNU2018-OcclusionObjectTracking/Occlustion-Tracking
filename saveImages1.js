const fs = require('fs');
const Jimp = require('jimp');
const args = process.argv.slice(2);

const data = args[0];

async function parse(path) {
  const result = fs.readFileSync(path, 'utf-8');
  const imageList = result.split('Enter Image Path: ');
  const map = {};

  for (let index = 1; index < imageList.length; index++) {
    const info = imageList[index];
    if (info === '') {
      continue;
    }

    const name = info.split(':')[0];
    map[name] = { name, person: [], box: [] };
    const image = await Jimp.read(name);
    const width = image.getWidth();
    const height = image.getHeight();
    map[name].width = width;
    map[name].height = height;

    const detectList = info.split('person: ');
    for (let detectIndex = 1; detectIndex <await detectList.length; detectIndex++) {
      const obj = {};
      obj.accuracy = parseInt(detectList[detectIndex].split('%')[0]);
      obj.leftX = parseInt(detectList[detectIndex].split('left_x:')[1]);
      obj.topY = parseInt(detectList[detectIndex].split('top_y:')[1]);
      obj.width = parseInt(detectList[detectIndex].split('width:')[1]);
      obj.height = parseInt(detectList[detectIndex].split('height:')[1]);
      map[name] = { ...map[name], person: map[name].person.concat(obj) };
    }
  }

  return map;
}

async function draw(data) {
  const image = await Jimp.read(data.name);
  const boxImage = await Jimp.read('./box.png');


  data.person.forEach(box => {
    boxImage.resize(box.width, box.height);
    image.blit(boxImage, box.leftX, box.topY);
  });

  image.write(`pretrain_output/${data.name}`);
}

async function main() {
  const obj = await parse(data);

  Object.keys(obj).forEach((image, index) => {
    console.log(`${index} 번째 이미지`);
    const imageObj = obj[image];

    draw(imageObj);
  })
}

main();
