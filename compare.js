const fs = require('fs');
const Jimp = require('jimp');
const args = process.argv.slice(2);

const prevData = args[0];
const occludeData = args[1];

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
    // const txt = fs.readFileSync(name.replace('.jpg', '.txt'), 'utf-8').split('\n');
    //
    // txt.forEach(box => {
    //   if (box === '') {
    //     return;
    //   }
    //   const boxInfo = box.split(' ');
    //   const boxObj = {};
    //   boxObj.width = boxInfo[3] * width;
    //   boxObj.height = boxInfo[4] * height;
    //   boxObj.leftX = boxInfo[1] * width - boxObj.width / 2;
    //   boxObj.topY = boxInfo[2] * height - boxObj.height / 2;
    //   map[name].box.push(boxObj);
    // });

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

function getCovered(box1, box2) {
  const Rect = [];
  let left = 0, right = 1;
  Rect[0] = [box1.leftX, box1.topY, box1.width, box1.height];
  Rect[1] = [box2.leftX, box2.topY, box2.width, box2.height];

  if (box1.leftX > box2.leftX) {   // x끼리의 비교로 왼쪽에 위치한 배열을 찾는 과정
    left = 1;
    right = 0;
  }



  const left_area = Rect[left][2] * Rect[left][3];
  const right_area = Rect[right][2] * Rect[right][3];
  let dup_area = 0, min_x, min_y;



  if (Rect[left][0] <= Rect[right][0] && Rect[right][0] < Rect[left][0] + Rect[left][2]) { // right의 제일 왼쪽 위쪽 x의 좌표가 left의 범위 안에 있는지 확인
    min_x = Rect[left][0] + Rect[left][2];
    if (Rect[right][0] + Rect[right][2] < min_x)
      min_x = Rect[right][0] + Rect[right][2];

    if (Rect[left][1] - Rect[left][3] < Rect[right][1] && Rect[right][1] <= Rect[left][1]) { // right가 left의 사각형의 밑에 존재할 때 right의 제일 왼쪽 위쪽 y의 좌표가 범위안에 있는지 확인
      min_y = Rect[left][1] - Rect[left][3];
      if (min_y < Rect[right][1] - Rect[right][3])
        min_y = Rect[right][1] - Rect[right][3];
      dup_area = (min_x - Rect[right][0])*(Rect[right][1]-min_y);
    }



    else if (Rect[left][1]-Rect[left][3] <= Rect[right][1] - Rect[right][3] && Rect[right][1] - Rect[right][3] < Rect[left][1]) { // right가 left 사각형 위쪽에 있을 때, right의 왼쪽 밑 y좌표가 left 범위안에 있는지 확인
      dup_area = (min_x - Rect[right][0]) * (Rect[left][1]-(Rect[right][1] - Rect[right][3]));
    }

    else if (Rect[right][1] > Rect[left][1] && Rect[right][1] - Rect[right][3] < Rect[left][1] - Rect[left][3]) {
      dup_area = (min_x - Rect[right][0]) * Rect[left][3];
    }

  }

  return Math.min(dup_area / left_area, dup_area / right_area) * 100;
}

async function draw(data) {
  const image = await Jimp.read(data.name);
  const boxImage = await Jimp.read('./box.png');


  data.person.forEach(box => {
    boxImage.resize(box.width, box.height);
    image.blit(boxImage, box.leftX, box.topY);
  });

  image.write(`output/${data.name}`);
}

async function main() {
  const prevObj = await parse(prevData);
  const occludedObj = await parse(occludeData);
  console.log(prevObj, occludedObj);

  Object.keys(prevObj).forEach((image, index) => {
    const prevImage = prevObj[image];
    const occludedImage = occludedObj[image];

    const result = Object.assign({}, prevObj[image]);

    occludedImage.person.forEach((occluded) => {
      let check = false;
      prevImage.person.forEach((prev) => {
        const covered = getCovered(prev, occluded);

        if (covered > 50) {
          check = true;
        }
      });

      if (!check) {
        result.person.push(occluded);
      }
    })

    console.log(`${index}번째 저장`);
    draw(result);
  })
}

main();
