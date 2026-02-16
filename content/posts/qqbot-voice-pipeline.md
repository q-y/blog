---
title: "QQ 语音自动化链路实战：离线 ASR + 本地 TTS + SILK 发送"
date: 2026-02-16T09:17:23+08:00
slug: "qqbot-voice-pipeline"
draft: false
tags: ["work", "program", "linux"]
categories: ["automation"]
description: "Hands-on QQ voice automation pipeline with offline ASR, local TTS, ffmpeg normalization, and SILK delivery."
---

## 目标

本文给出一条在 QQ 通道可落地的语音自动化方案：

1. 语音输入：离线 ASR（`faster-whisper`）转写中文。
2. 语音输出：本地 TTS（Piper）生成 WAV，再转 SILK，最终以 QQ 音频消息发送。
3. 工程约束：全部在项目 `venv` 内执行，避免系统 Python 污染。

> 适用场景：希望在无云端 ASR/TTS 依赖下，构建一条可控、可调试、可持续迭代的中文语音链路。

## 环境准备

```bash
# 1) 进入工作目录
cd /config/.openclaw/workspace

# 2) 创建并启用虚拟环境（若尚未创建）
python3 -m venv .venv
source .venv/bin/activate

# 3) 安装离线 ASR 依赖
pip install -U faster-whisper

# 4) 安装音频处理工具（按你的系统包管理器安装）
# ffmpeg 用于采样率/声道规范化
# silk-wasm 用于 WAV -> SILK 转码
```

## 输入链路：离线语音转写（ASR）

项目内脚本：`tools/asr_faster_whisper.py`

建议默认参数：
- `--model small`
- `--lang zh`
- CPU 场景可用 `int8`

示例命令：

```bash
/config/.openclaw/workspace/.venv/bin/python \
  /config/.openclaw/workspace/tools/asr_faster_whisper.py \
  /path/to/input.wav \
  --model small \
  --lang zh
```

如果你的上游拿到的是 QQ 原始语音，先统一转成标准 WAV 再喂 ASR：

```bash
ffmpeg -y -i input_any_format \
  -ac 1 -ar 16000 -c:a pcm_s16le \
  input_asr.wav
```

## 输出链路：本地中文 TTS 到 QQ 可播音频

核心经验：QQ 端对 **SILK** 音频兼容性最稳定，WAV/OGG/MP3 直发成功率不稳定。

### Step 1：Piper 合成中文 WAV

```bash
echo "你好，这是一条语音自动化测试。" | \
  piper \
  --model /path/to/zh_CN-huayan-medium.onnx \
  --output_file tts_raw.wav
```

### Step 2：ffmpeg 规范化音频

建议统一为 24k、单声道、16-bit PCM：

```bash
ffmpeg -y -i tts_raw.wav \
  -ac 1 -ar 24000 -c:a pcm_s16le \
  tts_24k_mono.wav
```

### Step 3：转码为 SILK

```bash
# 根据你本地 silk-wasm 的实际命令调整
silk-wasm encode tts_24k_mono.wav tts.silk
```

### Step 4：通过 QQ 通道发送音频

关键要求：**语音消息单独发送，不要与说明文字混发**，否则可能“可见但不播放”。

在 OpenClaw 的 QQ 适配层，按音频消息 payload 发送 `tts.silk` 即可。

## 可直接复用的工程策略

1. **ASR 默认 small**：在精度、速度、资源占用之间平衡较好。
2. **歧义先确认**：若转写存在多义，再执行副作用动作（发消息/下指令）。
3. **统一音频规格**：所有上游音频先过 ffmpeg 标准化，减少设备差异。
4. **SILK 单条发送**：这是当前 QQ 语音稳定播放的关键约束。
5. **脚本化沉淀**：将 inbound/outbound 拆成独立技能，便于版本回退与 A/B 调参。

## 后续可继续优化

- 增加长句自动切分与韵律参数模板，缓解断词/断句感。
- 引入噪声样本集做回归测试，评估复杂环境鲁棒性。
- 给 outbound 增加多版本 profile，按“清晰度优先/自然度优先”动态切换。

## 参考命令清单（最小闭环）

```bash
# A. 语音输入转写
python tools/asr_faster_whisper.py input.wav --model small --lang zh

# B. 文本转语音
printf '%s' '这是一条测试语音' | piper --model /path/to/model.onnx --output_file tts_raw.wav

# C. 规范化 + 转 SILK
ffmpeg -y -i tts_raw.wav -ac 1 -ar 24000 -c:a pcm_s16le tts_24k_mono.wav
silk-wasm encode tts_24k_mono.wav tts.silk

# D. 通过 QQ 音频消息发送 tts.silk（单条发送）
```

## QQBot 适配层修改（单独章节）

前面的 ASR/TTS 解决的是“能生成语音”，这一节解决的是“能在 QQ 端稳定播放”。

### 适配目标

1. 在通道层增加 `audio` 消息分支（而不是把语音当普通文件发送）。
2. 明确 `audio/silk` 的 payload 结构，确保 QQ 侧可识别。
3. 发送策略默认“单条语音优先”，避免文字与语音混发导致不播放。

### 简化 payload 示例（示意）

```json
{
  "msg_type": "audio",
  "file": "tts.silk",
  "mime": "audio/silk",
  "duration_ms": 3200
}
```

### 核心代码片段（可复现改造）

```ts
// pseudo: qqbot adapter
async function sendMessage(msg: OutboundMessage) {
  if (msg.type === 'audio') return sendAudio(msg)
  if (msg.type === 'image') return sendImage(msg)
  return sendText(msg)
}

async function sendAudio(msg: { path: string; mime?: string; durationMs?: number }) {
  const mime = msg.mime ?? 'audio/silk'

  // 1) 基本校验：存在性 + 后缀（建议同时校验 magic bytes）
  await fs.promises.access(msg.path)
  if (!msg.path.endsWith('.silk')) {
    throw new Error(`audio must be .silk: ${msg.path}`)
  }

  // 2) 读文件并组装通道 payload
  const data = await fs.promises.readFile(msg.path)
  const payload = {
    msg_type: 'audio',
    file_name: path.basename(msg.path),
    mime,
    duration_ms: msg.durationMs ?? 0,
    data_base64: data.toString('base64'),
  }

  // 3) 发给 QQ 通道
  return qqbotClient.send(payload)
}
```

```ts
// 语音单条优先，避免文字混发导致不播放
async function replyVoiceFirst(audioPath: string, text?: string) {
  await sendMessage({ type: 'audio', path: audioPath, mime: 'audio/silk' })

  // 若业务必须补充文字，延后单独发
  if (text && text.trim()) {
    await delay(800)
    await sendMessage({ type: 'text', text })
  }
}
```

```ts
// wav -> silk
async function wavToSilk(inputWav: string, outputSilk: string) {
  await execa('ffmpeg', [
    '-y', '-i', inputWav,
    '-ac', '1', '-ar', '24000', '-c:a', 'pcm_s16le',
    '/tmp/tts_24k_mono.wav',
  ])
  await execa('silk-wasm', ['encode', '/tmp/tts_24k_mono.wav', outputSilk])
}
```

> 如果你的适配层还在“仅支持 text/image”，建议先补齐 audio 分支，再做上层编排；否则 TTS 链路即使生成成功，也会卡在最后一跳。

## 后续可继续优化

- 增加长句自动切分与韵律参数模板，缓解断词/断句感。
- 引入噪声样本集做回归测试，评估复杂环境鲁棒性。
- 给 outbound 增加多版本 profile，按“清晰度优先/自然度优先”动态切换。
