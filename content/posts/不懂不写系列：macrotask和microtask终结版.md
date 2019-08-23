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

如果你不能立马得出答案，或则模棱两可的猜测执行过程，那你肯定没有理解清楚JS的事件循环机制，也就是常常听到的Event Loop。其实理解清楚原理后，像上面这些看起来变态的问题就小菜一碟了，并且是弄懂一次就永不出错，下面开始macrotask和microtask终结篇。

先看下面一张图，你想到了什么，多看几秒钟先自己猜测下......

![event-loop.jpg](https://cdn.steemitimages.com/DQmUyZ7SruH55V1TunUpaCLXqG4iYaat7WEoSdBpoLUYa5o/event-loop.jpg)

几秒钟过后...... 

好了，我们都知道JavaScript是单线程执行的，即同一时间只能执行一个任务，代码执行是同步并且阻塞的。只有同步执行任务肯定是有问题的，你可以想想这种情况下一个网页加载完是多么卡顿。

![](https://cdn.steemitimages.com/DQmZi7BW4ughjDezLyNmLEEXDXybUG63Fc2vcN9gw4ThHqs/image.png)

所以JS需要能够异步执行任务才能保证浏览器的流畅工作，event loop就是用来协调处理任务队列的。一个浏览器环境（unit of related similar-origin browsing contexts.）只能有一个事件循环（Event loop），而一个事件循环可以多个任务队列（Task queue）

# [Event loops](https://html.spec.whatwg.org/multipage/webappapis.html#event-loops)
>To coordinate events, user interaction, scripts, rendering, networking, and so forth, user  [agents](https://tc39.es/ecma262/#sec-agents) must use event loops as described in this section. Each agent has an associated event loop.
>为了协调事件，用户交互，脚本，渲染，网络等，用户代理必须使用本节所述的event loop.每个代理都有一个关联的事件循环。
>An event loop has one or more task queues. A task queue is a set of tasks.
>一个事件循环具有一个或多个任务队列。任务队列是一组任务。
>Per its source field, each task is defined as coming from a specific task source. For each event loop, every task source must be associated with a specific task queue.
>每个 任务 都定义为来自特定的 任务源。 来自特定 任务源 和指向特定的 事件循环 的的所有任务（例如，由一个 Document 的定时器生成的回调、Document 上鼠标移动触发的事件、 为 Document 的解析器入队的任务）必须总是被添加到同一个 任务队列， 但来自不同 任务源 的 任务 可以放在不同的 任务队列 中。

任务队列中的任务可以分为两种，task和microtask，**通常我们把task叫做macrotask**，也就是宏任务，microtask叫做微任务。

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

macrotask：包含执行整体的js代码，事件回调，XHR回调，定时器（setTimeout/setInterval/setImmediate），IO操作，UI render

microtask：更新应用程序状态的任务，包括promise回调，MutationObserver，process.nextTick，Object.observe






* [WHATWG官方event-loop规范](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop)

* [ECMA262中Agent的定义](https://tc39.es/ecma262/#sec-agents)

* [JavaScript：核心 - 第二版<翻译>](http://www.xiaojichao.com/post/jscorev2.html#toc-fc9/)

* [tasks-microtasks-queues-and-schedules](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/)

* [任务、微任务、队列和时间表<翻译>](https://www.zcfy.cc/article/tasks-microtasks-queues-and-schedules)

[](https://github.com/aooy/blog/issues/5)

[](https://savokiss.com/tech/learning-microtask-and-macrotask.html)

[](https://savokiss.com/tech/event-loop.html)

[](http://www.kenote.me/notes/notedetail.html?fileId=388)

[](https://juejin.im/post/59e85eebf265da430d571f89)


[](http://lynnelv.github.io/js-event-loop-browser)

[](https://whatwg-cn.github.io/html/#event-loop)