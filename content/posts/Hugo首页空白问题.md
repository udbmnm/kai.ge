---
title: "Hugo部署后首页空白问题"
date: 2021-05-18T11:36:07+08:00
tags: ["hugo"]
---


如果使用的非常老的主题，在使用新版hugo的时候会出现首页空白的问题

有两种解决方案：

* 切换hugo到老版本（省事）
* 修改主题首页模版使用 Site.RegularPages

```	
{{ $pages := .Pages }}
{{ if .IsHome }}
{{ $pages = .Site.RegularPages }}
{{ end }}
{{ $paginator := .Paginate $pages }}

```

主要原因是 v.0.58.0 的破坏性更新：

>  Hugo v.0.58.0 was released on the 4th of September 2019 and the breaking changes to the home.Pages collection that were reverted in 0.57.2 have been re-introduced Theme authors need to issue the fixes described above if they wish to keep their themes listed in the Hugo Showcase.  


详细看这里：[https://github.com/gohugoio/hugoThemes/issues/682](https://github.com/gohugoio/hugoThemes/issues/682)