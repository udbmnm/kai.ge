---
title: "不懂不写系列：macrotask和microtask终结篇"
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

![event-loop.jpg](https://cdn.steemitimages.com/DQmUyZ7SruH55V1TunUpaCLXqG4iYaat7WEoSdBpoLUYa5o/event-loop.jpg)

看上面一张图，你想到了什么，多看几秒钟先自己猜测下......
几秒钟过后...... 
好了，其实可以很清楚的想到JS其实是在一个事件循环中执行，简单理解其实就是一个直执行的一个死循环，有没有感觉浏览器很沙雕😄。。。



关于事件循环，HTML规范的介绍 [传送门](https://www.w3.org/TR/html5/webappapis.html#event-loop)

>There must be at least one event loop per user agent, and at most one event loop per unit of related similar-origin browsing contexts.
>An event loop has one or more task queues.
>Each task is defined as coming from a specific task source.

浏览器至少有一个事件循环，一个事件循环至少有一个任务队列（macrotask），每个外任务都有自己的分组，浏览器会为不同的任务组设置优先级。
其实除了macrotask还有microtask，

macrotask：包含执行整体的js代码，事件回调，XHR回调，定时器（setTimeout/setInterval/setImmediate），IO操作，UI render


microtask：更新应用程序状态的任务，包括promise回调，MutationObserver，process.nextTick，Object.observe

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