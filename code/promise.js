// 先定义三个常量表示状态
const PENDING = 'pending'
const FULFILLED = 'fulfilled'
const REJECTED = 'rejected'

// 新建 MyPromise 类
class MyPromise {
  constructor(executor) {
    // executor 是一个执行器，进入会立即执行
    // 并传入resolve和reject方法
    debugger
    executor(this.resolve, this.reject)
  }

  // 储存状态的变量，初始值是 pending
  status = PENDING

  // resolve和reject为什么要用箭头函数？
  // 如果直接调用的话，普通函数this指向的是window或者undefined
  // 用箭头函数就可以让this指向当前实例对象
  // 成功之后的值
  value = null
  // 失败之后的原因
  reason = null

  // 更改成功后的状态
  resolve = (value) => {
    debugger
    // 只有状态是等待，才执行状态修改
    if (this.status === PENDING) {
      // 状态修改为成功
      this.status = FULFILLED
      // 保存成功之后的值
      this.value = value
    }
  }

  // 更改失败后的状态
  reject = (reason) => {
    debugger
    // 只有状态是等待，才执行状态修改
    if (this.status === PENDING) {
      // 状态成功为失败
      this.status = REJECTED
      // 保存失败后的原因
      this.reason = reason
    }
  }

  then(onFulfilled, onRejected) {
    debugger
    // 判断状态
    if (this.status === FULFILLED) {
      // 调用成功回调，并且把值返回
      onFulfilled(this.value)
    } else if (this.status === REJECTED) {
      // 调用失败回调，并且把原因返回
      onRejected(this.reason)
    }else if(this.status === PENDING) {
      // ==== 新增 ====
    // 因为不知道后面状态的变化情况，所以将成功回调和失败回调存储起来
    // 等到执行成功失败函数的时候再传递
    this.onFulfilledCallback = onFulfilled;
    this.onRejectedCallback = onRejected;

    }
  }
}

const promise = new MyPromise((resolve, reject) => {
  debugger
  setTimeout(() => {
    debugger
    resolve('success')
  }, 2000)
})

promise.then(
  (value) => {
    console.log('resolve', value)
  },
  (reason) => {
    console.log('reject', reason)
  },
)

//1,2,3,4,8,5,11,6,9,12,7,10,13,14,16,17,18
//1,2,3,4,8,5,9,11,6,10,12,7,13,14,16,17,18
new Promise((resolve, reject) => {
  debugger
  console.log('1')
  setTimeout(() => {
    debugger
    console.log('13')
    new Promise((resolve, reject) => {
      debugger
      console.log('14')
      resolve()
    }).then(() => {
      debugger
      console.log('15')
    })
  })
  resolve()
})
  .then(() => {
    debugger
    console.log('2')
    new Promise((resolve, reject) => {
      debugger
      console.log('3')
      resolve()
    })
      .then(() => {
        debugger
        console.log('4')
      })
      .then(() => {
        debugger
        console.log('5')
      })
      .then(() => {
        debugger
        console.log('6')
      })
      .then(() => {
        debugger
        console.log('7')
      })
  })
  .then(() => {
    debugger
    console.log('8')
    Promise.resolve()
      .then(() => {
        debugger
        console.log(9)
      })
      .then(() => {
        debugger
        console.log(10)
      })
  })
  .then(() => {
    debugger
    console.log('11')
  })
  .then(() => {
    debugger
    console.log('12')
  })

setTimeout(() => {
  debugger
  console.log('16')
  new Promise((resolve, reject) => {
    debugger
    console.log('17')
    resolve()
  }).then(() => {
    debugger
    console.log('18')
  })
})
Promise.resolve()
  .then(() => {
    console.log(19)
    return Promise.resolve(20)
  })
  .then((res) => {
    console.log(res)
  })
