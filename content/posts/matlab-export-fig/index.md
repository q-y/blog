---

title: "matlab导出图片 所见即所得"
date: 2018-01-27
lastmod: 2019-05-21
slug: "matlab-export-fig"
tags: ["program"]
categories: ["share"]
---

matlab自带的另存为功能往往不尽人意，这里采用GitHub开源项目[export_fig][1]来导出。

<!--more-->

## 下载 ##
首先需要下载[export_fig][2]项目文件夹，注意在导出PDF或者EPS时需要以下两个工具：
 1. Ghostscript: www.ghostscript.com 
 2. pdftops (install the Xpdf package): www.xpdfreader.com
注意上述文件必须处于系统Path路径之内，因为在使用export_fig导出时，会从默认位置调用这些工具。

为了便于大家使用，我已经整合所有文件到这个[压缩包][3]中了，大家可以直接下载使用即可（可能版本没有及时更新）。

## 配置 ##
将压缩包解压出的文件夹放入以下两个Path中：

 1. Matlab的Path，这个大家应该都知道怎么放。
 2. 系统Path中，方法如下图所示：
![][4]

配置完成。

## 使用 ##

在Matlab中使用以下两行代码：
```matlab
set(gcf, 'Color', 'w'); % 设置当前待保存图片背景为白色
export_fig(gcf,'output.eps','-p0.01','-painters'); % 当前图片被保存为output.eps
```
其中，`gcf`表示保存当前figure，也可以是其他待保存figure的句柄；`output.eps`为要保存的文件名，也可以为其他类似于`.pdf`、`.png`等扩展名对应保存的不同格式。

  [1]: https://github.com/altmany/export_fig
  [2]: https://github.com/altmany/export_fig
  [3]: 127838141.zip
  [4]: 4012162819.png
