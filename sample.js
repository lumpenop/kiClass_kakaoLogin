let obj = { a: 10, b: 20, c: 30, d: 40};

let a = {a:a2, ...last} = obj;
console.log(a2, last);

let arr = [1,2,3];
let copy = arr;
let copy2 = [...arr];

arr[0] = 0;

console.log(copy);
console.log(copy2);


let 과일 = '사과';

switch(과일){
    case "바나나":
    case "참외":
        console.log('노랑');
        break;
    case "사과":
        console.log('빨강');
        break;
    default:
        console.log('디폴트');
}
