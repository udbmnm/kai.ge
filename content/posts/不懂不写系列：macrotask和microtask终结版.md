---
title: "不懂不写系列：EventLoop事件循环macrotask和microtask终结篇"
date: 2019-08-22T20:19:23+08:00
draft: true
---

经常看到下面这样的一个例子：

```
console.log('script start');

setTimeout(function() {
  console.log('setTimeout');
}, 0);

Promise.resolve().then(function() {
  console.log('promise1');
}).then(function() {
  console.log('promise2');
});

console.log('script end');
```

如果你不能立马得出答案，或则模棱两可的猜测执行过程，那你肯定没有理解清楚JS的事件循环机制，也就是常常听到的Event Loop。其实理解清楚原理后，像上面这些看起来变态的问题就小菜一碟了，并且是弄懂一次就永不出错。

## 下面开始macrotask和microtask终结篇
---
先看下面一张图，多看几秒钟先自己想象下执行过程...

![event-loop.jpg](https://cdn.steemitimages.com/DQmUyZ7SruH55V1TunUpaCLXqG4iYaat7WEoSdBpoLUYa5o/event-loop.jpg)

几秒钟过后...... 


好了，可以直观的看出图中包含三个主要的概念：

`Event Loop`，`macrotask`，`microtask`

因为事关JavaScript的执行过程，所以还会牵扯出一些其它的基础概念：

* JavaScript是单线程的，浏览器并不是单线程的
* 函数调用栈/执行栈
* Stack栈是一种先进后出（FILO）的数据结构
* Queue队列是一种先进先出（LILO）的数据结构
* Synchronous是JavaScript中的同步任务
* Asynchronous是JavaScript中的异步任务

概念很多，一个个击破...
# 浏览器不是单线程的
浏览器是是多进程的，每个进程包含多个线程，比如GUI渲染线程，JS引擎线程，定时器线程，HTTP异步请求线程等。说JavaScript是单线程的一般是指js内核引擎，比如v8引擎。
# Stack（栈）和 Queue（队列）
Stack和Queue都是两种基本的数据结构，而常用的数据结构有八种，还有六种数据结构分别是：数组（Array）、散列表（Hash）、树（Tree）、链表（Linked List）、堆（Heap）、图（Graph）。
## Stack
Stack是一种FILO（First In, First Out）的数据结构，也就是`先进后出`。eg：就像羽毛球筒一样，最先放进去最后才能拿出来
## Queue
队列是一种 FIFO (First In, First Out) 的数据结构，它的特点就是`先进先出`。eg：去食堂排队吃饭，去的早的排前面的先吃
# Call Stack(函数调用栈)
调用栈，也叫执行栈，既然是栈，也是`先进后出`的，调用栈用于存储在代码执行期间创建的所有`执行上下文`。首次运行JS代码时，会创建一个全局执行上下文并Push到当前的执行栈中。每当发生函数调用，引擎都会为该函数创建一个新的函数执行上下文并Push到当前执行栈的栈顶。当栈顶函数运行完成后，其对应的函数执行上下文将会从执行栈中Pop出，上下文控制权将移到当前执行栈的下一个执行上下文。（关于执行上下文后面单独拎出来再写）


看下面一个例子：

```
function bar() {
	console.log('bar');
}
function foo() {
	console.log('foo');
	bar();
}
foo();
```
先用文字描述下调用栈执行的过程：

1. 调用foo，`foo`入栈，目前栈里面有 [foo]
2. `console.log('foo')`入栈，目前栈里面有 [console.log('foo'),foo]
3. 执行`console.log('foo')`并出栈，目前栈里面有 [foo]
4. 调用bar，`bar`入栈，目前栈里面有 [bar,foo]
5. 执行bar，`console.log('bar')`入栈，目前栈里面有 [console.log('bar'),bar,foo]
6. 执行`console.log('bar')`并出栈，目前栈里面有 [bar,foo]
5. bar执行完毕被弹出，目前栈里面有 [foo]
6. foo执行完毕被弹出，目前栈为空 []

下面是copy过来的图：
![](https://cdn.steemitimages.com/DQmStyEA5rYjaWeGLRbpxuMAs6uY21nLS2n4xwbb2fEsKAY/image.png)


# [事件循环：](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/EventLoop#%E4%BA%8B%E4%BB%B6%E5%BE%AA%E7%8E%AF)

JavaScript引擎遇到一个异步事件后并不会一直等待其返回结果，而是会将这个事件挂起，继续执行执行栈中的其他任务。当一个异步事件返回结果后，js会将这个事件加入与当前执行栈不同的另一个队列，我们称之为事件队列。被放入事件队列不会立刻执行其回调，而是等待当前执行栈中的所有任务都执行完毕， 主线程处于闲置状态时，主线程会去查找事件队列是否有任务。如果有，那么主线程会从中取出排在第一位的事件，并把这个事件对应的回调放入执行栈中，然后执行其中的同步代码...，如此反复，这样就形成了一个无限的循环。这就是这个过程被称为“事件循环（Event Loop）”的原因。

`也就是说JavaScript引擎通过事件循环来处理异步任务，遇到异步任务并不会直接放到主线程的执行栈来执行，而是交给其它线程来处理，比如HTTP异步请求线程,定时器线程`
`事件循环只能算JS实现异步的一种方式，其它编程语言还有很多不同的实现方式`  

>  之所以称之为事件循环，是因为它经常按照类似如下的方式来被实现：
 ```
  while (queue.waitForMessage()) {
    queue.processNextMessage();
  }
  
```

看到没！死循环！浏览器就是这么傻傻的，有任务就干，没事就一直等，就像在守株待兔。。。

![](https://cdn.steemitimages.com/DQmZi7BW4ughjDezLyNmLEEXDXybUG63Fc2vcN9gw4ThHqs/image.png)


>To coordinate events, user interaction, scripts, rendering, networking, and so forth, user  [agents](https://tc39.es/ecma262/#sec-agents) must use event loops as described in this section. Each agent has an associated event loop.
>为了协调事件，用户交互，脚本，渲染，网络等，用户代理必须使用本节所述的event loop.每个代理都有一个关联的事件循环。
>An event loop has one or more task queues. A task queue is a set of tasks.
>一个事件循环具有一个或多个任务队列。任务队列是一组任务。
>Per its source field, each task is defined as coming from a specific task source. For each event loop, every task source must be associated with a specific task queue.
>每个 任务 都定义为来自特定的 任务源。 来自特定 任务源 和指向特定的 事件循环 的的所有任务（例如，由一个 Document 的定时器生成的回调、Document 上鼠标移动触发的事件、 为 Document 的解析器入队的任务）必须总是被添加到同一个 任务队列， 但来自不同 任务源 的 任务 可以放在不同的 任务队列 中。

# Task分类：

>所有任务可以分成两种，一种是同步任务（synchronous），另一种是异步任务（asynchronous）。同步任务指的是，在`主线程`上排队执行的任务，只有前一个任务执行完毕，才能执行后一个任务；异步任务指的是，不进入主线程、而进入`"任务队列"`（task queue）的任务，只有"任务队列"通知主线程，某个异步任务可以执行了，该任务才会进入主线程执行。

⚠️ 异步任务被分为两类：微任务（micro task）和宏任务（macro task）

⚠️ 异步任务被分为两类：微任务（micro task）和宏任务（macro task）

⚠️ 异步任务被分为两类：微任务（micro task）和宏任务（macro task）

⚠️ Node环境和ES6之后才出现微任务的概念

# [任务源 Generic task sources](https://html.spec.whatwg.org/multipage/webappapis.html#generic-task-sources)

>* **DOM操作任务源：**
>此任务源被用来相应dom操作，例如一个元素以非阻塞的方式插入文档。

>* **用户交互任务源：**
>此任务源用于对用户交互作出反应，例如键盘或鼠标输入。响应用户操作的事件（例如click）必须使用task队列。

>* **网络任务源：**
>网络任务源被用来响应网络活动。

>* **history traversal任务源：**
>当调用history.back()等类似的api时，将任务插进task队列。
>根据其源字段，每个任务被定义为来自特定任务源。对于每个事件循环，每个任务源都必须与特定任务队列相关联。

task任务源种类非常多，比如ajax的onload，click事件，基本上我们经常绑定的各种dom事件都是task任务源，还有数据库操作（IndexedDB ），需要注意的是setTimeout、setInterval、setImmediate也是task任务源。总结来说task任务源：

* setTimeout
* setInterval
* setImmediate
* I/O
* UI rendering

# macrotask
包含执行整体的js代码，事件回调，XHR回调，定时器（setTimeout/setInterval/setImmediate），IO操作，UI render

# microtask
更新应用程序状态的任务，包括promise回调，MutationObserver，process.nextTick，Object.observe

![browser-deom1-excute-animate.gif](https://cdn.steemitimages.com/DQmWmZxQbUkx4w5u7jiydS5yGCxpYmf79Aj4JMcghnu7nHN/browser-deom1-excute-animate.gif)



```
	console.log('script start');

	setTimeout(function() {
	  console.log('setTimeout');
	  Promise.resolve().then(function() {
		console.log('promise3');
	  }).then(function() {
		console.log('promise4');
	  });
	}, 0);
	setTimeout(function() {
	  Promise.resolve().then(function() {
		console.log('promise5');
	  }).then(function() {
		console.log('promise6');
	  });
	}, 0);
	Promise.resolve().then(function() {
	  console.log('promise1');
	}).then(function() {
	  console.log('promise2');
	});

	console.log('script end');
```

用JS来实现

```
class JsEngine {
    ...
    // 与event-loop中的初始化对应
    constructor(tasks) {
        this.jsStack = tasks;
        this.runScript(this.runScriptHandler);
    }
    runScript(task) {
    	this.macroTaskQueue.push(task);
    }
	runScriptHandler = () => {
        let curTask = this.jsStack.shift();
        while (curTask) {
          	this.runTask(curTask);
          	curTask = this.jsStack.shift();
        }
    }
    runMacroTask() {
        const { microTaskQueue, macroTaskQueue } = this;
		// 根据上述规律，定义macroTaskQueue与microTaskQueue执行的先后顺序
        macroTaskQueue.forEach(macrotask => {
        	macrotask();
          	if (microTaskQueue.length) {
            	let curMicroTask = microTaskQueue.pop();
            	while (curMicroTask) {
              		this.runTask(microTaskQueue);
             		curMicroTask = microTaskQueue.pop();
            	}
        	}
        });
    }
	// 运行task
    runTask(task) {
    	new Function(task)();
    }
}

```

# 最后来个小菜🍖

```
console.log('Start')

setTimeout(() => console.log('Timeout 1'), 0)
setTimeout(() => console.log('Timeout 2'), 0)

Promise.resolve().then(() => {
  for(let i=0; i<100000; i++) {}
  console.log('Promise 1')
})
Promise.resolve().then(() => console.log('Promise 2'))

console.log('End');



```

# 最最后的变态甜点🍮

```
let button = document.querySelector('#button');

button.addEventListener('click', function CB1() {
  console.log('Listener 1');

  setTimeout(() => console.log('Timeout 1'))

  Promise.resolve().then(() => console.log('Promise 1'))
});

button.addEventListener('click', function CB1() {
  console.log('Listener 2');

  setTimeout(() => console.log('Timeout 2'))

  Promise.resolve().then(() => console.log('Promise 2'))
});

```

如果这个两个问题你都能人肉parse在脑中run出正确结果，那说明你真的懂了。否则，再重新多看几遍，下面的参考资料值得都看一遍。

不懂不写，就酱。




# 需要研究的内容太多，未完待续。。。
# 未完待续，坚持不懂不写。。



参考资料：

---
* [WHATWG官方event-loop规范](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop)
* [ECMA262中Agent的定义](https://tc39.es/ecma262/#sec-agents)
* [JavaScript：核心 - 第二版<翻译>](http://www.xiaojichao.com/post/jscorev2.html#toc-fc9/)
* [浏览器进程？线程？傻傻分不清楚！](https://imweb.io/topic/58e3bfa845e5c13468f567d5)
* [tasks-microtasks-queues-and-schedules](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/)
* [任务、微任务、队列和时间表<翻译>](https://www.zcfy.cc/article/tasks-microtasks-queues-and-schedules)
* [从event loop规范探究javaScript异步及浏览器更新渲染时机](https://github.com/aooy/blog/issues/5)
* [浅析 JS 事件循环之 Microtask 和 Macrotask](https://savokiss.com/tech/learning-microtask-and-macrotask.html)
* [浅析 JS 中的 EventLoop 事件循环（新手向）](https://savokiss.com/tech/event-loop.html)
* [JS:macrotask和microtask](http://www.kenote.me/notes/notedetail.html?fileId=388)
* [这一次，彻底弄懂 JavaScript 执行机制](https://juejin.im/post/59e85eebf265da430d571f89)
* [深入理解js事件循环机制（浏览器篇）](http://lynnelv.github.io/js-event-loop-browser)
* [JavaScript 运行机制详解：再谈Event Loop](http://www.ruanyifeng.com/blog/2014/10/event-loop.html)
* [event-loop规范翻译](https://whatwg-cn.github.io/html/multipage/webappapis.html#%E4%BA%8B%E4%BB%B6%E5%BE%AA%E7%8E%AF)
* [关于JavaScript单线程的一些事](https://github.com/JChehe/blog/blob/master/posts/%E5%85%B3%E4%BA%8EJavaScript%E5%8D%95%E7%BA%BF%E7%A8%8B%E7%9A%84%E4%B8%80%E4%BA%9B%E4%BA%8B.md)
* [深入浏览器的事件循环 (GDD@2018)](https://zhuanlan.zhihu.com/p/45111890)