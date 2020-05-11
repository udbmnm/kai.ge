---
title: "纯手工搭建Electron+React+Typescript脚手架，无nodemon无concurrently"
date: 2020-05-11T19:04:09+08:00
---

最近准备开发一款软件，本来准备用Chrome Extension来实现的，考虑扩展是因为它可以无视跨域，基本上大部分需求都可以满足，并且最近我还专门去研究了Chrome扩展实现热更新的机制，发现目前百度的前端助手上已经实现了热更新，以前一直头疼的自动更新问题也可以得到解决，但是，最终我还是放弃了这个方案。

前几年开发过一款微信QQ淘客机器人插件，这是我和朋友开发的一款商业化的软件，当时的竞争对手也都是插件形式，为了保持轻量级，我们也使用了Chrome扩展的形式，虽然想要的功能都完美实现了，但是相比于本地应用的能力还是差很多，走了不少弯路。有些实现方式比较hack，同时把发送微信群消息和QQ群消息集成在web上并不容易，并且由于扩展能力有限，会遇到很多坑，比如不能操作本地文件，自动更新升级麻烦，每次都得发商店审批，有的小白用户不会安装扩展等等。。。

我觉得当时我们已经把扩展已有的能力用到了极致，如果当时一开始就选择基于Electron，我可以少熬多少夜啊。。。虽然之前很早就接触过node-webkit和Electron，但是一直没有开发过一个完整的应用，都仅限于demo，思前想后，对比来对比去，决定还是一把梭Electron算了，有一种弥补遗憾的感觉。什么问题都解决了，有本地功能，自动升级，双击就启动应用等等，好处多多，既可以学习Electron，又可以练习typescript，产品问题也可以解决，简直是一箭三雕。

既然要用Typescript开发Electron，第一件事肯定是找一个称手的脚手架，我找了几个加星🌟比较多的项目，但是都不太喜欢，不是黑盒子就是乱七八糟的依赖非常多。然后我搜索了一些教程决定自己手撸一个，这样出bug了也知道问题在哪里，不用去到处搜解决方案。

下面是整个脚手架的流程图：

![Electron流程图](https://cdn.steemitimages.com/DQmRde9KGKozA6GYMeEzWYnFSbsoTceDrNDcufGtPUGF3bh/%E6%9C%AA%E5%91%BD%E5%90%8D%E6%96%87%E4%BB%B6%20(1).png)

我看很多脚手架都用nodemon监听文件变化来重启主进程，我觉得这里可以直接监听webpack中compiler的done事件，然后重启主进程，这样就可以省一个依赖模块，package.json已经够乱的了。至于concurrently主要是用来并行执行命令，我觉得其实也没太必要，通过监听渲染进程开启devServer时的before事件开启编译主进程，这样又可以省一个包了，😂强迫症很严重。。。

我这里打包脚本有四个：

- webpack.common.js     （公共基础配置）
- webpack.main.js       （主进程配置）
- webpack.prod.js       （生产环境配置）
- webpack.renderer.js   （渲染进程配置）


webpack.common.js 返回一个数组，同时返回主进程和渲染进程基础配置,因为都是ts，这里配置可以公用。

```javascript
const path = require('path');
const merge = require('webpack-merge');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const baseConfig = {
	entry: {},
	output: {
		filename: '[name].js',
		path: path.resolve(__dirname, '../dist'),
		libraryTarget: 'commonjs2',
	},
	resolve: {
		extensions: ['.ts', '.tsx', '.js', '.json'],
	},
	devtool: 'eval-source-map',
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
			{
				test: /\.js$/,
				enforce: 'pre',
				use: 'source-map-loader',
				exclude: /node_modules/,
			},
			{
				test: /\.scss$/,
				use: ['style-loader', 'css-loader', 'sass-loader'],
				exclude: /node_modules/,
			},
			{
				test: /\.css$/,
				loaders: ['style-loader', 'css-loader'],
			},
		],
	},
	plugins: [],
	node: {
		__dirname: false,
		__filename: false,
	},
};
//主线程
exports.mainConfig = merge({}, baseConfig, {
	entry: {
		main: [path.resolve(__dirname, '../src/mainProcess/main.ts')],
	},
	target: 'electron-main',
});
//渲染线程
exports.rendererConfig = merge({}, baseConfig, {
	entry: {
		renderer: [path.resolve(__dirname, '../src/rendererProcess/index.tsx')],
	},
	target: 'electron-renderer',
	plugins: [
		new HtmlWebpackPlugin({
			template: path.resolve(__dirname, '../src/rendererProcess/index.html'),
			chunks: ['renderer'],
		}),
	],
});

```

webpack.main.js 主进程代码主要负责编译完成后重启electron

```javascript
const path = require('path');
const merge = require('webpack-merge');
const spawn = require('child_process').spawn;
const electron = require('electron');
const baseConfig = require('./webpack.common');
let electronProcess = null; //子进程
let compileCount = 0; //编译次数
let manualRestart = false;
process
	.on('exit', (code, signal) => {
		console.log('父process关闭', code, signal);
		process.exit(code);
	})
	.on('uncaughtException', spawnError => {
		console.log('父process异常');
		console.error(spawnError);
	});
class AfterCompilePlugin {
	constructor() {}
	apply(compiler) {
		compiler.plugin('done', stats => {
			console.log('主进程编译完成');
			if (electronProcess && electronProcess.kill) {
				manualRestart = true;
				killByPid(electronProcess.pid);
				electronProcess = null;
			}
			console.log(`第${compileCount}次编译完成`);
			startElectron();
			compileCount++;
			setTimeout(() => {
				console.log('manualRestart', manualRestart);
				manualRestart = false;
			}, 5000);
		});
		compiler.plugin('failed', err => {
			console.log('主进程编译失败', err);
		});
	}
}
const mainConfig = merge({}, baseConfig.mainConfig, {
	mode: 'development',
	resolve: {
		alias: {},
	},
	watch: true,
	watchOptions: {
		aggregateTimeout: 1000,
		ignored: /node_modules/,
		poll: 1000,
	},
	plugins: [new AfterCompilePlugin()],
});

function killByPid(pid) {
	console.log('杀死之前的主进程...', electronProcess.pid, process.pid);
	if (process.platform.includes('win32')) {
		spawn('taskkill', ['/PID', pid, '/T', '/F']);
	} else {
		process.kill(pid);
	}
}

function startElectron() {
	const args = ['--inspect=666', '.'];
	electronProcess = spawn(electron, args, {
		env: process.env,
		stdio: 'inherit',
		shell: process.platform.includes('win32'),
	})
		.on('close', code => {
			console.log('electronProcess关闭', code);
			if (!manualRestart) process.exit(code);
		})
		.on('error', spawnError => {
			console.log('electronProcess异常');
			console.error(spawnError);
		});
}

module.exports = mainConfig;

```

......

......

