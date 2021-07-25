//0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233
function calc(num) {
    const cache = {}
    if (cache[num]) return cache[num]
    if (num < 2) {
        cache[num] = num
        return num
    } else {
        cache[num] = calc(num - 1) + calc(num - 2)
    }
    return cache[num]
}

let nums = [2, 7, 11, 15], target = 17;
// 因为 nums[0] + nums[1] = 2 + 15 = 17
// 所以返回 [0, 1]


function findTwoSum(nums, target) {
    const temp = {}
    let output = []
    nums.some((num, index) => {
        const diff = target - num //17 - 2 = 15    {2:0,7:1,11:2}
        if (temp[diff] !== undefined) {
            output = [temp[diff], index]
            return true
        }
        temp[num] = index
        return false
    })
    return output
}
findTwoSum(nums,target)

// output 结果举例，数组顺序不做要求
[
    [
        [1, 1],
        [2, 1]
    ],
    [
        [3, 2]
    ],
]

// input 数组内顺序不做保证
let input = [
    [1, 1],
    [2, 1],
    [2, 2],
    [2, 4],
    [2, 5],
    [3, 1],
    [3, 4],
    [4, 4],
    [4, 5],
    [4, 6],
    [4, 7],
    [5, 3],
    [6, 3],
    [6, 4],
    [6, 5],
    [3, 2]
]

function polymerize(input) {

    const temp = {}
    const cacheKey = {}
    input.forEach((item, index) => {
        const x = item[0]
        const y = item[1]
        const key = `${x}-${y}` //2-5
        const left_key = `${x}-${y - 1}` //1,5
        const top_key = `${x - 1}-${y}` // 2-4
        const targetKey = cacheKey[left_key] || cacheKey[top_key]
        const val = temp[left_key] || temp[top_key] || temp[targetKey]
        if (val) {
            const foundKey = val[0].join('-')
            temp[foundKey].push(item)
            cacheKey[key] = foundKey
        } else {
            temp[key] = [item]
        }
    })
    console.log('cacheKey', cacheKey)
    return Object.values(temp)
}

let res = polymerize(input)

JSON.stringify(res)
// 12,3 , [[9,1,2]
let numsA = [1,2,3,4,5,6,7,8,9]
function calcNums(nums,sum,len) {
	const temp = {} // {9:1 , 8:2 ,7 : 3, 6:4 }
	const arr = []
	nums.forEach(item=>{
		const diff = sum - item 
		if(temp[item]) {
			arr.push([temp[item],item]) 
		}else {
			temp[diff] = item 
		}
	})
	console.log('temp',temp)
	return arr
}

calcNums(numsA,10,2)



//写一个函数，有三个参数，nums , sum和n，求出由k个数之和等于sum的所有组合，不能重复
//比如 sum = 9 , n = 2的情况下 得到 [[1,8],[2,7],[3,6],[4,5]]
// sum = 10 , n = 3 的情况下 得到 [[1,2,7],[2,3,5],[1,4,5],[1,3,6]]
// nums 固定为 1-9
nums = [1, 2, 3, 4, 5, 6, 7, 8, 9]
function calcNums(nums, sum, index = 0, arrLength) {
	const temp = {} // {9:2}
	let arr = []
	while (nums.length) {
		const currentNum = nums.shift() // 1 , 2 ,3,4,5
		const diff = sum - currentNum // 12 - 1 = 11 , 11 - 2 = 9
		console.log(`层级${index}`, nums, temp, arr, currentNum, diff)
		if (temp[currentNum]) {
			arr.push([currentNum, temp[currentNum]])
			delete temp[currentNum]
		}
		/* 	if (diff > 9) {
				const res = calcNums(nums, diff, index + 1)
				arr = arr.concat(res)
			}  */
		else {
			temp[diff] = currentNum
		}
	}

	for (let num in temp) {
		const nextArr = calcNums(nums, num, index + 1)
		if (nextArr.length) {
			arr.push([temp[num]].concat(nextArr)) // 11,9 => [[9,3,8],[9,4,7],[9,5,6]]
		}
	}
	return arr
}
calcNums(nums, 20)




 const  res = [
 {
	name: '文本6',
	id: 6,
	parent: 2,
 },
  {
	name: '文本2',
	id: 2,
	parent: 1,
  },
  {
  	name: '文本1',
  	parent: null,
  	id: 1,
  },
  {
	name: '文本3',
	parent: 2,
	id: 3,
  },
  {
  	name: '文本4',
  	parent: 3,
  	id: 4,
  },
  {
  	name: '文本5',
  	parent: 1,
  	id: 5,
  },
]; 


function arrToObj(arr) {
  
  const temp = {}
  const result = {}
  
  arr.forEach((item,index)=>{
	const id = item.id
	const parent = item.parent
	if(parent === null) {
		//没有上级
		let children = []
		if(temp[id]) {
			children = temp[id].children
			// const child = children[0]
			children.forEach((item,index)=>{
				if(temp[item.id]) {
					children[index] = temp[id]
				}else {
					temp[item.id] = item
				}
			})
		}
		result[id] = {
			name: item.name,
			id,
			children
		}
	}else {
		const parentNode = result[parent] || temp[parent]
		const child = {
		  name: item.name,
		  id
		}
		if(parentNode) {
			
			temp[id] = child
			if(parentNode.children) {
				parentNode.children.push(child)	
			}else {
				parentNode.children = [child]
			}
		}else {
			temp[parent] = {
				name: '',
				id:parent,
				children : [child]
			}
		}
	}
  })

  return Object.values(result)
}
arrToObj(res)