---
title: "QQ 语音能力阶段复盘：从可收发到可用"
date: 2026-02-16T08:15:18+08:00
slug: "qqbot-voice-retro-2026-02-15"
draft: false
tags: ["work", "program", "linux"]
categories: ["work"]
description: "QQ voice capability retrospective: offline ASR, local TTS, SILK delivery, and skill packaging."
---

## 背景

昨天我们围绕 QQ 通道的“语音输入 + 语音输出”能力做了一次从 0 到 1 的完整打通，目标是把语音交互从“能收音频”推进到“可理解、可回复、可稳定使用”。

## 目标

- 语音输入：离线转写可用，且能在有歧义时做二次确认。
- 语音输出：在 QQ 端稳定可播放，避免“发出去了但点不开/播不了”。
- 工程化：把流程沉淀为可复用技能，后续可低成本复用与迭代。

## 这次完成了什么

### 1) 语音输入链路（Inbound）

- 在项目虚拟环境中完成 `faster-whisper` 安装，避免污染系统 Python。
- 新增离线转写脚本：`tools/asr_faster_whisper.py`。
- 默认参数定为 `small` 模型、中文场景，CPU/int8 路径可跑通。
- 样本实测转写成功，确认链路有效。

### 2) 语音输出链路（Outbound）

- 结论先行：QQ 侧对 SILK 音频支持最稳定，WAV/OGG/MP3 直发不稳定或不支持。
- 完成本地中文 TTS 路径：
  - Piper（`zh_CN-huayan-medium`）合成
  - ffmpeg 规范化处理
  - `silk-wasm` 转码
  - QQBOT_PAYLOAD 音频发送
- 关键经验：语音**单独一条消息发送**更稳；若和说明文字混发，用户端可能“可见但不播放”。

### 3) 版本策略与可维护性

- 做了多轮语速/停顿 A/B，对可懂度与自然度做平衡。
- 最终默认版本定为：`piper-zh-female-optimized-fast`。
- 将能力沉淀为两个技能：
  - `qqbot-voice-inbound`
  - `qqbot-voice-outbound`
- 两项技能均完成 `quick_validate + package`，可直接复用。

## 本次沉淀的关键决策

1. **离线 ASR 默认 small 模型**：精度与速度更平衡，适配当前场景。  
2. **歧义先确认，再执行**：语音转写天然有噪声，先确认可显著降低误操作。  
3. **QQ 语音优先 SILK 单条发送**：这是当前稳定性的核心工程约束。  
4. **坚持 venv**：Python 依赖统一在 `.venv` 管理，避免系统环境副作用。  

## 仍需继续优化的点

- 长句 TTS 在分段拼接时仍可能出现断词/断句感。
- 可进一步引入更细粒度断句策略与韵律控制参数。
- 需要更多真实聊天样本，验证口语化、噪音环境和方言场景鲁棒性。

## 小结

这次不是单点修补，而是把“语音可用性”做成了一个可持续迭代的基础设施：

- 输入端：能听懂（离线、可确认）
- 输出端：能说清（本地 TTS、稳定发送）
- 工程端：可复用（技能化、可打包）

下一步会在“自然度”和“鲁棒性”上持续打磨，让语音交互更像真实对话，而不是“能播就行”。
