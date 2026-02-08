---

title: "Matlab中对复矩阵的特征值分解"
date: 2019-08-17
lastmod: 2019-08-18
slug: "svd"
tags: ["matlab"]
categories: ["share"]
---

我们通信系统中往往研究的均为复数（复矩阵），但在求复Hermitian矩阵的特征值分解时，千万不要用`eig`函数（对于实矩阵没问题），一定要用
```matlab
[U,S] = svd(X)
```

<!--more-->

其中`U`为列堆叠的特征向量，`S`为包含了特征值的对角阵。

往往就是这种小问题坑人好久！！！
