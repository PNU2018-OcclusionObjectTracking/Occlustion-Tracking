const { exec } = require('child_process');

const fs = require('fs');

const Jimp = require('jimp');



// node detect.js {data path} {weight path} {list path} {result path}

const CURRNET_PATH = process.argv[1];

const args = process.argv.slice(2);

const DATA_PATH = args[0];

const CFG_PATH = 'cfg_ours/obj.cfg';

const WEIGHT_PATH = args[1];

const LIST_PATH = args[2];

const RESULT_PATH = 'result.txt';

const CMD_DETECT = `./darknet detector test ${DATA_PATH} ${CFG_PATH} ${WEIGHT_PATH} -dont_show -ext_output < ${LIST_PATH} > ${RESULT_PATH}`;



async function sh(cmd) {

  console.log(CMD_DETECT);

  return new Promise(function (resolve, reject) {

    exec(cmd, (err, stdout, stderr) => {

      if (err) {

        reject(err);

      } else {

        resolve({ stdout, stderr });

      }

    });

  });

}



async function parse() {

  const result = fs.readFileSync(RESULT_PATH, 'utf-8');

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

    const txt = fs.readFileSync(name.replace('.jpg', '.txt'), 'utf-8').split('\n');



    txt.forEach(box => {

      if (box === '') {

        return;

      }

      const boxInfo = box.split(' ');

      const boxObj = {};

      boxObj.width = boxInfo[3] * width;

      boxObj.height = boxInfo[4] * height;

      boxObj.leftX = boxInfo[1] * width - boxObj.width / 2;

      boxObj.topY = boxInfo[2] * height - boxObj.height / 2;

      map[name].box.push(boxObj);

    });



    const detectList = info.split('people: ');

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



async function main() {

  console.log('이미지 디텍팅 시작', LIST_PATH);

  console.time('이미지 디텍팅');

  await sh(CMD_DETECT);

  console.timeEnd('이미지 디텍팅');



  console.time('데이터 파싱');

  const info = await parse();

  console.timeEnd('데이터 파싱');



  console.time('신뢰도 연산');

  const whole = Object.keys(info).length;

  const matched = [];

  const unmatched = [];



  Object.keys(info).forEach(key => {

    const item = info[key];

    const detected = item.person.filter(i => Number(i.accuracy) >= 50);

    const answer = item.box;



    if (detected.length !== answer.length) {

      unmatched.push({

        name: item.name,

        notSame: `찾은 개수: ${detected.length}, 실제 개수: ${answer.length}`,

      });

      return;

    }



    const ratio = [];

    let isMatched = true;

    let detectedMax = 0;



    for (let detectedIndex = 0; detectedIndex < detected.length; detectedIndex++) {

      for (let answerIndex = 0; answerIndex < answer.length; answerIndex++) {

        const result = getCovered(detected[detectedIndex], answer[answerIndex]);

        detectedMax = Math.max(Number(detectedMax), Number(result));

      }

      ratio.push(detectedMax);

      if (detectedMax < 50) {

        isMatched = false;

      }

    }



    if (isMatched) {

      matched.push({

        name: item.name,

        ratio,

      });

    } else {

      unmatched.push({

        name: item.name,

        ratio,

      });

    }

  });



  const accuracy = matched.length / whole * 100; // 전체 중 사람을 정확하게 찾아낸 비율

  let boxNum = 0;

  const reliability = matched.reduce((prev, current) => {

    return prev + current.ratio.reduce((preValue, value) => {

      boxNum += 1;

      return preValue + value;

    }, 0);

  }, 0) / boxNum; // 정확히 찾아 낸 비율 중 바운딩박스가 겹치는 너비 평균



  console.timeEnd('신뢰도 연산');



  console.time('결과 출력');

  let resultText = '';

  console.log(`정확도: ${accuracy}% (전체 중 사람을 정확하게 찾아낸 비율)`);

  console.log(`신뢰도: ${reliability}% (정확히 찾아 낸 비율 중 바운딩박스가 겹치는 너비 평균)`);

  resultText += `정확도: ${accuracy}% (전체 중 사람을 정확하게 찾아낸 비율)\n`;

  resultText += `신뢰도: ${reliability}% (정확히 찾아 낸 비율 중 바운딩박스가 겹치는 너비 평균)\n\n`;



  resultText += JSON.stringify(matched);

  resultText += '\n\n';



  resultText += JSON.stringify(unmatched);



  fs.writeFileSync(args[3], resultText);

  console.timeEnd('결과 출력');

  console.log(args[3], ' 생성 완료');

}



main();

