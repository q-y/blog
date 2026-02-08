---

title: "EDAS会议投稿二三事"
date: 2019-05-03
lastmod: 2020-06-22
slug: "edas-conf"
tags: ["latex", "matlab", "edas"]
categories: ["work"]
---

EDAS会议投稿会检查采用latex输出的pdf文件格式。但即使采用正确的`\documentclass[conference]{IEEEtran}`官方模板格式，往往还是会出现常见的几种错误，现梳理如下：

## 未嵌入字体（Fonts are not embedded） ##
该种错误最为常见，其原因主要是采用Matlab输出的图片文件中的`Helvetica`字体未能正确嵌入到.pdf文件中（可在 PDF文件-文档属性-字体 中查看）。解决此问题可采用以下三种方案任选一种：

1.为Matlab输出的图片嵌入字体

可按照[matlab导出图片 所见即所得][1]这篇文章所述，导出Matlab输出的图片，这种图片是被正确嵌入字体的。另外，可采用创建如下.bat脚本文件的方法，将Matlab（内置另存为）直接导出的.eps文件直接拖放到该.bat脚本文件图标上以完成字体嵌入：
```batch
@echo off
if "%1"=="" goto gend
if %~x1==.eps (goto gstart) else goto gend
pause>nul
exit

:gstart
gswin32c -dNOPAUSE -dBATCH -dEPSCrop -q -sDEVICE=pdfwrite -dCompatibilityLevel#1.3 -dPDFSETTINGS=/prepress -dSubsetFonts=true -dEmbedAllFonts=true -sOutputFile=%~dpn1.temp.pdf %~f1
move %~dpn1.eps %~dpn1.eps.bak
gswin32c -q -dNOPAUSE -dBATCH -dNOCACHE -sDEVICE=epswrite -sOutputFile=%~dpn1.eps %~dpn1.temp.pdf
del %~dpn1.temp.pdf
echo 字体嵌入完成，嵌入后的.eps文件在源文件目录下.
pause>nul
exit

:gend
echo 请将需要嵌入字体的.eps文件直接拖放至本文件图标上即可完成嵌入.
pause>nul
exit
```

2.修改Matlab图片字体

```matlab
set(0,'defaultAxesFontName', '<fontname>')
set(0,'defaultTextFontName', '<fontname>')
```
其中`<fontname>`为所期望的字体名，可以为`Arial`等。

3.为.tex编译后的.ps嵌入字体并输出.pdf

可采用Adobe Distiller从.ps输出.pdf，也可采用创建如下.bat脚本文件的方法，将Latex编译的.ps文件直接拖放到该.bat脚本文件图标上以完成字体嵌入并生成.pdf：

```batch
@echo off
if "%1"=="" goto gend
if %~x1==.ps (goto gstart) else goto gend
pause>nul
exit

:gstart
gswin32c -dSAFER -dNOPAUSE -dBATCH -sDEVICE=pdfwrite -sPAPERSIZE=letter -dPDFSETTINGS=/printer -dCompatibilityLevel=1.3 -dMaxSubsetPct=100 -dSubsetFonts=true -dEmbedAllFonts=true -sOutputFile=%~dpn1.pdf %~f1
echo 字体嵌入完成，嵌入后的.pdf文件在源文件目录下.
pause>nul
exit

:gend
echo 请将需要嵌入字体的.ps文件直接拖放至本文件图标上即可完成嵌入.
pause>nul
exit
```
其中`gswin32c`命令采用了默认32位CTex配置，如有需要，可根据自己安装的`Ghostscript`路径以及32位或64位程序进行相应调整。

## 边距问题（margin, gutter between columns） ##

该问题往往是某个特定页的公式突出来了（可按照EDAS提示第几页来查找），可通过修改公式进行修改。另外，对于gutter between columns问题，也可通过在.tex导言区添加`\setlength{\columnsep}{0.23in}`命令进行间距调整（不推荐这种改变原模板的做法）。

## 书签问题（Bookmarks are not allowed） ##

该问题可通过删除.tex导言区`\usepackage{hyperref}`包来解决。

  [1]: https://qqy.pw/matlab-export-fig
