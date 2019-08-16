---
title: "Vuex概念浓缩版记录"
date: 2019-05-29T20:20:22+08:00
tags: ["vuex"]
---

## state 
读取store的字段值,通过this.$store.state访问

```js
const Counter = {
  template: `<div>{{ count }}</div>`,
  computed: {
    count () {
      return this.$store.state.count
    }
  }
}

```

## mapState 辅助函数
当一个组件需要获取多个状态时候，将这些状态都声明为计算属性会有些重复和冗余。为了解决这个问题，我们可以使用 mapState 辅助函数帮助我们生成计算属性，让你少按几次键,**注意可以使用别名映射**

```js
// 在单独构建的版本中辅助函数为 Vuex.mapState
import { mapState } from 'vuex'

export default {
  // ...
  computed: mapState({
    // 箭头函数可使代码更简练
    count: state => state.count,

    // 传字符串参数 'count' 等同于 `state => state.count`
    countAlias: 'count',

    // 为了能够使用 `this` 获取局部状态，必须使用常规函数
    countPlusLocalState (state) {
      return state.count + this.localCount
    }
  })
}
```

当映射的计算属性的名称与 state 的子节点名称相同时，我们也可以给 mapState **传一个字符串数组**。
```js
computed: mapState([
  // 映射 this.count 为 store.state.count
  'count'
])
```
也可以使用对象展开运算符将此对象混入到外部对象中
```js
 localComputed () { /* ... */ },
  ...mapState({
    // ...
  })
```
使用 Vuex 并不意味着你需要将所有的状态放入 Vuex。虽然将所有的状态放到 Vuex 会使状态变化更显式和易调试，但也会使代码变得冗长和不直观。如果有些状态严格属于单个组件，最好还是作为组件的局部状态。


## getter
* Vuex 允许我们在 store 中定义“getter” **（可以认为是 store 的计算属性）。** getter的返回值会根据它的依赖被缓存起来，且只有当它的依赖值发生了改变才会被重新计算。
**Getter 接受 state 作为其第一个参数**
* Getter 会暴露为 **store.getters** 对象，你可以以属性的形式访问这些值
* Getter 也可以接受其他 getter 作为第二个参数：
    ```js
    getters: {
      doneTodosCount: (state, getters) => {
        return getters.doneTodos.length
      }
    }
    ```
 ## mapGetters 辅助函数
 mapGetters 辅助函数仅仅是将 store 中的 getter 映射到局部计算属性，和mapState差不多，**可以使用别名映射**
 
```js
import { mapGetters } from 'vuex'

export default {
  // ...
  computed: {
  // 使用对象展开运算符将 getter 混入 computed 对象中
    ...mapGetters([
      'doneTodosCount',
      'anotherGetter',
      // ...
    ])
    
     // 把 `this.doneCount` 映射为 `this.$store.getters.doneTodosCount`
     doneCount: 'doneTodosCount'
  }
}
```
## Mutation
**更改 Vuex 的 store 中的状态的唯一方法是提交 mutation**。Vuex 中的 mutation 非常类似于事件：每个 mutation 都有一个字符串的 事件类型 (type) 和 一个 回调函数 (handler)。这个回调函数就是我们实际进行状态更改的地方，并且它会接受 state 作为第一个参数。**你不能直接调用一个 mutation handler，只能store.commit('increment')**
```js
const store = new Vuex.Store({
  state: {
    count: 1
  },
  mutations: {
    increment (state) {
      // 变更状态
      state.count++
    }
  }
})

store.commit('increment') //相当于触发事件increment
```

## 提交载荷（Payload）
你可以向 store.commit 传入额外的参数，即 mutation 的 载荷（payload）,相当于触发事件increment，当作事件更容易理解
```js
mutations: {
  increment (state, n) {
    state.count += n
  }
}
store.commit('increment', 10)
```
##### 对象风格的提交方式
```
store.commit({
  type: 'increment',
  amount: 10
})
//当使用对象风格的提交方式，整个对象都作为载荷传给 mutation 函数
```
### mapMutations 辅助函数
你可以在组件中使用 this.$store.commit('xxx') 提交 mutation，或者使用 mapMutations 辅助函数将组件中的 methods 映射为 store.commit 调用（需要在根节点注入 store）。**注意可以使用别名映射，和mapGetters中一样**
```js
import { mapMutations } from 'vuex'
export default {
  methods: {
    ...mapMutations([
      'increment', // 将 `this.increment()` 映射为 `this.$store.commit('increment')`
      // `mapMutations` 也支持载荷：
      'incrementBy' // 将 `this.incrementBy(amount)` 映射为`this.$store.commit('incrementBy', amount)`
    ]),
    ...mapMutations({
      add: 'increment' // 将 `this.add()` 映射为 `this.$store.commit('increment')`
    })
  }
}
```

## Action
* Action 类似于 mutation，不同在于Action提交的是mutation，而不是直接变更状态。**Action 可以包含任意异步操作**。
* Action 函数接受一个与 store 实例具有相同方法和属性的 context 对象，因此你可以调用 context.commit 提交一个 mutation，或者通过 context.state 和 context.getters 来获取 state 和 getters。

```js
const store = new Vuex.Store({
  state: {
    count: 0
  },
  mutations: {
    increment (state) {
      state.count++
    }
  },
  actions: {
    increment (context) {
      context.commit('increment')
    }
  }
})
```

##### 分发 Action
Action 通过 store.dispatch 方法触发
```js
store.dispatch('increment')
```
##### 在组件中分发 Action
**和 mutation 差不多**你在组件中使用 this.$store.dispatch('xxx') 分发 action，或者使用 mapActions 辅助函数将组件的 methods 映射为 store.dispatch 调用（需要先在根节点注入 store）

## mapActions 辅助函数
**和mapState,mapGetters,mapMutations作用一致,方便批量合并action**


## Module
Vuex 允许我们将 store 分割成模块（module）。每个模块拥有自己的 state、mutation、action、getter、甚至是嵌套子模块，**相当于创建隔离的store实例**，Module内部可以使用命名空间，[具体看官方文档>>](https://vuex.vuejs.org/zh/guide/modules.html)
```js
const moduleA = {
  state: { ... },
  mutations: { ... },
  actions: { ... },
  getters: { ... }
}

const moduleB = {
  state: { ... },
  mutations: { ... },
  actions: { ... }
}

const store = new Vuex.Store({
  modules: {
    a: moduleA,
    b: moduleB
  }
})

store.state.a // -> moduleA 的状态
store.state.b // -> moduleB 的状态

```

### 注意事项 ⚠️
* 提交 mutation 是更改状态的唯一方法，并且这个过程是同步的。
* 提前在你的 store 中初始化好所有所需属性,否则不能响应
* 辅助函数都可以使用别名
* dispatch返回Promise，可以连续调用多个Action
* 应用层级的状态应该集中到单个 store 对象中。
* 异步逻辑都应该封装到 action 里面。







