# Omiyage Go - デザインアイデア

## コンセプト
「外さないお土産」を最短距離で選べるサービス。
信頼感・和の美意識・モバイルファーストの3軸で設計する。

---

<response>
<text>

## アイデア1: 「現代和紙」ミニマリズム
**Design Movement**: Japanese Wabi-Sabi × Contemporary Minimal

**Core Principles**:
1. 余白を「間（ま）」として積極的に使う
2. 情報の優先順位を視覚的重みで表現する
3. 和紙のような温かみのある質感を背景に使う

**Color Philosophy**: 生成り（きなり）ベースに墨色テキスト。アクセントは朱色（#C0392B）。信頼と伝統を感じさせながら、現代的な清潔感を保つ。

**Layout Paradigm**: 縦スクロール一本道。カードは左揃えで非対称レイアウト。

**Signature Elements**: 和紙テクスチャ背景、細い罫線、朱色のアクセント

**Interaction Philosophy**: スムーズなスライドイン、タップ時の微細な圧縮アニメーション

**Animation**: フェードイン＋スライドアップ（0.3s ease-out）

**Typography System**: 見出しに Noto Serif JP、本文に Noto Sans JP

</text>
<probability>0.08</probability>
</response>

---

<response>
<text>

## アイデア2: 「駅ホーム案内板」インフォメーションデザイン ← 採用
**Design Movement**: Transportation Information Design × Functional Brutalism

**Core Principles**:
1. 情報の「読み取り速度」を最優先にする（駅の案内板のように）
2. 改札内外などの重要ステータスを大きなバッジで即認識
3. コントラスト比を高く保ち、移動中でも読みやすい
4. カードは「切符」「案内板」のメタファーで設計

**Color Philosophy**:
- 背景: クリーム白 `#FAFAF7`（和紙感）
- プライマリ: 深緑 `#1B4332`（信頼・安心）
- アクセント: 橙 `#E8620A`（緊急性・CTAの強調）
- 改札内バッジ: 深緑背景に白文字
- 改札外バッジ: 橙背景に白文字
- テキスト: チャコール `#1C1C1E`

**Layout Paradigm**:
- モバイルファースト縦スクロール
- 下部固定タブナビ（5タブ）
- カードは「切符スタイル」- 左端に色帯、右に情報
- 保証書セクションは「スタンプ」風デザイン

**Signature Elements**:
1. 切符スタイルカード（左端カラーバー）
2. 改札内外の大型バッジ（緑/橙）
3. 保証書スタンプ風デザイン

**Interaction Philosophy**:
- タップ時に切符を「切る」ような圧縮エフェクト
- スクロール時に保証書セクションが上部固定

**Animation**:
- カード出現: stagger fadeInUp (50ms間隔)
- ページ遷移: slide from right
- バッジ: pulse on first render

**Typography System**:
- 見出し: Noto Sans JP Bold (700)
- 本文: Noto Sans JP Regular (400)
- 数字・価格: tabular-nums

</text>
<probability>0.09</probability>
</response>

---

<response>
<text>

## アイデア3: 「ラグジュアリー百貨店」エレガンス
**Design Movement**: Luxury Department Store × Editorial Magazine

**Core Principles**:
1. 商品の「格」を視覚的に表現する
2. 写真を大きく使い、商品の魅力を前面に
3. ゴールドアクセントで「選ばれた感」を演出

**Color Philosophy**: ディープネイビー背景にゴールドアクセント。高級感と信頼感を両立。

**Layout Paradigm**: 大きなヒーロー画像、グリッドレイアウト

**Signature Elements**: ゴールドライン、セリフ体見出し、大判商品写真

**Interaction Philosophy**: ゆっくりとしたフェード、ホバー時の拡大

**Animation**: 優雅なフェードイン（0.6s）

**Typography System**: 見出しに Playfair Display、本文に Noto Sans JP

</text>
<probability>0.07</probability>
</response>

---

## 採用デザイン: アイデア2「駅ホーム案内板」インフォメーションデザイン

移動中の出張者が素早く情報を読み取れる「駅案内板」スタイルを採用。
改札内外の視認性を最大化し、切符スタイルのカードで直感的なUXを実現する。
