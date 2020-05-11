---
title: "纯手工搭建Electron+React+Typescript脚手架，无nodemon无concurrently"
date: 2020-05-11T19:04:09+08:00
---

最近准备开发一个软件，本来准备用Chrome Extension来实现的，因为扩展可以无视跨域，基本上大部分需求都可以满足，为了解决自动更新的问题，最近还专门去研究了Chrome扩展实现热更新的机制，目前百度的前端助手上已经实现了。

前几年开发过一款微信QQ淘客机器人插件，这是我和朋友开发的一款商业化的软件，当时的竞争对手也都是插件形式，为了保持轻量级，我们也使用了Chrome扩展的形式，虽然想要的功能都完美实现了，但是相比于本地应用的能力还是差很多，走了不少弯路。有些实现方式比较hack，同时把发送微信群消息和QQ群消息集成在web上并不容易，并且由于扩展能力有限，会遇到很多坑，比如不能操作本地文件，自动更新升级麻烦，每次都得发商店审批，有的小白用户不会安装扩展等等。。。

我觉得当时我们已经把扩展已有的能力用到了极致，如果当时一开始就选择基于Electron，我可以少熬多少夜啊。。。虽然之前很早就接触过node-webkit和Electron，但是一直没有开发过一个完整的应用，思前想后，对比来对比去，决定还是一把梭Electron算了，有一种弥补遗憾的感觉。什么问题都解决了，有本地功能，自动升级，双击就启动应用等等，好处多多，既可以学习Electron，又可以练习typescript，产品问题也可以解决，简直是一箭三雕。

既然要用Typescript开发Electron，第一肯定得找一个称手的脚手架，我找了几个加星🌟比较多的项目，但是都不太喜欢，不是黑盒子就是没见过的依赖非常多。然后我搜索了一些教程然后准备自己手撸一个，这样出bug了也知道问题在哪里，不用去到处搜解决方案。

下面是整个脚手架的流程图：

![Electron流程图](https://cdn.steemitimages.com/DQmRde9KGKozA6GYMeEzWYnFSbsoTceDrNDcufGtPUGF3bh/%E6%9C%AA%E5%91%BD%E5%90%8D%E6%96%87%E4%BB%B6%20(1).png)

我看开源的脚手架都用了nodemon来重启主进程，我觉得这里可以直接监听webpack中compiler的done事件，然后重启主进程，这样就可以省一个依赖模块，package.json已经够乱的了。至于concurrently主要是用来并行执行命令，我觉得其实也没太必要，我通过监听渲染进程开启devServer时的before事件开启编译主进程，这样又可以省一个包了😂

我这里打包脚本又四个：

- webpack.common.js
- webpack.main.js 
- webpack.prod.js
- webpack.renderer.js


......

......

......

