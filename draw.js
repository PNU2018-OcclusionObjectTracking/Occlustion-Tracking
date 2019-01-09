const fs = require('fs');

const Jimp = require('jimp');



// node draw.js {stick path} {name}

const args = process.argv.slice(2);

const PATH = args[2] || './data/coco/images/occluded';

const STICK_PATH = args[0];

const NAME = args[1]

const OUTPUT_PATH = `./data/coco/images/${NAME}-10000`;

const imageList = fs.readdirSync(PATH);



const imageFiles = imageList.filter((name) => name.includes('.jpg'));



function getMaxSizeBox(lines, imageSize) {

  const { height, width } = imageSize;

  let boxCenterX = 0;

  let boxCenterY = 0;

  let boxWidth = 0;

  let boxHeight = 0;



  let boxLeftX = 0;

  let boxRightX = 0;

  let boxTopY = 0;

  let boxBottomY = 0;



  let maxSize = 0;

  let maxLine = '';





  lines.forEach((line) => {

    const position = line.split(' ');

    const currentWidth = width * position[3];

    const currentHeight = height * position[4];



    if (maxSize < currentWidth * currentHeight) {

      maxSize = currentWidth * currentHeight;

      maxLine = line;

      boxCenterX = width * position[1];

      boxCenterY = height * position[2];

      boxWidth = width * position[3];

      boxHeight = height * position[4];



      boxLeftX = boxCenterX - (boxWidth / 2);

      boxRightX = boxCenterX + (boxWidth / 2);

      boxTopY = boxCenterY - (boxHeight / 2);

      boxBottomY = boxCenterY + (boxHeight / 2);

    }

  });



  return {

    boxCenterX,

    boxCenterY,

    boxLeftX,

    boxRightX,

    boxTopY,

    boxBottomY,

    maxLine,

  };

}



async function main () {



  let num = 1;

  for (let index = 0; index <await imageFiles.length; index++) {

    const covered = await Jimp.read(STICK_PATH);

    const imageNames = imageFiles[index];

    const name = imageNames.split('.')[0];

    const origin = await Jimp.read(`${PATH}/${name}.jpg`)

    await (() => {

      console.log(`${num++}번째 작업요청 ${imageFiles.length}개 중 ${index + 1}번째 이미지`);



      const text = fs.readFileSync(`${PATH}/${name}.txt`, 'utf8');

      const lines = text.split('\n');

      if (lines[lines.length - 1] === '') {

        lines.pop();

      }

      let image = origin.clone();





      const imageSize = {

        width: image.getWidth(),

        height: image.getHeight(),

      };

      const boxPosition = getMaxSizeBox(lines, imageSize);

      const boxSize = {

        width: boxPosition.boxRightX - boxPosition.boxLeftX,

        height: boxPosition.boxBottomY - boxPosition.boxTopY,

      };

      const coveredRatio = covered.getWidth() / covered.getHeight();

      const stickSize = {

        height: boxSize.height,

        width: boxSize.height * coveredRatio,

      };

      const stickPosition = {

        boxLeftX: boxPosition.boxCenterX - (stickSize.width / 2),

        boxRightX: boxPosition.boxCenterX + (stickSize.width / 2),

        boxTopY: boxPosition.boxTopY,

        boxBottomY: boxPosition.boxBottomY,

      };





      covered.resize(stickSize.width, stickSize.height);



      image.blit(covered, stickPosition.boxLeftX, stickPosition.boxTopY);



      // const leftBox = [0, 0, 0, 0, 0];

      // const rightBox = [0, 0, 0, 0, 0];

      //

      // leftBox[1] = (boxPosition.boxLeftX + stickPosition.boxLeftX) / 2 / imageSize.width;

      // rightBox[1] = (boxPosition.boxRightX + stickPosition.boxRightX) / 2 / imageSize.width;

      // leftBox[2] = (boxPosition.boxTopY + boxPosition.boxBottomY) / 2 / imageSize.height;

      // rightBox[2] = (boxPosition.boxTopY + boxPosition.boxBottomY) / 2 / imageSize.height;

      // leftBox[3] = (stickPosition.boxLeftX - boxPosition.boxLeftX) / imageSize.width;

      // rightBox[3] = (boxPosition.boxRightX - stickPosition.boxRightX) / imageSize.width;

      // leftBox[4] =  boxSize.height / imageSize.height;

      // rightBox[4] =  boxSize.height / imageSize.height;



      // const str = `${leftBox.join(' ')}\n${rightBox.join(' ')}`;

      image.write(`${OUTPUT_PATH}/${name}.jpg`);

      fs.writeFileSync(`${OUTPUT_PATH}/${name}.txt`, boxPosition.maxLine);

    })()

  }

}



main();


