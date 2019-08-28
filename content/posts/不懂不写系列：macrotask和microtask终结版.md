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

如果你不能立马得出答案，或则模棱两可的猜测执行过程，那你肯定没有理解清楚JS的事件循环机制，也就是常常听到的Event Loop。其实理解清楚原理后，像上面这些看起来变态的问题就小菜一碟了，并且是弄懂一次就永不出错，

## 下面开始macrotask和microtask终结篇
---
先看下面一张图，多看几秒钟先自己猜测下，你想到了什么......

![event-loop.jpg](https://cdn.steemitimages.com/DQmUyZ7SruH55V1TunUpaCLXqG4iYaat7WEoSdBpoLUYa5o/event-loop.jpg)

几秒钟过后...... 


好了，磨刀不误砍柴工，先理解图中包含四个主要的概念：

`Event Loop`，`taskqueue`，`macrotask`，`microtask`


# [事件循环：](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/EventLoop#%E4%BA%8B%E4%BB%B6%E5%BE%AA%E7%8E%AF)
我们都知道JavaScript是单线程执行的，即同一时间只能执行一个任务。这里的单线程是指负责解析和执行Javascript脚本的浏览器内核，比如v8引擎。浏览器本身是多进程的，并且每个进程包含多个线程，比如GUI渲染线程，JS引擎线程，定时器线程等。之所以选择单线程是为了保证程序执行的一致性，避免多线程带来的复杂性，比如会有两个线程同时对dom进行修改的情况该如何处理的问题。既然同时只能执行一个任务，那怎么处理http请求,点击事件这类异步事件呢？

`就是通过事件循环来处理异步任务的，通过讲异步事件放入异步任务队列来防止主线程阻塞，事件循环属于处理异步的一种方式`  

>  之所以称之为事件循环，是因为它经常按照类似如下的方式来被实现：
 ```
  while (queue.waitForMessage()) {
    queue.processNextMessage();
  }
  
```

看到没！死循环！浏览器就是这么傻傻的，有任务就干，没事就一直等，就像在守株待兔。。。

这里的“兔”就是任务`队列`里面的一个个任务，`任务`是什么呢？

任务就是一个个函数调用栈（Call Stack）（队列 是一种 FIFO(First In, First Out) 的数据结构，它的特点就是 先进先出）

`调用栈`是什么呢？

调用栈就是一个个待执行的函数（栈 是一种 LIFO（Last In, First Out）的数据结构，特点即 后进先出）

![](https://cdn.steemitimages.com/DQmZi7BW4ughjDezLyNmLEEXDXybUG63Fc2vcN9gw4ThHqs/image.png)

但是浏览器不是真这么傻，它不仅可以执行同步任务，还可以执行异步任务。
JavaScript引擎遇到一个异步事件后并不会一直等待其返回结果，而是会将这个事件挂起，继续执行执行栈中的其他任务。当一个异步事件返回结果后，js会将这个事件加入与当前执行栈不同的另一个队列，我们称之为事件队列。被放入事件队列不会立刻执行其回调，而是等待当前执行栈中的所有任务都执行完毕， 主线程处于闲置状态时，主线程会去查找事件队列是否有任务。如果有，那么主线程会从中取出排在第一位的事件，并把这个事件对应的回调放入执行栈中，然后执行其中的同步代码...，如此反复，这样就形成了一个无限的循环。这就是这个过程被称为“事件循环（Event Loop）”的原因。



>To coordinate events, user interaction, scripts, rendering, networking, and so forth, user  [agents](https://tc39.es/ecma262/#sec-agents) must use event loops as described in this section. Each agent has an associated event loop.
>为了协调事件，用户交互，脚本，渲染，网络等，用户代理必须使用本节所述的event loop.每个代理都有一个关联的事件循环。
>An event loop has one or more task queues. A task queue is a set of tasks.
>一个事件循环具有一个或多个任务队列。任务队列是一组任务。
>Per its source field, each task is defined as coming from a specific task source. For each event loop, every task source must be associated with a specific task queue.
>每个 任务 都定义为来自特定的 任务源。 来自特定 任务源 和指向特定的 事件循环 的的所有任务（例如，由一个 Document 的定时器生成的回调、Document 上鼠标移动触发的事件、 为 Document 的解析器入队的任务）必须总是被添加到同一个 任务队列， 但来自不同 任务源 的 任务 可以放在不同的 任务队列 中。

# Task分类：

>所有任务可以分成两种，一种是同步任务（synchronous），另一种是异步任务（asynchronous）。同步任务指的是，在主线程上排队执行的任务，只有前一个任务执行完毕，才能执行后一个任务；异步任务指的是，不进入主线程、而进入"任务队列"（task queue）的任务，只有"任务队列"通知主线程，某个异步任务可以执行了，该任务才会进入主线程执行。

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