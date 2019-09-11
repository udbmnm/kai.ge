---
title: "不懂不写系列：JavaScript的异步机制，EventLoop，macrotask，microtask，nextTick终结篇"
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

如果你能立马得出答案，感觉就是小菜一碟，那么你可以跳过本文了。。。😄

如果你模棱两可的猜测执行过程，那你肯定没有理解清楚JavaScript的异步机制，本文就是为你准备的。我们经常会听到说JavaScript是单线程无阻塞的，单线程怎么能做到无阻塞呢？有的人可能会说因为JavaScript支持异步回调，但是为什么能支持异步？其实理解清楚异步背后的事件循环机制，也就是Event Loop，像上面这些问题就很容易回答了，并且可以弄懂一次就永不出错。上面的例子就不说答案了，答案不在F12，而在于弄懂Event Loop。

## 下面开始终结之旅
---
先看下面这张经常被引用的图，花几秒钟时间先自己想象Event Loop的执行过程...

![event-loop.jpg](https://cdn.steemitimages.com/DQmUyZ7SruH55V1TunUpaCLXqG4iYaat7WEoSdBpoLUYa5o/event-loop.jpg)

几秒钟过后...... 


好了，可以直观的看出图中包含三个主要的概念：

`Event Loop`，`macrotask`，`microtask`。

另外还有一个隐藏的重要的概念：`任务队列`。

因为事关JavaScript的执行过程，所以还会牵扯出一些其它的基础概念：

* 进程和线程
* 栈和队列
* 函数调用栈/执行栈

概念很多，我们各个击破...
# 进程和线程
浏览器是是多进程的，每打开一个新的tab或者新窗口都相当于创建了一个新的进程，每个进程都有占有独立的cpu和内存资源，多个进程间互不影响，所以一个页面挂了不会影响其它页面。每个进程包含多个线程，比如GUI渲染线程，JS引擎线程，定时器线程，HTTP异步请求线程,事件触发线程等。经常说的JavaScript是单线程的一般是指js内核引擎线程，比如v8引擎。**进程是系统分配资源的最小单位,线程是CPU调度的最小单位。**另外除了进程和线程外，还有一种微线程，一般被成为协程,一个线程可以包含多个协程，协程是用户自己调度的，没有上下文切换消耗,所以性能非常高，使用协程比较有代表性的就是Golang。
# Stack（栈）和 Queue（队列）
Stack和Queue是两种基本的数据结构，而常用的数据结构有八种，还有六种数据结构分别是：数组（Array）、散列表（Hash）、树（Tree）、链表（Linked List）、堆（Heap）、图（Graph）。

**`Stack：`**Stack是一种FILO（First In, First Out）的数据结构，也就是`先进后出`。eg：就像羽毛球筒一样，最先放进去最后才能拿出来

**`Queue：`**队列是一种 FIFO (First In, First Out) 的数据结构，它的特点就是`先进先出`。eg：去食堂排队吃饭，去的早的排前面的先吃

# Call Stack(函数调用栈)
函数调用栈，也叫执行栈，既然是栈，也是`先进后出`的，调用栈用于存储代码在执行期间创建的所有`执行上下文`。首次运行JS代码时，会创建一个全局执行上下文并Push到当前的调用栈中。每当发生函数调用，引擎都会为该函数创建一个新的函数执行上下文并Push到当前调用栈的栈顶。当栈顶函数运行完成后，其对应的函数执行上下文将会从调用栈中Pop出，上下文控制权将移到当前执行栈的下一个执行上下文。（关于执行上下文下次单独拎出来写）

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

下面是copy过来的图，看起来更直观：
![](https://cdn.steemitimages.com/DQmStyEA5rYjaWeGLRbpxuMAs6uY21nLS2n4xwbb2fEsKAY/image.png)


#   

回顾完上面的基础概念后，下面开始本文的主要内容。
# [Event Loop是什么？](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop)

#### 先看WHATAG的定义：

>To coordinate events, user interaction, scripts, rendering, networking, and so forth, [user agents](https://tc39.es/ecma262/#sec-agents) must use event loops as described in this section. Each agent has an associated event loop.
>An event loop has one or more task queues. A task queue is a set of tasks.

翻译过来就是，为了协调事件、用户交互、脚本、渲染、网络等，`用户代理`必须使用这一小节描述的`事件循环`。每个`代理`都有一个关联的事件循环。一个事件循环具有一个或多个`任务队列`。任务队列是一组任务。关于任务队列后面会详细说。其中[用户代理（user agents）](https://tc39.es/ecma262/#sec-agents)在ecma262中定义，感兴趣的可以点击上面链接查看详情。这里可以简单理解为一个包含执行上下文堆栈，一组作业队列，执行线程等这些东西的概念。

### 再看MDN中“事件循环“的描述：

之所以称之为事件循环，是因为它经常按照类似如下的方式来被实现：

 ```
  while (queue.waitForMessage()) {
    queue.processNextMessage();
  }
  
```

并且还有"`执行至完成`"的特点：

>每一个消息完整地执行后，其它消息才会被执行。这为程序的分析提供了一些优秀的特性，包括：一个函数执行时，它永远不会被抢占，并且在其他代码运行之前完全运行（且可以修改此函数操作的数据）。这与C语言不同，例如，如果函数在线程中运行，它可能在任何位置被终止，然后在另一个线程中运行其他代码。这个模型的一个缺点在于当一个消息需要太长时间才能处理完毕时，Web应用就无法处理用户的交互，例如点击或滚动。浏览器用“程序需要过长时间运行”的对话框来缓解这个问题。一个很好的做法是缩短消息处理，并在可能的情况下将一个消息裁剪成多个消息。

![](https://cdn.steemitimages.com/DQmZi7BW4ughjDezLyNmLEEXDXybUG63Fc2vcN9gw4ThHqs/image.png)

综合各种“官方”的规范和来自“民间”的共识，我得出的结论是这样的：
#### `事件循环就是不断读取和执行任务队列中任务的过程。任务队列中的任务可能包含同步任务和异步任务，并且一个任务执行的过程是不能被中断的。`

有没有发现，说了半天其实真正的主角是`任务队列`, 别急😂，说好的各个击破。。。

# [任务队列](https://html.spec.whatwg.org/multipage/webappapis.html#task-queue)

>Per its source field, each task is defined as coming from a specific task source. For each event loop, every task source must be associated with a specific task queue.

>Each event loop has a currently running task, which is either a task or null. Initially, this is null. It is used to handle reentrancy.

>Each event loop has a microtask queue, which is a queue of microtasks, initially empty. A microtask is a colloquial way of referring to a task that was created via the queue a microtask algorithm.

>Each event loop has a performing a microtask checkpoint boolean, which is initially false. It is used to prevent reentrant invocation of the perform a microtask checkpoint algorithm.

>Each event loop has associated values event loop begin and event loop end, which are initially unset.

又是一大串英文😂，规范中写得很详细，这里只引用了部分重要的概念。概括如下：

* 每个任务来自特定任务源，对于每个事件循环，每个任务源都必须与特定任务队列相关联。

* 每个事件循环有一个微任务队列，初始值为空。微任务属于任务的一种。

* 每个事件循环都有一个微任务检查点布尔值，最初为false。它用于防止执行微任务检查点算法的重入调用。

* 每个事件循环都具有事件循环开始和事件循环结束的关联值，这些最初未设置。


#### 另外规范中提到需要注意的地方：

⚠️ 任务队列是Sets(集合)，不是队列！！因为事件循环处理模型的第一步是从所选队列中获取第一个可运行任务，而不是使第一个任务出列（dequeue）。Sets在规范中的定义是没有相同item的有序list。这里顺便提一下，[ECMA T39](https://tc39.es/ecma262/#sec-jobs-and-job-queues)规范中把任务叫做job，任务队列叫做 Job Queues。并且提到 "A Job Queue is a FIFO queue of PendingJob records"。也就是说ECMA把任务队列当成先进先出的`Queue`数据结构，WHATWG强调不是`Queue`，很多文章会直接把任务队列直接当作`队列`，这里需要注意下。

⚠️ 任务源主要作用是用于区分逻辑上不同类型的任务，因为任务来源非常广泛，比如有的可能是来自点击，有的可能是ajax请求完成。

# [任务源 Generic task sources](https://html.spec.whatwg.org/multipage/webappapis.html#generic-task-sources)

* DOM操作任务源：
此任务源被用来相应dom操作，例如一个元素以非阻塞的方式插入文档。

* 用户交互任务源：
此任务源用于对用户交互作出反应，例如键盘或鼠标输入。响应用户操作的事件（例如click）必须使用task队列。

* 网络任务源：
网络任务源被用来响应网络活动。

* history traversal任务源：
当调用history.back()等类似的api时，将任务插进task队列。

任务源种类非常多，比如ajax的onload，鼠标click事件，基本上我们经常绑定的各种dom事件都是task任务源，还有数据库操作（IndexedDB ），需要注意的是setTimeout、setInterval、setImmediate也是task任务源。总结来说task任务源有这几种：

* setTimeout
* setInterval
* setImmediate
* I/O
* UI rendering

# 任务分类

>所有任务可以分成两种，一种是同步任务（synchronous），另一种是异步任务（asynchronous）。同步任务指的是，在`主线程`上排队执行的任务，只有前一个任务执行完毕，才能执行后一个任务；异步任务指的是，不进入主线程、而进入`"任务队列"`（task queue）的任务，只有"任务队列"通知主线程，某个异步任务可以执行了，该任务才会进入主线程执行。

上面一段是来自阮一峰博客，文章写于2014年，虽然这么归类现在看也没错，但是需要修订一下😄。
#### `任务一般可以分成两种，一种是同步任务（synchronous），另一种是异步任务（asynchronous）。异步任务也可以分为两种，一种是宏任务（macrotask），另一种是微任务（microtask）。宏任务包含同步任务和异步任务，微任务都是异步任务。`
在WHATWG的规范中并没有找到关于macrotask的定义，但是一般大家的共识是把task就当作macrotask，与之相对的是microtask。

⚠️ ES6+和Node环境才出现微任务的概念，比如Promise和process.nextTick，在这之前只需要理解同步任务和异步任务就行了。

# macrotask来源：
script主代码，事件回调，XHR回调，定时器（setTimeout/setInterval/setImmediate），IO操作，UI render
# microtask来源：
promise回调，MutationObserver，process.nextTick，Object.observe

# 任务执行顺序
基本需要的概念都有了，现在开始本文最重要的概念，macrotask和microtask执行顺序：

1. script主代码被推入`执行栈`，执行其中的同步代码，遇到异步代码会依次将任务分类放入macrotask队列和microtask队列
2. 继续执行`执行栈`中的同步代码，此时事件队列中的事件将被忽略，直到堆栈为空
3. 检测macrotask队列是否有宏任务待执行，如果有则取出第一个放入`执行栈`执行，注意一次事件循环只能执行一个宏任务⚠️
4. 执行完宏任务，开始检测microtask队列是否有微任务待执行，如果有则取出第一个放入`执行栈`执行，然后再检测，如果还有再取出再执行，直到microtask队列为空
6. 如果有注册requestAnimationFrame，执行requestAnimationFrame，requestAnimationFrame属于渲染过程，并且总是在渲染之前执行
5. 执行渲染更新UI，这里注意渲染ui不是必须的，和浏览器策略，硬件约束等有关，不同浏览器可能会有不同表现
6. 重复上述步骤，直到两个任务队列都为空

上面是任务队列基本执行过程，`执行栈`被标红了，因为最终队列中的任务都在Javascript主线程执行。更详细的过程中可能还会包含Web worker和requestIdleCallback。很多文章把requestAnimationFrame归类为macrotask，但是我并没有找到明确的出处。另外，requestAnimationFrame虽然属于异步任务但是不在任务队列中，我无法确定requestAnimationFrame是否属于macrotask，有知道的朋友欢迎来交流。

## ⚠️ 小知识
>规范没有要求任何特定的模型来选择渲染时机。但是，如果浏览器试图达到60Hz的刷新率，那么渲染机会最多每秒60次（约1000/60≈16.7ms）发生。如果浏览器发现一个浏览器上下文不能够维持这个速度，它有可能降低到30次每秒，而不是偶尔丢帧。类似地，如果浏览上下文不可见，则用户代理可能决定将该页面降低到每秒4次渲染，甚至更少。

上面是关于UI渲染更新规范中特别提到的。由于页面是一帧一帧绘制出来的，当每秒绘制的帧数（FPS）达到60时页面是非常流畅的，小于这个值时就会感觉到页面卡顿。每一帧的时间大概是1000/60≈16.7ms，也就是说如果浏览器在一帧的时间内（小于16.7ms的）事情没干完就会出现卡顿。因为JS引擎线程和GUI渲染线程是互斥的，JS引擎线程如果一直阻塞，GUI渲染线程就一直没机会工作。所以为了页面表现更流畅，就需要避免写可能阻塞JS引擎线程的代码。比如不要写执行时间可能过久的循环，不要有太多的microtask，因为不管有多少个microtask都会在一次循环中执行完，使用macrotask不会有阻塞的问题，因为宏任务总是每个循环只执行一个。

## 再来看开篇的问题：
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
先文字描述下执行过程：

1. console.log('script start')属于同步代码，进入JS主线程`执行栈`后直接执行，输出结果`script start`。
2. JS主线程遇到setTimeout，发现是异步代码并且是宏任务，把回调放进macrotask队列等待执行。
3. JS主线程遇到Promise并且resolve了，将第一个Promise then回调放进microtask队列。
4. console.log('script end')属于同步代码直接执行，输出结果`script end`。
5. 此时主线程执行栈为空，开始处理微任务队列，执行console.log('promise1')，输出`script promise1`，并且同时又链式调用then创造了一个微任务进入microtask队列。
6. 再次主线程执行栈为空，继续第5步，输出`script promise2`，直到microtask队列也为空。
7. 浏览器视情况而定决定是否刷新渲染ui。
8. 进入下一个循环，发现macrotask队列有任务，执行 console.log('setTimeout'); 输出`script setTimeout`。

下面是copy过来的一张图，执行过程非常清晰：
![browser-deom1-excute-animate.gif](https://cdn.steemitimages.com/DQmWmZxQbUkx4w5u7jiydS5yGCxpYmf79Aj4JMcghnu7nHN/browser-deom1-excute-animate.gif)

# 再来看看Vue.$nextTick中的应用

先看Vue.js 2.5.17的实现：

```
import { noop } from 'shared/util'
import { handleError } from './error'
import { isIOS, isNative } from './env'

const callbacks = []
let pending = false

function flushCallbacks () {
  pending = false
  const copies = callbacks.slice(0)
  callbacks.length = 0
  for (let i = 0; i < copies.length; i++) {
    copies[i]()
  }
}

// Here we have async deferring wrappers using both microtasks and (macro) tasks.
// In < 2.4 we used microtasks everywhere, but there are some scenarios where
// microtasks have too high a priority and fire in between supposedly
// sequential events (e.g. #4521, #6690) or even between bubbling of the same
// event (#6566). However, using (macro) tasks everywhere also has subtle problems
// when state is changed right before repaint (e.g. #6813, out-in transitions).
// Here we use microtask by default, but expose a way to force (macro) task when
// needed (e.g. in event handlers attached by v-on).
let microTimerFunc
let macroTimerFunc
let useMacroTask = false

// Determine (macro) task defer implementation.
// Technically setImmediate should be the ideal choice, but it's only available
// in IE. The only polyfill that consistently queues the callback after all DOM
// events triggered in the same loop is by using MessageChannel.
/* istanbul ignore if */
if (typeof setImmediate !== 'undefined' && isNative(setImmediate)) {
  macroTimerFunc = () => {
    setImmediate(flushCallbacks)
  }
} else if (typeof MessageChannel !== 'undefined' && (
  isNative(MessageChannel) ||
  // PhantomJS
  MessageChannel.toString() === '[object MessageChannelConstructor]'
)) {
  const channel = new MessageChannel()
  const port = channel.port2
  channel.port1.onmessage = flushCallbacks
  macroTimerFunc = () => {
    port.postMessage(1)
  }
} else {
  /* istanbul ignore next */
  macroTimerFunc = () => {
    setTimeout(flushCallbacks, 0)
  }
}

// Determine microtask defer implementation.
/* istanbul ignore next, $flow-disable-line */
if (typeof Promise !== 'undefined' && isNative(Promise)) {
  const p = Promise.resolve()
  microTimerFunc = () => {
    p.then(flushCallbacks)
    // in problematic UIWebViews, Promise.then doesn't completely break, but
    // it can get stuck in a weird state where callbacks are pushed into the
    // microtask queue but the queue isn't being flushed, until the browser
    // needs to do some other work, e.g. handle a timer. Therefore we can
    // "force" the microtask queue to be flushed by adding an empty timer.
    if (isIOS) setTimeout(noop)
  }
} else {
  // fallback to macro
  microTimerFunc = macroTimerFunc
}

/**
 * Wrap a function so that if any code inside triggers state change,
 * the changes are queued using a (macro) task instead of a microtask.
 */
export function withMacroTask (fn: Function): Function {
  return fn._withTask || (fn._withTask = function () {
    useMacroTask = true
    const res = fn.apply(null, arguments)
    useMacroTask = false
    return res
  })
}

export function nextTick (cb?: Function, ctx?: Object) {
  let _resolve
  callbacks.push(() => {
    if (cb) {
      try {
        cb.call(ctx)
      } catch (e) {
        handleError(e, ctx, 'nextTick')
      }
    } else if (_resolve) {
      _resolve(ctx)
    }
  })
  if (!pending) {
    pending = true
    if (useMacroTask) {
      macroTimerFunc()
    } else {
      microTimerFunc()
    }
  }
  // $flow-disable-line
  if (!cb && typeof Promise !== 'undefined') {
    return new Promise(resolve => {
      _resolve = resolve
    })
  }
}	

```

Vue2.5对于 macrotask 的实现，优先检测是否支持原生setImmediate，这是一个高版本 IE 和 Edge 才支持的特性，不支持的话再去检测是否支持原生的 MessageChannel，如果也不支持的话就会降级为setTimeout 0；而对于 microtask 的实现，则检测浏览器是否原生支持 Promise，不支持的话直接  microTimerFunc = macroTimerFunc，也就是说Vue2.5是优先使用microtask来执行nextTick中的任务的。

### 再来看看Vue.js 2.6版本的实现：

```
	
if (typeof Promise !== 'undefined' && isNative(Promise)) {
  const p = Promise.resolve()
  timerFunc = () => {
    p.then(flushCallbacks)
    // In problematic UIWebViews, Promise.then doesn't completely break, but
    // it can get stuck in a weird state where callbacks are pushed into the
    // microtask queue but the queue isn't being flushed, until the browser
    // needs to do some other work, e.g. handle a timer. Therefore we can
    // "force" the microtask queue to be flushed by adding an empty timer.
    if (isIOS) setTimeout(noop)
  }
  isUsingMicroTask = true
} else if (!isIE && typeof MutationObserver !== 'undefined' && (
  isNative(MutationObserver) ||
  // PhantomJS and iOS 7.x
  MutationObserver.toString() === '[object MutationObserverConstructor]'
)) {
  // Use MutationObserver where native Promise is not available,
  // e.g. PhantomJS, iOS7, Android 4.4
  // (#6466 MutationObserver is unreliable in IE11)
  let counter = 1
  const observer = new MutationObserver(flushCallbacks)
  const textNode = document.createTextNode(String(counter))
  observer.observe(textNode, {
    characterData: true
  })
  timerFunc = () => {
    counter = (counter + 1) % 2
    textNode.data = String(counter)
  }
  isUsingMicroTask = true
} else if (typeof setImmediate !== 'undefined' && isNative(setImmediate)) {
  // Fallback to setImmediate.
  // Techinically it leverages the (macro) task queue,
  // but it is still a better choice than setTimeout.
  timerFunc = () => {
    setImmediate(flushCallbacks)
  }
} else {
  // Fallback to setTimeout.
  timerFunc = () => {
    setTimeout(flushCallbacks, 0)
  }
}

export function nextTick (cb?: Function, ctx?: Object) {
  let _resolve
  callbacks.push(() => {
    if (cb) {
      try {
        cb.call(ctx)
      } catch (e) {
        handleError(e, ctx, 'nextTick')
      }
    } else if (_resolve) {
      _resolve(ctx)
    }
  })
  if (!pending) {
    pending = true
    timerFunc()
  }
  // $flow-disable-line
  if (!cb && typeof Promise !== 'undefined') {
    return new Promise(resolve => {
      _resolve = resolve
    })
  }
}

```

Vue2.6对于 macrotask 的实现，优先检测是否支持原生Promise，然后是检测是否支持MutationObserver，然后是setImmediate，最后都不支持就使用setTimeout。可以明显看出和2.5版本是相反的，也就是优先使用microtask来执行$nextTick里面的回调。

Vue对于$nextTick的实现改动了很多的版本，据我所知 Vue.js 2.5版本之前使用的microtask优先，2.5版本修改成macrotask优先，2.6版本又切换回microtask，至于具体原因尤大大也有提到：

>在 2.5 当中我们引入了一个改动，使得当一个 v-on DOM 事件侦听器触发更新时，会使用 Macrotask 而不是 Microtask 来进行异步缓冲。这原本是为了修正一类浏览器的特殊边际情况导致的 bug 才引入的，但这个改动本身却导致了更多其它的问题。在 2.6 里面我们对于原本的边际情况找到了更简单的 fix，因此这个 Macrotask 的改动也就没有必要了。现在 nextTick 将会统一全部使用 Microtask。如果你对具体的细节感兴趣，可以看[这里](https://gist.github.com/yyx990803/d1a0eaac052654f93a1ccaab072076dd)。



# Node中的Event Loop：

当 Node.js 启动后，它会初始化事件轮询，每一个event loop都会包含按如下顺序六个循环阶段。

```
   ┌───────────────────────────┐
┌─>│           timers          │
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │     pending callbacks     │
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │       idle, prepare       │
│  └─────────────┬─────────────┘      ┌───────────────┐
│  ┌─────────────┴─────────────┐      │   incoming:   │
│  │           poll            │<─────┤  connections, │
│  └─────────────┬─────────────┘      │   data, etc.  │
│  ┌─────────────┴─────────────┐      └───────────────┘
│  │           check           │
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
└──┤      close callbacks      │
   └───────────────────────────┘
```
   
   
* timers : 这个阶段执行setTimeout(callback) 和 setInterval(callback)预定的callback
* I/O callbacks : 执行延迟到下一个循环迭代的 I/O 回调
* idle, prepare : 仅node内部使用
* poll : 检索新的 I/O 事件;执行与 I/O 相关的回调（几乎所有情况下，除了close事件的callbacks、被timers(定时器，setTimeout、setInterval等)设定的callbacks、setImmediate设定的callbacks之外的callbacks），适当的条件下node将阻塞在这里
* check : setImmediate() 回调函数在这里执行
* close callbacks : 一些准备关闭的回调函数，如：socket.on('close'，callback)

在每次运行的事件循环之间，Node.js 检查它是否在等待任何异步 I/O 或计时器，如果没有的话就干净的关闭。
  
⚠️`注意上面六个阶段都不包括 process.nextTick()`


## setImmediate() 对比 setTimeout()

setImmediate() 和 setTimeout() 很类似，但何时调用行为完全不同。

* setImmediate：在当前轮询阶段完成后执行脚本，也就是在poll阶段完成时执行，即check阶段
* setTimeout：在毫秒的最小阈值经过后运行的脚本，timer阶段执行

执行计时器的顺序将根据调用它们的上下文而异。如果二者都从主模块内调用，则计时将受进程性能的约束（这可能会受到计算机上运行的其它应用程序的影响）。

```
setTimeout(() => {
  console.log('timeout');
}, 0);

setImmediate(() => {
  console.log('immediate');
});

```

上面的例子在不属于I/O周期调用时，执行的先后顺序时`不确定的`，我把setTimeout的时间改为1ms后结果也是不确定的，这是因为Node做不到0毫秒，最少也需要1毫秒，可以理解成setTimeout(cb, 0) === setTimeout(cb, 1)，[官方文档](https://nodejs.org/api/timers.html#timers_settimeout_callback_delay_args)中有说明。改成2ms后setImmediate总是先执行。关于执行顺序的先后问题在[这里](https://cnodejs.org/topic/57d68794cb6f605d360105bf)有大佬通过源码详细讲解。


```
// timeout_vs_immediate.js
const fs = require('fs');

fs.readFile(__filename, () => {
  setTimeout(() => {
    console.log('timeout');
  }, 0);
  setImmediate(() => {
    console.log('immediate');
  });
});


```
但是，如果你把这两个函数放入一个 I/O 回调内部，setImmediate 总是被`优先调用`。

## process.nextTick() 对比 setImmediate()
* process.nextTick不在event loop的任何阶段执行，而是在各个阶段切换的中间执行,即从一个阶段切换到下个阶段前执行。
* setImmediate在下一次迭代或事件循环的“tick”时触发


```
  setTimeout(() => {
     console.log('setTimeout');
	 process.nextTick(()=>{
	   console.log('nextTick3');
	 })
   }, 0);
   setImmediate(() => {
     console.log('setImmediate');
     process.nextTick(()=>{
       console.log('nextTick4');
     })
   });
   process.nextTick(()=>{
     console.log('nextTick1');
   })
   process.nextTick(()=>{
     console.log('nextTick2');
   })


```

执行结果是nextTick1，nextTick2，setTimeout，nextTick3，setImmediate，nextTick4

可以看到`nextTick`其实是“名不副实”，它根本和next没毛线关系，但是由于npm包数量太大贸然改名会造成影响。官方建议开发者在所有情况下都使用setImmediate，因为setImmediate更容易理解并且有更广泛的兼容性，比如被浏览器所兼容。

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

如果这个两个问题你都能人肉parse在脑中得出正确结果，那说明你真的懂了。否则，再重新多看几遍，下面的参考资料值得都看一遍。

不懂不写，就酱。

# 后记

----
 
 由于JavaScript异步机制涉及内容太多，给我的感觉就是越写需要研究的东西越多，我会在适当时机更新，如有大佬发现有误的地方欢迎交流。



参考资料：

---
* [WHATWG官方event-loop规范](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop)
* [ecma262 sec-jobs-and-job-queues](https://tc39.es/ecma262/#sec-jobs-and-job-queues)
* [ECMA262中Agent的定义](https://tc39.es/ecma262/#sec-agents)
* [浏览器进程？线程？傻傻分不清楚！](https://imweb.io/topic/58e3bfa845e5c13468f567d5)
* [tasks-microtasks-queues-and-schedules](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/)
* [从event loop规范探究javaScript异步及浏览器更新渲染时机](https://github.com/aooy/blog/issues/5)
* [深入理解js事件循环机制（浏览器篇）](http://lynnelv.github.io/js-event-loop-browser)
* [JavaScript 运行机制详解：再谈Event Loop](http://www.ruanyifeng.com/blog/2014/10/event-loop.html)
* [event-loop规范翻译](https://whatwg-cn.github.io/html/multipage/webappapis.html#%E4%BA%8B%E4%BB%B6%E5%BE%AA%E7%8E%AF)
* [深入浏览器的事件循环 (GDD@2018)](https://zhuanlan.zhihu.com/p/45111890)
* [Vue 2.6 Reverting nextTick to Always Use Microtask](https://gist.github.com/yyx990803/d1a0eaac052654f93a1ccaab072076dd)
* [模拟实现 JS 引擎：深入了解 JS机制 以及 Microtask and Macrotask](https://juejin.im/post/5c4041805188252420629086#heading-0)
* [你真的理解$nextTick么](https://juejin.im/post/5cd9854b5188252035420a13)
* [Node的事件循环](https://juejin.im/post/5c337ae06fb9a049bc4cd218)
* [深入探究 eventloop 与浏览器渲染的时序问题](https://www.404forest.com/2017/07/18/how-javascript-actually-works-eventloop-and-uirendering/)
* [Node.js Event Loop 的理解 Timers，process.nextTick()](https://cnodejs.org/topic/57d68794cb6f605d360105bf)